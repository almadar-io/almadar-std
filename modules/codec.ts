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
import { BOOLEAN, BYTES, NUMBER, STRING, shape, lit, nullable, union } from '../signature.js';

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
    failable: {},
    returnType: nullable('string'),
    params: [{ name: 's', type: STRING, description: 'The base64 text' }],
    example: '["base64/decode", "Zm9vYmFy"] // => "foobar"',
  },
  'base64/valid': {
    module: 'base64',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: 'True iff base64/decode would succeed on the string (standard base64 decoding to valid UTF-8); null is false',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [{ name: 's', type: STRING, description: 'The base64 text to check' }],
    example: '["base64/valid", "Zm9vYmFy"] // => true',
  },
};

export const HASH_OPERATORS: Record<string, StdOperatorMeta> = {
  'hash/sha256': {
    module: 'hash',
    category: 'std-codec',
    minArity: 2,
    maxArity: 3,
    description:
      'SHA-256 digest (FIPS 180-2) as lower-case hex or standard base64. Input "text" (the default) hashes a string\'s UTF-8 bytes; "bytes" hashes a bytes value (standard padded base64, decoded once, as hash/md5 reads it). Invalid base64 or another input kind fails with kind invalid',
    hasSideEffects: false,
    failable: {},
    returnType: nullable('string'),
    params: [
      { name: 'data', type: union(STRING, BYTES), description: 'The string to hash, or a bytes value when input is "bytes"' },
      { name: 'encoding', type: DIGEST_ENCODING, description: 'Digest encoding: "hex" or "base64"' },
      { name: 'input', type: union(lit('text'), lit('bytes')), description: 'Input kind: "text" (default) or "bytes"', optional: true, defaultValue: 'text' },
    ],
    example: '["hash/sha256", "abc", "hex"] // => "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"',
  },
  'hash/md5': {
    module: 'hash',
    category: 'std-codec',
    minArity: 2,
    maxArity: 2,
    description: 'MD5 digest of binary data given as standard padded base64 (decoded once, hashed as bytes), as lower-case hex or standard base64 (RFC 1321)',
    hasSideEffects: false,
    failable: {},
    returnType: nullable('string'),
    params: [
      { name: 'bytes', type: STRING, description: 'The data as standard padded base64 (RFC 4648)' },
      { name: 'encoding', type: DIGEST_ENCODING, description: 'Digest encoding: "hex" or "base64"' },
    ],
    example: '["hash/md5", "YWJj", "hex"] // => "900150983cd24fb0d6963f7d28e17f72"',
  },
  'hash/scrypt': {
    module: 'hash',
    category: 'std-codec',
    minArity: 2,
    maxArity: 2,
    description:
      'scrypt (RFC 7914) of a string (its UTF-8 bytes) at the cost @almadar/auth hashes api keys with (N 16384, r 8, p 1, 32 bytes), as lower-case hex. The salt argument is a credential slot: a secret-typed @config knob naming the credential that holds the hex salt. The kernel resolves its value into the evaluation, so the program never receives it; the result is null when the credential is not held or is not non-empty hex. Runs only in the kernel.',
    hasSideEffects: false,
    returnType: nullable(STRING),
    params: [
      { name: 's', type: STRING, description: 'The string to hash' },
      { name: 'salt', type: STRING, description: 'A secret-typed @config knob naming the credential that holds the hex salt' },
    ],
    example: '["hash/scrypt", "sk_live_", "@config.salt"] // => "010bbcf1a211930bca10afa35c740b1c70dcb058711e165c9918f1137c97b940" when the salt credential holds 00112233445566778899',
  },
  'hash/pbkdf2': {
    module: 'hash',
    category: 'std-codec',
    minArity: 4,
    maxArity: 4,
    description: 'PBKDF2 with HMAC-SHA256 (RFC 8018) over bytes, answering length derived bytes (a bytes value is a standard padded base64 string at run time). Iterations and length are whole numbers from 1; anything else fails with kind invalid',
    hasSideEffects: false,
    failable: {},
    returnType: nullable(BYTES),
    params: [
      { name: 'password', type: BYTES, description: 'The password bytes' },
      { name: 'salt', type: BYTES, description: 'The salt bytes' },
      { name: 'iterations', type: NUMBER, description: 'Round count, at least 1' },
      { name: 'length', type: NUMBER, description: 'Derived key length in bytes, at least 1' },
    ],
    example: '["hash/pbkdf2", "cGFzc3dvcmQ=", "c2FsdA==", 1, 32] // => "Eg+2z/z4syxD5yJSVsT4N6hlSMkszDVICAWYfLcL4Xs="',
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

const BYTES_LIMIT: NonNullable<StdOperatorMeta['params']>[number] = {
  name: 'maxBytes',
  type: NUMBER,
  description: 'The largest output accepted, in bytes; a larger output fails with kind invalid (the decompression-bomb guard)',
};

const CODEC_CODE = union(...['magic', 'method', 'flags', 'header-crc', 'truncated', 'block', 'crc', 'size', 'trailing', 'output-limit'].map(lit));
const CODEC_RESULT = shape({ ok: BOOLEAN, data: nullable(BYTES), crc: nullable(NUMBER), code: nullable(CODEC_CODE) });
const CODEC_RETURN = union(BYTES, CODEC_RESULT);
const RESULT_OPTIONS = { name: 'options', type: shape({ result: BOOLEAN }, ['result']), optional: true, description: 'With result: true, return { ok, data, crc, code }; failures are closed codec codes, never error text' };

export const GZIP_OPERATORS: Record<string, StdOperatorMeta> = {
  'gzip/compress': {
    module: 'gzip',
    category: 'std-codec',
    minArity: 1,
    maxArity: 2,
    description: 'gzip (RFC 1952) of bytes at the default level, through the flate2 crate (a bytes value is a standard padded base64 string at run time)',
    hasSideEffects: false,
    failable: {},
    returnType: nullable(CODEC_RETURN),
    returnSemantics: 'option-branch<1,result>',
    params: [{ name: 'data', type: BYTES, description: 'The bytes to compress' }, { name: 'options', type: shape({ result: BOOLEAN, level: NUMBER }, ['result', 'level']), optional: true, description: 'level 0–9 (default 6); result: true returns CodecResult' }],
    example: '["gzip/compress", "aGVsbG8="] // => gzip bytes',
  },
  'gzip/decompress': {
    module: 'gzip',
    category: 'std-codec',
    minArity: 2,
    maxArity: 3,
    description: 'Decompress every gzip member (as gzip -d reads them), through the flate2 crate. An output past maxBytes, corrupt input or a maxBytes that is not a whole number from 0 fails with kind invalid',
    hasSideEffects: false,
    failable: {},
    returnType: nullable(CODEC_RETURN),
    returnSemantics: 'option-branch<2,result>',
    params: [{ name: 'data', type: BYTES, description: 'The gzip bytes' }, BYTES_LIMIT, RESULT_OPTIONS],
    example: '["gzip/decompress", "H4sIAAAAAAAAA8tIzcnJV8hAkACAiPnlEQAAAA==", 1024] // => "aGVsbG8gaGVsbG8gaGVsbG8="',
  },
};

export const BROTLI_OPERATORS: Record<string, StdOperatorMeta> = {
  'brotli/compress': {
    module: 'brotli',
    category: 'std-codec',
    minArity: 1,
    maxArity: 2,
    description: 'brotli (RFC 7932) of bytes at the brotli CLI defaults (quality 11, window 22), through the brotli crate (a bytes value is a standard padded base64 string at run time)',
    hasSideEffects: false,
    failable: {},
    returnType: nullable(CODEC_RETURN),
    returnSemantics: 'option-branch<1,result>',
    params: [{ name: 'data', type: BYTES, description: 'The bytes to compress' }, { name: 'options', type: shape({ result: BOOLEAN, quality: NUMBER, window: NUMBER }, ['result', 'quality', 'window']), optional: true, description: 'quality 0–11 (default 11), window 10–24 (default 22); result: true returns CodecResult' }],
    example: '["brotli/compress", "aGVsbG8="] // => brotli bytes',
  },
  'brotli/decompress': {
    module: 'brotli',
    category: 'std-codec',
    minArity: 2,
    maxArity: 3,
    description: 'Decompress one brotli stream through the brotli crate. An output past maxBytes, corrupt input or a maxBytes that is not a whole number from 0 fails with kind invalid',
    hasSideEffects: false,
    failable: {},
    returnType: nullable(CODEC_RETURN),
    returnSemantics: 'option-branch<2,result>',
    params: [{ name: 'data', type: BYTES, description: 'The brotli bytes' }, BYTES_LIMIT, RESULT_OPTIONS],
    example: '["brotli/decompress", "HxAA+I2Ubt5EVYaWbCBvAU8cYBw=", 1024] // => "aGVsbG8gaGVsbG8gaGVsbG8="',
  },
};
