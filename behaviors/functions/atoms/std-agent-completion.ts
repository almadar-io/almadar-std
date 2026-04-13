/**
 * std-agent-completion
 *
 * Completion flow atom for agent text generation.
 * Composes UI atoms (stdModal for prompt input, stdNotification for feedback)
 * with an agent trait that handles agent/generate and retry logic.
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

export interface StdAgentCompletionParams {
  /** Entity name in PascalCase (default: "Completion") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, completion fields are always included) */
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

interface CompletionConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentCompletionParams): CompletionConfig {
  const entityName = params.entityName ?? 'Completion';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'prompt', type: 'string', default: '' },
    { name: 'response', type: 'string', default: '' },
    { name: 'provider', type: 'string', default: 'anthropic' },
    { name: 'model', type: 'string', default: 'claude-sonnet-4-20250514' },
    { name: 'status', type: 'string', default: 'idle' },
    { name: 'error', type: 'string', default: '' },
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

function buildEntity(c: CompletionConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildAgentTrait(c: CompletionConfig): Trait {
  const { entityName } = c;
  const agentTraitName = `${entityName}Agent`;

  return {
    name: agentTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'SHOW', scope: 'internal' as const, payload: [
        { name: 'response', type: 'string' },
      ]},
    ],
    listens: [
      { event: 'GENERATED', triggers: 'GENERATED', scope: 'external' as const },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'generating' },
        { name: 'completed' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'DO_GENERATE', name: 'Do Generate', payload: [
          { name: 'data', type: 'object', required: true },
        ]},
        { key: 'RETRY', name: 'Retry' },
        { key: 'RESET', name: 'Reset' },
        { key: 'GENERATED', name: 'Generated', payload: [{ name: 'data', type: 'object', required: true }] },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', { type: 'empty-state', icon: 'sparkles', title: 'Completion', description: 'Completion is ready' }],
          ],
        },
        {
          from: 'idle', to: 'generating', event: 'DO_GENERATE',
          effects: [
            ['set', '@entity.status', 'generating'],
            ['agent/generate', '@entity.prompt'],
          ],
        },
        // Listen for GENERATED from modal save
        {
          from: 'idle', to: 'generating', event: 'GENERATED',
          effects: [
            ['set', '@entity.status', 'generating'],
            ['agent/generate', '@entity.prompt'],
          ],
        },
        {
          from: 'generating', to: 'completed', event: 'DO_GENERATE',
          effects: [
            ['set', '@entity.response', '@payload.data.prompt'],
            ['set', '@entity.status', 'completed'],
            ['emit', 'SHOW'],
          ],
        },
        // Error: generating fails
        {
          from: 'generating', to: 'error', event: 'RESET',
          guard: ['=', '@entity.status', 'generating'],
          effects: [
            ['set', '@entity.status', 'error'],
            ['set', '@entity.error', 'Generation was cancelled'],
          ],
        },
        {
          from: 'error', to: 'generating', event: 'RETRY',
          guard: ['=', '@entity.status', 'error'],
          effects: [
            ['set', '@entity.status', 'generating'],
            ['set', '@entity.error', ''],
            ['agent/generate', '@entity.prompt'],
          ],
        },
        {
          from: 'completed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.response', ''],
            ['set', '@entity.prompt', ''],
          ],
        },
        {
          from: 'error', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.error', ''],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentCompletionEntity(params: StdAgentCompletionParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentCompletionTrait(params: StdAgentCompletionParams = {}): Trait {
  return buildAgentTrait(resolve(params));
}

export function stdAgentCompletionPage(params: StdAgentCompletionParams = {}): Page {
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

export function stdAgentCompletion(params: StdAgentCompletionParams = {}): OrbitalSchema {
  const c = resolve(params);
  const { entityName, fields } = c;

  // UI trait: prompt input form modal
  const promptContent = {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'sparkles', size: 'md' },
        { type: 'typography', content: `${entityName}`, variant: 'h3' },
      ] },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'badge', label: '@entity.provider' },
          { type: 'badge', label: '@entity.model' },
        ],
      },
      { type: 'form-section', entity: entityName, mode: 'create', submitEvent: 'SAVE', cancelEvent: 'CLOSE', fields: ['prompt'] },
    ],
  };

  const modalTrait = extractTrait(stdModal({
    entityName, fields,
    traitName: `${entityName}Modal`,
    modalTitle: entityName,
    headerIcon: 'sparkles',
    openContent: promptContent,
    openEvent: 'GENERATE',
    closeEvent: 'CLOSE',
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'create', entityName, '@payload.data']],
    emitOnSave: 'GENERATED',
  }));

  // UI trait: notification for generation feedback
  const notifTrait = extractTrait(stdNotification({
    entityName, fields,
    standalone: false,
    headerIcon: 'sparkles',
    pageTitle: `${entityName} Status`,
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
