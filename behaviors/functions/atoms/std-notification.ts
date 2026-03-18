/**
 * std-notification as a Function
 *
 * Notification behavior parameterized for any domain.
 * Provides a show/hide notification display.
 * The state machine structure is fixed. The caller controls data and presentation.
 *
 * @level atom
 * @family notification
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdNotificationParams {
  /** Entity name in PascalCase (e.g., "Alert", "Notice") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Display
  /** Header icon (Lucide name) */
  headerIcon?: string;
  /** Page title */
  pageTitle?: string;

  // Page
  /** Page name (defaults to "{Entity}NotificationPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/notifications") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface NotificationConfig {
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

function resolve(params: StdNotificationParams): NotificationConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure message and notificationType fields exist on entity for payload binding
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'message') ? [] : [{ name: 'message', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'notificationType') ? [] : [{ name: 'notificationType', type: 'string' as const, default: 'info' }]),
  ];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Notification`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'bell',
    pageTitle: params.pageTitle ?? 'Notifications',
    pageName: params.pageName ?? `${entityName}NotificationPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/notifications`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: NotificationConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: NotificationConfig): Trait {
  const { entityName, headerIcon, pageTitle } = c;

  // Hidden state view: empty-state molecule
  const hiddenView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'empty-state', icon: 'bell-off', title: 'No notifications', description: 'New notifications will appear here.' },
    ],
  };

  // Visible state view: alert molecule for proper notification styling
  const visibleView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', align: 'center',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: pageTitle, variant: 'h2' },
            ],
          },
          { type: 'button', label: 'Dismiss', event: 'HIDE', variant: 'ghost', icon: 'x' },
        ],
      },
      { type: 'divider' },
      {
        type: 'alert',
        variant: '@entity.notificationType',
        message: '@entity.message',
      },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'hidden', isInitial: true },
        { name: 'visible' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SHOW', name: 'Show Notification', payload: [
          { name: 'message', type: 'string', required: true },
          { name: 'notificationType', type: 'string' },
        ] },
        { key: 'HIDE', name: 'Hide Notification' },
      ],
      transitions: [
        // INIT: hidden -> hidden (render empty state)
        {
          from: 'hidden', to: 'hidden', event: 'INIT',
          effects: [
            ['render-ui', 'main', hiddenView],
          ],
        },
        // SHOW: hidden -> visible (render notification)
        {
          from: 'hidden', to: 'visible', event: 'SHOW',
          effects: [
            ['set', '@entity.message', '@payload.message'],
            ['set', '@entity.notificationType', '@payload.notificationType'],
            ['render-ui', 'main', visibleView],
          ],
        },
        // SHOW: visible -> visible (update notification)
        {
          from: 'visible', to: 'visible', event: 'SHOW',
          effects: [
            ['set', '@entity.message', '@payload.message'],
            ['set', '@entity.notificationType', '@payload.notificationType'],
            ['render-ui', 'main', visibleView],
          ],
        },
        // HIDE: visible -> hidden (clear notification)
        {
          from: 'visible', to: 'hidden', event: 'HIDE',
          effects: [
            ['set', '@entity.message', ''],
            ['render-ui', 'main', hiddenView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: NotificationConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdNotificationEntity(params: StdNotificationParams): Entity {
  return buildEntity(resolve(params));
}

export function stdNotificationTrait(params: StdNotificationParams): Trait {
  return buildTrait(resolve(params));
}

export function stdNotificationPage(params: StdNotificationParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdNotification(params: StdNotificationParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
