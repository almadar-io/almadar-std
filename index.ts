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
 * - async: Async operations (delay, debounce, retry, etc.)
 *
 * @packageDocumentation
 */

// Types
export {
  type StdModule,
  type StdOperatorCategory,
  type StdOperatorMeta,
  STD_MODULES,
  STD_OPERATOR_CATEGORIES,
  isStdCategory,
  isStdOperator,
  getModuleFromOperator,
  getFunctionFromOperator,
  makeStdOperator,
} from './types.js';

// Registry
export {
  STD_OPERATORS,
  STD_OPERATORS_BY_MODULE,
  getStdOperatorMeta,
  isKnownStdOperator,
  getModuleOperators,
  getAllStdOperators,
  getStdOperatorsByModule,
  getLambdaOperators,
  getStdEffectOperators,
  getStdPureOperators,
  validateStdOperatorArity,
  isStdGuardOperator,
  isStdEffectOperator,
  // Extended functions for integration with core operators
  getOperatorMetaExtended,
  isKnownOperatorExtended,
  validateOperatorArityExtended,
  isEffectOperatorExtended,
  getStdLibStats,
} from './registry.js';

// Module operators (for direct access if needed)
export {
  MATH_OPERATORS,
  STR_OPERATORS,
  ARRAY_OPERATORS,
  OBJECT_OPERATORS,
  TIME_OPERATORS,
  VALIDATE_OPERATORS,
  FORMAT_OPERATORS,
  ASYNC_OPERATORS,
} from './modules/index.js';

// Standard Behaviors (functions-based)
export {
  // Types
  type BehaviorTrait,
  type BehaviorMetadata,
  type ItemAction,
  type Trait,
  type StateMachine,
  type State,
  type Event,
  type Transition,
  type TraitTick,
  type TraitDataEntity,
  type TraitEntityField,
  type TraitCategory,
  getBehaviorMetadata,
  validateBehaviorStructure,
  validateBehaviorEvents,
  validateBehaviorStates,
  // Golden .orb exports reader
  type BehaviorLevel,
  getAllBehaviorNames,
  getAllBehaviors,
  getBehaviorsByLevel,
  loadGoldenOrb,
  hasGoldenOrb,
  // Query helpers
  type RegistryEntry,
  type BehaviorSummary,
  getBehaviorRegistry,
  getBehaviorsByDomain,
  getBehaviorsByOperations,
  searchBehaviors,
  getBehaviorSummary,
} from './behaviors/index.js';

// All behavior functions
export * from './behaviors/functions/index.js';

// Documentation Generator
export {
  // Types
  type ModuleInfo,
  type CategoryInfo,
  type OperatorDoc,
  type ModuleDoc,
  type BehaviorDoc,
  type CategoryDoc,
  type DocsStats,
  type StdLibDocs,
  type BehaviorsDocs,
  // Domain language mappings
  MODULE_DESCRIPTIONS,
  BEHAVIOR_CATEGORY_DESCRIPTIONS,
  // Transform functions
  humanizeOperatorName,
  humanizeReturnType,
  formatArity,
  // Generation functions
  generateOperatorDoc,
  generateModuleDoc,
  generateBehaviorDoc,
  generateModulesDocs,
  generateBehaviorsDocs,
  generateStdLibDocs,
} from './docs-generator.js';
