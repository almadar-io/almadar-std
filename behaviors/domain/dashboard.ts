/**
 * Dashboard Domain Behaviors
 *
 * Standard behaviors for dashboard components: statistics panels, chart views,
 * KPI trackers, and report generators.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-stats-panel - Statistics Display
// ============================================================================

/**
 * std-stats-panel - Statistics display with loading and refresh.
 * Entity: StatMetric with name, value, change, trend.
 * States: loading -> displaying -> refreshing.
 */
export const STATS_PANEL_BEHAVIOR: OrbitalSchema = {
  name: 'std-stats-panel',
  version: '1.0.0',
  description: 'Statistics panel with loading, display, and refresh',
  orbitals: [
    {
      name: 'StatsPanelOrbital',
      entity: {
        name: 'StatMetric',
        persistence: 'persistent',
        collection: 'stat_metrics',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'value', type: 'number', default: 0 },
          { name: 'change', type: 'number', default: 0 },
          { name: 'trend', type: 'string', default: 'stable' },
        ],
      },
      traits: [
        {
          name: 'StatsPanelControl',
          linkedEntity: 'StatMetric',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'loading', isInitial: true },
              { name: 'displaying' },
              { name: 'refreshing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'LOADED', name: 'Data Loaded' },
              { key: 'REFRESH', name: 'Refresh' },
              { key: 'REFRESHED', name: 'Refresh Complete' },
            ],
            transitions: [
              {
                from: 'loading',
                to: 'loading',
                event: 'INIT',
                effects: [
                  ['fetch', 'StatMetric'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Statistics' }],
                  ['render-ui', 'main', { type: 'stats', entity: 'StatMetric' }],
                ],
              },
              {
                from: 'loading',
                to: 'displaying',
                event: 'LOADED',
                effects: [
                  ['fetch', 'StatMetric'],
                  ['render-ui', 'main', { type: 'stats', entity: 'StatMetric' }],
                ],
              },
              {
                from: 'displaying',
                to: 'refreshing',
                event: 'REFRESH',
                effects: [
                  ['fetch', 'StatMetric'],
                  ['render-ui', 'main', { type: 'stats', entity: 'StatMetric' }],
                ],
              },
              {
                from: 'refreshing',
                to: 'displaying',
                event: 'REFRESHED',
                effects: [
                  ['fetch', 'StatMetric'],
                  ['render-ui', 'main', { type: 'stats', entity: 'StatMetric' }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'StatsPage',
          path: '/stats',
          isInitial: true,
          traits: [{ ref: 'StatsPanelControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-chart-view - Chart Display
// ============================================================================

/**
 * std-chart-view - Chart display with drill-down interaction.
 * Entity: ChartData with title, type, dataPoints, period.
 * States: loading -> displaying -> drilling.
 */
export const CHART_VIEW_BEHAVIOR: OrbitalSchema = {
  name: 'std-chart-view',
  version: '1.0.0',
  description: 'Chart display with drill-down and period selection',
  orbitals: [
    {
      name: 'ChartViewOrbital',
      entity: {
        name: 'ChartData',
        persistence: 'persistent',
        collection: 'chart_data',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'type', type: 'string', default: 'bar' },
          { name: 'dataPoints', type: 'number', default: 0 },
          { name: 'period', type: 'string', default: 'monthly' },
        ],
      },
      traits: [
        {
          name: 'ChartViewControl',
          linkedEntity: 'ChartData',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'loading', isInitial: true },
              { name: 'displaying' },
              { name: 'drilling' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'LOADED', name: 'Data Loaded' },
              { key: 'DRILL_DOWN', name: 'Drill Down', payloadSchema: [
                { name: 'id', type: 'string', required: true },
              ] },
              { key: 'CHANGE_PERIOD', name: 'Change Period', payloadSchema: [
                { name: 'period', type: 'string', required: true },
              ] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'loading',
                to: 'loading',
                event: 'INIT',
                effects: [
                  ['fetch', 'ChartData'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Charts' }],
                  ['render-ui', 'main', { type: 'chart', entity: 'ChartData' }],
                ],
              },
              {
                from: 'loading',
                to: 'displaying',
                event: 'LOADED',
                effects: [
                  ['fetch', 'ChartData'],
                  ['render-ui', 'main', { type: 'chart', entity: 'ChartData' }],
                ],
              },
              {
                from: 'displaying',
                to: 'displaying',
                event: 'CHANGE_PERIOD',
                effects: [
                  ['set', '@entity.period', '@payload.period'],
                  ['fetch', 'ChartData'],
                  ['render-ui', 'main', { type: 'chart', entity: 'ChartData' }],
                ],
              },
              {
                from: 'displaying',
                to: 'drilling',
                event: 'DRILL_DOWN',
                effects: [
                  ['fetch', 'ChartData'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'ChartData',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
                ],
              },
              { from: 'drilling', to: 'displaying', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'drilling', to: 'displaying', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ChartsPage',
          path: '/charts',
          isInitial: true,
          traits: [{ ref: 'ChartViewControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-kpi - KPI Tracker
// ============================================================================

/**
 * std-kpi - KPI tracker with target management.
 * Entity: KpiTarget with name, current, target, unit, status.
 * States: browsing -> viewing -> editing.
 */
export const KPI_BEHAVIOR: OrbitalSchema = {
  name: 'std-kpi',
  version: '1.0.0',
  description: 'KPI tracker with target management and progress display',
  orbitals: [
    {
      name: 'KpiOrbital',
      entity: {
        name: 'KpiTarget',
        persistence: 'persistent',
        collection: 'kpi_targets',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'current', type: 'number', default: 0 },
          { name: 'target', type: 'number', default: 100 },
          { name: 'unit', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'on_track' },
        ],
      },
      traits: [
        {
          name: 'KpiControl',
          linkedEntity: 'KpiTarget',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'editing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW_KPI', name: 'View KPI', payloadSchema: [
                { name: 'id', type: 'string', required: true },
              ] },
              { key: 'EDIT_KPI', name: 'Edit KPI' },
              { key: 'SAVE_KPI', name: 'Save KPI', payloadSchema: [
                { name: 'name', type: 'string', required: true },
                { name: 'target', type: 'number', required: true },
              ] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'BACK_TO_LIST', name: 'Back to List' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'KpiTarget'],
                  ['render-ui', 'main', { type: 'page-header', title: 'KPI Dashboard' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'KpiTarget',
                    itemActions: [
                      { label: 'View', event: 'VIEW_KPI' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW_KPI',
                effects: [
                  ['fetch', 'KpiTarget'],
                  ['render-ui', 'modal', { type: 'detail-panel',
                    entity: 'KpiTarget',
                    actions: [
                      { label: 'Edit', event: 'EDIT_KPI' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              { from: 'viewing', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'viewing', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              {
                from: 'viewing',
                to: 'editing',
                event: 'EDIT_KPI',
                effects: [
                  ['fetch', 'KpiTarget'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'KpiTarget',
                    submitEvent: 'SAVE_KPI',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'SAVE_KPI',
                effects: [
                  ['fetch', 'KpiTarget'],
                  ['set', '@entity.name', '@payload.name'],
                  ['set', '@entity.target', '@payload.target'],
                  ['render-ui', 'modal', null],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'KpiTarget',
                    itemActions: [
                      { label: 'View', event: 'VIEW_KPI' },
                    ],
                  }],
                ],
              },
              { from: 'editing', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'editing', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              {
                from: 'editing',
                to: 'browsing',
                event: 'BACK_TO_LIST',
                effects: [
                  ['fetch', 'KpiTarget'],
                  ['render-ui', 'modal', null],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'KpiTarget',
                    itemActions: [
                      { label: 'View', event: 'VIEW_KPI' },
                    ],
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'KpiPage',
          path: '/kpi',
          isInitial: true,
          traits: [{ ref: 'KpiControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-report - Report Generator
// ============================================================================

/**
 * std-report - Report generator with configuration and viewing.
 * Entity: Report with title, type, dateRange, status.
 * States: browsing -> configuring -> generating -> viewing.
 */
export const REPORT_BEHAVIOR: OrbitalSchema = {
  name: 'std-report',
  version: '1.0.0',
  description: 'Report generator with configure, generate, and view workflow',
  orbitals: [
    {
      name: 'ReportOrbital',
      entity: {
        name: 'Report',
        persistence: 'persistent',
        collection: 'reports',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'type', type: 'string', default: 'summary' },
          { name: 'dateRange', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'draft' },
        ],
      },
      traits: [
        {
          name: 'ReportWorkflow',
          linkedEntity: 'Report',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'configuring' },
              { name: 'generating' },
              { name: 'viewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'CREATE_REPORT', name: 'Create Report' },
              { key: 'CONFIGURE', name: 'Configure', payloadSchema: [
                { name: 'title', type: 'string', required: true },
                { name: 'type', type: 'string', required: true },
                { name: 'dateRange', type: 'string', required: true },
              ] },
              { key: 'GENERATE', name: 'Generate Report' },
              { key: 'GENERATED', name: 'Report Generated' },
              { key: 'VIEW_REPORT', name: 'View Report', payloadSchema: [
                { name: 'id', type: 'string', required: true },
              ] },
              { key: 'BACK_TO_LIST', name: 'Back to List' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Report'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Reports' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Report',
                    itemActions: [
                      { label: 'View', event: 'VIEW_REPORT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'configuring',
                event: 'CREATE_REPORT',
                effects: [
                  ['fetch', 'Report'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Configure Report' }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'Report' }],
                ],
              },
              {
                from: 'configuring',
                to: 'generating',
                event: 'CONFIGURE',
                effects: [
                  ['set', '@entity.title', '@payload.title'],
                  ['set', '@entity.type', '@payload.type'],
                  ['set', '@entity.dateRange', '@payload.dateRange'],
                  ['set', '@entity.status', 'generating'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Generating Report' }],
                  ['render-ui', 'main', { type: 'progress-bar', value: 0, label: 'Generating...' }],
                ],
              },
              {
                from: 'configuring',
                to: 'browsing',
                event: 'BACK_TO_LIST',
                effects: [
                  ['fetch', 'Report'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Reports' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Report',
                    itemActions: [
                      { label: 'View', event: 'VIEW_REPORT' },
                    ],
                  }],
                ],
              },
              {
                from: 'generating',
                to: 'viewing',
                event: 'GENERATED',
                effects: [
                  ['fetch', 'Report'],
                  ['set', '@entity.status', 'complete'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Report' }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'Report' }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW_REPORT',
                effects: [
                  ['fetch', 'Report'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Report' }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'Report' }],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'BACK_TO_LIST',
                effects: [
                  ['fetch', 'Report'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Reports' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Report',
                    itemActions: [
                      { label: 'View', event: 'VIEW_REPORT' },
                    ],
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ReportsPage',
          path: '/reports',
          isInitial: true,
          traits: [{ ref: 'ReportWorkflow' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Dashboard Behaviors
// ============================================================================

export const DASHBOARD_BEHAVIORS: OrbitalSchema[] = [
  STATS_PANEL_BEHAVIOR,
  CHART_VIEW_BEHAVIOR,
  KPI_BEHAVIOR,
  REPORT_BEHAVIOR,
];
