/**
 * Validate Module - Input Validation
 *
 * Provides validation functions for form inputs and data.
 * Returns true/false for single validations.
 * validate/check returns { valid: boolean, errors: [...] } for multiple rules.
 *
 * @packageDocumentation
 */
import type { StdOperatorMeta } from '../types.js';
/**
 * Validate module operators.
 * All operators return boolean or validation result objects and have no side effects.
 */
export declare const VALIDATE_OPERATORS: Record<string, StdOperatorMeta>;
/**
 * Get all validate operator names.
 */
export declare function getValidateOperators(): string[];
