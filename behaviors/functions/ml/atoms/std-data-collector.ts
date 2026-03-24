/**
 * std-data-collector as a Function
 *
 * Buffer accumulation behavior parameterized for any ML domain.
 * Collects data points into a buffer and emits when the buffer is full.
 * Generalized version of the ExperienceCollector from constrained-learner.orb.
 *
 * @level atom
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdDataCollectorParams {
  /** Entity name in PascalCase (e.g., "Experience", "Sample") */
  entityName: string;
  /** Fields per data point (id is auto-added) */
  fields: EntityField[];
  /** Buffer capacity: emit readyEvent when this many points are collected */
  bufferSize: number;
  /** Event to submit a data point (default: "DATA_POINT") */
  collectEvent?: string;
  /** Event emitted when buffer reaches capacity (default: "BUFFER_READY") */
  readyEvent?: string;
  /** Persistence mode */
  persistence?: 'runtime';

  // Page
  /** Page name (defaults to "{Entity}CollectorPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/collect") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface DataCollectorConfig {
  entityName: string;
  fields: EntityField[];
  bufferSize: number;
  collectEvent: string;
  readyEvent: string;
  persistence: 'runtime';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdDataCollectorParams): DataCollectorConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure buffer-related fields exist on entity
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'buffer') ? [] : [{ name: 'buffer', type: 'array' as const, default: [] }]),
    ...(baseFields.some(f => f.name === 'count') ? [] : [{ name: 'count', type: 'number' as const, default: 0 }]),
  ];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    bufferSize: params.bufferSize,
    collectEvent: params.collectEvent ?? 'DATA_POINT',
    readyEvent: params.readyEvent ?? 'BUFFER_READY',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}DataCollector`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}CollectorPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/collect`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: DataCollectorConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: DataCollectorConfig): Trait {
  const { entityName, collectEvent, readyEvent, bufferSize } = c;

  // Collecting view: buffer stats + progress
  const collectingView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'database', size: 'lg' },
          { type: 'typography', content: entityName, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'stat-display', label: 'Collected', value: '@entity.count' },
      { type: 'progress-bar', value: '@entity.count', max: bufferSize, showPercentage: true },
      { type: 'typography', variant: 'body', color: 'muted',
        content: `Collecting data points. Buffer emits at ${bufferSize}.` },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [readyEvent],
    stateMachine: {
      states: [
        { name: 'collecting', isInitial: true },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: collectEvent, name: 'Collect Data Point' },
        { key: readyEvent, name: 'Buffer Ready' },
      ],
      transitions: [
        // INIT: collecting -> collecting
        {
          from: 'collecting', to: 'collecting', event: 'INIT',
          effects: [
            ['set', '@entity.count', 0],
            ['set', '@entity.buffer', []],
            ['render-ui', 'main', collectingView],
          ],
        },
        // collectEvent: collecting -> collecting (buffer not full, append)
        {
          from: 'collecting', to: 'collecting', event: collectEvent,
          guard: ['<', '@entity.count', bufferSize],
          effects: [
            ['set', '@entity.buffer', ['array/append', '@entity.buffer', '@payload']],
            ['set', '@entity.count', ['+', '@entity.count', 1]],
            ['render-ui', 'main', collectingView],
          ],
        },
        // collectEvent: collecting -> collecting (buffer full, emit and reset)
        {
          from: 'collecting', to: 'collecting', event: collectEvent,
          guard: ['>=', '@entity.count', bufferSize],
          effects: [
            ['emit', readyEvent, { buffer: '@entity.buffer' }],
            ['set', '@entity.buffer', []],
            ['set', '@entity.count', 0],
            ['render-ui', 'main', collectingView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: DataCollectorConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdDataCollectorEntity(params: StdDataCollectorParams): Entity {
  return buildEntity(resolve(params));
}

export function stdDataCollectorTrait(params: StdDataCollectorParams): Trait {
  return buildTrait(resolve(params));
}

export function stdDataCollectorPage(params: StdDataCollectorParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdDataCollector(params: StdDataCollectorParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
