/**
 * std-agent-memory
 *
 * Memory lifecycle atom for agent memory operations.
 * Composes UI atoms (stdBrowse for memory table, stdModal for memorize form)
 * with an agent trait that handles agent/memorize, agent/recall, agent/pin,
 * agent/forget, agent/reinforce, and agent/decay operators.
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
import { stdBrowse } from './std-browse.js';
import { stdModal } from './std-modal.js';


// ============================================================================
// Params
// ============================================================================

export interface StdAgentMemoryParams {
  /** Entity name in PascalCase (default: "Memory") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, memory fields are always included) */
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

interface MemoryConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentMemoryParams): MemoryConfig {
  const entityName = params.entityName ?? 'Memory';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'content', type: 'string', default: '' },
    { name: 'category', type: 'string', default: 'general' },
    { name: 'strength', type: 'number', default: 1.0 },
    { name: 'pinned', type: 'boolean', default: false },
    { name: 'scope', type: 'string', default: 'session' },
    { name: 'lastAccessedAt', type: 'string', default: '' },
    { name: 'createdAt', type: 'string', default: '' },
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

function buildEntity(c: MemoryConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildAgentTrait(c: MemoryConfig): Trait {
  const { entityName } = c;
  const agentTraitName = `${entityName}Agent`;

  return {
    name: agentTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'FORGOT', scope: 'external' as const, payload: [{ name: 'id', type: 'string' }] },
      { event: 'REINFORCED', scope: 'external' as const, payload: [{ name: 'id', type: 'string' }] },
      { event: 'DECAYED', scope: 'external' as const, payload: [{ name: 'id', type: 'string' }] },
      { event: 'PINNED', scope: 'external' as const, payload: [{ name: 'id', type: 'string' }] },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'active' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'DO_MEMORIZE', name: 'Do Memorize', payload: [
          { name: 'data', type: 'object', required: true },
        ]},
        { key: 'RECALL', name: 'Recall', payload: [
          { name: 'query', type: 'string', required: true },
        ]},
        { key: 'PIN', name: 'Pin', payload: [
          { name: 'id', type: 'string', required: true },
        ]},
        { key: 'FORGET', name: 'Forget', payload: [
          { name: 'id', type: 'string', required: true },
        ]},
        { key: 'REINFORCE', name: 'Reinforce', payload: [
          { name: 'id', type: 'string', required: true },
        ]},
        { key: 'DECAY', name: 'Decay' },
        { key: 'MEMORIZED', name: 'Memorized', payload: [{ name: 'data', type: 'object', required: true }] },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', { type: 'empty-state', icon: 'brain', title: 'Memory', description: 'Memory is ready' }],
          ],
        },
        {
          from: 'idle', to: 'active', event: 'DO_MEMORIZE',
          effects: [
            ['agent/memorize', '@payload.data.content', '@payload.data.category'],
            ['persist', 'create', entityName, '@payload.data'],
          ],
        },
        {
          from: 'active', to: 'active', event: 'RECALL',
          effects: [
            ['agent/recall', '@payload.query'],
          ],
        },
        {
          from: 'active', to: 'active', event: 'PIN',
          guard: ['not', ['agent/is-pinned', '@payload.id']],
          effects: [
            ['agent/pin', '@payload.id'],
            ['set', '@entity.pinned', true],
            ['emit', 'PINNED'],
          ],
        },
        {
          from: 'active', to: 'idle', event: 'FORGET',
          effects: [
            ['agent/forget', '@payload.id'],
            ['emit', 'FORGOT'],
          ],
        },
        {
          from: 'active', to: 'active', event: 'REINFORCE',
          effects: [
            ['agent/reinforce', '@payload.id'],
            ['emit', 'REINFORCED'],
          ],
        },
        {
          from: 'idle', to: 'idle', event: 'DECAY',
          effects: [
            ['agent/decay'],
            ['emit', 'DECAYED'],
          ],
        },
        {
          from: 'active', to: 'active', event: 'DECAY',
          effects: [
            ['agent/decay'],
            ['emit', 'DECAYED'],
          ],
        },
        // Listen for MEMORIZED from modal to transition to active
        {
          from: 'idle', to: 'active', event: 'MEMORIZED',
          effects: [
            ['fetch', entityName],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentMemoryEntity(params: StdAgentMemoryParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentMemoryTrait(params: StdAgentMemoryParams = {}): Trait {
  return buildAgentTrait(resolve(params));
}

export function stdAgentMemoryPage(params: StdAgentMemoryParams = {}): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Browse` },
      { ref: `${c.entityName}Create` },
      { ref: `${c.entityName}Agent` },
    ],
  } as Page;
}

export function stdAgentMemory(params: StdAgentMemoryParams = {}): OrbitalSchema {
  const c = resolve(params);
  const { entityName, fields } = c;

  const formFields = fields
    .filter(f => f.name !== 'id')
    .filter(f => ['content', 'category', 'scope'].includes(f.name))
    .map(f => f.name);

  // UI trait: browse memories in a data-grid
  const browseTrait = extractTrait(stdBrowse({
    entityName, fields,
    traitName: `${entityName}Browse`,
    listFields: ['content', 'category', 'strength'],
    headerIcon: 'brain',
    pageTitle: `${entityName} Manager`,
    emptyTitle: 'No memories yet',
    emptyDescription: 'Create your first memory to get started.',
    headerActions: [
      { label: 'Memorize', event: 'MEMORIZE', variant: 'primary', icon: 'plus' },
      { label: 'Recall', event: 'RECALL', variant: 'secondary', icon: 'search' },
      { label: 'Decay All', event: 'DECAY', variant: 'ghost', icon: 'clock' },
    ],
    itemActions: [
      { label: 'Pin', event: 'PIN' },
      { label: 'Reinforce', event: 'REINFORCE' },
      { label: 'Forget', event: 'FORGET', variant: 'danger' },
    ],
    refreshEvents: ['MEMORIZED', 'PINNED', 'FORGOT', 'REINFORCED', 'DECAYED'],
  }));

  // UI trait: memorize form modal
  const memorizeContent = {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'plus-circle', size: 'md' },
        { type: 'typography', content: 'Memorize', variant: 'h3' },
      ] },
      { type: 'divider' },
      { type: 'form-section', entity: entityName, mode: 'create', submitEvent: 'SAVE', cancelEvent: 'CLOSE', fields: formFields },
    ],
  };

  const createTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Create`,
    modalTitle: 'Memorize',
    headerIcon: 'plus-circle',
    openContent: memorizeContent,
    openEvent: 'MEMORIZE',
    closeEvent: 'CLOSE',
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'create', entityName, '@payload.data']],
    emitOnSave: 'MEMORIZED',
  }));

  // Agent trait: handles agent/* effects
  const agentTrait = buildAgentTrait(c);

  const entity = buildEntity(c);

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: browseTrait.name },
      { ref: createTrait.name },
      { ref: agentTrait.name },
    ],
  } as Page;

  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, entity, [browseTrait, createTrait, agentTrait], [page]));
}
