/**
 * Standard Library Types
 *
 * Common types and interfaces for the Orbital Standard Library.
 * Extends the core operator system with std-prefixed modules.
 *
 * @packageDocumentation
 */
import { OperatorMeta } from '../types/operators.js';
/**
 * Standard library module names.
 * Each module provides a set of operators prefixed with the module name.
 * E.g., 'math' provides 'math/abs', 'math/clamp', etc.
 */
export declare const STD_MODULES: readonly ["math", "str", "array", "object", "time", "validate", "format", "async", "nn", "tensor", "train"];
export type StdModule = (typeof STD_MODULES)[number];
/**
 * Standard library operator categories.
 * These extend the core categories for more granular classification.
 */
export declare const STD_OPERATOR_CATEGORIES: readonly ["std-math", "std-str", "std-array", "std-object", "std-time", "std-validate", "std-format", "std-async", "std-nn", "std-tensor", "std-train"];
export type StdOperatorCategory = (typeof STD_OPERATOR_CATEGORIES)[number];
/**
 * Extended operator metadata for std library operators.
 * Adds parameter descriptions and examples.
 */
export interface StdOperatorMeta extends OperatorMeta {
    /** The std module this operator belongs to */
    module: StdModule;
    /** Parameter names and descriptions */
    params?: {
        name: string;
        type: string;
        description: string;
        optional?: boolean;
        defaultValue?: unknown;
    }[];
    /** Example usage */
    example?: string;
    /** Whether this operator accepts a lambda expression argument */
    acceptsLambda?: boolean;
    /** Position of the lambda argument (0-indexed) */
    lambdaArgPosition?: number;
}
/**
 * Type guard to check if an operator category is a std category.
 */
export declare function isStdCategory(category: string): category is StdOperatorCategory;
/**
 * Get the module name from a std operator name.
 * E.g., 'math/clamp' -> 'math'
 */
export declare function getModuleFromOperator(operator: string): StdModule | null;
/**
 * Get the function name from a std operator.
 * E.g., 'math/clamp' -> 'clamp'
 */
export declare function getFunctionFromOperator(operator: string): string | null;
/**
 * Check if an operator name is a std library operator.
 * Std library operators are prefixed with their module name (e.g., 'math/', 'str/').
 */
export declare function isStdOperator(operator: string): boolean;
/**
 * Create a std operator name from module and function name.
 * E.g., ('math', 'clamp') -> 'math/clamp'
 */
export declare function makeStdOperator(module: StdModule, fn: string): string;
