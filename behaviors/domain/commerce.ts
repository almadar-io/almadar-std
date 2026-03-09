/**
 * Commerce Domain Behaviors
 *
 * Standard behaviors for e-commerce operations: shopping cart, checkout,
 * product catalog, pricing rules, and order tracking.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * UI Composition: molecule-first (atoms + molecules only, no organisms).
 * Each behavior has unique, domain-appropriate layouts composed with
 * VStack/HStack/Box wrappers around atoms and molecules.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ── Shared Commerce Theme ───────────────────────────────────────────

const COMMERCE_THEME = {
  name: 'commerce-indigo',
  tokens: {
    colors: {
      primary: '#6366f1',
      'primary-hover': '#4f46e5',
      'primary-foreground': '#ffffff',
      accent: '#ec4899',
      'accent-foreground': '#ffffff',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-cart - Shopping Cart
// ============================================================================

// ── Reusable main-view effects (cart with items) ────────────────────

const cartHasItemsMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: cart icon + title + checkout button
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'shopping-cart', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Shopping Cart' },
    ]},
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Add Item', icon: 'plus', variant: 'secondary', action: 'ADD_ITEM' },
      { type: 'button', label: 'Checkout', icon: 'credit-card', variant: 'primary', action: 'PROCEED_CHECKOUT' },
    ]},
  ]},
  { type: 'divider' },
  // Stats: cart total
  { type: 'stats', label: 'Cart Total', icon: 'dollar-sign', value: '@entity.price' },
  { type: 'divider' },
  // Item list
  { type: 'data-list', entity: 'CartItem', variant: 'card',
    fields: [
      { name: 'name', label: 'Item', icon: 'package', variant: 'h4' },
      { name: 'price', label: 'Price', icon: 'dollar-sign', variant: 'body', format: 'currency' },
      { name: 'quantity', label: 'Qty', icon: 'hash', variant: 'badge' },
      { name: 'productId', label: 'Product ID', variant: 'caption' },
    ],
    itemActions: [
      { label: 'Remove', event: 'REMOVE_ITEM', icon: 'trash-2', variant: 'danger' },
    ],
  },
]}];

/**
 * std-cart - Shopping cart behavior.
 * Entity: CartItem with name, price, quantity, productId.
 * States: empty -> hasItems -> checkout. Add/remove items, proceed to checkout.
 */
