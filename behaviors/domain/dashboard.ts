/**
 * Dashboard Domain Behaviors
 *
 * Standard behaviors for dashboard components: statistics panels, chart views,
 * KPI trackers, and report generators.
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

// ── Shared Dashboard Theme ──────────────────────────────────────────

const DASHBOARD_THEME = {
  name: 'dashboard-slate',
  tokens: {
    colors: {
      primary: '#6366f1',
      'primary-hover': '#4f46e5',
      'primary-foreground': '#ffffff',
      accent: '#8b5cf6',
      'accent-foreground': '#ffffff',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-stats-panel - Statistics Display
// ============================================================================

// ── Reusable main-view effects (stats panel: displaying) ────────────

const statsPanelDisplayEffects: BehaviorEffect[] = [
  ['fetch', 'StatMetric'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + refresh button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'layout-dashboard', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Statistics' },
      ]},
      { type: 'button', label: 'Refresh', icon: 'refresh-cw', variant: 'secondary', action: 'REFRESH' },
    ]},
    { type: 'divider' },
    // Stats row: key metrics
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Metrics', icon: 'hash', entity: 'StatMetric' },
      { type: 'stats', label: 'Active Trends', icon: 'trending-up', entity: 'StatMetric' },
      { type: 'stats', label: 'Changes', icon: 'activity', entity: 'StatMetric' },
    ]},
    { type: 'divider' },
    // Data zone: metric cards via data-grid
    { type: 'data-grid', entity: 'StatMetric', cols: 2, gap: 'md',
      fields: [
        { name: 'name', label: 'Metric', icon: 'tag', variant: 'h4' },
        { name: 'value', label: 'Value', icon: 'hash', variant: 'body', format: 'number' },
        { name: 'change', label: 'Change', icon: 'trending-up', variant: 'body', format: 'number' },
        { name: 'trend', label: 'Trend', icon: 'activity', variant: 'badge' },
      ],
    },
    { type: 'divider' },
    // Overall performance meter
    { type: 'meter', value: 0, label: 'Overall Performance', icon: 'gauge', entity: 'StatMetric' },
  ]}],
];

/**
 * std-stats-panel - Statistics display with loading and refresh.
 * Entity: StatMetric with name, value, change, trend.
 * States: loading -> displaying -> refreshing.
 */
