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
export { type StdModule, type StdOperatorCategory, type StdOperatorMeta, STD_MODULES, STD_OPERATOR_CATEGORIES, isStdCategory, isStdOperator, getModuleFromOperator, getFunctionFromOperator, makeStdOperator, } from './types.js';
export { STD_OPERATORS, STD_OPERATORS_BY_MODULE, getStdOperatorMeta, isKnownStdOperator, getModuleOperators, getAllStdOperators, getStdOperatorsByModule, getLambdaOperators, getStdEffectOperators, getStdPureOperators, validateStdOperatorArity, isStdGuardOperator, isStdEffectOperator, getOperatorMetaExtended, isKnownOperatorExtended, validateOperatorArityExtended, isEffectOperatorExtended, getStdLibStats, } from './registry.js';
export { MATH_OPERATORS, STR_OPERATORS, ARRAY_OPERATORS, OBJECT_OPERATORS, TIME_OPERATORS, VALIDATE_OPERATORS, FORMAT_OPERATORS, ASYNC_OPERATORS, } from './modules/index.js';
export { type StandardBehavior, type BehaviorMetadata, type BehaviorCategory, type BehaviorConfig, type BehaviorTransition, type BehaviorStateMachine, type BehaviorState, type BehaviorEvent, type BehaviorTick, type BehaviorDataEntity, type ConfigField, type ItemAction, BEHAVIOR_CATEGORIES, isBehaviorCategory, isGameBehaviorCategory, getBehaviorMetadata, validateBehaviorStructure, validateBehaviorEvents, validateBehaviorStates, type ActionAffinity, type ActionPlacement, type UIEventInfo, ACTION_AFFINITY, UI_EVENTS, isActionValidForComponent, isActionInvalidForComponent, getValidActionsForComponent, getInvalidActionsForComponent, getComponentsForEvent, validateActionsForComponent, getAllKnownComponents, getComponentsByCategory, STANDARD_BEHAVIORS, BEHAVIOR_REGISTRY, BEHAVIORS_BY_CATEGORY, getBehavior, isKnownBehavior, getBehaviorsByCategory, getAllBehaviorNames, getAllBehaviors, getAllBehaviorMetadata, findBehaviorsForUseCase, getBehaviorsForEvent, getBehaviorsWithState, validateBehaviorReference, getBehaviorLibraryStats, LIST_BEHAVIOR, DETAIL_BEHAVIOR, FORM_BEHAVIOR, MODAL_BEHAVIOR, DRAWER_BEHAVIOR, TABS_BEHAVIOR, WIZARD_BEHAVIOR, MASTER_DETAIL_BEHAVIOR, PAGINATION_BEHAVIOR, SELECTION_BEHAVIOR, SORT_BEHAVIOR, FILTER_BEHAVIOR, SEARCH_BEHAVIOR, LOADING_BEHAVIOR, FETCH_BEHAVIOR, SUBMIT_BEHAVIOR, RETRY_BEHAVIOR, POLL_BEHAVIOR, NOTIFICATION_BEHAVIOR, CONFIRMATION_BEHAVIOR, UNDO_BEHAVIOR, UI_INTERACTION_BEHAVIORS, DATA_MANAGEMENT_BEHAVIORS, ASYNC_BEHAVIORS, FEEDBACK_BEHAVIORS, } from './behaviors/index.js';
export { type ModuleInfo, type CategoryInfo, type OperatorDoc, type ModuleDoc, type BehaviorDoc, type CategoryDoc, type DocsStats, type StdLibDocs, type BehaviorsDocs, MODULE_DESCRIPTIONS, BEHAVIOR_CATEGORY_DESCRIPTIONS, humanizeOperatorName, humanizeReturnType, formatArity, generateOperatorDoc, generateModuleDoc, generateBehaviorDoc, generateModulesDocs, generateBehaviorsDocs, generateStdLibDocs, } from './docs-generator.js';
