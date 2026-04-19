/**
 * Core Module - Language Primitives
 *
 * The 28 unnamespaced S-expression operators that form the .orb language core:
 * arithmetic primitives, comparison, logic, control flow, and effects.
 *
 * These operators existed in the retired `@almadar/operators` package prior to
 * its merge into `@almadar/std`. They live here alongside the library modules
 * (math, str, array, etc.) so the whole operator surface has one home.
 *
 * Effect operators declare rich Schema v2 params and effect metadata so
 * validators, LLM prompt generators, and the Rust compiler can reason about
 * shapes (literal unions for persist actions, UISlot for render-ui, event keys
 * for emit) instead of relying on string heuristics.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';

// ============================================================================
// Shared type refs
// ============================================================================

const NUMBER: OperatorTypeRef = 'number';
const BOOLEAN: OperatorTypeRef = 'boolean';
const STRING: OperatorTypeRef = 'string';
const ANY: OperatorTypeRef = 'any';
const SEXPR: OperatorTypeRef = { kind: 'sexpr' };
const BINDING: OperatorTypeRef = { kind: 'binding' };
const ENTITY_REF: OperatorTypeRef = { kind: 'entityRef' };
const EVENT_KEY: OperatorTypeRef = { kind: 'eventKey' };
const UI_SLOT: OperatorTypeRef = { kind: 'uiSlot' };
const PATTERN_TYPE: OperatorTypeRef = { kind: 'patternType' };

const PERSIST_ACTION: OperatorTypeRef = {
  kind: 'union',
  of: [
    { kind: 'literal', value: 'create' },
    { kind: 'literal', value: 'update' },
    { kind: 'literal', value: 'delete' },
    { kind: 'literal', value: 'clear' },
    { kind: 'literal', value: 'batch' },
  ],
};

const SET_OPERATION: OperatorTypeRef = {
  kind: 'union',
  of: [
    { kind: 'literal', value: 'increment' },
    { kind: 'literal', value: 'decrement' },
    { kind: 'literal', value: 'multiply' },
    { kind: 'literal', value: 'append' },
    { kind: 'literal', value: 'remove' },
  ],
};

const NOTIFY_CHANNEL: OperatorTypeRef = {
  kind: 'union',
  of: [
    { kind: 'literal', value: 'email' },
    { kind: 'literal', value: 'push' },
    { kind: 'literal', value: 'sms' },
    { kind: 'literal', value: 'in_app' },
  ],
};

// ============================================================================
// Core operators
// ============================================================================

export const CORE_OPERATORS: Record<string, StdOperatorMeta> = {
  // --- arithmetic primitives --------------------------------------------------

  '+': {
    module: 'core',
    category: 'arithmetic',
    minArity: 2,
    maxArity: null,
    description: 'Add numbers',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: '...nums', type: NUMBER, description: 'Numbers to sum' }],
    example: '["+", 1, 2, 3] // => 6',
  },
  '-': {
    module: 'core',
    category: 'arithmetic',
    minArity: 1,
    maxArity: 2,
    description: 'Subtract or negate',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'a', type: NUMBER, description: 'Left operand or value to negate' },
      { name: 'b', type: NUMBER, description: 'Right operand', optional: true },
    ],
    example: '["-", 5, 2] // => 3; ["-", 5] // => -5',
  },
  '*': {
    module: 'core',
    category: 'arithmetic',
    minArity: 2,
    maxArity: null,
    description: 'Multiply numbers',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: '...nums', type: NUMBER, description: 'Numbers to multiply' }],
    example: '["*", 2, 3, 4] // => 24',
  },
  '/': {
    module: 'core',
    category: 'arithmetic',
    minArity: 2,
    maxArity: 2,
    description: 'Divide numbers',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'a', type: NUMBER, description: 'Numerator' },
      { name: 'b', type: NUMBER, description: 'Denominator' },
    ],
    example: '["/", 10, 2] // => 5',
  },
  '%': {
    module: 'core',
    category: 'arithmetic',
    minArity: 2,
    maxArity: 2,
    description: 'Modulo (remainder)',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'a', type: NUMBER, description: 'Dividend' },
      { name: 'b', type: NUMBER, description: 'Divisor' },
    ],
    example: '["%", 10, 3] // => 1',
  },

  // --- comparison -------------------------------------------------------------

  '=': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Equal to',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: ANY, description: 'Left operand' },
      { name: 'b', type: ANY, description: 'Right operand' },
    ],
    example: '["=", "@entity.status", "active"]',
  },
  '!=': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Not equal to',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: ANY, description: 'Left operand' },
      { name: 'b', type: ANY, description: 'Right operand' },
    ],
    example: '["!=", "@entity.id", null]',
  },
  '<': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Less than',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: NUMBER, description: 'Left operand' },
      { name: 'b', type: NUMBER, description: 'Right operand' },
    ],
    example: '["<", "@entity.health", 10]',
  },
  '>': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Greater than',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: NUMBER, description: 'Left operand' },
      { name: 'b', type: NUMBER, description: 'Right operand' },
    ],
    example: '[">", "@entity.score", 0]',
  },
  '<=': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Less than or equal',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: NUMBER, description: 'Left operand' },
      { name: 'b', type: NUMBER, description: 'Right operand' },
    ],
    example: '["<=", "@entity.count", 100]',
  },
  '>=': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Greater than or equal',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: NUMBER, description: 'Left operand' },
      { name: 'b', type: NUMBER, description: 'Right operand' },
    ],
    example: '[">=", "@entity.age", 18]',
  },

  // --- logic ------------------------------------------------------------------

  and: {
    module: 'core',
    category: 'logic',
    minArity: 2,
    maxArity: null,
    description: 'Logical AND',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [{ name: '...conds', type: BOOLEAN, description: 'Boolean expressions to AND' }],
    example: '["and", ["=", "@entity.active", true], [">", "@entity.score", 0]]',
  },
  or: {
    module: 'core',
    category: 'logic',
    minArity: 2,
    maxArity: null,
    description: 'Logical OR',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [{ name: '...conds', type: BOOLEAN, description: 'Boolean expressions to OR' }],
    example: '["or", ["=", "@entity.role", "admin"], ["=", "@entity.role", "owner"]]',
  },
  not: {
    module: 'core',
    category: 'logic',
    minArity: 1,
    maxArity: 1,
    description: 'Logical NOT',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [{ name: 'cond', type: BOOLEAN, description: 'Boolean to negate' }],
    example: '["not", "@entity.disabled"]',
  },
  if: {
    module: 'core',
    category: 'logic',
    minArity: 3,
    maxArity: 3,
    description: 'Conditional expression (ternary)',
    hasSideEffects: false,
    returnType: 'any',
    params: [
      { name: 'cond', type: BOOLEAN, description: 'Condition to evaluate' },
      { name: 'then', type: ANY, description: 'Value or effect if true' },
      { name: 'else', type: ANY, description: 'Value or effect if false' },
    ],
    example: '["if", [">", "@entity.health", 0], "alive", "dead"]',
  },

  // --- control ----------------------------------------------------------------

  let: {
    module: 'core',
    category: 'control',
    minArity: 2,
    maxArity: 2,
    description: 'Bind local variables for a body expression',
    hasSideEffects: false,
    returnType: 'any',
    params: [
      {
        name: 'bindings',
        type: { kind: 'array', of: { kind: 'array', of: ANY } },
        description: 'Array of [name, value] pairs',
      },
      { name: 'body', type: SEXPR, description: 'Expression or effect list using the bindings' },
    ],
    example: '["let", [["x", 10]], ["+", "x", 1]]',
  },
  do: {
    module: 'core',
    category: 'control',
    minArity: 1,
    maxArity: null,
    description: 'Sequential execution of multiple effects/expressions',
    hasSideEffects: false,
    returnType: 'any',
    params: [{ name: '...exprs', type: SEXPR, description: 'Effects/expressions to run in order' }],
    example: '["do", ["set", "@entity.x", 0], ["set", "@entity.y", 0]]',
  },
  when: {
    module: 'core',
    category: 'control',
    minArity: 2,
    maxArity: 2,
    description: 'Conditional effect without an else branch',
    hasSideEffects: false,
    returnType: 'void',
    params: [
      { name: 'cond', type: BOOLEAN, description: 'Guard expression' },
      { name: 'effect', type: SEXPR, description: 'Effect to run if cond is true' },
    ],
    example: '["when", [">", "@entity.health", 0], ["emit", "ALIVE"]]',
  },
  fn: {
    module: 'core',
    category: 'control',
    minArity: 2,
    maxArity: 2,
    description: 'Lambda expression (used for per-item renders and transforms)',
    hasSideEffects: false,
    returnType: 'function',
    acceptsLambda: true,
    lambdaArgPosition: 1,
    params: [
      { name: 'paramName', type: STRING, description: 'Name of the parameter binding' },
      { name: 'body', type: SEXPR, description: 'Expression evaluated per invocation' },
    ],
    example: '["fn", "item", { "type": "typography", "content": "@item.title" }]',
  },

  // --- effect -----------------------------------------------------------------

  set: {
    module: 'core',
    category: 'effect',
    minArity: 2,
    maxArity: 2,
    description: 'Set a binding to a value',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'binding', type: BINDING, description: 'Target binding (e.g. "@entity.field")' },
      { name: 'value', type: ANY, description: 'Value to assign (literal or expression)' },
    ],
    example: '["set", "@entity.health", 100]',
    effect: {
      kind: 'set',
      config: { operation: SET_OPERATION },
    },
  },
  emit: {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description: 'Emit an event onto the bus',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'event', type: EVENT_KEY, description: 'Event key' },
      { name: 'payload', type: ENTITY_REF, description: 'Optional payload', optional: true },
    ],
    example: '["emit", "PLAYER_DIED", { "playerId": "@entity.id" }]',
    effect: {
      kind: 'emit',
      produces: {
        kind: 'object',
        fields: { event: EVENT_KEY, payload: ANY },
        open: true,
      },
    },
  },
  persist: {
    module: 'core',
    category: 'effect',
    minArity: 2,
    maxArity: 3,
    description: 'Create, update, delete, clear, or batch entity records',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'action', type: PERSIST_ACTION, description: 'Persist action' },
      { name: 'entity', type: { kind: 'entity' }, description: 'Target entity name' },
      { name: 'data', type: ENTITY_REF, description: 'Payload (create/update) or entity id (delete)', optional: true },
    ],
    example: '["persist", "create", "Task", { "title": "@payload.title" }]',
    effect: { kind: 'persist' },
  },
  navigate: {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description: 'Navigate to a route',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'path', type: STRING, description: 'Route path (supports :param placeholders)' },
      {
        name: 'params',
        type: { kind: 'object', fields: {}, open: true },
        description: 'Optional route params',
        optional: true,
      },
    ],
    example: '["navigate", "/tasks/:id", { "id": "@entity.id" }]',
    effect: { kind: 'navigate' },
  },
  notify: {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description: 'Show a notification (in-app, email, push, sms)',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'channel', type: NOTIFY_CHANNEL, description: 'Delivery channel' },
      { name: 'message', type: STRING, description: 'Message body', optional: true },
    ],
    example: '["notify", "in_app", "Task created successfully"]',
    effect: { kind: 'notify' },
  },
  spawn: {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description: 'Spawn a new entity instance (games)',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'entity', type: { kind: 'entity' }, description: 'Entity name to spawn' },
      {
        name: 'initialState',
        type: { kind: 'object', fields: {}, open: true },
        description: 'Initial field values',
        optional: true,
      },
    ],
    example: '["spawn", "Bullet", { "x": "@entity.x", "y": "@entity.y" }]',
    effect: { kind: 'spawn' },
  },
  despawn: {
    module: 'core',
    category: 'effect',
    minArity: 0,
    maxArity: 1,
    description: 'Despawn an entity instance (games)',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'entityId', type: STRING, description: 'Target entity id (defaults to @entity.id)', optional: true },
    ],
    example: '["despawn", "@entity.id"]',
    effect: { kind: 'despawn' },
  },
  'call-service': {
    module: 'core',
    category: 'effect',
    minArity: 2,
    maxArity: 3,
    description: 'Invoke an external service action',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'service', type: STRING, description: 'Service name (e.g. "llm", "stripe")' },
      { name: 'action', type: STRING, description: 'Service action (e.g. "generate", "charge")' },
      {
        name: 'params',
        type: { kind: 'object', fields: {}, open: true },
        description: 'Service-specific params',
        optional: true,
      },
    ],
    example: '["call-service", "llm", "generate", { "userPrompt": "@entity.inputText" }]',
    effect: { kind: 'call-service' },
  },
  'render-ui': {
    module: 'core',
    category: 'effect',
    minArity: 2,
    maxArity: 3,
    description: 'Render a pattern into a UI slot',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'slot', type: UI_SLOT, description: 'Target UI slot (main, sidebar, modal, hud, ...)' },
      {
        name: 'pattern',
        type: {
          kind: 'union',
          of: [
            { kind: 'object', fields: { patternType: PATTERN_TYPE }, open: true },
            { kind: 'literal', value: null as unknown as string },
          ],
        },
        description: 'Pattern config (or null to clear the slot)',
      },
      {
        name: 'props',
        type: { kind: 'object', fields: {}, open: true },
        description: 'Extra props forwarded to the pattern',
        optional: true,
      },
    ],
    example: '["render-ui", "main", { "patternType": "entity-table", "columns": ["name"] }]',
    effect: { kind: 'render-ui' },
  },
};

/**
 * Get all core operator names.
 */
export function getCoreOperators(): string[] {
  return Object.keys(CORE_OPERATORS);
}
