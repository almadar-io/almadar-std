/**
 * std-agent-session
 *
 * Session lifecycle atom for agent session management.
 * Composes UI atoms (stdBrowse for session list, stdModal for fork label form)
 * with an agent trait that handles agent/fork, agent/label, and agent/session-id.
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

export interface StdAgentSessionParams {
  /** Entity name in PascalCase (default: "Session") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, session fields are always included) */
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

interface SessionConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentSessionParams): SessionConfig {
  const entityName = params.entityName ?? 'Session';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'sessionId', type: 'string', default: '' },
    { name: 'parentId', type: 'string', default: '' },
    { name: 'label', type: 'string', default: '' },
    { name: 'status', type: 'string', default: 'active' },
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

function buildEntity(c: SessionConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildAgentTrait(c: SessionConfig): Trait {
  const { entityName } = c;
  const agentTraitName = `${entityName}Agent`;

  return {
    name: agentTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'ENDED', scope: 'external' as const, payload: [{ name: 'sessionId', type: 'string' }] },
      { event: 'FORKED', scope: 'external' as const, payload: [{ name: 'sessionId', type: 'string' }] },
    ],
    listens: [
      { event: 'ENDED', triggers: 'INIT', scope: 'external' as const },
      { event: 'FORKED', triggers: 'INIT', scope: 'external' as const },
    ],
    stateMachine: {
      states: [
        { name: 'active', isInitial: true },
        { name: 'forked' },
        { name: 'ended' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'FORK', name: 'Fork Session' },
        { key: 'DO_LABEL', name: 'Do Label', payload: [
          { name: 'data', type: 'object', required: true },
        ]},
        { key: 'END', name: 'End Session' },
        { key: 'LABELED', name: 'Labeled', payload: [{ name: 'data', type: 'object', required: true }] },
        { key: 'FORKED', name: 'Forked', payload: [{ name: 'data', type: 'object', required: true }] },
      ],
      transitions: [
        {
          from: 'active', to: 'active', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['agent/session-id'],
            ['set', '@entity.createdAt', '@now'],
            ['render-ui', 'main', { type: 'empty-state', icon: 'git-branch', title: 'Session', description: 'Session is ready' }],
          ],
        },
        {
          from: 'active', to: 'forked', event: 'FORK',
          effects: [
            ['set', '@entity.parentId', '@entity.sessionId'],
            ['agent/fork'],
            ['agent/session-id'],
            ['persist', 'create', entityName, {
              sessionId: '@entity.sessionId',
              parentId: '@entity.parentId',
              status: 'forked',
              createdAt: '@now',
            }],
            ['emit', 'FORKED'],
          ],
        },
        {
          from: 'forked', to: 'forked', event: 'FORK',
          effects: [
            ['set', '@entity.parentId', '@entity.sessionId'],
            ['agent/fork'],
            ['agent/session-id'],
            ['persist', 'create', entityName, {
              sessionId: '@entity.sessionId',
              parentId: '@entity.parentId',
              status: 'forked',
              createdAt: '@now',
            }],
            ['emit', 'FORKED'],
          ],
        },
        {
          from: 'active', to: 'active', event: 'DO_LABEL',
          effects: [
            ['agent/label', '@payload.data.label'],
            ['set', '@entity.label', '@payload.data.label'],
          ],
        },
        {
          from: 'forked', to: 'forked', event: 'DO_LABEL',
          effects: [
            ['agent/label', '@payload.data.label'],
            ['set', '@entity.label', '@payload.data.label'],
          ],
        },
        // Listen for LABELED from modal save
        {
          from: 'active', to: 'active', event: 'LABELED',
          effects: [
            ['agent/label', '@entity.label'],
            ['fetch', entityName],
          ],
        },
        {
          from: 'forked', to: 'forked', event: 'LABELED',
          effects: [
            ['agent/label', '@entity.label'],
            ['fetch', entityName],
          ],
        },
        {
          from: 'active', to: 'ended', event: 'END',
          effects: [
            ['set', '@entity.status', 'ended'],
            ['emit', 'ENDED'],
          ],
        },
        {
          from: 'forked', to: 'ended', event: 'END',
          effects: [
            ['set', '@entity.status', 'ended'],
            ['emit', 'ENDED'],
          ],
        },
        // Allow re-initialization from ended state
        {
          from: 'ended', to: 'active', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['agent/session-id'],
            ['set', '@entity.createdAt', '@now'],
            ['set', '@entity.status', 'active'],
            ['render-ui', 'main', { type: 'empty-state', icon: 'git-branch', title: 'Session', description: 'Session is ready' }],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentSessionEntity(params: StdAgentSessionParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentSessionTrait(params: StdAgentSessionParams = {}): Trait {
  return buildAgentTrait(resolve(params));
}

export function stdAgentSessionPage(params: StdAgentSessionParams = {}): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Browse` },
      { ref: `${c.entityName}Label` },
      { ref: `${c.entityName}Agent` },
    ],
  } as Page;
}

export function stdAgentSession(params: StdAgentSessionParams = {}): OrbitalSchema {
  const c = resolve(params);
  const { entityName, fields } = c;

  // UI trait: browse session list
  const browseTrait = extractTrait(stdBrowse({
    entityName, fields,
    traitName: `${entityName}Browse`,
    listFields: ['sessionId', 'status', 'label'],
    headerIcon: 'terminal',
    pageTitle: `${entityName} Manager`,
    emptyTitle: 'No sessions yet',
    emptyDescription: 'Start a new session to begin.',
    headerActions: [
      { label: 'Fork', event: 'FORK', variant: 'secondary', icon: 'git-branch' },
      { label: 'Label', event: 'LABEL', variant: 'secondary', icon: 'tag' },
      { label: 'End', event: 'END', variant: 'ghost', icon: 'square' },
    ],
    itemActions: [
      { label: 'View', event: 'VIEW' },
    ],
    refreshEvents: ['FORKED', 'LABELED', 'ENDED'],
  }));

  // UI trait: label form modal
  const labelContent = {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'tag', size: 'md' },
        { type: 'typography', content: 'Label Session', variant: 'h3' },
      ] },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: 'Session:' },
          { type: 'badge', label: '@entity.sessionId' },
        ],
      },
      { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'SAVE', cancelEvent: 'CLOSE', fields: ['label'] },
    ],
  };

  const labelTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Label`,
    modalTitle: 'Label Session',
    headerIcon: 'tag',
    openContent: labelContent,
    openEvent: 'LABEL',
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName]],
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'update', entityName, '@payload.data']],
    emitOnSave: 'LABELED',
  }));

  const agentTrait = buildAgentTrait(c);
  const entity = buildEntity(c);

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: browseTrait.name },
      { ref: labelTrait.name },
      { ref: agentTrait.name },
    ],
  } as Page;

  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, entity, [browseTrait, labelTrait, agentTrait], [page]));
}
