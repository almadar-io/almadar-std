/**
 * Builders for operator signatures (see {@link OperatorTypeRef}). The module sources compose their `params`
 * and `returnType` from these, so a signature reads as its grammar: `[T]` is `list(T)`, `(T) -> U` is
 * `fn([T], U)`, `key-of R` is `keyOf('R')`.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef } from './types.js';

type Tagged<K extends string> = Extract<OperatorTypeRef, { kind: K }>;

/** The constraint "a record" (a struct, a `Map K V`, an entity row), the bound of a record variable. */
export const RECORD: Tagged<'record'> = { kind: 'record' };

export const NUMBER: OperatorTypeRef = 'number';
export const STRING: OperatorTypeRef = 'string';
export const BYTES: OperatorTypeRef = 'bytes';
export const BOOLEAN: OperatorTypeRef = 'boolean';
export const VOID: OperatorTypeRef = 'void';
export const SEXPR: OperatorTypeRef = { kind: 'sexpr' };

/** An unevaluated expression whose value has type `of`. */
export function sexprOf(of: OperatorTypeRef): Tagged<'sexpr'> {
  return { kind: 'sexpr', of };
}

/** A binding target (`@entity.field`) that holds a value of type `shape`. */
export function bindingOf(shape: OperatorTypeRef): Tagged<'binding'> {
  return { kind: 'binding', shape };
}
export const SHAPE: OperatorTypeRef = { kind: 'shape' };

/** A type variable, bound per call. */
export function tv(name: string, bound?: OperatorTypeRef): Tagged<'var'> {
  return bound === undefined ? { kind: 'var', name } : { kind: 'var', name, bound };
}

/** A type variable bound afresh at every argument a rest parameter covers (no agreement between them). */
export function each(name: string): Tagged<'var'> {
  return { kind: 'var', name, each: true };
}

/** A record variable: bound to a struct, a `Map K V` or an entity row. */
export function rec(name: string): Tagged<'var'> {
  return tv(name, RECORD);
}

/** A record variable bound afresh at each argument a rest parameter covers. */
export function eachRec(name: string): Tagged<'var'> {
  return { kind: 'var', name, bound: RECORD, each: true };
}

/** `[T]` */
export function list(of: OperatorTypeRef): Tagged<'array'> {
  return { kind: 'array', of };
}

export function tuple(...items: OperatorTypeRef[]): Tagged<'tuple'> {
  return { kind: 'tuple', items };
}

/** `Map K V` */
export function mapOf(key: OperatorTypeRef, value: OperatorTypeRef): Tagged<'map'> {
  return { kind: 'map', key, value };
}

/** `(P…) -> R` */
export function fn(params: OperatorTypeRef[], returns: OperatorTypeRef): Tagged<'fn'> {
  return { kind: 'fn', params, returns };
}

export function union(...of: OperatorTypeRef[]): Tagged<'union'> {
  return { kind: 'union', of };
}

export function lit(value: string | number | boolean | null): Tagged<'literal'> {
  return { kind: 'literal', value };
}

/** `T | null` */
export function nullable(of: OperatorTypeRef): Tagged<'union'> {
  return union(of, lit(null));
}

/** A closed record type. */
export function shape(fields: Record<string, OperatorTypeRef>, optional: string[] = []): Tagged<'object'> {
  return optional.length ? { kind: 'object', fields, optional } : { kind: 'object', fields };
}

/** A record type that may carry further fields besides the declared ones. */
export function openShape(fields: Record<string, OperatorTypeRef>): Tagged<'object'> {
  return { kind: 'object', fields, open: true };
}

export function keyOf(record: string): Tagged<'keyOf'> {
  return { kind: 'keyOf', of: record };
}

export function fieldOf(record: string): Tagged<'fieldOf'> {
  return { kind: 'fieldOf', of: record };
}

export function pickOf(record: string): Tagged<'pickOf'> {
  return { kind: 'pickOf', of: record };
}

export function omitOf(record: string): Tagged<'omitOf'> {
  return { kind: 'omitOf', of: record };
}

