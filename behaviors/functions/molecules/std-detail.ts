/**
 * std-detail
 *
 * Browse + Create + View molecule. Composes atoms:
 * - stdBrowse: data-grid with View item action and Create header action
 * - stdModal: create form (responds to CREATE)
 * - stdModal: view detail (responds to VIEW)
 *
 * No edit/delete from list. Used for feeds, ledgers, galleries.
 *
 * @level molecule
 * @family crud
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdBrowse } from '../atoms/std-browse.js';
import { stdModal } from '../atoms/std-modal.js';

// ============================================================================
// Params
// ============================================================================

export interface StdDetailParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  listFields?: string[];
  detailFields?: string[];
  formFields?: string[];
  pageTitle?: string;
  createButtonLabel?: string;
  createFormTitle?: string;
  headerIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface DetailConfig {
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
  headerIcon: string;
  emptyTitle: string;
  emptyDescription: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdDetailParams): DetailConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName, fields, nonIdFields,
    listFields: params.listFields ?? nonIdFields.slice(0, 3).map(f => f.name),
    detailFields: params.detailFields ?? nonIdFields.map(f => f.name),
    formFields: params.formFields ?? nonIdFields.map(f => f.name),
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    pageTitle: params.pageTitle ?? p,
    createButtonLabel: params.createButtonLabel ?? `Create ${entityName}`,
    createFormTitle: params.createFormTitle ?? `New ${entityName}`,
    headerIcon: params.headerIcon ?? 'file-text',
    emptyTitle: params.emptyTitle ?? `No ${p.toLowerCase()} yet`,
    emptyDescription: params.emptyDescription ?? `Create your first ${entityName.toLowerCase()} to get started.`,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

export function stdDetailEntity(params: StdDetailParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

export function stdDetailTrait(params: StdDetailParams): Trait {
  return extractTrait(stdDetail(params));
}

export function stdDetailPage(params: StdDetailParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [{ ref: `${c.entityName}Browse` }, { ref: `${c.entityName}Create` }, { ref: `${c.entityName}View` }],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdDetail(params: StdDetailParams): OrbitalDefinition {
  const c = resolve(params);
  const { entityName, fields, formFields, detailFields } = c;

  // Browse atom: list with View action + Create button, refreshes on SAVE
  const browseTrait = extractTrait(stdBrowse({
    entityName, fields,
    traitName: `${entityName}Browse`,
    listFields: c.listFields,
    headerIcon: c.headerIcon,
    pageTitle: c.pageTitle,
    emptyTitle: c.emptyTitle,
    emptyDescription: c.emptyDescription,
    headerActions: [{ label: c.createButtonLabel, event: 'CREATE', variant: 'primary', icon: 'plus' }],
    itemActions: [{ label: 'View', event: 'VIEW' }],
    refreshEvents: ['SAVE'],
  }));

  // Create modal atom
  const createTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Create`,
    modalTitle: c.createFormTitle,
    headerIcon: 'plus-circle',
    openContent: {
      type: 'stack', direction: 'vertical', gap: 'md',
      children: [
        { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
          { type: 'icon', name: 'plus-circle', size: 'md' },
          { type: 'typography', content: c.createFormTitle, variant: 'h3' },
        ] },
        { type: 'divider' },
        { type: 'form-section', entity: entityName, mode: 'create', submitEvent: 'SAVE', cancelEvent: 'CLOSE', fields: formFields },
      ],
    },
    openEvent: 'CREATE',
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName]],
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'create', entityName, '@payload.data'], ['fetch', entityName]],
    emitOnSave: 'SAVE',
  }));

  // View modal atom
  const viewTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}View`,
    modalTitle: `View ${entityName}`,
    headerIcon: 'eye',
    openContent: {
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
            { type: 'typography', variant: 'caption', content: f.charAt(0).toUpperCase() + f.slice(1) },
            { type: 'typography', variant: 'body', content: `@entity.${f}` },
          ],
        })),
        { type: 'divider' },
        { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end', children: [
          { type: 'button', label: 'Close', event: 'CLOSE', variant: 'ghost' },
        ] },
      ],
    },
    openEvent: 'VIEW',
    openPayload: [{ name: 'id', type: 'string', required: true }],
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName, '@payload.id']],
  }));

  const entity = makeEntity({ name: entityName, fields, persistence: c.persistence, collection: c.collection });

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [{ ref: browseTrait.name }, { ref: createTrait.name }, { ref: viewTrait.name }],
  } as Page;

  return {
    name: `${entityName}Orbital`,
    entity,
    traits: [browseTrait, createTrait, viewTrait],
    pages: [page],
  } as OrbitalDefinition;
}
