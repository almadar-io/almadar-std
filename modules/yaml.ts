/**
 * YAML Module - YAML parsing
 *
 * `(yaml/parse s Shape)` — pure, deterministic: YAML 1.2 text (core schema) → a value of the declared shape
 * (the second argument names a type), the typed decode `json/parse` runs. Exactly one document is read;
 * anchors and aliases resolve; the 1.1 spellings (`yes`, `on`, the `<<` merge key) are plain strings.
 * Null on text that is not one well-formed document, on a mapping key that is not a string, on a tag outside
 * the core schema, on NaN or an infinity, and on a value not of the shape. Rust: `orbital_core`
 * `operators/yaml.rs`.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { SHAPE, nullable } from '../signature.js';

export const YAML_OPERATORS: Record<string, StdOperatorMeta> = {
  'yaml/parse': {
    module: 'yaml',
    category: 'std-codec',
    minArity: 2,
    maxArity: 2,
    description: 'Parse YAML 1.2 text (core schema) into a value of the declared shape (the second argument names a type): one document only, anchors and aliases resolved, `yes`/`on`/`<<` plain strings; text that is not one well-formed document, a mapping key that is not a string, a tag outside the core schema, NaN, an infinity, or a value not of the shape returns null; a non-string input (null included) is a type mismatch',
    hasSideEffects: false,
    failable: {},
    returnType: nullable(SHAPE),
    params: [
      { name: 's', type: 'string', description: 'The YAML text to parse' },
      { name: 'shape', type: SHAPE, description: 'The name of the type the parsed value has' },
    ],
    example: '["yaml/parse", "a: 1", "Point"] // => {a: 1}',
  },
};

/**
 * Get all yaml operator names.
 */
export function getYamlOperators(): string[] {
  return Object.keys(YAML_OPERATORS);
}
