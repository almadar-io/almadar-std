/**
 * Standard Library Types
 *
 * Common types and interfaces for the Orbital Standard Library.
 * Extends the core operator system with std-prefixed modules.
 *
 * @packageDocumentation
 */

// ============================================================================
// Base Operator Types (self-contained, no external dependencies)
// ============================================================================

/**
 * Operator categories for the core expression language.
 */
export const OPERATOR_CATEGORIES = [
  'arithmetic',
  'comparison',
  'logic',
  'control',
  'effect',
  'collection',
  'std-math',
  'std-str',
  'std-array',
  'std-object',
  'std-validate',
  'std-time',
  'std-format',
  'std-async',
  'std-nn',
  'std-tensor',
  'std-train',
  'std-prob',
  'std-os',
  'std-agent',
  'std-composition',
  'std-vec',
  'std-geo',
  'std-grid',
  'std-anim',
  'std-ease',
  'std-noise',
  'std-path',
  'ml-arch',
  'ml-effect',
  'ml-tensor',
  'ml-graph',
  'ml-contract',
  'ml-data',
  // Substrate categories (Almadar_Rabit_LOLO_Plan.md Phase 3)
  'std-llm',
  'std-workspace',
  'std-session',
  'std-memory',
  'std-trace',
  'std-behavior',
  'std-integration',
] as const;

export type OperatorCategory = (typeof OPERATOR_CATEGORIES)[number];

/**
 * Basic return types for core operators.
 */
export type BasicReturnType = 'number' | 'boolean' | 'string' | 'any' | 'void' | 'array';

/**
 * Base metadata for an operator.
 */
/**
 * For operators whose actual return type depends on input expressions
 * rather than being a fixed primitive (gap #24's family in
 * `docs/Almadar_Std_Verification.md`). The static `returnType` is kept
 * for back-compat with consumers that don't reason about input-dependent
 * types; the validator (L2) reads `returnSemantics` first to derive the
 * concrete type from the call site's argument expressions.
 *
 * - `'first-truthy-of-args'` — returns the first truthy argument's value
 *   (`or` semantics, NOT a boolean). Trips arithmetic-context misuse.
 * - `'last-truthy-of-args'` — returns the last truthy argument's value
 *   when all are truthy, else first falsy (`and` short-circuit).
 * - `'first-non-null-of-args'` — returns the first non-null arg's type
 *   (`coalesce` / `default` / `??`-style).
 * - `'branch-union'` — return type is union of branch result types
 *   (`if cond X Y` → `X | Y`).
 * - `'element-of-arg<N>'` — returns element type of arg at index N
 *   (`array/first arr` → element of `arr`, `array/get arr i` → element
 *   of `arr`). Suffix `?` (e.g. `'element-of-arg<0>?'`) marks
 *   nullable-when-missing (`array/find` → `T | undefined`).
 * - `'lambda-result'` — return type is the lambda's body result, with
 *   the result possibly wrapped in an array (`array/map` →
 *   `Array<ReturnTypeOf<lambda>>`, `array/reduce` →
 *   `ReturnTypeOf<lambda>` / type of `init`).
 * - `'object-key-lookup'` — return type depends on the input object
 *   shape and the literal key (`object/get`, `object/pick`).
 * - `'identity-of-arg<N>'` — return type matches the input arg at index N
 *   (`tap`, `pipe-through`).
 *
 * Operators NOT listed here keep the fixed `returnType` semantics —
 * arithmetic, math, comparisons, aggregations (`array/sum`/`avg`/`len`),
 * type coercions, all effects.
 */
export type ReturnSemantics =
  | 'first-truthy-of-args'
  | 'last-truthy-of-args'
  | 'first-non-null-of-args'
  | 'branch-union'
  | 'element-of-arg<0>'
  | 'element-of-arg<0>?'
  | 'element-of-arg<1>'
  | 'lambda-result'
  | 'object-key-lookup'
  | 'identity-of-arg<0>';

export interface OperatorMeta {
  /** Operator category */
  category: OperatorCategory;
  /** Minimum number of arguments */
  minArity: number;
  /** Maximum number of arguments (null = unlimited) */
  maxArity: number | null;
  /** Human-readable description */
  description: string;
  /** Whether this operator has side effects (only valid in effect context) */
  hasSideEffects: boolean;
  /** Return type hint - basic types for core operators, extended types for std modules */
  returnType: string;
  /**
   * For operators whose actual return type is determined at the call site
   * (input-dependent), tag with the appropriate semantics so the L2
   * validator can derive the concrete type from argument expressions.
   * Omitted when `returnType` is the fixed truth (most operators).
   * See {@link ReturnSemantics} for the catalog and gap #24 in the std
   * verification doc.
   */
  returnSemantics?: ReturnSemantics;
}

// ============================================================================
// Standard Library Categories
// ============================================================================

