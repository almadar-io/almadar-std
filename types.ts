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
  'std-json',
  'std-csv',
  'std-time',
  'std-format',
  'std-i18n',
  'std-nn',
  'std-tensor',
  'std-train',
  'std-prob',
  'std-os',
  'std-kv',
  'std-browser',
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
  'std-behavior-value',
  'std-program',
  'std-codec',
] as const;

export type OperatorCategory = (typeof OPERATOR_CATEGORIES)[number];

/**
 * Base metadata for an operator.
 */
/**
 * Value provenance of an operator's result: which of the call's own values the result carries. The result TYPE
 * is the signature's (`returnType`, built from the type variables of `params`); provenance is a separate fact
 * the validator's one generic value-source walk (`orbital-core` `SExpression::value_leaves`) reads to trace which
 * leaf values an expression can yield — e.g. which events a render-bound `itemActions` list can fire.
 *
 * - `'option-branch<N,key>'` — a literal boolean option selects the declared return union's false/true branch; dynamic options retain the union.
 * - `'branch-union'` — every argument after the condition (`if`).
 * - `'lambda-result'` — the body of the lambda argument (`array/map`).
 * - `'identity-of-arg<N>'` — the result IS arg N, narrowed or reordered (`array/filter`, `array/slice`,
 *   `array/sort`, `array/take`, `array/unique`, …; `let` is `identity-of-arg<1>`, its body).
 * - `'union-of-args'` — the result carries values drawn from EVERY arg (`array/concat`).
 *   `'union-of-args<i,j>'` restricts that to the listed arg indices: arg 0 is the list, the other listed index is
 *   the single element the operator adds (`array/append`/`array/prepend` are `<0,1>`, `array/insert` is `<0,2>`).
 * - `'last-of-args'` — the result is the last arg's value (`do`).
 *
 * An operator whose result elements are NOT provably drawn from its inputs (`array/range`, `array/zip`,
 * `array/groupBy`, `array/partition`, `array/flatten`) declares nothing and the walk treats it as opaque.
 */
export type ReturnSemantics =
  | `option-branch<${number},${string}>`
  | 'branch-union'
  | 'lambda-result'
  | 'identity-of-arg<0>'
  | 'identity-of-arg<1>'
  | 'union-of-args'
  | 'union-of-args<0,1>'
  | 'union-of-args<0,2>'
  | 'last-of-args';

/** Where an effect executes: a client host delegates `server` effects, a server ships `client` effects back, `any` runs wherever it is dispatched. */
export type RunsOn = 'client' | 'server' | 'any';

/** A host outside the runtime that executes an effect. */
export type EffectHost = 'program' | 'os' | 'kv';

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
  /** The result type: a concrete type, or one built from the signature's type variables */
  returnType: OperatorTypeRef;
  /**
   * For operators whose actual return type is determined at the call site
   * (input-dependent), tag with the appropriate semantics so the L2
   * validator can derive the concrete type from argument expressions.
   * Omitted when `returnType` is the fixed truth (most operators).
   * See {@link ReturnSemantics} for the catalog and gap #24 in the std
   * verification doc.
   */
  returnSemantics?: ReturnSemantics;
  /** Execution site of an effect operator; set on every `hasSideEffects` operator, absent on pure ones. */
  runsOn?: RunsOn;
  /** The host that executes this effect: `program` = the shared program host (`@almadar/runtime` `host/program` `runProgramEffect`), on both execution paths. `os` = the `os/` family, executed by the OS host under a declared grant. Absent for effects the runtime executes itself. */
  host?: EffectHost;
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
  'json',
  'csv',
  'time',
  'validate',
  'format',
  'i18n',
  'nn',
  'tensor',
  'train',
  'prob',
  'os',
  'kv',
  'browser',
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
  'program',
  'bytes',
  'bit',
  'base64',
  'hash',
  'hmac',
  'gzip',
  'brotli',
  'xml',
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
  'std-json',
  'std-csv',
  'std-time',
  'std-validate',
  'std-format',
  'std-i18n',
  'std-nn',
  'std-tensor',
  'std-train',
  'std-prob',
  'std-os',
  'std-kv',
  'std-browser',
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
  'std-behavior-value',
  'std-program',
  'std-codec',
] as const;

export type StdOperatorCategory = (typeof STD_OPERATOR_CATEGORIES)[number];

// ============================================================================
// Extended Operator Metadata
// ============================================================================

/**
 * The type language of an operator signature (`params[].type`, `returnType`, `effect.produces`).
 *
 * There are NO generic types: `any`, `unknown`, `json`, a bare `object` and a bare `array` do not exist.
 * Polymorphism is by TYPE VARIABLES, bound per call and resolved to one concrete type by the checker:
 *
 *   array/first   : [T] -> T
 *   array/append  : [T], T -> [T]
 *   =             : T, T -> boolean
 *   if            : boolean, T, T -> T
 *   array/map     : [T], (T) -> U -> [U]
 *   array/reduce  : [T], A, (A, T) -> A -> A
 *   object/get    : R, key-of R -> field-of R
 *   json/parse    : string, Shape -> Shape
 *
 * A type variable is written only in an operator signature, never in a `.lolo` program.
 *
 * A plain string names a concrete type (`'number'`, `'string'`, `'boolean'`, `'void'`, a std struct such as
 * `'tensor'`). A rest parameter (`...name`) declares the type of EACH further argument.
 */
