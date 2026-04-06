/**
 * std-agent-completion
 *
 * Completion flow atom for agent text generation.
 * Wraps agent/generate with idle -> generating -> completed -> error lifecycle.
 *
 * @level atom
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

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
  traitName: string;
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
    traitName: `${entityName}Flow`,
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

function buildTrait(c: CompletionConfig): Trait {
  const { entityName } = c;

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'sparkles', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'textarea', label: 'Prompt', bind: '@entity.prompt', placeholder: 'Enter your prompt...' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'badge', label: '@entity.provider' },
          { type: 'badge', label: '@entity.model' },
        ],
      },
      { type: 'button', label: 'Generate', event: 'GENERATE', variant: 'primary', icon: 'sparkles' },
    ],
  };

  const generatingUI = {
    type: 'loading-state', title: 'Generating...', message: 'Waiting for AI response...',
  };

  const completedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Generation complete' },
      { type: 'typography', variant: 'body', content: '@entity.response' },
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const errorUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'error-state', title: 'Generation Failed', message: '@entity.error' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Retry', event: 'RETRY', variant: 'primary', icon: 'refresh-cw' },
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
        { name: 'idle', isInitial: true },
        { name: 'generating' },
        { name: 'completed' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'GENERATE', name: 'Generate', payload: [
          { name: 'prompt', type: 'string', required: false },
        ]},
        { key: 'RETRY', name: 'Retry' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', idleUI],
          ],
        },
        {
          from: 'idle', to: 'generating', event: 'GENERATE',
          effects: [
            ['set', '@entity.status', 'generating'],
            ['render-ui', 'main', generatingUI],
            ['agent/generate', '@entity.prompt'],
          ],
        },
        {
          from: 'generating', to: 'completed', event: 'GENERATE',
          effects: [
            ['set', '@entity.response', '@payload.prompt'],
            ['set', '@entity.status', 'completed'],
            ['render-ui', 'main', completedUI],
          ],
        },
        {
          from: 'error', to: 'generating', event: 'RETRY',
          guard: ['=', '@entity.status', 'error'],
          effects: [
            ['set', '@entity.status', 'generating'],
            ['set', '@entity.error', ''],
            ['render-ui', 'main', generatingUI],
            ['agent/generate', '@entity.prompt'],
          ],
        },
        {
          from: 'completed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.response', ''],
            ['set', '@entity.prompt', ''],
            ['render-ui', 'main', idleUI],
          ],
        },
        {
          from: 'error', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.error', ''],
            ['render-ui', 'main', idleUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: CompletionConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentCompletionEntity(params: StdAgentCompletionParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentCompletionTrait(params: StdAgentCompletionParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentCompletionPage(params: StdAgentCompletionParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentCompletion(params: StdAgentCompletionParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