export function mergeOf(record: string): Tagged<'mergeOf'> {
  return { kind: 'mergeOf', of: record };
}

export function childrenOf(record: string, result: string): Tagged<'childrenOf'> {
  return { kind: 'childrenOf', of: record, result };
}

/** A value `str/concat` and the formatters render as text. */
export const PRIMITIVE_VALUE: OperatorTypeRef = union(STRING, NUMBER, BOOLEAN, 'date', 'datetime');

export const EVENT_KEY: OperatorTypeRef = { kind: 'eventKey' };

/** The trailing `{ emit: { success, failure } }` options object of an effect (and the call key that names a cancellable call). */
export const EMIT_ENVELOPE: OperatorTypeRef = openShape({
  key: STRING,
  emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY, cancelled: EVENT_KEY }),
});

/** What `behavior/describe` resolves with. */
export const DESCRIPTION: OperatorTypeRef = openShape({
  knobs: list(openShape({ key: STRING, type: STRING })),
  events: openShape({ emits: list(STRING), listens: list(STRING), transitions: list(STRING) }),
  model: STRING,
});

/** A model test case: the input and the output the model is expected to produce. */
export const TEST_CASES: OperatorTypeRef = list(shape({ input: 'tensor', expected: 'tensor' }));

export const TRAIN_CONFIG: OperatorTypeRef = openShape({ epochs: NUMBER, learningRate: NUMBER, batchSize: NUMBER });

/** The configuration keys the `data/*` operators read. */
export const DATA_CONFIG: OperatorTypeRef = openShape({
  batchSize: NUMBER,
  shuffle: BOOLEAN,
  trainRatio: NUMBER,
  method: STRING,
  noiseScale: NUMBER,
  mode: STRING,
  maxLength: NUMBER,
  padValue: NUMBER,
  vocab: mapOf(STRING, NUMBER),
});

/** The signature grammar of a type: `[T]`, `(T) -> U`, `key-of R`, `Map K V`, ... */
export function formatOperatorType(ref: OperatorTypeRef): string {
  if (typeof ref === 'string') return ref;
  switch (ref.kind) {
    case 'literal':
      return JSON.stringify(ref.value);
    case 'union':
      return ref.of.map(formatOperatorType).join(' | ');
    case 'array':
      return `[${formatOperatorType(ref.of)}]`;
    case 'tuple':
      return `[${ref.items.map(formatOperatorType).join(', ')}]`;
    case 'map':
      return `Map ${formatOperatorType(ref.key)} ${formatOperatorType(ref.value)}`;
    case 'object': {
      const fields = Object.entries(ref.fields)
        .map(([k, v]) => `${k}: ${formatOperatorType(v)}`)
        .join(', ');
      return ref.open ? `{ ${fields}, ... }` : `{ ${fields} }`;
    }
    case 'entity':
      return ref.collection ? `Entity<${ref.collection}>` : 'Entity';
    case 'entityRef':
      return 'EntityRef';
    case 'eventKey':
      return ref.scope ? `EventKey<${ref.scope}>` : 'EventKey';
    case 'uiSlot':
      return 'UISlot';
    case 'patternType':
      return 'PatternType';
    case 'binding':
      return ref.shape ? `Binding<${formatOperatorType(ref.shape)}>` : 'Binding';
    case 'sexpr':
      return ref.of ? `SExpr<${formatOperatorType(ref.of)}>` : 'SExpr';
    case 'var':
      return ref.name;
    case 'record':
      return 'record';
    case 'fn':
      return `(${ref.params.map(formatOperatorType).join(', ')}) -> ${formatOperatorType(ref.returns)}`;
    case 'keyOf':
      return `key-of ${ref.of}`;
    case 'fieldOf':
      return `field-of ${ref.of}`;
    case 'pickOf':
      return `pick-of ${ref.of}`;
    case 'omitOf':
      return `omit-of ${ref.of}`;
    case 'mergeOf':
      return `merge-of ${ref.of}`;
    case 'shape':
      return 'Shape';
    case 'childrenOf':
      return `children-of ${ref.of} ${ref.result}`;
  }
}
