/**
 * std-agent-context-window
 *
 * Context window management atom for agent token tracking.
 * Composes UI atoms (stdAgentTokenGauge for visual display,
 * stdNotification for threshold alerts) with an agent trait
 * that handles agent/compact, agent/token-count, and agent/context-usage.
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

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, makeSchema, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdAgentTokenGauge } from './std-agent-token-gauge.js';
import { stdNotification } from './std-notification.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentContextWindowParams {
  /** Entity name in PascalCase (default: "ContextWindow") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, context window fields are always included) */
  fields?: EntityField[];
  /** Persistence mode (default: "persistent") */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Token threshold percentage for approaching_limit (default: 0.85) */
  warningThreshold?: number;
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

interface ContextWindowConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  pluralName: string;
  warningThreshold: number;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentContextWindowParams): ContextWindowConfig {
  const entityName = params.entityName ?? 'ContextWindow';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'tokenCount', type: 'number', default: 0 },
    { name: 'maxTokens', type: 'number', default: 200000 },
    { name: 'usage', type: 'number', default: 0 },
    { name: 'lastCompactedAt', type: 'string', default: '' },
    { name: 'current', type: 'number', default: 0 },
    { name: 'max', type: 'number', default: 200000 },
    { name: 'threshold', type: 'number', default: 0.85 },
    { name: 'message', type: 'string', default: '' },
    { name: 'notificationType', type: 'string', default: 'info' },
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
    persistence: params.persistence ?? 'persistent',
    pluralName: p,
    warningThreshold: params.warningThreshold ?? 0.85,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ContextWindowConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildAgentTrait(c: ContextWindowConfig): Trait {
  const { entityName, warningThreshold } = c;
  const agentTraitName = `${entityName}Agent`;

  return {
    name: agentTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'SHOW', scope: 'internal' as const, payload: [
        { name: 'tokenCount', type: 'number' },
        { name: 'usage', type: 'number' },
      ]},
      { event: 'UPDATE', scope: 'internal' as const, payload: [
        { name: 'current', type: 'number' },
        { name: 'max', type: 'number' },
      ]},
    ],
    stateMachine: {
      states: [
        { name: 'normal', isInitial: true },
        { name: 'approaching_limit' },
        { name: 'at_limit' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'UPDATE_TOKENS', name: 'Update Token Count' },
        { key: 'COMPACT', name: 'Compact Context' },
      ],
      transitions: [
        {
          from: 'normal', to: 'normal', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['agent/token-count'],
            ['agent/context-usage'],
            ['render-ui', 'main', { type: 'empty-state', icon: 'layers', title: 'Context Window', description: 'Context Window is ready' }],
          ],
        },
        {
          from: 'normal', to: 'normal', event: 'UPDATE_TOKENS',
          guard: ['<', ['/', '@entity.tokenCount', '@entity.maxTokens'], warningThreshold],
          effects: [
            ['agent/token-count'],
            ['agent/context-usage'],
            ['set', '@entity.usage', ['*', ['/', '@entity.tokenCount', '@entity.maxTokens'], 100]],
            ['set', '@entity.current', '@entity.tokenCount'],
            ['emit', 'UPDATE'],
          ],
        },
        {
          from: 'normal', to: 'approaching_limit', event: 'UPDATE_TOKENS',
          guard: ['and',
            ['>=', ['/', '@entity.tokenCount', '@entity.maxTokens'], warningThreshold],
            ['<', ['/', '@entity.tokenCount', '@entity.maxTokens'], 1],
          ],
          effects: [
            ['agent/token-count'],
            ['agent/context-usage'],
            ['set', '@entity.usage', ['*', ['/', '@entity.tokenCount', '@entity.maxTokens'], 100]],
            ['set', '@entity.current', '@entity.tokenCount'],
            ['emit', 'UPDATE'],
            ['emit', 'SHOW'],
          ],
        },
        {
          from: 'approaching_limit', to: 'at_limit', event: 'UPDATE_TOKENS',
          guard: ['>=', ['/', '@entity.tokenCount', '@entity.maxTokens'], 1],
          effects: [
            ['agent/token-count'],
            ['agent/context-usage'],
            ['set', '@entity.usage', 100],
            ['set', '@entity.current', '@entity.tokenCount'],
            ['emit', 'UPDATE'],
            ['emit', 'SHOW'],
          ],
        },
        {
          from: 'approaching_limit', to: 'normal', event: 'COMPACT',
          effects: [
            ['agent/compact'],
            ['agent/token-count'],
            ['agent/context-usage'],
            ['set', '@entity.lastCompactedAt', '@now'],
            ['set', '@entity.usage', ['*', ['/', '@entity.tokenCount', '@entity.maxTokens'], 100]],
            ['set', '@entity.current', '@entity.tokenCount'],
            ['emit', 'UPDATE'],
          ],
        },
        {
          from: 'at_limit', to: 'normal', event: 'COMPACT',
          effects: [
            ['agent/compact'],
            ['agent/token-count'],
            ['agent/context-usage'],
            ['set', '@entity.lastCompactedAt', '@now'],
            ['set', '@entity.usage', ['*', ['/', '@entity.tokenCount', '@entity.maxTokens'], 100]],
            ['set', '@entity.current', '@entity.tokenCount'],
            ['emit', 'UPDATE'],
          ],
        },
        {
          from: 'approaching_limit', to: 'approaching_limit', event: 'UPDATE_TOKENS',
          guard: ['and',
            ['>=', ['/', '@entity.tokenCount', '@entity.maxTokens'], warningThreshold],
            ['<', ['/', '@entity.tokenCount', '@entity.maxTokens'], 1],
          ],
          effects: [
            ['agent/token-count'],
            ['agent/context-usage'],
            ['set', '@entity.usage', ['*', ['/', '@entity.tokenCount', '@entity.maxTokens'], 100]],
            ['set', '@entity.current', '@entity.tokenCount'],
            ['emit', 'UPDATE'],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentContextWindowEntity(params: StdAgentContextWindowParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentContextWindowTrait(params: StdAgentContextWindowParams = {}): Trait {
  return buildAgentTrait(resolve(params));
}

export function stdAgentContextWindowPage(params: StdAgentContextWindowParams = {}): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Gauge` },
      { ref: `${c.entityName}Notification` },
      { ref: `${c.entityName}Agent` },
    ],
  } as Page;
}

export function stdAgentContextWindow(params: StdAgentContextWindowParams = {}): OrbitalSchema {
  const c = resolve(params);
  const { entityName, fields } = c;

  // UI trait: token gauge for visual display
  const gaugeTrait = extractTrait(stdAgentTokenGauge({
    entityName,
    fields,
    threshold: c.warningThreshold,
    maxTokens: 200000,
  }));

  // UI trait: notification for threshold alerts
  const notifTrait = extractTrait(stdNotification({
    entityName, fields,
    standalone: false,
    headerIcon: 'layers',
    pageTitle: 'Context Window Alert',
  }));

  const agentTrait = buildAgentTrait(c);
  const entity = buildEntity(c);

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: gaugeTrait.name },
      { ref: notifTrait.name },
      { ref: agentTrait.name },
    ],
  } as Page;

  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, entity, [gaugeTrait, notifTrait, agentTrait], [page]));
}
