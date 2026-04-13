/**
 * std-service-notification-hub
 *
 * Unified notification sender molecule. Composes email and twilio into a single
 * trait with channel selection (Email, SMS, WhatsApp). A single state machine
 * routes to the appropriate call-service based on the chosen channel.
 *
 * States: idle -> sending -> sent | error
 * Channels: email (call-service email/send), sms (call-service twilio/sendSMS),
 *           whatsapp (call-service twilio/sendWhatsApp)
 *
 * @level molecule
 * @family service
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

export interface StdServiceNotificationHubParams {
  /** Entity name in PascalCase (default: "Notification") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, notification fields are always included) */
  fields?: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Page name override */
  pageName?: string;
  /** Page path override */
  pagePath?: string;
  /** Whether this page is the initial route */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface NotificationHubConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceNotificationHubParams): NotificationHubConfig {
  const entityName = params.entityName ?? 'Notification';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'recipient', type: 'string' },
    { name: 'subject', type: 'string' },
    { name: 'messageBody', type: 'string' },
    { name: 'channel', type: 'string', default: 'email' },
    { name: 'sendStatus', type: 'string', default: 'idle' },
    { name: 'error', type: 'string' },
  ];
  const baseFields = params.fields ?? [];
  const existingNames = new Set(baseFields.map(f => f.name));
  const mergedFields = [
    ...baseFields,
    ...requiredFields.filter(f => !existingNames.has(f.name)),
  ];

  return {
    entityName,
    fields: ensureIdField(mergedFields),
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}NotificationHub`,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: NotificationHubConfig): Entity {
  const notificationFields: EntityField[] = [
    { name: 'recipient', type: 'string' as const, default: '' },
    { name: 'subject', type: 'string' as const, default: '' },
    { name: 'messageBody', type: 'string' as const, default: '' },
    { name: 'channel', type: 'string' as const, default: 'email' },
    { name: 'sendStatus', type: 'string' as const, default: 'idle' },
    { name: 'error', type: 'string' as const, default: '' },
  ];

  const userFieldNames = new Set(c.fields.map(f => f.name));
  const extraFields = notificationFields.filter(f => !userFieldNames.has(f.name));
  const allFields = ensureIdField([...c.fields, ...extraFields]);

  return makeEntity({ name: c.entityName, fields: allFields, persistence: c.persistence });
}

function buildTrait(c: NotificationHubConfig): Trait {
  const { entityName } = c;

  // ---- UI definitions ----

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'stretch',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'bell', size: 'lg' },
          { type: 'typography', content: `${entityName} Notification Hub`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'input', label: 'Recipient', bind: '@entity.recipient', placeholder: 'Email or phone number' },
      { type: 'input', label: 'Subject', bind: '@entity.subject', placeholder: 'Notification subject' },
      { type: 'textarea', label: 'Message', bind: '@entity.messageBody', placeholder: 'Write your message...' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Email', event: 'SEND_EMAIL', variant: 'primary', icon: 'mail' },
          { type: 'button', label: 'SMS', event: 'SEND_SMS', variant: 'secondary', icon: 'message-circle' },
          { type: 'button', label: 'WhatsApp', event: 'SEND_WHATSAPP', variant: 'secondary', icon: 'phone' },
        ],
      },
    ],
  };

  const sendingUI = {
    type: 'loading-state', title: 'Sending notification...', message: `Delivering ${entityName.toLowerCase()} notification...`,
  };

  const sentUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Notification sent successfully' },
      { type: 'button', label: 'Send Another', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const errorUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'error-state', title: 'Send Failed', message: 'Could not deliver the notification.', onRetry: 'RETRY' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Retry', event: 'RETRY', variant: 'primary', icon: 'refresh-cw' },
          { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
    ],
  };

  // ---- Transitions ----

  const transitions: unknown[] = [
    // INIT: idle -> idle (fetch + render compose form)
    {
      from: 'idle', to: 'idle', event: 'INIT',
      effects: [
        ['fetch', entityName],
        ['render-ui', 'main', idleUI],
      ],
    },
    // SEND_EMAIL: idle -> sending (call email service + set channel + show loading)
    {
      from: 'idle', to: 'sending', event: 'SEND_EMAIL',
      effects: [
        ['set', '@entity.channel', 'email'],
        ['render-ui', 'main', sendingUI],
        ['call-service', 'email', 'send', { to: '@entity.recipient', subject: '@entity.subject', body: '@entity.messageBody' }],
      ],
    },
    // SEND_SMS: idle -> sending (call twilio sendSMS + set channel + show loading)
    {
      from: 'idle', to: 'sending', event: 'SEND_SMS',
      effects: [
        ['set', '@entity.channel', 'sms'],
        ['render-ui', 'main', sendingUI],
        ['call-service', 'twilio', 'sendSMS', { to: '@entity.recipient', body: '@entity.messageBody' }],
      ],
    },
    // SEND_WHATSAPP: idle -> sending (call twilio sendWhatsApp + set channel + show loading)
    {
      from: 'idle', to: 'sending', event: 'SEND_WHATSAPP',
      effects: [
        ['set', '@entity.channel', 'whatsapp'],
        ['render-ui', 'main', sendingUI],
        ['call-service', 'twilio', 'sendWhatsApp', { to: '@entity.recipient', body: '@entity.messageBody' }],
      ],
    },
    // SENT: sending -> sent (delivery confirmed)
    {
      from: 'sending', to: 'sent', event: 'SENT',
      effects: [
        ['set', '@entity.sendStatus', 'sent'],
        ['render-ui', 'main', sentUI],
      ],
    },
    // FAILED: sending -> error (delivery failed)
    {
      from: 'sending', to: 'error', event: 'FAILED',
      effects: [
        ['set', '@entity.sendStatus', 'error'],
        ['set', '@entity.error', '@payload.error'],
        ['render-ui', 'main', errorUI],
      ],
    },
    // RETRY: error -> idle
    {
      from: 'error', to: 'idle', event: 'RETRY',
      effects: [['render-ui', 'main', idleUI]],
    },
    // RESET: sent -> idle
    {
      from: 'sent', to: 'idle', event: 'RESET',
      effects: [
        ['set', '@entity.sendStatus', 'idle'],
        ['render-ui', 'main', idleUI],
      ],
    },
    // RESET: error -> idle
    {
      from: 'error', to: 'idle', event: 'RESET',
      effects: [
        ['set', '@entity.sendStatus', 'idle'],
        ['render-ui', 'main', idleUI],
      ],
    },
  ];

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'sending' },
        { name: 'sent' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SEND_EMAIL', name: 'Send Email' },
        { key: 'SEND_SMS', name: 'Send SMS' },
        { key: 'SEND_WHATSAPP', name: 'Send WhatsApp' },
        { key: 'SENT', name: 'Notification Sent' },
        { key: 'FAILED', name: 'Send Failed', payload: [
          { name: 'error', type: 'string', required: true },
        ]},
        { key: 'RETRY', name: 'Retry' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions,
    },
  } as Trait;
}

function buildPage(c: NotificationHubConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceNotificationHubEntity(params: StdServiceNotificationHubParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceNotificationHubTrait(params: StdServiceNotificationHubParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceNotificationHubPage(params: StdServiceNotificationHubParams = {}): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceNotificationHub(params: StdServiceNotificationHubParams = {}): OrbitalSchema {
  const c = resolve(params);

  return makeSchema(`${c.entityName}Orbital`, makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  ));
}
