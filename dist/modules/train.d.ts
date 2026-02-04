/**
 * Training Module - Neural Network Training Operations
 *
 * Provides operators for training neural networks with explicit constraints.
 * Training is bounded by readable rules: gradient clipping, weight constraints,
 * forbidden output regions, and validation gates.
 *
 * @packageDocumentation
 */
import type { StdOperatorMeta } from '../types.js';
/**
 * Training module operators.
 * These operators handle training loops, validation, and constraint enforcement.
 */
export declare const TRAIN_OPERATORS: Record<string, StdOperatorMeta>;
/**
 * Get all train operator names.
 */
export declare function getTrainOperators(): string[];
