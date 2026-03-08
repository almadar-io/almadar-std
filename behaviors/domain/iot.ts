/**
 * IoT Domain Behaviors
 *
 * Standard behaviors for sensor data feeds, alert thresholds,
 * and device management.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-sensor-feed - Sensor Data Dashboard
// ============================================================================

/**
 * std-sensor-feed - Sensor data monitoring dashboard.
 * States: browsing -> viewing -> configuring
 */
export const SENSOR_FEED_BEHAVIOR: OrbitalSchema = {
  name: 'std-sensor-feed',
  version: '1.0.0',
  description: 'Sensor data monitoring and visualization',
  orbitals: [
    {
      name: 'SensorFeedOrbital',
      entity: {
        name: 'SensorReading',
        persistence: 'persistent',
        collection: 'sensor_readings',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'sensorId', type: 'string', default: '' },
          { name: 'value', type: 'number', default: 0 },
          { name: 'unit', type: 'string', default: '' },
          { name: 'timestamp', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'normal' },
        ],
      },
      traits: [
        {
          name: 'SensorFeedControl',
          linkedEntity: 'SensorReading',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'configuring' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW', name: 'View Sensor', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'CONFIGURE', name: 'Configure Sensor' },
              { key: 'SAVE_CONFIG', name: 'Save Config', payloadSchema: [{ name: 'unit', type: 'string', required: true }] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'SensorReading'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Sensor Dashboard' }],
                  ['render-ui', 'main', { type: 'stats', entity: 'SensorReading' }],
                  ['render-ui', 'main', { type: 'line-chart',
                    data: [],
                  }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'SensorReading',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: '@entity.id',
                    actions: [
                      { label: 'Configure', event: 'CONFIGURE' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                  ['render-ui', 'modal', { type: 'meter',
                    value: '@entity.value',
                    label: 'Current Value',
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'configuring',
                event: 'CONFIGURE',
                effects: [
                  ['fetch', 'SensorReading'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'SensorReading',
                    submitEvent: 'SAVE_CONFIG',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'configuring',
                to: 'browsing',
                event: 'SAVE_CONFIG',
                effects: [
                  ['set', '@entity.unit', '@payload.unit'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'SensorReading'],
                  ['render-ui', 'main', { type: 'stats', entity: 'SensorReading' }],
                  ['render-ui', 'main', { type: 'line-chart',
                    data: [],
                  }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'SensorReading',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'configuring',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'configuring',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'SensorPage',
          path: '/sensors',
          isInitial: true,
          traits: [{ ref: 'SensorFeedControl' }],
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
 */
export const ALERT_THRESHOLD_BEHAVIOR: OrbitalSchema = {
  name: 'std-alert-threshold',
  version: '1.0.0',
  description: 'Alert threshold configuration for sensors',
  orbitals: [
    {
      name: 'AlertThresholdOrbital',
      entity: {
        name: 'AlertRule',
        persistence: 'persistent',
        collection: 'alert_rules',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'sensorId', type: 'string', default: '' },
          { name: 'metric', type: 'string', default: '' },
          { name: 'threshold', type: 'number', default: 0 },
          { name: 'operator', type: 'string', default: 'gt' },
          { name: 'isActive', type: 'boolean', default: true },
        ],
      },
      traits: [
        {
          name: 'AlertThresholdControl',
          linkedEntity: 'AlertRule',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'creating' },
              { name: 'editing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'CREATE', name: 'New Alert Rule' },
              { key: 'EDIT', name: 'Edit Rule', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'SAVE', name: 'Save Rule', payloadSchema: [{ name: 'metric', type: 'string', required: true }, { name: 'threshold', type: 'number', required: true }] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'AlertRule'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Alert Rules',
                    actions: [{ label: 'Create', event: 'CREATE' }],
                  }],
                  ['render-ui', 'main', { type: 'stats', entity: 'AlertRule' }],
                  ['render-ui', 'main', { type: 'meter', value: 0, label: 'Threshold Level' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'AlertRule',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'creating',
                event: 'CREATE',
                effects: [
                  ['fetch', 'AlertRule'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'AlertRule',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['set', '@entity.metric', '@payload.metric'],
                  ['set', '@entity.threshold', '@payload.threshold'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'AlertRule'],
                  ['render-ui', 'main', { type: 'stats', entity: 'AlertRule' }],
                  ['render-ui', 'main', { type: 'meter', value: 0, label: 'Threshold Level' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'AlertRule',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'browsing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'AlertRule'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'AlertRule',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['set', '@entity.metric', '@payload.metric'],
                  ['set', '@entity.threshold', '@payload.threshold'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'AlertRule'],
                  ['render-ui', 'main', { type: 'stats', entity: 'AlertRule' }],
                  ['render-ui', 'main', { type: 'meter', value: 0, label: 'Threshold Level' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'AlertRule',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'AlertsPage',
          path: '/alerts',
          isInitial: true,
          traits: [{ ref: 'AlertThresholdControl' }],
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
 */
export const DEVICE_MGMT_BEHAVIOR: OrbitalSchema = {
  name: 'std-device-mgmt',
  version: '1.0.0',
  description: 'Device management with status and firmware tracking',
  orbitals: [
    {
      name: 'DeviceMgmtOrbital',
      entity: {
        name: 'Device',
        persistence: 'persistent',
        collection: 'devices',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'type', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'offline' },
          { name: 'lastSeen', type: 'string', default: '' },
          { name: 'firmware', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'DeviceMgmtControl',
          linkedEntity: 'Device',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'configuring' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW', name: 'View Device', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'CONFIGURE', name: 'Configure Device' },
              { key: 'SAVE_CONFIG', name: 'Save Config', payloadSchema: [{ name: 'name', type: 'string', required: true }] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Device'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Devices' }],
                  ['render-ui', 'main', { type: 'stats', entity: 'Device' }],
                  ['render-ui', 'main', { type: 'meter', value: 0, label: 'Online Devices' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Device',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: '@entity.name',
                    actions: [
                      { label: 'Configure', event: 'CONFIGURE' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'configuring',
                event: 'CONFIGURE',
                effects: [
                  ['fetch', 'Device'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'Device',
                    submitEvent: 'SAVE_CONFIG',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'configuring',
                to: 'browsing',
                event: 'SAVE_CONFIG',
                effects: [
                  ['set', '@entity.name', '@payload.name'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'Device'],
                  ['render-ui', 'main', { type: 'stats', entity: 'Device' }],
                  ['render-ui', 'main', { type: 'meter', value: 0, label: 'Online Devices' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Device',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'configuring',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'configuring',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'DevicesPage',
          path: '/devices',
          isInitial: true,
          traits: [{ ref: 'DeviceMgmtControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All IoT Behaviors
// ============================================================================

export const IOT_BEHAVIORS: OrbitalSchema[] = [
  SENSOR_FEED_BEHAVIOR,
  ALERT_THRESHOLD_BEHAVIOR,
  DEVICE_MGMT_BEHAVIOR,
];
