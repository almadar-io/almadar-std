/**
 * KV Module - the `kv/` row-store asks: one store per name, the host picks the medium (IndexedDB in the browser,
 * one JSON file per store on Node and native). Grant: `kv: { <store>: [read, write] }`.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, OsGrantNeed, StdOperatorMeta } from '../types.js';
import { EMIT_ENVELOPE, NUMBER, STRING, list, lit, shape, tv, union } from '../signature.js';

type KvParam = NonNullable<StdOperatorMeta['params']>[number];

const STORE: KvParam = { name: 'store', type: STRING, description: 'Store name ([A-Za-z0-9._-]+)' };
const KEY: KvParam = { name: 'key', type: STRING, description: 'Key (any string, the empty key included)' };
const VALUE: OperatorTypeRef = tv('T');
const BATCH_OP: OperatorTypeRef = union(
  shape({ kind: lit('put'), key: STRING, value: VALUE }),
  shape({ kind: lit('delete'), key: STRING }),
);

const OPTIONS: KvParam = {
  name: 'options',
  type: EMIT_ENVELOPE,
  description: 'Optional trailing options: { emit: { success, failure, key? } } routes the success payload and the { error, kind } failure; kind is one of denied, invalid, io, timeout, unsupported, closed',
  optional: true,
};

function kvEffect(def: { grant: OsGrantNeed[]; description: string; params: KvParam[]; example: string }): StdOperatorMeta {
  const required = def.params.filter((p) => p.optional !== true).length;
  return {
    module: 'kv',
    category: 'std-kv',
    minArity: required,
    maxArity: def.params.length + 1,
    description: def.description,
    hasSideEffects: true,
    runsOn: 'any',
    host: 'kv',
    grant: def.grant,
    returnType: 'void',
    params: [...def.params, OPTIONS],
    example: def.example,
  };
}

export const KV_OPERATORS: Record<string, StdOperatorMeta> = {
  'kv/get': kvEffect({
    grant: [{ kind: 'kv', access: 'read', store: 0 }],
    description: 'Read one key (grant kv: read). Success payload: { found, value? }; a miss is { found: false }, not a failure.',
    params: [STORE, KEY],
    example: '["kv/get", "rows", "order/1", { "emit": { "success": "ROW_READ", "failure": "KV_FAILED" } }]',
  }),
  'kv/put': kvEffect({
    grant: [{ kind: 'kv', access: 'write', store: 0 }],
    description: 'Write one key, replacing any value (grant kv: write). The value must be JSON. Success payload: { storedKey }.',
    params: [STORE, KEY, { name: 'value', type: VALUE, description: 'A JSON value' }],
    example: '["kv/put", "rows", "order/1", { "id": "1" }, { "emit": { "success": "ROW_PUT", "failure": "KV_FAILED" } }]',
  }),
  'kv/delete': kvEffect({
    grant: [{ kind: 'kv', access: 'write', store: 0 }],
    description: 'Delete one key (grant kv: write). Success payload: { existed }; deleting a miss succeeds with existed: false.',
    params: [STORE, KEY],
    example: '["kv/delete", "rows", "order/1", { "emit": { "success": "ROW_DELETED", "failure": "KV_FAILED" } }]',
  }),
  'kv/scan': kvEffect({
    grant: [{ kind: 'kv', access: 'read', store: 0 }],
    description: 'Every key starting with prefix, ascending in UTF-8 byte order, at most limit (grant kv: read). Success payload: { entries: [{ key, value }] }.',
    params: [STORE, { name: 'prefix', type: STRING, description: 'Key prefix; "" is the whole store' }, { name: 'limit', type: NUMBER, description: 'Most entries to return', optional: true }],
    example: '["kv/scan", "rows", "order/", { "emit": { "success": "ROWS_SCANNED", "failure": "KV_FAILED" } }]',
  }),
  'kv/batch': kvEffect({
    grant: [{ kind: 'kv', access: 'write', store: 0 }],
    description: 'Apply puts and deletes to one store all-or-nothing (grant kv: write). Success payload: { applied }.',
    params: [STORE, { name: 'ops', type: list(BATCH_OP), description: 'The puts and deletes, applied in order' }],
    example: '["kv/batch", "rows", [{ "kind": "put", "key": "order/1", "value": { "id": "1" } }, { "kind": "delete", "key": "order/2" }], { "emit": { "success": "ROWS_WRITTEN", "failure": "KV_FAILED" } }]',
  }),
};
