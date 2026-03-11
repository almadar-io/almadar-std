/**
 * Finance Domain Behaviors
 *
 * Standard behaviors for ledger entries, transaction tracking,
 * and portfolio management.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * UI Composition: molecule-first (atoms + molecules only, no organisms).
 * Each behavior has unique, domain-appropriate layouts composed with
 * VStack/HStack/Box wrappers around atoms and molecules.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from '../types.js';

// ── Shared Finance Theme ────────────────────────────────────────────

const FINANCE_THEME = {
  name: 'finance-emerald',
  tokens: {
    colors: {
      primary: '#059669',
      'primary-hover': '#047857',
      'primary-foreground': '#ffffff',
      accent: '#10b981',
      'accent-foreground': '#ffffff',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ── Reusable main-view effects (ledger) ─────────────────────────────

const ledgerMainEffects: BehaviorEffect[] = [
  ['fetch', 'LedgerEntry'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header zone: landmark icon + title + new entry button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'landmark', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Ledger' },
      ]},
      { type: 'button', label: 'New Entry', icon: 'plus', variant: 'primary', action: 'NEW_ENTRY' },
    ]},
    { type: 'divider' },
    // Stats zone: debit total, credit total, balance
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Debit', icon: 'trending-down', entity: 'LedgerEntry' },
      { type: 'stats', label: 'Total Credit', icon: 'trending-up', entity: 'LedgerEntry' },
      { type: 'stats', label: 'Balance', icon: 'wallet', entity: 'LedgerEntry' },
    ]},
    // Balance trend chart
    { type: 'line-chart', entity: 'LedgerEntry' },
    { type: 'divider' },
    // Data zone: ledger entries as card list
    { type: 'data-list', entity: 'LedgerEntry', variant: 'card',
      fields: [
        { name: 'description', label: 'Description', icon: 'file-text', variant: 'h4' },
        { name: 'date', label: 'Date', icon: 'calendar', variant: 'caption', format: 'date' },
        { name: 'debit', label: 'Debit', icon: 'trending-down', variant: 'body', format: 'currency' },
        { name: 'credit', label: 'Credit', icon: 'trending-up', variant: 'body', format: 'currency' },
        { name: 'balance', label: 'Balance', icon: 'wallet', variant: 'body', format: 'currency' },
      ],
      itemActions: [
        { label: 'View', event: 'VIEW', icon: 'eye' },
      ],
    },
  ]}],
];

// ── Reusable main-view effects (transactions) ───────────────────────

const transactionMainEffects: BehaviorEffect[] = [
  ['fetch', 'Transaction'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header zone: receipt icon + title + new button + search
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'receipt', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Transactions' },
      ]},
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'search-input', placeholder: 'Search transactions...', entity: 'Transaction' },
        { type: 'button', label: 'New', icon: 'plus', variant: 'primary', action: 'CREATE' },
      ]},
    ]},
    { type: 'divider' },
    // Stats row + line chart
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Amount', icon: 'dollar-sign', entity: 'Transaction' },
      { type: 'stats', label: 'Transactions', icon: 'hash', entity: 'Transaction' },
      { type: 'stats', label: 'Avg Amount', icon: 'bar-chart-2', entity: 'Transaction' },
    ]},
    { type: 'line-chart', entity: 'Transaction' },
    { type: 'divider' },
    // Data zone: transaction list with badges
    { type: 'data-list', entity: 'Transaction', variant: 'card',
      fields: [
        { name: 'amount', label: 'Amount', icon: 'dollar-sign', variant: 'h4', format: 'currency' },
        { name: 'type', label: 'Type', icon: 'tag', variant: 'badge' },
        { name: 'category', label: 'Category', icon: 'folder', variant: 'body' },
        { name: 'date', label: 'Date', icon: 'calendar', variant: 'caption', format: 'date' },
        { name: 'status', label: 'Status', icon: 'circle-dot', variant: 'badge' },
      ],
      itemActions: [
        { label: 'View', event: 'VIEW', icon: 'eye' },
      ],
    },
  ]}],
];

// ── Reusable main-view effects (portfolio) ──────────────────────────

const portfolioMainEffects: BehaviorEffect[] = [
  ['fetch', 'Holding'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header zone: trending-up icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'trending-up', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Portfolio' },
      ]},
    ]},
    { type: 'divider' },
    // Stats zone: total holdings, total value
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Holdings', icon: 'coins', entity: 'Holding' },
      { type: 'stats', label: 'Total Value', icon: 'dollar-sign', entity: 'Holding' },
    ]},
    // Performance chart
    { type: 'line-chart', entity: 'Holding' },
    { type: 'divider' },
    // Data zone: holdings in a 3-column grid
    { type: 'data-grid', entity: 'Holding', cols: 3, gap: 'md',
      fields: [
        { name: 'symbol', label: 'Symbol', icon: 'coins', variant: 'h4' },
        { name: 'shares', label: 'Shares', icon: 'layers', variant: 'body', format: 'number' },
        { name: 'purchasePrice', label: 'Purchase Price', icon: 'credit-card', variant: 'body', format: 'currency' },
        { name: 'currentPrice', label: 'Current Price', icon: 'dollar-sign', variant: 'body', format: 'currency' },
      ],
      itemActions: [
        { label: 'View', event: 'VIEW', icon: 'eye' },
      ],
    },
  ]}],
];

// ============================================================================
// std-ledger - Ledger Entries
// ============================================================================

/**
 * std-ledger - Financial ledger with debit/credit entries.
 * States: browsing -> creating -> viewing
 *
 * UI: Emerald finance theme. Main view uses stats (debit/credit/balance) +
 * line chart for balance trend + data-list cards.
 * Modal viewing: meter for balance + detail fields with icons.
 */