export const CART_BEHAVIOR: OrbitalSchema = {
  name: 'std-cart',
  version: '1.0.0',
  description: 'Shopping cart with add/remove items and checkout',
  theme: COMMERCE_THEME,
  orbitals: [
    {
      name: 'CartOrbital',
      entity: {
        name: 'CartItem',
        persistence: 'persistent',
        collection: 'cart_items',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'price', type: 'number', default: 0 },
          { name: 'quantity', type: 'number', default: 1 },
          { name: 'productId', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'CartControl',
          linkedEntity: 'CartItem',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'empty', isInitial: true },
              { name: 'hasItems' },
              { name: 'creating' },
              { name: 'checkout' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'ADD_ITEM', name: 'Add Item' },
              { key: 'REMOVE_ITEM', name: 'Remove Item', payloadSchema: [
                { name: 'id', type: 'string', required: true },
              ] },
              { key: 'SAVE', name: 'Save Item', payloadSchema: [
                { name: 'data', type: 'object', required: true },
              ] },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
              { key: 'PROCEED_CHECKOUT', name: 'Proceed to Checkout' },
              { key: 'BACK_TO_CART', name: 'Back to Cart' },
              { key: 'VIEW', name: 'View Item', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
            ],
            transitions: [
              {
                from: 'empty',
                to: 'empty',
                event: 'INIT',
                effects: [
                  ['fetch', 'CartItem'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Header
                    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'shopping-cart', size: 'lg' },
                        { type: 'typography', variant: 'h2', content: 'Shopping Cart' },
                      ]},
                      { type: 'button', label: 'Add Item', icon: 'plus', variant: 'primary', action: 'ADD_ITEM' },
                    ]},
                    { type: 'divider' },
                    // Stats
                    { type: 'stats', label: 'Total', icon: 'dollar-sign', value: '@entity.price' },
                    { type: 'divider' },
                    // Empty state: icon + message
                    { type: 'stack', direction: 'vertical', gap: 'md', align: 'center', children: [
                      { type: 'icon', name: 'shopping-cart', size: 'xl' },
                      { type: 'typography', variant: 'h3', content: 'Your cart is empty' },
                      { type: 'typography', variant: 'body', content: 'Add items to get started' },
                    ]},
                  ]}],
                ],
              },
              {
                from: 'hasItems',
                to: 'hasItems',
                event: 'INIT',
                effects: [
                  ['fetch', 'CartItem'],
                  ...[cartHasItemsMainEffect],
                ],
              },
              {
                from: 'empty',
                to: 'creating',
                event: 'ADD_ITEM',
                effects: [
                  ['render-ui', 'modal', { type: 'form-section', entity: 'CartItem', fields: [
                    { name: 'name', label: 'Item Name', type: 'string', required: true },
                    { name: 'price', label: 'Price', type: 'number', required: true },
                    { name: 'quantity', label: 'Quantity', type: 'number', required: true },
                    { name: 'productId', label: 'Product ID', type: 'string', required: true },
                  ], submitEvent: 'SAVE', cancelEvent: 'CANCEL' }],
                ],
              },
              {
                from: 'hasItems',
                to: 'creating',
                event: 'ADD_ITEM',
                effects: [
                  ['render-ui', 'modal', { type: 'form-section', entity: 'CartItem', fields: [
                    { name: 'name', label: 'Item Name', type: 'string', required: true },
                    { name: 'price', label: 'Price', type: 'number', required: true },
                    { name: 'quantity', label: 'Quantity', type: 'number', required: true },
                    { name: 'productId', label: 'Product ID', type: 'string', required: true },
                  ], submitEvent: 'SAVE', cancelEvent: 'CANCEL' }],
                ],
              },
              {
                from: 'creating',
                to: 'hasItems',
                event: 'SAVE',
                effects: [
                  ['persist', 'create', 'CartItem', '@payload.data'],
                  ['fetch', 'CartItem'],
                  ...[cartHasItemsMainEffect],
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'creating',
                to: 'hasItems',
                event: 'CANCEL',
                effects: [
                  ['fetch', 'CartItem'],
                  ...[cartHasItemsMainEffect],
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'creating',
                to: 'hasItems',
                event: 'CLOSE',
                effects: [
                  ['fetch', 'CartItem'],
                  ...[cartHasItemsMainEffect],
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'hasItems',
                to: 'hasItems',
                event: 'REMOVE_ITEM',
                effects: [
                  ['fetch', 'CartItem'],
                  ...[cartHasItemsMainEffect],
                ],
              },
              {
                from: 'hasItems',
                to: 'checkout',
                event: 'PROCEED_CHECKOUT',
                effects: [
                  ['fetch', 'CartItem'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Header: credit-card icon + title + back
                    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'credit-card', size: 'lg' },
                        { type: 'typography', variant: 'h2', content: 'Checkout' },
                      ]},
                      { type: 'button', label: 'Back to Cart', icon: 'arrow-left', variant: 'secondary', action: 'BACK_TO_CART' },
                    ]},
                    { type: 'divider' },
                    // Order summary
                    { type: 'typography', variant: 'h3', content: 'Order Summary' },
                    { type: 'stats', label: 'Cart Total', icon: 'dollar-sign', value: '@entity.price' },
                    { type: 'divider' },
                    // Order items (read-only)
                    { type: 'data-list', entity: 'CartItem', variant: 'compact',
                      fields: [
                        { name: 'name', label: 'Item', icon: 'package', variant: 'h4' },
                        { name: 'price', label: 'Price', icon: 'dollar-sign', variant: 'body', format: 'currency' },
                        { name: 'quantity', label: 'Qty', icon: 'hash', variant: 'badge' },
                      ],
                      itemActions: [
                        { label: 'View', event: 'VIEW', icon: 'eye' },
                      ],
                    },
                  ]}],
                ],
              },
              {
                from: 'checkout',
                to: 'checkout',
                event: 'VIEW',
                effects: [
                  ['fetch', 'CartItem'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                      { type: 'icon', name: 'credit-card', size: 'lg' },
                      { type: 'typography', variant: 'h2', content: 'Checkout' },
                    ]},
                    { type: 'divider' },
                    { type: 'data-list', entity: 'CartItem', variant: 'compact',
                      fields: [
                        { name: 'name', label: 'Item', icon: 'package', variant: 'h4' },
                        { name: 'price', label: 'Price', icon: 'dollar-sign', variant: 'body', format: 'currency' },
                        { name: 'quantity', label: 'Qty', icon: 'hash', variant: 'badge' },
                      ],
                      itemActions: [
                        { label: 'View', event: 'VIEW', icon: 'eye' },
                      ],
                    },
                  ]}],
                ],
              },
              {
                from: 'checkout',
                to: 'hasItems',
                event: 'BACK_TO_CART',
                effects: [
                  ['fetch', 'CartItem'],
                  ...[cartHasItemsMainEffect],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'CartPage',
          path: '/cart',
          isInitial: true,
          traits: [{ ref: 'CartControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-checkout - Checkout Flow
// ============================================================================

const checkoutWizardSteps = [
  { label: 'Shipping', icon: 'truck' },
  { label: 'Payment', icon: 'credit-card' },
  { label: 'Review', icon: 'clipboard-check' },
];

// ── Reusable: shipping step main effect ─────────────────────────────

const checkoutShippingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Wizard progress
  { type: 'wizard-progress', currentStep: 0, steps: checkoutWizardSteps },
  { type: 'divider' },
  // Step header
  { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
    { type: 'icon', name: 'truck', size: 'md' },
    { type: 'typography', variant: 'h3', content: 'Shipping Address' },
  ]},
  // Form
  { type: 'form-section', entity: 'Order', submitEvent: 'SET_SHIPPING',
    fields: [
      { name: 'shippingAddress', label: 'Shipping Address', icon: 'map-pin' },
    ],
  },
]}];