export const STATS_PANEL_BEHAVIOR: BehaviorSchema = {
  name: "std-stats-panel",
  version: "1.0.0",
  description: "Statistics panel with loading, display, and refresh",
  theme: {
    name: "dashboard-slate",
    tokens: {
      colors: {
        primary: "#6366f1",
        "primary-hover": "#4f46e5",
        "primary-foreground": "#ffffff",
        accent: "#8b5cf6",
        "accent-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "StatsPanelOrbital",
      entity: {
        name: "StatMetric",
        persistence: "persistent",
        collection: "stat_metrics",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "name",
            type: "string",
            default: "",
          },
          {
            name: "value",
            type: "number",
            default: 0,
          },
          {
            name: "change",
            type: "number",
            default: 0,
          },
          {
            name: "trend",
            type: "string",
            default: "stable",
          },
        ],
      },
      traits: [
        {
          name: "StatsPanelControl",
          linkedEntity: "StatMetric",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "loading",
                isInitial: true,
              },
              {
                name: "displaying",
              },
              {
                name: "refreshing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "LOADED",
                name: "Data Loaded",
              },
              {
                key: "REFRESH",
                name: "Refresh",
              },
              {
                key: "REFRESHED",
                name: "Refresh Complete",
              },
            ],
            transitions: [
              {
                from: "loading",
                to: "loading",
                event: "INIT",
                effects: [
                  ["fetch", "StatMetric"],
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
                              content: "Dashboard",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "loading-state",
                          title: "Loading metrics...",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "loading",
                to: "displaying",
                event: "LOADED",
                effects: [
                  ["fetch", "StatMetric"],
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
                              content: "Dashboard",
                            },
                            {
                              type: "button",
                              label: "Refresh",
                              icon: "refresh-cw",
                              variant: "secondary",
                              action: "REFRESH",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "simple-grid",
                          cols: 4,
                          gap: "md",
                          children: [
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Total Metrics",
                                  icon: "hash",
                                  entity: "StatMetric",
                                },
                                {
                                  type: "trend-indicator",
                                  value: 0,
                                  showValue: true,
                                  size: "sm",
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Active Trends",
                                  icon: "trending-up",
                                  entity: "StatMetric",
                                },
                                {
                                  type: "trend-indicator",
                                  value: 0,
                                  showValue: true,
                                  size: "sm",
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Changes",
                                  icon: "activity",
                                  entity: "StatMetric",
                                },
                                {
                                  type: "trend-indicator",
                                  value: 0,
                                  showValue: true,
                                  size: "sm",
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Performance",
                                  icon: "gauge",
                                  entity: "StatMetric",
                                },
                                {
                                  type: "trend-indicator",
                                  value: 0,
                                  showValue: true,
                                  size: "sm",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-grid",
                          entity: "StatMetric",
                          cols: 2,
                          gap: "md",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "sm",
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
                                          name: "trending-up",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.name",
                                        },
                                      ],
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.trend",
                                    },
                                  ],
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.value",
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
                from: "displaying",
                to: "refreshing",
                event: "REFRESH",
                effects: [
                  ["fetch", "StatMetric"],
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
                              content: "Dashboard",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "simple-grid",
                          cols: 4,
                          gap: "md",
                          children: [
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Total Metrics",
                                  icon: "hash",
                                  entity: "StatMetric",
                                  isLoading: true,
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Active Trends",
                                  icon: "trending-up",
                                  entity: "StatMetric",
                                  isLoading: true,
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Changes",
                                  icon: "activity",
                                  entity: "StatMetric",
                                  isLoading: true,
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Performance",
                                  icon: "gauge",
                                  entity: "StatMetric",
                                  isLoading: true,
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "loading-state",
                          title: "Refreshing metrics...",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "refreshing",
                to: "displaying",
                event: "REFRESHED",
                effects: [
                  ["fetch", "StatMetric"],
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
                              content: "Dashboard",
                            },
                            {
                              type: "button",
                              label: "Refresh",
                              icon: "refresh-cw",
                              variant: "secondary",
                              action: "REFRESH",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "simple-grid",
                          cols: 4,
                          gap: "md",
                          children: [
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Total Metrics",
                                  icon: "hash",
                                  entity: "StatMetric",
                                },
                                {
                                  type: "trend-indicator",
                                  value: 0,
                                  showValue: true,
                                  size: "sm",
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Active Trends",
                                  icon: "trending-up",
                                  entity: "StatMetric",
                                },
                                {
                                  type: "trend-indicator",
                                  value: 0,
                                  showValue: true,
                                  size: "sm",
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Changes",
                                  icon: "activity",
                                  entity: "StatMetric",
                                },
                                {
                                  type: "trend-indicator",
                                  value: 0,
                                  showValue: true,
                                  size: "sm",
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Performance",
                                  icon: "gauge",
                                  entity: "StatMetric",
                                },
                                {
                                  type: "trend-indicator",
                                  value: 0,
                                  showValue: true,
                                  size: "sm",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-grid",
                          entity: "StatMetric",
                          cols: 2,
                          gap: "md",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "sm",
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
                                          name: "trending-up",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.name",
                                        },
                                      ],
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.trend",
                                    },
                                  ],
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.value",
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
            ],
          },
        },
      ],
      pages: [
        {
          name: "StatsPage",
          path: "/stats",
          isInitial: true,
          traits: [
            {
              ref: "StatsPanelControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-chart-view - Chart Display
// ============================================================================

// ── Reusable main-view effects (chart view: displaying) ─────────────

const chartDisplayEffects: BehaviorEffect[] = [
  ['fetch', 'ChartData'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'bar-chart-2', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Charts' },
      ]},
    ]},
    { type: 'divider' },
    // Period selector buttons
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Daily', icon: 'calendar', variant: 'secondary', action: 'CHANGE_PERIOD' },
      { type: 'button', label: 'Weekly', icon: 'calendar', variant: 'secondary', action: 'CHANGE_PERIOD' },
      { type: 'button', label: 'Monthly', icon: 'calendar', variant: 'primary', action: 'CHANGE_PERIOD' },
    ]},
    { type: 'divider' },
    // Stats summary
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Charts', icon: 'pie-chart', entity: 'ChartData' },
      { type: 'stats', label: 'Data Points', icon: 'database', entity: 'ChartData' },
    ]},
    // Chart zone: line chart
    { type: 'line-chart', entity: 'ChartData' },
    { type: 'divider' },
    // Data zone: chart configs as list
    { type: 'data-list', entity: 'ChartData', variant: 'card',
      fields: [
        { name: 'title', label: 'Chart', icon: 'bar-chart-2', variant: 'h4' },
        { name: 'type', label: 'Type', icon: 'layers', variant: 'badge' },
        { name: 'dataPoints', label: 'Data Points', icon: 'database', variant: 'body', format: 'number' },
        { name: 'period', label: 'Period', icon: 'clock', variant: 'badge' },
      ],
      itemActions: [
        { label: 'Drill Down', event: 'DRILL_DOWN', icon: 'zoom-in' },
      ],
    },
  ]}],
];

