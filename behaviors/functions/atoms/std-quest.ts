/**
 * std-quest
 *
 * Quest/objective tracking behavior: available, active, complete, failed.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level molecule
 * @family gameplay
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

export interface StdQuestParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Display
  listFields?: string[];
  formFields?: string[];

  // Labels
  pageTitle?: string;
  questTitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;

  // Icons
  headerIcon?: string;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface QuestConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  listFields: string[];
  formFields: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  pageTitle: string;
  questTitle: string;
  emptyTitle: string;
  emptyDescription: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdQuestParams): QuestConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    nonIdFields,
    listFields: params.listFields ?? nonIdFields.slice(0, 3).map(f => f.name),
    formFields: params.formFields ?? nonIdFields.map(f => f.name),
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    traitName: `${entityName}Tracking`,
    pageTitle: params.pageTitle ?? `${p} Board`,
    questTitle: params.questTitle ?? entityName,
    emptyTitle: params.emptyTitle ?? `No ${p.toLowerCase()} available`,
    emptyDescription: params.emptyDescription ?? `Check back later for new ${p.toLowerCase()}.`,
    headerIcon: params.headerIcon ?? 'flag',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: QuestConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

function buildTrait(c: QuestConfig): Trait {
  const { entityName, listFields, formFields, headerIcon } = c;
  const { pageTitle, emptyTitle, emptyDescription } = c;

  // List item children for data-grid
  const listItemChildren: unknown[] = [
    {
      type: 'stack', direction: 'horizontal', justify: 'space-between', align: 'center',
      children: [
        {
          type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
          children: [
            { type: 'icon', name: headerIcon, size: 'sm' },
            { type: 'typography', variant: 'h4', content: `@item.${listFields[0] ?? 'id'}` },
          ],
        },
        ...(listFields.length > 1 ? [{ type: 'badge', label: `@item.${listFields[1]}` }] : []),
      ],
    },
  ];
  if (listFields.length > 2) {
    listItemChildren.push({ type: 'typography', variant: 'caption', content: `@item.${listFields[2]}` });
  }

  // Header bar
  const headerBar = {
    type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
    ],
  };

  // Available quests view with timeline for quest progression
  const availableMainUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      headerBar,
      { type: 'divider' },
      {
        type: 'data-list', entity: entityName, groupBy: 'status',
        emptyIcon: 'inbox', emptyTitle, emptyDescription,
        itemActions: [{ label: 'Accept', event: 'ACCEPT' }],
        renderItem: ['fn', 'item', { type: 'stack', direction: 'vertical', gap: 'sm', children: listItemChildren }],
      },
    ],
  };

  // Active quest view with progress tracking + accordion for objectives
  const activeMainUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'md',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: pageTitle, variant: 'h2' },
            ],
          },
          { type: 'badge', label: 'Active' },
        ],
      },
      { type: 'divider' },
      { type: 'progress-bar', value: 50, showPercentage: true },
      {
        type: 'data-grid', entity: entityName, emptyIcon: 'inbox', emptyTitle: 'No active quests', emptyDescription: 'Accept a quest to begin.',
        itemActions: [
          { label: 'Progress', event: 'PROGRESS' },
          { label: 'Complete', event: 'COMPLETE' },
          { label: 'Fail', event: 'FAIL', variant: 'danger' },
        ],
        renderItem: ['fn', 'item', { type: 'stack', direction: 'vertical', gap: 'sm', children: listItemChildren }],
      },
    ],
  };

  // Complete view with success alert
  const completeMainUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'typography', content: 'Quest Complete', variant: 'h2' },
      { type: 'alert', variant: 'success', message: 'Congratulations! The quest has been completed.' },
      { type: 'button', label: 'View Quests', event: 'RESET', variant: 'primary', icon: 'arrow-left' },
    ],
  };

  // Failed view with error alert
  const failedMainUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'x-circle', size: 'lg' },
      { type: 'typography', content: 'Quest Failed', variant: 'h2' },
      { type: 'alert', variant: 'danger', message: 'The quest was not completed. You can try again.' },
      { type: 'button', label: 'View Quests', event: 'RESET', variant: 'primary', icon: 'arrow-left' },
    ],
  };

  // Progress modal
  const progressModalUI = {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'icon', name: 'trending-up', size: 'md' },
          { type: 'typography', content: 'Update Progress', variant: 'h3' },
        ],
      },
      { type: 'divider' },
      { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'SAVE', cancelEvent: 'CANCEL', fields: formFields },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'available', isInitial: true },
        { name: 'active' },
        { name: 'progressing' },
        { name: 'complete' },
        { name: 'failed' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'ACCEPT', name: 'Accept' },
        { key: 'PROGRESS', name: 'Progress', payload: [{ name: 'data', type: 'object', required: true }] },
        { key: 'SAVE', name: 'Save', payload: [{ name: 'data', type: 'object', required: true }] },
        { key: 'COMPLETE', name: 'Complete' },
        { key: 'FAIL', name: 'Fail' },
        { key: 'RESET', name: 'Reset' },
        { key: 'CANCEL', name: 'Cancel' },
        { key: 'CLOSE', name: 'Close' },
      ],
      transitions: [
        // INIT: available -> available
        {
          from: 'available', to: 'available', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', availableMainUI],
          ],
        },
        // ACCEPT: available -> active
        {
          from: 'available', to: 'active', event: 'ACCEPT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', activeMainUI],
          ],
        },
        // INIT: active -> active (refresh)
        {
          from: 'active', to: 'active', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', activeMainUI],
          ],
        },
        // PROGRESS: active -> progressing (modal)
        {
          from: 'active', to: 'progressing', event: 'PROGRESS',
          effects: [
            ['render-ui', 'modal', progressModalUI],
          ],
        },
        // SAVE: progressing -> active
        {
          from: 'progressing', to: 'active', event: 'SAVE',
          effects: [
            ['persist', 'update', entityName, '@payload.data'],
            ['render-ui', 'modal', null],
            ['fetch', entityName],
            ['render-ui', 'main', activeMainUI],
          ],
        },
        // CANCEL: progressing -> active (re-render main to avoid stale content)
        {
          from: 'progressing', to: 'active', event: 'CANCEL',
          effects: [
            ['render-ui', 'modal', null],
            ['fetch', entityName],
            ['render-ui', 'main', activeMainUI],
          ],
        },
        // CLOSE: progressing -> active (re-render main to avoid stale content)
        {
          from: 'progressing', to: 'active', event: 'CLOSE',
          effects: [
            ['render-ui', 'modal', null],
            ['fetch', entityName],
            ['render-ui', 'main', activeMainUI],
          ],
        },
        // COMPLETE: active -> complete
        {
          from: 'active', to: 'complete', event: 'COMPLETE',
          effects: [
            ['render-ui', 'main', completeMainUI],
          ],
        },
        // FAIL: active -> failed
        {
          from: 'active', to: 'failed', event: 'FAIL',
          effects: [
            ['render-ui', 'main', failedMainUI],
          ],
        },
        // RESET: complete -> available
        {
          from: 'complete', to: 'available', event: 'RESET',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', availableMainUI],
          ],
        },
        // RESET: failed -> available
        {
          from: 'failed', to: 'available', event: 'RESET',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', availableMainUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: QuestConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdQuestEntity(params: StdQuestParams): Entity {
  return buildEntity(resolve(params));
}

export function stdQuestTrait(params: StdQuestParams): Trait {
  return buildTrait(resolve(params));
}

export function stdQuestPage(params: StdQuestParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdQuest(params: StdQuestParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
