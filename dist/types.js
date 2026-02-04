/**
 * Standard Library Types
 *
 * Common types and interfaces for the Orbital Standard Library.
 * Extends the core operator system with std-prefixed modules.
 *
 * @packageDocumentation
 */
// ============================================================================
// Standard Library Categories
// ============================================================================
/**
 * Standard library module names.
 * Each module provides a set of operators prefixed with the module name.
 * E.g., 'math' provides 'math/abs', 'math/clamp', etc.
 */
export const STD_MODULES = [
    'math',
    'str',
    'array',
    'object',
    'time',
    'validate',
    'format',
    'async',
    'nn',
    'tensor',
    'train',
];
/**
 * Standard library operator categories.
 * These extend the core categories for more granular classification.
 */
export const STD_OPERATOR_CATEGORIES = [
    'std-math',
    'std-str',
    'std-array',
    'std-object',
    'std-time',
    'std-validate',
    'std-format',
    'std-async',
    'std-nn',
    'std-tensor',
    'std-train',
];
/**
 * Type guard to check if an operator category is a std category.
 */
export function isStdCategory(category) {
    return STD_OPERATOR_CATEGORIES.includes(category);
}
/**
 * Get the module name from a std operator name.
 * E.g., 'math/clamp' -> 'math'
 */
export function getModuleFromOperator(operator) {
    const parts = operator.split('/');
    if (parts.length !== 2)
        return null;
    const module = parts[0];
    return STD_MODULES.includes(module) ? module : null;
}
/**
 * Get the function name from a std operator.
 * E.g., 'math/clamp' -> 'clamp'
 */
export function getFunctionFromOperator(operator) {
    const parts = operator.split('/');
    return parts.length === 2 ? parts[1] : null;
}
/**
 * Check if an operator name is a std library operator.
 * Std library operators are prefixed with their module name (e.g., 'math/', 'str/').
 */
export function isStdOperator(operator) {
    return getModuleFromOperator(operator) !== null;
}
/**
 * Create a std operator name from module and function name.
 * E.g., ('math', 'clamp') -> 'math/clamp'
 */
export function makeStdOperator(module, fn) {
    return `${module}/${fn}`;
}
