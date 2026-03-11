/**
 * IoT Domain Behaviors
 *
 * Standard behaviors for sensor data feeds, alert thresholds,
 * and device management.
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

// ── Shared IoT Theme ─────────────────────────────────────────────────

const IOT_THEME = {
  name: 'iot-teal',
  tokens: {
    colors: {
      primary: '#0d9488',
      'primary-hover': '#0f766e',
      'primary-foreground': '#ffffff',
      accent: '#06b6d4',
      'accent-foreground': '#ffffff',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ── Reusable main-view effects (sensors) ─────────────────────────────

const sensorMainEffects: BehaviorEffect[] = [
  ['fetch', 'SensorReading'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header zone: icon + title + refresh
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'thermometer', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Sensor Dashboard' },
      ]},
    ]},
    { type: 'divider' },
    // Stats zone: key metrics side by side
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Sensors', icon: 'cpu', entity: 'SensorReading' },
      { type: 'meter', value: '@entity.value', label: 'Avg Reading', icon: 'activity' },
    ]},
    // Chart zone: trend line
    { type: 'line-chart', entity: 'SensorReading' },
    { type: 'divider' },
    // Data zone: sensor cards via data-grid
    { type: 'data-grid', entity: 'SensorReading', cols: 3, gap: 'md',
      fields: [
        { name: 'sensorId', label: 'Sensor ID', icon: 'cpu', variant: 'h4' },
        { name: 'value', label: 'Reading', icon: 'thermometer', variant: 'body' },
        { name: 'unit', label: 'Unit', variant: 'caption' },
        { name: 'status', label: 'Status', icon: 'activity', variant: 'badge' },
        { name: 'timestamp', label: 'Last Update', icon: 'clock', variant: 'caption', format: 'date' },
      ],
      itemActions: [
        { label: 'View', event: 'VIEW', icon: 'eye' },
      ],
    },
  ]}],
];

// ── Reusable main-view effects (alerts) ──────────────────────────────

const alertMainEffects: BehaviorEffect[] = [
  ['fetch', 'AlertRule'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + create button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'bell', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Alert Rules' },
      ]},
      { type: 'button', label: 'New Rule', icon: 'plus', variant: 'primary', action: 'CREATE' },
    ]},
    { type: 'divider' },
    // Stats + threshold meter
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Rules', icon: 'shield', entity: 'AlertRule' },
      { type: 'meter', value: 0, label: 'Threshold Level', icon: 'gauge' },
    ]},
    { type: 'divider' },
    // Search
    { type: 'search-input', placeholder: 'Filter alert rules...', entity: 'AlertRule' },
    // Data zone: alert rules as list
    { type: 'data-list', entity: 'AlertRule', variant: 'card',
      fields: [
        { name: 'metric', label: 'Metric', icon: 'bar-chart-2', variant: 'h4' },
        { name: 'sensorId', label: 'Sensor', icon: 'cpu', variant: 'body' },
        { name: 'threshold', label: 'Threshold', icon: 'gauge', variant: 'body', format: 'number' },
        { name: 'operator', label: 'Operator', variant: 'caption' },
        { name: 'isActive', label: 'Active', icon: 'power', variant: 'badge' },
      ],
      itemActions: [
        { label: 'Edit', event: 'EDIT', icon: 'pencil' },
      ],
    },
  ]}],
];

// ── Reusable main-view effects (devices) ─────────────────────────────

const deviceMainEffects: BehaviorEffect[] = [
  ['fetch', 'Device'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'router', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Devices' },
      ]},
    ]},
    { type: 'divider' },
    // Stats row: device count + online meter
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Devices', icon: 'server', entity: 'Device' },
      { type: 'meter', value: 0, label: 'Online Devices', icon: 'wifi' },
    ]},
    { type: 'divider' },
    // Search
    { type: 'search-input', placeholder: 'Search devices...', entity: 'Device' },
    // Data zone: device cards with status badges
    { type: 'data-grid', entity: 'Device', cols: 3, gap: 'md',
      fields: [
        { name: 'name', label: 'Device Name', icon: 'router', variant: 'h4' },
        { name: 'type', label: 'Type', icon: 'tag', variant: 'caption' },
        { name: 'status', label: 'Status', icon: 'wifi', variant: 'badge' },
        { name: 'firmware', label: 'Firmware', icon: 'hard-drive', variant: 'caption' },
        { name: 'lastSeen', label: 'Last Seen', icon: 'clock', variant: 'caption', format: 'date' },
      ],
      itemActions: [
        { label: 'View', event: 'VIEW', icon: 'eye' },
      ],
    },
  ]}],
];

// ============================================================================
// std-sensor-feed - Sensor Data Dashboard
// ============================================================================

/**
 * std-sensor-feed - Sensor data monitoring dashboard.
 * States: browsing -> viewing -> configuring
 *
 * UI: Teal IoT theme. Main view uses stats + line chart + data-grid cards.
 * Modal for sensor detail with meter gauge, configure via form.
 */
