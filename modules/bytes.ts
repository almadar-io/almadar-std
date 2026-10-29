/**
 * Bytes Module - pure operators over binary values
 *
 * A `bytes` value is a standard padded base64 string (RFC 4648) at run time.
 * String operators must not be applied to it; use these. `os/` reads always
 * return bytes, text is recovered with `bytes/to-string`.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';
import { BOOLEAN, BYTES, NUMBER, STRING, lit, list, nullable, union } from '../signature.js';

const REPRESENTATION = 'A bytes value is a standard padded base64 string at run time.';
const UINT_WIDTH: OperatorTypeRef = union(lit(1), lit(2), lit(4), lit(8));
const ENDIAN: OperatorTypeRef = union(lit('be'), lit('le'));

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
    failable: {},
    returnType: nullable(STRING),
    params: [{ name: 'data', type: BYTES, description: 'The bytes to decode' }],
    example: '["bytes/to-string", "aGVsbG8="] // => "hello"',
  },
  'bytes/valid-utf8': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: `Whether the bytes are well-formed UTF-8 text. ${REPRESENTATION}`,
    hasSideEffects: false,
    returnType: BOOLEAN,
    params: [{ name: 'data', type: BYTES, description: 'The bytes to check' }],
    example: '["bytes/valid-utf8", "aGVsbG8="] // => true',
  },
  'bytes/from-base64': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: `The bytes a standard padded base64 text (RFC 4648) encodes, unchanged at run time; other text fails with kind invalid. ${REPRESENTATION}`,
    hasSideEffects: false,
    failable: {},
    returnType: nullable(BYTES),
    params: [{ name: 's', type: STRING, description: 'Standard padded base64 text' }],
    example: '["bytes/from-base64", "aGVsbG8="] // => "aGVsbG8="',
  },
  'bytes/to-base64': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: `The standard padded base64 text (RFC 4648) of bytes, unchanged at run time. ${REPRESENTATION}`,
    hasSideEffects: false,
    returnType: STRING,
    params: [{ name: 'data', type: BYTES, description: 'The bytes to spell as base64 text' }],
    example: '["bytes/to-base64", "aGVsbG8="] // => "aGVsbG8="',
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
  'bytes/index-of': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 2,
    maxArity: 3,
    description: `Byte offset of the first occurrence of needle at or after from (default 0; a negative from counts from the end, out-of-range clamps), or -1 when absent. An empty needle answers from. ${REPRESENTATION}`,
    hasSideEffects: false,
    returnType: NUMBER,
    params: [
      { name: 'data', type: BYTES, description: 'The bytes to search' },
      { name: 'needle', type: BYTES, description: 'The bytes to find' },
      { name: 'from', type: nullable(NUMBER), description: 'Byte index to start at; null for 0', optional: true },
    ],
    example: '["bytes/index-of", "aGVsbG8=", "bA=="] // => 2',
  },
  'bytes/at': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 2,
    maxArity: 2,
    description: `The byte at index i as a number 0-255; null when i is outside the data (negative included). A non-whole index fails with kind invalid. ${REPRESENTATION}`,
    hasSideEffects: false,
    failable: {},
    returnType: nullable(NUMBER),
    params: [
      { name: 'data', type: BYTES, description: 'The bytes to read' },
      { name: 'i', type: NUMBER, description: 'Byte index' },
    ],
    example: '["bytes/at", "AAEC/w==", 3] // => 255',
  },
  'bytes/read-uint': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 4,
    maxArity: 4,
    description: `The unsigned integer stored in width bytes at offset, big-endian (be) or little-endian (le); null when those bytes run past the data. A width-8 value above 2^53 - 1 fails with kind invalid rather than round. ${REPRESENTATION}`,
    hasSideEffects: false,
    failable: {},
    returnType: nullable(NUMBER),
    params: [
      { name: 'data', type: BYTES, description: 'The bytes to read' },
      { name: 'offset', type: NUMBER, description: 'Byte index of the first byte' },
      { name: 'width', type: UINT_WIDTH, description: 'Byte count: 1, 2, 4 or 8' },
      { name: 'endian', type: ENDIAN, description: 'Byte order: "be" or "le"' },
    ],
    example: '["bytes/read-uint", "EjQ=", 0, 2, "be"] // => 4660',
  },
  'bytes/write-uint': {
    module: 'bytes',
    category: 'std-codec',
    minArity: 3,
    maxArity: 3,
    description: `A whole number as width unsigned bytes, big-endian (be) or little-endian (le). A value that is negative, not whole, too large for the width, or above 2^53 - 1 fails with kind invalid. ${REPRESENTATION}`,
    hasSideEffects: false,
    failable: {},
    returnType: nullable(BYTES),
    params: [
      { name: 'value', type: NUMBER, description: 'The unsigned integer to encode' },
      { name: 'width', type: UINT_WIDTH, description: 'Byte count: 1, 2, 4 or 8' },
      { name: 'endian', type: ENDIAN, description: 'Byte order: "be" or "le"' },
    ],
    example: '["bytes/write-uint", 4660, 2, "be"] // => "EjQ="',
  },
};
