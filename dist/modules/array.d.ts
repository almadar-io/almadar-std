/**
 * Array Module - Collection Operations
 *
 * Provides array manipulation and transformation functions.
 * Many functions accept lambda expressions for predicates and transformations.
 *
 * Lambda syntax: ["fn", "varName", expression] or ["fn", ["a", "b"], expression]
 *
 * @packageDocumentation
 */
import type { StdOperatorMeta } from '../types.js';
/**
 * Array module operators.
 * All operators return arrays (or other values) and have no side effects.
 */
export declare const ARRAY_OPERATORS: Record<string, StdOperatorMeta>;
/**
 * Get all array operator names.
 */
export declare function getArrayOperators(): string[];
/**
 * Get all array operators that accept lambda expressions.
 */
export declare function getLambdaArrayOperators(): string[];