export const SENSOR_FEED_BEHAVIOR: BehaviorSchema = {
  name: "std-sensor-feed",
  version: "1.0.0",
  description: "Sensor data monitoring and visualization",
  orbitals: [
    {
      name: "SensorFeedOrbital",
      theme: {
        name: "iot-teal",
        tokens: {
          colors: {
            primary: "#0d9488",
            "primary-hover": "#0f766e",
            "primary-foreground": "#ffffff",
            accent: "#06b6d4",
            "accent-foreground": "#ffffff",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "SensorReading",
        persistence: "persistent",
        collection: "sensor_readings",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "sensorId",
            type: "string",
            default: "",
          },
          {
            name: "value",
            type: "number",
            default: 0,
          },
          {
            name: "unit",
            type: "string",
            default: "",
          },
          {
            name: "timestamp",
            type: "string",
            default: "",
          },
          {
            name: "status",
            type: "string",
            default: "normal",
          },
        ],
      },
      traits: [
        {
          name: "SensorFeedControl",
          linkedEntity: "SensorReading",
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
                name: "configuring",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "VIEW",
                name: "View Sensor",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CONFIGURE",
                name: "Configure Sensor",
              },
              {
                key: "SAVE_CONFIG",
                name: "Save Config",
                payloadSchema: [
                  {
                    name: "unit",
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
              {
                key: "GLOBAL_VARIABLE_SET",
                name: "GLOBAL VARIABLE SET",
              },
              {
                key: "VIOLATION_DETECTED",
                name: "VIOLATION DETECTED",
              },
              {
                key: "FIELD_CHANGED",
                name: "FIELD CHANGED",
              },
              {
                key: "LOAD_MORE",
                name: "Load More",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "SensorReading"],
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
                              content: "Sensor Dashboard",
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "status-dot",
                                  status: "online",
                                  pulse: true,
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Live",
                                },
                              ],
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
                                  label: "Total Readings",
                                  icon: "hash",
                                  value: ["count", "@SensorReading"],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Average",
                                  icon: "calculator",
                                  value: [
                                    "round",
                                    [
                                      "average",
                                      ["map", "@SensorReading", "@item.value"],
                                    ],
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Min Value",
                                  icon: "arrow-down",
                                  value: [
                                    "array/min",
                                    ["map", "@SensorReading", "@item.value"],
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Max Value",
                                  icon: "arrow-up",
                                  value: [
                                    "array/max",
                                    ["map", "@SensorReading", "@item.value"],
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "chart",
                          title: "Sensor Readings",
                          chartType: "line",
                          height: 200,
                          data: [
                            "map",
                            "@SensorReading",
                            {
                              label: "@index",
                              value: "@item.value",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "SensorReading",
                          variant: "card",
                          infiniteScroll: true,
                          loadMoreEvent: "LOAD_MORE",
                          hasMore: true,
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
                                      name: "cpu",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.sensorId",
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
                                      type: "stat-display",
                                      label: "Reading",
                                      value: "@entity.value",
                                      icon: "thermometer",
                                      size: "sm",
                                      compact: true,
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
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
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
                event: "VIEW",
                effects: [
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
                                  name: "cpu",
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.sensorId",
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
                          type: "stat-display",
                          label: "Current Value",
                          icon: "thermometer",
                          value: "@entity.value",
                          entity: "SensorReading",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Unit",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.unit",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Status",
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "status-dot",
                                      status: "online",
                                      size: "sm",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Last Update",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.timestamp",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Trend",
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
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          justify: "end",
                          children: [
                            {
                              type: "button",
                              label: "Configure",
                              icon: "settings",
                              variant: "primary",
                              event: "CONFIGURE",
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
                to: "configuring",
                event: "CONFIGURE",
                effects: [
                  ["fetch", "SensorReading"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "form-section",
                      entity: "SensorReading",
                      submitEvent: "SAVE_CONFIG",
                      cancelEvent: "CANCEL",
                      fields: [
                        {
                          name: "sensorId",
                          type: "string",
                        },
                        {
                          name: "value",
                          type: "number",
                        },
                        {
                          name: "unit",
                          type: "string",
                        },
                        {
                          name: "timestamp",
                          type: "string",
                        },
                        {
                          name: "status",
                          type: "string",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "configuring",
                to: "browsing",
                event: "SAVE_CONFIG",
                effects: [
                  ["set", "@entity.unit", "@payload.unit"],
                  ["render-ui", "modal", null],
                  ["fetch", "SensorReading"],
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
                              content: "Sensor Dashboard",
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "status-dot",
                                  status: "online",
                                  pulse: true,
                                  size: "sm",
                                },
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Live",
                                },
                              ],
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
                                  label: "Total Readings",
                                  icon: "hash",
                                  value: ["count", "@SensorReading"],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Average",
                                  icon: "calculator",
                                  value: [
                                    "round",
                                    [
                                      "average",
                                      ["map", "@SensorReading", "@item.value"],
                                    ],
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Min Value",
                                  icon: "arrow-down",
                                  value: [
                                    "array/min",
                                    ["map", "@SensorReading", "@item.value"],
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Max Value",
                                  icon: "arrow-up",
                                  value: [
                                    "array/max",
                                    ["map", "@SensorReading", "@item.value"],
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "chart",
                          title: "Sensor Readings",
                          chartType: "line",
                          height: 200,
                          data: [
                            "map",
                            "@SensorReading",
                            {
                              label: "@index",
                              value: "@item.value",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "SensorReading",
                          variant: "card",
                          infiniteScroll: true,
                          loadMoreEvent: "LOAD_MORE",
                          hasMore: true,
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
                                      name: "cpu",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.sensorId",
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
                                      type: "stat-display",
                                      label: "Reading",
                                      value: "@entity.value",
                                      icon: "thermometer",
                                      size: "sm",
                                      compact: true,
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
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
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
                from: "configuring",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "configuring",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "configuring",
                to: "configuring",
                event: "GLOBAL_VARIABLE_SET",
                effects: [],
              },
              {
                from: "configuring",
                to: "configuring",
                event: "VIOLATION_DETECTED",
                effects: [],
              },
              {
                from: "configuring",
                to: "configuring",
                event: "FIELD_CHANGED",
                effects: [],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "LOAD_MORE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "SensorPage",
          path: "/sensors",
          isInitial: true,
          traits: [
            {
              ref: "SensorFeedControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-alert-threshold - Alert Configuration
// ============================================================================

/**
 * std-alert-threshold - Alert threshold management.
 * States: browsing -> creating -> editing
 *
 * UI: Teal IoT theme. Main view uses stats + meter + searchable data-list.
 * Modal for create/edit via form-section.
 */
export const ALERT_THRESHOLD_BEHAVIOR: BehaviorSchema = {
  name: "std-alert-threshold",
  version: "1.0.0",
  description: "Alert threshold configuration for sensors",
  orbitals: [
    {
      name: "AlertThresholdOrbital",
      theme: {
        name: "iot-teal",
        tokens: {
          colors: {
            primary: "#0d9488",
            "primary-hover": "#0f766e",
            "primary-foreground": "#ffffff",
            accent: "#06b6d4",
            "accent-foreground": "#ffffff",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "AlertRule",
        persistence: "persistent",
        collection: "alert_rules",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "sensorId",
            type: "string",
            default: "",
          },
          {
            name: "metric",
            type: "string",
            default: "",
          },
          {
            name: "threshold",
            type: "number",
            default: 0,
          },
          {
            name: "operator",
            type: "string",
            default: "gt",
          },
          {
            name: "isActive",
            type: "boolean",
            default: true,
          },
        ],
      },
      traits: [
        {
          name: "AlertThresholdControl",
          linkedEntity: "AlertRule",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "creating",
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
                key: "CREATE",
                name: "New Alert Rule",
              },
              {
                key: "EDIT",
                name: "Edit Rule",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "SAVE",
                name: "Save Rule",
                payloadSchema: [
                  {
                    name: "metric",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "threshold",
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
                key: "GLOBAL_VARIABLE_SET",
                name: "GLOBAL VARIABLE SET",
              },
              {
                key: "VIOLATION_DETECTED",
                name: "VIOLATION DETECTED",
              },
              {
                key: "FIELD_CHANGED",
                name: "FIELD CHANGED",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "AlertRule"],
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
                                  name: "bell",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Alert Rules",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Rule",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE",
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
                              label: "Total Rules",
                              icon: "shield",
                              entity: "AlertRule",
                            },
                            {
                              type: "meter",
                              value: 0,
                              label: "Threshold Level",
                              icon: "gauge",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Filter alert rules...",
                          entity: "AlertRule",
                        },
                        {
                          type: "data-list",
                          entity: "AlertRule",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Edit",
                              event: "EDIT",
                              icon: "pencil",
                            },
                          ],
                          emptyIcon: "bell",
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
                                      name: "alert-triangle",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.metric",
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
                                      content: "@entity.operator",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.isActive",
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
                to: "creating",
                event: "CREATE",
                effects: [
                  ["fetch", "AlertRule"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "form-section",
                      entity: "AlertRule",
                      submitEvent: "SAVE",
                      cancelEvent: "CANCEL",
                      fields: [
                        {
                          name: "sensorId",
                          type: "string",
                        },
                        {
                          name: "metric",
                          type: "string",
                        },
                        {
                          name: "threshold",
                          type: "number",
                        },
                        {
                          name: "operator",
                          type: "string",
                        },
                        {
                          name: "isActive",
                          type: "boolean",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "SAVE",
                effects: [
                  ["set", "@entity.metric", "@payload.metric"],
                  ["set", "@entity.threshold", "@payload.threshold"],
                  ["render-ui", "modal", null],
                  ["fetch", "AlertRule"],
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
                                  name: "bell",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Alert Rules",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Rule",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE",
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
                              label: "Total Rules",
                              icon: "shield",
                              entity: "AlertRule",
                            },
                            {
                              type: "meter",
                              value: 0,
                              label: "Threshold Level",
                              icon: "gauge",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Filter alert rules...",
                          entity: "AlertRule",
                        },
                        {
                          type: "data-list",
                          entity: "AlertRule",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Edit",
                              event: "EDIT",
                              icon: "pencil",
                            },
                          ],
                          emptyIcon: "bell",
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
                                      name: "alert-triangle",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.metric",
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
                                      content: "@entity.operator",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.isActive",
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
                from: "creating",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "editing",
                event: "EDIT",
                effects: [
                  ["fetch", "AlertRule"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "form-section",
                      entity: "AlertRule",
                      submitEvent: "SAVE",
                      cancelEvent: "CANCEL",
                      fields: [
                        {
                          name: "sensorId",
                          type: "string",
                        },
                        {
                          name: "metric",
                          type: "string",
                        },
                        {
                          name: "threshold",
                          type: "number",
                        },
                        {
                          name: "operator",
                          type: "string",
                        },
                        {
                          name: "isActive",
                          type: "boolean",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "SAVE",
                effects: [
                  ["set", "@entity.metric", "@payload.metric"],
                  ["set", "@entity.threshold", "@payload.threshold"],
                  ["render-ui", "modal", null],
                  ["fetch", "AlertRule"],
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
                                  name: "bell",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Alert Rules",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Rule",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE",
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
                              label: "Total Rules",
                              icon: "shield",
                              entity: "AlertRule",
                            },
                            {
                              type: "meter",
                              value: 0,
                              label: "Threshold Level",
                              icon: "gauge",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Filter alert rules...",
                          entity: "AlertRule",
                        },
                        {
                          type: "data-list",
                          entity: "AlertRule",
                          variant: "card",
                          itemActions: [
                            {
                              label: "Edit",
                              event: "EDIT",
                              icon: "pencil",
                            },
                          ],
                          emptyIcon: "bell",
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
                                      name: "alert-triangle",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.metric",
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
                                      content: "@entity.operator",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.isActive",
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
                from: "creating",
                to: "creating",
                event: "GLOBAL_VARIABLE_SET",
                effects: [],
              },
              {
                from: "creating",
                to: "creating",
                event: "VIOLATION_DETECTED",
                effects: [],
              },
              {
                from: "creating",
                to: "creating",
                event: "FIELD_CHANGED",
                effects: [],
              },
              {
                from: "editing",
                to: "editing",
                event: "GLOBAL_VARIABLE_SET",
                effects: [],
              },
              {
                from: "editing",
                to: "editing",
                event: "VIOLATION_DETECTED",
                effects: [],
              },
              {
                from: "editing",
                to: "editing",
                event: "FIELD_CHANGED",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "AlertsPage",
          path: "/alerts",
          isInitial: true,
          traits: [
            {
              ref: "AlertThresholdControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-device-mgmt - Device Management
// ============================================================================

/**
 * std-device-mgmt - Device lifecycle management.
 * States: browsing -> viewing -> configuring
 *
 * UI: Teal IoT theme. Main view uses stats + meter + searchable data-grid cards.
 * Modal for device detail with firmware info, configure via form.
 */
export const DEVICE_MGMT_BEHAVIOR: BehaviorSchema = {
  name: "std-device-mgmt",
  version: "1.0.0",
  description: "Device management with status and firmware tracking",
  orbitals: [
    {
      name: "DeviceMgmtOrbital",
      theme: {
        name: "iot-teal",
        tokens: {
          colors: {
            primary: "#0d9488",
            "primary-hover": "#0f766e",
            "primary-foreground": "#ffffff",
            accent: "#06b6d4",
            "accent-foreground": "#ffffff",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "Device",
        persistence: "persistent",
        collection: "devices",
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
            name: "type",
            type: "string",
            default: "",
          },
          {
            name: "status",
            type: "string",
            default: "offline",
          },
          {
            name: "lastSeen",
            type: "string",
            default: "",
          },
          {
            name: "firmware",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "DeviceMgmtControl",
          linkedEntity: "Device",
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
                name: "configuring",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "VIEW",
                name: "View Device",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CONFIGURE",
                name: "Configure Device",
              },
              {
                key: "SAVE_CONFIG",
                name: "Save Config",
                payloadSchema: [
                  {
                    name: "name",
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
              {
                key: "GLOBAL_VARIABLE_SET",
                name: "GLOBAL VARIABLE SET",
              },
              {
                key: "VIOLATION_DETECTED",
                name: "VIOLATION DETECTED",
              },
              {
                key: "FIELD_CHANGED",
                name: "FIELD CHANGED",
              },
              {
                key: "LOAD_MORE",
                name: "Load More",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "Device"],
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
                              content: "Devices",
                            },
                            {
                              type: "button",
                              label: "Add Device",
                              icon: "plus",
                              variant: "primary",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Devices",
                              icon: "server",
                              entity: "Device",
                            },
                            {
                              type: "stat-display",
                              label: "Online",
                              icon: "wifi",
                              value: 0,
                            },
                            {
                              type: "stat-display",
                              label: "Offline",
                              icon: "wifi-off",
                              value: 0,
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Search devices...",
                          entity: "Device",
                        },
                        {
                          type: "data-grid",
                          entity: "Device",
                          cols: 3,
                          gap: "md",
                          selectable: true,
                          infiniteScroll: true,
                          loadMoreEvent: "LOAD_MORE",
                          hasMore: true,
                          itemActions: [
                            {
                              label: "View Details",
                              event: "VIEW",
                              icon: "eye",
                            },
                            {
                              label: "Restart",
                              event: "VIEW",
                              icon: "refresh-cw",
                            },
                            {
                              label: "Remove",
                              event: "VIEW",
                              icon: "trash-2",
                            },
                          ],
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
                                          name: "smartphone",
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
                                  content: "@entity.lastSeen",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "empty-state",
                          icon: "cpu",
                          title: "No devices registered",
                          description: "Add your first device to start monitoring your fleet.",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "VIEW",
                effects: [
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
                                  name: "router",
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.name",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "ghost",
                              action: "CLOSE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "lg",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Type",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.type",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Status",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.status",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Firmware",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.firmware",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "xs",
                              children: [
                                {
                                  type: "typography",
                                  variant: "caption",
                                  content: "Last Seen",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.lastSeen",
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
                          justify: "end",
                          children: [
                            {
                              type: "button",
                              label: "Configure",
                              icon: "settings",
                              variant: "primary",
                              action: "CONFIGURE",
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
                to: "configuring",
                event: "CONFIGURE",
                effects: [
                  ["fetch", "Device"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "form-section",
                      entity: "Device",
                      submitEvent: "SAVE_CONFIG",
                      cancelEvent: "CANCEL",
                      fields: [
                        {
                          name: "name",
                          type: "string",
                        },
                        {
                          name: "type",
                          type: "string",
                        },
                        {
                          name: "status",
                          type: "string",
                        },
                        {
                          name: "lastSeen",
                          type: "string",
                        },
                        {
                          name: "firmware",
                          type: "string",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "configuring",
                to: "browsing",
                event: "SAVE_CONFIG",
                effects: [
                  ["set", "@entity.name", "@payload.name"],
                  ["render-ui", "modal", null],
                  ["fetch", "Device"],
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
                              content: "Devices",
                            },
                            {
                              type: "button",
                              label: "Add Device",
                              icon: "plus",
                              variant: "primary",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Devices",
                              icon: "server",
                              entity: "Device",
                            },
                            {
                              type: "stat-display",
                              label: "Online",
                              icon: "wifi",
                              value: 0,
                            },
                            {
                              type: "stat-display",
                              label: "Offline",
                              icon: "wifi-off",
                              value: 0,
                            },
                          ],
                        },
                        {
                          type: "search-input",
                          placeholder: "Search devices...",
                          entity: "Device",
                        },
                        {
                          type: "data-grid",
                          entity: "Device",
                          cols: 3,
                          gap: "md",
                          selectable: true,
                          infiniteScroll: true,
                          loadMoreEvent: "LOAD_MORE",
                          hasMore: true,
                          itemActions: [
                            {
                              label: "View Details",
                              event: "VIEW",
                              icon: "eye",
                            },
                            {
                              label: "Restart",
                              event: "VIEW",
                              icon: "refresh-cw",
                            },
                            {
                              label: "Remove",
                              event: "VIEW",
                              icon: "trash-2",
                            },
                          ],
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
                                          name: "smartphone",
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
                                  content: "@entity.lastSeen",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "empty-state",
                          icon: "cpu",
                          title: "No devices registered",
                          description: "Add your first device to start monitoring your fleet.",
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
                from: "configuring",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "configuring",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "configuring",
                to: "configuring",
                event: "GLOBAL_VARIABLE_SET",
                effects: [],
              },
              {
                from: "configuring",
                to: "configuring",
                event: "VIOLATION_DETECTED",
                effects: [],
              },
              {
                from: "configuring",
                to: "configuring",
                event: "FIELD_CHANGED",
                effects: [],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "LOAD_MORE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "DevicesPage",
          path: "/devices",
          isInitial: true,
          traits: [
            {
              ref: "DeviceMgmtControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All IoT Behaviors
// ============================================================================

export const IOT_BEHAVIORS: BehaviorSchema[] = [
  SENSOR_FEED_BEHAVIOR,
  ALERT_THRESHOLD_BEHAVIOR,
  DEVICE_MGMT_BEHAVIOR,
];
