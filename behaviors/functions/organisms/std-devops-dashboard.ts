/**
 * std-devops-dashboard
 *
 * DevOps monitoring organism.
 * Composes: stdCircuitBreaker(ServiceNode) + stdDisplay(AlertMetric)
 *         + stdList(LogEntry) + stdDisplay(SystemMetric)
 *
 * Pages: /services (initial), /alerts, /logs, /metrics
 *
 * @level organism
 * @family devops
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdCircuitBreaker } from '../atoms/std-circuit-breaker.js';
import { stdDisplay } from '../atoms/std-display.js';
import { stdList } from '../molecules/std-list.js';
import { devopsLogView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdDevopsDashboardParams {
  serviceNodeFields?: EntityField[];
  alertMetricFields?: EntityField[];
  logEntryFields?: EntityField[];
  systemMetricFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultServiceNodeFields: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'status', type: 'string', required: true, values: ['healthy', 'degraded', 'down'] },
  { name: 'url', type: 'string' },
  { name: 'lastChecked', type: 'date' },
];

const defaultAlertMetricFields: EntityField[] = [
  { name: 'severity', type: 'string', required: true },
  { name: 'message', type: 'string', required: true },
  { name: 'timestamp', type: 'string' },
  { name: 'source', type: 'string' },
];

const defaultLogEntryFields: EntityField[] = [
  { name: 'level', type: 'string', required: true, values: ['debug', 'info', 'warn', 'error', 'fatal'] },
  { name: 'message', type: 'string', required: true },
  { name: 'timestamp', type: 'date' },
  { name: 'service', type: 'string' },
];

const defaultSystemMetricFields: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'value', type: 'number', required: true },
  { name: 'unit', type: 'string' },
  { name: 'trend', type: 'string' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdDevopsDashboard(params: StdDevopsDashboardParams): OrbitalSchema {
  const serviceNodeFields = params.serviceNodeFields ?? defaultServiceNodeFields;
  const alertMetricFields = params.alertMetricFields ?? defaultAlertMetricFields;
  const logEntryFields = params.logEntryFields ?? defaultLogEntryFields;
  const systemMetricFields = params.systemMetricFields ?? defaultSystemMetricFields;

  const serviceNodeOrbital = stdCircuitBreaker({
    entityName: 'ServiceNode',
    fields: serviceNodeFields,
    headerIcon: 'server',
  });

  const alertMetricOrbital = stdDisplay({
    entityName: 'AlertMetric',
    fields: alertMetricFields,
    headerIcon: 'alert-triangle',
    pageTitle: 'Alerts',
  });

  const logEntryOrbital = stdList({
    entityName: 'LogEntry',
    fields: logEntryFields,
    headerIcon: 'file-text',
    pageTitle: 'Logs',
    emptyTitle: 'No log entries',
    emptyDescription: 'Logs will appear here when services report activity.',
    ...devopsLogView(),
  });

  const systemMetricOrbital = stdDisplay({
    entityName: 'SystemMetric',
    fields: systemMetricFields,
    headerIcon: 'activity',
    pageTitle: 'Metrics',
  });

  const pages: ComposePage[] = [
    { name: 'ServicesPage', path: '/services', traits: ['ServiceNodeCircuitBreaker'], isInitial: true },
    { name: 'AlertsPage', path: '/alerts', traits: ['AlertMetricDisplay'] },
    { name: 'LogsPage', path: '/logs', traits: ['LogEntryBrowse', 'LogEntryCreate', 'LogEntryEdit', 'LogEntryView', 'LogEntryDelete'] },
    { name: 'MetricsPage', path: '/metrics', traits: ['SystemMetricDisplay'] },
  ];

  const connections: ComposeConnection[] = [];

  const appName = 'DevOps Dashboard';


  const schema = compose([serviceNodeOrbital, alertMetricOrbital, logEntryOrbital, systemMetricOrbital], pages, connections, appName);


  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
