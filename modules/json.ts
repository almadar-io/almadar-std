/**
 * JSON Module - JSON parsing and serialization
 *
 * `(json/parse s)` — pure, deterministic: string → parsed value. Invalid JSON
 * or non-string input → null, never throws — guards can branch on null. No
 * reviver, no prototype access, no side effects. `(json/stringify v)` is the
 * inverse: any value → JSON string.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { BOOLEAN, SHAPE, STRING, childrenOf, fn, openShape, tv, nullable } from '../signature.js';

export const JSON_OPERATORS: Record<string, StdOperatorMeta> = {
  'json/valid': {
    module: 'json',
    category: 'std-json',
    minArity: 1,
    maxArity: 1,
    description: 'Test whether a string is syntactically valid JSON; valid null returns true and malformed JSON returns false',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [{ name: 's', type: 'string', description: 'The JSON string to validate' }],
    example: '["json/valid", "null"] // => true',
  },
  'json/parse': {
    module: 'json',
    category: 'std-json',
    minArity: 2,
    maxArity: 2,
    description: 'Parse a JSON string into a value of the declared shape (the second argument names a type); invalid JSON or non-string input returns null (never throws)',
    hasSideEffects: false,
    failable: {},
    returnType: nullable(SHAPE),
    params: [
      { name: 's', type: 'string', description: 'The JSON string to parse' },
      { name: 'shape', type: SHAPE, description: 'The name of the type the parsed value has' },
    ],
    example: '["json/parse", "{\\"a\\": 1}", "Point"] // => {a: 1}',
  },
  'json/nodes': {
    module: 'json',
    category: 'std-json',
    minArity: 1,
    maxArity: 1,
    description: 'The value and every value nested in it, in pre-order: a list before its items (in order), an object before its values (in key order). Each node is program data (`SExpr`); a list whose first item names an operator is data, never called. For walking a quoted program or a parsed document, e.g. finding every `call-service` form at any depth',
    hasSideEffects: false,
    returnType: { kind: 'array', of: 'sexpr' },
    params: [{ name: 'v', type: tv('T'), description: 'The value to walk' }],
    example: '["json/nodes", {"a": [1]}] // => [{"a": [1]}, [1], 1]',
  },
  'tree/fold': {
    module: 'json',
    category: 'std-json',
    minArity: 3,
    maxArity: 4,
    description: 'The structural bottom-up fold over a value of a recursive type (the third argument names it). The children of a node are its fields whose declared type is the type itself, a list of it or a Map of it, read from the type, never from names or the value\'s shape; a union node is read through the variant it belongs to. The step is called once per node with (node childResults), childResults holding one entry per child field present, in its position: a field holds the child\'s result, a list the list of results, a map the map of results; a leaf gets {}. Every call works on a strict subterm of a finite value, so the fold terminates. An absent value folds to null',
    hasSideEffects: false,
    failable: {},
    returnType: nullable(tv('R')),
    returnSemantics: 'lambda-result',
    acceptsLambda: true,
    lambdaArgPosition: 1,
    params: [
      { name: 'value', type: tv('T'), description: 'The value to fold' },
      { name: 'step', type: fn([tv('T'), childrenOf('T', 'R')], tv('R')), description: 'The step (fn (node childResults) ...): one node and its children\'s results' },
      { name: 'shape', type: SHAPE, description: 'The name of the value\'s recursive type' },
      { name: 'definition', type: STRING, description: 'Written by the compiler, never by hand: the declared type\'s .orb field definition as JSON text, its recursive back-references the by-name reference to the shape', optional: true },
    ],
    example: '["tree/fold", "@entity.filter", ["fn", ["node", "kids"], ["str/concat", "@node.kind", "(", ["str/join", "@kids.of", ","], ")"]], "RowPredicate"]',
  },
  'json/stringify': {
    module: 'json',
    category: 'std-json',
    minArity: 1,
    maxArity: 2,
    description: 'Serialize any value to a JSON string, compact and in insertion order. `sorted: true` sorts every object\'s keys (canonical JSON); `pretty: true` indents two spaces, as `JSON.stringify(v, null, 2)`.',
    hasSideEffects: false,
    returnType: 'string',
    params: [
      { name: 'v', type: tv('T'), description: 'The value to serialize' },
      { name: 'options', type: openShape({ pretty: BOOLEAN, sorted: BOOLEAN }), description: 'Optional `pretty` and `sorted` flags', optional: true },
    ],
    example: '["json/stringify", {a: 1}] // => "{\\"a\\":1}"',
  },
};

/**
 * Get all json operator names.
 */
export function getJsonOperators(): string[] {
  return Object.keys(JSON_OPERATORS);
}
