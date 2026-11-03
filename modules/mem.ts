/**
 * Mem Module - the `mem/` kernel-owned memory asks (EXEC-METAL-1..4): arenas, blocks and borrows are sealed handles the
 * kernel holds, so no host is asked. Grant: `mem: { "arena:<maxBytes>": [create, free] }`.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, OsGrantNeed, StdOperatorMeta } from '../types.js';
import { arg, osEffect } from './os-common.js';
import { BOOLEAN, BYTES, ENDIAN, INT, STRING, UINT_WIDTH, lit, shape, union } from '../signature.js';

const ARENA: OperatorTypeRef = 'Arena';
const BLOCK: OperatorTypeRef = 'Block';
const BORROW: OperatorTypeRef = 'Borrow';

type MemParam = NonNullable<StdOperatorMeta['params']>[number];

function memEffect(def: { answer: OperatorTypeRef; grant?: OsGrantNeed[]; description: string; params: MemParam[]; example: string }): StdOperatorMeta {
  return {
    ...osEffect({ answer: def.answer, grant: def.grant ?? [], description: def.description, params: def.params, example: def.example }),
    module: 'mem',
    category: 'std-mem',
    runsOn: 'any',
    host: 'kernel',
  };
}

function memPure(def: { description: string; params: MemParam[]; returnType: OperatorTypeRef; example: string }): StdOperatorMeta {
  return {
    module: 'mem',
    category: 'std-mem-read',
    minArity: def.params.length,
    maxArity: def.params.length,
    description: def.description,
    hasSideEffects: false,
    returnType: def.returnType,
    params: def.params,
    example: def.example,
  };
}

const ATOMIC: OsGrantNeed[] = [{ kind: 'mem', access: 'atomic' }];

export const MEM_OPERATORS: Record<string, StdOperatorMeta> = {
  'mem/arena-new': memEffect({
    answer: shape({ arena: ARENA }),
    grant: [{ kind: 'mem', access: 'create', capacity: 1, arenaKind: 0 }],
    description: 'Create an arena of capacity bytes (grant mem: { "arena:<maxBytes>": [create] }; capacity must not exceed the granted maxBytes). kind is "bump" (blocks are freed only with the arena), "stack" (the newest block is freed first) or "shared" (blocks can be frozen and read by other kernels, and hold atomic cells; needs a grant target "shared:<maxBytes>" with [create] for the arena and [atomic] for the atomic ops). The kernel owns the arena and answers without asking a host (EXEC-METAL-1). Success payload: { arena } (a sealed Arena handle). A shared arena handed to a guest through program/dispatch arrives in the guest as an Arena whose optional blocks field lists the committed blocks of the owner, in the order the owner made them; the guest reaches them only as frozen blocks or through mem/atomic-* (EXEC-CONC-7). Failure kind: invalid (kind is not "bump", "stack" or "shared", non-positive capacity), denied (no grant).',
    params: [arg('kind', union(lit('bump'), lit('stack'), lit('shared')), 'Arena discipline: "bump", "stack" or "shared"'), arg('capacity', INT, 'Arena size in bytes; positive and within the granted maxBytes')],
    example: '["mem/arena-new", "bump", 4096, { "emit": { "success": "ARENA_READY", "failure": "MEM_FAILED" } }]',
  }),
  'mem/arena-drop': memEffect({
    answer: shape({}),
    grant: [{ kind: 'mem', access: 'free' }],
    description: 'Drop an arena and every block in it (grant mem: { "arena:<maxBytes>": [free] }). Success payload: {}. Failure kind: closed (the arena is not live), borrowed (a block of the arena still has a live borrow), denied (no grant).',
    params: [arg('arena', ARENA, 'The arena handle to drop')],
    example: '["mem/arena-drop", "@entity.arena", { "emit": { "failure": "MEM_FAILED" } }]',
  }),
  'mem/alloc': memEffect({
    answer: shape({ block: BLOCK }),
    description: 'Allocate length bytes aligned to align inside an arena. The block is zero-filled and belongs to the arena until freed or the arena drops (EXEC-METAL-2). Success payload: { block } (a sealed Block handle). Failure kind: closed (the arena is not live), invalid (non-positive length, align not a power of two, no room left in the arena).',
    params: [arg('arena', ARENA, 'The arena to allocate from'), arg('length', INT, 'Block size in bytes; positive'), arg('align', INT, 'Alignment in bytes; a power of two')],
    example: '["mem/alloc", "@entity.arena", 256, 8, { "emit": { "success": "BLOCK_READY", "failure": "MEM_FAILED" } }]',
  }),
  'mem/free': memEffect({
    answer: shape({}),
    description: 'Free a block. In a stack arena only the newest live block may be freed; in a bump arena the space returns with the arena. Success payload: {}. Failure kind: closed (the block is not live), borrowed (the block has a live borrow), invalid (a stack arena block that is not the newest).',
    params: [arg('block', BLOCK, 'The block handle to free')],
    example: '["mem/free", "@entity.block", { "emit": { "failure": "MEM_FAILED" } }]',
  }),
  'mem/borrow': memEffect({
    answer: shape({ borrow: BORROW }),
    description: 'Borrow a block, "shared" (any number, read only) or "exclusive" (one, read and write); the kernel refuses a conflicting borrow instead of aliasing (EXEC-METAL-3). Success payload: { borrow } (a sealed Borrow handle). Failure kind: closed (the block is not live), borrowed (a conflicting borrow is live), invalid (mode is neither "shared" nor "exclusive").',
    params: [arg('block', BLOCK, 'The block handle to borrow'), arg('mode', union(lit('shared'), lit('exclusive')), 'Borrow mode: "shared" or "exclusive"')],
    example: '["mem/borrow", "@entity.block", "exclusive", { "emit": { "success": "BORROWED", "failure": "MEM_FAILED" } }]',
  }),
  'mem/release': memEffect({
    answer: shape({}),
    description: 'Release a borrow so the block can be borrowed differently or freed. Success payload: {}. Failure kind: closed (the borrow is not live or already released).',
    params: [arg('borrow', BORROW, 'The borrow handle to release')],
    example: '["mem/release", "@entity.borrow", { "emit": { "failure": "MEM_FAILED" } }]',
  }),
  'mem/write': memEffect({
    answer: shape({}),
    description: 'Write data into the borrowed block at offset. Needs an exclusive borrow; the write must lie wholly inside the block. Success payload: {}. Failure kind: closed (the borrow is not live), borrowed (the borrow is shared), invalid (offset below zero or the write runs past the block).',
    params: [arg('borrow', BORROW, 'An exclusive borrow of the block'), arg('offset', INT, 'Byte offset inside the block'), arg('data', BYTES, 'Bytes to write')],
    example: '["mem/write", "@entity.borrow", 0, "@payload.data", { "emit": { "failure": "MEM_FAILED" } }]',
  }),
  'mem/freeze': memEffect({
    answer: shape({}),
    grant: [],
    description: 'Freeze a block of a shared arena: it becomes read-only and may then be read by other kernels (a block must be frozen before a guest kernel can read it). Needs no grant beyond holding the handle. Success payload: {}. Failure kind: closed (the block is not live), borrowed (the block has a live borrow), invalid (the block is not in a shared arena).',
    params: [arg('block', BLOCK, 'The block handle to freeze')],
    example: '["mem/freeze", "@entity.block", { "emit": { "failure": "MEM_FAILED" } }]',
  }),
  'mem/atomic-load': memEffect({
    answer: shape({ value: INT }),
    grant: ATOMIC,
    description: 'Atomically load the 8-byte aligned signed integer cell at offset of a shared-arena block (grant mem: { "shared:<maxBytes>": [atomic] }). The answer is journaled, so replay returns the recorded value and never re-executes. Success payload: { value }. Failure kind: closed (the block is not live), invalid (the block is not in a shared arena, offset not 8-byte aligned or outside the block), denied (no grant).',
    params: [arg('block', BLOCK, 'A block of a shared arena'), arg('offset', INT, 'Byte offset of the cell; a multiple of 8')],
    example: '["mem/atomic-load", "@entity.block", 0, { "emit": { "success": "LOADED", "failure": "MEM_FAILED" } }]',
  }),
  'mem/atomic-store': memEffect({
    answer: shape({}),
    grant: ATOMIC,
    description: 'Atomically store value into the 8-byte aligned signed integer cell at offset of a shared-arena block (grant mem: { "shared:<maxBytes>": [atomic] }). Journaled. Success payload: {}. Failure kind: closed (the block is not live), invalid (the block is not in a shared arena, offset not 8-byte aligned or outside the block, the block is frozen), denied (no grant).',
    params: [arg('block', BLOCK, 'A block of a shared arena'), arg('offset', INT, 'Byte offset of the cell; a multiple of 8'), arg('value', INT, 'The value to store')],
    example: '["mem/atomic-store", "@entity.block", 0, 1, { "emit": { "failure": "MEM_FAILED" } }]',
  }),
  'mem/atomic-add': memEffect({
    answer: shape({ value: INT }),
    grant: ATOMIC,
    description: 'Atomically add delta to the 8-byte aligned signed integer cell at offset of a shared-arena block and answer the new value (grant mem: { "shared:<maxBytes>": [atomic] }). Journaled. Success payload: { value } (the new value). Failure kind: closed (the block is not live), invalid (the block is not in a shared arena, offset not 8-byte aligned or outside the block, the block is frozen), denied (no grant).',
    params: [arg('block', BLOCK, 'A block of a shared arena'), arg('offset', INT, 'Byte offset of the cell; a multiple of 8'), arg('delta', INT, 'The amount to add; may be negative')],
    example: '["mem/atomic-add", "@entity.block", 0, 1, { "emit": { "success": "ADDED", "failure": "MEM_FAILED" } }]',
  }),
  'mem/atomic-cas': memEffect({
    answer: shape({ value: INT, swapped: BOOLEAN }),
    grant: ATOMIC,
    description: 'Atomic compare-and-swap on the 8-byte aligned signed integer cell at offset of a shared-arena block: when the cell equals expected it becomes new (grant mem: { "shared:<maxBytes>": [atomic] }). Journaled. Success payload: { value, swapped } (value is the cell content after the call, swapped says whether it changed). Failure kind: closed (the block is not live), invalid (the block is not in a shared arena, offset not 8-byte aligned or outside the block, the block is frozen), denied (no grant).',
    params: [arg('block', BLOCK, 'A block of a shared arena'), arg('offset', INT, 'Byte offset of the cell; a multiple of 8'), arg('expected', INT, 'The value the cell must hold for the swap to happen'), arg('new', INT, 'The value to store when the cell equals expected')],
    example: '["mem/atomic-cas", "@entity.block", 0, 0, 1, { "emit": { "success": "CAS_DONE", "failure": "MEM_FAILED" } }]',
  }),
  'mem/read': memPure({
    description: 'Read length bytes at offset from a live borrow (shared or exclusive) and answer bytes. A closed borrow or a range outside the block is an evaluation error (EXEC-METAL-3).',
    params: [arg('borrow', BORROW, 'A live borrow of the block'), arg('offset', INT, 'Byte offset inside the block'), arg('length', INT, 'Number of bytes to read')],
    returnType: BYTES,
    example: '["mem/read", "@entity.borrow", 0, 16] // => bytes',
  }),
  'mem/read-uint': memPure({
    description: 'Read an unsigned integer of width bytes (1, 2, 4 or 8) at offset from a live borrow; endian is "be" (big-endian) or "le" (little-endian). A closed borrow, a range outside the block or a bad width is an evaluation error.',
    params: [arg('borrow', BORROW, 'A live borrow of the block'), arg('offset', INT, 'Byte offset inside the block'), arg('width', UINT_WIDTH, 'Integer width in bytes: 1, 2, 4 or 8'), arg('endian', ENDIAN, 'Byte order: "be" or "le"')],
    returnType: INT,
    example: '["mem/read-uint", "@entity.borrow", 0, 4, "le"] // => int',
  }),
  'mem/read-int': memPure({
    description: 'Read a signed (two complement) integer of width bytes (1, 2, 4 or 8) at offset from a live borrow, sign-extended from its top bit; endian is "be" (big-endian) or "le" (little-endian). A closed borrow, a range outside the block or a bad width is an evaluation error.',
    params: [arg('borrow', BORROW, 'A live borrow of the block'), arg('offset', INT, 'Byte offset inside the block'), arg('width', UINT_WIDTH, 'Integer width in bytes: 1, 2, 4 or 8'), arg('endian', ENDIAN, 'Byte order: "be" or "le"')],
    returnType: INT,
    example: '["mem/read-int", "@entity.borrow", 0, 2, "le"] // => int',
  }),
  'mem/length': memPure({
    description: 'The length in bytes of a Block, or of the block a Borrow covers. A handle that is not live is an evaluation error.',
    params: [arg('handle', union(BLOCK, BORROW), 'A Block or Borrow handle')],
    returnType: INT,
    example: '["mem/length", "@entity.block"] // => int',
  }),
};
