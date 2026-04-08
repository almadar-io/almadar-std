/**
 * std-agent-classifier
 *
 * Classification flow atom for agent-powered text classification.
 * Composes UI atoms (stdModal for input form, stdNotification for result badge)
 * with an agent trait that uses agent/generate with a classification prompt.
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
import { makeEntity, makeOrbital, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdModal } from './std-modal.js';
import { stdNotification } from './std-notification.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentClassifierParams {
  /** Entity name in PascalCase (default: "Classification") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, classification fields are always included) */
  fields?: EntityField[];
  /** Persistence mode (default: "persistent") */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Available categories for classification */
  categories?: string[];
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

interface ClassifierConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  pluralName: string;
  categories: string[];
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentClassifierParams): ClassifierConfig {
  const entityName = params.entityName ?? 'Classification';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'input', type: 'string', default: '' },
    { name: 'category', type: 'string', default: '' },
    { name: 'confidence', type: 'number', default: 0 },
    { name: 'model', type: 'string', default: 'claude-sonnet-4-20250514' },
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
    categories: params.categories ?? ['positive', 'negative', 'neutral'],
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ClassifierConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildAgentTrait(c: ClassifierConfig): Trait {
  const { entityName, categories } = c;
  const agentTraitName = `${entityName}Agent`;

  return {
    name: agentTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'SHOW', scope: 'internal' as const, payload: [
        { name: 'category', type: 'string' },
        { name: 'confidence', type: 'number' },
      ]},
    ],
    listens: [
      { event: 'CLASSIFIED', triggers: 'CLASSIFIED', scope: 'external' as const },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'classifying' },
        { name: 'classified' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'DO_CLASSIFY', name: 'Do Classify', payload: [
          { name: 'data', type: 'object', required: true },
        ]},
        { key: 'RESET', name: 'Reset' },
        { key: 'CLASSIFIED', name: 'Classified', payload: [{ name: 'data', type: 'object', required: true }] },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', { type: 'empty-state', icon: 'tag', title: 'Classifier', description: 'Classifier is ready' }],
          ],
        },
        {
          from: 'idle', to: 'classifying', event: 'DO_CLASSIFY',
          effects: [
            ['agent/generate', ['str/concat',
              'Classify the following text into one of these categories: ',
              categories.join(', '),
              '. Text: ',
              '@entity.input',
              '. Respond with JSON: {"category": "...", "confidence": 0.0-1.0}',
            ]],
          ],
        },
        // Listen for CLASSIFIED from modal save
        {
          from: 'idle', to: 'classifying', event: 'CLASSIFIED',
          effects: [
            ['agent/generate', ['str/concat',
              'Classify the following text into one of these categories: ',
              categories.join(', '),
              '. Text: ',
              '@entity.input',
              '. Respond with JSON: {"category": "...", "confidence": 0.0-1.0}',
            ]],
          ],
        },
        {
          from: 'classifying', to: 'classified', event: 'DO_CLASSIFY',
          effects: [
            ['set', '@entity.category', '@payload.data.input'],
            ['emit', 'SHOW'],
          ],
        },
        {
          from: 'classified', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.input', ''],
            ['set', '@entity.category', ''],
            ['set', '@entity.confidence', 0],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentClassifierEntity(params: StdAgentClassifierParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentClassifierTrait(params: StdAgentClassifierParams = {}): Trait {
  return buildAgentTrait(resolve(params));
}

export function stdAgentClassifierPage(params: StdAgentClassifierParams = {}): Page {
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

export function stdAgentClassifier(params: StdAgentClassifierParams = {}): OrbitalDefinition {
  const c = resolve(params);
  const { entityName, fields, categories } = c;

  const categoryBadges = categories.map(cat => ({
    type: 'badge', label: cat, variant: 'secondary',
  }));

  // UI trait: classification input form modal
  const classifyContent = {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'tag', size: 'md' },
        { type: 'typography', content: `${entityName}`, variant: 'h3' },
      ] },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'typography', variant: 'caption', content: 'Categories:' },
          ...categoryBadges,
        ],
      },
      { type: 'form-section', entity: entityName, mode: 'create', submitEvent: 'SAVE', cancelEvent: 'CLOSE', fields: ['input'] },
    ],
  };

  const modalTrait = extractTrait(stdModal({
    entityName, fields,
    traitName: `${entityName}Modal`,
    modalTitle: entityName,
    headerIcon: 'tag',
    openContent: classifyContent,
    openEvent: 'CLASSIFY',
    closeEvent: 'CLOSE',
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'create', entityName, '@payload.data']],
    emitOnSave: 'CLASSIFIED',
  }));

  // UI trait: notification for classification result
  const notifTrait = extractTrait(stdNotification({
    entityName, fields,
    standalone: false,
    headerIcon: 'tag',
    pageTitle: `${entityName} Result`,
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

  return makeOrbital(`${c.entityName}Orbital`, entity, [modalTrait, notifTrait, agentTrait], [page]);
}