/**
 * std-chart-view - Chart display with drill-down interaction.
 * Entity: ChartData with title, type, dataPoints, period.
 * States: loading -> displaying -> drilling.
 */
export const CHART_VIEW_BEHAVIOR: BehaviorSchema = {
  name: "std-chart-view",
  version: "1.0.0",
  description: "Chart display with drill-down and period selection",
  theme: {
    name: "dashboard-slate",
    tokens: {
      colors: {
        primary: "#6366f1",
        "primary-hover": "#4f46e5",
        "primary-foreground": "#ffffff",
        accent: "#8b5cf6",
        "accent-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "ChartViewOrbital",
      entity: {
        name: "ChartData",
        persistence: "persistent",
        collection: "chart_data",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "title",
            type: "string",
            default: "",
          },
          {
            name: "type",
            type: "string",
            default: "bar",
          },
          {
            name: "dataPoints",
            type: "number",
            default: 0,
          },
          {
            name: "period",
            type: "string",
            default: "monthly",
          },
        ],
      },
      traits: [
        {
          name: "ChartViewControl",
          linkedEntity: "ChartData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "loading",
                isInitial: true,
              },
              {
                name: "displaying",
              },
              {
                name: "drilling",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "LOADED",
                name: "Data Loaded",
              },
              {
                key: "DRILL_DOWN",
                name: "Drill Down",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CHANGE_PERIOD",
                name: "Change Period",
                payloadSchema: [
                  {
                    name: "period",
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
            ],
            transitions: [
              {
                from: "loading",
                to: "displaying",
                event: "INIT",
                effects: [
                  ["fetch", "ChartData"],
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
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "bar-chart-2",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Charts",
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
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Daily",
                              icon: "calendar",
                              variant: "secondary",
                              event: "CHANGE_PERIOD",
                            },
                            {
                              type: "button",
                              label: "Weekly",
                              icon: "calendar",
                              variant: "secondary",
                              event: "CHANGE_PERIOD",
                            },
                            {
                              type: "button",
                              label: "Monthly",
                              icon: "calendar",
                              variant: "primary",
                              event: "CHANGE_PERIOD",
                            },
                          ],
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
                              label: "Total Charts",
                              icon: "pie-chart",
                              entity: "ChartData",
                            },
                            {
                              type: "stat-display",
                              label: "Data Points",
                              icon: "database",
                              entity: "ChartData",
                            },
                          ],
                        },
                        {
                          type: "line-chart",
                          entity: "ChartData",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "ChartData",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Drill Down",
                              event: "DRILL_DOWN",
                              icon: "zoom-in",
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
                                      name: "bar-chart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.dataPoints",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.type",
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
                from: "loading",
                to: "displaying",
                event: "LOADED",
                effects: [
                  ["fetch", "ChartData"],
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
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "bar-chart-2",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Charts",
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
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Daily",
                              icon: "calendar",
                              variant: "secondary",
                              event: "CHANGE_PERIOD",
                            },
                            {
                              type: "button",
                              label: "Weekly",
                              icon: "calendar",
                              variant: "secondary",
                              event: "CHANGE_PERIOD",
                            },
                            {
                              type: "button",
                              label: "Monthly",
                              icon: "calendar",
                              variant: "primary",
                              event: "CHANGE_PERIOD",
                            },
                          ],
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
                              label: "Total Charts",
                              icon: "pie-chart",
                              entity: "ChartData",
                            },
                            {
                              type: "stat-display",
                              label: "Data Points",
                              icon: "database",
                              entity: "ChartData",
                            },
                          ],
                        },
                        {
                          type: "line-chart",
                          entity: "ChartData",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "ChartData",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Drill Down",
                              event: "DRILL_DOWN",
                              icon: "zoom-in",
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
                                      name: "bar-chart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.dataPoints",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.type",
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
                from: "displaying",
                to: "displaying",
                event: "CHANGE_PERIOD",
                effects: [
                  ["set", "@entity.period", "@payload.period"],
                  ["fetch", "ChartData"],
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
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "bar-chart-2",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Charts",
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
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Daily",
                              icon: "calendar",
                              variant: "secondary",
                              event: "CHANGE_PERIOD",
                            },
                            {
                              type: "button",
                              label: "Weekly",
                              icon: "calendar",
                              variant: "secondary",
                              event: "CHANGE_PERIOD",
                            },
                            {
                              type: "button",
                              label: "Monthly",
                              icon: "calendar",
                              variant: "primary",
                              event: "CHANGE_PERIOD",
                            },
                          ],
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
                              label: "Total Charts",
                              icon: "pie-chart",
                              entity: "ChartData",
                            },
                            {
                              type: "stat-display",
                              label: "Data Points",
                              icon: "database",
                              entity: "ChartData",
                            },
                          ],
                        },
                        {
                          type: "line-chart",
                          entity: "ChartData",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "ChartData",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Drill Down",
                              event: "DRILL_DOWN",
                              icon: "zoom-in",
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
                                      name: "bar-chart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.dataPoints",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.type",
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
                from: "displaying",
                to: "drilling",
                event: "DRILL_DOWN",
                effects: [
                  ["fetch", "ChartData"],
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
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "zoom-in",
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "Chart Detail",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "ghost",
                              event: "CLOSE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "typography",
                              variant: "h4",
                              content: "@entity.title",
                            },
                            {
                              type: "badge",
                              label: "@entity.type",
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.period",
                            },
                          ],
                        },
                        {
                          type: "line-chart",
                          entity: "ChartData",
                        },
                        {
                          type: "stat-display",
                          label: "Data Points",
                          icon: "database",
                          entity: "ChartData",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "drilling",
                to: "displaying",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "drilling",
                to: "displaying",
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
          name: "ChartsPage",
          path: "/charts",
          isInitial: true,
          traits: [
            {
              ref: "ChartViewControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-kpi - KPI Tracker
// ============================================================================

// ── Reusable main-view effects (KPI: browsing) ─────────────────────

const kpiBrowsingEffects: BehaviorEffect[] = [
  ['fetch', 'KpiTarget'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'target', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'KPI Dashboard' },
      ]},
    ]},
    { type: 'divider' },
    // Stats + overall KPI health meter
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total KPIs', icon: 'target', entity: 'KpiTarget' },
      { type: 'stats', label: 'On Track', icon: 'check-circle', entity: 'KpiTarget' },
      { type: 'meter', value: 0, label: 'Overall KPI Health', icon: 'heart-pulse' },
    ]},
    { type: 'divider' },
    // Data zone: KPI cards via data-grid
    { type: 'data-grid', entity: 'KpiTarget', cols: 2, gap: 'md',
      fields: [
        { name: 'name', label: 'KPI', icon: 'target', variant: 'h4' },
        { name: 'current', label: 'Current', icon: 'trending-up', variant: 'body', format: 'number' },
        { name: 'target', label: 'Target', icon: 'flag', variant: 'body', format: 'number' },
        { name: 'unit', label: 'Unit', variant: 'caption' },
        { name: 'status', label: 'Status', icon: 'activity', variant: 'badge' },
      ],
      itemActions: [
        { label: 'View', event: 'VIEW_KPI', icon: 'eye' },
      ],
    },
    // Progress bar per KPI (aggregate)
    { type: 'progress-bar', value: 0, label: 'Completion Rate', icon: 'percent', entity: 'KpiTarget' },
    // Progress to target for selected KPI
    { type: 'progress-bar', value: '@entity.current', max: '@entity.target', label: 'Progress to Target', icon: 'target' },
  ]}],
];

