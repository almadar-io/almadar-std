/**
 * Standard Library Registry
 *
 * Combined registry of all standard library operators.
 * Provides lookup and validation functions for std/* operators.
 *
 * @packageDocumentation
 */
import type { OperatorMeta } from '../types/operators.js';
import type { StdOperatorMeta, StdModule } from './types.js';
/**
 * Combined registry of all standard library operators.
 */
export declare const STD_OPERATORS: Record<string, StdOperatorMeta>;
/**
 * Module-specific operator registries.
 */
export declare const STD_OPERATORS_BY_MODULE: Record<StdModule, Record<string, StdOperatorMeta>>;
/**
 * Get std operator metadata by name.
 *
 * @param operator - Operator name (e.g., 'math/clamp')
 * @returns Operator metadata or undefined if not found
 */
export declare function getStdOperatorMeta(operator: string): StdOperatorMeta | undefined;
/**
 * Check if an operator is a known std library operator.
 *
 * @param operator - Operator name
 * @returns true if operator exists in std library
 */
export declare function isKnownStdOperator(operator: string): boolean;
/**
 * Get all operators for a specific module.
 *
 * @param module - Module name
 * @returns Record of operators in that module
 */
export declare function getModuleOperators(module: StdModule): Record<string, StdOperatorMeta>;
/**
 * Get all std operator names.
 *
 * @returns Array of all std operator names
 */
export declare function getAllStdOperators(): string[];
/**
 * Get all std operator names for a specific module.
 *
 * @param module - Module name
 * @returns Array of operator names in that module
 */
export declare function getStdOperatorsByModule(module: StdModule): string[];
/**
 * Get all std operators that accept lambda expressions.
 *
 * @returns Array of operator names that accept lambdas
 */
export declare function getLambdaOperators(): string[];
/**
 * Get all std operators with side effects.
 *
 * @returns Array of operator names with side effects
 */
export declare function getStdEffectOperators(): string[];
/**
 * Get all pure std operators (no side effects).
 *
 * @returns Array of operator names without side effects
 */
export declare function getStdPureOperators(): string[];
/**
 * Validate std operator arity.
 *
 * @param operator - Operator name
 * @param argCount - Number of arguments provided
 * @returns Error message if invalid, null if valid
 */
export declare function validateStdOperatorArity(operator: string, argCount: number): string | null;
/**
 * Check if a std operator is valid in guard context (no side effects).
 *
 * @param operator - Operator name
 * @returns true if operator can be used in guards
 */
export declare function isStdGuardOperator(operator: string): boolean;
/**
 * Check if a std operator has side effects.
 *
 * @param operator - Operator name
 * @returns true if operator has side effects
 */
export declare function isStdEffectOperator(operator: string): boolean;
/**
 * Get operator metadata, checking both core and std operators.
 * This function integrates with the core operator system.
 *
 * @param operator - Operator name
 * @param coreOperators - Core operator registry (OPERATORS from operators.ts)
 * @returns Operator metadata or undefined
 */
export declare function getOperatorMetaExtended(operator: string, coreOperators: Record<string, OperatorMeta>): OperatorMeta | StdOperatorMeta | undefined;
/**
 * Check if an operator is known (core or std).
 *
 * @param operator - Operator name
 * @param coreOperators - Core operator registry
 * @returns true if operator exists
 */
export declare function isKnownOperatorExtended(operator: string, coreOperators: Record<string, OperatorMeta>): boolean;
/**
 * Validate operator arity (core or std).
 *
 * @param operator - Operator name
 * @param argCount - Number of arguments
 * @param coreOperators - Core operator registry
 * @returns Error message or null
 */
export declare function validateOperatorArityExtended(operator: string, argCount: number, coreOperators: Record<string, OperatorMeta>): string | null;
/**
 * Check if an operator has side effects (core or std).
 *
 * @param operator - Operator name
 * @param coreOperators - Core operator registry
 * @returns true if operator has side effects
 */
export declare function isEffectOperatorExtended(operator: string, coreOperators: Record<string, OperatorMeta>): boolean;
/**
 * Get statistics about the standard library.
 */
export declare function getStdLibStats(): {
    totalOperators: number;
    byModule: Record<StdModule, number>;
    pureOperators: number;
    effectOperators: number;
    lambdaOperators: number;
};
