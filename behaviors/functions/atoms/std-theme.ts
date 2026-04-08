/**
 * std-theme
 *
 * Theme selection atom with toggle and full selector.
 * Absorbs: theme-toggle, theme-selector.
 *
 * @level atom
 * @family theme
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

export interface StdThemeParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  headerIcon?: string;
  pageTitle?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface ThemeConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  headerIcon: string;
  pageTitle: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdThemeParams): ThemeConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'mode') ? [] : [{ name: 'mode', type: 'string' as const, default: 'light' }]),
    ...(baseFields.some(f => f.name === 'colorScheme') ? [] : [{ name: 'colorScheme', type: 'string' as const, default: 'default' }]),
  ];
  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Theme`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'palette',
    pageTitle: params.pageTitle ?? 'Theme Settings',
    pageName: params.pageName ?? `${entityName}ThemePage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/theme`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

const ef = (field: string): unknown[] => ['object/get', ['array/first', '@entity'], field];

function buildEntity(c: ThemeConfig): Entity {
  const instances = [
    { id: 'theme-1', name: 'Default Theme', description: 'System default', status: 'active', createdAt: '2026-01-01', mode: 'light', colorScheme: 'almadar' },
  ];
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, instances });
}

function buildTrait(c: ThemeConfig): Trait {
  const { entityName, headerIcon, pageTitle } = c;

  const mainView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', variant: 'h4', content: 'Quick Toggle' },
            { type: 'typography', variant: 'caption', color: 'muted', content: 'Switch between light and dark mode' },
            { type: 'theme-toggle' },
          ],
        }],
      },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', variant: 'h4', content: 'Theme Palette' },
            { type: 'typography', variant: 'caption', color: 'muted', content: 'Choose from available color schemes' },
            {
              type: 'simple-grid', columns: 3,
              children: [
                { type: 'button', label: 'Almadar', event: 'SELECT', variant: 'secondary' },
                { type: 'button', label: 'Ocean', event: 'SELECT', variant: 'secondary' },
                { type: 'button', label: 'Forest', event: 'SELECT', variant: 'secondary' },
              ],
            },
          ],
        }],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: 'Current mode:' },
          { type: 'badge', label: ef('mode') },
          { type: 'typography', variant: 'caption', content: 'Scheme:' },
          { type: 'badge', label: ef('colorScheme') },
        ],
      },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [{ name: 'idle', isInitial: true }],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'TOGGLE', name: 'Toggle Theme' },
        { key: 'SELECT', name: 'Select Theme', payload: [{ name: 'theme', type: 'string', required: true }] },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', mainView]] },
        { from: 'idle', to: 'idle', event: 'TOGGLE', effects: [['render-ui', 'main', mainView]] },
        { from: 'idle', to: 'idle', event: 'SELECT', effects: [['set', '@entity.colorScheme', '@payload.theme'], ['render-ui', 'main', mainView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: ThemeConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdThemeEntity(params: StdThemeParams): Entity { return buildEntity(resolve(params)); }
export function stdThemeTrait(params: StdThemeParams): Trait { return buildTrait(resolve(params)); }
export function stdThemePage(params: StdThemeParams): Page { return buildPage(resolve(params)); }

export function stdTheme(params: StdThemeParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
