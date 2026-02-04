/**
 * String Module - String Operations
 *
 * Provides string manipulation and transformation functions.
 *
 * @packageDocumentation
 */
import type { StdOperatorMeta } from '../types.js';
/**
 * String module operators.
 * All operators return strings (or boolean for checks) and have no side effects.
 */
export declare const STR_OPERATORS: Record<string, StdOperatorMeta>;
/**
 * Get all string operator names.
 */
export declare function getStrOperators(): string[];
