/**
 * std-geospatial
 *
 * Location selection molecule. Composes atoms via shared event bus:
 * - stdBrowse: location list with "Select" item action (fires SELECT)
 * - stdModal: select/view location detail (responds to SELECT)
 * - stdConfirmation: confirm location selection (responds to CONFIRM_SELECT)
 *
 * No emits/listens wiring. Traits on the same page share the event bus.
 * Only the trait with a matching transition from its current state responds.
 *
 * @level molecule
 * @family location
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
import { makeEntity, ensureIdField, plural, extractTrait, makeSchema, } from '@almadar/core/builders';
import { stdBrowse } from '../atoms/std-browse.js';
import { stdModal } from '../atoms/std-modal.js';
import { stdConfirmation } from '../atoms/std-confirmation.js';
import { humanizeLabel } from '../utils.js';

// ============================================================================
// Params
// ============================================================================

export interface StdGeospatialParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Display
  listFields?: string[];
  detailFields?: string[];

  // Labels
  pageTitle?: string;
  selectLabel?: string;
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

interface GeospatialConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  listFields: string[];
  detailFields: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  pageTitle: string;
  selectLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdGeospatialParams): GeospatialConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const p = plural(entityName);

  // Domain fields required by stdConfirmation's render-ui bindings (@entity.pendingId)
  const domainFields: EntityField[] = [
    { name: 'pendingId', type: 'string', default: '' },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = [...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))];
  const nonIdFields = fields.filter(f => f.name !== 'id');

  return {
    entityName, fields, nonIdFields,
    listFields: params.listFields ?? nonIdFields.slice(0, 3).map(f => f.name),
    detailFields: params.detailFields ?? nonIdFields.map(f => f.name),
    persistence: params.persistence ?? 'persistent',
    collection: params.collection,
    pageTitle: params.pageTitle ?? `${p} Picker`,
    selectLabel: params.selectLabel ?? `Select ${entityName}`,
    emptyTitle: params.emptyTitle ?? `No ${p.toLowerCase()} found`,
    emptyDescription: params.emptyDescription ?? `No ${p.toLowerCase()} are available to select.`,
    headerIcon: params.headerIcon ?? 'map-pin',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Content builders
// ============================================================================

function detailContent(detailFields: string[], headerIcon: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
        { type: 'icon', name: headerIcon, size: 'md' },
        { type: 'typography', variant: 'h3', content: `@entity.${detailFields[0] ?? 'id'}` },
      ] },
      { type: 'divider' },
      ...detailFields.map(f => ({
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: humanizeLabel(f) },
          { type: 'typography', variant: 'body', content: `@entity.${f}` },
        ],
      })),
      { type: 'divider' },
      { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end', children: [
        { type: 'button', label: 'Cancel', event: 'CLOSE', variant: 'ghost' },
        { type: 'button', label: 'Confirm Selection', event: 'CONFIRM_SELECT', variant: 'primary', icon: 'check' },
      ] },
    ],
  };
}

// ============================================================================
// Projections
// ============================================================================

export function stdGeospatialEntity(params: StdGeospatialParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

export function stdGeospatialTrait(params: StdGeospatialParams): Trait {
  return extractTrait(stdGeospatial(params));
}

export function stdGeospatialPage(params: StdGeospatialParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Browse` },
      { ref: `${c.entityName}Select` },
      { ref: `${c.entityName}ConfirmSelect` },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdGeospatial(params: StdGeospatialParams): OrbitalSchema {
  const c = resolve(params);
  const { entityName, fields, detailFields } = c;

  // 1. Build atoms (shared event names, no wiring needed)
  const browseTrait = extractTrait(stdBrowse({
    entityName, fields,
    traitName: `${entityName}Browse`,
    listFields: c.listFields,
    headerIcon: c.headerIcon,
    pageTitle: c.pageTitle,
    emptyTitle: c.emptyTitle,
    emptyDescription: c.emptyDescription,
    itemActions: [
      { label: c.selectLabel, event: 'SELECT' },
    ],
    refreshEvents: ['CONFIRMED'],
  }));

  const selectTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Select`,
    modalTitle: `Select ${entityName}`,
    headerIcon: c.headerIcon,
    openContent: detailContent(detailFields, c.headerIcon),
    openEvent: 'SELECT',
    openPayload: [{ name: 'id', type: 'string', required: true }],
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName, { id: '@payload.id' }]],
    saveEvent: 'CONFIRM_SELECT',
    saveEffects: [],
  }));

  const confirmTrait = extractTrait(stdConfirmation({ standalone: false,
    entityName, fields,
    traitName: `${entityName}ConfirmSelect`,
    confirmTitle: `Confirm ${entityName} Selection`,
    confirmMessage: `Are you sure you want to select this ${entityName.toLowerCase()}?`,
    confirmLabel: 'Confirm',
    headerIcon: 'check-circle',
    requestEvent: 'CONFIRM_SELECT',
    confirmEvent: 'CONFIRMED',
    confirmEffects: [['fetch', entityName]],
    emitOnConfirm: 'CONFIRMED',
  }));

  // 2. Shared entity
  // pendingId needed by the confirmation trait's REQUEST → CONFIRM flow
  const entityFields = fields.some(f => f.name === 'pendingId') ? fields : [...fields, { name: 'pendingId', type: 'string' as const, default: '' }];
  const entity = makeEntity({ name: entityName, fields: entityFields, persistence: c.persistence, collection: c.collection });

  // 3. Page references all traits
  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: browseTrait.name },
      { ref: selectTrait.name },
      { ref: confirmTrait.name },
    ],
  } as Page;

  // 4. One orbital, multiple traits, shared event bus
  return makeSchema(`${entityName}Orbital`, {
    name: `${entityName}Orbital`,
    entity,
    traits: [browseTrait, selectTrait, confirmTrait],
    pages: [page],
  } as OrbitalDefinition);
}
