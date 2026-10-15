/**
 * Codec Modules - byte codecs and digests
 *
 * Pure operators the `http` effect's programs use to build signed requests
 * (hmac-sha256 `signs` strings, basic-auth values, URL components). The Rust
 * implementation is `orbital_core::codec`; the TS twin is in `@almadar/evaluator`.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';
import { STRING, lit, union } from '../signature.js';

const DIGEST_ENCODING: OperatorTypeRef = union(lit('hex'), lit('base64'));

export const BASE64_OPERATORS: Record<string, StdOperatorMeta> = {
  'base64/encode': {
    module: 'base64',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: 'Encode a string (its UTF-8 bytes) as standard padded base64 (RFC 4648)',
    hasSideEffects: false,
    returnType: 'string',
    params: [{ name: 's', type: STRING, description: 'The string to encode' }],
    example: '["base64/encode", "foobar"] // => "Zm9vYmFy"',
  },
  'base64/decode': {
    module: 'base64',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: 'Decode standard base64 (RFC 4648) to a UTF-8 string; invalid base64 or non-UTF-8 bytes are an evaluation error',
    hasSideEffects: false,
    returnType: 'string',
    params: [{ name: 's', type: STRING, description: 'The base64 text' }],
    example: '["base64/decode", "Zm9vYmFy"] // => "foobar"',
  },
};

export const HASH_OPERATORS: Record<string, StdOperatorMeta> = {
  'hash/sha256': {
    module: 'hash',
    category: 'std-codec',
    minArity: 2,
    maxArity: 2,
    description: 'SHA-256 digest of a string (its UTF-8 bytes), as lower-case hex or standard base64 (FIPS 180-2)',
    hasSideEffects: false,
    returnType: 'string',
    params: [
      { name: 's', type: STRING, description: 'The string to hash' },
      { name: 'encoding', type: DIGEST_ENCODING, description: 'Digest encoding: "hex" or "base64"' },
    ],
    example: '["hash/sha256", "abc", "hex"] // => "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"',
  },
};

export const HMAC_OPERATORS: Record<string, StdOperatorMeta> = {
  'hmac/sha256': {
    module: 'hmac',
    category: 'std-codec',
    minArity: 3,
    maxArity: 3,
    description: 'HMAC-SHA256 of a message under a key (both UTF-8), as lower-case hex or standard base64 (RFC 4231)',
    hasSideEffects: false,
    returnType: 'string',
    params: [
      { name: 'key', type: STRING, description: 'The secret key' },
      { name: 'message', type: STRING, description: 'The message to sign' },
      { name: 'encoding', type: DIGEST_ENCODING, description: 'Digest encoding: "hex" or "base64"' },
    ],
    example: '["hmac/sha256", "Jefe", "what do ya want for nothing?", "hex"] // => "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"',
  },
};
