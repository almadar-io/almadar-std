import type { StdOperatorMeta } from '../types.js';
import { BOOLEAN, BYTES, NUMBER, STRING, list, shape } from '../signature.js';
import { OS_DATA, OS_HANDLE, arg, osEffect } from './os-common.js';

export const OS_ENV_STDIO_OPERATORS: Record<string, StdOperatorMeta> = {
  'os/getenv': osEffect({
    answer: shape({ value: STRING }, ['value']),
    grant: [{ kind: 'env', name: 0 }],
    description: 'Read an environment variable (grant env). Success payload: { value? }; value is absent when the variable is unset.',
    params: [arg('name', STRING, 'Variable name')],
    example: '["os/getenv", "HOME", { "emit": { "success": "ENV_READ", "failure": "ENV_FAILED" } }]',
  }),
  'os/setenv': osEffect({
    answer: shape({}),
    grant: [{ kind: 'env', name: 0 }],
    description: 'Set an environment variable (grant env). Success payload: {}.',
    params: [arg('name', STRING, 'Variable name'), arg('value', STRING, 'Value')],
    example: '["os/setenv", "MODE", "dev", { "emit": { "success": "ENV_SET", "failure": "ENV_FAILED" } }]',
  }),
  'os/unsetenv': osEffect({
    answer: shape({}),
    grant: [{ kind: 'env', name: 0 }],
    description: 'Remove an environment variable (grant env). Success payload: {}.',
    params: [arg('name', STRING, 'Variable name')],
    example: '["os/unsetenv", "MODE", { "emit": { "success": "ENV_UNSET", "failure": "ENV_FAILED" } }]',
  }),
  'os/environ': osEffect({
    answer: shape({ names: list(STRING) }),
    grant: [],
    description: 'List environment variable names, never values (grant env). Success payload: { names }.',
    params: [],
    example: '["os/environ", { "emit": { "success": "ENV_LISTED", "failure": "ENV_FAILED" } }]',
  }),
  'os/watch-env': osEffect({
    answer: shape({}),
    events: shape({ name: STRING, value: STRING }),
    grant: [{ kind: 'env', name: 0 }],
    description: 'Watch an environment variable (grant env). Events are { name, value? }. The options object also takes debounceMs.',
    params: [arg('name', STRING, 'Environment variable name to watch')],
    stream: true,
    example: '["os/watch-env", "NODE_ENV", { "emit": { "success": "ENV_CHANGED", "failure": "WATCH_FAILED", "key": "node-env" } }]',
  }),
  'os/stdin-read': osEffect({
    answer: shape({ eof: BOOLEAN }),
    events: shape({ data: BYTES }),
    unrouted: shape({ data: BYTES, eof: BOOLEAN }),
    grant: [{ kind: 'stdio', access: 'in' }],
    description: 'Read standard input (grant stdio: in), at most count bytes per chunk. Keyed with an onMessage route, each chunk is an event { data: bytes } and the final answer is { eof: true }; otherwise one read answers { data, eof } with at most count bytes.',
    params: [arg('count', NUMBER, 'Maximum bytes per chunk', true)],
    stream: true,
    example: '["os/stdin-read", { "emit": { "success": "STDIN_CHUNK", "failure": "STDIN_FAILED", "key": "stdin" } }]',
  }),
  'os/stdout-write': osEffect({
    answer: shape({ bytes: NUMBER }),
    grant: [{ kind: 'stdio', access: 'out' }],
    description: 'Write to standard output (grant stdio: out). Success payload: { bytes }.',
    params: [arg('data', OS_DATA, 'Content to write')],
    example: '["os/stdout-write", "ZG9uZQ==", { "emit": { "success": "STDOUT_WRITTEN", "failure": "STDOUT_FAILED" } }]',
  }),
  'os/stderr-write': osEffect({
    answer: shape({ bytes: NUMBER }),
    grant: [{ kind: 'stdio', access: 'err' }],
    description: 'Write to standard error (grant stdio: err). Success payload: { bytes }.',
    params: [arg('data', OS_DATA, 'Content to write')],
    example: '["os/stderr-write", "ZmFpbGVk", { "emit": { "success": "STDERR_WRITTEN", "failure": "STDERR_FAILED" } }]',
  }),
  'os/isatty': osEffect({
    answer: shape({ ok: BOOLEAN }),
    grant: [],
    description: 'Whether a descriptor is a terminal (grant stdio). Success payload: { ok }.',
    params: [arg('fd', OS_HANDLE, 'File descriptor')],
    example: '["os/isatty", 1, { "emit": { "success": "TTY_CHECKED", "failure": "TTY_FAILED" } }]',
  }),
  'os/tty-size': osEffect({
    answer: shape({ rows: NUMBER, cols: NUMBER }),
    grant: [],
    description: 'Terminal size of a descriptor (grant stdio). Success payload: { rows, cols }.',
    params: [arg('fd', OS_HANDLE, 'File descriptor')],
    example: '["os/tty-size", 1, { "emit": { "success": "TTY_SIZED", "failure": "TTY_FAILED" } }]',
  }),
};
