/**
 * JWS / JWK Modules - signed-token primitives
 *
 * Signature checks (RS256, ES256) and the key documents issuers publish (a JWK Set, a `{kid: certificate PEM}` map).
 * Claim policy (expiry, issuer, audience, tenant) is never here: `std-bearer-verify` states it in `.lolo`. The Rust
 * implementation is `orbital_core_base::jws`.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';
import { NUMBER, STRING, list, lit, mapOf, nullable, shape, union } from '../signature.js';

/** One public signing key; key material is unpadded base64url and `alg` is the key's own, never the token's. */
export const PUBLIC_JWK: OperatorTypeRef = union(
  shape({ kty: lit('RSA'), kid: nullable(STRING), alg: lit('RS256'), n: STRING, e: STRING }),
  shape({ kty: lit('EC'), kid: nullable(STRING), alg: lit('ES256'), crv: lit('P-256'), x: STRING, y: STRING }),
);

export const KEY_SET: OperatorTypeRef = list(PUBLIC_JWK);

const JWS_HEADER: OperatorTypeRef = shape({ alg: STRING, kid: nullable(STRING), typ: nullable(STRING) });

/** The registered claims (RFC 7519 4.1), `null` when absent; every other claim is under `extra`. */
const JWS_CLAIMS: OperatorTypeRef = shape({
  iss: nullable(STRING),
  sub: nullable(STRING),
  aud: nullable(union(STRING, list(STRING))),
  exp: nullable(NUMBER),
  nbf: nullable(NUMBER),
  iat: nullable(NUMBER),
  jti: nullable(STRING),
  extra: mapOf(STRING, 'JsonValue'),
});

const JWS_REFUSAL_REASON: OperatorTypeRef = union(lit('malformed'), lit('algorithm'), lit('unknown-key'), lit('signature'));

const JWS_RESULT: OperatorTypeRef = union(
  shape({ ok: lit(true), header: JWS_HEADER, claims: JWS_CLAIMS, signature: STRING }),
  shape({ ok: lit(false), reason: JWS_REFUSAL_REASON, message: STRING }),
);

export const JWS_OPERATORS: Record<string, StdOperatorMeta> = {
  'jws/verify': {
    module: 'jws',
    category: 'std-codec',
    minArity: 2,
    maxArity: 2,
    description: 'Check the signature of a compact JWS against a KeySet: RS256 or ES256 only, the key chosen by the header kid (every key when it names none), and the header alg must be that key\'s own (none and HMAC algorithms refuse algorithm). Answers {ok: true, header, claims, signature} with the claims typed, or {ok: false, reason, message} with reason malformed, algorithm, unknown-key or signature. Claims are never checked: expiry, issuer and audience are the caller\'s policy',
    hasSideEffects: false,
    returnType: JWS_RESULT,
    params: [
      { name: 'token', type: STRING, description: 'The compact token header.payload.signature' },
      { name: 'keyset', type: KEY_SET, description: 'The issuer keys (jwk/keyset-from-jwks or jwk/keyset-from-x509)' },
    ],
    example: '["jws/verify", "@payload.token", ["jwk/keyset-from-jwks", "@entity.body"]] // => {"ok": true, "header": {"alg": "RS256", "kid": "k-rsa", "typ": null}, "claims": {"sub": "auth0|ada", ...}, "signature": "..."}',
  },
  'jws/decode': {
    module: 'jws',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: 'Read a compact JWS WITHOUT checking its signature (the unsigned alg none token an auth emulator issues): {ok: true, header, claims, signature} with the claims typed, or {ok: false, reason: malformed, message}',
    hasSideEffects: false,
    returnType: JWS_RESULT,
    params: [{ name: 'token', type: STRING, description: 'The compact token' }],
    example: '["jws/decode", "eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1In0."] // => {"ok": true, "header": {"alg": "none", "kid": null, "typ": null}, "claims": {"sub": "u", ...}, "signature": ""}',
  },
};

export const JWK_OPERATORS: Record<string, StdOperatorMeta> = {
  'jwk/keyset-from-jwks': {
    module: 'jwk',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: 'The KeySet of a JWK Set document ({"keys": [...]}): RSA (n, e) and P-256 EC (x, y) keys; a key whose use is not sig, or of another type or curve, is skipped. null when the document is malformed (bad JSON, no keys, missing or invalid key material)',
    hasSideEffects: false,
    returnType: nullable(KEY_SET),
    params: [{ name: 'text', type: STRING, description: 'The JWK Set document text' }],
    example: '["jwk/keyset-from-jwks", "{\\"keys\\":[{\\"kty\\":\\"RSA\\",\\"kid\\":\\"k-rsa\\",\\"n\\":\\"...\\",\\"e\\":\\"AQAB\\"}]}"] // => [{"kty": "RSA", "kid": "k-rsa", "alg": "RS256", "n": "...", "e": "AQAB"}]',
  },
  'jwk/keyset-from-x509': {
    module: 'jwk',
    category: 'std-codec',
    minArity: 1,
    maxArity: 1,
    description: 'The KeySet of a {kid: certificate PEM} document (the Firebase securetoken certificates): each X.509 certificate\'s SubjectPublicKeyInfo read as RSA or P-256. null when the document is malformed (not an object, a non-CERTIFICATE PEM, a key of neither type)',
    hasSideEffects: false,
    returnType: nullable(KEY_SET),
    params: [{ name: 'text', type: STRING, description: 'The certificate map text' }],
    example: '["jwk/keyset-from-x509", "@entity.body"] // => [{"kty": "RSA", "kid": "fb-key-1", "alg": "RS256", "n": "...", "e": "AQAB"}]',
  },
};
