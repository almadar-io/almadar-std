/**
 * std-service-email
 *
 * Email service integration behavior: compose, send, track delivery status.
 * Wraps the `email` service with call-service for send operations.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level atom
 * @family service
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdServiceEmailParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Page
  standalone?: boolean;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface EmailConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  standalone: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceEmailParams): EmailConfig {
  const { entityName } = params;

  const requiredFields: EntityField[] = [
    { name: 'to', type: 'string' },
    { name: 'subject', type: 'string' },
    { name: 'body', type: 'string' },
    { name: 'from', type: 'string' },
    { name: 'sendStatus', type: 'string', default: 'idle' },
    { name: 'messageId', type: 'string' },
    { name: 'error', type: 'string' },
  ];
  const existingNames = new Set(params.fields.map(f => f.name));
  const mergedFields = [
    ...params.fields,
    ...requiredFields.filter(f => !existingNames.has(f.name)),
  ];
  const fields = ensureIdField(mergedFields);
  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    traitName: `${entityName}Email`,
    standalone: params.standalone ?? true,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: EmailConfig): Entity {
  const emailFields: EntityField[] = [
    ...c.fields,
    { name: 'to', type: 'string', required: true },
    { name: 'subject', type: 'string', required: true },
    { name: 'body', type: 'string', required: true },
    { name: 'from', type: 'string', required: false },
    { name: 'sendStatus', type: 'string', default: 'idle' },
    { name: 'messageId', type: 'string' },
    { name: 'error', type: 'string' },
  ];

  // Deduplicate: user-supplied fields take precedence, but ensure email-specific
  // fields exist. Filter out duplicates from emailFields that already exist in c.fields.
  const userFieldNames = new Set(c.fields.map(f => f.name));
  const merged = [
    ...c.fields,
    ...emailFields.filter(f => !userFieldNames.has(f.name)),
  ];

  return makeEntity({
    name: c.entityName,
    fields: merged,
    persistence: c.persistence,
    collection: c.collection,
  });
}

function buildTrait(c: EmailConfig): Trait {
  const { entityName, standalone } = c;

  // Idle: compose form (shown when standalone) or minimal prompt
  const idleChildren: unknown[] = [
    {
      type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
      children: [
        { type: 'icon', name: 'mail', size: 'lg' },
        { type: 'typography', content: `${entityName} Email`, variant: 'h2' },
      ],
    },
    { type: 'divider' },
  ];

  if (standalone) {
    idleChildren.push(
      { type: 'input', label: 'To', bind: '@entity.to', placeholder: 'recipient@example.com' },
      { type: 'input', label: 'Subject', bind: '@entity.subject', placeholder: 'Email subject' },
      { type: 'textarea', label: 'Body', bind: '@entity.body', placeholder: 'Write your message...' },
    );
  }

  idleChildren.push(
    { type: 'button', label: 'Send', event: 'SEND', variant: 'primary', icon: 'send' },
  );

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'stretch',
    children: idleChildren,
  };

  // Sending: loading state
  const sendingUI = {
    type: 'loading-state', title: 'Sending email...', message: `Delivering ${entityName.toLowerCase()} email...`,
  };

  // Sent: success confirmation
  const sentUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Email sent successfully' },
      { type: 'button', label: 'Send Another', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  // Error: retry and reset
  const errorUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'error-state', title: 'Send Failed', message: 'Could not deliver the email.', onRetry: 'RETRY' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Retry', event: 'RETRY', variant: 'primary', icon: 'refresh-cw' },
          { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
    ],
  };

  const transitions: unknown[] = [
    // INIT: idle -> idle (fetch existing data + render compose form)
    {
      from: 'idle', to: 'idle', event: 'INIT',
      effects: [
        ['fetch', entityName],
        ['render-ui', 'main', idleUI],
      ],
    },
    // SEND: idle -> sending (call email service + show loading)
    {
      from: 'idle', to: 'sending', event: 'SEND',
      effects: [
        ['render-ui', 'main', sendingUI],
        ['call-service', 'email', 'send', { to: '@entity.to', subject: '@entity.subject', body: '@entity.body' }],
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
        ['render-ui', 'main', errorUI],
      ],
    },
    // RETRY: error -> idle (try again)
    {
      from: 'error', to: 'idle', event: 'RETRY',
      effects: [['render-ui', 'main', idleUI]],
    },
    // RESET from sent: sent -> idle
    {
      from: 'sent', to: 'idle', event: 'RESET',
      effects: [
        ['set', '@entity.sendStatus', 'idle'],
        ['render-ui', 'main', idleUI],
      ],
    },
    // RESET from error: error -> idle
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
        { key: 'SEND', name: 'Send Email' },
        { key: 'SENT', name: 'Email Sent', payload: [{ name: 'messageId', type: 'string', required: false }] },
        { key: 'FAILED', name: 'Send Failed', payload: [{ name: 'error', type: 'string', required: true }] },
        { key: 'RETRY', name: 'Retry' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions,
    },
  } as Trait;
}

function buildPage(c: EmailConfig): Page | undefined {
  if (!c.standalone) return undefined;
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceEmailEntity(params: StdServiceEmailParams): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceEmailTrait(params: StdServiceEmailParams): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceEmailPage(params: StdServiceEmailParams): Page | undefined {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceEmail(params: StdServiceEmailParams): OrbitalDefinition {
  const c = resolve(params);
  const pages: Page[] = [];
  const page = buildPage(c);
  if (page) pages.push(page);

  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    pages,
  );
}
