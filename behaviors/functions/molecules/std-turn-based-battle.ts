/**
 * std-turn-based-battle
 *
 * Turn-based strategy game molecule (Fire Emblem, XCOM style).
 * Composes game atoms into a two-trait orbital:
 *
 * 1. BattleFlow trait (primary): menu -> playing -> paused -> gameover
 *    Renders game-menu, game-hud + combat-log, game-over-screen per state.
 * 2. BattleLog trait (secondary): idle state, combat-log pattern.
 *    Only renders when LOG_EVENT fires from the shared event bus.
 *
 * Composition pattern: extractTrait from atom orbitals, assemble into
 * one orbital with one shared entity and one page.
 *
 * @level molecule
 * @family game
 * @packageDocumentation
 *
 * @deprecated The TypeScript factory layer is deprecated as of Phase F.10
 * (2026-04-08). The canonical source for std behaviors is now the registry
 * `.orb` file at `packages/almadar-std/behaviors/registry/<level>/<name>.orb`,
 * which is generated from this TS source by `tools/almadar-behavior-ts-to-orb/`
 * and consumed by the compiler's embedded loader.
 *
 * Consumers should import behaviors via `.lolo`/`.orb` `uses` declarations and
 * reference them as `Alias.entity` / `Alias.traits.X` / `Alias.pages.X`, applying
 * overrides at the call site (`linkedEntity`, `name`, `events`, `effects`,
 * `listens`, `emitsScope`). The TS `*Params` interface and the exported factory
 * functions remain ONLY as the authoring path for the converter; they are NOT a
 * stable public API and may change without notice.
 *
 * See `docs/Almadar_Orb_Behaviors.md` for the orbital-as-function model and
 * `docs/LOLO_Gaps.md` for the migration plan.
 */

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, plural, extractTrait, makeSchema, } from '@almadar/core/builders';
import { stdCombatLog } from '../atoms/std-combat-log.js';

// ============================================================================
// Params
// ============================================================================

export interface StdTurnBasedBattleParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Game config
  gameTitle?: string;
  boardWidth?: number;
  boardHeight?: number;

  // Labels
  menuSubtitle?: string;
  pauseTitle?: string;
  gameoverTitle?: string;

  // Combat log
  logTitle?: string;
  logMaxVisible?: number;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface BattleConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  battleTraitName: string;
  logTraitName: string;
  gameTitle: string;
  boardWidth: number;
  boardHeight: number;
  menuSubtitle: string;
  pauseTitle: string;
  gameoverTitle: string;
  logTitle: string;
  logMaxVisible: number;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdTurnBasedBattleParams): BattleConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const p = plural(entityName);

  // Domain fields required by render-ui bindings (@entity.turn, @entity.score)
  const domainFields: EntityField[] = [
    { name: 'turn', type: 'number', default: 0 },
    { name: 'score', type: 'number', default: 0 },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = [...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))];

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    battleTraitName: `${entityName}BattleFlow`,
    logTraitName: `${entityName}CombatLog`,
    gameTitle: params.gameTitle ?? 'Battle Arena',
    boardWidth: params.boardWidth ?? 8,
    boardHeight: params.boardHeight ?? 8,
    menuSubtitle: params.menuSubtitle ?? 'Turn-Based Strategy',
    pauseTitle: params.pauseTitle ?? 'Paused',
    gameoverTitle: params.gameoverTitle ?? 'Battle Over',
    logTitle: params.logTitle ?? 'Combat Log',
    logMaxVisible: params.logMaxVisible ?? 10,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// BattleFlow trait (primary state machine)
// ============================================================================

