/**
 * std-undo
 *
 * Undo/Redo atom using array operators as a stack.
 * - PUSH: appends to undoStack, clears redoStack
 * - UNDO: pops from undoStack, pushes to redoStack
 * - REDO: pops from redoStack, pushes to undoStack
 * - CLEAR: empties both stacks
 *
 * Entity fields: undoStack (array), redoStack (array), current (string)
 *
 * @level atom
 * @family undo
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdUndoParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  headerIcon?: string;
  pageTitle?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface UndoConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  headerIcon: string;
  pageTitle: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdUndoParams): UndoConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Add stack fields if not present
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'undoStack') ? [] : [{ name: 'undoStack', type: 'array' as const, default: [] }]),
    ...(baseFields.some(f => f.name === 'redoStack') ? [] : [{ name: 'redoStack', type: 'array' as const, default: [] }]),
    ...(baseFields.some(f => f.name === 'current') ? [] : [{ name: 'current', type: 'string' as const, default: '' }]),
  ];

  const p = plural(entityName);

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Undo`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'history',
    pageTitle: params.pageTitle ?? 'History',
    pageName: params.pageName ?? `${entityName}UndoPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/undo`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: UndoConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: UndoConfig): Trait {
  const { entityName, headerIcon, pageTitle } = c;

  const mainView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', align: 'center', children: [
        { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ] },
        { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
          { type: 'button', label: 'Undo', event: 'UNDO', variant: 'ghost', icon: 'undo' },
          { type: 'button', label: 'Redo', event: 'REDO', variant: 'ghost', icon: 'redo' },
          // gap-6 spacer between Redo and Clear to prevent misclicking destructive action
          { type: 'divider', orientation: 'vertical' },
          { type: 'button', label: 'Clear', event: 'CLEAR', variant: 'ghost', icon: 'trash-2' },
        ] },
      ] },
      { type: 'divider' },
      { type: 'stack', direction: 'horizontal', gap: 'md', align: 'center', children: [
        { type: 'typography', variant: 'caption', color: 'muted', content: 'Last action:' },
        { type: 'badge', label: '@entity.current' },
      ] },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [{ name: 'idle', isInitial: true }],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'PUSH', name: 'Push', payload: [{ name: 'data', type: 'string', required: true }] },
        { key: 'UNDO', name: 'Undo' },
        { key: 'REDO', name: 'Redo' },
        { key: 'CLEAR', name: 'Clear' },
      ],
      transitions: [
        // INIT
        { from: 'idle', to: 'idle', event: 'INIT', effects: [
          ['fetch', entityName],
          ['render-ui', 'main', mainView],
        ] },
        // PUSH: save current to undoStack, set current to new value, clear redoStack
        { from: 'idle', to: 'idle', event: 'PUSH', effects: [
          ['set', '@entity.undoStack', ['array/append', '@entity.undoStack', '@entity.current']],
          ['set', '@entity.current', '@payload.data'],
          ['set', '@entity.redoStack', []],
          ['render-ui', 'main', mainView],
        ] },
        // UNDO: push current to redoStack, pop last from undoStack to current
        { from: 'idle', to: 'idle', event: 'UNDO', effects: [
          ['set', '@entity.redoStack', ['array/append', '@entity.redoStack', '@entity.current']],
          ['set', '@entity.current', ['array/last', '@entity.undoStack']],
          ['set', '@entity.undoStack', ['array/slice', '@entity.undoStack', 0, -1]],
          ['render-ui', 'main', mainView],
        ] },
        // REDO: push current to undoStack, pop last from redoStack to current
        { from: 'idle', to: 'idle', event: 'REDO', effects: [
          ['set', '@entity.undoStack', ['array/append', '@entity.undoStack', '@entity.current']],
          ['set', '@entity.current', ['array/last', '@entity.redoStack']],
          ['set', '@entity.redoStack', ['array/slice', '@entity.redoStack', 0, -1]],
          ['render-ui', 'main', mainView],
        ] },
        // CLEAR: empty both stacks, clear current
        { from: 'idle', to: 'idle', event: 'CLEAR', effects: [
          ['set', '@entity.undoStack', []],
          ['set', '@entity.redoStack', []],
          ['set', '@entity.current', ''],
          ['render-ui', 'main', mainView],
        ] },
      ],
    },
  } as Trait;
}

function buildPage(c: UndoConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdUndoEntity(params: StdUndoParams): Entity { return buildEntity(resolve(params)); }
export function stdUndoTrait(params: StdUndoParams): Trait { return buildTrait(resolve(params)); }
export function stdUndoPage(params: StdUndoParams): Page { return buildPage(resolve(params)); }

export function stdUndo(params: StdUndoParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