export type OperatorTypeRef =
  | string
  | { kind: 'union'; of: OperatorTypeRef[] }
  | { kind: 'literal'; value: string | number | boolean | null }
  | { kind: 'array'; of: OperatorTypeRef }
  | { kind: 'tuple'; items: OperatorTypeRef[] }
  | { kind: 'map'; key: OperatorTypeRef; value: OperatorTypeRef }
  | { kind: 'object'; fields: Record<string, OperatorTypeRef>; open?: boolean; optional?: string[] }
  | { kind: 'entity'; collection?: string }
  | { kind: 'entityRef' }
  | { kind: 'eventKey'; scope?: 'internal' | 'external' }
  | { kind: 'uiSlot' }
  | { kind: 'patternType' }
  | { kind: 'binding'; shape?: OperatorTypeRef }
  /** An unevaluated expression; `of` is the type its value has once evaluated. */
  | { kind: 'sexpr'; of?: OperatorTypeRef }
  /** A type variable. `bound` restricts what it may bind to; `each` binds it afresh at every argument it covers (a rest parameter). */
  | { kind: 'var'; name: string; bound?: OperatorTypeRef; each?: boolean }
  /** The constraint "a record": a struct, a `Map K V` or an entity row. Only valid as a variable `bound`. */
  | { kind: 'record' }
  /** A function type: a lambda parameter `(T) -> U`, or the value of `fn`. */
  | { kind: 'fn'; params: OperatorTypeRef[]; returns: OperatorTypeRef }
  /** An argument naming a field of record variable `of` (a dot path through nested records). */
  | { kind: 'keyOf'; of: string }
  /** The type of the field of record variable `of` that the call's `keyOf` argument names. */
  | { kind: 'fieldOf'; of: string }
  /** The record `of` restricted to the fields named by the call's `[keyOf]` argument. */
  | { kind: 'pickOf'; of: string }
  /** The record `of` without the fields named by the call's `[keyOf]` argument. */
  | { kind: 'omitOf'; of: string }
  /** The record whose fields are those of every binding of the `each` variable `of`, later bindings winning. */
  | { kind: 'mergeOf'; of: string }
  /** The declared target shape of the call: an argument naming a type, which is also the result type. */
  | { kind: 'shape' }
  /** A structural fold's childResults over the record `of` (the call's shape): every field of `of` declared the shape, a list of it or a map of it, with the shape replaced by `result`. */
  | { kind: 'childrenOf'; of: string; result: string };

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
    | 'navigate-back'
    | 'notify'
    | 'spawn'
    | 'despawn'
    | 'set'
    | 'call-service'
    | 'http'
    | 'redis'
    | 'postgres'
    | 'cancel-call'
    | 'random-bytes'
    | 'credential-status'
    | 'credential-forget'
    | 'access-check'
    | 'credential-list'
    | 'credential-set'
    | 'credential-remove'
    | 'credential-test'
    | 'credential-mode'
    | 'credential-rotate'
    | 'oauth-authorize'
    | 'oauth-connection-status'
    | 'oauth-connection-forget'
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
/** How an operator is drawn in the AVL circuit notation (evaluation as signal flow). */
export const OPERATOR_VISUAL_FORMS = [
  'block', 'series', 'parallel', 'invert', 'branch', 'scope', 'template', 'conveyor', 'ladder', 'actuator',
] as const;

export type OperatorVisualForm = (typeof OPERATOR_VISUAL_FORMS)[number];

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
    /** The kernel raises when this operand is null; `orb validate` refuses a value that can be missing here. */
    rejectsNull?: boolean;
  }[];
  /** Example usage */
  example?: string;
  exampleSource?: 'module';
  /** Whether this operator accepts a lambda expression argument */
  acceptsLambda?: boolean;
  /** Position of the lambda argument (0-indexed) */
  lambdaArgPosition?: number;
  /**
   * Position of the argument naming the target entity (0-indexed), on a data
   * effect: the effect runs where that entity's rows live, so a `runsOn: server`
   * data effect on a client-resident entity runs on the client.
   */
  entityArgPosition?: number;
  /** The regex (shared dialect) a value must match: the one definition a `validate/<semantic type>` operator reads; owned by @almadar/core `SEMANTIC_STRING_PATTERNS`. */
  pattern?: string;
  /** Compile-time operator (resolved during .lolo lowering, not at runtime) */
  compileTime?: boolean;
  /** Schema v2: structured metadata for effect operators */
  effect?: OperatorEffectMeta;
  /** Circuit form, declared only where it is not derivable (lambda → conveyor, side effect → actuator, else block). */
  visual?: { form: OperatorVisualForm };
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