function buildBattleFlowTrait(c: BattleConfig): Trait {
  const { entityName, gameTitle, menuSubtitle, pauseTitle, gameoverTitle } = c;

  // menu state: game-menu with Start Battle button
  const menuUI = {
    type: 'game-menu',
    title: gameTitle,
    subtitle: menuSubtitle,
    menuItems: [
      { label: 'Start Battle', event: 'START', variant: 'primary' },
    ],
  };

  // playing state: game-hud showing turn/score stats
  const playingUI = {
    type: 'game-hud',
    stats: [
      { label: 'Turn', value: '@entity.turn' },
      { label: 'Score', value: '@entity.score' },
    ],
  };

  // paused state: game-menu in modal with Resume/Quit
  const pausedModalUI = {
    type: 'game-menu',
    title: pauseTitle,
    menuItems: [
      { label: 'Resume', event: 'RESUME', variant: 'primary' },
      { label: 'Quit', event: 'RESTART', variant: 'ghost' },
    ],
  };

  // gameover state: game-over-screen with final stats
  const gameoverUI = {
    type: 'game-over-screen',
    title: gameoverTitle,
    stats: [
      { label: 'Turns', value: '@entity.turn' },
      { label: 'Score', value: '@entity.score' },
    ],
    menuItems: [
      { label: 'Play Again', event: 'RESTART', variant: 'primary' },
      { label: 'Main Menu', event: 'RESTART', variant: 'secondary' },
    ],
  };

  return {
    name: c.battleTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'menu', isInitial: true },
        { name: 'playing' },
        { name: 'paused' },
        { name: 'gameover' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'START', name: 'Start Battle' },
        { key: 'END_TURN', name: 'End Turn' },
        { key: 'PAUSE', name: 'Pause' },
        { key: 'RESUME', name: 'Resume' },
        { key: 'GAME_OVER', name: 'Game Over' },
        { key: 'RESTART', name: 'Restart' },
        { key: 'CLOSE', name: 'Close' },
        { key: 'NAVIGATE', name: 'Navigate' },
      ],
      transitions: [
        // INIT: menu -> menu (fetch entity, render menu)
        {
          from: 'menu', to: 'menu', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', menuUI],
          ],
        },
        // START: menu -> playing
        {
          from: 'menu', to: 'playing', event: 'START',
          effects: [['render-ui', 'main', playingUI]],
        },
        // END_TURN: playing -> playing (increment turn)
        {
          from: 'playing', to: 'playing', event: 'END_TURN',
          effects: [
            ['set', '@entity.turn', ['+', '@entity.turn', 1]],
            ['render-ui', 'main', playingUI],
          ],
        },
        // NAVIGATE: self-loops (game-menu emits NAVIGATE internally)
        {
          from: 'menu', to: 'menu', event: 'NAVIGATE',
          effects: [],
        },
        {
          from: 'paused', to: 'paused', event: 'NAVIGATE',
          effects: [],
        },
        // PAUSE: playing -> paused (modal)
        {
          from: 'playing', to: 'paused', event: 'PAUSE',
          effects: [['render-ui', 'modal', pausedModalUI]],
        },
        // RESUME: paused -> playing (dismiss modal, re-render main)
        {
          from: 'paused', to: 'playing', event: 'RESUME',
          effects: [['render-ui', 'modal', null], ['render-ui', 'main', playingUI]],
        },
        // CLOSE: paused -> playing (modal exit requirement)
        {
          from: 'paused', to: 'playing', event: 'CLOSE',
          effects: [['render-ui', 'modal', null], ['render-ui', 'main', playingUI]],
        },
        // GAME_OVER: playing -> gameover
        {
          from: 'playing', to: 'gameover', event: 'GAME_OVER',
          effects: [['render-ui', 'main', gameoverUI]],
        },
        // RESTART: gameover -> menu
        {
          from: 'gameover', to: 'menu', event: 'RESTART',
          effects: [['render-ui', 'main', menuUI]],
        },
        // RESTART: paused -> menu
        {
          from: 'paused', to: 'menu', event: 'RESTART',
          effects: [
            ['render-ui', 'modal', null],
            ['render-ui', 'main', menuUI],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// BattleLog trait (extracted from stdCombatLog atom, INIT render removed)
// ============================================================================

function buildBattleLogTrait(c: BattleConfig): Trait {
  const logTrait = extractTrait(stdCombatLog({
    entityName: c.entityName,
    fields: c.fields,
    title: c.logTitle,
    maxVisible: c.logMaxVisible,
    autoScroll: true,
    showTimestamps: true,
  }));

  // Override the name to avoid collision with standalone combat-log
  logTrait.name = c.logTraitName;

  // Remove the INIT transition's render-ui effect so the log does not
  // render to main on page load (the BattleFlow trait owns main).
  // Keep the fetch so entity data is ready when LOG_EVENT fires.
  const sm = logTrait.stateMachine;
  if (sm && 'transitions' in sm) {
    const transitions = sm.transitions as Array<{
      event: string;
      effects: unknown[];
    }>;
    for (const t of transitions) {
      if (t.event === 'INIT') {
        t.effects = t.effects.filter(e =>
          !(Array.isArray(e) && e[0] === 'render-ui'),
        );
      }
    }
  }

  return logTrait;
}

// ============================================================================
// Entity, Page builders
// ============================================================================

function buildEntity(c: BattleConfig): Entity {
  const instances = [
    { id: 'unit-1', name: 'Knight', description: 'Armored warrior', status: 'active', turn: 0, score: 0 },
    { id: 'unit-2', name: 'Archer', description: 'Ranged attacker', status: 'active', turn: 0, score: 0 },
    { id: 'unit-3', name: 'Mage', description: 'Magic caster', status: 'active', turn: 0, score: 0 },
  ];
  return makeEntity({
    name: c.entityName,
    fields: c.fields,
    persistence: c.persistence,
    collection: c.collection,
    instances,
  });
}

function buildPage(c: BattleConfig): Page {
  return {
    name: c.pageName,
    path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.battleTraitName },
      { ref: c.logTraitName },
    ],
  } as Page;
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdTurnBasedBattleEntity(params: StdTurnBasedBattleParams): Entity {
  return buildEntity(resolve(params));
}

export function stdTurnBasedBattleTrait(params: StdTurnBasedBattleParams): Trait {
  return buildBattleFlowTrait(resolve(params));
}

export function stdTurnBasedBattlePage(params: StdTurnBasedBattleParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdTurnBasedBattle(params: StdTurnBasedBattleParams): OrbitalSchema {
  const c = resolve(params);

  const battleFlowTrait = buildBattleFlowTrait(c);
  const battleLogTrait = buildBattleLogTrait(c);
  const entity = buildEntity(c);
  const page = buildPage(c);

  return makeSchema(`${c.entityName}Orbital`, {
    name: `${c.entityName}Orbital`,
    entity,
    traits: [battleFlowTrait, battleLogTrait],
    pages: [page],
  } as OrbitalDefinition);
}
