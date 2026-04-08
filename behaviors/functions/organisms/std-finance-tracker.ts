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

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdDisplay } from '../atoms/std-display.js';
import { stdDetail } from '../molecules/std-detail.js';
import { financeTransactionView, financeReportView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

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
  { name: 'date', type: 'date' },
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
  { name: 'generatedAt', type: 'date' },
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
    emptyTitle: 'No transactions yet',
    emptyDescription: 'Record your first transaction.',
    ...financeTransactionView(),
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
    emptyTitle: 'No reports yet',
    emptyDescription: 'Generate a report to analyze your finances.',
    ...financeReportView(),
  });

  const pages: ComposePage[] = [
    { name: 'TransactionsPage', path: '/transactions', traits: ['TransactionBrowse', 'TransactionCreate', 'TransactionEdit', 'TransactionView', 'TransactionDelete'], isInitial: true },
    { name: 'SummaryPage', path: '/summary', traits: ['FinanceSummaryDisplay'] },
    { name: 'ReportsPage', path: '/reports', traits: ['FinanceReportBrowse', 'FinanceReportCreate', 'FinanceReportView'] },
  ];

  const connections: ComposeConnection[] = [];

  const appName = 'Finance Tracker';


  const schema = compose([transactionOrbital, summaryOrbital, reportOrbital], pages, connections, appName);


  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