/**
 * std-kpi - KPI tracker with target management.
 * Entity: KpiTarget with name, current, target, unit, status.
 * States: browsing -> viewing -> editing.
 */
export const KPI_BEHAVIOR: BehaviorSchema = {
  name: "std-kpi",
  version: "1.0.0",
  description: "KPI tracker with target management and progress display",
  theme: {
    name: "dashboard-slate",
    tokens: {
      colors: {
        primary: "#6366f1",
        "primary-hover": "#4f46e5",
        "primary-foreground": "#ffffff",
        accent: "#8b5cf6",
        "accent-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "KpiOrbital",
      entity: {
        name: "KpiTarget",
        persistence: "persistent",
        collection: "kpi_targets",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "name",
            type: "string",
            default: "",
          },
          {
            name: "current",
            type: "number",
            default: 0,
          },
          {
            name: "target",
            type: "number",
            default: 100,
          },
          {
            name: "unit",
            type: "string",
            default: "",
          },
          {
            name: "status",
            type: "string",
            default: "on_track",
          },
        ],
      },
      traits: [
        {
          name: "KpiControl",
          linkedEntity: "KpiTarget",
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
                name: "editing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "VIEW_KPI",
                name: "View KPI",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "EDIT_KPI",
                name: "Edit KPI",
              },
              {
                key: "SAVE_KPI",
                name: "Save KPI",
                payloadSchema: [
                  {
                    name: "name",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "target",
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
              {
                key: "BACK_TO_LIST",
                name: "Back to List",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "KpiTarget"],
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
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "target",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "KPI Dashboard",
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
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total KPIs",
                              icon: "target",
                              entity: "KpiTarget",
                            },
                            {
                              type: "stat-display",
                              label: "On Track",
                              icon: "check-circle",
                              entity: "KpiTarget",
                            },
                            {
                              type: "meter",
                              value: 0,
                              label: "Overall KPI Health",
                              icon: "heart-pulse",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-grid",
                          entity: "KpiTarget",
                          cols: 2,
                          gap: "md",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW_KPI",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "target",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "sm",
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
                                          name: "target",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.name",
                                        },
                                      ],
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.unit",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: 0,
                          label: "Completion Rate",
                          icon: "percent",
                          entity: "KpiTarget",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.current",
                          max: "@entity.target",
                          label: "Progress to Target",
                          icon: "target",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "VIEW_KPI",
                effects: [
                  ["fetch", "KpiTarget"],
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
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "target",
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "KPI Detail",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Edit",
                                  icon: "pencil",
                                  variant: "primary",
                                  event: "EDIT_KPI",
                                },
                                {
                                  type: "button",
                                  label: "Close",
                                  icon: "x",
                                  variant: "ghost",
                                  event: "CLOSE",
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
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "typography",
                              variant: "h4",
                              content: "@entity.name",
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "md",
                              children: [
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.current",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "/",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.target",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.unit",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              content: "@entity.status",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "meter",
                          value: "@entity.current",
                          label: "Progress",
                          icon: "trending-up",
                        },
                        {
                          type: "progress-bar",
                          value: 0,
                          label: "Target Completion",
                          icon: "flag",
                          entity: "KpiTarget",
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
                from: "viewing",
                to: "editing",
                event: "EDIT_KPI",
                effects: [
                  ["fetch", "KpiTarget"],
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
                              name: "pencil",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Edit KPI",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "KpiTarget",
                          submitEvent: "SAVE_KPI",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "name",
                              type: "string",
                            },
                            {
                              name: "current",
                              type: "number",
                            },
                            {
                              name: "target",
                              type: "number",
                            },
                            {
                              name: "unit",
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
                from: "editing",
                to: "browsing",
                event: "SAVE_KPI",
                effects: [
                  ["set", "@entity.name", "@payload.name"],
                  ["set", "@entity.target", "@payload.target"],
                  ["render-ui", "modal", null],
                  ["fetch", "KpiTarget"],
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
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "target",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "KPI Dashboard",
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
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total KPIs",
                              icon: "target",
                              entity: "KpiTarget",
                            },
                            {
                              type: "stat-display",
                              label: "On Track",
                              icon: "check-circle",
                              entity: "KpiTarget",
                            },
                            {
                              type: "meter",
                              value: 0,
                              label: "Overall KPI Health",
                              icon: "heart-pulse",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-grid",
                          entity: "KpiTarget",
                          cols: 2,
                          gap: "md",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW_KPI",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "target",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "sm",
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
                                          name: "target",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.name",
                                        },
                                      ],
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.unit",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: 0,
                          label: "Completion Rate",
                          icon: "percent",
                          entity: "KpiTarget",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.current",
                          max: "@entity.target",
                          label: "Progress to Target",
                          icon: "target",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "BACK_TO_LIST",
                effects: [
                  ["render-ui", "modal", null],
                  ["fetch", "KpiTarget"],
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
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "target",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "KPI Dashboard",
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
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total KPIs",
                              icon: "target",
                              entity: "KpiTarget",
                            },
                            {
                              type: "stat-display",
                              label: "On Track",
                              icon: "check-circle",
                              entity: "KpiTarget",
                            },
                            {
                              type: "meter",
                              value: 0,
                              label: "Overall KPI Health",
                              icon: "heart-pulse",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-grid",
                          entity: "KpiTarget",
                          cols: 2,
                          gap: "md",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW_KPI",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "target",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "sm",
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
                                          name: "target",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.name",
                                        },
                                      ],
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.unit",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: 0,
                          label: "Completion Rate",
                          icon: "percent",
                          entity: "KpiTarget",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.current",
                          max: "@entity.target",
                          label: "Progress to Target",
                          icon: "target",
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "KpiPage",
          path: "/kpi",
          isInitial: true,
          traits: [
            {
              ref: "KpiControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-report - Report Generator
// ============================================================================

// ── Reusable main-view effects (report: browsing) ───────────────────

const reportBrowsingEffects: BehaviorEffect[] = [
  ['fetch', 'Report'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + create button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'file-text', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Reports' },
      ]},
      { type: 'button', label: 'Create Report', icon: 'plus', variant: 'primary', action: 'CREATE_REPORT' },
    ]},
    { type: 'divider' },
    // Stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Reports', icon: 'file-text', entity: 'Report' },
      { type: 'stats', label: 'Completed', icon: 'check-circle', entity: 'Report' },
      { type: 'stats', label: 'In Progress', icon: 'clock', entity: 'Report' },
    ]},
    { type: 'divider' },
    // Search
    { type: 'search-input', placeholder: 'Search reports...', entity: 'Report' },
    // Report list
    { type: 'data-list', entity: 'Report', variant: 'card',
      fields: [
        { name: 'title', label: 'Report', icon: 'file-text', variant: 'h4' },
        { name: 'type', label: 'Type', icon: 'tag', variant: 'badge' },
        { name: 'dateRange', label: 'Date Range', icon: 'calendar', variant: 'body' },
        { name: 'status', label: 'Status', icon: 'activity', variant: 'badge' },
      ],
      itemActions: [
        { label: 'View', event: 'VIEW_REPORT', icon: 'eye' },
      ],
    },
  ]}],
];

