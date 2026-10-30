import type { OperatorTypeRef, OsGrantNeed, StdOperatorMeta } from '../types.js';
import { BYTES, EMIT_ENVELOPE, STRING, NUMBER, BOOLEAN, list, lit, openShape, shape, union } from '../signature.js';

type OsParam = NonNullable<StdOperatorMeta['params']>[number];

export const OS_ANCHOR: OperatorTypeRef = union(lit('cwd'), lit('exe-dir'), shape({ env: STRING }));
export const OS_ANCHORED_PATH: OperatorTypeRef = shape({ anchor: OS_ANCHOR, path: STRING });
export const OS_PATH: OperatorTypeRef = union(STRING, OS_ANCHORED_PATH);
export const OS_ENV_ANCHORED: OperatorTypeRef = shape({ anchor: shape({ env: STRING }) });
export const OS_HOST: OperatorTypeRef = union(STRING, OS_ENV_ANCHORED);
export const OS_PORT: OperatorTypeRef = union(NUMBER, OS_ENV_ANCHORED);
export const OS_HANDLE: OperatorTypeRef = NUMBER;
export const OS_DATA: OperatorTypeRef = BYTES;
export const OS_SEND_SEGMENT: OperatorTypeRef = shape({ bytes: BYTES, credential: STRING });
export const OS_SEND_DATA: OperatorTypeRef = union(BYTES, list(OS_SEND_SEGMENT));
export const OS_PERMISSION_BITS: OperatorTypeRef = NUMBER;
export const OS_STREAM_MODE: OperatorTypeRef = union(lit('inherit'), lit('pipe'), lit('null'));
export const OS_SIGNAL: OperatorTypeRef = union(lit('TERM'), lit('KILL'), lit('INT'), lit('HUP'), lit('QUIT'), lit('USR1'), lit('USR2'), lit('STOP'), lit('CONT'));
export const OS_STRING_LIST: OperatorTypeRef = list(STRING);
export const OS_BOOL: OperatorTypeRef = BOOLEAN;
export const OS_EMPTY_PAYLOAD = 'Success payload: {}.';

export const OS_ENTRY: OperatorTypeRef = shape({ name: STRING, kind: STRING });

export function arg(name: string, type: OperatorTypeRef, description: string, optional?: boolean): OsParam {
  return optional ? { name, type, description, optional: true } : { name, type, description };
}

const OPTIONS: OsParam = {
  name: 'options',
  type: EMIT_ENVELOPE,
  description: 'Optional trailing options: { emit: { success, failure, key? } } routes the success payload and the { error, kind } failure; kind is one of denied, not-found, exists, invalid, io, timeout, unsupported, closed',
  optional: true,
};

const EVENT_KEY: OperatorTypeRef = { kind: 'eventKey' };

const STREAM_OPTIONS: OsParam = {
  name: 'options',
  type: openShape({
    key: STRING,
    emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY, cancelled: EVENT_KEY, onMessage: EVENT_KEY }),
  }),
  description: 'Optional trailing options: { key, emit: { success, failure, cancelled, onMessage } } routes the first answer, the { error, kind } failure, the cancellation and each stream event (onMessage); kind is one of denied, not-found, exists, invalid, io, timeout, unsupported, closed',
  optional: true,
};

/** An answer's payload with the call's `key` beside it: present only when the call is keyed. */
export function withKey(answer: OperatorTypeRef): OperatorTypeRef {
  if (typeof answer === 'string' || answer.kind !== 'object') throw new Error('an os answer is an object shape');
  return { ...answer, fields: { ...answer.fields, key: STRING }, optional: [...(answer.optional ?? []), 'key'] };
}

interface OsEffectDef {
  /** The success payload (`emit.success`); absent when the contract states none. */
  answer?: OperatorTypeRef;
  /** Each event of a stream (`emit.onMessage`). */
  events?: OperatorTypeRef;
  /** The answer of a stream op called with no `onMessage` route. */
  unrouted?: OperatorTypeRef;
  grant: OsGrantNeed[];
  description: string;
  params: OsParam[];
  example: string;
  stream?: boolean;
}

export function osEffect(def: OsEffectDef): StdOperatorMeta {
  const required = def.params.filter((p) => p.optional !== true).length;
  const streamNote = def.stream ? ' Stream: events are routed to the call site as they arrive, then one final answer; cancel with cancel-call on the key.' : '';
  return {
    module: 'os',
    category: 'std-os',
    minArity: required,
    maxArity: def.params.length + 1,
    description: `${def.description}${streamNote}`,
    hasSideEffects: true,
    runsOn: 'server',
    host: 'os',
    grant: def.grant,
    returnType: 'void',
    params: [...def.params, def.stream ? STREAM_OPTIONS : OPTIONS],
    example: def.example,
    ...(def.answer === undefined
      ? {}
      : {
          effect: {
            kind: 'custom' as const,
            produces: withKey(def.answer),
            ...(def.events === undefined ? {} : { events: withKey(def.events) }),
            ...(def.unrouted === undefined ? {} : { unrouted: withKey(def.unrouted) }),
          },
        }),
  };
}

export function osPure(def: { description: string; params: OsParam[]; returnType: OperatorTypeRef; example: string; variadic?: boolean }): StdOperatorMeta {
  const required = def.params.filter((p) => p.optional !== true).length;
  return {
    module: 'os',
    category: 'std-os',
    minArity: required,
    maxArity: def.variadic ? null : def.params.length,
    description: def.description,
    hasSideEffects: false,
    returnType: def.returnType,
    params: def.params,
    example: def.example,
  };
}

export const OS_COMMAND: OperatorTypeRef = union(STRING, OS_ANCHORED_PATH, OS_ENV_ANCHORED);
