/**
 * std-service-payment-flow
 *
 * Payment flow molecule. Composes stripe payment and email receipt into a
 * single orchestrated flow: pay, then auto-send receipt email.
 *
 * Two inline traits share one entity and one page:
 * - Payment trait: idle -> creating -> confirming -> succeeded -> error
 *   Emits SEND_RECEIPT when payment is confirmed.
 * - Receipt trait: waiting -> sending -> sent -> receiptError
 *   Listens for SEND_RECEIPT and calls the email service.
 *
 * Traits on the same page share the event bus automatically.
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

export interface StdServicePaymentFlowParams {
  /** Entity name in PascalCase (default: "OrderPayment") */
  entityName?: string;
  /** Extra entity fields beyond the required payment + email fields */
  fields?: EntityField[];
  /** Persistence mode (default: "runtime") */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Page name override */
  pageName?: string;
  /** Page path override */
  pagePath?: string;
  /** Whether this page is the initial route */
  isInitial?: boolean;
  /** Default recipient email address for receipts */
  recipientEmail?: string;
}

// ============================================================================
// Resolve
// ============================================================================

interface PaymentFlowConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  paymentTraitName: string;
  receiptTraitName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
  recipientEmail: string;
}

function resolve(params: StdServicePaymentFlowParams): PaymentFlowConfig {
  const entityName = params.entityName ?? 'OrderPayment';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    // Stripe payment fields
    { name: 'amount', type: 'number' },
    { name: 'currency', type: 'string', default: 'usd' },
    { name: 'paymentIntentId', type: 'string' },
    { name: 'clientSecret', type: 'string' },
    { name: 'paymentStatus', type: 'string', default: 'idle' },
    // Email receipt fields
    { name: 'to', type: 'string' },
    { name: 'subject', type: 'string', default: 'Payment Receipt' },
    { name: 'body', type: 'string' },
    { name: 'sendStatus', type: 'string', default: 'idle' },
    // Shared error field
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
    paymentTraitName: `${entityName}Payment`,
    receiptTraitName: `${entityName}Receipt`,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
    recipientEmail: params.recipientEmail ?? '',
  };
}

// ============================================================================
// Entity builder
// ============================================================================

function buildEntity(c: PaymentFlowConfig): Entity {
  return makeEntity({
    name: c.entityName,
    fields: c.fields,
    persistence: c.persistence,
  });
}

// ============================================================================
// Payment trait builder
// ============================================================================

function buildPaymentTrait(c: PaymentFlowConfig): Trait {
  const { entityName } = c;

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'credit-card', size: 'lg' },
          { type: 'typography', content: 'Payment', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'vertical', gap: 'md',
        children: [
          { type: 'input', label: 'Amount', field: 'amount', inputType: 'number', placeholder: '0.00' },
          {
            type: 'select', label: 'Currency', field: 'currency',
            options: [
              { label: 'USD', value: 'usd' },
              { label: 'EUR', value: 'eur' },
              { label: 'GBP', value: 'gbp' },
            ],
          },
        ],
      },
      { type: 'button', label: 'Pay', event: 'CREATE_PAYMENT', variant: 'primary', icon: 'credit-card' },
    ],
  };

  const creatingUI = {
    type: 'loading-state', title: 'Creating payment...', message: 'Setting up your payment intent.',
  };

  const confirmingUI = {
    type: 'loading-state', title: 'Confirming payment...', message: 'Processing your payment.',
  };

  const succeededUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Payment successful! Sending receipt...' },
      { type: 'typography', variant: 'body', color: 'muted', content: '@entity.paymentIntentId' },
      { type: 'button', label: 'New Payment', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const errorUI = {
    type: 'error-state', title: 'Payment Failed', message: '@entity.error', onRetry: 'RETRY',
  };

  const transitions: unknown[] = [
    {
      from: 'idle', to: 'idle', event: 'INIT',
      effects: [
        ['fetch', entityName],
        ['render-ui', 'main', idleUI],
      ],
    },
    {
      from: 'idle', to: 'creating', event: 'CREATE_PAYMENT',
      effects: [
        ['render-ui', 'main', creatingUI],
        ['call-service', 'stripe', 'createPaymentIntent', { amount: '@entity.amount', currency: '@entity.currency' }],
      ],
    },
    {
      from: 'creating', to: 'confirming', event: 'PAYMENT_CREATED',
      effects: [
        ['set', '@entity.paymentIntentId', '@payload.id'],
        ['set', '@entity.clientSecret', '@payload.clientSecret'],
        ['render-ui', 'main', confirmingUI],
        ['call-service', 'stripe', 'confirmPayment', { paymentIntentId: '@entity.paymentIntentId' }],
      ],
    },
    {
      from: 'confirming', to: 'succeeded', event: 'PAYMENT_CONFIRMED',
      effects: [
        ['set', '@entity.paymentStatus', 'succeeded'],
        ['emit', 'SEND_RECEIPT'],
        ['render-ui', 'main', succeededUI],
      ],
    },
    {
      from: 'creating', to: 'error', event: 'FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['render-ui', 'main', errorUI],
      ],
    },
    {
      from: 'confirming', to: 'error', event: 'FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['render-ui', 'main', errorUI],
      ],
    },
    {
      from: 'error', to: 'idle', event: 'RETRY',
      effects: [['render-ui', 'main', idleUI]],
    },
    {
      from: 'succeeded', to: 'idle', event: 'RESET',
      effects: [['render-ui', 'main', idleUI]],
    },
    {
      from: 'error', to: 'idle', event: 'RESET',
      effects: [['render-ui', 'main', idleUI]],
    },
  ];

  return {
    name: c.paymentTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [{ event: 'SEND_RECEIPT' }],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'creating' },
        { name: 'confirming' },
        { name: 'succeeded' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'CREATE_PAYMENT', name: 'Create Payment' },
        { key: 'PAYMENT_CREATED', name: 'Payment Created', payload: [
          { name: 'id', type: 'string', required: true },
          { name: 'clientSecret', type: 'string', required: true },
        ]},
        { key: 'PAYMENT_CONFIRMED', name: 'Payment Confirmed' },
        { key: 'FAILED', name: 'Failed', payload: [
          { name: 'error', type: 'string', required: true },
        ]},
        { key: 'RETRY', name: 'Retry' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions,
    },
  } as Trait;
}

