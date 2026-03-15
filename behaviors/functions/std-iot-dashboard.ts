/**
 * std-iot-dashboard
 *
 * IoT dashboard organism.
 * Composes: stdDisplay(SensorReading) + stdList(Device) + stdCircuitBreaker(DeviceAlert)
 *
 * Pages: /sensors (initial), /devices, /alerts
 *
 * @level organism
 * @family iot
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdDisplay } from './std-display.js';
import { stdList } from './std-list.js';
import { stdCircuitBreaker } from './std-circuit-breaker.js';

// ============================================================================
// Params
// ============================================================================

export interface StdIotDashboardParams {
  sensorReadingFields?: EntityField[];
  deviceFields?: EntityField[];
  deviceAlertFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultSensorReadingFields: EntityField[] = [
  { name: 'sensorId', type: 'string', required: true },
  { name: 'value', type: 'number', required: true },
  { name: 'unit', type: 'string' },
  { name: 'timestamp', type: 'string' },
];

const defaultDeviceFields: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'type', type: 'string', required: true },
  { name: 'status', type: 'string', default: 'offline' },
  { name: 'lastSeen', type: 'string' },
];

const defaultDeviceAlertFields: EntityField[] = [
  { name: 'deviceId', type: 'string', required: true },
  { name: 'severity', type: 'string', required: true },
  { name: 'message', type: 'string' },
  { name: 'acknowledged', type: 'boolean', default: false },
];

// ============================================================================
// Organism
// ============================================================================

export function stdIotDashboard(params: StdIotDashboardParams): OrbitalSchema {
  const sensorReadingFields = params.sensorReadingFields ?? defaultSensorReadingFields;
  const deviceFields = params.deviceFields ?? defaultDeviceFields;
  const deviceAlertFields = params.deviceAlertFields ?? defaultDeviceAlertFields;

  const sensorOrbital = stdDisplay({
    entityName: 'SensorReading',
    fields: sensorReadingFields,
    headerIcon: 'thermometer',
    pageTitle: 'Sensor Readings',
  });

  const deviceOrbital = stdList({
    entityName: 'Device',
    fields: deviceFields,
    headerIcon: 'cpu',
    pageTitle: 'Devices',
  });

  const alertOrbital = stdCircuitBreaker({
    entityName: 'DeviceAlert',
    fields: deviceAlertFields,
    headerIcon: 'bell',
  });

  const pages: ComposePage[] = [
    { name: 'SensorsPage', path: '/sensors', traits: ['SensorReadingDisplay'], isInitial: true },
    { name: 'DevicesPage', path: '/devices', traits: ['DeviceBrowse', 'DeviceCreate', 'DeviceEdit', 'DeviceView', 'DeviceDelete'] },
    { name: 'AlertsPage', path: '/alerts', traits: ['DeviceAlertCircuitBreaker'] },
  ];

  const connections: ComposeConnection[] = [];

  return compose(
    [sensorOrbital, deviceOrbital, alertOrbital],
    pages,
    connections,
    'IoT Dashboard',
  );
}