// ── Reusable: payment step main effect ──────────────────────────────

const checkoutPaymentMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Wizard progress
  { type: 'wizard-progress', currentStep: 1, steps: checkoutWizardSteps },
  { type: 'divider' },
  // Step header
  { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
    { type: 'icon', name: 'credit-card', size: 'md' },
    { type: 'typography', variant: 'h3', content: 'Payment Method' },
  ]},
  // Back button
  { type: 'button', label: 'Back to Shipping', icon: 'arrow-left', variant: 'ghost', action: 'BACK_TO_SHIPPING' },
  // Form
  { type: 'form-section', entity: 'Order', submitEvent: 'SET_PAYMENT',
    fields: [
      { name: 'paymentMethod', label: 'Payment Method', icon: 'wallet' },
    ],
  },
]}];

/**
 * std-checkout - Wizard-like checkout flow.
 * Entity: Order with total, status, shippingAddress, paymentMethod.
 * States: shipping -> payment -> review -> confirmed.
 */
export const CHECKOUT_BEHAVIOR: OrbitalSchema = {
  name: 'std-checkout',
  version: '1.0.0',
  description: 'Multi-step checkout flow with shipping, payment, and review',
  theme: COMMERCE_THEME,
  orbitals: [
    {
      name: 'CheckoutOrbital',
      entity: {
        name: 'Order',
        persistence: 'persistent',
        collection: 'orders',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'total', type: 'number', default: 0 },
          { name: 'status', type: 'string', default: 'pending' },
          { name: 'shippingAddress', type: 'string', default: '' },
          { name: 'paymentMethod', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'CheckoutFlow',
          linkedEntity: 'Order',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'shipping', isInitial: true },
              { name: 'payment' },
              { name: 'review' },
              { name: 'confirmed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SET_SHIPPING', name: 'Set Shipping', payloadSchema: [
                { name: 'shippingAddress', type: 'string', required: true },
              ] },
              { key: 'SET_PAYMENT', name: 'Set Payment', payloadSchema: [
                { name: 'paymentMethod', type: 'string', required: true },
              ] },
              { key: 'CONFIRM', name: 'Confirm Order' },
              { key: 'BACK_TO_SHIPPING', name: 'Back to Shipping' },
              { key: 'BACK_TO_PAYMENT', name: 'Back to Payment' },
              { key: 'NEW_ORDER', name: 'New Order' },
            ],
            transitions: [
              {
                from: 'shipping',
                to: 'shipping',
                event: 'INIT',
                effects: [
                  ['fetch', 'Order'],
                  ...[checkoutShippingMainEffect],
                ],
              },
              {
                from: 'shipping',
                to: 'payment',
                event: 'SET_SHIPPING',
                effects: [
                  ['fetch', 'Order'],
                  ['set', '@entity.shippingAddress', '@payload.shippingAddress'],
                  ...[checkoutPaymentMainEffect],
                ],
              },
              {
                from: 'payment',
                to: 'review',
                event: 'SET_PAYMENT',
                effects: [
                  ['fetch', 'Order'],
                  ['set', '@entity.paymentMethod', '@payload.paymentMethod'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Wizard progress
                    { type: 'wizard-progress', currentStep: 2, steps: checkoutWizardSteps },
                    { type: 'divider' },
                    // Step header
                    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                      { type: 'icon', name: 'clipboard-check', size: 'md' },
                      { type: 'typography', variant: 'h3', content: 'Review Order' },
                    ]},
                    // Summary fields
                    { type: 'stack', direction: 'vertical', gap: 'sm', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'dollar-sign', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Total' },
                        { type: 'typography', variant: 'body', content: '@entity.total' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'map-pin', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Shipping' },
                        { type: 'typography', variant: 'body', content: '@entity.shippingAddress' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'wallet', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Payment' },
                        { type: 'typography', variant: 'body', content: '@entity.paymentMethod' },
                      ]},
                    ]},
                    { type: 'divider' },
                    // Actions
                    { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', children: [
                      { type: 'button', label: 'Back to Payment', icon: 'arrow-left', variant: 'ghost', action: 'BACK_TO_PAYMENT' },
                      { type: 'button', label: 'Confirm Order', icon: 'check', variant: 'primary', action: 'CONFIRM' },
                    ]},
                  ]}],
                ],
              },
              {
                from: 'payment',
                to: 'shipping',
                event: 'BACK_TO_SHIPPING',
                effects: [
                  ['fetch', 'Order'],
                  ...[checkoutShippingMainEffect],
                ],
              },
              {
                from: 'review',
                to: 'confirmed',
                event: 'CONFIRM',
                effects: [
                  ['fetch', 'Order'],
                  ['set', '@entity.status', 'confirmed'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', align: 'center', children: [
                    // Success icon
                    { type: 'icon', name: 'check-circle', size: 'xl' },
                    { type: 'typography', variant: 'h2', content: 'Order Confirmed' },
                    { type: 'divider' },
                    // Detail fields
                    { type: 'stack', direction: 'vertical', gap: 'sm', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'hash', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Status' },
                        { type: 'badge', content: '@entity.status', variant: 'success' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'dollar-sign', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Total' },
                        { type: 'typography', variant: 'body', content: '@entity.total' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'map-pin', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Shipping' },
                        { type: 'typography', variant: 'body', content: '@entity.shippingAddress' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'wallet', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Payment' },
                        { type: 'typography', variant: 'body', content: '@entity.paymentMethod' },
                      ]},
                    ]},
                    { type: 'divider' },
                    { type: 'button', label: 'Place New Order', icon: 'plus', variant: 'primary', action: 'NEW_ORDER' },
                  ]}],
                ],
              },
              {
                from: 'review',
                to: 'payment',
                event: 'BACK_TO_PAYMENT',
                effects: [
                  ['fetch', 'Order'],
                  ...[checkoutPaymentMainEffect],
                ],
              },
              {
                from: 'confirmed',
                to: 'shipping',
                event: 'NEW_ORDER',
                effects: [
                  ['fetch', 'Order'],
                  ...[checkoutShippingMainEffect],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'CheckoutPage',
          path: '/checkout',
          isInitial: true,
          traits: [{ ref: 'CheckoutFlow' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-catalog - Product Catalog
// ============================================================================

// ── Reusable: catalog browsing main effect ──────────────────────────

const catalogBrowsingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: package icon + title
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'package', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Product Catalog' },
    ]},
  ]},
  { type: 'divider' },
  // Search input
  { type: 'search-input', placeholder: 'Search products by category...', event: 'APPLY_FILTER', icon: 'search' },
  // Product grid
  { type: 'data-grid', entity: 'Product', cols: 3, gap: 'md',
    fields: [
      { name: 'name', label: 'Product', icon: 'box', variant: 'h4' },
      { name: 'price', label: 'Price', icon: 'dollar-sign', variant: 'body', format: 'currency' },
      { name: 'category', label: 'Category', icon: 'tag', variant: 'badge' },
      { name: 'inStock', label: 'Availability', icon: 'check-circle', variant: 'badge' },
    ],
    itemActions: [
      { label: 'View', event: 'VIEW_PRODUCT', icon: 'eye' },
    ],
  },
]}];

