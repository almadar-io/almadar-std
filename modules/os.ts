/**
 * OS Module - Operating System Event Watchers
 *
 * Provides operators for registering OS-level event watchers that
 * translate kernel events (inotify, SIGCHLD, socket, timerfd) into
 * Orb events on the EventBus. Used by trigger traits to interrupt
 * agents with verified ground truth.
 *
 * All operators have side effects (they register watchers).
 * Server-side only (no-op on client).
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const OS_OPERATORS: Record<string, StdOperatorMeta> = {
  'os/watch-files': {
    module: 'os',
    category: 'std-os',
    minArity: 1,
    maxArity: 2,
    description: 'Register file system watcher. Emits OS_FILE_MODIFIED, OS_FILE_CREATED, OS_FILE_DELETED events with { path, name, dir, timestamp } payload.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'glob', type: 'string', description: 'Glob pattern to watch (e.g., "**/*.orb")' },
      { name: 'options', type: 'object', description: 'Optional config: { recursive, ignoreInitial, debounceMs }', optional: true },
    ],
    example: '["os/watch-files", "**/*.orb"]',
  },
  'os/watch-process': {
    module: 'os',
    category: 'std-os',
    minArity: 1,
    maxArity: 2,
    description: 'Register process monitor. Emits OS_PROCESS_EXITED, OS_PROCESS_STARTED events with { pid, name, exitCode, signal, args, duration } payload.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'name', type: 'string', description: 'Process name to monitor (e.g., "orbital")' },
      { name: 'subcommand', type: 'string', description: 'Optional subcommand filter (e.g., "validate")', optional: true },
    ],
    example: '["os/watch-process", "orbital", "validate"]',
  },
  'os/watch-port': {
    module: 'os',
    category: 'std-os',
    minArity: 1,
    maxArity: 2,
    description: 'Register port monitor. Emits OS_PORT_OPENED, OS_PORT_CLOSED events with { port, protocol, pid, address } payload.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'port', type: 'number', description: 'Port number to monitor' },
      { name: 'protocol', type: 'string', description: 'Protocol: "tcp" or "udp" (default: "tcp")', optional: true },
    ],
    example: '["os/watch-port", 3000]',
  },
  'os/watch-http': {
    module: 'os',
    category: 'std-os',
    minArity: 1,
    maxArity: 2,
    description: 'Register HTTP response interceptor. Emits OS_HTTP_RESPONSE events with { url, method, status, headers, body, duration } payload.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'urlPattern', type: 'string', description: 'URL pattern to intercept (e.g., "https://api.example.com/*")' },
      { name: 'method', type: 'string', description: 'HTTP method filter (e.g., "POST")', optional: true },
    ],
    example: '["os/watch-http", "https://api.example.com/*", "POST"]',
  },
  'os/watch-cron': {
    module: 'os',
    category: 'std-os',
    minArity: 1,
    maxArity: 1,
    description: 'Register cron schedule. Emits OS_CRON_FIRE events with { expression, timestamp } payload.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'expression', type: 'string', description: 'Cron expression (e.g., "*/5 * * * *" for every 5 minutes)' },
    ],
    example: '["os/watch-cron", "0 */6 * * *"]',
  },
  'os/watch-signal': {
    module: 'os',
    category: 'std-os',
    minArity: 1,
    maxArity: 1,
    description: 'Register OS signal handler. Emits OS_SIGNAL_USR1, OS_SIGNAL_HUP, etc. with { pid, timestamp } payload.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'signal', type: 'string', description: 'Signal name: "SIGUSR1", "SIGUSR2", "SIGHUP", "SIGTERM"' },
    ],
    example: '["os/watch-signal", "SIGUSR1"]',
  },
  'os/watch-env': {
    module: 'os',
    category: 'std-os',
    minArity: 1,
    maxArity: 1,
    description: 'Register environment variable watcher. Emits OS_ENV_CHANGED events with { variable, oldValue, newValue } payload.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'variable', type: 'string', description: 'Environment variable name to watch' },
    ],
    example: '["os/watch-env", "NODE_ENV"]',
  },
  'os/debounce': {
    module: 'os',
    category: 'std-os',
    minArity: 2,
    maxArity: 2,
    description: 'Configure debounce interval for an OS event type. Prevents trigger storms during rapid changes.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'ms', type: 'number', description: 'Debounce interval in milliseconds' },
      { name: 'eventType', type: 'string', description: 'OS event type to debounce (e.g., "OS_FILE_MODIFIED")' },
    ],
    example: '["os/debounce", 500, "OS_FILE_MODIFIED"]',
  },
};
