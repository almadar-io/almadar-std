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
import { BOOLEAN, NUMBER, SEXPR, SHAPE, STRING, childrenOf, fn, list, mapOf, openShape, shape, tv, nullable } from '../signature.js';

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
  'tree/index': {
    module: 'json',
    category: 'std-json',
    minArity: 2,
    maxArity: 3,
    description: 'Every call form in a value, grouped by its head, in one walk: a call form is a list whose first item is a string listed in `heads`. The walk is pre-order over lists (items in order) and objects (values in key order), like json/nodes, and continues inside a call form. Each hit carries its node, its path from the value (`[i]` for a list item, `.key` for an object field and `key` for a field of the value itself, e.g. `orbitals[0].traits[1]`, `[2][1].then`) and `at`, its 0-based position in the walk (the count of nodes visited before it), so hits of several heads merge back into walk order by `at`. The result has one entry per listed head, an empty list when the head never occurs. With `options.prefixes`, every string leaf starting with a listed prefix is also collected, under the first listed prefix that matches, as a hit whose node is the string; a string that is the first item of a list (a call head) is not a leaf, and every listed prefix is a key, an empty list when nothing matches. `options` must be a record and `prefixes` a list of strings. For indexing a program once so readers look up the calls and references they inspect instead of walking it',
    hasSideEffects: false,
    returnType: mapOf(STRING, list(shape({ path: STRING, node: SEXPR, at: NUMBER }))),
    params: [
      { name: 'value', type: tv('T'), description: 'The value to index' },
      { name: 'heads', type: list(STRING), description: 'The heads to collect' },
      { name: 'options', type: shape({ prefixes: list(STRING) }, ['prefixes']), description: 'Optional `prefixes`: string prefixes whose leaves are collected too', optional: true },
    ],
    example: '["tree/index", [["emit", "A"], ["if", true, ["emit", "B"]]], ["emit"]] // => {"emit": [{"path": "[0]", "node": ["emit", "A"], "at": 1}, {"path": "[1][2]", "node": ["emit", "B"], "at": 7}]}',
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