// ── Reusable: filtered catalog main effect ──────────────────────────

const catalogFilteredMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header with clear filter
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'filter', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Filtered Results' },
    ]},
    { type: 'button', label: 'Clear Filter', icon: 'x', variant: 'ghost', action: 'CLEAR_FILTER' },
  ]},
  { type: 'divider' },
  { type: 'search-input', placeholder: 'Refine search...', event: 'APPLY_FILTER', icon: 'search' },
  // Product grid
  { type: 'data-grid', entity: 'Product', cols: 3, gap: 'md',
    fields: [
      { name: 'name', label: 'Product', icon: 'box', variant: 'h4' },
      { name: 'price', label: 'Price', icon: 'dollar-sign', variant: 'body', format: 'currency' },
      { name: 'category', label: 'Category', icon: 'tag', variant: 'badge' },
      { name: 'inStock', label: 'Availability', icon: 'check-circle', variant: 'badge' },
    ],
    itemActions: [
      { label: 'View', event: 'VIEW_PRODUCT', icon: 'eye' },
    ],
  },
]}];

// ── Reusable: product detail modal effect ───────────────────────────

const catalogDetailModalEffect = ['render-ui', 'modal', { type: 'stack', direction: 'vertical', gap: 'md', children: [
  // Product detail header
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'box', size: 'md' },
      { type: 'typography', variant: 'h3', content: 'Product Details' },
    ]},
    { type: 'button', label: 'Close', icon: 'x', variant: 'ghost', action: 'CLOSE' },
  ]},
  { type: 'divider' },
  // Product info in horizontal stacks
  { type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'icon', name: 'package', size: 'sm' },
      { type: 'typography', variant: 'label', content: 'Name' },
      { type: 'typography', variant: 'body', content: '@entity.name' },
    ]},
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'icon', name: 'file-text', size: 'sm' },
      { type: 'typography', variant: 'label', content: 'Description' },
      { type: 'typography', variant: 'body', content: '@entity.description' },
    ]},
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'icon', name: 'dollar-sign', size: 'sm' },
      { type: 'typography', variant: 'label', content: 'Price' },
      { type: 'typography', variant: 'body', content: '@entity.price' },
    ]},
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'icon', name: 'tag', size: 'sm' },
      { type: 'typography', variant: 'label', content: 'Category' },
      { type: 'badge', content: '@entity.category' },
    ]},
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'icon', name: 'check-circle', size: 'sm' },
      { type: 'typography', variant: 'label', content: 'In Stock' },
      { type: 'badge', content: '@entity.inStock', variant: 'success' },
    ]},
  ]},
]}];

