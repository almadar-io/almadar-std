import type { StdOperatorMeta } from '../types.js';
import { NUMBER, STRING } from '../signature.js';
import { OS_DATA, OS_HANDLE, arg, osEffect } from './os-common.js';

export const OS_ENV_STDIO_OPERATORS: Record<string, StdOperatorMeta> = {
  'os/getenv': osEffect({
    description: 'Read an environment variable (grant env). Success payload: { value? }; value is absent when the variable is unset.',
    params: [arg('name', STRING, 'Variable name')],
    example: '["os/getenv", "HOME", { "emit": { "success": "ENV_READ", "failure": "ENV_FAILED" } }]',
  }),
  'os/setenv': osEffect({
    description: 'Set an environment variable (grant env). Success payload: {}.',
    params: [arg('name', STRING, 'Variable name'), arg('value', STRING, 'Value')],
    example: '["os/setenv", "MODE", "dev", { "emit": { "success": "ENV_SET", "failure": "ENV_FAILED" } }]',
  }),
  'os/unsetenv': osEffect({
    description: 'Remove an environment variable (grant env). Success payload: {}.',
    params: [arg('name', STRING, 'Variable name')],
    example: '["os/unsetenv", "MODE", { "emit": { "success": "ENV_UNSET", "failure": "ENV_FAILED" } }]',
  }),
  'os/environ': osEffect({
    description: 'List environment variable names, never values (grant env). Success payload: { names }.',
    params: [],
    example: '["os/environ", { "emit": { "success": "ENV_LISTED", "failure": "ENV_FAILED" } }]',
  }),
  'os/watch-env': osEffect({
    description: 'Watch an environment variable (grant env). Events are { name, value? }. The options object also takes debounceMs.',
    params: [arg('name', STRING, 'Environment variable name to watch')],
    stream: true,
    example: '["os/watch-env", "NODE_ENV", { "emit": { "success": "ENV_CHANGED", "failure": "WATCH_FAILED", "key": "node-env" } }]',
  }),
  'os/stdin-read': osEffect({
    description: 'Read standard input (grant stdio: in). Events are { data: bytes }; the final answer is { eof }.',
    params: [arg('count', NUMBER, 'Maximum bytes per event', true)],
    stream: true,
    example: '["os/stdin-read", { "emit": { "success": "STDIN_CHUNK", "failure": "STDIN_FAILED", "key": "stdin" } }]',
  }),
  'os/stdout-write': osEffect({
    description: 'Write to standard output (grant stdio: out). Success payload: { bytes }.',
    params: [arg('data', OS_DATA, 'Content to write')],
    example: '["os/stdout-write", "ZG9uZQ==", { "emit": { "success": "STDOUT_WRITTEN", "failure": "STDOUT_FAILED" } }]',
  }),
  'os/stderr-write': osEffect({
    description: 'Write to standard error (grant stdio: err). Success payload: { bytes }.',
    params: [arg('data', OS_DATA, 'Content to write')],
    example: '["os/stderr-write", "ZmFpbGVk", { "emit": { "success": "STDERR_WRITTEN", "failure": "STDERR_FAILED" } }]',
  }),
  'os/isatty': osEffect({
    description: 'Whether a descriptor is a terminal (grant stdio). Success payload: { ok }.',
    params: [arg('fd', OS_HANDLE, 'File descriptor')],
    example: '["os/isatty", 1, { "emit": { "success": "TTY_CHECKED", "failure": "TTY_FAILED" } }]',
  }),
  'os/tty-size': osEffect({
    description: 'Terminal size of a descriptor (grant stdio). Success payload: { rows, cols }.',
    params: [arg('fd', OS_HANDLE, 'File descriptor')],
    example: '["os/tty-size", 1, { "emit": { "success": "TTY_SIZED", "failure": "TTY_FAILED" } }]',
  }),
};
