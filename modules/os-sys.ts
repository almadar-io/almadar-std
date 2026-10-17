import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';
import { BOOLEAN, NUMBER, STRING, formatOperatorType, list, mapOf, nullable, shape } from '../signature.js';
import { arg, osEffect, OS_PATH } from './os-common.js';

const SYSTEM_READINGS: Record<string, { grant: string; reading: string }> = {
  'os/cpu-usage': { grant: 'cpu', reading: 'CPU usage, sampled across two asks without blocking' },
  'os/memory-info': { grant: 'memory', reading: 'memory totals and usage' },
  'os/uptime': { grant: 'cpu', reading: 'system uptime' },
  'os/load-avg': { grant: 'cpu', reading: 'load averages' },
  'os/hostname': { grant: 'identity', reading: 'the host name' },
  'os/uname': { grant: 'identity', reading: 'kernel and platform identification' },
  'os/mounts': { grant: 'disk', reading: 'mounted file systems' },
  'os/disk-io': { grant: 'disk', reading: 'disk I/O counters' },
  'os/network-interfaces': { grant: 'network', reading: 'network interfaces and their addresses' },
  'os/network-stats': { grant: 'network', reading: 'network traffic counters' },
  'os/network-connected': { grant: 'network', reading: 'whether the host is connected' },
  'os/default-gateway': { grant: 'network', reading: 'the default gateway' },
  'os/battery-status': { grant: 'power-state', reading: 'battery state' },
  'os/ac-power': { grant: 'power-state', reading: 'whether the host is on AC power' },
  'os/thermal-zones': { grant: 'power-state', reading: 'thermal zone temperatures' },
};

const NET_COUNTERS = shape({ rxBytes: NUMBER, txBytes: NUMBER, rxPackets: NUMBER, txPackets: NUMBER, rxErrors: NUMBER, txErrors: NUMBER });

export const OS_SYS_PAYLOADS: Record<string, OperatorTypeRef> = {
  'os/cpu-usage': shape({ percent: NUMBER }),
  'os/memory-info': shape({ total: NUMBER, available: NUMBER, used: NUMBER, usedPercent: NUMBER }),
  'os/uptime': shape({ seconds: NUMBER }),
  'os/load-avg': shape({ one: NUMBER, five: NUMBER, fifteen: NUMBER }),
  'os/hostname': shape({ hostname: STRING }),
  'os/uname': shape({ sysname: STRING, nodename: STRING, release: STRING, version: STRING, machine: STRING }),
  'os/disk-usage': shape({ path: STRING, total: NUMBER, used: NUMBER, available: NUMBER, usedPercent: NUMBER, filesystem: STRING }),
  'os/mounts': shape({ mounts: list(shape({ device: STRING, mountPoint: STRING, filesystem: STRING, options: list(STRING) })) }),
  'os/disk-io': shape({ devices: list(shape({ device: STRING, readsCompleted: NUMBER, writesCompleted: NUMBER, readBytes: NUMBER, writeBytes: NUMBER })) }),
  'os/network-interfaces': shape({ interfaces: list(shape({ name: STRING, mac: STRING, up: BOOLEAN, running: BOOLEAN })) }),
  'os/network-stats': shape({ interfaces: mapOf(STRING, NET_COUNTERS) }),
  'os/network-connected': shape({ connected: BOOLEAN }),
  'os/default-gateway': shape({ gateway: nullable(STRING) }),
  'os/battery-status': shape({ present: BOOLEAN, percentage: NUMBER, status: STRING, timeToEmpty: nullable(NUMBER), timeToFull: nullable(NUMBER) }),
  'os/ac-power': shape({ onAc: BOOLEAN }),
  'os/thermal-zones': shape({ zones: list(shape({ name: STRING, temperature: NUMBER, type: STRING })) }),
};

function payloadNote(op: string): string {
  return `Success payload: ${formatOperatorType(OS_SYS_PAYLOADS[op])}; unavailable data fails unsupported.`;
}

function reading(op: string, def: { grant: string; reading: string }): StdOperatorMeta {
  return osEffect({
    description: `Read ${def.reading} (grant sys: ${def.grant}). ${payloadNote(op)}`,
    params: [],
    example: `["${op}", { "emit": { "success": "SYSTEM_READ", "failure": "SYSTEM_FAILED" } }]`,
  });
}

export const OS_SYS_OPERATORS: Record<string, StdOperatorMeta> = {
  ...Object.fromEntries(Object.entries(SYSTEM_READINGS).map(([op, def]) => [op, reading(op, def)])),
  'os/disk-usage': osEffect({
    description: `Read disk usage for a path (grant sys: disk). ${payloadNote('os/disk-usage')}`,
    params: [arg('path', OS_PATH, 'Path on the volume to measure')],
    example: '["os/disk-usage", "/data", { "emit": { "success": "SYSTEM_READ", "failure": "SYSTEM_FAILED" } }]',
  }),
};
