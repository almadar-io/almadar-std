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

export const JSON_OPERATORS: Record<string, StdOperatorMeta> = {
  'json/parse': {
    module: 'json',
    category: 'std-json',
    minArity: 1,
    maxArity: 1,
    description: 'Parse a JSON string into a value; invalid JSON or non-string input returns null (never throws)',
    hasSideEffects: false,
    returnType: 'any',
    params: [{ name: 's', type: 'string', description: 'The JSON string to parse' }],
    example: '["json/parse", "{\\"a\\": 1}"] // => {a: 1}',
  },
  'json/stringify': {
    module: 'json',
    category: 'std-json',
    minArity: 1,
    maxArity: 1,
    description: 'Serialize any value to a JSON string',
    hasSideEffects: false,
    returnType: 'string',
    params: [{ name: 'v', type: 'any', description: 'The value to serialize' }],
    example: '["json/stringify", {a: 1}] // => "{\\"a\\":1}"',
  },
};

/**
 * Get all json operator names.
 */
export function getJsonOperators(): string[] {
  return Object.keys(JSON_OPERATORS);
}
