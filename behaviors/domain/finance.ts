/**
 * Finance Domain Behaviors
 *
 * Standard behaviors for ledger entries, transaction tracking,
 * and portfolio management.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-ledger - Ledger Entries
// ============================================================================

/**
 * std-ledger - Financial ledger with debit/credit entries.
 * States: browsing -> creating -> viewing
 */
export const LEDGER_BEHAVIOR: OrbitalSchema = {
  name: 'std-ledger',
  version: '1.0.0',
  description: 'Financial ledger with debit and credit entries',
  orbitals: [
    {
      name: 'LedgerOrbital',
      entity: {
        name: 'LedgerEntry',
        persistence: 'persistent',
        collection: 'ledger_entries',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'date', type: 'string', default: '' },
          { name: 'description', type: 'string', default: '' },
          { name: 'debit', type: 'number', default: 0 },
          { name: 'credit', type: 'number', default: 0 },
          { name: 'balance', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'LedgerControl',
          linkedEntity: 'LedgerEntry',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'creating' },
              { name: 'viewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'NEW_ENTRY', name: 'New Entry' },
              { key: 'SAVE', name: 'Save Entry', payloadSchema: [{ name: 'description', type: 'string', required: true }, { name: 'debit', type: 'number', required: true }, { name: 'credit', type: 'number', required: true }] },
              { key: 'VIEW', name: 'View Entry', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'LedgerEntry'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Ledger' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'LedgerEntry',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'creating',
                event: 'NEW_ENTRY',
                effects: [
                  ['fetch', 'LedgerEntry'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'LedgerEntry',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['set', '@entity.description', '@payload.description'],
                  ['set', '@entity.debit', '@payload.debit'],
                  ['set', '@entity.credit', '@payload.credit'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'LedgerEntry'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'LedgerEntry',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'LedgerEntry'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'LedgerEntry',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'LedgerPage',
          path: '/ledger',
          isInitial: true,
          traits: [{ ref: 'LedgerControl' }],
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
 */
export const TRANSACTION_BEHAVIOR: OrbitalSchema = {
  name: 'std-transaction',
  version: '1.0.0',
  description: 'Transaction tracking with categories and status',
  orbitals: [
    {
      name: 'TransactionOrbital',
      entity: {
        name: 'Transaction',
        persistence: 'persistent',
        collection: 'transactions',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'amount', type: 'number', default: 0 },
          { name: 'type', type: 'string', default: 'expense' },
          { name: 'category', type: 'string', default: '' },
          { name: 'date', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'pending' },
        ],
      },
      traits: [
        {
          name: 'TransactionControl',
          linkedEntity: 'Transaction',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'creating' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW', name: 'View Transaction', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'CREATE', name: 'New Transaction' },
              { key: 'SAVE', name: 'Save Transaction', payloadSchema: [{ name: 'amount', type: 'number', required: true }, { name: 'category', type: 'string', required: true }] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Transaction'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Transactions', 
                    actions: [{ label: 'Create', event: 'CREATE' }],
                  }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Transaction',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'Transaction'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'Transaction',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'browsing',
                to: 'creating',
                event: 'CREATE',
                effects: [
                  ['fetch', 'Transaction'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'Transaction',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['set', '@entity.amount', '@payload.amount'],
                  ['set', '@entity.category', '@payload.category'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'Transaction'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Transaction',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'TransactionsPage',
          path: '/transactions',
          isInitial: true,
          traits: [{ ref: 'TransactionControl' }],
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
 */
export const PORTFOLIO_BEHAVIOR: OrbitalSchema = {
  name: 'std-portfolio',
  version: '1.0.0',
  description: 'Investment portfolio tracking with holdings',
  orbitals: [
    {
      name: 'PortfolioOrbital',
      entity: {
        name: 'Holding',
        persistence: 'persistent',
        collection: 'holdings',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'symbol', type: 'string', default: '' },
          { name: 'shares', type: 'number', default: 0 },
          { name: 'purchasePrice', type: 'number', default: 0 },
          { name: 'currentPrice', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'PortfolioControl',
          linkedEntity: 'Holding',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'trading' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW', name: 'View Holding', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'TRADE', name: 'Start Trade' },
              { key: 'EXECUTE', name: 'Execute Trade', payloadSchema: [{ name: 'shares', type: 'number', required: true }] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Holding'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Portfolio' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Holding',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                  ['render-ui', 'main', { type: 'stats', entity: 'Holding' }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'Holding'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'Holding',
                    actions: [
                      { label: 'Trade', event: 'TRADE' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'trading',
                event: 'TRADE',
                effects: [
                  ['fetch', 'Holding'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'Holding',
                    submitEvent: 'EXECUTE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'trading',
                to: 'browsing',
                event: 'EXECUTE',
                effects: [
                  ['set', '@entity.shares', '@payload.shares'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'Holding'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Holding',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'trading',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'trading',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'PortfolioPage',
          path: '/portfolio',
          isInitial: true,
          traits: [{ ref: 'PortfolioControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Finance Behaviors
// ============================================================================

export const FINANCE_BEHAVIORS: OrbitalSchema[] = [
  LEDGER_BEHAVIOR,
  TRANSACTION_BEHAVIOR,
  PORTFOLIO_BEHAVIOR,
];
