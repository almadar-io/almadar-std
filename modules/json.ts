/**
 * JSON Module - JSON parsing and serialization
 *
 * `(json/parse s)` — pure, deterministic: string → parsed value. Invalid JSON
 * → null — guards can branch on null; non-string input is a type mismatch. No
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
    description: 'Parse a JSON string into a value of the declared shape (the second argument names a type); invalid JSON or text not of the shape returns null; a non-string input (null included) is a type mismatch',
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
    description: 'Every call form in a value, grouped by its head, in one walk: a call form is a list whose first item is a string listed in `heads`. The walk is pre-order over lists (items in order) and objects (values in key order), like json/nodes, and continues inside a call form. Each hit carries its node, its path from the value (`[i]` for a list item, `.key` for an object field and `key` for a field of the value itself, e.g. `orbitals[0].traits[1]`, `[2][1].then`) and `at`, its 0-based position in the walk (the count of nodes visited before it), so hits of several heads merge back into walk order by `at`. The result has one entry per listed head, an empty list when the head never occurs. With `options.prefixes`, every string leaf starting with a listed prefix is also collected, under the first listed prefix that matches, as a hit whose node is the string; a string that is the first item of a list (a call head) is not a leaf, and every listed prefix is a key, an empty list when nothing matches. With `options.objects`, every object that carries one of the listed keys is also collected, under that key, as a hit whose node is the object (an object carrying several listed keys is a hit under each; a key that is also a head or prefix shares its list); every listed key is a result key, an empty list when nothing carries it. `options` must be a record, `prefixes` and `objects` lists of strings. For indexing a program once so readers look up the calls and references they inspect instead of walking it',
    hasSideEffects: false,
    returnType: mapOf(STRING, list(shape({ path: STRING, node: SEXPR, at: NUMBER }))),
    params: [
      { name: 'value', type: tv('T'), description: 'The value to index' },
      { name: 'heads', type: list(STRING), description: 'The heads to collect' },
      { name: 'options', type: shape({ objects: list(STRING), prefixes: list(STRING) }, ['objects', 'prefixes']), description: 'Optional `prefixes`: string prefixes whose leaves are collected too; `objects`: keys whose carrier objects are collected too', optional: true },
    ],
    example: '["tree/index", [["emit", "A"], ["if", true, ["emit", "B"]]], ["emit"]] // => {"emit": [{"path": "[0]", "node": ["emit", "A"], "at": 1}, {"path": "[1][2]", "node": ["emit", "B"], "at": 7}]}',
  },
  'value/depth': {
    module: 'json',
    category: 'std-json',
    minArity: 1,
    maxArity: 1,
    description: "The deepest nesting of a value, in one walk (O(size)): a scalar is 0, a list or a record is 1 + the greatest depth among its items, so an empty one is 1",
    hasSideEffects: false,
    returnType: 'int',
    params: [{ name: 'v', type: tv('T'), description: 'The value to measure' }],
    example: "[\"value/depth\", {\"a\": [1, [2]]}] // => 3",
  },
  'value/key': {
    module: 'json',
    category: 'std-json',
    minArity: 1,
    maxArity: 1,
    description: "A deterministic string key of any value, in one walk of the value (O(size)): equal values give equal keys and unequal values give different keys, so it replaces a stringify-based dedupe or lookup key. Record field order never changes the key; a list and a record never share one; an int and the equal float share one. A lambda has no key (an error)",
    hasSideEffects: false,
    returnType: 'string',
    params: [{ name: 'v', type: tv('T'), description: 'The value to key' }],
    example: "[\"value/key\", {\"a\": [1, \"x\"]}] // => \"{1:a[i1;s1:x]}\"",
  },
  'tree/fold': {
    module: 'json',
    category: 'std-json',
    minArity: 3,
    maxArity: 4,
    description: 'The structural bottom-up fold over a value of a recursive type (the third argument names it). The children of a node are its fields whose declared type is the type itself, a list of it or a Map of it, read from the type, never from names or the value\'s shape; a union node is read through the variant it belongs to. The step is called once per node with (node childResults), childResults holding one entry per child field present, in its position: a field holds the child\'s result, a list the list of results, a map the map of results; a leaf gets {}. Every call works on a strict subterm of a finite value, so the fold terminates. An absent value folds to null',
    hasSideEffects: false,
    failable: { unlessPresent: [0] },
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
