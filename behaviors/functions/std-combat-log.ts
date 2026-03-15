/**
 * std-combat-log
 *
 * Scrollable combat event log atom using the `combat-log` pattern.
 * Displays timestamped combat events with icons and colors.
 * Supports appending new events and clearing the log.
 *
 * @level atom
 * @family game
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdCombatLogParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Log panel title */
  title?: string;
  /** Maximum visible events before scrolling */
  maxVisible?: number;
  /** Auto-scroll to newest event */
  autoScroll?: boolean;
  /** Show timestamps on each entry */
  showTimestamps?: boolean;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface CombatLogConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  title: string;
  maxVisible: number;
  autoScroll: boolean;
  showTimestamps: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdCombatLogParams): CombatLogConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}CombatLog`,
    title: params.title ?? 'Combat Log',
    maxVisible: params.maxVisible ?? 10,
    autoScroll: params.autoScroll ?? true,
    showTimestamps: params.showTimestamps ?? true,
    pageName: params.pageName ?? `${entityName}LogPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: CombatLogConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: CombatLogConfig): Trait {
  const { entityName, title, maxVisible, autoScroll, showTimestamps } = c;

  const logView = {
    type: 'combat-log',
    events: `@${entityName}`,
    maxVisible,
    autoScroll,
    showTimestamps,
    title,
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [{ name: 'idle', isInitial: true }],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'LOG_EVENT', name: 'Log Event', payload: [{ name: 'data', type: 'object', required: true }] },
        { key: 'CLEAR', name: 'Clear' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', logView]] },
        { from: 'idle', to: 'idle', event: 'LOG_EVENT', effects: [['render-ui', 'main', logView]] },
        { from: 'idle', to: 'idle', event: 'CLEAR', effects: [['render-ui', 'main', logView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: CombatLogConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdCombatLogEntity(params: StdCombatLogParams): Entity { return buildEntity(resolve(params)); }
export function stdCombatLogTrait(params: StdCombatLogParams): Trait { return buildTrait(resolve(params)); }
export function stdCombatLogPage(params: StdCombatLogParams): Page { return buildPage(resolve(params)); }

export function stdCombatLog(params: StdCombatLogParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
