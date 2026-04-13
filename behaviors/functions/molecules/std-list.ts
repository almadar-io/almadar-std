/**
 * std-list
 *
 * CRUD list molecule. Composes atoms via shared event bus:
 * - stdBrowse: data-grid with item actions (fires CREATE, VIEW, EDIT, DELETE)
 * - stdModal (x3): create form, edit form, detail view (responds to matching events)
 * - stdConfirmation: delete confirmation (responds to DELETE → CONFIRM_DELETE)
 *
 * Phase F.10: previously the delete confirmation was inlined into the browse
 * trait via post-processing (added a `deleting` state, three new transitions,
 * and patched the events array). That made std-list un-liftable AND prevented
 * any organism from composing it as a clean molecule. The refactored version
 * has 5 separate traits, all from extractTrait, no post-processing — so the
 * converter lifts every trait into a reference and the molecule itself
 * becomes a first-class composable unit that organisms can extend with the
 * same override surface molecules use over atoms.
 *
 * @level molecule
 * @family crud
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
import { humanizeLabel, SYSTEM_FIELDS } from '../utils.js';

// ============================================================================
// Params
// ============================================================================

export interface StdListParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  listFields?: string[];
  detailFields?: string[];
  formFields?: string[];
  pageTitle?: string;
  createButtonLabel?: string;
  editFormTitle?: string;
  createFormTitle?: string;
  deleteMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  headerIcon?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;

  // Display customization (organisms override for domain-specific layouts)
  displayPattern?: string;
  customRenderItem?: unknown;
  displayColumns?: unknown[];
  statsBar?: unknown[];
  displayProps?: Record<string, unknown>;
}

// ============================================================================
// Resolve
// ============================================================================

interface ListConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  listFields: string[];
  detailFields: string[];
  formFields: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  pageTitle: string;
  createButtonLabel: string;
  createFormTitle: string;
  editFormTitle: string;
  deleteMessage: string;
  emptyTitle: string;
  emptyDescription: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdListParams): ListConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName, fields, nonIdFields,
    listFields: params.listFields ?? nonIdFields.slice(0, 3).map(f => f.name),
    detailFields: params.detailFields ?? nonIdFields.map(f => f.name),
    formFields: params.formFields ?? nonIdFields.filter(f => !SYSTEM_FIELDS.has(f.name)).map(f => f.name),
    persistence: params.persistence ?? 'persistent',
    collection: params.collection,
    pageTitle: params.pageTitle ?? p,
    createButtonLabel: params.createButtonLabel ?? `Create ${entityName}`,
    createFormTitle: params.createFormTitle ?? `Create ${entityName}`,
    editFormTitle: params.editFormTitle ?? `Edit ${entityName}`,
    deleteMessage: params.deleteMessage ?? `This action cannot be undone.`,
    emptyTitle: params.emptyTitle ?? `No ${p.toLowerCase()} yet`,
    emptyDescription: params.emptyDescription ?? `Create your first ${entityName.toLowerCase()} to get started.`,
    headerIcon: params.headerIcon ?? 'list',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Content builders
// ============================================================================

function formContent(entityName: string, mode: 'create' | 'edit', title: string, icon: string, formFields: string[], saveEvent: string, cancelEvent: string): unknown {
  const formSection: Record<string, unknown> = { type: 'form-section', entity: entityName, mode, submitEvent: saveEvent, cancelEvent, fields: formFields };
  if (mode === 'edit') {
    formSection.entityId = '@entity.id';
  }
  return {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: icon, size: 'md' },
        { type: 'typography', content: title, variant: 'h3' },
      ] },
      { type: 'divider' },
      formSection,
    ],
  };
}

function detailContent(detailFields: string[], closeEvent: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
        { type: 'icon', name: 'eye', size: 'md' },
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
        { type: 'button', label: 'Edit', event: 'EDIT', variant: 'primary', icon: 'edit' },
        { type: 'button', label: 'Close', event: closeEvent, variant: 'ghost' },
      ] },
    ],
  };
}

// ============================================================================
// Projections
// ============================================================================

export function stdListEntity(params: StdListParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

export function stdListTrait(params: StdListParams): Trait {
  return extractTrait(stdList(params));
}

export function stdListPage(params: StdListParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Browse` },
      { ref: `${c.entityName}Create` },
      { ref: `${c.entityName}Edit` },
      { ref: `${c.entityName}View` },
      { ref: `${c.entityName}Delete` },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdList(params: StdListParams): OrbitalSchema {
  const c = resolve(params);
  const { entityName, fields, formFields, detailFields } = c;
  const UPPER = entityName.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
  const CREATED = `${UPPER}_CREATED`;
  const UPDATED = `${UPPER}_UPDATED`;
  const DELETED = `${UPPER}_DELETED`;

  // 1. Browse trait. Refresh events include DELETED so the list re-fetches
  // after the delete confirmation completes. The browse trait declares
  // DELETE in its itemActions; the deleteTrait listens for that event and
  // runs the confirmation flow.
  const browseTrait = extractTrait(stdBrowse({
    entityName, fields,
    traitName: `${entityName}Browse`,
    listFields: c.listFields,
    headerIcon: c.headerIcon,
    pageTitle: c.pageTitle,
    emptyTitle: c.emptyTitle,
    emptyDescription: c.emptyDescription,
    displayPattern: params.displayPattern,
    customRenderItem: params.customRenderItem,
    displayColumns: params.displayColumns,
    statsBar: params.statsBar,
    displayProps: params.displayProps,
    headerActions: [{ label: c.createButtonLabel, event: 'CREATE', variant: 'primary', icon: 'plus' }],
    itemActions: [
      { label: 'View', event: 'VIEW' },
      { label: 'Edit', event: 'EDIT' },
      { label: 'Delete', event: 'DELETE', variant: 'danger' },
    ],
    refreshEvents: [CREATED, UPDATED, DELETED],
  }));

  const createTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Create`,
    modalTitle: c.createFormTitle,
    headerIcon: 'plus-circle',
    openContent: formContent(entityName, 'create', c.createFormTitle, 'plus-circle', formFields, 'SAVE', 'CLOSE'),
    openEvent: 'CREATE',
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName]],
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'create', entityName, '@payload.data']],
    emitOnSave: CREATED,
  }));

  const editTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Edit`,
    modalTitle: c.editFormTitle,
    headerIcon: 'edit',
    openContent: formContent(entityName, 'edit', c.editFormTitle, 'edit', formFields, 'SAVE', 'CLOSE'),
    openEvent: 'EDIT',
    openPayload: [{ name: 'id', type: 'string', required: true }],
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName, { id: '@payload.id' }]],
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'update', entityName, '@payload.data']],
    emitOnSave: UPDATED,
  }));

  const viewTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}View`,
    modalTitle: `View ${entityName}`,
    headerIcon: 'eye',
    openContent: detailContent(detailFields, 'CLOSE'),
    openEvent: 'VIEW',
    openPayload: [{ name: 'id', type: 'string', required: true }],
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName, { id: '@payload.id' }]],
  }));

  // Delete confirmation. Composes std-confirmation with the canonical
  // pattern: REQUEST stores @payload.id in @entity.pendingId, CONFIRM uses
  // @entity.pendingId in the persist effect. Emits DELETED on success so
  // the browse trait's listens fires INIT and re-fetches.
  const deleteTrait = extractTrait(stdConfirmation({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Delete`,
    confirmTitle: `Delete ${entityName}`,
    confirmMessage: c.deleteMessage,
    confirmLabel: 'Delete',
    headerIcon: 'trash-2',
    requestEvent: 'DELETE',
    confirmEvent: 'CONFIRM_DELETE',
    confirmEffects: [['persist', 'delete', entityName, '@entity.pendingId']],
    emitOnConfirm: DELETED,
  }));

  // 2. Shared entity (pendingId needed by the confirmation trait's REQUEST → CONFIRM flow)
  const entityFields = fields.some(f => f.name === 'pendingId') ? fields : [...fields, { name: 'pendingId', type: 'string' as const, default: '' }];
  const entity = makeEntity({ name: entityName, fields: entityFields, persistence: c.persistence, collection: c.collection });

  // 3. Page references all 5 traits
  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: browseTrait.name },
      { ref: createTrait.name },
      { ref: editTrait.name },
      { ref: viewTrait.name },
      { ref: deleteTrait.name },
    ],
  } as Page;

  // 4. One orbital, 5 traits, shared event bus. Each trait owns its own
  // state machine (clean atomic composition, no post-processing).
  return makeSchema(`${entityName}Orbital`, {
    name: `${entityName}Orbital`,
    entity,
    traits: [browseTrait, createTrait, editTrait, viewTrait, deleteTrait],
    pages: [page],
  } as OrbitalDefinition);
}
