/**
 * Null Operands - the operand positions the kernel raises on when the value is null.
 *
 * The kernel keeps null strict: these operators raise on a null operand rather than read it as a default. The table is
 * pinned to the kernel by the shared fixture `null-operands.json` (orbital-core): the kernel test runs every entry
 * with a null at its position, and this package's test holds this table equal to the fixture. `orb validate` reads the
 * flag (`rejectsNull` on the declared parameter) and refuses a value that can be missing at such a position.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/** Operator name to the zero-based argument positions that raise on null. */
export const NULL_REJECTING_OPERANDS: Readonly<Record<string, readonly number[]>> = {
  'array/append': [0],
  'array/avg': [0, 1],
  'array/cosine': [0, 1],
  'array/drop': [0],
  'array/dropLast': [0],
  'array/every': [0],
  'array/filter': [0],
  'array/find': [0],
  'array/findIndex': [0, 1],
  'array/first': [0],
  'array/flatten': [0],
  'array/groupBy': [0, 1],
  'array/includes': [0],
  'array/indexOf': [0],
  'array/insert': [0],
  'array/last': [0],
  'array/map': [0],
  'array/max': [0, 1],
  'array/min': [0, 1],
  'array/nearest': [0, 1],
  'array/nth': [0],
  'array/partition': [0, 1],
  'array/prepend': [0],
  'array/reduce': [0],
  'array/reject': [0, 1],
  'array/remove': [0],
  'array/removeItem': [0],
  'array/reverse': [0],
  'array/shuffle': [0],
  'array/slice': [0],
  'array/some': [0],
  'array/sort': [0],
  'array/sum': [0, 1],
  'array/take': [0],
  'array/takeLast': [0],
  'array/unique': [0],
  'array/zip': [0, 1],
  'base64/decode': [0],
  'base64/encode': [0],
  'bit/and': [0, 1],
  'bit/not': [0],
  'bit/or': [0, 1],
  'bit/rotl': [0, 1],
  'bit/rotr': [0, 1],
  'bit/shl': [0, 1],
  'bit/shr': [0, 1],
  'bit/xor': [0, 1],
  'bytes/at': [0, 1],
  'bytes/concat': [0],
  'bytes/equals': [0, 1],
  'bytes/from-base64': [0],
  'bytes/from-string': [0],
  'bytes/index-of': [0, 1],
  'bytes/length': [0],
  'bytes/read-uint': [0, 1, 2, 3],
  'bytes/slice': [0],
  'bytes/to-base64': [0],
  'bytes/to-string': [0],
  'bytes/write-uint': [0, 1, 2],
  'hash/md5': [0, 1],
  'hash/pbkdf2': [0, 1, 2, 3],
  'hash/sha256': [0, 1, 2],
  'gzip/compress': [0],
  'gzip/decompress': [0, 1],
  'brotli/compress': [0],
  'brotli/decompress': [0, 1],
  'hmac/sha256': [0, 1, 2],
  'json/valid': [0],
  'object/clone': [0],
  'object/filter': [0],
  'object/fromEntries': [0],
  'object/mapKeys': [0, 1],
  'object/mapValues': [0, 1],
  'object/omit': [0, 1],
  'object/pick': [0, 1],
  'os/path-base': [0],
  'os/path-dir': [0],
  'os/path-ext': [0],
  'os/path-is-absolute': [0],
  'os/path-join': [0, 1, 2],
  'os/path-normalize': [0],
  'os/path-relative': [0, 1],
  'prob/credible-interval': [0],
  'prob/expected-value': [0],
  'prob/histogram': [0],
  'prob/percentile': [0],
  'prob/variance': [0],
  'str/encode-uri-component': [0],
  'str/join': [0],
  'str/replace-pattern': [0, 1, 2],
  'str/template': [1],
  'str/to-int': [0],
  'str/to-number': [0],
  'time/add': [2],
  'time/diff': [2],
  'time/endOf': [1],
  'time/isSame': [2],
  'time/parse': [0],
  'time/startOf': [1],
  'time/subtract': [2],
  'validate/noneOf': [1],
  'validate/oneOf': [1],
  'xml/valid': [0],
};

/** Sets `rejectsNull` on the declared parameter of every position the table names, and returns the same registry. */
export function withNullRejection(operators: Record<string, StdOperatorMeta>): Record<string, StdOperatorMeta> {
  for (const [name, positions] of Object.entries(NULL_REJECTING_OPERANDS)) {
    const meta = operators[name];
    if (meta === undefined || meta.params === undefined) throw new Error(`null operands: ${name} is not a declared operator with parameters`);
    const params = meta.params;
    for (const position of positions) {
      const own = params[position];
      const last = params[params.length - 1];
      const target = own ?? (last !== undefined && (last.name.startsWith('...') || meta.maxArity === null) ? last : undefined);
      if (target === undefined) throw new Error(`null operands: ${name} declares no parameter at position ${position}`);
      target.rejectsNull = true;
    }
  }
  return operators;
}
