/**
 * Gpu Module - the `gpu/` device asks: a granted GPU device is opened, fed resources and commands, and read back by the host.
 * Handles are sealed values the kernel mints from the plain ids the host answers. Grant: `gpu: { "device:<maxBytes>": [open, compute, render, readback] }`.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, OsGrantNeed, StdOperatorMeta } from '../types.js';
import { arg, osEffect } from './os-common.js';
import { BYTES, INT, NUMBER, STRING, list, lit, mapOf, shape, union } from '../signature.js';

const DEVICE: OperatorTypeRef = 'GpuDevice';
const BUFFER: OperatorTypeRef = 'GpuBuffer';
const TEXTURE: OperatorTypeRef = 'GpuTexture';
const SAMPLER: OperatorTypeRef = 'GpuSampler';
const SHADER: OperatorTypeRef = 'GpuShader';
const PIPELINE: OperatorTypeRef = 'GpuPipeline';
const BIND_GROUP: OperatorTypeRef = 'GpuBindGroup';
const QUERY_SET: OperatorTypeRef = 'GpuQuerySet';
const BORROW: OperatorTypeRef = 'Borrow';

const GPU_FEATURE: OperatorTypeRef = union(lit('timestamp-query'), lit('shader-f16'), lit('float32-filterable'));
const GPU_BUFFER_USAGE: OperatorTypeRef = union(lit('map-read'), lit('map-write'), lit('copy-src'), lit('copy-dst'), lit('index'), lit('vertex'), lit('uniform'), lit('storage'), lit('indirect'), lit('query-resolve'));
const GPU_TEXTURE_USAGE: OperatorTypeRef = union(lit('copy-src'), lit('copy-dst'), lit('texture-binding'), lit('storage-binding'), lit('render-attachment'));
const GPU_FORMAT: OperatorTypeRef = union(lit('r8unorm'), lit('rg8unorm'), lit('rgba8unorm'), lit('rgba8unorm-srgb'), lit('bgra8unorm'), lit('bgra8unorm-srgb'), lit('r16float'), lit('rg16float'), lit('rgba16float'), lit('r32float'), lit('rg32float'), lit('rgba32float'), lit('r32uint'), lit('r32sint'), lit('rgba8uint'), lit('rgba8sint'), lit('rgba32uint'), lit('rgba32sint'), lit('depth32float'));
const GPU_LIMITS: OperatorTypeRef = mapOf(STRING, INT);
const GPU_DEVICE_DESC: OperatorTypeRef = shape({ powerPreference: union(lit('low-power'), lit('high-performance')), features: list(GPU_FEATURE) }, ['powerPreference', 'features']);
const GPU_BUFFER_DESC: OperatorTypeRef = shape({ size: INT, usage: list(GPU_BUFFER_USAGE) });
const GPU_TEXTURE_DESC: OperatorTypeRef = shape({ width: INT, height: INT, depth: INT, format: GPU_FORMAT, usage: list(GPU_TEXTURE_USAGE), mips: INT }, ['depth', 'mips']);
const GPU_SAMPLER_DESC: OperatorTypeRef = shape({ filter: union(lit('nearest'), lit('linear')), address: union(lit('clamp'), lit('repeat'), lit('mirror')) }, ['filter', 'address']);
const GPU_QUERY_DESC: OperatorTypeRef = shape({ count: INT });
const GPU_PIPELINE_DESC: OperatorTypeRef = shape({ kind: union(lit('compute'), lit('render')), shader: SHADER, entry: STRING, fragment: STRING, targets: list(GPU_FORMAT) }, ['fragment', 'targets']);
const GPU_BINDING: OperatorTypeRef = shape({ binding: INT, buffer: BUFFER, texture: TEXTURE, sampler: SAMPLER, offset: INT, size: INT }, ['buffer', 'texture', 'sampler', 'offset', 'size']);
const GPU_RESOURCE: OperatorTypeRef = union(BUFFER, TEXTURE);

const GPU_COMMAND: OperatorTypeRef = union(
  shape({ compute: shape({ pipeline: PIPELINE, bindGroups: list(BIND_GROUP), dispatch: list(INT) }) }),
  shape({ render: shape({ pipeline: PIPELINE, bindGroups: list(BIND_GROUP), target: TEXTURE, vertices: INT, instances: INT, clear: list(NUMBER) }, ['instances', 'clear']) }),
  shape({ copy: shape({ from: GPU_RESOURCE, to: GPU_RESOURCE, fromOffset: INT, toOffset: INT, size: INT }, ['fromOffset', 'toOffset', 'size']) }),
  shape({ clear: shape({ buffer: BUFFER, offset: INT, size: INT }, ['offset', 'size']) }),
  shape({ write: shape({ buffer: BUFFER, texture: TEXTURE, offset: INT, data: union(BYTES, BORROW) }, ['buffer', 'texture', 'offset']) }),
  shape({ read: shape({ buffer: BUFFER, offset: INT, length: INT }, ['offset', 'length']) }),
  shape({ timestamp: shape({ querySet: QUERY_SET, index: INT }) }),
);

const GPU_HANDLE: OperatorTypeRef = union(BUFFER, TEXTURE, SAMPLER, SHADER, PIPELINE, BIND_GROUP, QUERY_SET);

type GpuParam = NonNullable<StdOperatorMeta['params']>[number];

function gpuEffect(def: { answer: OperatorTypeRef; grant?: OsGrantNeed[]; description: string; params: GpuParam[]; example: string }): StdOperatorMeta {
  return {
    ...osEffect({ answer: def.answer, grant: def.grant ?? [], description: def.description, params: def.params, example: def.example }),
    module: 'gpu',
    category: 'std-gpu',
    runsOn: 'any',
  };
}

const DEVICE_ARG = arg('device', DEVICE, 'The open GPU device the object belongs to');
const NO_GRANT = 'Needs no grant beyond holding the handle (the grant was checked at gpu/device-open).';
const FAILS = 'Failure kind: closed (the device or a handle is not live), invalid (a malformed descriptor, an unknown usage or format, a size beyond the granted maxBytes), unsupported (a host without a GPU), io (the device failed).';

export const GPU_OPERATORS: Record<string, StdOperatorMeta> = {
  'gpu/device-open': gpuEffect({
    answer: shape({ device: DEVICE, features: list(GPU_FEATURE), limits: GPU_LIMITS }),
    grant: [{ kind: 'gpu', access: 'open' }],
    description:
      'Open a GPU device (grant gpu: { "device:<maxBytes>": [open] }). powerPreference is "low-power" or "high-performance"; features lists the optional device features to require. Completion is deferred: the host answers when the adapter is ready. Success payload: { device, features, limits } (a sealed GpuDevice handle, the features granted, and the device limits as a map of limit name to integer). Failure kind: denied (no open grant), invalid (an unknown power preference or feature), unsupported (a host without a GPU: no adapter, wasm without WebGPU), io (the adapter or device request failed).',
    params: [arg('desc', GPU_DEVICE_DESC, 'Device request: { powerPreference?, features? }')],
    example: '["gpu/device-open", { "powerPreference": "high-performance" }, { "emit": { "success": "GPU_READY", "failure": "GPU_FAILED" } }]',
  }),
  'gpu/device-close': gpuEffect({
    answer: shape({}),
    description: `Close a GPU device and drop every object created on it; handles of the device are no longer live. ${NO_GRANT} Success payload: {}. Failure kind: closed (the device is not live).`,
    params: [DEVICE_ARG],
    example: '["gpu/device-close", "@entity.device", { "emit": { "failure": "GPU_FAILED" } }]',
  }),
  'gpu/buffer-create': gpuEffect({
    answer: shape({ buffer: BUFFER }),
    description: `Create a buffer of size bytes; usage lists the buffer usages ("map-read", "map-write", "copy-src", "copy-dst", "index", "vertex", "uniform", "storage", "indirect", "query-resolve"). The size counts against the maxBytes of the device grant. ${NO_GRANT} Success payload: { buffer } (a sealed GpuBuffer handle). ${FAILS}`,
    params: [DEVICE_ARG, arg('desc', GPU_BUFFER_DESC, 'Buffer descriptor: { size, usage }')],
    example: '["gpu/buffer-create", "@entity.device", { "size": 4096, "usage": ["storage", "copy-src", "copy-dst"] }, { "emit": { "success": "BUFFER_READY", "failure": "GPU_FAILED" } }]',
  }),
  'gpu/texture-create': gpuEffect({
    answer: shape({ texture: TEXTURE }),
    description: `Create a texture of width by height texels (depth defaults to 1, mips to 1) in the given format (for example "rgba8unorm"); usage lists the texture usages ("copy-src", "copy-dst", "texture-binding", "storage-binding", "render-attachment"). ${NO_GRANT} Success payload: { texture } (a sealed GpuTexture handle). ${FAILS}`,
    params: [DEVICE_ARG, arg('desc', GPU_TEXTURE_DESC, 'Texture descriptor: { width, height, depth?, format, usage, mips? }')],
    example: '["gpu/texture-create", "@entity.device", { "width": 256, "height": 256, "format": "rgba8unorm", "usage": ["render-attachment", "copy-src"] }, { "emit": { "success": "TEXTURE_READY", "failure": "GPU_FAILED" } }]',
  }),
  'gpu/sampler-create': gpuEffect({
    answer: shape({ sampler: SAMPLER }),
    description: `Create a sampler; filter is "nearest" or "linear", address is "clamp", "repeat" or "mirror". ${NO_GRANT} Success payload: { sampler } (a sealed GpuSampler handle). ${FAILS}`,
    params: [DEVICE_ARG, arg('desc', GPU_SAMPLER_DESC, 'Sampler descriptor: { filter?, address? }')],
    example: '["gpu/sampler-create", "@entity.device", { "filter": "linear", "address": "repeat" }, { "emit": { "success": "SAMPLER_READY", "failure": "GPU_FAILED" } }]',
  }),
  'gpu/query-create': gpuEffect({
    answer: shape({ querySet: QUERY_SET }),
    description: `Create a timestamp query set of count slots; a gpu/submit timestamp command writes one slot. ${NO_GRANT} Success payload: { querySet } (a sealed GpuQuerySet handle). ${FAILS}`,
    params: [DEVICE_ARG, arg('desc', GPU_QUERY_DESC, 'Query set descriptor: { count }')],
    example: '["gpu/query-create", "@entity.device", { "count": 2 }, { "emit": { "success": "QUERY_READY", "failure": "GPU_FAILED" } }]',
  }),
  'gpu/shader-create': gpuEffect({
    answer: shape({ shader: SHADER }),
    description: `Compile a WGSL shader module from source text. ${NO_GRANT} Success payload: { shader } (a sealed GpuShader handle). Failure kind: closed (the device is not live), invalid (the WGSL does not compile; the error carries the compiler message), unsupported (a host without a GPU), io (the device failed).`,
    params: [DEVICE_ARG, arg('wgsl', STRING, 'WGSL source text of the module')],
    example: '["gpu/shader-create", "@entity.device", "@entity.wgsl", { "emit": { "success": "SHADER_READY", "failure": "GPU_FAILED" } }]',
  }),
  'gpu/pipeline-create': gpuEffect({
    answer: shape({ pipeline: PIPELINE }),
    description: `Create a pipeline from a shader module. kind is "compute" or "render"; entry names the entry point (the vertex entry for a render pipeline); fragment names the fragment entry and targets lists the color target formats of a render pipeline. ${NO_GRANT} Success payload: { pipeline } (a sealed GpuPipeline handle whose kind field is the pipeline kind). ${FAILS}`,
    params: [DEVICE_ARG, arg('desc', GPU_PIPELINE_DESC, 'Pipeline descriptor: { kind, shader, entry, fragment?, targets? }')],
    example: '["gpu/pipeline-create", "@entity.device", { "kind": "compute", "shader": "@entity.shader", "entry": "main" }, { "emit": { "success": "PIPELINE_READY", "failure": "GPU_FAILED" } }]',
  }),
  'gpu/bind-group-create': gpuEffect({
    answer: shape({ bindGroup: BIND_GROUP }),
    description: `Bind resources to bind group number group of a pipeline. Each entry is { binding, buffer?, texture?, sampler?, offset?, size? } with exactly one of buffer, texture or sampler; offset and size select a range of a buffer. ${NO_GRANT} Success payload: { bindGroup } (a sealed GpuBindGroup handle). ${FAILS}`,
    params: [
      arg('pipeline', PIPELINE, 'The pipeline whose layout the group follows'),
      arg('group', INT, 'The bind group index in the pipeline layout'),
      arg('entries', list(GPU_BINDING), 'The bindings: { binding, buffer?, texture?, sampler?, offset?, size? }'),
    ],
    example: '["gpu/bind-group-create", "@entity.pipeline", 0, [{ "binding": 0, "buffer": "@entity.buffer" }], { "emit": { "success": "BINDGROUP_READY", "failure": "GPU_FAILED" } }]',
  }),
  'gpu/submit': gpuEffect({
    answer: shape({ reads: list(BYTES) }),
    grant: [{ kind: 'gpu', access: 'compute', commands: 1 }],
    description:
      'Run a command list on the device queue, in list order, as one job (grant gpu: { "device:<maxBytes>": [compute, render, readback] }). commands is a list of GpuCommand records, each with exactly one key: write { buffer, offset?, data } or write { texture, data } uploads bytes or a Borrow (the kernel reads the borrowed block) into a copy-dst buffer at offset (default 0) or into a whole copy-dst texture; compute { pipeline, bindGroups, dispatch } (dispatch is [x, y, z] workgroup counts); render { pipeline, bindGroups, target, vertices, instances?, clear? } (target is a GpuTexture, clear is an rgba list); copy { from, to, fromOffset?, toOffset?, size? } between buffers or textures; clear { buffer, offset?, size? }; timestamp { querySet, index }; read { buffer, offset?, length? } reads length bytes (default the rest of the buffer) at offset (default 0) of a copy-src buffer as they stand at that point of the list, or of a map-read buffer as it stands after the list when no later command writes it. Buffer offsets and lengths of write and read are multiples of 4. The grant is derived from a literal list: each compute entry needs compute, each render entry needs render, each read entry needs readback, other entries need nothing; a list that is not literal is checked at run time. Completion is deferred: the success event fires when the queue work is done. Success payload: { reads } (the bytes of each read entry, in list order; empty without one). Failure kind: denied (a command needs a kind the grant does not list), closed (the device, a handle or a Borrow is not live), invalid (a command with zero or several keys, a handle of another device, a bad dispatch, a write or read past its buffer or off a multiple of 4, a texture write that is not the whole texture, a buffer without the usage its command needs), io (the device failed).',
    params: [DEVICE_ARG, arg('commands', list(GPU_COMMAND), 'The commands, each a record with exactly one of write, compute, render, copy, clear, timestamp, read')],
    example: '["gpu/submit", "@entity.device", [{ "write": { "buffer": "@entity.input", "data": "@payload.data" } }, { "compute": { "pipeline": "@entity.pipeline", "bindGroups": ["@entity.bindGroup"], "dispatch": [64, 1, 1] } }, { "read": { "buffer": "@entity.output" } }], { "emit": { "success": "SUBMITTED", "failure": "GPU_FAILED" } }]',
  }),
  'gpu/release': gpuEffect({
    answer: shape({}),
    description: `Release a GPU object (buffer, texture, sampler, shader, pipeline, bind group or query set) so the device frees it; a device is closed with gpu/device-close. ${NO_GRANT} Success payload: {}. Failure kind: closed (the handle is not live or already released).`,
    params: [arg('handle', GPU_HANDLE, 'Any GPU handle except a device')],
    example: '["gpu/release", "@entity.buffer", { "emit": { "failure": "GPU_FAILED" } }]',
  }),
};
