/**
 * Async Module - Asynchronous Operations
 *
 * Provides functions for handling async operations, delays, and timing.
 * These operators have side effects as they affect execution timing.
 *
 * @packageDocumentation
 */
import type { StdOperatorMeta } from '../types.js';
/**
 * Async module operators.
 * These operators control execution timing and have side effects.
 */
export declare const ASYNC_OPERATORS: Record<string, StdOperatorMeta>;
/**
 * Get all async operator names.
 */
export declare function getAsyncOperators(): string[];
