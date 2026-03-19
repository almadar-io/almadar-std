/**
 * std-api-gateway
 *
 * API gateway management organism.
 * Composes: stdList(Route) + stdCircuitBreaker(Backend) + stdDisplay(Analytics)
 *
 * Pages: /routes (initial), /backends, /analytics
 *
 * @level organism
 * @family devops
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdCircuitBreaker } from '../atoms/std-circuit-breaker.js';
import { stdDisplay } from '../atoms/std-display.js';
import { apiRouteView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdApiGatewayParams {
  routeFields?: EntityField[];
  backendFields?: EntityField[];
  analyticsFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultRouteFields: EntityField[] = [
  { name: 'path', type: 'string', required: true },
  { name: 'method', type: 'string', required: true, values: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
  { name: 'backend', type: 'string', required: true },
  { name: 'rateLimit', type: 'number' },
];

const defaultBackendFields: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'url', type: 'string', required: true },
  { name: 'status', type: 'string' },
  { name: 'latency', type: 'number' },
];

const defaultAnalyticsFields: EntityField[] = [
  { name: 'totalRequests', type: 'number', required: true },
  { name: 'errorRate', type: 'number', required: true },
  { name: 'avgLatency', type: 'number' },
  { name: 'uptime', type: 'string' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdApiGateway(params: StdApiGatewayParams): OrbitalSchema {
  const routeFields = params.routeFields ?? defaultRouteFields;
  const backendFields = params.backendFields ?? defaultBackendFields;
  const analyticsFields = params.analyticsFields ?? defaultAnalyticsFields;

  const routeOrbital = stdList({
    entityName: 'Route',
    fields: routeFields,
    headerIcon: 'git-branch',
    pageTitle: 'Routes',
    emptyTitle: 'No routes configured',
    emptyDescription: 'Add API routes to your gateway.',
    ...apiRouteView(),
  });

  const backendOrbital = stdCircuitBreaker({
    entityName: 'Backend',
    fields: backendFields,
    headerIcon: 'server',
  });

  const analyticsOrbital = stdDisplay({
    entityName: 'Analytics',
    fields: analyticsFields,
    headerIcon: 'bar-chart-2',
    pageTitle: 'Analytics',
  });

  const pages: ComposePage[] = [
    { name: 'RoutesPage', path: '/routes', traits: ['RouteBrowse', 'RouteCreate', 'RouteEdit', 'RouteView', 'RouteDelete'], isInitial: true },
    { name: 'BackendsPage', path: '/backends', traits: ['BackendCircuitBreaker'] },
    { name: 'AnalyticsPage', path: '/analytics', traits: ['AnalyticsDisplay'] },
  ];

  const connections: ComposeConnection[] = [];

  const appName = 'API Gateway';


  const schema = compose([routeOrbital, backendOrbital, analyticsOrbital], pages, connections, appName);


  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
