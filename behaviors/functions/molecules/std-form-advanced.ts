/**
 * std-form-advanced
 *
 * Advanced form molecule with relation-select for linked entity fields.
 * Absorbs: relation-select.
 *
 * @level molecule
 * @family form
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';
import { humanizeLabel, SYSTEM_FIELDS } from '../utils.js';

// ============================================================================
// Params
// ============================================================================

export interface StdFormAdvancedParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  headerIcon?: string;
  pageTitle?: string;
  /** Related entity name for relation-select field */
  relatedEntity?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface FormAdvancedConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  headerIcon: string;
  pageTitle: string;
  relatedEntity: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdFormAdvancedParams): FormAdvancedConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  // Inject fields of every type to showcase all form widget types
  const fields: EntityField[] = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'notes') ? [] : [{ name: 'notes', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'age') ? [] : [{ name: 'age', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'isActive') ? [] : [{ name: 'isActive', type: 'boolean' as const, default: false }]),
    ...(baseFields.some(f => f.name === 'birthDate') ? [] : [{ name: 'birthDate', type: 'date' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'priority') ? [] : [{ name: 'priority', type: 'string' as const, default: 'medium', values: ['low', 'medium', 'high', 'critical'] }]),
    ...(baseFields.some(f => f.name === 'categoryId') ? [] : [{ name: 'categoryId', type: 'relation' as EntityField['type'], default: '', relation: { entity: params.relatedEntity ?? entityName, cardinality: 'many-to-one' as const } }]),
  ];
  const nonIdFields = fields.filter(f => f.name !== 'id' && !SYSTEM_FIELDS.has(f.name));
  const p = plural(entityName);

  return {
    entityName,
    fields,
    nonIdFields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}FormAdvanced`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'file-text',
    pageTitle: params.pageTitle ?? `${entityName} Form`,
    relatedEntity: params.relatedEntity ?? entityName,
    pageName: params.pageName ?? `${entityName}FormPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/form`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: FormAdvancedConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: FormAdvancedConfig): Trait {
  const { entityName, nonIdFields, headerIcon, pageTitle, relatedEntity } = c;

  const editingView = {
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
      { type: 'form-section', entity: entityName, mode: 'create', submitEvent: 'SUBMIT', cancelEvent: 'INIT',
        fields: nonIdFields.map(f => {
          const fieldDef: Record<string, unknown> = { name: f.name, label: humanizeLabel(f.name) };
          if (f.type === 'number') fieldDef.type = 'number';
          else if (f.type === 'boolean') fieldDef.type = 'boolean';
          else if (f.type === 'date') fieldDef.type = 'date';
          else if (f.type === 'relation') { fieldDef.type = 'relation'; fieldDef.relation = ('relation' in f) ? f.relation : { entity: relatedEntity }; }
          else if ('values' in f && f.values) { fieldDef.type = 'enum'; fieldDef.values = f.values; }
          else if (f.name === 'notes') fieldDef.type = 'textarea';
          return fieldDef;
        }) },
      // Note: form-section already renders Save/Cancel buttons via submitEvent/cancelEvent
    ],
  };

  const submittedView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'typography', content: 'Form Submitted', variant: 'h2' },
      { type: 'alert', variant: 'success', message: 'Your form has been submitted successfully.' },
      {
        type: 'grid', columns: 2, gap: 'md',
        children: nonIdFields.map(f => ({
          type: 'stack', direction: 'vertical', gap: 'xs',
          children: [
            { type: 'typography', variant: 'caption', color: 'muted', content: humanizeLabel(f.name) },
            { type: 'typography', variant: 'body', content: ['object/get', ['array/first', '@entity'], f.name] },
          ],
        })),
      },
      { type: 'button', label: 'New Entry', event: 'RESET', variant: 'primary', icon: 'plus' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'editing', isInitial: true },
        { name: 'submitted' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SUBMIT', name: 'Submit', payload: [{ name: 'data', type: 'object', required: true }] },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        { from: 'editing', to: 'editing', event: 'INIT', effects: [
          ['fetch', entityName, { include: ['categoryId'] }],
          ['fetch', relatedEntity],
          ['render-ui', 'main', editingView],
        ] },
        { from: 'editing', to: 'submitted', event: 'SUBMIT', effects: [['persist', 'create', entityName, '@payload.data'], ['render-ui', 'main', submittedView]] },
        { from: 'submitted', to: 'editing', event: 'RESET', effects: [
          ['fetch', entityName, { include: ['categoryId'] }],
          ['fetch', relatedEntity],
          ['render-ui', 'main', editingView],
        ] },
      ],
    },
  } as Trait;
}

function buildPage(c: FormAdvancedConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdFormAdvancedEntity(params: StdFormAdvancedParams): Entity { return buildEntity(resolve(params)); }
export function stdFormAdvancedTrait(params: StdFormAdvancedParams): Trait { return buildTrait(resolve(params)); }
export function stdFormAdvancedPage(params: StdFormAdvancedParams): Page { return buildPage(resolve(params)); }

export function stdFormAdvanced(params: StdFormAdvancedParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
