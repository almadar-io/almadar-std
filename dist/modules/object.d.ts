/**
 * Object Module - Object Operations
 *
 * Provides object manipulation and transformation functions.
 * All operations are immutable (return new objects).
 *
 * @packageDocumentation
 */
import type { StdOperatorMeta } from '../types.js';
/**
 * Object module operators.
 * All operators return objects or other values and have no side effects.
 */
export declare const OBJECT_OPERATORS: Record<string, StdOperatorMeta>;
/**
 * Get all object operator names.
 */
export declare function getObjectOperators(): string[];