// ============================================================================
// Receipt trait builder
// ============================================================================

function buildReceiptTrait(c: PaymentFlowConfig): Trait {
  const { entityName } = c;

  const waitingUI = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'mail', size: 'md' },
      { type: 'typography', content: 'Receipt will be sent after payment.', variant: 'body', color: 'muted' },
    ],
  };

  const sendingUI = {
    type: 'loading-state', title: 'Sending receipt...', message: 'Delivering your payment receipt.',
  };

  const sentUI = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'md' },
      { type: 'alert', variant: 'success', message: 'Receipt sent successfully' },
    ],
  };

  const receiptErrorUI = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'error-state', title: 'Receipt Failed', message: 'Could not send receipt email.', onRetry: 'RETRY_RECEIPT' },
      { type: 'button', label: 'Retry', event: 'RETRY_RECEIPT', variant: 'primary', icon: 'refresh-cw' },
    ],
  };

  const transitions: unknown[] = [
    {
      from: 'waiting', to: 'waiting', event: 'INIT',
      effects: [
        ['render-ui', 'main', waitingUI],
      ],
    },
    {
      from: 'waiting', to: 'sending', event: 'SEND_RECEIPT',
      effects: [
        ['render-ui', 'main', sendingUI],
        ['call-service', 'email', 'send', { to: '@entity.to', subject: '@entity.subject', body: '@entity.body' }],
      ],
    },
    {
      from: 'sending', to: 'sent', event: 'SENT',
      effects: [
        ['set', '@entity.sendStatus', 'sent'],
        ['render-ui', 'main', sentUI],
      ],
    },
    {
      from: 'sending', to: 'receiptError', event: 'FAILED',
      effects: [
        ['set', '@entity.sendStatus', 'error'],
        ['render-ui', 'main', receiptErrorUI],
      ],
    },
    {
      from: 'receiptError', to: 'sending', event: 'RETRY_RECEIPT',
      effects: [
        ['render-ui', 'main', sendingUI],
        ['call-service', 'email', 'send', { to: '@entity.to', subject: '@entity.subject', body: '@entity.body' }],
      ],
    },
  ];

  return {
    name: c.receiptTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    listens: [{ event: 'SEND_RECEIPT', triggers: 'SEND_RECEIPT' }],
    stateMachine: {
      states: [
        { name: 'waiting', isInitial: true },
        { name: 'sending' },
        { name: 'sent', isTerminal: true },
        { name: 'receiptError' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SEND_RECEIPT', name: 'Send Receipt' },
        { key: 'SENT', name: 'Receipt Sent' },
        { key: 'FAILED', name: 'Send Failed', payload: [
          { name: 'error', type: 'string', required: true },
        ]},
        { key: 'RETRY_RECEIPT', name: 'Retry Receipt' },
      ],
      transitions,
    },
  } as Trait;
}

// ============================================================================
// Page builder
// ============================================================================

function buildPage(c: PaymentFlowConfig): Page {
  return {
    name: c.pageName,
    path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.paymentTraitName },
      { ref: c.receiptTraitName },
    ],
  } as Page;
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServicePaymentFlowEntity(params: StdServicePaymentFlowParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdServicePaymentFlowPage(params: StdServicePaymentFlowParams = {}): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServicePaymentFlow(params: StdServicePaymentFlowParams = {}): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildPaymentTrait(c), buildReceiptTrait(c)],
    [buildPage(c)],
  ));
}