export const LEDGER_BEHAVIOR: BehaviorSchema = {
  name: "std-ledger",
  version: "1.0.0",
  description: "Financial ledger with debit and credit entries",
  orbitals: [
    {
      name: "LedgerOrbital",
      theme: {
        name: "finance-emerald",
        tokens: {
          colors: {
            primary: "#059669",
            "primary-hover": "#047857",
            "primary-foreground": "#ffffff",
            accent: "#10b981",
            "accent-foreground": "#ffffff",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "LedgerEntry",
        persistence: "persistent",
        collection: "ledger_entries",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "date",
            type: "string",
            default: "",
          },
          {
            name: "description",
            type: "string",
            default: "",
          },
          {
            name: "debit",
            type: "number",
            default: 0,
          },
          {
            name: "credit",
            type: "number",
            default: 0,
          },
          {
            name: "balance",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "LedgerControl",
          linkedEntity: "LedgerEntry",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "creating",
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
                key: "NEW_ENTRY",
                name: "New Entry",
              },
              {
                key: "SAVE",
                name: "Save Entry",
                payloadSchema: [
                  {
                    name: "description",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "debit",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "credit",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "VIEW",
                name: "View Entry",
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
                key: "LOAD_MORE",
                name: "Load More",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "LedgerEntry"],
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
                              type: "typography",
                              variant: "h2",
                              content: "Ledger",
                            },
                            {
                              type: "button",
                              label: "New Entry",
                              icon: "plus",
                              variant: "primary",
                              event: "NEW_ENTRY",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Debits",
                              icon: "trending-down",
                              entity: "LedgerEntry",
                            },
                            {
                              type: "stat-display",
                              label: "Total Credits",
                              icon: "trending-up",
                              entity: "LedgerEntry",
                            },
                            {
                              type: "stat-display",
                              label: "Balance",
                              icon: "wallet",
                              entity: "LedgerEntry",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search entries...",
                          entity: "LedgerEntry",
                        },
                        {
                          type: "data-grid",
                          entity: "LedgerEntry",
                          selectable: true,
                          infiniteScroll: true,
                          loadMoreEvent: "LOAD_MORE",
                          hasMore: true,
                          columns: [
                            {
                              name: "date",
                              label: "Date",
                              format: "date",
                            },
                            {
                              name: "description",
                              label: "Description",
                            },
                            {
                              name: "debit",
                              label: "Debit",
                              format: "currency",
                            },
                            {
                              name: "credit",
                              label: "Credit",
                              format: "currency",
                            },
                            {
                              name: "balance",
                              label: "Balance",
                              format: "currency",
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
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
                to: "creating",
                event: "NEW_ENTRY",
                effects: [
                  ["fetch", "LedgerEntry"],
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
                              name: "plus-circle",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "New Ledger Entry",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "LedgerEntry",
                          submitEvent: "SAVE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "date",
                              type: "string",
                            },
                            {
                              name: "description",
                              type: "string",
                            },
                            {
                              name: "debit",
                              type: "number",
                            },
                            {
                              name: "credit",
                              type: "number",
                            },
                            {
                              name: "balance",
                              type: "number",
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
                to: "browsing",
                event: "SAVE",
                effects: [
                  ["set", "@entity.description", "@payload.description"],
                  ["set", "@entity.debit", "@payload.debit"],
                  ["set", "@entity.credit", "@payload.credit"],
                  ["render-ui", "modal", null],
                  ["fetch", "LedgerEntry"],
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
                              type: "typography",
                              variant: "h2",
                              content: "Ledger",
                            },
                            {
                              type: "button",
                              label: "New Entry",
                              icon: "plus",
                              variant: "primary",
                              event: "NEW_ENTRY",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Debits",
                              icon: "trending-down",
                              entity: "LedgerEntry",
                            },
                            {
                              type: "stat-display",
                              label: "Total Credits",
                              icon: "trending-up",
                              entity: "LedgerEntry",
                            },
                            {
                              type: "stat-display",
                              label: "Balance",
                              icon: "wallet",
                              entity: "LedgerEntry",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search entries...",
                          entity: "LedgerEntry",
                        },
                        {
                          type: "data-grid",
                          entity: "LedgerEntry",
                          selectable: true,
                          infiniteScroll: true,
                          loadMoreEvent: "LOAD_MORE",
                          hasMore: true,
                          columns: [
                            {
                              name: "date",
                              label: "Date",
                              format: "date",
                            },
                            {
                              name: "description",
                              label: "Description",
                            },
                            {
                              name: "debit",
                              label: "Debit",
                              format: "currency",
                            },
                            {
                              name: "credit",
                              label: "Credit",
                              format: "currency",
                            },
                            {
                              name: "balance",
                              label: "Balance",
                              format: "currency",
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
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
                from: "creating",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "VIEW",
                effects: [
                  ["fetch", "LedgerEntry"],
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
                              name: "landmark",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Entry Detail",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "meter",
                          value: "@entity.balance",
                          label: "Current Balance",
                          icon: "wallet",
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
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "calendar",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Date",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.date",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "trending-down",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Debit",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.debit",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "trending-up",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Credit",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.credit",
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
                          justify: "flex-end",
                          children: [
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "secondary",
                              event: "CLOSE",
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
                to: "browsing",
                event: "LOAD_MORE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "LedgerPage",
          path: "/ledger",
          isInitial: true,
          traits: [
            {
              ref: "LedgerControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-transaction - Transaction Tracking
// ============================================================================

/**
 * std-transaction - Transaction log with categorization.
 * States: browsing -> viewing -> creating
 *
 * UI: Emerald finance theme. Header with receipt icon + search + new button.
 * Stats row + line chart. Data-list with amount, type badge, category,
 * date, status badge. Modal detail with transaction info in stacks.
 */
export const TRANSACTION_BEHAVIOR: BehaviorSchema = {
  name: "std-transaction",
  version: "1.0.0",
  description: "Transaction tracking with categories and status",
  orbitals: [
    {
      name: "TransactionOrbital",
      theme: {
        name: "finance-emerald",
        tokens: {
          colors: {
            primary: "#059669",
            "primary-hover": "#047857",
            "primary-foreground": "#ffffff",
            accent: "#10b981",
            "accent-foreground": "#ffffff",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "Transaction",
        persistence: "persistent",
        collection: "transactions",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "amount",
            type: "number",
            default: 0,
          },
          {
            name: "type",
            type: "string",
            default: "expense",
          },
          {
            name: "category",
            type: "string",
            default: "",
          },
          {
            name: "date",
            type: "string",
            default: "",
          },
          {
            name: "status",
            type: "string",
            default: "pending",
          },
          {
            name: "description",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "TransactionControl",
          linkedEntity: "Transaction",
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
                name: "creating",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "VIEW",
                name: "View Transaction",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CREATE",
                name: "New Transaction",
              },
              {
                key: "SAVE",
                name: "Save Transaction",
                payloadSchema: [
                  {
                    name: "amount",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "category",
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
                key: "LOAD_MORE",
                name: "Load More",
              },
              {
                key: "CATEGORIZE",
                name: "Categorize",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "Transaction"],
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
                              content: "Transactions",
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "button",
                                  label: "Filter",
                                  icon: "filter",
                                  variant: "secondary",
                                },
                                {
                                  type: "button",
                                  label: "Date Range",
                                  icon: "calendar",
                                  variant: "secondary",
                                },
                                {
                                  type: "button",
                                  label: "New",
                                  icon: "plus",
                                  variant: "primary",
                                  event: "CREATE",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Income",
                              icon: "trending-up",
                              iconColor: "text-green-600",
                              iconBg: "bg-green-100",
                              entity: "Transaction",
                            },
                            {
                              type: "stat-display",
                              label: "Total Expenses",
                              icon: "trending-down",
                              iconColor: "text-red-600",
                              iconBg: "bg-red-100",
                              entity: "Transaction",
                            },
                            {
                              type: "stat-display",
                              label: "Net Change",
                              icon: "bar-chart-2",
                              entity: "Transaction",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search transactions...",
                          entity: "Transaction",
                        },
                        {
                          type: "data-list",
                          entity: "Transaction",
                          variant: "card",
                          groupBy: "date",
                          infiniteScroll: true,
                          loadMoreEvent: "LOAD_MORE",
                          hasMore: true,
                          swipeLeftEvent: "CATEGORIZE",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
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
                                      name: "receipt",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.description",
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
                                      content: "@entity.amount",
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
                  ],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "VIEW",
                effects: [
                  ["fetch", "Transaction"],
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
                              name: "receipt",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Transaction Detail",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "h4",
                          content: "@entity.description",
                        },
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
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h4",
                                  content: "@entity.amount",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.type",
                              icon: "tag",
                            },
                          ],
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
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "calendar",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Date",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.date",
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
                                  type: "icon",
                                  name: "circle-dot",
                                  size: "sm",
                                },
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
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "flex-end",
                          children: [
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "secondary",
                              event: "CLOSE",
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
                to: "creating",
                event: "CREATE",
                effects: [
                  ["fetch", "Transaction"],
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
                              name: "plus-circle",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "New Transaction",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "Transaction",
                          submitEvent: "SAVE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "description",
                              type: "string",
                            },
                            {
                              name: "amount",
                              type: "number",
                            },
                            {
                              name: "type",
                              type: "string",
                            },
                            {
                              name: "category",
                              type: "string",
                            },
                            {
                              name: "date",
                              type: "string",
                            },
                            {
                              name: "status",
                              type: "string",
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
                to: "browsing",
                event: "SAVE",
                effects: [
                  ["set", "@entity.amount", "@payload.amount"],
                  ["set", "@entity.category", "@payload.category"],
                  ["render-ui", "modal", null],
                  ["fetch", "Transaction"],
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
                              content: "Transactions",
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "button",
                                  label: "Filter",
                                  icon: "filter",
                                  variant: "secondary",
                                },
                                {
                                  type: "button",
                                  label: "Date Range",
                                  icon: "calendar",
                                  variant: "secondary",
                                },
                                {
                                  type: "button",
                                  label: "New",
                                  icon: "plus",
                                  variant: "primary",
                                  event: "CREATE",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Income",
                              icon: "trending-up",
                              iconColor: "text-green-600",
                              iconBg: "bg-green-100",
                              entity: "Transaction",
                            },
                            {
                              type: "stat-display",
                              label: "Total Expenses",
                              icon: "trending-down",
                              iconColor: "text-red-600",
                              iconBg: "bg-red-100",
                              entity: "Transaction",
                            },
                            {
                              type: "stat-display",
                              label: "Net Change",
                              icon: "bar-chart-2",
                              entity: "Transaction",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search transactions...",
                          entity: "Transaction",
                        },
                        {
                          type: "data-list",
                          entity: "Transaction",
                          variant: "card",
                          groupBy: "date",
                          infiniteScroll: true,
                          loadMoreEvent: "LOAD_MORE",
                          hasMore: true,
                          swipeLeftEvent: "CATEGORIZE",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
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
                                      name: "receipt",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.description",
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
                                      content: "@entity.amount",
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
                  ],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "LOAD_MORE",
                effects: [],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "CATEGORIZE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "TransactionsPage",
          path: "/transactions",
          isInitial: true,
          traits: [
            {
              ref: "TransactionControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-portfolio - Portfolio View
// ============================================================================

/**
 * std-portfolio - Investment portfolio with holdings.
 * States: browsing -> viewing -> trading
 *
 * UI: Emerald finance theme. Header with trending-up icon.
 * Stats: total holdings + total value. Line chart for performance.
 * Data-grid (3 cols) with symbol, shares, purchasePrice, currentPrice.
 * Modal: holding detail with trade button, gain/loss display.
 */
export const PORTFOLIO_BEHAVIOR: BehaviorSchema = {
  name: "std-portfolio",
  version: "1.0.0",
  description: "Investment portfolio tracking with holdings",
  orbitals: [
    {
      name: "PortfolioOrbital",
      theme: {
        name: "finance-emerald",
        tokens: {
          colors: {
            primary: "#059669",
            "primary-hover": "#047857",
            "primary-foreground": "#ffffff",
            accent: "#10b981",
            "accent-foreground": "#ffffff",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "Holding",
        persistence: "persistent",
        collection: "holdings",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "symbol",
            type: "string",
            default: "",
          },
          {
            name: "shares",
            type: "number",
            default: 0,
          },
          {
            name: "purchasePrice",
            type: "number",
            default: 0,
          },
          {
            name: "currentPrice",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "PortfolioControl",
          linkedEntity: "Holding",
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
                name: "trading",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "VIEW",
                name: "View Holding",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "TRADE",
                name: "Start Trade",
              },
              {
                key: "EXECUTE",
                name: "Execute Trade",
                payloadSchema: [
                  {
                    name: "shares",
                    type: "number",
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
                  ["fetch", "Holding"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "typography",
                          variant: "h2",
                          content: "Portfolio",
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
                              label: "Total Value",
                              icon: "dollar-sign",
                              entity: "Holding",
                              value: "@entity.currentPrice",
                            },
                            {
                              type: "stat-display",
                              label: "Day Change",
                              icon: "trending-up",
                              entity: "Holding",
                              trendDirection: "up",
                            },
                            {
                              type: "stat-display",
                              label: "Total Gain/Loss",
                              icon: "trending-up",
                              entity: "Holding",
                              trendDirection: "up",
                            },
                          ],
                        },
                        {
                          type: "card",
                          title: "Performance",
                          children: [
                            {
                              type: "line-chart",
                              data: [],
                              showGrid: true,
                              showArea: true,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "h4",
                          content: "Holdings",
                        },
                        {
                          type: "data-grid",
                          entity: "Holding",
                          selectable: true,
                          columns: [
                            {
                              name: "symbol",
                              label: "Name",
                            },
                            {
                              name: "shares",
                              label: "Shares",
                              format: "number",
                            },
                            {
                              name: "purchasePrice",
                              label: "Avg Cost",
                              format: "currency",
                            },
                            {
                              name: "currentPrice",
                              label: "Current Price",
                              format: "currency",
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
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
                event: "VIEW",
                effects: [
                  ["fetch", "Holding"],
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
                              name: "coins",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Holding Detail",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "typography",
                              variant: "h4",
                              content: "@entity.symbol",
                            },
                            {
                              type: "badge",
                              label: "@entity.shares",
                              icon: "layers",
                            },
                          ],
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
                              children: [
                                {
                                  type: "icon",
                                  name: "credit-card",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Purchase Price",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.purchasePrice",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "dollar-sign",
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Current Price",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.currentPrice",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.currentPrice",
                          label: "Gain / Loss",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "flex-end",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Trade",
                              icon: "arrow-right-left",
                              variant: "primary",
                              action: "TRADE",
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "secondary",
                              action: "CLOSE",
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
                to: "trading",
                event: "TRADE",
                effects: [
                  ["fetch", "Holding"],
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
                              name: "arrow-right-left",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Execute Trade",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "Holding",
                          submitEvent: "EXECUTE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "symbol",
                              type: "string",
                            },
                            {
                              name: "shares",
                              type: "number",
                            },
                            {
                              name: "purchasePrice",
                              type: "number",
                            },
                            {
                              name: "currentPrice",
                              type: "number",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "trading",
                to: "browsing",
                event: "EXECUTE",
                effects: [
                  ["set", "@entity.shares", "@payload.shares"],
                  ["render-ui", "modal", null],
                  ["fetch", "Holding"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "typography",
                          variant: "h2",
                          content: "Portfolio",
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
                              label: "Total Value",
                              icon: "dollar-sign",
                              entity: "Holding",
                              value: "@entity.currentPrice",
                            },
                            {
                              type: "stat-display",
                              label: "Day Change",
                              icon: "trending-up",
                              entity: "Holding",
                              trendDirection: "up",
                            },
                            {
                              type: "stat-display",
                              label: "Total Gain/Loss",
                              icon: "trending-up",
                              entity: "Holding",
                              trendDirection: "up",
                            },
                          ],
                        },
                        {
                          type: "card",
                          title: "Performance",
                          children: [
                            {
                              type: "line-chart",
                              data: [],
                              showGrid: true,
                              showArea: true,
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "h4",
                          content: "Holdings",
                        },
                        {
                          type: "data-grid",
                          entity: "Holding",
                          selectable: true,
                          columns: [
                            {
                              name: "symbol",
                              label: "Name",
                            },
                            {
                              name: "shares",
                              label: "Shares",
                              format: "number",
                            },
                            {
                              name: "purchasePrice",
                              label: "Avg Cost",
                              format: "currency",
                            },
                            {
                              name: "currentPrice",
                              label: "Current Price",
                              format: "currency",
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
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
                from: "trading",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "trading",
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
          name: "PortfolioPage",
          path: "/portfolio",
          isInitial: true,
          traits: [
            {
              ref: "PortfolioControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Finance Behaviors
// ============================================================================

export const FINANCE_BEHAVIORS: BehaviorSchema[] = [
  LEDGER_BEHAVIOR,
  TRANSACTION_BEHAVIOR,
  PORTFOLIO_BEHAVIOR,
];
