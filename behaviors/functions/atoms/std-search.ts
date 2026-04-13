/**
 * std-search as a Function
 *
 * Search behavior parameterized for any domain.
 * Provides a search input that filters entity data by query string.
 * The state machine structure is fixed. The caller controls data and presentation.
 *
 * @level atom
 * @family search
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
import { makeEntity, makePage, makeOrbital, makeSchema, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdSearchParams {
  /** Entity name in PascalCase (e.g., "Product", "Article") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Display
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Icon for the search input (Lucide name) */
  searchIcon?: string;

  // Page
  /** Page name (defaults to "{Entity}SearchPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/search") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface SearchConfig {
  entityName: string;
  fields: EntityField[];
  displayField: string;
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  placeholder: string;
  searchIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdSearchParams): SearchConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  const fields = baseFields;
  const nonIdFields = baseFields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Search`,
    pluralName: p,
    placeholder: params.placeholder ?? 'Search...',
    searchIcon: params.searchIcon ?? 'search',
    pageName: params.pageName ?? `${entityName}SearchPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/search`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: SearchConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: SearchConfig): Trait {
  const { entityName, displayField, pluralName, searchIcon, placeholder } = c;

  // Search input view with idle prompt
  const searchInputView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: searchIcon, size: 'lg' },
          { type: 'typography', content: `Search ${pluralName}`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'search-input', placeholder, event: 'SEARCH' },
      { type: 'empty-state', icon: searchIcon, title: 'Search to find results', description: `Type a query to search across ${pluralName.toLowerCase()}.` },
    ],
  };

  // Reusable results view with popover for result details
  const resultsView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', align: 'center',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
            children: [
              { type: 'icon', name: searchIcon, size: 'lg' },
              { type: 'typography', content: ['concat', 'Results for "', '@payload.query', '"'], variant: 'h2' },
            ],
          },
          { type: 'button', label: 'Clear', event: 'CLEAR', variant: 'ghost', icon: 'x' },
        ],
      },
      { type: 'divider' },
      {
        type: 'popover', position: 'bottom', trigger: 'click',
        children: [
          {
            type: 'data-grid', entity: entityName,
            emptyIcon: searchIcon,
            emptyTitle: 'No results found',
            emptyDescription: 'Try a different search term.',
            renderItem: ['fn', 'item', {
              type: 'stack', direction: 'vertical', gap: 'sm',
              children: [
                { type: 'typography', variant: 'h4', content: `@item.${displayField}` },
              ],
            }],
          },
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
        { name: 'searching' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SEARCH', name: 'Search', payload: [{ name: 'query', type: 'string', required: true }] },
        { key: 'CLEAR', name: 'Clear' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', searchInputView],
          ],
        },
        {
          from: 'idle', to: 'searching', event: 'SEARCH',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', resultsView],
          ],
        },
        {
          from: 'searching', to: 'searching', event: 'SEARCH',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', resultsView],
          ],
        },
        {
          from: 'searching', to: 'idle', event: 'CLEAR',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', searchInputView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: SearchConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdSearchEntity(params: StdSearchParams): Entity {
  return buildEntity(resolve(params));
}

export function stdSearchTrait(params: StdSearchParams): Trait {
  return buildTrait(resolve(params));
}

export function stdSearchPage(params: StdSearchParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdSearch(params: StdSearchParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  ));
}
