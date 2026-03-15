/**
 * std-combat
 *
 * Attack cycle behavior: ready, attacking, cooldown, defeated.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level molecule
 * @family game
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdCombatParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Labels
  attackLabel?: string;

  // Icons
  headerIcon?: string;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface CombatConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  attackLabel: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdCombatParams): CombatConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    traitName: `${entityName}Combat`,
    attackLabel: params.attackLabel ?? 'Attack',
    headerIcon: params.headerIcon ?? 'swords',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: CombatConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

function buildTrait(c: CombatConfig): Trait {
  const { entityName, attackLabel } = c;

  // Ready view: game-hud with HP/Attack/Defense stats + Attack button
  const readyUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'game-hud', position: 'top',
        stats: [
          { label: 'HP', value: '@entity.hp' },
          { label: 'Attack', value: '@entity.attack' },
          { label: 'Defense', value: '@entity.defense' },
        ],
      },
      { type: 'button', label: attackLabel, event: 'ATTACK', variant: 'primary', icon: 'swords' },
    ],
  };

  // Attacking view: game-hud + Cooldown End button
  const attackingUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'game-hud', position: 'top',
        stats: [
          { label: 'HP', value: '@entity.hp' },
          { label: 'Attack', value: '@entity.attack' },
          { label: 'Defense', value: '@entity.defense' },
        ],
      },
      { type: 'button', label: 'Cooldown End', event: 'HIT', variant: 'secondary', icon: 'clock' },
    ],
  };

  // Cooldown view: game-hud + badge showing cooldown status
  const cooldownUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'game-hud', position: 'top',
        stats: [
          { label: 'HP', value: '@entity.hp' },
          { label: 'Attack', value: '@entity.attack' },
          { label: 'Defense', value: '@entity.defense' },
        ],
      },
      { type: 'badge', label: 'Cooling down...' },
    ],
  };

  // Defeated view: game-over-screen with title + Reset button
  const defeatedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'game-over-screen', title: 'Defeated', variant: 'defeat' },
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'ready', isInitial: true },
        { name: 'attacking' },
        { name: 'cooldown' },
        { name: 'defeated' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'ATTACK', name: 'Attack', payload: [{ name: 'targetId', type: 'string', required: true }] },
        { key: 'HIT', name: 'Hit', payload: [{ name: 'damage', type: 'number', required: true }] },
        { key: 'COOLDOWN_END', name: 'Cooldown End' },
        { key: 'DEFEAT', name: 'Defeat' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        // INIT: ready -> ready
        {
          from: 'ready', to: 'ready', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', readyUI],
          ],
        },
        // ATTACK: ready -> attacking
        {
          from: 'ready', to: 'attacking', event: 'ATTACK',
          effects: [['render-ui', 'main', attackingUI]],
        },
        // HIT: attacking -> cooldown
        {
          from: 'attacking', to: 'cooldown', event: 'HIT',
          effects: [['render-ui', 'main', cooldownUI]],
        },
        // COOLDOWN_END: cooldown -> ready
        {
          from: 'cooldown', to: 'ready', event: 'COOLDOWN_END',
          effects: [['render-ui', 'main', readyUI]],
        },
        // DEFEAT: attacking -> defeated
        {
          from: 'attacking', to: 'defeated', event: 'DEFEAT',
          effects: [['render-ui', 'main', defeatedUI]],
        },
        // DEFEAT: cooldown -> defeated
        {
          from: 'cooldown', to: 'defeated', event: 'DEFEAT',
          effects: [['render-ui', 'main', defeatedUI]],
        },
        // RESET: defeated -> ready
        {
          from: 'defeated', to: 'ready', event: 'RESET',
          effects: [['render-ui', 'main', readyUI]],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: CombatConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdCombatEntity(params: StdCombatParams): Entity {
  return buildEntity(resolve(params));
}

export function stdCombatTrait(params: StdCombatParams): Trait {
  return buildTrait(resolve(params));
}

export function stdCombatPage(params: StdCombatParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdCombat(params: StdCombatParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
