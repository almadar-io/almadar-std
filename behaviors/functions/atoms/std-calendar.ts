/**
 * std-calendar
 *
 * Calendar browsing atom with month/day/slot views.
 * Absorbs: calendar-grid, day-cell, time-slot-cell, date-range-selector.
 *
 * @level atom
 * @family calendar
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdCalendarParams {
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

interface CalendarConfig {
  entityName: string;
  fields: EntityField[];
  displayField: string;
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  headerIcon: string;
  pageTitle: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdCalendarParams): CalendarConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'date') ? [] : [{ name: 'date', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'time') ? [] : [{ name: 'time', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'duration') ? [] : [{ name: 'duration', type: 'number' as const, default: 60 }]),
  ];
  const nonIdFields = baseFields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Calendar`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'calendar',
    pageTitle: params.pageTitle ?? `${p} Calendar`,
    pageName: params.pageName ?? `${entityName}CalendarPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/calendar`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: CalendarConfig): Entity {
  const instances = [
    { id: 'evt-1', name: 'Team Standup', description: 'Daily sync', status: 'active', createdAt: '2026-03-19', date: '2026-03-19', time: '09:00', duration: 30 },
    { id: 'evt-2', name: 'Sprint Review', description: 'End of sprint demo', status: 'active', createdAt: '2026-03-19', date: '2026-03-21', time: '14:00', duration: 60 },
    { id: 'evt-3', name: 'Design Workshop', description: 'UI/UX review session', status: 'pending', createdAt: '2026-03-19', date: '2026-03-22', time: '10:30', duration: 90 },
  ];
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, instances });
}

function buildTrait(c: CalendarConfig): Trait {
  const { entityName, displayField, headerIcon, pageTitle } = c;

  const monthView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', align: 'center',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: pageTitle, variant: 'h2' },
            ],
          },
          { type: 'date-range-selector', startDate: '2026-01-01', endDate: '2026-12-31', onSelect: 'SELECT_DAY' },
        ],
      },
      { type: 'divider' },
      {
        type: 'calendar-grid', month: 3, year: 2026, entity: entityName,
        renderDay: ['fn', 'item', {
          type: 'day-cell', date: `@item.${displayField}`, events: [],
          onSelect: 'SELECT_DAY',
        }],
      },
    ],
  };

  const dayView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', align: 'center',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'clock', size: 'lg' },
              { type: 'typography', content: 'Day View', variant: 'h2' },
            ],
          },
          { type: 'button', label: 'Back to Month', event: 'BACK', variant: 'ghost', icon: 'arrow-left' },
        ],
      },
      { type: 'divider' },
      {
        type: 'data-list', entity: entityName,
        emptyIcon: 'calendar',
        emptyTitle: 'No events today',
        emptyDescription: 'Select a time slot to add an event.',
        renderItem: ['fn', 'item', {
          type: 'time-slot-cell', startTime: `@item.time`, duration: 60,
          label: `@item.${displayField}`, onSelect: 'SELECT_SLOT',
        }],
      },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'month-view', isInitial: true },
        { name: 'day-view' },
        { name: 'slot-selected' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SELECT_DAY', name: 'Select Day', payload: [{ name: 'date', type: 'string', required: true }] },
        { key: 'SELECT_SLOT', name: 'Select Slot', payload: [{ name: 'time', type: 'string', required: true }] },
        { key: 'BACK', name: 'Back' },
      ],
      transitions: [
        { from: 'month-view', to: 'month-view', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', monthView]] },
        { from: 'month-view', to: 'day-view', event: 'SELECT_DAY', effects: [['fetch', entityName], ['render-ui', 'main', dayView]] },
        { from: 'day-view', to: 'slot-selected', event: 'SELECT_SLOT', effects: [['set', '@entity.time', '@payload.time'], ['render-ui', 'main', dayView]] },
        { from: 'day-view', to: 'month-view', event: 'BACK', effects: [['fetch', entityName], ['render-ui', 'main', monthView]] },
        { from: 'slot-selected', to: 'month-view', event: 'BACK', effects: [['fetch', entityName], ['render-ui', 'main', monthView]] },
        { from: 'slot-selected', to: 'day-view', event: 'SELECT_DAY', effects: [['fetch', entityName], ['render-ui', 'main', dayView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: CalendarConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdCalendarEntity(params: StdCalendarParams): Entity { return buildEntity(resolve(params)); }
export function stdCalendarTrait(params: StdCalendarParams): Trait { return buildTrait(resolve(params)); }
export function stdCalendarPage(params: StdCalendarParams): Page { return buildPage(resolve(params)); }

export function stdCalendar(params: StdCalendarParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
