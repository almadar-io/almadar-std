import type { StdOperatorMeta } from '../types.js';
import { BYTES, NUMBER, shape } from '../signature.js';
import { arg, osEffect } from './os-common.js';

export const OS_DEV_OPERATORS: Record<string, StdOperatorMeta> = {
  'os/mmio-read': osEffect({
    answer: shape({ value: 'int' }),
    grant: [{ kind: 'mmio', access: 'read', base: 0, offset: 1, width: 2 }],
    description: 'Read a device register: width bytes at offset into the register window based at base (grant dev: { "mmio:<base>+<length>": [read] }; the window must hold offset + width). Success payload: { value }. A host with no devices answers unsupported.',
    params: [arg('base', NUMBER, 'Base address of the granted register window'), arg('offset', NUMBER, 'Byte offset of the register inside the window'), arg('width', NUMBER, 'Register width in bytes: 1, 2, 4 or 8')],
    example: '["os/mmio-read", 150994944, 24, 4, { "emit": { "success": "FLAGS_READ", "failure": "DEVICE_FAILED" } }]',
  }),
  'os/mmio-write': osEffect({
    answer: shape({}),
    grant: [{ kind: 'mmio', access: 'write', base: 0, offset: 1, width: 2 }],
    description: 'Write a device register: value as width bytes at offset into the register window based at base (grant dev: { "mmio:<base>+<length>": [write] }). Success payload: {}. A host with no devices answers unsupported.',
    params: [arg('base', NUMBER, 'Base address of the granted register window'), arg('offset', NUMBER, 'Byte offset of the register inside the window'), arg('width', NUMBER, 'Register width in bytes: 1, 2, 4 or 8'), arg('value', NUMBER, 'Value to write')],
    example: '["os/mmio-write", 150994944, 0, 1, 65, { "emit": { "failure": "DEVICE_FAILED" } }]',
  }),
  'os/irq-wait': osEffect({
    answer: shape({ irq: 'int' }),
    grant: [{ kind: 'irq', access: 'wait', line: 0 }],
    description: 'Wait for the next interrupt on an irq line (grant dev: { "irq:<line>": [wait] }). A keyed call completes later through its success route, once per call. Success payload: { irq }. A host with no devices answers unsupported.',
    params: [arg('irq', NUMBER, 'Interrupt line')],
    example: '["os/irq-wait", 33, { "key": "uart-rx", "emit": { "success": "RX_IRQ", "failure": "DEVICE_FAILED" } }]',
  }),
  'os/irq-ack': osEffect({
    answer: shape({}),
    grant: [{ kind: 'irq', access: 'ack', line: 0 }],
    description: 'Acknowledge the interrupt last delivered on an irq line so the next one can arrive (grant dev: { "irq:<line>": [ack] }). Success payload: {}. A host with no devices answers unsupported.',
    params: [arg('irq', NUMBER, 'Interrupt line')],
    example: '["os/irq-ack", 33, { "emit": { "failure": "DEVICE_FAILED" } }]',
  }),
  'os/audio-in': {
    ...osEffect({
      answer: shape({ rate: NUMBER, channels: NUMBER }),
      events: shape({ data: BYTES }),
      grant: [],
      stream: true,
      description: 'Open the device microphone and stream what it hears as raw PCM: the first answer is { rate, channels } once the input is open (the rate the device actually runs at), and each frame arrives on the onMessage route as { data }, 16-bit signed little-endian samples, channels interleaved. Encoding (WAV or any codec) is the program\'s, in .lolo. The device asks the person for microphone permission; a refusal answers { error, kind: "denied" }, no input device answers unavailable. cancel-call on the key closes the input.',
      params: [arg('options', shape({ sampleRate: NUMBER, channels: NUMBER }), 'Optional { sampleRate?, channels? }: the rate and channel count asked for (16000 and 1 when unset); the first answer names what the device gave', true)],
      example: '["os/audio-in", { "sampleRate": 16000, "channels": 1 }, { "key": "mic", "emit": { "success": "MIC_OPEN", "failure": "MIC_FAILED", "onMessage": "MIC_FRAME" } }]',
    }),
    runsOn: 'client',
  },
};