/**
 * Standard library module names.
 * Each module provides a set of operators prefixed with the module name.
 * E.g., 'math' provides 'math/abs', 'math/clamp', etc.
 */
export const STD_MODULES = [
  'core',
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
  'prob',
  'os',
  'agent',
  'graph',
  'contract',
  'data',
  'composition',
  'vec',
  'geo',
  'grid',
  'anim',
  'ease',
  'noise',
  'path',
  // Substrate modules (Almadar_Rabit_LOLO_Plan.md Phase 3)
  'llm',
  'workspace',
  'session',
  'memory',
  'trace',
  'behavior',
  'integration',
] as const;

export type StdModule = (typeof STD_MODULES)[number];

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
  'std-prob',
  'std-os',
  'std-agent',
  'std-composition',
  'std-vec',
  'std-geo',
  'std-grid',
  'std-anim',
  'std-ease',
  'std-noise',
  'std-path',
  'ml-arch',
  'ml-effect',
  'ml-tensor',
  'ml-graph',
  'ml-contract',
  'ml-data',
  // Substrate categories (Almadar_Rabit_LOLO_Plan.md Phase 3)
  'std-llm',
  'std-workspace',
  'std-session',
  'std-memory',
  'std-trace',
  'std-behavior',
  'std-integration',
] as const;

export type StdOperatorCategory = (typeof STD_OPERATOR_CATEGORIES)[number];

// ============================================================================
// Extended Operator Metadata
// ============================================================================

/**
 * Structured parameter type reference (Schema v2).
 *
 * A plain string (e.g. `'number'`, `'string'`) is still accepted for
 * backward compatibility with simple primitives. Richer shapes let effect
 * operators declare literal unions, UI slots, event keys, and entity refs
 * so compilers, LLM prompt generators, and validators can reason about the
 * argument shape without string heuristics.
 */
export type OperatorTypeRef =
  | string
  | { kind: 'union'; of: OperatorTypeRef[] }
  | { kind: 'literal'; value: string | number | boolean }
  | { kind: 'array'; of: OperatorTypeRef }
  | { kind: 'object'; fields: Record<string, OperatorTypeRef>; open?: boolean }
  | { kind: 'entity'; collection?: string }
  | { kind: 'entityRef' }
  | { kind: 'eventKey'; scope?: 'internal' | 'external' }
  | { kind: 'uiSlot' }
  | { kind: 'patternType' }
  | { kind: 'binding'; shape?: OperatorTypeRef }
  | { kind: 'sexpr' };

/**
 * Effect-specific metadata (Schema v2).
 * Populated only when `hasSideEffects: true`. Describes what the effect
 * produces back onto the runtime bus or state tree so consumers (Rust
 * validator, LLM skill gen, verify) can trace downstream reactions.
 */
export interface OperatorEffectMeta {
  kind:
    | 'emit'
    | 'persist'
    | 'fetch'
    | 'fetch-stream'
    | 'ref'
    | 'render-ui'
    | 'navigate'
    | 'notify'
    | 'spawn'
    | 'despawn'
    | 'set'
    | 'call-service'
    | 'log'
    | 'send-server'
    | 'custom';
  /** What the effect puts onto the bus / state when it resolves. */
  produces?: OperatorTypeRef;
  /** Effect-specific config keys and their declared types. */
  config?: Record<string, OperatorTypeRef>;
}

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
    type: OperatorTypeRef;
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
  /** Compile-time operator (resolved during .lolo lowering, not at runtime) */
  compileTime?: boolean;
  /** Schema v2: structured metadata for effect operators */
  effect?: OperatorEffectMeta;
}

/**
 * Type guard to check if an operator category is a std category.
 */
export function isStdCategory(category: string): category is StdOperatorCategory {
  return STD_OPERATOR_CATEGORIES.includes(category as StdOperatorCategory);
}

/**
 * Get the module name from a std operator name.
 * E.g., 'math/clamp' -> 'math'
 */
export function getModuleFromOperator(operator: string): StdModule | null {
  const parts = operator.split('/');
  if (parts.length !== 2) return null;
  const module = parts[0];
  return STD_MODULES.includes(module as StdModule) ? (module as StdModule) : null;
}

/**
 * Get the function name from a std operator.
 * E.g., 'math/clamp' -> 'clamp'
 */
export function getFunctionFromOperator(operator: string): string | null {
  const parts = operator.split('/');
  return parts.length === 2 ? parts[1] : null;
}

/**
 * Check if an operator name is a std library operator.
 * Std library operators are prefixed with their module name (e.g., 'math/', 'str/').
 */
export function isStdOperator(operator: string): boolean {
  return getModuleFromOperator(operator) !== null;
}

/**
 * Create a std operator name from module and function name.
 * E.g., ('math', 'clamp') -> 'math/clamp'
 */
export function makeStdOperator(module: StdModule, fn: string): string {
  return `${module}/${fn}`;
}
