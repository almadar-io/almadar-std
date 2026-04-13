/**
 * std-checkpoint
 *
 * Model save/load checkpoint atom.
 * Provides a ready/saving/loading lifecycle for persisting and restoring
 * model weights, with version tracking and metadata.
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

export interface StdCheckpointParams {
  /** Entity name in PascalCase (e.g., "ModelCheckpoint", "TrainingState") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Event that triggers saving (default: "SAVE_MODEL") */
  saveEvent?: string;
  /** Event that triggers loading (default: "LOAD_MODEL") */
  loadEvent?: string;
  /** Event emitted after save completes (default: "MODEL_SAVED") */
  savedEvent?: string;
  /** Event emitted after load completes (default: "MODEL_LOADED") */
  loadedEvent?: string;
  /** Persistence mode */
  persistence?: 'persistent';
  /** Page name (defaults to "{Entity}CheckpointPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/checkpoint") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface CheckpointConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent';
  traitName: string;
  pluralName: string;
  saveEvent: string;
  loadEvent: string;
  savedEvent: string;
  loadedEvent: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdCheckpointParams): CheckpointConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure checkpoint-specific fields exist on entity
  const checkpointFields: EntityField[] = [
    ...(baseFields.some(f => f.name === 'weights') ? [] : [{ name: 'weights', type: 'object' as const }]),
    ...(baseFields.some(f => f.name === 'savedAt') ? [] : [{ name: 'savedAt', type: 'string' as const }]),
    ...(baseFields.some(f => f.name === 'version') ? [] : [{ name: 'version', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'metadata') ? [] : [{ name: 'metadata', type: 'object' as const }]),
  ];

  const fields = [...baseFields, ...checkpointFields];
  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'persistent',
    traitName: `${entityName}Checkpoint`,
    pluralName: p,
    saveEvent: params.saveEvent ?? 'SAVE_MODEL',
    loadEvent: params.loadEvent ?? 'LOAD_MODEL',
    savedEvent: params.savedEvent ?? 'MODEL_SAVED',
    loadedEvent: params.loadedEvent ?? 'MODEL_LOADED',
    pageName: params.pageName ?? `${entityName}CheckpointPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/checkpoint`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: CheckpointConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: CheckpointConfig): Trait {
  const { entityName, saveEvent, loadEvent, savedEvent, loadedEvent } = c;

  // Ready view: status display with save/load actions
  const readyUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'save', size: 'lg' },
          { type: 'typography', content: `${entityName} Checkpoint`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', variant: 'body', color: 'muted',
        content: `Version: v@entity.version. Last saved: @entity.savedAt` },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Save', event: saveEvent, variant: 'primary', icon: 'save' },
          { type: 'button', label: 'Load', event: loadEvent, variant: 'secondary', icon: 'download' },
        ],
      },
    ],
  };

  // Saving view: progress indicator
  const savingUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'loading-state', title: 'Saving checkpoint', message: `Persisting ${entityName.toLowerCase()} weights...` },
      { type: 'spinner', size: 'lg' },
      { type: 'progress-bar', value: 50, showPercentage: true },
    ],
  };

  // Loading view: progress indicator
  const loadingUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'loading-state', title: 'Loading checkpoint', message: `Restoring ${entityName.toLowerCase()} weights...` },
      { type: 'spinner', size: 'lg' },
      { type: 'progress-bar', value: 50, showPercentage: true },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'ready', isInitial: true },
        { name: 'saving' },
        { name: 'loading' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: saveEvent, name: 'Save Model' },
        { key: loadEvent, name: 'Load Model', payload: [{ name: 'path', type: 'string', required: true }] },
        { key: savedEvent, name: 'Model Saved' },
        { key: loadedEvent, name: 'Model Loaded', payload: [{ name: 'weights', type: 'object', required: true }] },
      ],
      transitions: [
        // INIT: ready -> ready, render checkpoint UI
        {
          from: 'ready', to: 'ready', event: 'INIT',
          effects: [['render-ui', 'main', readyUI]],
        },
        // Save: ready -> saving
        {
          from: 'ready', to: 'saving', event: saveEvent,
          effects: [
            ['render-ui', 'main', savingUI],
            ['checkpoint/save', '@entity.checkpointPath', '@entity.weights'],
          ],
        },
        // Saved: saving -> ready, persist entity
        {
          from: 'saving', to: 'ready', event: savedEvent,
          effects: [
            ['set', '@entity.savedAt', '@now'],
            ['set', '@entity.version', ['math/add', '@entity.version', 1]],
            ['persist', 'update', entityName, '@entity'],
            ['render-ui', 'main', readyUI],
          ],
        },
        // Load: ready -> loading
        {
          from: 'ready', to: 'loading', event: loadEvent,
          effects: [
            ['render-ui', 'main', loadingUI],
            ['checkpoint/load', '@payload.path'],
          ],
        },
        // Loaded: loading -> ready, set entity weights
        {
          from: 'loading', to: 'ready', event: loadedEvent,
          effects: [
            ['set', '@entity.weights', '@payload.weights'],
            ['render-ui', 'main', readyUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: CheckpointConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdCheckpointEntity(params: StdCheckpointParams): Entity {
  return buildEntity(resolve(params));
}

export function stdCheckpointTrait(params: StdCheckpointParams): Trait {
  return buildTrait(resolve(params));
}

export function stdCheckpointPage(params: StdCheckpointParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdCheckpoint(params: StdCheckpointParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  ));
}
