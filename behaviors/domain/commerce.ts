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

import type { BehaviorSchema } from '../types.js';

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
export const CART_BEHAVIOR: BehaviorSchema = {
  name: "std-cart",
  version: "1.0.0",
  description: "Shopping cart with add/remove items and checkout",
  theme: {
    name: "commerce-indigo",
    tokens: {
      colors: {
        primary: "#6366f1",
        "primary-hover": "#4f46e5",
        "primary-foreground": "#ffffff",
        accent: "#ec4899",
        "accent-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "CartOrbital",
      entity: {
        name: "CartItem",
        persistence: "persistent",
        collection: "cart_items",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "name",
            type: "string",
            default: "",
          },
          {
            name: "price",
            type: "number",
            default: 0,
          },
          {
            name: "quantity",
            type: "number",
            default: 1,
          },
          {
            name: "productId",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "CartControl",
          linkedEntity: "CartItem",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "empty",
                isInitial: true,
              },
              {
                name: "hasItems",
              },
              {
                name: "creating",
              },
              {
                name: "checkout",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "ADD_ITEM",
                name: "Add Item",
              },
              {
                key: "REMOVE_ITEM",
                name: "Remove Item",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "SAVE",
                name: "Save Item",
                payloadSchema: [
                  {
                    name: "data",
                    type: "object",
                    required: true,
                  },
                ],
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "PROCEED_CHECKOUT",
                name: "Proceed to Checkout",
              },
              {
                key: "BACK_TO_CART",
                name: "Back to Cart",
              },
              {
                key: "VIEW",
                name: "View Item",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "GLOBAL_VARIABLE_SET",
                name: "GLOBAL VARIABLE SET",
              },
              {
                key: "VIOLATION_DETECTED",
                name: "VIOLATION DETECTED",
              },
              {
                key: "FIELD_CHANGED",
                name: "FIELD CHANGED",
              },
            ],
            transitions: [
              {
                from: "empty",
                to: "empty",
                event: "INIT",
                effects: [
                  ["fetch", "CartItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shopping-cart",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Shopping Cart",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Add Item",
                              icon: "plus",
                              variant: "primary",
                              event: "ADD_ITEM",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Total",
                          icon: "dollar-sign",
                          value: "@entity.price",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "shopping-cart",
                              size: "xl",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Your cart is empty",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "Add items to get started",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "hasItems",
                to: "hasItems",
                event: "INIT",
                effects: [
                  ["fetch", "CartItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shopping-cart",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Shopping Cart",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Continue Shopping",
                              icon: "arrow-left",
                              variant: "ghost",
                              event: "ADD_ITEM",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "lg",
                          responsive: true,
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              children: [
                                {
                                  type: "data-list",
                                  entity: "CartItem",
                                  variant: "card",
                                  itemActions: [
                                    {
                                      label: "Remove",
                                      event: "REMOVE_ITEM",
                                      icon: "trash-2",
                                      variant: "danger",
                                    },
                                  ],
                                  emptyIcon: "shopping-cart",
                                  swipeLeftEvent: "REMOVE_ITEM",
                                  emptyTitle: "Your cart is empty",
                                  emptyDescription: "Add items to get started.",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      justify: "space-between",
                                      align: "center",
                                      children: [
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "sm",
                                          align: "center",
                                          children: [
                                            {
                                              type: "icon",
                                              name: "shopping-cart",
                                              size: "sm",
                                            },
                                            {
                                              type: "typography",
                                              variant: "h4",
                                              content: "@entity.name",
                                            },
                                          ],
                                        },
                                        {
                                          type: "stack",
                                          direction: "horizontal",
                                          gap: "md",
                                          align: "center",
                                          children: [
                                            {
                                              type: "typography",
                                              variant: "caption",
                                              content: "@entity.price",
                                            },
                                            {
                                              type: "badge",
                                              label: "@entity.quantity",
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "h3",
                                      content: "Order Summary",
                                    },
                                    {
                                      type: "divider",
                                    },
                                    {
                                      type: "stat-display",
                                      label: "Subtotal",
                                      icon: "dollar-sign",
                                      value: "@entity.price",
                                    },
                                    {
                                      type: "stat-display",
                                      label: "Shipping",
                                      icon: "truck",
                                      value: "Free",
                                    },
                                    {
                                      type: "stat-display",
                                      label: "Tax",
                                      icon: "percent",
                                      value: "Calculated at checkout",
                                    },
                                    {
                                      type: "divider",
                                    },
                                    {
                                      type: "stat-display",
                                      label: "Estimated Total",
                                      icon: "dollar-sign",
                                      value: "@entity.price",
                                    },
                                    {
                                      type: "button",
                                      label: "Proceed to Checkout",
                                      icon: "credit-card",
                                      variant: "primary",
                                      event: "PROCEED_CHECKOUT",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "empty",
                to: "creating",
                event: "ADD_ITEM",
                effects: [
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "form-section",
                      entity: "CartItem",
                      fields: [
                        {
                          name: "name",
                          label: "Item Name",
                          type: "string",
                          required: true,
                        },
                        {
                          name: "price",
                          label: "Price",
                          type: "number",
                          required: true,
                        },
                        {
                          name: "quantity",
                          label: "Quantity",
                          type: "number",
                          required: true,
                        },
                        {
                          name: "productId",
                          label: "Product ID",
                          type: "string",
                          required: true,
                        },
                      ],
                      submitEvent: "SAVE",
                      cancelEvent: "CANCEL",
                    },
                  ],
                ],
              },
              {
                from: "hasItems",
                to: "creating",
                event: "ADD_ITEM",
                effects: [
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "form-section",
                      entity: "CartItem",
                      fields: [
                        {
                          name: "name",
                          label: "Item Name",
                          type: "string",
                          required: true,
                        },
                        {
                          name: "price",
                          label: "Price",
                          type: "number",
                          required: true,
                        },
                        {
                          name: "quantity",
                          label: "Quantity",
                          type: "number",
                          required: true,
                        },
                        {
                          name: "productId",
                          label: "Product ID",
                          type: "string",
                          required: true,
                        },
                      ],
                      submitEvent: "SAVE",
                      cancelEvent: "CANCEL",
                    },
                  ],
                ],
              },
              {
                from: "creating",
                to: "hasItems",
                event: "SAVE",
                effects: [
                  [
                    "persist",
                    "create",
                    "CartItem",
                    "@payload.data",
                  ],
                  ["fetch", "CartItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shopping-cart",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Shopping Cart",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Add Item",
                                  icon: "plus",
                                  variant: "secondary",
                                  event: "ADD_ITEM",
                                },
                                {
                                  type: "button",
                                  label: "Checkout",
                                  icon: "credit-card",
                                  variant: "primary",
                                  event: "PROCEED_CHECKOUT",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Cart Total",
                          icon: "dollar-sign",
                          value: "@entity.price",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "CartItem",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Remove",
                              event: "REMOVE_ITEM",
                              icon: "trash-2",
                              variant: "danger",
                            },
                          ],
                          swipeLeftEvent: "REMOVE_ITEM",
                          emptyIcon: "shopping-cart",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "shopping-cart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.price",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.quantity",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  ["render-ui", "modal", null],
                  ["notify", "CartItem created successfully"],
                ],
              },
              {
                from: "creating",
                to: "hasItems",
                event: "CANCEL",
                effects: [
                  ["fetch", "CartItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shopping-cart",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Shopping Cart",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Add Item",
                                  icon: "plus",
                                  variant: "secondary",
                                  event: "ADD_ITEM",
                                },
                                {
                                  type: "button",
                                  label: "Checkout",
                                  icon: "credit-card",
                                  variant: "primary",
                                  event: "PROCEED_CHECKOUT",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Cart Total",
                          icon: "dollar-sign",
                          value: "@entity.price",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "CartItem",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Remove",
                              event: "REMOVE_ITEM",
                              icon: "trash-2",
                              variant: "danger",
                            },
                          ],
                          swipeLeftEvent: "REMOVE_ITEM",
                          emptyIcon: "shopping-cart",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "shopping-cart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.price",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.quantity",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "creating",
                to: "hasItems",
                event: "CLOSE",
                effects: [
                  ["fetch", "CartItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shopping-cart",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Shopping Cart",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Add Item",
                                  icon: "plus",
                                  variant: "secondary",
                                  event: "ADD_ITEM",
                                },
                                {
                                  type: "button",
                                  label: "Checkout",
                                  icon: "credit-card",
                                  variant: "primary",
                                  event: "PROCEED_CHECKOUT",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Cart Total",
                          icon: "dollar-sign",
                          value: "@entity.price",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "CartItem",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Remove",
                              event: "REMOVE_ITEM",
                              icon: "trash-2",
                              variant: "danger",
                            },
                          ],
                          swipeLeftEvent: "REMOVE_ITEM",
                          emptyIcon: "shopping-cart",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "shopping-cart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.price",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.quantity",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "hasItems",
                to: "hasItems",
                event: "REMOVE_ITEM",
                effects: [
                  ["fetch", "CartItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shopping-cart",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Shopping Cart",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Add Item",
                                  icon: "plus",
                                  variant: "secondary",
                                  event: "ADD_ITEM",
                                },
                                {
                                  type: "button",
                                  label: "Checkout",
                                  icon: "credit-card",
                                  variant: "primary",
                                  event: "PROCEED_CHECKOUT",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Cart Total",
                          icon: "dollar-sign",
                          value: "@entity.price",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "CartItem",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Remove",
                              event: "REMOVE_ITEM",
                              icon: "trash-2",
                              variant: "danger",
                            },
                          ],
                          swipeLeftEvent: "REMOVE_ITEM",
                          emptyIcon: "shopping-cart",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "shopping-cart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.price",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.quantity",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "hasItems",
                to: "checkout",
                event: "PROCEED_CHECKOUT",
                effects: [
                  ["fetch", "CartItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "credit-card",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Checkout",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Back to Cart",
                              icon: "arrow-left",
                              variant: "secondary",
                              event: "BACK_TO_CART",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "h3",
                          content: "Order Summary",
                        },
                        {
                          type: "stat-display",
                          label: "Cart Total",
                          icon: "dollar-sign",
                          value: "@entity.price",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "CartItem",
                          variant: "compact",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "credit-card",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "shopping-cart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.price",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.quantity",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "checkout",
                to: "checkout",
                event: "VIEW",
                effects: [
                  ["fetch", "CartItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "credit-card",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Checkout",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "CartItem",
                          variant: "compact",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "credit-card",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "shopping-cart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.price",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.quantity",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "checkout",
                to: "hasItems",
                event: "BACK_TO_CART",
                effects: [
                  ["fetch", "CartItem"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shopping-cart",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Shopping Cart",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Add Item",
                                  icon: "plus",
                                  variant: "secondary",
                                  event: "ADD_ITEM",
                                },
                                {
                                  type: "button",
                                  label: "Checkout",
                                  icon: "credit-card",
                                  variant: "primary",
                                  event: "PROCEED_CHECKOUT",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Cart Total",
                          icon: "dollar-sign",
                          value: "@entity.price",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "CartItem",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Remove",
                              event: "REMOVE_ITEM",
                              icon: "trash-2",
                              variant: "danger",
                            },
                          ],
                          swipeLeftEvent: "REMOVE_ITEM",
                          emptyIcon: "shopping-cart",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "shopping-cart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.price",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.quantity",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "creating",
                to: "creating",
                event: "GLOBAL_VARIABLE_SET",
                effects: [],
              },
              {
                from: "creating",
                to: "creating",
                event: "VIOLATION_DETECTED",
                effects: [],
              },
              {
                from: "creating",
                to: "creating",
                event: "FIELD_CHANGED",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "CartPage",
          path: "/cart",
          isInitial: true,
          traits: [
            {
              ref: "CartControl",
            },
          ],
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
export const CHECKOUT_BEHAVIOR: BehaviorSchema = {
  name: "std-checkout",
  version: "1.0.0",
  description: "Multi-step checkout flow with shipping, payment, and review",
  theme: {
    name: "commerce-indigo",
    tokens: {
      colors: {
        primary: "#6366f1",
        "primary-hover": "#4f46e5",
        "primary-foreground": "#ffffff",
        accent: "#ec4899",
        "accent-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "CheckoutOrbital",
      entity: {
        name: "Order",
        persistence: "persistent",
        collection: "orders",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "total",
            type: "number",
            default: 0,
          },
          {
            name: "status",
            type: "string",
            default: "pending",
          },
          {
            name: "fullName",
            type: "string",
            default: "",
          },
          {
            name: "shippingAddress",
            type: "string",
            default: "",
          },
          {
            name: "city",
            type: "string",
            default: "",
          },
          {
            name: "postalCode",
            type: "string",
            default: "",
          },
          {
            name: "country",
            type: "string",
            default: "",
          },
          {
            name: "paymentMethod",
            type: "string",
            default: "",
          },
          {
            name: "cardholderName",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "CheckoutFlow",
          linkedEntity: "Order",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "shipping",
                isInitial: true,
              },
              {
                name: "payment",
              },
              {
                name: "review",
              },
              {
                name: "confirmed",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "SET_SHIPPING",
                name: "Set Shipping",
                payloadSchema: [
                  {
                    name: "fullName",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "shippingAddress",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "city",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "postalCode",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "country",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "SET_PAYMENT",
                name: "Set Payment",
                payloadSchema: [
                  {
                    name: "paymentMethod",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "cardholderName",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CONFIRM",
                name: "Confirm Order",
              },
              {
                key: "BACK_TO_SHIPPING",
                name: "Back to Shipping",
              },
              {
                key: "BACK_TO_PAYMENT",
                name: "Back to Payment",
              },
              {
                key: "NEW_ORDER",
                name: "New Order",
              },
            ],
            transitions: [
              {
                from: "shipping",
                to: "shipping",
                event: "INIT",
                effects: [
                  ["fetch", "Order"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "wizard-progress",
                          currentStep: 0,
                          steps: [
                            {
                              label: "Shipping",
                              icon: "truck",
                            },
                            {
                              label: "Payment",
                              icon: "credit-card",
                            },
                            {
                              label: "Review",
                              icon: "clipboard-check",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "truck",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Shipping Address",
                            },
                          ],
                        },
                        {
                          type: "form-section",
                          entity: "Order",
                          submitEvent: "SET_SHIPPING",
                          submitLabel: "Continue",
                          showCancel: false,
                          fields: [
                            {
                              name: "fullName",
                              label: "Full Name",
                              icon: "user",
                            },
                            {
                              name: "shippingAddress",
                              label: "Street Address",
                              icon: "map-pin",
                            },
                            {
                              name: "city",
                              label: "City",
                              icon: "building",
                            },
                            {
                              name: "postalCode",
                              label: "Postal Code",
                              icon: "hash",
                            },
                            {
                              name: "country",
                              label: "Country",
                              icon: "globe",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "shipping",
                to: "payment",
                event: "SET_SHIPPING",
                effects: [
                  ["fetch", "Order"],
                  ["set", "@entity.fullName", "@payload.fullName"],
                  ["set", "@entity.shippingAddress", "@payload.shippingAddress"],
                  ["set", "@entity.city", "@payload.city"],
                  ["set", "@entity.postalCode", "@payload.postalCode"],
                  ["set", "@entity.country", "@payload.country"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "wizard-progress",
                          currentStep: 1,
                          steps: [
                            {
                              label: "Shipping",
                              icon: "truck",
                            },
                            {
                              label: "Payment",
                              icon: "credit-card",
                            },
                            {
                              label: "Review",
                              icon: "clipboard-check",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "credit-card",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Payment Method",
                            },
                          ],
                        },
                        {
                          type: "form-section",
                          entity: "Order",
                          submitEvent: "SET_PAYMENT",
                          submitLabel: "Continue",
                          showCancel: true,
                          cancelLabel: "Back",
                          cancelEvent: "BACK_TO_SHIPPING",
                          fields: [
                            {
                              name: "cardholderName",
                              label: "Cardholder Name",
                              icon: "user",
                            },
                            {
                              name: "paymentMethod",
                              label: "Payment Method",
                              icon: "wallet",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "payment",
                to: "review",
                event: "SET_PAYMENT",
                effects: [
                  ["fetch", "Order"],
                  ["set", "@entity.paymentMethod", "@payload.paymentMethod"],
                  ["set", "@entity.cardholderName", "@payload.cardholderName"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "wizard-progress",
                          currentStep: 2,
                          steps: [
                            {
                              label: "Shipping",
                              icon: "truck",
                            },
                            {
                              label: "Payment",
                              icon: "credit-card",
                            },
                            {
                              label: "Review",
                              icon: "clipboard-check",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "clipboard-check",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Review Order",
                            },
                          ],
                        },
                        {
                          type: "data-list",
                          entity: "Order",
                          variant: "striped",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "credit-card",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.fullName",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.shippingAddress",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "wizard-navigation",
                          currentStep: 2,
                          totalSteps: 3,
                          showBack: true,
                          showNext: false,
                          showComplete: true,
                          backLabel: "Back",
                          completeLabel: "Place Order",
                          onBack: "BACK_TO_PAYMENT",
                          onComplete: "CONFIRM",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "payment",
                to: "shipping",
                event: "BACK_TO_SHIPPING",
                effects: [
                  ["fetch", "Order"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "wizard-progress",
                          currentStep: 0,
                          steps: [
                            {
                              label: "Shipping",
                              icon: "truck",
                            },
                            {
                              label: "Payment",
                              icon: "credit-card",
                            },
                            {
                              label: "Review",
                              icon: "clipboard-check",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "truck",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Shipping Address",
                            },
                          ],
                        },
                        {
                          type: "form-section",
                          entity: "Order",
                          submitEvent: "SET_SHIPPING",
                          submitLabel: "Continue",
                          showCancel: false,
                          fields: [
                            {
                              name: "fullName",
                              label: "Full Name",
                              icon: "user",
                            },
                            {
                              name: "shippingAddress",
                              label: "Street Address",
                              icon: "map-pin",
                            },
                            {
                              name: "city",
                              label: "City",
                              icon: "building",
                            },
                            {
                              name: "postalCode",
                              label: "Postal Code",
                              icon: "hash",
                            },
                            {
                              name: "country",
                              label: "Country",
                              icon: "globe",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "review",
                to: "confirmed",
                event: "CONFIRM",
                effects: [
                  ["fetch", "Order"],
                  ["set", "@entity.status", "confirmed"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      align: "center",
                      children: [
                        {
                          type: "icon",
                          name: "check-circle",
                          size: "xl",
                        },
                        {
                          type: "typography",
                          variant: "h2",
                          content: "Order Confirmed",
                        },
                        {
                          type: "badge",
                          label: "@entity.status",
                          variant: "success",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Order",
                          variant: "striped",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "credit-card",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.fullName",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.shippingAddress",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Place New Order",
                          icon: "plus",
                          variant: "primary",
                          action: "NEW_ORDER",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "review",
                to: "payment",
                event: "BACK_TO_PAYMENT",
                effects: [
                  ["fetch", "Order"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "wizard-progress",
                          currentStep: 1,
                          steps: [
                            {
                              label: "Shipping",
                              icon: "truck",
                            },
                            {
                              label: "Payment",
                              icon: "credit-card",
                            },
                            {
                              label: "Review",
                              icon: "clipboard-check",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "credit-card",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Payment Method",
                            },
                          ],
                        },
                        {
                          type: "form-section",
                          entity: "Order",
                          submitEvent: "SET_PAYMENT",
                          submitLabel: "Continue",
                          showCancel: true,
                          cancelLabel: "Back",
                          cancelEvent: "BACK_TO_SHIPPING",
                          fields: [
                            {
                              name: "cardholderName",
                              label: "Cardholder Name",
                              icon: "user",
                            },
                            {
                              name: "paymentMethod",
                              label: "Payment Method",
                              icon: "wallet",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "confirmed",
                to: "shipping",
                event: "NEW_ORDER",
                effects: [
                  ["fetch", "Order"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "wizard-progress",
                          currentStep: 0,
                          steps: [
                            {
                              label: "Shipping",
                              icon: "truck",
                            },
                            {
                              label: "Payment",
                              icon: "credit-card",
                            },
                            {
                              label: "Review",
                              icon: "clipboard-check",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "truck",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Shipping Address",
                            },
                          ],
                        },
                        {
                          type: "form-section",
                          entity: "Order",
                          submitEvent: "SET_SHIPPING",
                          submitLabel: "Continue",
                          showCancel: false,
                          fields: [
                            {
                              name: "fullName",
                              label: "Full Name",
                              icon: "user",
                            },
                            {
                              name: "shippingAddress",
                              label: "Street Address",
                              icon: "map-pin",
                            },
                            {
                              name: "city",
                              label: "City",
                              icon: "building",
                            },
                            {
                              name: "postalCode",
                              label: "Postal Code",
                              icon: "hash",
                            },
                            {
                              name: "country",
                              label: "Country",
                              icon: "globe",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "CheckoutPage",
          path: "/checkout",
          isInitial: true,
          traits: [
            {
              ref: "CheckoutFlow",
            },
          ],
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
export const CATALOG_BEHAVIOR: BehaviorSchema = {
  name: "std-catalog",
  version: "1.0.0",
  description: "Product catalog with browsing, filtering, and detail view",
  theme: {
    name: "commerce-indigo",
    tokens: {
      colors: {
        primary: "#6366f1",
        "primary-hover": "#4f46e5",
        "primary-foreground": "#ffffff",
        accent: "#ec4899",
        "accent-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "CatalogOrbital",
      entity: {
        name: "Product",
        persistence: "persistent",
        collection: "products",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "name",
            type: "string",
            default: "",
          },
          {
            name: "description",
            type: "string",
            default: "",
          },
          {
            name: "price",
            type: "number",
            default: 0,
          },
          {
            name: "category",
            type: "string",
            default: "",
          },
          {
            name: "inStock",
            type: "boolean",
            default: true,
          },
        ],
      },
      traits: [
        {
          name: "CatalogBrowse",
          linkedEntity: "Product",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "viewing",
              },
              {
                name: "filtering",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "VIEW_PRODUCT",
                name: "View Product",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "APPLY_FILTER",
                name: "Apply Filter",
                payloadSchema: [
                  {
                    name: "category",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CLEAR_FILTER",
                name: "Clear Filter",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "Product"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Products",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Search products...",
                          event: "APPLY_FILTER",
                          entity: "Product",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "lg",
                          responsive: true,
                          children: [
                            {
                              type: "card",
                              title: "Filters",
                              children: [
                                {
                                  type: "filter-group",
                                  entity: "Product",
                                  filters: [
                                    {
                                      field: "category",
                                      label: "Category",
                                      filterType: "select",
                                      options: [
                                        "electronics",
                                        "clothing",
                                        "home",
                                        "sports",
                                        "books",
                                      ],
                                    },
                                    {
                                      field: "inStock",
                                      label: "Availability",
                                      filterType: "select",
                                      options: ["true", "false"],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "data-list",
                              entity: "Product",
                              variant: "card",
                              gap: "md",
                              itemActions: [
                                {
                                  label: "View",
                                  event: "VIEW_PRODUCT",
                                  icon: "eye",
                                },
                                {
                                  label: "Add to Cart",
                                  event: "VIEW_PRODUCT",
                                  icon: "shopping-cart",
                                },
                              ],
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  align: "center",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "sm",
                                      align: "center",
                                      children: [
                                        {
                                          type: "icon",
                                          name: "package",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.name",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "md",
                                      align: "center",
                                      children: [
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "@entity.price",
                                        },
                                        {
                                          type: "badge",
                                          label: "@entity.category",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "empty-state",
                          icon: "search",
                          title: "No products found",
                          description: "Try adjusting your search or filter criteria.",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "VIEW_PRODUCT",
                effects: [
                  ["fetch", "Product"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "box",
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "Product Details",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "ghost",
                              event: "CLOSE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "package",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Name",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.name",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "file-text",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Description",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.description",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "dollar-sign",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Price",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.price",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "tag",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Category",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.category",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "check-circle",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "In Stock",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.inStock",
                                  variant: "success",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "filtering",
                event: "APPLY_FILTER",
                effects: [
                  ["fetch", "Product"],
                  ["set", "@entity.category", "@payload.category"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Products",
                            },
                            {
                              type: "button",
                              label: "Clear Filter",
                              icon: "x",
                              variant: "ghost",
                              event: "CLEAR_FILTER",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Search products...",
                          event: "APPLY_FILTER",
                          entity: "Product",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "lg",
                          responsive: true,
                          children: [
                            {
                              type: "card",
                              title: "Filters",
                              children: [
                                {
                                  type: "filter-group",
                                  entity: "Product",
                                  filters: [
                                    {
                                      field: "category",
                                      label: "Category",
                                      filterType: "select",
                                      options: [
                                        "electronics",
                                        "clothing",
                                        "home",
                                        "sports",
                                        "books",
                                      ],
                                    },
                                    {
                                      field: "inStock",
                                      label: "Availability",
                                      filterType: "select",
                                      options: ["true", "false"],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "data-list",
                              entity: "Product",
                              variant: "card",
                              gap: "md",
                              itemActions: [
                                {
                                  label: "View",
                                  event: "VIEW_PRODUCT",
                                  icon: "eye",
                                },
                                {
                                  label: "Add to Cart",
                                  event: "VIEW_PRODUCT",
                                  icon: "shopping-cart",
                                },
                              ],
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  align: "center",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "sm",
                                      align: "center",
                                      children: [
                                        {
                                          type: "icon",
                                          name: "package",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.name",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "md",
                                      align: "center",
                                      children: [
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "@entity.price",
                                        },
                                        {
                                          type: "badge",
                                          label: "@entity.category",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "empty-state",
                          icon: "search",
                          title: "No products found",
                          description: "Try adjusting your search or filter criteria.",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "filtering",
                to: "filtering",
                event: "APPLY_FILTER",
                effects: [
                  ["fetch", "Product"],
                  ["set", "@entity.category", "@payload.category"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Products",
                            },
                            {
                              type: "button",
                              label: "Clear Filter",
                              icon: "x",
                              variant: "ghost",
                              event: "CLEAR_FILTER",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Search products...",
                          event: "APPLY_FILTER",
                          entity: "Product",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "lg",
                          responsive: true,
                          children: [
                            {
                              type: "card",
                              title: "Filters",
                              children: [
                                {
                                  type: "filter-group",
                                  entity: "Product",
                                  filters: [
                                    {
                                      field: "category",
                                      label: "Category",
                                      filterType: "select",
                                      options: [
                                        "electronics",
                                        "clothing",
                                        "home",
                                        "sports",
                                        "books",
                                      ],
                                    },
                                    {
                                      field: "inStock",
                                      label: "Availability",
                                      filterType: "select",
                                      options: ["true", "false"],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "data-list",
                              entity: "Product",
                              variant: "card",
                              gap: "md",
                              itemActions: [
                                {
                                  label: "View",
                                  event: "VIEW_PRODUCT",
                                  icon: "eye",
                                },
                                {
                                  label: "Add to Cart",
                                  event: "VIEW_PRODUCT",
                                  icon: "shopping-cart",
                                },
                              ],
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  align: "center",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "sm",
                                      align: "center",
                                      children: [
                                        {
                                          type: "icon",
                                          name: "package",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.name",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "md",
                                      align: "center",
                                      children: [
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "@entity.price",
                                        },
                                        {
                                          type: "badge",
                                          label: "@entity.category",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "empty-state",
                          icon: "search",
                          title: "No products found",
                          description: "Try adjusting your search or filter criteria.",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "filtering",
                to: "viewing",
                event: "VIEW_PRODUCT",
                effects: [
                  ["fetch", "Product"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "box",
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "Product Details",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "ghost",
                              event: "CLOSE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "package",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Name",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.name",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "file-text",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Description",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.description",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "dollar-sign",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Price",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.price",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "tag",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Category",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.category",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "check-circle",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "In Stock",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.inStock",
                                  variant: "success",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "filtering",
                to: "browsing",
                event: "CLEAR_FILTER",
                effects: [
                  ["set", "@entity.category", ""],
                  ["fetch", "Product"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Products",
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Search products...",
                          event: "APPLY_FILTER",
                          entity: "Product",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "lg",
                          responsive: true,
                          children: [
                            {
                              type: "card",
                              title: "Filters",
                              children: [
                                {
                                  type: "filter-group",
                                  entity: "Product",
                                  filters: [
                                    {
                                      field: "category",
                                      label: "Category",
                                      filterType: "select",
                                      options: [
                                        "electronics",
                                        "clothing",
                                        "home",
                                        "sports",
                                        "books",
                                      ],
                                    },
                                    {
                                      field: "inStock",
                                      label: "Availability",
                                      filterType: "select",
                                      options: ["true", "false"],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "data-list",
                              entity: "Product",
                              variant: "card",
                              gap: "md",
                              itemActions: [
                                {
                                  label: "View",
                                  event: "VIEW_PRODUCT",
                                  icon: "eye",
                                },
                                {
                                  label: "Add to Cart",
                                  event: "VIEW_PRODUCT",
                                  icon: "shopping-cart",
                                },
                              ],
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  align: "center",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "sm",
                                      align: "center",
                                      children: [
                                        {
                                          type: "icon",
                                          name: "package",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.name",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "md",
                                      align: "center",
                                      children: [
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "@entity.price",
                                        },
                                        {
                                          type: "badge",
                                          label: "@entity.category",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "empty-state",
                          icon: "search",
                          title: "No products found",
                          description: "Try adjusting your search or filter criteria.",
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "CatalogPage",
          path: "/catalog",
          isInitial: true,
          traits: [
            {
              ref: "CatalogBrowse",
            },
          ],
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
export const PRICING_BEHAVIOR: BehaviorSchema = {
  name: "std-pricing",
  version: "1.0.0",
  description: "Price rule management with CRUD and preview",
  theme: {
    name: "commerce-indigo",
    tokens: {
      colors: {
        primary: "#6366f1",
        "primary-hover": "#4f46e5",
        "primary-foreground": "#ffffff",
        accent: "#ec4899",
        "accent-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "PricingOrbital",
      entity: {
        name: "PriceRule",
        persistence: "persistent",
        collection: "price_rules",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "name",
            type: "string",
            default: "",
          },
          {
            name: "type",
            type: "string",
            default: "percentage",
          },
          {
            name: "value",
            type: "number",
            default: 0,
          },
          {
            name: "startDate",
            type: "string",
            default: "",
          },
          {
            name: "endDate",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "PricingManagement",
          linkedEntity: "PriceRule",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "editing",
              },
              {
                name: "previewing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "EDIT_RULE",
                name: "Edit Rule",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "SAVE_RULE",
                name: "Save Rule",
                payloadSchema: [
                  {
                    name: "name",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "value",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "PREVIEW_RULE",
                name: "Preview Rule",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "BACK_TO_LIST",
                name: "Back to List",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "PriceRule"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "tag",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Price Rules",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Rules",
                              icon: "layers",
                              entity: "PriceRule",
                            },
                            {
                              type: "line-chart",
                              entity: "PriceRule",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "PriceRule",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Edit",
                              event: "EDIT_RULE",
                              icon: "pencil",
                            },
                            {
                              label: "Preview",
                              event: "PREVIEW_RULE",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "tag",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "dollar-sign",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.value",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.type",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "editing",
                event: "EDIT_RULE",
                effects: [
                  ["fetch", "PriceRule"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "pencil",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Edit Price Rule",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "PriceRule",
                          submitEvent: "SAVE_RULE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "name",
                              label: "Rule Name",
                              icon: "bookmark",
                            },
                            {
                              name: "value",
                              label: "Value",
                              icon: "dollar-sign",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "SAVE_RULE",
                effects: [
                  ["fetch", "PriceRule"],
                  ["set", "@entity.name", "@payload.name"],
                  ["set", "@entity.value", "@payload.value"],
                  ["render-ui", "modal", null],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "tag",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Price Rules",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Rules",
                              icon: "layers",
                              entity: "PriceRule",
                            },
                            {
                              type: "line-chart",
                              entity: "PriceRule",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "PriceRule",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Edit",
                              event: "EDIT_RULE",
                              icon: "pencil",
                            },
                            {
                              label: "Preview",
                              event: "PREVIEW_RULE",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "tag",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "dollar-sign",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.value",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.type",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "previewing",
                event: "PREVIEW_RULE",
                effects: [
                  ["fetch", "PriceRule"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "eye",
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "Rule Preview",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Back to List",
                                  icon: "arrow-left",
                                  variant: "secondary",
                                  event: "BACK_TO_LIST",
                                },
                                {
                                  type: "button",
                                  label: "Close",
                                  icon: "x",
                                  variant: "ghost",
                                  event: "CLOSE",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "bookmark",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Name",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.name",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "sliders",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Type",
                                },
                                {
                                  type: "badge",
                                  content: "@entity.type",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "dollar-sign",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Value",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.value",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "calendar",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Start Date",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.startDate",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "icon",
                                  name: "calendar",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "End Date",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.endDate",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "previewing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "previewing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "previewing",
                to: "browsing",
                event: "BACK_TO_LIST",
                effects: [
                  ["fetch", "PriceRule"],
                  ["render-ui", "modal", null],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "tag",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Price Rules",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Rules",
                              icon: "layers",
                              entity: "PriceRule",
                            },
                            {
                              type: "line-chart",
                              entity: "PriceRule",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "PriceRule",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Edit",
                              event: "EDIT_RULE",
                              icon: "pencil",
                            },
                            {
                              label: "Preview",
                              event: "PREVIEW_RULE",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "tag",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "dollar-sign",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.value",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.type",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "PricingPage",
          path: "/pricing",
          isInitial: true,
          traits: [
            {
              ref: "PricingManagement",
            },
          ],
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
export const ORDER_TRACKING_BEHAVIOR: BehaviorSchema = {
  name: "std-order-tracking",
  version: "1.0.0",
  description: "Order tracking with status and delivery estimates",
  theme: {
    name: "commerce-indigo",
    tokens: {
      colors: {
        primary: "#6366f1",
        "primary-hover": "#4f46e5",
        "primary-foreground": "#ffffff",
        accent: "#ec4899",
        "accent-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "OrderTrackingOrbital",
      entity: {
        name: "OrderStatus",
        persistence: "persistent",
        collection: "order_statuses",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "orderId",
            type: "string",
            default: "",
          },
          {
            name: "status",
            type: "string",
            default: "pending",
          },
          {
            name: "estimatedDelivery",
            type: "string",
            default: "",
          },
          {
            name: "trackingNumber",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "OrderTrackingView",
          linkedEntity: "OrderStatus",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "viewing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "VIEW_ORDER",
                name: "View Order",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "OrderStatus"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Order Tracking",
                            },
                            {
                              type: "badge",
                              label: "@entity.orderId",
                              variant: "default",
                              icon: "hash",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Orders",
                              icon: "clipboard-list",
                              entity: "OrderStatus",
                            },
                            {
                              type: "stat-display",
                              label: "Current Status",
                              icon: "activity",
                              value: "@entity.status",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search by order ID or tracking number...",
                          entity: "OrderStatus",
                        },
                        {
                          type: "data-list",
                          entity: "OrderStatus",
                          variant: "card",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "truck",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.orderId",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.estimatedDelivery",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          itemActions: [
                            {
                              label: "Track Order",
                              event: "VIEW_ORDER",
                              icon: "eye",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "VIEW_ORDER",
                effects: [
                  ["fetch", "OrderStatus"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          align: "center",
                          children: [
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Order Tracking",
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "ghost",
                              event: "CLOSE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "badge",
                              label: "@entity.status",
                              variant: "default",
                              size: "lg",
                              icon: "truck",
                            },
                            {
                              type: "typography",
                              variant: "caption",
                              content: "@entity.orderId",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              children: [
                                {
                                  type: "typography",
                                  variant: "h5",
                                  content: "Delivery Progress",
                                },
                                {
                                  type: "progress-bar",
                                  value: 60,
                                  max: 100,
                                  progressType: "stepped",
                                  steps: 5,
                                  label: "Order Progress",
                                  showLabel: true,
                                },
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "sm",
                                  children: [
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "sm",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "online",
                                          size: "md",
                                          label: "Order Placed",
                                        },
                                        {
                                          type: "typography",
                                          variant: "body",
                                          content: "Order Placed",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Confirmed",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "sm",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "online",
                                          size: "md",
                                          label: "Processing",
                                        },
                                        {
                                          type: "typography",
                                          variant: "body",
                                          content: "Processing",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Completed",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "sm",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "online",
                                          size: "md",
                                          label: "Shipped",
                                        },
                                        {
                                          type: "typography",
                                          variant: "body",
                                          content: "Shipped",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "@entity.trackingNumber",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "sm",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "away",
                                          size: "md",
                                          pulse: true,
                                          label: "In Transit",
                                        },
                                        {
                                          type: "typography",
                                          variant: "body",
                                          content: "In Transit",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Current stage",
                                        },
                                      ],
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "sm",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "offline",
                                          size: "md",
                                          label: "Delivered",
                                        },
                                        {
                                          type: "typography",
                                          variant: "body",
                                          content: "Delivered",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "@entity.estimatedDelivery",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "sm",
                              children: [
                                {
                                  type: "typography",
                                  variant: "h5",
                                  content: "Order Details",
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "label",
                                      content: "Order ID",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "@entity.orderId",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "label",
                                      content: "Status",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "label",
                                      content: "Tracking Number",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "@entity.trackingNumber",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  justify: "space-between",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "label",
                                      content: "Est. Delivery",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "@entity.estimatedDelivery",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "OrderTrackingPage",
          path: "/order-tracking",
          isInitial: true,
          traits: [
            {
              ref: "OrderTrackingView",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Commerce Behaviors
// ============================================================================

export const COMMERCE_BEHAVIORS: BehaviorSchema[] = [
  CART_BEHAVIOR,
  CHECKOUT_BEHAVIOR,
  CATALOG_BEHAVIOR,
  PRICING_BEHAVIOR,
  ORDER_TRACKING_BEHAVIOR,
];
