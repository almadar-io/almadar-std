/**
 * Time Module - Date and Time Operations
 *
 * Provides date manipulation, formatting, and comparison functions.
 *
 * Time units: 'year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'ms'
 * Format tokens: 'YYYY', 'MM', 'DD', 'HH', 'mm', 'ss', 'ddd', 'MMM'
 *
 * @packageDocumentation
 */
import type { StdOperatorMeta } from '../types.js';
/**
 * Time module operators.
 * All operators work with dates/timestamps and have no side effects.
 */
export declare const TIME_OPERATORS: Record<string, StdOperatorMeta>;
/**
 * Get all time operator names.
 */
export declare function getTimeOperators(): string[];
