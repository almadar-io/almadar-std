/**
 * Math Module - Numeric Operations
 *
 * Provides higher-level numeric operations beyond basic arithmetic.
 * Basic arithmetic (+, -, *, /, %) is provided by language primitives.
 *
 * @packageDocumentation
 */
import type { StdOperatorMeta } from '../types.js';
/**
 * Math module operators.
 * All operators return numbers and have no side effects.
 */
export declare const MATH_OPERATORS: Record<string, StdOperatorMeta>;
/**
 * Get all math operator names.
 */
export declare function getMathOperators(): string[];