/**
 * std-catalog - Product catalog with browsing and detail view.
 * Entity: Product with name, description, price, category, inStock.
 * States: browsing -> viewing -> filtering. Standard list+detail.
 */
export const CATALOG_BEHAVIOR: OrbitalSchema = {
  name: 'std-catalog',
  version: '1.0.0',
  description: 'Product catalog with browsing, filtering, and detail view',
  theme: COMMERCE_THEME,
  orbitals: [
    {
      name: 'CatalogOrbital',
      entity: {
        name: 'Product',
        persistence: 'persistent',
        collection: 'products',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'description', type: 'string', default: '' },
          { name: 'price', type: 'number', default: 0 },
          { name: 'category', type: 'string', default: '' },
          { name: 'inStock', type: 'boolean', default: true },
        ],
      },
      traits: [
        {
          name: 'CatalogBrowse',
          linkedEntity: 'Product',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'filtering' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW_PRODUCT', name: 'View Product', payloadSchema: [
                { name: 'id', type: 'string', required: true },
              ] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'APPLY_FILTER', name: 'Apply Filter', payloadSchema: [
                { name: 'category', type: 'string', required: true },
              ] },
              { key: 'CLEAR_FILTER', name: 'Clear Filter' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Product'],
                  ...[catalogBrowsingMainEffect],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW_PRODUCT',
                effects: [
                  ['fetch', 'Product'],
                  ...[catalogDetailModalEffect],
                ],
              },
              { from: 'viewing', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'viewing', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              {
                from: 'browsing',
                to: 'filtering',
                event: 'APPLY_FILTER',
                effects: [
                  ['fetch', 'Product'],
                  ['set', '@entity.category', '@payload.category'],
                  ...[catalogFilteredMainEffect],
                ],
              },
              {
                from: 'filtering',
                to: 'filtering',
                event: 'APPLY_FILTER',
                effects: [
                  ['fetch', 'Product'],
                  ['set', '@entity.category', '@payload.category'],
                  ...[catalogFilteredMainEffect],
                ],
              },
              {
                from: 'filtering',
                to: 'viewing',
                event: 'VIEW_PRODUCT',
                effects: [
                  ['fetch', 'Product'],
                  ...[catalogDetailModalEffect],
                ],
              },
              {
                from: 'filtering',
                to: 'browsing',
                event: 'CLEAR_FILTER',
                effects: [
                  ['set', '@entity.category', ''],
                  ['fetch', 'Product'],
                  ...[catalogBrowsingMainEffect],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'CatalogPage',
          path: '/catalog',
          isInitial: true,
          traits: [{ ref: 'CatalogBrowse' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-pricing - Price Management
// ============================================================================

// ── Reusable: pricing browsing main effect ──────────────────────────

const pricingBrowsingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: tag icon + title
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'tag', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Price Rules' },
    ]},
  ]},
  { type: 'divider' },
  // Stats
  { type: 'stack', direction: 'horizontal', gap: 'md', children: [
    { type: 'stats', label: 'Total Rules', icon: 'layers', entity: 'PriceRule' },
    { type: 'line-chart', entity: 'PriceRule' },
  ]},
  { type: 'divider' },
  // Rules list
  { type: 'data-list', entity: 'PriceRule', variant: 'card',
    fields: [
      { name: 'name', label: 'Rule Name', icon: 'bookmark', variant: 'h4' },
      { name: 'type', label: 'Type', icon: 'sliders', variant: 'badge' },
      { name: 'value', label: 'Value', icon: 'dollar-sign', variant: 'body', format: 'currency' },
      { name: 'startDate', label: 'Start', icon: 'calendar', variant: 'caption', format: 'date' },
      { name: 'endDate', label: 'End', icon: 'calendar', variant: 'caption', format: 'date' },
    ],
    itemActions: [
      { label: 'Edit', event: 'EDIT_RULE', icon: 'pencil' },
      { label: 'Preview', event: 'PREVIEW_RULE', icon: 'eye' },
    ],
  },
]}];

