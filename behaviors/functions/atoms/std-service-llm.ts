/**
 * std-service-llm
 *
 * LLM service integration behavior: generate, classify, summarize text.
 * Wraps the `llm` integration with 4 actions via separate action events.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level atom
 * @family service
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

export interface StdServiceLlmParams {
  /** Entity name in PascalCase (default: "LlmTask") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, LLM fields are always included) */
  fields?: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** When true, INIT renders the input form to main. Default true. */
  standalone?: boolean;
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

interface LlmConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  standalone: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceLlmParams): LlmConfig {
  const entityName = params.entityName ?? 'LlmTask';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'inputText', type: 'string' },
    { name: 'action', type: 'string', default: 'generate' },
    { name: 'result', type: 'string' },
    { name: 'llmStatus', type: 'string', default: 'idle' },
    { name: 'error', type: 'string' },
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
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Llm`,
    standalone: params.standalone ?? true,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: LlmConfig): Entity {
  const llmFields: EntityField[] = [
    { name: 'inputText', type: 'string' as const, default: '' },
    { name: 'action', type: 'string' as const, default: 'generate' },
    { name: 'result', type: 'string' as const, default: '' },
    { name: 'llmStatus', type: 'string' as const, default: 'idle' },
    { name: 'error', type: 'string' as const, default: '' },
  ];

  // Merge: LLM fields first, then any extra user fields (skip duplicates)
  const llmFieldNames = new Set(llmFields.map(f => f.name));
  const extraFields = c.fields.filter(f => f.name !== 'id' && !llmFieldNames.has(f.name));
  const allFields = ensureIdField([...llmFields, ...extraFields]);

  return makeEntity({ name: c.entityName, fields: allFields, persistence: c.persistence });
}

function buildTrait(c: LlmConfig): Trait {
  const { entityName, standalone } = c;

  // ---- UI definitions ----

  const idleChildren: unknown[] = [
    {
      type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
      children: [
        { type: 'icon', name: 'brain', size: 'lg' },
        { type: 'typography', content: `${entityName} LLM`, variant: 'h2' },
      ],
    },
    { type: 'divider' },
  ];

  if (standalone) {
    idleChildren.push(
      { type: 'textarea', label: 'Input Text', bind: '@entity.inputText', placeholder: 'Enter text for LLM processing...' },
    );
  }

  idleChildren.push(
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
      children: [
        { type: 'button', label: 'Generate', event: 'GENERATE', variant: 'primary', icon: 'sparkles' },
        { type: 'button', label: 'Classify', event: 'CLASSIFY', variant: 'secondary', icon: 'tag' },
        { type: 'button', label: 'Summarize', event: 'SUMMARIZE', variant: 'secondary', icon: 'align-left' },
      ],
    },
  );

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'stretch',
    children: idleChildren,
  };

  const processingUI = {
    type: 'loading-state', title: 'Processing...', message: `Running ${entityName.toLowerCase()} LLM task...`,
  };

  const completeUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'LLM task complete' },
      { type: 'typography', variant: 'body', content: '@entity.result' },
      { type: 'button', label: 'Start Over', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const errorUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'error-state', title: 'LLM Failed', message: '@entity.error', onRetry: 'RETRY' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Retry', event: 'RETRY', variant: 'primary', icon: 'refresh-cw' },
          { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
    ],
  };

  // ---- Transitions ----

  const transitions: unknown[] = [
    // INIT: idle -> idle (fetch + render if standalone)
    {
      from: 'idle', to: 'idle', event: 'INIT',
      effects: [
        ...(standalone ? [['fetch', entityName], ['render-ui', 'main', idleUI]] : [['fetch', entityName]]),
      ],
    },
    // GENERATE: idle -> processing (call llm generate + render loading)
    {
      from: 'idle', to: 'processing', event: 'GENERATE',
      effects: [
        ['set', '@entity.action', 'generate'],
        ['render-ui', 'main', processingUI],
        ['call-service', 'llm', 'generate', { userPrompt: '@entity.inputText' }],
      ],
    },
    // CLASSIFY: idle -> processing (call llm classify + render loading)
    {
      from: 'idle', to: 'processing', event: 'CLASSIFY',
      effects: [
        ['set', '@entity.action', 'classify'],
        ['render-ui', 'main', processingUI],
        ['call-service', 'llm', 'classify', { text: '@entity.inputText', categories: ['positive', 'negative', 'neutral'] }],
      ],
    },
    // SUMMARIZE: idle -> processing (call llm summarize + render loading)
    {
      from: 'idle', to: 'processing', event: 'SUMMARIZE',
      effects: [
        ['set', '@entity.action', 'summarize'],
        ['render-ui', 'main', processingUI],
        ['call-service', 'llm', 'summarize', { text: '@entity.inputText' }],
      ],
    },
    // COMPLETE: processing -> complete (store result + render success)
    {
      from: 'processing', to: 'complete', event: 'COMPLETE',
      effects: [
        ['set', '@entity.result', '@payload.content'],
        ['set', '@entity.llmStatus', 'complete'],
        ['render-ui', 'main', completeUI],
      ],
    },
    // FAILED: processing -> error (store error + render error)
    {
      from: 'processing', to: 'error', event: 'FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['set', '@entity.llmStatus', 'error'],
        ['render-ui', 'main', errorUI],
      ],
    },
    // RETRY: error -> idle
    {
      from: 'error', to: 'idle', event: 'RETRY',
      effects: [
        ['set', '@entity.llmStatus', 'idle'],
        ['render-ui', 'main', idleUI],
      ],
    },
    // RESET: complete -> idle
    {
      from: 'complete', to: 'idle', event: 'RESET',
      effects: [
        ['set', '@entity.llmStatus', 'idle'],
        ['render-ui', 'main', idleUI],
      ],
    },
    // RESET: error -> idle
    {
      from: 'error', to: 'idle', event: 'RESET',
      effects: [
        ['set', '@entity.llmStatus', 'idle'],
        ['render-ui', 'main', idleUI],
      ],
    },
  ];

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'processing' },
        { name: 'complete' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'GENERATE', name: 'Generate' },
        { key: 'CLASSIFY', name: 'Classify' },
        { key: 'SUMMARIZE', name: 'Summarize' },
        { key: 'COMPLETE', name: 'Complete', payload: [
          { name: 'content', type: 'string', required: true },
        ]},
        { key: 'FAILED', name: 'Failed', payload: [
          { name: 'error', type: 'string', required: true },
        ]},
        { key: 'RETRY', name: 'Retry' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions,
    },
  } as Trait;
}

function buildPage(c: LlmConfig): Page | undefined {
  if (!c.standalone) return undefined;
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceLlmEntity(params: StdServiceLlmParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceLlmTrait(params: StdServiceLlmParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceLlmPage(params: StdServiceLlmParams = {}): Page | undefined {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceLlm(params: StdServiceLlmParams = {}): OrbitalDefinition {
  const c = resolve(params);
  const pages: Page[] = [];
  const page = buildPage(c);
  if (page) pages.push(page);

  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    pages,
  );
}
