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

import type { OrbitalDefinition, Entity, Page, Trait, EntityField, EntityRow } from '@almadar/core/types';
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
  const fields = [
    ...c.fields.filter(f => !['type', 'message', 'timestamp', 'actorName', 'targetName', 'value', 'turn'].includes(f.name)),
    { name: 'type', type: 'string' as const, default: 'attack', values: ['attack', 'defend', 'heal', 'move', 'special', 'death', 'spawn'] },
    { name: 'message', type: 'string' as const },
    { name: 'timestamp', type: 'number' as const, default: 0 },
    { name: 'actorName', type: 'string' as const },
    { name: 'targetName', type: 'string' as const },
    { name: 'value', type: 'number' as const, default: 0 },
    { name: 'turn', type: 'number' as const, default: 1 },
  ];
  const instances = [
    { id: 'cl-1', name: 'Attack log', description: 'Warrior attacks Goblin', status: 'active', createdAt: '2026-01-01', type: 'attack', message: 'Warrior strikes Goblin for 25 damage', timestamp: 1000, actorName: 'Warrior', targetName: 'Goblin', value: 25, turn: 1 },
    { id: 'cl-2', name: 'Defend log', description: 'Paladin raises shield', status: 'active', createdAt: '2026-01-01', type: 'defend', message: 'Paladin raises shield, blocking 15 damage', timestamp: 2000, actorName: 'Paladin', targetName: 'Paladin', value: 15, turn: 1 },
    { id: 'cl-3', name: 'Heal log', description: 'Cleric heals Warrior', status: 'active', createdAt: '2026-01-01', type: 'heal', message: 'Cleric heals Warrior for 30 HP', timestamp: 3000, actorName: 'Cleric', targetName: 'Warrior', value: 30, turn: 2 },
    { id: 'cl-4', name: 'Special log', description: 'Mage casts fireball', status: 'active', createdAt: '2026-01-01', type: 'special', message: 'Mage casts Fireball dealing 40 AoE damage', timestamp: 4000, actorName: 'Mage', targetName: 'Goblin', value: 40, turn: 2 },
    { id: 'cl-5', name: 'Move log', description: 'Rogue moves to flank', status: 'active', createdAt: '2026-01-01', type: 'move', message: 'Rogue moves to flanking position', timestamp: 5000, actorName: 'Rogue', value: 0, turn: 3 },
  ];
  return makeEntity({ name: c.entityName, fields, persistence: c.persistence, instances: instances as unknown as EntityRow[] });
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
