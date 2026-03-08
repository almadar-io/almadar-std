/**
 * Commerce Domain Behaviors
 *
 * Standard behaviors for e-commerce operations: shopping cart, checkout,
 * product catalog, pricing rules, and order tracking.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-cart - Shopping Cart
// ============================================================================

/**
 * std-cart - Shopping cart behavior.
 * Entity: CartItem with name, price, quantity, productId.
 * States: empty -> hasItems -> checkout. Add/remove items, proceed to checkout.
 */
export const CART_BEHAVIOR: OrbitalSchema = {
  name: 'std-cart',
  version: '1.0.0',
  description: 'Shopping cart with add/remove items and checkout',
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
              { name: 'checkout' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'ADD_ITEM', name: 'Add Item', payloadSchema: [
                { name: 'name', type: 'string', required: true },
                { name: 'price', type: 'number', required: true },
                { name: 'productId', type: 'string', required: true },
              ] },
              { key: 'REMOVE_ITEM', name: 'Remove Item', payloadSchema: [
                { name: 'id', type: 'string', required: true },
              ] },
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Shopping Cart' }],
                  ['render-ui', 'main', { type: 'stats', label: 'Total', value: '@entity.price' }],
                  ['render-ui', 'main', { type: 'empty-state', title: 'No items in cart', message: 'Add items to get started' }],
                ],
              },
              {
                from: 'empty',
                to: 'hasItems',
                event: 'ADD_ITEM',
                effects: [
                  ['fetch', 'CartItem'],
                  ['set', '@entity.name', '@payload.name'],
                  ['set', '@entity.price', '@payload.price'],
                  ['set', '@entity.productId', '@payload.productId'],
                  ['set', '@entity.quantity', 1],
                  ['render-ui', 'main', { type: 'page-header', title: 'Shopping Cart',
                    actions: [{ label: 'Checkout', event: 'PROCEED_CHECKOUT' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', label: 'Cart Total', value: '@entity.price' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'CartItem',
                    itemActions: [
                      { label: 'Remove', event: 'REMOVE_ITEM' },
                    ],
                  }],
                ],
              },
              {
                from: 'hasItems',
                to: 'hasItems',
                event: 'ADD_ITEM',
                effects: [
                  ['fetch', 'CartItem'],
                  ['set', '@entity.name', '@payload.name'],
                  ['set', '@entity.price', '@payload.price'],
                  ['set', '@entity.productId', '@payload.productId'],
                  ['set', '@entity.quantity', 1],
                  ['render-ui', 'main', { type: 'stats', label: 'Cart Total', value: '@entity.price' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'CartItem',
                    itemActions: [
                      { label: 'Remove', event: 'REMOVE_ITEM' },
                    ],
                  }],
                ],
              },
              {
                from: 'hasItems',
                to: 'hasItems',
                event: 'REMOVE_ITEM',
                effects: [
                  ['fetch', 'CartItem'],
                  ['render-ui', 'main', { type: 'stats', label: 'Cart Total', value: '@entity.price' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'CartItem',
                    itemActions: [
                      { label: 'Remove', event: 'REMOVE_ITEM' },
                    ],
                  }],
                ],
              },
              {
                from: 'hasItems',
                to: 'checkout',
                event: 'PROCEED_CHECKOUT',
                effects: [
                  ['fetch', 'CartItem'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Checkout',
                    actions: [{ label: 'Back to Cart', event: 'BACK_TO_CART' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', label: 'Cart Total', value: '@entity.price' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'CartItem',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'checkout',
                to: 'checkout',
                event: 'VIEW',
                effects: [
                  ['fetch', 'CartItem'],
                  ['render-ui', 'main', { type: 'entity-list', entity: 'CartItem',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'checkout',
                to: 'hasItems',
                event: 'BACK_TO_CART',
                effects: [
                  ['fetch', 'CartItem'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Shopping Cart',
                    actions: [{ label: 'Checkout', event: 'PROCEED_CHECKOUT' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', label: 'Cart Total', value: '@entity.price' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'CartItem',
                    itemActions: [
                      { label: 'Remove', event: 'REMOVE_ITEM' },
                    ],
                  }],
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

/**
 * std-checkout - Wizard-like checkout flow.
 * Entity: Order with total, status, shippingAddress, paymentMethod.
 * States: shipping -> payment -> review -> confirmed.
 */
export const CHECKOUT_BEHAVIOR: OrbitalSchema = {
  name: 'std-checkout',
  version: '1.0.0',
  description: 'Multi-step checkout flow with shipping, payment, and review',
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
                  ['render-ui', 'main', { type: 'wizard-container', steps: [], entity: 'Order' }],
                  ['render-ui', 'main', { type: 'wizard-progress', currentStep: 0, steps: [{ label: 'Shipping' }, { label: 'Payment' }, { label: 'Review' }] }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'Order' }],
                ],
              },
              {
                from: 'shipping',
                to: 'payment',
                event: 'SET_SHIPPING',
                effects: [
                  ['fetch', 'Order'],
                  ['set', '@entity.shippingAddress', '@payload.shippingAddress'],
                  ['render-ui', 'main', { type: 'wizard-container', steps: [], entity: 'Order' }],
                  ['render-ui', 'main', { type: 'wizard-progress', currentStep: 1, steps: [{ label: 'Shipping' }, { label: 'Payment' }, { label: 'Review' }] }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'Order' }],
                ],
              },
              {
                from: 'payment',
                to: 'review',
                event: 'SET_PAYMENT',
                effects: [
                  ['fetch', 'Order'],
                  ['set', '@entity.paymentMethod', '@payload.paymentMethod'],
                  ['render-ui', 'main', { type: 'wizard-container', steps: [], entity: 'Order' }],
                  ['render-ui', 'main', { type: 'wizard-progress', currentStep: 2, steps: [{ label: 'Shipping' }, { label: 'Payment' }, { label: 'Review' }] }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'Order' }],
                ],
              },
              {
                from: 'payment',
                to: 'shipping',
                event: 'BACK_TO_SHIPPING',
                effects: [
                  ['fetch', 'Order'],
                  ['render-ui', 'main', { type: 'wizard-container', steps: [], entity: 'Order' }],
                  ['render-ui', 'main', { type: 'wizard-progress', currentStep: 0, steps: [{ label: 'Shipping' }, { label: 'Payment' }, { label: 'Review' }] }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'Order' }],
                ],
              },
              {
                from: 'review',
                to: 'confirmed',
                event: 'CONFIRM',
                effects: [
                  ['fetch', 'Order'],
                  ['set', '@entity.status', 'confirmed'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Order Confirmed' }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'Order' }],
                ],
              },
              {
                from: 'review',
                to: 'payment',
                event: 'BACK_TO_PAYMENT',
                effects: [
                  ['fetch', 'Order'],
                  ['render-ui', 'main', { type: 'wizard-container', steps: [], entity: 'Order' }],
                  ['render-ui', 'main', { type: 'wizard-progress', currentStep: 1, steps: [{ label: 'Shipping' }, { label: 'Payment' }, { label: 'Review' }] }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'Order' }],
                ],
              },
              {
                from: 'confirmed',
                to: 'shipping',
                event: 'NEW_ORDER',
                effects: [
                  ['fetch', 'Order'],
                  ['render-ui', 'main', { type: 'wizard-container', steps: [], entity: 'Order' }],
                  ['render-ui', 'main', { type: 'wizard-progress', currentStep: 0, steps: [{ label: 'Shipping' }, { label: 'Payment' }, { label: 'Review' }] }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'Order' }],
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

/**
 * std-catalog - Product catalog with browsing and detail view.
 * Entity: Product with name, description, price, category, inStock.
 * States: browsing -> viewing -> filtering. Standard list+detail.
 */
export const CATALOG_BEHAVIOR: OrbitalSchema = {
  name: 'std-catalog',
  version: '1.0.0',
  description: 'Product catalog with browsing, filtering, and detail view',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Product Catalog' }],
                  ['render-ui', 'main', { type: 'search-input', placeholder: 'Search products', event: 'APPLY_FILTER' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Product',
                    itemActions: [
                      { label: 'View', event: 'VIEW_PRODUCT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW_PRODUCT',
                effects: [
                  ['fetch', 'Product'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'Product',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
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
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Product',
                    itemActions: [{ label: 'View', event: 'VIEW_PRODUCT' }],
                  }],
                ],
              },
              {
                from: 'filtering',
                to: 'filtering',
                event: 'APPLY_FILTER',
                effects: [
                  ['fetch', 'Product'],
                  ['set', '@entity.category', '@payload.category'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Product',
                    itemActions: [{ label: 'View', event: 'VIEW_PRODUCT' }],
                  }],
                ],
              },
              {
                from: 'filtering',
                to: 'viewing',
                event: 'VIEW_PRODUCT',
                effects: [
                  ['fetch', 'Product'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'Product',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
                ],
              },
              {
                from: 'filtering',
                to: 'browsing',
                event: 'CLEAR_FILTER',
                effects: [
                  ['set', '@entity.category', ''],
                  ['fetch', 'Product'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Product Catalog' }],
                  ['render-ui', 'main', { type: 'search-input', placeholder: 'Search products', event: 'APPLY_FILTER' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Product',
                    itemActions: [
                      { label: 'View', event: 'VIEW_PRODUCT' },
                    ],
                  }],
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

/**
 * std-pricing - Price rule management with CRUD operations.
 * Entity: PriceRule with name, type, value, startDate, endDate.
 * States: browsing -> editing -> previewing.
 */
export const PRICING_BEHAVIOR: OrbitalSchema = {
  name: 'std-pricing',
  version: '1.0.0',
  description: 'Price rule management with CRUD and preview',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Price Rules' }],
                  ['render-ui', 'main', { type: 'stats', label: 'Total Rules', value: '@entity.name' }],
                  ['render-ui', 'main', { type: 'chart', entity: 'PriceRule' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'PriceRule',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT_RULE' },
                      { label: 'Preview', event: 'PREVIEW_RULE' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'editing',
                event: 'EDIT_RULE',
                effects: [
                  ['fetch', 'PriceRule'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'PriceRule',
                    submitEvent: 'SAVE_RULE',
                    cancelEvent: 'CANCEL',
                  }],
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
                  ['render-ui', 'main', { type: 'stats', label: 'Total Rules', value: '@entity.name' }],
                  ['render-ui', 'main', { type: 'chart', entity: 'PriceRule' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'PriceRule',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT_RULE' },
                      { label: 'Preview', event: 'PREVIEW_RULE' },
                    ],
                  }],
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
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'PriceRule',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Price Rules' }],
                  ['render-ui', 'main', { type: 'stats', label: 'Total Rules', value: '@entity.name' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'PriceRule',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT_RULE' },
                      { label: 'Preview', event: 'PREVIEW_RULE' },
                    ],
                  }],
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

/**
 * std-order-tracking - Read-only order tracking with list+detail view.
 * Entity: OrderStatus with orderId, status, estimatedDelivery, trackingNumber.
 * States: browsing -> viewing.
 */
export const ORDER_TRACKING_BEHAVIOR: OrbitalSchema = {
  name: 'std-order-tracking',
  version: '1.0.0',
  description: 'Order tracking with status and delivery estimates',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Order Tracking' }],
                  ['render-ui', 'main', { type: 'stats', label: 'Orders', value: '@entity.status' }],
                  ['render-ui', 'main', { type: 'timeline', entity: 'OrderStatus' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'OrderStatus',
                    itemActions: [
                      { label: 'View', event: 'VIEW_ORDER' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW_ORDER',
                effects: [
                  ['fetch', 'OrderStatus'],
                  ['render-ui', 'modal', { type: 'timeline', entity: 'OrderStatus', title: 'Order History' }],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'OrderStatus',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
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
