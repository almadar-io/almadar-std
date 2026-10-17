/**
 * Bytes Module - pure operators over binary values
 *
 * A `bytes` value is a standard padded base64 string (RFC 4648) at run time.
 * String operators must not be applied to it; use these. `os/` reads always
 * return bytes, text is recovered with `bytes/to-string`.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { BOOLEAN, BYTES, NUMBER, STRING, list, nullable } from '../signature.js';

const REPRESENTATION = 'A bytes value is a standard padded base64 string at run time.';

export const BYTES_OPERATORS: Record<string, StdOperatorMeta> = {
  'bytes/from-string': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: `Encode a string as its UTF-8 bytes. ${REPRESENTATION}`,
    hasSideEffects: false,
    returnType: BYTES,
    params: [{ name: 's', type: STRING, description: 'The text to encode' }],
    example: '["bytes/from-string", "hello"] // => "aGVsbG8="',
  },
  'bytes/to-string': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: `Decode bytes as UTF-8 text; bytes that are not valid UTF-8 fail with kind invalid. ${REPRESENTATION}`,
    hasSideEffects: false,
    returnType: STRING,
    params: [{ name: 'data', type: BYTES, description: 'The bytes to decode' }],
    example: '["bytes/to-string", "aGVsbG8="] // => "hello"',
  },
  'bytes/length': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: `Number of bytes (not the length of the base64 text). ${REPRESENTATION}`,
    hasSideEffects: false,
    returnType: NUMBER,
    params: [{ name: 'data', type: BYTES, description: 'The bytes to measure' }],
    example: '["bytes/length", "aGVsbG8="] // => 5',
  },
  'bytes/slice': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 2,
    maxArity: 3,
    description: `Bytes from start (inclusive) to end (exclusive, default the length), both counted in bytes. ${REPRESENTATION}`,
    hasSideEffects: false,
    returnType: BYTES,
    params: [
      { name: 'data', type: BYTES, description: 'The bytes to slice' },
      { name: 'start', type: NUMBER, description: 'First byte index' },
      { name: 'end', type: nullable(NUMBER), description: 'Byte index to stop before; null for the end', optional: true },
    ],
    example: '["bytes/slice", "aGVsbG8=", 1, 3] // => "ZWw="',
  },
  'bytes/concat': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: `Join byte values in order into one bytes value. ${REPRESENTATION}`,
    hasSideEffects: false,
    returnType: BYTES,
    params: [{ name: 'parts', type: list(BYTES), description: 'The bytes values to join' }],
    example: '["bytes/concat", ["aGk=", "IQ=="]] // => "aGkh"',
  },
  'bytes/equals': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 2,
    maxArity: 2,
    description: `Whether two bytes values hold the same bytes. ${REPRESENTATION}`,
    hasSideEffects: false,
    returnType: BOOLEAN,
    params: [
      { name: 'a', type: BYTES, description: 'First bytes value' },
      { name: 'b', type: BYTES, description: 'Second bytes value' },
    ],
    example: '["bytes/equals", "aGk=", "aGk="] // => true',
  },
};
