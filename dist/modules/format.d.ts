/**
 * Format Module - Display Formatting
 *
 * Provides formatting functions for numbers, currencies, and display values.
 *
 * @packageDocumentation
 */
import type { StdOperatorMeta } from '../types.js';
/**
 * Format module operators.
 * All operators return formatted strings and have no side effects.
 */
export declare const FORMAT_OPERATORS: Record<string, StdOperatorMeta>;
/**
 * Get all format operator names.
 */
export declare function getFormatOperators(): string[];
