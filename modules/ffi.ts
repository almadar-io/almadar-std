/**
 * Ffi Module - the `ffi/` foreign-function call (EXEC-METAL-2): a granted C symbol of a granted library is called by the native host
 * with the signature the grant states. Grant: `ffi: { "<library>": { "<symbol>": "<C signature>" } }`.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';
import { arg, osEffect } from './os-common.js';
import { BYTES, INT, NUMBER, STRING, list, lit, shape, union } from '../signature.js';

const BORROW: OperatorTypeRef = 'Borrow';

const FFI_ARG: OperatorTypeRef = union(INT, NUMBER, BORROW);

export const FFI_OPERATORS: Record<string, StdOperatorMeta> = {
  'ffi/call': {
    ...osEffect({
      answer: shape({ value: union(INT, NUMBER, lit(null)), buffers: list(BYTES) }),
      grant: [{ kind: 'ffi', library: 0, symbol: 1 }],
      description:
        'Call a C function of a native library (grant ffi: { "<library>": { "<symbol>": "<C signature>" } }). The library string is passed to dlopen verbatim: the program states the exact path or soname, nothing is guessed per platform. The granted signature is closed: "(" [type ("," type)*] ") -> " ret, type one of i8 i16 i32 i64 u8 u16 u32 u64 f32 f64 ptr mutptr, ret a scalar type or void (no pointer returns), at most 8 parameters. args is a list with one entry per granted parameter: an int or number for a numeric type (an integer must be exact and in range for its C type; f32 and f64 accept int or number), a Borrow handle for ptr (any live borrow, passed read-only) or mutptr (an exclusive borrow whose bytes the call may write). The kernel reads the borrowed block, sends the bytes with the call, and after the answer writes each mutptr buffer back into its block like mem/write, committed with the step; the host never holds kernel memory (EXEC-BOUND-2, EXEC-METAL-2). Success payload: { value, buffers } (value is an int for an integer return, a number for f32 and f64, null for void; buffers is one bytes per mutptr parameter in order, the bytes after the call). Failure kind: denied (the library and symbol are not granted), invalid (args do not match the granted signature, a bad or non-exclusive borrow, an out-of-range integer), not-found (the library or symbol cannot be loaded), unsupported (a host without native ffi: wasm, browser, node, mobile, seL4).',
      params: [
        arg('library', STRING, 'The library path or soname, passed to dlopen verbatim; must match a granted library'),
        arg('symbol', STRING, 'The C symbol to call; must be granted for the library'),
        arg('args', list(FFI_ARG), 'One argument per granted parameter: int or number for numeric types, a Borrow for ptr and mutptr'),
      ],
      example: '["ffi/call", "/usr/lib/libSystem.B.dylib", "cos", [0.5], { "emit": { "success": "COS_DONE", "failure": "FFI_FAILED" } }]',
    }),
    module: 'ffi',
    category: 'std-ffi',
  },
};
