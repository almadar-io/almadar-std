/**
 * std-finance-tracker
 *
 * Finance tracker organism.
 * Composes: stdList(Transaction) + stdDisplay(FinanceSummary) + stdDetail(FinanceReport)
 *
 * Pages: /transactions (initial), /summary, /reports
 *
 * @level organism
 * @family finance
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdList } from './std-list.js';
import { stdDisplay } from './std-display.js';
import { stdDetail } from './std-detail.js';

// ============================================================================
// Params
// ============================================================================

export interface StdFinanceTrackerParams {
  transactionFields?: EntityField[];
  financeSummaryFields?: EntityField[];
  financeReportFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultTransactionFields: EntityField[] = [
  { name: 'description', type: 'string', required: true },
  { name: 'amount', type: 'number', required: true },
  { name: 'category', type: 'string' },
  { name: 'date', type: 'string' },
];

const defaultFinanceSummaryFields: EntityField[] = [
  { name: 'totalIncome', type: 'number', default: 0 },
  { name: 'totalExpenses', type: 'number', default: 0 },
  { name: 'balance', type: 'number', default: 0 },
  { name: 'savingsRate', type: 'number', default: 0 },
];

const defaultFinanceReportFields: EntityField[] = [
  { name: 'title', type: 'string', required: true },
  { name: 'period', type: 'string', required: true },
  { name: 'total', type: 'number' },
  { name: 'generatedAt', type: 'string' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdFinanceTracker(params: StdFinanceTrackerParams): OrbitalSchema {
  const transactionFields = params.transactionFields ?? defaultTransactionFields;
  const financeSummaryFields = params.financeSummaryFields ?? defaultFinanceSummaryFields;
  const financeReportFields = params.financeReportFields ?? defaultFinanceReportFields;

  const transactionOrbital = stdList({
    entityName: 'Transaction',
    fields: transactionFields,
    headerIcon: 'credit-card',
    pageTitle: 'Transactions',
  });

  const summaryOrbital = stdDisplay({
    entityName: 'FinanceSummary',
    fields: financeSummaryFields,
    headerIcon: 'pie-chart',
    pageTitle: 'Financial Summary',
  });

  const reportOrbital = stdDetail({
    entityName: 'FinanceReport',
    fields: financeReportFields,
    headerIcon: 'file-text',
    pageTitle: 'Reports',
  });

  const pages: ComposePage[] = [
    { name: 'TransactionsPage', path: '/transactions', traits: ['TransactionBrowse', 'TransactionCreate', 'TransactionEdit', 'TransactionView', 'TransactionDelete'], isInitial: true },
    { name: 'SummaryPage', path: '/summary', traits: ['FinanceSummaryDisplay'] },
    { name: 'ReportsPage', path: '/reports', traits: ['FinanceReportBrowse', 'FinanceReportCreate', 'FinanceReportView'] },
  ];

  const connections: ComposeConnection[] = [];

  return compose(
    [transactionOrbital, summaryOrbital, reportOrbital],
    pages,
    connections,
    'Finance Tracker',
  );
}
