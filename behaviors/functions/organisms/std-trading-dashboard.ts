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
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdDisplay } from '../atoms/std-display.js';
import { stdList } from '../molecules/std-list.js';
import { stdAsync } from '../atoms/std-async.js';
import { tradingOrderView } from '../views/domain-views.js';

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

  return compose(
    [portfolioOrbital, orderOrbital, marketOrbital],
    pages,
    connections,
    'Trading Dashboard',
  );
}
