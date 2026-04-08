/**
 * std-trading-dashboard
 *
 * Trading dashboard organism.
 * Composes: stdDisplay(Portfolio) + stdList(TradeOrder) + stdAsync(MarketFeed)
 *
 * Pages: /portfolio (initial), /orders, /market
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
import { stdDisplay } from '../atoms/std-display.js';
import { stdList } from '../molecules/std-list.js';
import { stdAsync } from '../atoms/std-async.js';
import { tradingOrderView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdTradingDashboardParams {
  portfolioFields?: EntityField[];
  tradeOrderFields?: EntityField[];
  marketFeedFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultPortfolioFields: EntityField[] = [
  { name: 'totalValue', type: 'number', default: 0 },
  { name: 'dailyChange', type: 'number', default: 0 },
  { name: 'positions', type: 'number', default: 0 },
  { name: 'cashBalance', type: 'number', default: 0 },
];

const defaultTradeOrderFields: EntityField[] = [
  { name: 'symbol', type: 'string', required: true },
  { name: 'side', type: 'string', required: true, values: ['buy', 'sell'] },
  { name: 'quantity', type: 'number', required: true },
  { name: 'price', type: 'number' },
];

const defaultMarketFeedFields: EntityField[] = [
  { name: 'symbol', type: 'string', required: true },
  { name: 'price', type: 'number', required: true },
  { name: 'change', type: 'number' },
  { name: 'volume', type: 'number' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdTradingDashboard(params: StdTradingDashboardParams): OrbitalSchema {
  const portfolioFields = params.portfolioFields ?? defaultPortfolioFields;
  const tradeOrderFields = params.tradeOrderFields ?? defaultTradeOrderFields;
  const marketFeedFields = params.marketFeedFields ?? defaultMarketFeedFields;

  const portfolioOrbital = stdDisplay({
    entityName: 'Portfolio',
    fields: portfolioFields,
    headerIcon: 'trending-up',
    pageTitle: 'Portfolio',
  });

  const orderOrbital = stdList({
    entityName: 'TradeOrder',
    fields: tradeOrderFields,
    headerIcon: 'shopping-cart',
    pageTitle: 'Trade Orders',
    emptyTitle: 'No orders yet',
    emptyDescription: 'Place your first trade.',
    ...tradingOrderView(),
  });

  const marketOrbital = stdAsync({
    entityName: 'MarketFeed',
    fields: marketFeedFields,
    headerIcon: 'activity',
    loadingMessage: 'Connecting to market feed...',
    successMessage: 'Market feed connected.',
    errorMessage: 'Market feed disconnected.',
  });

  const pages: ComposePage[] = [
    { name: 'PortfolioPage', path: '/portfolio', traits: ['PortfolioDisplay'], isInitial: true },
    { name: 'OrdersPage', path: '/orders', traits: ['TradeOrderBrowse', 'TradeOrderCreate', 'TradeOrderEdit', 'TradeOrderView', 'TradeOrderDelete'] },
    { name: 'MarketPage', path: '/market', traits: ['MarketFeedAsync'] },
  ];

  const connections: ComposeConnection[] = [];

  const appName = 'Trading Dashboard';


  const schema = compose([portfolioOrbital, orderOrbital, marketOrbital], pages, connections, appName);


  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
