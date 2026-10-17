/**
 * Orbital Standard Library
 *
 * Domain-agnostic, reusable functions and patterns for S-expressions.
 * Unlike the Trait Library (domain-specific behaviors), the Standard Library
 * provides fundamental building blocks that traits compose together.
 *
 * Modules:
 * - math: Numeric operations (clamp, lerp, randomInt, etc.)
 * - str: String operations (upper, lower, template, truncate, etc.)
 * - array: Collection operations (filter, map, reduce, groupBy, etc.)
 * - object: Object operations (get, set, merge, pick, omit, etc.)
 * - time: Date/time operations (now, format, diff, isPast, etc.)
 * - validate: Input validation (required, email, minLength, etc.)
 * - format: Display formatting (currency, percent, bytes, etc.)
 *
 * @packageDocumentation
 */

// Types
export {
  type OperatorCategory,
  type OperatorMeta,
  type OperatorTypeRef,
  type OperatorEffectMeta,
  type RunsOn,
  type StdModule,
  type StdOperatorCategory,
  type StdOperatorMeta,
  OPERATOR_CATEGORIES,
  STD_MODULES,
  STD_OPERATOR_CATEGORIES,
  isStdCategory,
  isStdOperator,
  getModuleFromOperator,
  getFunctionFromOperator,
  makeStdOperator,
} from './types.js';

// Signature builders
export * from './signature.js';

// Registry
export {
  STD_OPERATORS,
  STD_OPERATORS_BY_MODULE,
  OPERATOR_NAMES,
  // Aliases for the canonical registry, used by consumers migrated from
  // the retired @almadar/operators package.
  STD_OPERATORS as OPERATORS,
  getStdOperatorMeta,
  isKnownStdOperator,
  isKnownStdOperator as isKnownOperator,
  getModuleOperators,
  getAllStdOperators,
  getAllStdOperators as getAllOperatorNames,
  getStdOperatorsByModule,
  getLambdaOperators,
  getStdEffectOperators,
  getStdPureOperators,
  validateStdOperatorArity,
  validateStdOperatorArity as validateOperatorArity,
  assertOperatorArity,
  isStdGuardOperator,
  isStdEffectOperator,
  getOperatorRunsOn,
  effectSiteFor,
  getOperatorsRunningOn,
  // Extended functions for integration with core operators
  getOperatorMetaExtended,
  isKnownOperatorExtended,
  validateOperatorArityExtended,
  isEffectOperatorExtended,
  getStdLibStats,
} from './registry.js';

// Module operators (for direct access if needed)
export {
  CORE_OPERATORS,
  MATH_OPERATORS,
  STR_OPERATORS,
  ARRAY_OPERATORS,
  OBJECT_OPERATORS,
  TIME_OPERATORS,
  VALIDATE_OPERATORS,
  FORMAT_OPERATORS,
  getCoreOperators,
} from './modules/index.js';


