/**
 * std-timer as a Function
 *
 * Timer behavior parameterized for any domain.
 * Provides a countdown timer with start, pause, resume, and reset controls.
 * The state machine structure is fixed. The caller controls data and presentation.
 *
 * @level atom
 * @family timer
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdTimerParams {
  /** Entity name in PascalCase (e.g., "Countdown", "Pomodoro") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Display
  /** Default duration in seconds */
  duration?: number;
  /** Timer title */
  timerTitle?: string;
  /** Header icon (Lucide name) */
  headerIcon?: string;

  // Page
  /** Page name (defaults to "{Entity}TimerPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/timer") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface TimerConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  duration: number;
  timerTitle: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdTimerParams): TimerConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure timer-related fields exist on entity
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'remaining') ? [] : [{ name: 'remaining', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'duration') ? [] : [{ name: 'duration', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'status') ? [] : [{ name: 'status', type: 'string' as const, default: 'idle' }]),
  ];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Timer`,
    pluralName: p,
    duration: params.duration ?? 60,
    timerTitle: params.timerTitle ?? 'Timer',
    headerIcon: params.headerIcon ?? 'clock',
    pageName: params.pageName ?? `${entityName}TimerPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/timer`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: TimerConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: TimerConfig): Trait {
  const { entityName, timerTitle, headerIcon } = c;

  // Shared timer display component — shows formatted MM:SS + label + progress track
  const timerDisplay = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: timerTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      // Large MM:SS time display — the entity.remaining field drives this
      { type: 'typography', content: '@entity.remaining', variant: 'h1' },
      // Unit/label subtitle: shows what is being timed
      { type: 'typography', content: 'seconds remaining', variant: 'caption', color: 'muted' },
      // Progress bar track — always visible, filled as timer decrements
      { type: 'progress-bar', value: '@entity.remaining', max: c.duration, color: 'primary' },
      { type: 'badge', label: '@entity.status' },
    ],
  };

  // Button sets for each state
  const idleButtons = {
    type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
    children: [
      { type: 'button', label: 'Start', event: 'START', variant: 'primary', icon: 'play' },
      // Show Pause/Reset grayed out in idle for control surface discoverability
      { type: 'button', label: 'Pause', event: 'PAUSE', variant: 'ghost', icon: 'pause', disabled: true },
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw', disabled: true },
    ],
  };

  const runningButtons = {
    type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
    children: [
      { type: 'button', label: 'Pause', event: 'PAUSE', variant: 'secondary', icon: 'pause' },
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const pausedButtons = {
    type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
    children: [
      { type: 'button', label: 'Resume', event: 'RESUME', variant: 'primary', icon: 'play' },
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const expiredButtons = {
    type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
    children: [
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'primary', icon: 'rotate-ccw' },
    ],
  };

  // Wrapper function for timer view with given buttons
  const timerView = (buttons: unknown) => ({
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [timerDisplay, buttons],
  });

  const expiredView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      timerDisplay,
      { type: 'typography', content: 'Time is up!', variant: 'h3' },
      expiredButtons,
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    ticks: [{
      name: 'countdown',
      interval: 1000,
      appliesTo: ['running'],
      guard: ['>', '@entity.remaining', 0],
      effects: [
        ['set', '@entity.remaining', ['-', '@entity.remaining', 1]],
      ],
    }],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'running' },
        { name: 'paused' },
        { name: 'expired' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'START', name: 'Start' },
        { key: 'PAUSE', name: 'Pause' },
        { key: 'RESUME', name: 'Resume' },
        { key: 'RESET', name: 'Reset' },
        { key: 'TICK', name: 'Tick' },
        { key: 'EXPIRE', name: 'Expire' },
      ],
      transitions: [
        // INIT: idle -> idle
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['render-ui', 'main', timerView(idleButtons)],
          ],
        },
        // START: idle -> running (set remaining to duration)
        {
          from: 'idle', to: 'running', event: 'START',
          effects: [
            ['set', '@entity.remaining', c.duration],
            ['set', '@entity.status', 'running'],
            ['render-ui', 'main', timerView(runningButtons)],
          ],
        },
        // TICK: running -> running
        {
          from: 'running', to: 'running', event: 'TICK',
          effects: [
            ['render-ui', 'main', timerView(runningButtons)],
          ],
        },
        // PAUSE: running -> paused
        {
          from: 'running', to: 'paused', event: 'PAUSE',
          effects: [
            ['set', '@entity.status', 'paused'],
            ['render-ui', 'main', timerView(pausedButtons)],
          ],
        },
        // RESUME: paused -> running
        {
          from: 'paused', to: 'running', event: 'RESUME',
          effects: [
            ['set', '@entity.status', 'running'],
            ['render-ui', 'main', timerView(runningButtons)],
          ],
        },
        // EXPIRE: running -> expired
        {
          from: 'running', to: 'expired', event: 'EXPIRE',
          effects: [
            ['set', '@entity.status', 'expired'],
            ['render-ui', 'main', expiredView],
          ],
        },
        // RESET: running -> idle
        {
          from: 'running', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['render-ui', 'main', timerView(idleButtons)],
          ],
        },
        // RESET: paused -> idle
        {
          from: 'paused', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['render-ui', 'main', timerView(idleButtons)],
          ],
        },
        // RESET: expired -> idle
        {
          from: 'expired', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['render-ui', 'main', timerView(idleButtons)],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: TimerConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdTimerEntity(params: StdTimerParams): Entity {
  return buildEntity(resolve(params));
}

export function stdTimerTrait(params: StdTimerParams): Trait {
  return buildTrait(resolve(params));
}

export function stdTimerPage(params: StdTimerParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdTimer(params: StdTimerParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
