/**
 * std-agent-token-gauge
 *
 * Token usage display atom with threshold-based state transitions.
 * Shows current token count, usage percentage, and progress bar.
 * Transitions from normal -> warning -> critical based on configurable
 * thresholds. Provides compact and reset actions.
 *
 * @level atom
 * @family agent
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

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentTokenGaugeParams {
  /** Entity name in PascalCase (default: "TokenUsage") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, token usage fields are always included) */
  fields?: EntityField[];
  /** Usage fraction at which to enter warning state (default: 0.85) */
  threshold?: number;
  /** Maximum token count (default: 180000) */
  maxTokens?: number;
  /** Persistence mode (default: "runtime") */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Page name override */
  pageName?: string;
  /** Page path override */
  pagePath?: string;
  /** Whether this page is the initial route */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface TokenGaugeConfig {
  entityName: string;
  fields: EntityField[];
  threshold: number;
  maxTokens: number;
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentTokenGaugeParams): TokenGaugeConfig {
  const entityName = params.entityName ?? 'TokenUsage';
  const p = plural(entityName);
  const threshold = params.threshold ?? 0.85;
  const maxTokens = params.maxTokens ?? 180000;

  const requiredFields: EntityField[] = [
    { name: 'current', type: 'number', default: 0 },
    { name: 'max', type: 'number', default: maxTokens },
    { name: 'threshold', type: 'number', default: threshold },
    { name: 'lastCompactedAt', type: 'string', default: '' },
  ];
  const baseFields = params.fields ?? [];
  const existingNames = new Set(baseFields.map(f => f.name));
  const mergedFields = [
    ...baseFields,
    ...requiredFields.filter(f => !existingNames.has(f.name)),
  ];
  const fields = ensureIdField(mergedFields);

  return {
    entityName,
    fields,
    threshold,
    maxTokens,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Gauge`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: TokenGaugeConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: TokenGaugeConfig): Trait {
  const { entityName, threshold } = c;

  const normalUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'gauge', size: 'lg' },
          { type: 'typography', content: 'Token Usage', variant: 'h2' },
          { type: 'badge', label: 'Normal', variant: 'default' },
        ],
      },
      { type: 'divider' },
      { type: 'progress-bar', value: '@entity.current', max: '@entity.max' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'stat-display', label: 'Tokens Used', value: '@entity.current' },
          { type: 'stat-display', label: 'Max Tokens', value: '@entity.max' },
        ],
      },
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const warningUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'alert-triangle', size: 'lg' },
          { type: 'typography', content: 'Token Usage', variant: 'h2' },
          { type: 'badge', label: 'Warning', variant: 'warning' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'warning', message: 'Token usage approaching limit. Consider compacting.' },
      { type: 'progress-bar', value: '@entity.current', max: '@entity.max' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'stat-display', label: 'Tokens Used', value: '@entity.current' },
          { type: 'stat-display', label: 'Max Tokens', value: '@entity.max' },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Compact', event: 'COMPACT', variant: 'primary', icon: 'minimize-2' },
          { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
    ],
  };

  const criticalUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'alert-octagon', size: 'lg' },
          { type: 'typography', content: 'Token Usage', variant: 'h2' },
          { type: 'badge', label: 'Critical', variant: 'destructive' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'error', message: 'Token usage critical. Compact immediately to avoid truncation.' },
      { type: 'progress-bar', value: '@entity.current', max: '@entity.max' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'stat-display', label: 'Tokens Used', value: '@entity.current' },
          { type: 'stat-display', label: 'Max Tokens', value: '@entity.max' },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Compact Now', event: 'COMPACT', variant: 'primary', icon: 'minimize-2' },
          { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'normal', isInitial: true },
        { name: 'warning' },
        { name: 'critical' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'UPDATE', name: 'Update Token Count', payload: [
          { name: 'current', type: 'number', required: true },
        ]},
        { key: 'COMPACT', name: 'Compact Context' },
        { key: 'RESET', name: 'Reset Gauge' },
      ],
      transitions: [
        // INIT
        {
          from: 'normal', to: 'normal', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', normalUI],
          ],
        },
        // UPDATE: normal -> normal (below threshold)
        {
          from: 'normal', to: 'normal', event: 'UPDATE',
          guard: ['<', ['/', '@payload.current', '@entity.max'], threshold],
          effects: [
            ['set', '@entity.current', '@payload.current'],
            ['render-ui', 'main', normalUI],
          ],
        },
        // UPDATE: normal -> warning (at or above threshold, below 0.95)
        {
          from: 'normal', to: 'warning', event: 'UPDATE',
          guard: ['and',
            ['>=', ['/', '@payload.current', '@entity.max'], threshold],
            ['<', ['/', '@payload.current', '@entity.max'], 0.95],
          ],
          effects: [
            ['set', '@entity.current', '@payload.current'],
            ['render-ui', 'main', warningUI],
          ],
        },
        // UPDATE: normal -> critical (at or above 0.95)
        {
          from: 'normal', to: 'critical', event: 'UPDATE',
          guard: ['>=', ['/', '@payload.current', '@entity.max'], 0.95],
          effects: [
            ['set', '@entity.current', '@payload.current'],
            ['render-ui', 'main', criticalUI],
          ],
        },
        // UPDATE: warning -> warning (still between threshold and 0.95)
        {
          from: 'warning', to: 'warning', event: 'UPDATE',
          guard: ['and',
            ['>=', ['/', '@payload.current', '@entity.max'], threshold],
            ['<', ['/', '@payload.current', '@entity.max'], 0.95],
          ],
          effects: [
            ['set', '@entity.current', '@payload.current'],
            ['render-ui', 'main', warningUI],
          ],
        },
        // UPDATE: warning -> critical (at or above 0.95)
        {
          from: 'warning', to: 'critical', event: 'UPDATE',
          guard: ['>=', ['/', '@payload.current', '@entity.max'], 0.95],
          effects: [
            ['set', '@entity.current', '@payload.current'],
            ['render-ui', 'main', criticalUI],
          ],
        },
        // UPDATE: warning -> normal (dropped below threshold)
        {
          from: 'warning', to: 'normal', event: 'UPDATE',
          guard: ['<', ['/', '@payload.current', '@entity.max'], threshold],
          effects: [
            ['set', '@entity.current', '@payload.current'],
            ['render-ui', 'main', normalUI],
          ],
        },
        // UPDATE: critical -> critical (still at or above 0.95)
        {
          from: 'critical', to: 'critical', event: 'UPDATE',
          guard: ['>=', ['/', '@payload.current', '@entity.max'], 0.95],
          effects: [
            ['set', '@entity.current', '@payload.current'],
            ['render-ui', 'main', criticalUI],
          ],
        },
        // UPDATE: critical -> warning (dropped between threshold and 0.95)
        {
          from: 'critical', to: 'warning', event: 'UPDATE',
          guard: ['and',
            ['>=', ['/', '@payload.current', '@entity.max'], threshold],
            ['<', ['/', '@payload.current', '@entity.max'], 0.95],
          ],
          effects: [
            ['set', '@entity.current', '@payload.current'],
            ['render-ui', 'main', warningUI],
          ],
        },
        // UPDATE: critical -> normal (dropped below threshold)
        {
          from: 'critical', to: 'normal', event: 'UPDATE',
          guard: ['<', ['/', '@payload.current', '@entity.max'], threshold],
          effects: [
            ['set', '@entity.current', '@payload.current'],
            ['render-ui', 'main', normalUI],
          ],
        },
        // COMPACT: any -> normal
        {
          from: 'normal', to: 'normal', event: 'COMPACT',
          effects: [
            ['agent/compact'],
            ['set', '@entity.lastCompactedAt', '@now'],
            ['agent/token-count'],
            ['render-ui', 'main', normalUI],
          ],
        },
        {
          from: 'warning', to: 'normal', event: 'COMPACT',
          effects: [
            ['agent/compact'],
            ['set', '@entity.lastCompactedAt', '@now'],
            ['agent/token-count'],
            ['render-ui', 'main', normalUI],
          ],
        },
        {
          from: 'critical', to: 'normal', event: 'COMPACT',
          effects: [
            ['agent/compact'],
            ['set', '@entity.lastCompactedAt', '@now'],
            ['agent/token-count'],
            ['render-ui', 'main', normalUI],
          ],
        },
        // RESET: any -> normal
        {
          from: 'normal', to: 'normal', event: 'RESET',
          effects: [
            ['set', '@entity.current', 0],
            ['render-ui', 'main', normalUI],
          ],
        },
        {
          from: 'warning', to: 'normal', event: 'RESET',
          effects: [
            ['set', '@entity.current', 0],
            ['render-ui', 'main', normalUI],
          ],
        },
        {
          from: 'critical', to: 'normal', event: 'RESET',
          effects: [
            ['set', '@entity.current', 0],
            ['render-ui', 'main', normalUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: TokenGaugeConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentTokenGaugeEntity(params: StdAgentTokenGaugeParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentTokenGaugeTrait(params: StdAgentTokenGaugeParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentTokenGaugePage(params: StdAgentTokenGaugeParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentTokenGauge(params: StdAgentTokenGaugeParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
