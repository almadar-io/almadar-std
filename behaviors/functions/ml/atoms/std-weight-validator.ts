/**
 * std-weight-validator
 *
 * Constraint checking atom for model weights.
 * Validates weight tensors against magnitude bounds, forbidden regions,
 * and required invariants. Generalizes the WeightValidator from
 * constrained-learner.orb.
 *
 * @level atom
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, makeSchema, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdWeightValidatorParams {
  /** Entity name in PascalCase (e.g., "WeightConstraint", "ModelValidator") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Constraint configuration */
  constraints: {
    maxWeightMagnitude?: number;
    forbiddenRegions?: unknown[];
    invariants?: unknown[];
  };
  /** Event that triggers validation (default: "VALIDATE_WEIGHTS") */
  validateEvent?: string;
  /** Event emitted when weights pass (default: "WEIGHTS_ACCEPTED") */
  acceptedEvent?: string;
  /** Event emitted when weights fail (default: "WEIGHTS_REJECTED") */
  rejectedEvent?: string;
  /** Persistence mode */
  persistence?: 'runtime';
  /** Page name (defaults to "{Entity}ValidatorPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/validator") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface WeightValidatorConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'runtime';
  traitName: string;
  pluralName: string;
  constraints: {
    maxWeightMagnitude: number;
    forbiddenRegions: unknown[];
    invariants: unknown[];
  };
  validateEvent: string;
  acceptedEvent: string;
  rejectedEvent: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdWeightValidatorParams): WeightValidatorConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure constraint-specific fields exist on entity
  const constraintFields: EntityField[] = [
    ...(baseFields.some(f => f.name === 'maxWeightMagnitude') ? [] : [{ name: 'maxWeightMagnitude', type: 'number' as const }]),
    ...(baseFields.some(f => f.name === 'forbiddenRegions') ? [] : [{ name: 'forbiddenRegions', type: 'array' as const }]),
    ...(baseFields.some(f => f.name === 'requiredInvariants') ? [] : [{ name: 'requiredInvariants', type: 'array' as const }]),
  ];

  const fields = [...baseFields, ...constraintFields];
  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Validator`,
    pluralName: p,
    constraints: {
      maxWeightMagnitude: params.constraints.maxWeightMagnitude ?? 10,
      forbiddenRegions: params.constraints.forbiddenRegions ?? [],
      invariants: params.constraints.invariants ?? [],
    },
    validateEvent: params.validateEvent ?? 'VALIDATE_WEIGHTS',
    acceptedEvent: params.acceptedEvent ?? 'WEIGHTS_ACCEPTED',
    rejectedEvent: params.rejectedEvent ?? 'WEIGHTS_REJECTED',
    pageName: params.pageName ?? `${entityName}ValidatorPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/validator`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: WeightValidatorConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: WeightValidatorConfig): Trait {
  const { entityName, validateEvent, acceptedEvent, rejectedEvent, constraints } = c;

  // Ready view: constraint summary with validate action
  const readyUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'shield-check', size: 'lg' },
          { type: 'typography', content: `${entityName} Validator`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', variant: 'body', color: 'muted',
        content: `Max magnitude: ${constraints.maxWeightMagnitude}. Forbidden regions: ${constraints.forbiddenRegions.length}. Invariants: ${constraints.invariants.length}.` },
      { type: 'button', label: 'Validate Weights', event: validateEvent, variant: 'primary', icon: 'check-circle' },
    ],
  };

  // Accepted view: success alert
  const acceptedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: 'Weights Accepted', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'success', message: 'All constraints satisfied. Weights are within bounds.' },
      { type: 'button', label: 'Validate Again', event: validateEvent, variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  // Rejected view: error with reason
  const rejectedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'x-circle', size: 'lg' },
          { type: 'typography', content: 'Weights Rejected', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'error', message: 'Constraint violation detected. Check weight bounds and forbidden regions.' },
      { type: 'button', label: 'Validate Again', event: validateEvent, variant: 'primary', icon: 'rotate-ccw' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'ready', isInitial: true },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: validateEvent, name: 'Validate Weights', payload: [{ name: 'weights', type: 'object', required: true }] },
        { key: acceptedEvent, name: 'Weights Accepted' },
        { key: rejectedEvent, name: 'Weights Rejected', payload: [{ name: 'reason', type: 'string', required: true }] },
      ],
      transitions: [
        // INIT: ready -> ready, render constraint summary
        {
          from: 'ready', to: 'ready', event: 'INIT',
          effects: [['render-ui', 'main', readyUI]],
        },
        // Validate (guard passes): magnitude OK AND no forbidden violations
        {
          from: 'ready', to: 'ready', event: validateEvent,
          guard: ['and',
            ['math/lte', ['math/abs', '@payload.weights'], constraints.maxWeightMagnitude],
            ['not', ['collection/some', '@entity.forbiddenRegions', ['region/contains', '@payload.weights']]],
          ],
          effects: [
            ['emit', acceptedEvent],
            ['render-ui', 'main', acceptedUI],
          ],
        },
        // Validate (guard fails): emit rejection with reason
        {
          from: 'ready', to: 'ready', event: validateEvent,
          guard: ['or',
            ['math/gt', ['math/abs', '@payload.weights'], constraints.maxWeightMagnitude],
            ['collection/some', '@entity.forbiddenRegions', ['region/contains', '@payload.weights']],
          ],
          effects: [
            ['emit', rejectedEvent, { reason: 'Constraint violation: weight magnitude or forbidden region' }],
            ['render-ui', 'main', rejectedUI],
          ],
        },
      ],
    },
    emits: [
      { event: acceptedEvent, scope: 'internal' },
      { event: rejectedEvent, scope: 'internal', payload: [{ name: 'reason', type: 'string' }] },
    ],
  } as Trait;
}

function buildPage(c: WeightValidatorConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdWeightValidatorEntity(params: StdWeightValidatorParams): Entity {
  return buildEntity(resolve(params));
}

export function stdWeightValidatorTrait(params: StdWeightValidatorParams): Trait {
  return buildTrait(resolve(params));
}

export function stdWeightValidatorPage(params: StdWeightValidatorParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdWeightValidator(params: StdWeightValidatorParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  ));
}
