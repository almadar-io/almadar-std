/**
 * std-helpdesk
 *
 * Helpdesk organism. Composes molecules via compose:
 * - stdList(Ticket): CRUD list of support tickets
 * - stdMessaging(Response): messaging thread for ticket responses
 * - stdDisplay(SupportMetrics): read-only metrics dashboard
 *
 * Pages: /tickets (initial), /responses, /metrics
 * Connections: ASSIGN (tickets->responses), RESOLVE (responses->metrics)
 *
 * @level organism
 * @family support
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import type { ComposeConnection, ComposePage } from '@almadar/core/builders';
import { stdList } from './std-list.js';
import { stdMessaging } from './std-messaging.js';
import { stdDisplay } from './std-display.js';

// ============================================================================
// Params
// ============================================================================

export interface StdHelpdeskParams {
  appName?: string;
  ticketFields?: Array<{ name: string; type: string; default?: unknown }>;
  responseFields?: Array<{ name: string; type: string; default?: unknown }>;
  metricsFields?: Array<{ name: string; type: string; default?: unknown }>;
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_TICKET_FIELDS = [
  { name: 'subject', type: 'string', default: '' },
  { name: 'description', type: 'string', default: '' },
  { name: 'priority', type: 'string', default: 'medium' },
  { name: 'status', type: 'string', default: 'open' },
  { name: 'assignee', type: 'string', default: '' },
];

const DEFAULT_RESPONSE_FIELDS = [
  { name: 'ticketId', type: 'string', default: '' },
  { name: 'body', type: 'string', default: '' },
  { name: 'author', type: 'string', default: '' },
  { name: 'createdAt', type: 'string', default: '' },
];

const DEFAULT_METRICS_FIELDS = [
  { name: 'openTickets', type: 'number', default: 0 },
  { name: 'resolvedTickets', type: 'number', default: 0 },
  { name: 'avgResponseTime', type: 'string', default: '0h' },
  { name: 'satisfactionScore', type: 'number', default: 0 },
  { name: 'activeAgents', type: 'number', default: 0 },
];

// ============================================================================
// Composed Application
// ============================================================================

export function stdHelpdesk(params: StdHelpdeskParams): OrbitalSchema {
  const appName = params.appName ?? 'Helpdesk';

  const ticketOrbital = stdList({
    entityName: 'Ticket',
    fields: params.ticketFields ?? DEFAULT_TICKET_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Tickets',
    headerIcon: 'inbox',
    createButtonLabel: 'New Ticket',
    createFormTitle: 'Create Ticket',
    pageName: 'TicketsPage',
    pagePath: '/tickets',
    isInitial: true,
  });

  const responseOrbital = stdMessaging({
    entityName: 'Response',
    fields: params.responseFields ?? DEFAULT_RESPONSE_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Responses',
    headerIcon: 'message-circle',
    composerTitle: 'New Response',
    pageName: 'ResponsesPage',
    pagePath: '/responses',
  });

  const metricsOrbital = stdDisplay({
    entityName: 'SupportMetrics',
    fields: params.metricsFields ?? DEFAULT_METRICS_FIELDS,
    persistence: 'runtime',
    pageTitle: 'Support Metrics',
    headerIcon: 'activity',
    columns: 3,
    pageName: 'MetricsPage',
    pagePath: '/metrics',
  });

  const pages: ComposePage[] = [
    { name: 'TicketsPage', path: '/tickets', traits: ['TicketBrowse', 'TicketCreate', 'TicketEdit', 'TicketView', 'TicketDelete'], isInitial: true },
    { name: 'ResponsesPage', path: '/responses', traits: ['ResponseBrowse', 'ResponseCompose', 'ResponseView'] },
    { name: 'MetricsPage', path: '/metrics', traits: ['SupportMetricsDisplay'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'TicketBrowse',
      to: 'ResponseBrowse',
      event: { event: 'ASSIGN', description: 'Assign ticket and open response thread' },
    },
    {
      from: 'ResponseBrowse',
      to: 'SupportMetricsDisplay',
      event: { event: 'RESOLVE', description: 'Resolve ticket and update metrics' },
    },
  ];

  return compose([ticketOrbital, responseOrbital, metricsOrbital], pages, connections, appName);
}
