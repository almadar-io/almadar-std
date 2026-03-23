/**
 * std-service-stripe
 *
 * Stripe payment integration behavior: idle, creating, confirming, succeeded, error.
 * Wraps the `stripe` service integration with a multi-step payment flow.
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

export interface StdServiceStripeParams {
  /** Entity name in PascalCase (default: "Payment") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, payment fields are always included) */
  fields?: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Firestore collection name */
  collection?: string;
  /** When true, INIT renders the payment form to main. Default true. */
  standalone?: boolean;
  /** Default currency code (default: "usd") */
  defaultCurrency?: string;
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

interface StripeConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  standalone: boolean;
  defaultCurrency: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceStripeParams): StripeConfig {
  const entityName = params.entityName ?? 'Payment';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'amount', type: 'number' },
    { name: 'currency', type: 'string', default: params.defaultCurrency ?? 'usd' },
    { name: 'paymentIntentId', type: 'string' },
    { name: 'clientSecret', type: 'string' },
    { name: 'paymentStatus', type: 'string', default: 'idle' },
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
    collection: params.collection,
    traitName: `${entityName}Stripe`,
    standalone: params.standalone ?? true,
    defaultCurrency: params.defaultCurrency ?? 'usd',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: StripeConfig): Entity {
  const paymentFields: EntityField[] = [
    { name: 'amount', type: 'number' as const, default: 0 },
    { name: 'currency', type: 'string' as const, default: c.defaultCurrency },
    { name: 'paymentIntentId', type: 'string' as const, default: '' },
    { name: 'clientSecret', type: 'string' as const, default: '' },
    { name: 'paymentStatus', type: 'string' as const, default: 'idle' },
    { name: 'error', type: 'string' as const, default: '' },
  ];

  // Merge: payment fields first, then any extra user fields (skip duplicates)
  const paymentFieldNames = new Set(paymentFields.map(f => f.name));
  const extraFields = c.fields.filter(f => f.name !== 'id' && !paymentFieldNames.has(f.name));
  const allFields = ensureIdField([...paymentFields, ...extraFields]);

  return makeEntity({ name: c.entityName, fields: allFields, persistence: c.persistence, collection: c.collection });
}

function buildTrait(c: StripeConfig): Trait {
  const { entityName, standalone } = c;

  // ---- UI definitions ----

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
      { type: 'alert', variant: 'success', message: 'Payment successful!' },
      { type: 'typography', variant: 'body', color: 'muted', content: '@entity.paymentIntentId' },
      { type: 'button', label: 'New Payment', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const errorUI = {
    type: 'error-state', title: 'Payment Failed', message: '@entity.error', onRetry: 'RETRY',
  };

  // ---- Transitions ----

  const transitions: unknown[] = [
    // INIT: idle -> idle (fetch + render if standalone)
    {
      from: 'idle', to: 'idle', event: 'INIT',
      effects: [
        ...(standalone ? [['fetch', entityName], ['render-ui', 'main', idleUI]] : [['fetch', entityName]]),
      ],
    },
    // CREATE_PAYMENT: idle -> creating (render loading + call stripe createPaymentIntent)
    {
      from: 'idle', to: 'creating', event: 'CREATE_PAYMENT',
      effects: [
        ['render-ui', 'main', creatingUI],
        ['call-service', 'stripe', 'createPaymentIntent', { amount: '@entity.amount', currency: '@entity.currency' }],
      ],
    },
    // PAYMENT_CREATED: creating -> confirming (persist intent data + auto-confirm)
    {
      from: 'creating', to: 'confirming', event: 'PAYMENT_CREATED',
      effects: [
        ['set', '@entity.paymentIntentId', '@payload.id'],
        ['set', '@entity.clientSecret', '@payload.clientSecret'],
        ['render-ui', 'main', confirmingUI],
        ['call-service', 'stripe', 'confirmPayment', { paymentIntentId: '@entity.paymentIntentId' }],
      ],
    },
    // PAYMENT_CONFIRMED: confirming -> succeeded
    {
      from: 'confirming', to: 'succeeded', event: 'PAYMENT_CONFIRMED',
      effects: [
        ['set', '@entity.paymentStatus', 'succeeded'],
        ['render-ui', 'main', succeededUI],
      ],
    },
    // FAILED: creating -> error
    {
      from: 'creating', to: 'error', event: 'FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['render-ui', 'main', errorUI],
      ],
    },
    // FAILED: confirming -> error
    {
      from: 'confirming', to: 'error', event: 'FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['render-ui', 'main', errorUI],
      ],
    },
    // RETRY: error -> idle
    {
      from: 'error', to: 'idle', event: 'RETRY',
      effects: [['render-ui', 'main', idleUI]],
    },
    // RESET: succeeded -> idle
    {
      from: 'succeeded', to: 'idle', event: 'RESET',
      effects: [['render-ui', 'main', idleUI]],
    },
    // RESET: error -> idle
    {
      from: 'error', to: 'idle', event: 'RESET',
      effects: [['render-ui', 'main', idleUI]],
    },
  ];

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
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
        { key: 'CONFIRM_PAYMENT', name: 'Confirm Payment' },
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

function buildPage(c: StripeConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceStripeEntity(params: StdServiceStripeParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceStripeTrait(params: StdServiceStripeParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceStripePage(params: StdServiceStripeParams = {}): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceStripe(params: StdServiceStripeParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
