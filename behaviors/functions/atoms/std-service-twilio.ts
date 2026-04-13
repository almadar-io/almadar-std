/**
 * std-service-twilio
 *
 * Twilio messaging integration behavior: compose, send SMS or WhatsApp, track delivery.
 * Wraps the `twilio` service integration with sendSMS and sendWhatsApp operations.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level atom
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

export interface StdServiceTwilioParams {
  /** Entity name in PascalCase (default: "Message") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, messaging fields are always included) */
  fields?: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** When true, INIT renders the compose form to main. Default true. */
  standalone?: boolean;
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

interface TwilioConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  standalone: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceTwilioParams): TwilioConfig {
  const entityName = params.entityName ?? 'Message';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'to', type: 'string' },
    { name: 'messageBody', type: 'string' },
    { name: 'channel', type: 'string', default: 'sms' },
    { name: 'messageSid', type: 'string' },
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
    traitName: `${entityName}Twilio`,
    standalone: params.standalone ?? true,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: TwilioConfig): Entity {
  const twilioFields: EntityField[] = [
    { name: 'to', type: 'string' as const, default: '' },
    { name: 'messageBody', type: 'string' as const, default: '' },
    { name: 'channel', type: 'string' as const, default: 'sms' },
    { name: 'messageSid', type: 'string' as const, default: '' },
    { name: 'sendStatus', type: 'string' as const, default: 'idle' },
    { name: 'error', type: 'string' as const, default: '' },
  ];

  // Merge: user-supplied fields take precedence, then twilio-specific fields
  const userFieldNames = new Set(c.fields.map(f => f.name));
  const extraFields = twilioFields.filter(f => !userFieldNames.has(f.name));
  const allFields = ensureIdField([...c.fields, ...extraFields]);

  return makeEntity({ name: c.entityName, fields: allFields, persistence: c.persistence });
}

function buildTrait(c: TwilioConfig): Trait {
  const { entityName, standalone } = c;

  // ---- UI definitions ----

  const idleChildren: unknown[] = [
    {
      type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
      children: [
        { type: 'icon', name: 'message-circle', size: 'lg' },
        { type: 'typography', content: `${entityName} Messaging`, variant: 'h2' },
      ],
    },
    { type: 'divider' },
  ];

  if (standalone) {
    idleChildren.push(
      { type: 'input', label: 'To', bind: '@entity.to', placeholder: '+1234567890' },
      { type: 'textarea', label: 'Message', bind: '@entity.messageBody', placeholder: 'Write your message...' },
    );
  }

  idleChildren.push(
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
      children: [
        { type: 'button', label: 'Send SMS', event: 'SEND_SMS', variant: 'primary', icon: 'message-circle' },
        { type: 'button', label: 'Send WhatsApp', event: 'SEND_WHATSAPP', variant: 'secondary', icon: 'phone' },
      ],
    },
  );

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'stretch',
    children: idleChildren,
  };

  const sendingUI = {
    type: 'loading-state', title: 'Sending message...', message: `Delivering ${entityName.toLowerCase()} message...`,
  };

  const sentUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Message sent successfully' },
      { type: 'button', label: 'Send Another', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const errorUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'error-state', title: 'Send Failed', message: 'Could not deliver the message.', onRetry: 'RETRY' },
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
    // SEND_SMS: idle -> sending (call twilio sendSMS + show loading)
    {
      from: 'idle', to: 'sending', event: 'SEND_SMS',
      effects: [
        ['render-ui', 'main', sendingUI],
        ['call-service', 'twilio', 'sendSMS', { to: '@entity.to', body: '@entity.messageBody' }],
      ],
    },
    // SEND_WHATSAPP: idle -> sending (call twilio sendWhatsApp + show loading)
    {
      from: 'idle', to: 'sending', event: 'SEND_WHATSAPP',
      effects: [
        ['render-ui', 'main', sendingUI],
        ['call-service', 'twilio', 'sendWhatsApp', { to: '@entity.to', body: '@entity.messageBody' }],
      ],
    },
    // SENT: sending -> sent (delivery confirmed)
    {
      from: 'sending', to: 'sent', event: 'SENT',
      effects: [
        ['set', '@entity.sendStatus', 'sent'],
        ['set', '@entity.messageSid', '@payload.messageSid'],
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
        { key: 'SEND_SMS', name: 'Send SMS' },
        { key: 'SEND_WHATSAPP', name: 'Send WhatsApp' },
        { key: 'SENT', name: 'Message Sent', payload: [
          { name: 'messageSid', type: 'string', required: false },
        ]},
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

function buildPage(c: TwilioConfig): Page | undefined {
  if (!c.standalone) return undefined;
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceTwilioEntity(params: StdServiceTwilioParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceTwilioTrait(params: StdServiceTwilioParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceTwilioPage(params: StdServiceTwilioParams = {}): Page | undefined {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceTwilio(params: StdServiceTwilioParams = {}): OrbitalSchema {
  const c = resolve(params);
  const pages: Page[] = [];
  const page = buildPage(c);
  if (page) pages.push(page);

  return makeSchema(`${c.entityName}Orbital`, makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    pages,
  ));
}
