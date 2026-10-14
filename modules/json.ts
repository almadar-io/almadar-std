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
import { SHAPE, tv } from '../signature.js';

export const JSON_OPERATORS: Record<string, StdOperatorMeta> = {
  'json/parse': {
    module: 'json',
    category: 'std-json',
    minArity: 2,
    maxArity: 2,
    description: 'Parse a JSON string into a value of the declared shape (the second argument names a type); invalid JSON or non-string input returns null (never throws)',
    hasSideEffects: false,
    returnType: SHAPE,
    params: [
      { name: 's', type: 'string', description: 'The JSON string to parse' },
      { name: 'shape', type: SHAPE, description: 'The name of the type the parsed value has' },
    ],
    example: '["json/parse", "{\\"a\\": 1}", "Point"] // => {a: 1}',
  },
  'json/stringify': {
    module: 'json',
    category: 'std-json',
    minArity: 1,
    maxArity: 1,
    description: 'Serialize any value to a JSON string',
    hasSideEffects: false,
    returnType: 'string',
    params: [{ name: 'v', type: tv('T'), description: 'The value to serialize' }],
    example: '["json/stringify", {a: 1}] // => "{\\"a\\":1}"',
  },
};

/**
 * Get all json operator names.
 */
export function getJsonOperators(): string[] {
  return Object.keys(JSON_OPERATORS);
}