/**
 * std-report - Report generator with configuration and viewing.
 * Entity: Report with title, type, dateRange, status.
 * States: browsing -> configuring -> generating -> viewing.
 */
export const REPORT_BEHAVIOR: BehaviorSchema = {
  name: "std-report",
  version: "1.0.0",
  description: "Report generator with configure, generate, and view workflow",
  theme: {
    name: "dashboard-slate",
    tokens: {
      colors: {
        primary: "#6366f1",
        "primary-hover": "#4f46e5",
        "primary-foreground": "#ffffff",
        accent: "#8b5cf6",
        "accent-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "ReportOrbital",
      entity: {
        name: "Report",
        persistence: "persistent",
        collection: "reports",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "title",
            type: "string",
            default: "",
          },
          {
            name: "type",
            type: "string",
            default: "summary",
          },
          {
            name: "dateRange",
            type: "string",
            default: "",
          },
          {
            name: "status",
            type: "string",
            default: "draft",
          },
        ],
      },
      traits: [
        {
          name: "ReportWorkflow",
          linkedEntity: "Report",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "configuring",
              },
              {
                name: "generating",
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
                key: "CREATE_REPORT",
                name: "Create Report",
              },
              {
                key: "CONFIGURE",
                name: "Configure",
                payloadSchema: [
                  {
                    name: "title",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "type",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "dateRange",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "GENERATE",
                name: "Generate Report",
              },
              {
                key: "GENERATED",
                name: "Report Generated",
              },
              {
                key: "VIEW_REPORT",
                name: "View Report",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "BACK_TO_LIST",
                name: "Back to List",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "Report"],
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
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "file-text",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Reports",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Create Report",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE_REPORT",
                            },
                          ],
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
                              label: "Total Reports",
                              icon: "file-text",
                              entity: "Report",
                            },
                            {
                              type: "stat-display",
                              label: "Completed",
                              icon: "check-circle",
                              entity: "Report",
                            },
                            {
                              type: "stat-display",
                              label: "In Progress",
                              icon: "clock",
                              entity: "Report",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search reports...",
                          entity: "Report",
                        },
                        {
                          type: "data-list",
                          entity: "Report",
                          variant: "card",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW_REPORT",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "file-text",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
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
                                      name: "file-bar-chart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.dateRange",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
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
                to: "configuring",
                event: "CREATE_REPORT",
                effects: [
                  ["fetch", "Report"],
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
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "settings",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Configure Report",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Back",
                              icon: "arrow-left",
                              variant: "ghost",
                              event: "BACK_TO_LIST",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "Report",
                          submitEvent: "CONFIGURE",
                          cancelEvent: "BACK_TO_LIST",
                          fields: [
                            {
                              name: "title",
                              type: "string",
                            },
                            {
                              name: "type",
                              type: "string",
                            },
                            {
                              name: "dateRange",
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
                from: "configuring",
                to: "generating",
                event: "CONFIGURE",
                effects: [
                  ["set", "@entity.title", "@payload.title"],
                  ["set", "@entity.type", "@payload.type"],
                  ["set", "@entity.dateRange", "@payload.dateRange"],
                  ["set", "@entity.status", "generating"],
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
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "loader",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Generating Report",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "md",
                          children: [
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.title",
                            },
                            {
                              type: "badge",
                              content: "@entity.type",
                            },
                            {
                              type: "progress-bar",
                              value: 0,
                              label: "Generating...",
                              icon: "loader",
                            },
                            {
                              type: "typography",
                              variant: "caption",
                              content: "Please wait while the report is being generated.",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "configuring",
                to: "browsing",
                event: "BACK_TO_LIST",
                effects: [
                  ["fetch", "Report"],
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
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "file-text",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Reports",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Create Report",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE_REPORT",
                            },
                          ],
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
                              label: "Total Reports",
                              icon: "file-text",
                              entity: "Report",
                            },
                            {
                              type: "stat-display",
                              label: "Completed",
                              icon: "check-circle",
                              entity: "Report",
                            },
                            {
                              type: "stat-display",
                              label: "In Progress",
                              icon: "clock",
                              entity: "Report",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search reports...",
                          entity: "Report",
                        },
                        {
                          type: "data-list",
                          entity: "Report",
                          variant: "card",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW_REPORT",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "file-text",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
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
                                      name: "file-bar-chart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.dateRange",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
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
                from: "generating",
                to: "viewing",
                event: "GENERATED",
                effects: [
                  ["fetch", "Report"],
                  ["set", "@entity.status", "complete"],
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
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "file-text",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Report",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Back to List",
                              icon: "arrow-left",
                              variant: "ghost",
                              event: "BACK_TO_LIST",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "typography",
                              variant: "h3",
                              content: "@entity.title",
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "badge",
                                  content: "@entity.type",
                                },
                                {
                                  type: "badge",
                                  content: "@entity.status",
                                },
                              ],
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.dateRange",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "line-chart",
                          entity: "Report",
                        },
                        {
                          type: "data-grid",
                          entity: "Report",
                          cols: 2,
                          gap: "md",
                          emptyIcon: "file-text",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "sm",
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
                                          name: "file-bar-chart",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.title",
                                        },
                                      ],
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.dateRange",
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
                event: "VIEW_REPORT",
                effects: [
                  ["fetch", "Report"],
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
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "file-text",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Report",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Back to List",
                              icon: "arrow-left",
                              variant: "ghost",
                              event: "BACK_TO_LIST",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "typography",
                              variant: "h3",
                              content: "@entity.title",
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "badge",
                                  content: "@entity.type",
                                },
                                {
                                  type: "badge",
                                  content: "@entity.status",
                                },
                              ],
                            },
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.dateRange",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "line-chart",
                          entity: "Report",
                        },
                        {
                          type: "data-grid",
                          entity: "Report",
                          cols: 2,
                          gap: "md",
                          emptyIcon: "file-text",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "sm",
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
                                          name: "file-bar-chart",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "h4",
                                          content: "@entity.title",
                                        },
                                      ],
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "@entity.dateRange",
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
                from: "viewing",
                to: "browsing",
                event: "BACK_TO_LIST",
                effects: [
                  ["fetch", "Report"],
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
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "file-text",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Reports",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Create Report",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE_REPORT",
                            },
                          ],
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
                              label: "Total Reports",
                              icon: "file-text",
                              entity: "Report",
                            },
                            {
                              type: "stat-display",
                              label: "Completed",
                              icon: "check-circle",
                              entity: "Report",
                            },
                            {
                              type: "stat-display",
                              label: "In Progress",
                              icon: "clock",
                              entity: "Report",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search reports...",
                          entity: "Report",
                        },
                        {
                          type: "data-list",
                          entity: "Report",
                          variant: "card",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW_REPORT",
                              icon: "eye",
                            },
                          ],
                          emptyIcon: "file-text",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
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
                                      name: "file-bar-chart",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.dateRange",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
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
            ],
          },
        },
      ],
      pages: [
        {
          name: "ReportsPage",
          path: "/reports",
          isInitial: true,
          traits: [
            {
              ref: "ReportWorkflow",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Dashboard Behaviors
// ============================================================================

export const DASHBOARD_BEHAVIORS: BehaviorSchema[] = [
  STATS_PANEL_BEHAVIOR,
  CHART_VIEW_BEHAVIOR,
  KPI_BEHAVIOR,
  REPORT_BEHAVIOR,
];
