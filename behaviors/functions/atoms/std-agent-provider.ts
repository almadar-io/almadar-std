/**
 * std-agent-provider
 *
 * Provider routing atom for agent model/provider switching.
 * Composes UI atoms (stdModal for switch form, stdNotification for confirmation)
 * with an agent trait that handles agent/switch-provider, agent/provider,
 * and agent/model operators.
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
import { stdModal } from './std-modal.js';
import { stdNotification } from './std-notification.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentProviderParams {
  /** Entity name in PascalCase (default: "ProviderState") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, provider fields are always included) */
  fields?: EntityField[];
  /** Persistence mode (default: "persistent") */
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

interface ProviderConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentProviderParams): ProviderConfig {
  const entityName = params.entityName ?? 'ProviderState';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'currentProvider', type: 'string', default: 'anthropic' },
    { name: 'currentModel', type: 'string', default: 'claude-sonnet-4-20250514' },
    { name: 'fallbackProvider', type: 'string', default: 'openai' },
    { name: 'requestCount', type: 'number', default: 0 },
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
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ProviderConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildAgentTrait(c: ProviderConfig): Trait {
  const { entityName } = c;
  const agentTraitName = `${entityName}Agent`;

  return {
    name: agentTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'SHOW', scope: 'internal' as const, payload: [
        { name: 'provider', type: 'string' },
        { name: 'model', type: 'string' },
      ]},
    ],
    listens: [
      { event: 'SWITCHED', triggers: 'SWITCHED' },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'active' },
        { name: 'switching' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'DO_SWITCH', name: 'Do Switch', payload: [
          { name: 'data', type: 'object', required: true },
        ]},
        { key: 'SWITCH_AUTO', name: 'Auto Switch to Fallback' },
        { key: 'SWITCHED', name: 'Switched', payload: [{ name: 'data', type: 'object', required: true }] },
      ],
      transitions: [
        {
          from: 'idle', to: 'active', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['agent/provider'],
            ['agent/model'],
            ['render-ui', 'main', { type: 'empty-state', icon: 'repeat', title: 'Provider', description: 'Provider is ready' }],
          ],
        },
        {
          from: 'active', to: 'switching', event: 'DO_SWITCH',
          effects: [
            ['agent/switch-provider', '@payload.data.currentProvider', '@payload.data.currentModel'],
            ['set', '@entity.currentProvider', '@payload.data.currentProvider'],
            ['set', '@entity.currentModel', '@payload.data.currentModel'],
          ],
        },
        // Listen for SWITCHED from modal save
        {
          from: 'active', to: 'switching', event: 'SWITCHED',
          effects: [
            ['agent/switch-provider', '@entity.currentProvider', '@entity.currentModel'],
          ],
        },
        {
          from: 'switching', to: 'active', event: 'INIT',
          effects: [
            ['agent/provider'],
            ['agent/model'],
            ['set', '@entity.requestCount', ['+', '@entity.requestCount', 1]],
            ['emit', 'SHOW'],
          ],
        },
        {
          from: 'active', to: 'switching', event: 'SWITCH_AUTO',
          effects: [
            ['agent/switch-provider', '@entity.fallbackProvider'],
            ['set', '@entity.currentProvider', '@entity.fallbackProvider'],
          ],
        },
        {
          from: 'idle', to: 'switching', event: 'DO_SWITCH',
          effects: [
            ['agent/switch-provider', '@payload.data.currentProvider', '@payload.data.currentModel'],
            ['set', '@entity.currentProvider', '@payload.data.currentProvider'],
            ['set', '@entity.currentModel', '@payload.data.currentModel'],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentProviderEntity(params: StdAgentProviderParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentProviderTrait(params: StdAgentProviderParams = {}): Trait {
  return buildAgentTrait(resolve(params));
}

export function stdAgentProviderPage(params: StdAgentProviderParams = {}): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Modal` },
      { ref: `${c.entityName}Notification` },
      { ref: `${c.entityName}Agent` },
    ],
  } as Page;
}

export function stdAgentProvider(params: StdAgentProviderParams = {}): OrbitalSchema {
  const c = resolve(params);
  const { entityName, fields } = c;

  // UI trait: switch form modal
  const switchContent = {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'repeat', size: 'md' },
        { type: 'typography', content: 'Switch Provider', variant: 'h3' },
      ] },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: 'Current:' },
          { type: 'badge', label: '@entity.currentProvider' },
          { type: 'badge', label: '@entity.currentModel' },
        ],
      },
      { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'SAVE', cancelEvent: 'CLOSE', fields: ['currentProvider', 'currentModel'] },
    ],
  };

  const modalTrait = extractTrait(stdModal({
    entityName, fields,
    traitName: `${entityName}Modal`,
    modalTitle: 'Switch Provider',
    headerIcon: 'repeat',
    openContent: switchContent,
    openEvent: 'SWITCH',
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName]],
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'update', entityName, '@payload.data']],
    emitOnSave: 'SWITCHED',
  }));

  // UI trait: notification for switch confirmation
  const notifTrait = extractTrait(stdNotification({
    entityName, fields,
    standalone: false,
    headerIcon: 'server',
    pageTitle: 'Provider Status',
  }));

  const agentTrait = buildAgentTrait(c);
  const entity = buildEntity(c);

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: modalTrait.name },
      { ref: notifTrait.name },
      { ref: agentTrait.name },
    ],
  } as Page;

  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, entity, [modalTrait, notifTrait, agentTrait], [page]));
}
