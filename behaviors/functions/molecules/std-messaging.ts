/**
 * std-messaging
 *
 * Messaging molecule. Composes atoms via shared event bus:
 * - stdBrowse: message list with "Compose" header action, "View" item action
 * - stdModal (compose): compose/send message form (COMPOSE -> SEND)
 * - stdModal (view): view message detail (VIEW with id payload)
 *
 * No emits/listens wiring. Traits on the same page share the event bus.
 * Only the trait with a matching transition from its current state responds.
 *
 * @level molecule
 * @family communication
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdBrowse } from '../atoms/std-browse.js';
import { stdModal } from '../atoms/std-modal.js';

// ============================================================================
// Params
// ============================================================================

export interface StdMessagingParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Display
  listFields?: string[];
  formFields?: string[];
  detailFields?: string[];

  // Labels
  pageTitle?: string;
  composerTitle?: string;

  // Icons
  headerIcon?: string;

  // Page
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

interface MessagingConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  listFields: string[];
  formFields: string[];
  detailFields: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  pageTitle: string;
  composerTitle: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdMessagingParams): MessagingConfig {
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
    detailFields: params.detailFields ?? nonIdFields.map(f => f.name),
    persistence: params.persistence ?? 'persistent',
    collection: params.collection,
    pageTitle: params.pageTitle ?? p,
    composerTitle: params.composerTitle ?? `New ${entityName}`,
    headerIcon: params.headerIcon ?? 'message-circle',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Content builders
// ============================================================================

function composeContent(entityName: string, title: string, formFields: string[]): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'edit', size: 'md' },
        { type: 'typography', content: title, variant: 'h3' },
      ] },
      { type: 'divider' },
      { type: 'form-section', entity: entityName, mode: 'create', submitEvent: 'SEND', cancelEvent: 'CLOSE', fields: formFields },
    ],
  };
}

function viewContent(detailFields: string[]): unknown {
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
          { type: 'typography', variant: 'caption', content: f.charAt(0).toUpperCase() + f.slice(1) },
          { type: 'typography', variant: 'body', content: `@entity.${f}` },
        ],
      })),
      { type: 'divider' },
      { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end', children: [
        { type: 'button', label: 'Close', event: 'CLOSE', variant: 'ghost' },
      ] },
    ],
  };
}

// ============================================================================
// Projections
// ============================================================================

export function stdMessagingEntity(params: StdMessagingParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

export function stdMessagingTrait(params: StdMessagingParams): Trait {
  return extractTrait(stdMessaging(params));
}

export function stdMessagingPage(params: StdMessagingParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Browse` },
      { ref: `${c.entityName}Compose` },
      { ref: `${c.entityName}View` },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdMessaging(params: StdMessagingParams): OrbitalDefinition {
  const c = resolve(params);
  const { entityName, fields, formFields, detailFields } = c;

  // 1. Build atoms (shared event names, no wiring needed)
  const browseTrait = extractTrait(stdBrowse({
    entityName, fields,
    traitName: `${entityName}Browse`,
    listFields: c.listFields,
    headerIcon: c.headerIcon,
    pageTitle: c.pageTitle,
    emptyTitle: 'No messages yet',
    emptyDescription: 'Start a new conversation.',
    headerActions: [{ label: 'Compose', event: 'COMPOSE', variant: 'primary', icon: 'edit' }],
    itemActions: [{ label: 'View', event: 'VIEW' }],
    refreshEvents: ['SEND'],
    displayPattern: params.displayPattern,
    customRenderItem: params.customRenderItem,
    displayColumns: params.displayColumns,
    statsBar: params.statsBar,
    displayProps: params.displayProps,
  }));

  const composeTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Compose`,
    modalTitle: c.composerTitle,
    headerIcon: 'edit',
    openContent: composeContent(entityName, c.composerTitle, formFields),
    openEvent: 'COMPOSE',
    closeEvent: 'CLOSE',
    saveEvent: 'SEND',
    saveEffects: [['persist', 'create', entityName, '@payload.data'], ['fetch', entityName]],
    emitOnSave: 'SEND',
  }));

  const viewTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}View`,
    modalTitle: `View ${entityName}`,
    headerIcon: 'eye',
    openContent: viewContent(detailFields),
    openEvent: 'VIEW',
    openPayload: [{ name: 'id', type: 'string', required: true }],
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName, '@payload.id']],
  }));

  // 2. Shared entity
  const entity = makeEntity({ name: entityName, fields, persistence: c.persistence, collection: c.collection });

  // 3. Page references all traits
  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: browseTrait.name },
      { ref: composeTrait.name },
      { ref: viewTrait.name },
    ],
  } as Page;

  // 4. One orbital, multiple traits, shared event bus
  return {
    name: `${entityName}Orbital`,
    entity,
    traits: [browseTrait, composeTrait, viewTrait],
    pages: [page],
  } as OrbitalDefinition;
}