/**
 * std-pricing - Price rule management with CRUD operations.
 * Entity: PriceRule with name, type, value, startDate, endDate.
 * States: browsing -> editing -> previewing.
 */
export const PRICING_BEHAVIOR: OrbitalSchema = {
  name: 'std-pricing',
  version: '1.0.0',
  description: 'Price rule management with CRUD and preview',
  theme: COMMERCE_THEME,
  orbitals: [
    {
      name: 'PricingOrbital',
      entity: {
        name: 'PriceRule',
        persistence: 'persistent',
        collection: 'price_rules',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'type', type: 'string', default: 'percentage' },
          { name: 'value', type: 'number', default: 0 },
          { name: 'startDate', type: 'string', default: '' },
          { name: 'endDate', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'PricingManagement',
          linkedEntity: 'PriceRule',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'editing' },
              { name: 'previewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'EDIT_RULE', name: 'Edit Rule', payloadSchema: [
                { name: 'id', type: 'string', required: true },
              ] },
              { key: 'SAVE_RULE', name: 'Save Rule', payloadSchema: [
                { name: 'name', type: 'string', required: true },
                { name: 'value', type: 'number', required: true },
              ] },
              { key: 'PREVIEW_RULE', name: 'Preview Rule' },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'BACK_TO_LIST', name: 'Back to List' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'PriceRule'],
                  ...[pricingBrowsingMainEffect],
                ],
              },
              {
                from: 'browsing',
                to: 'editing',
                event: 'EDIT_RULE',
                effects: [
                  ['fetch', 'PriceRule'],
                  ['render-ui', 'modal', { type: 'stack', direction: 'vertical', gap: 'md', children: [
                    // Modal header
                    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                      { type: 'icon', name: 'pencil', size: 'md' },
                      { type: 'typography', variant: 'h3', content: 'Edit Price Rule' },
                    ]},
                    { type: 'divider' },
                    // Edit form
                    { type: 'form-section', entity: 'PriceRule', submitEvent: 'SAVE_RULE', cancelEvent: 'CANCEL',
                      fields: [
                        { name: 'name', label: 'Rule Name', icon: 'bookmark' },
                        { name: 'value', label: 'Value', icon: 'dollar-sign' },
                      ],
                    },
                  ]}],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'SAVE_RULE',
                effects: [
                  ['fetch', 'PriceRule'],
                  ['set', '@entity.name', '@payload.name'],
                  ['set', '@entity.value', '@payload.value'],
                  ['render-ui', 'modal', null],
                  ...[pricingBrowsingMainEffect],
                ],
              },
              { from: 'editing', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'editing', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              {
                from: 'browsing',
                to: 'previewing',
                event: 'PREVIEW_RULE',
                effects: [
                  ['fetch', 'PriceRule'],
                  ['render-ui', 'modal', { type: 'stack', direction: 'vertical', gap: 'md', children: [
                    // Preview header
                    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'eye', size: 'md' },
                        { type: 'typography', variant: 'h3', content: 'Rule Preview' },
                      ]},
                      { type: 'button', label: 'Close', icon: 'x', variant: 'ghost', action: 'CLOSE' },
                    ]},
                    { type: 'divider' },
                    // Rule details in stacks
                    { type: 'stack', direction: 'vertical', gap: 'sm', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'bookmark', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Name' },
                        { type: 'typography', variant: 'body', content: '@entity.name' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'sliders', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Type' },
                        { type: 'badge', content: '@entity.type' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'dollar-sign', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Value' },
                        { type: 'typography', variant: 'body', content: '@entity.value' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'calendar', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Start Date' },
                        { type: 'typography', variant: 'body', content: '@entity.startDate' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'calendar', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'End Date' },
                        { type: 'typography', variant: 'body', content: '@entity.endDate' },
                      ]},
                    ]},
                  ]}],
                ],
              },
              { from: 'previewing', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'previewing', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              {
                from: 'previewing',
                to: 'browsing',
                event: 'BACK_TO_LIST',
                effects: [
                  ['fetch', 'PriceRule'],
                  ['render-ui', 'modal', null],
                  ...[pricingBrowsingMainEffect],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'PricingPage',
          path: '/pricing',
          isInitial: true,
          traits: [{ ref: 'PricingManagement' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-order-tracking - Order Tracking
// ============================================================================

// ── Reusable: order tracking browsing main effect ───────────────────

const orderTrackingBrowsingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: truck icon + title
  { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
    { type: 'icon', name: 'truck', size: 'lg' },
    { type: 'typography', variant: 'h2', content: 'Order Tracking' },
  ]},
  { type: 'divider' },
  // Stats
  { type: 'stack', direction: 'horizontal', gap: 'md', children: [
    { type: 'stats', label: 'Total Orders', icon: 'clipboard-list', entity: 'OrderStatus' },
    { type: 'stats', label: 'Status', icon: 'activity', value: '@entity.status' },
  ]},
  { type: 'divider' },
  // Search
  { type: 'search-input', placeholder: 'Search by order ID or tracking number...', entity: 'OrderStatus', icon: 'search' },
  // Order list with status badges and tracking info
  { type: 'data-list', entity: 'OrderStatus', variant: 'card',
    fields: [
      { name: 'orderId', label: 'Order ID', icon: 'hash', variant: 'h4' },
      { name: 'status', label: 'Status', icon: 'loader', variant: 'badge' },
      { name: 'trackingNumber', label: 'Tracking #', icon: 'map-pin', variant: 'body' },
      { name: 'estimatedDelivery', label: 'Est. Delivery', icon: 'calendar', variant: 'caption', format: 'date' },
    ],
    itemActions: [
      { label: 'View', event: 'VIEW_ORDER', icon: 'eye' },
    ],
  },
]}];

/**
 * std-order-tracking - Read-only order tracking with list+detail view.
 * Entity: OrderStatus with orderId, status, estimatedDelivery, trackingNumber.
 * States: browsing -> viewing.
 */
export const ORDER_TRACKING_BEHAVIOR: OrbitalSchema = {
  name: 'std-order-tracking',
  version: '1.0.0',
  description: 'Order tracking with status and delivery estimates',
  theme: COMMERCE_THEME,
  orbitals: [
    {
      name: 'OrderTrackingOrbital',
      entity: {
        name: 'OrderStatus',
        persistence: 'persistent',
        collection: 'order_statuses',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'orderId', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'pending' },
          { name: 'estimatedDelivery', type: 'string', default: '' },
          { name: 'trackingNumber', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'OrderTrackingView',
          linkedEntity: 'OrderStatus',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW_ORDER', name: 'View Order', payloadSchema: [
                { name: 'id', type: 'string', required: true },
              ] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'OrderStatus'],
                  ...[orderTrackingBrowsingMainEffect],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW_ORDER',
                effects: [
                  ['fetch', 'OrderStatus'],
                  ['render-ui', 'modal', { type: 'stack', direction: 'vertical', gap: 'md', children: [
                    // Modal header
                    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'truck', size: 'md' },
                        { type: 'typography', variant: 'h3', content: 'Order Details' },
                      ]},
                      { type: 'button', label: 'Close', icon: 'x', variant: 'ghost', action: 'CLOSE' },
                    ]},
                    { type: 'divider' },
                    // Progress indicator for order status
                    { type: 'meter', value: '@entity.status', label: 'Order Progress', icon: 'loader' },
                    { type: 'divider' },
                    // Order detail fields
                    { type: 'stack', direction: 'vertical', gap: 'sm', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'hash', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Order ID' },
                        { type: 'typography', variant: 'body', content: '@entity.orderId' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'activity', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Status' },
                        { type: 'badge', content: '@entity.status' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'map-pin', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Tracking Number' },
                        { type: 'typography', variant: 'body', content: '@entity.trackingNumber' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'calendar', size: 'sm' },
                        { type: 'typography', variant: 'label', content: 'Estimated Delivery' },
                        { type: 'typography', variant: 'body', content: '@entity.estimatedDelivery' },
                      ]},
                    ]},
                  ]}],
                ],
              },
              { from: 'viewing', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'viewing', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'OrderTrackingPage',
          path: '/order-tracking',
          isInitial: true,
          traits: [{ ref: 'OrderTrackingView' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Commerce Behaviors
// ============================================================================

export const COMMERCE_BEHAVIORS: OrbitalSchema[] = [
  CART_BEHAVIOR,
  CHECKOUT_BEHAVIOR,
  CATALOG_BEHAVIOR,
  PRICING_BEHAVIOR,
  ORDER_TRACKING_BEHAVIOR,
];
