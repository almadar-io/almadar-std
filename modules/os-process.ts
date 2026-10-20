import type { StdOperatorMeta } from '../types.js';
import { BOOLEAN, STRING, mapOf, nullable, shape } from '../signature.js';
import { OS_HANDLE, OS_PATH, OS_SIGNAL, OS_STREAM_MODE, OS_STRING_LIST, arg, osEffect } from './os-common.js';

const SPAWN_CONFIG = shape({
  cwd: nullable(OS_PATH),
  env: nullable(mapOf(STRING, STRING)),
  stdin: OS_STREAM_MODE,
  stdout: OS_STREAM_MODE,
  stderr: OS_STREAM_MODE,
  detached: BOOLEAN,
});

export const OS_PROCESS_OPERATORS: Record<string, StdOperatorMeta> = {
  'os/spawn': osEffect({
    description: 'Start a child process (grant exec; the command is matched against the grant by exact string and never run through a shell). Success payload: { pid, stdin?, stdout?, stderr? }; a piped stream is an fd read or written with os/read and os/write. A detached child runs in its own session and process group and outlives the program that started it; it takes no piped stream.',
    params: [arg('command', STRING, 'Command, matched exactly against the exec grant'), arg('args', OS_STRING_LIST, 'Arguments'), arg('config', SPAWN_CONFIG, 'Working directory, environment, stdio modes (inherit, pipe or null) and whether the child is detached')],
    example: '["os/spawn", "git", ["status"], { "cwd": null, "env": null, "stdin": "null", "stdout": "pipe", "stderr": "inherit", "detached": false }, { "emit": { "success": "PROC_STARTED", "failure": "PROC_FAILED" } }]',
  }),
  'os/wait': osEffect({
    description: 'Wait for a child process to end (grant exec). Success payload: { code?, signal? }.',
    params: [arg('pid', OS_HANDLE, 'Process id from os/spawn')],
    example: '["os/wait", "@payload.pid", { "emit": { "success": "PROC_ENDED", "failure": "PROC_FAILED" } }]',
  }),
  'os/kill': osEffect({
    description: 'Send a signal to a child process (grant exec). Success payload: {}.',
    params: [arg('pid', OS_HANDLE, 'Process id'), arg('signal', OS_SIGNAL, 'Signal name: TERM, KILL, INT, HUP, QUIT, USR1, USR2, STOP or CONT')],
    example: '["os/kill", "@payload.pid", "TERM", { "emit": { "success": "PROC_SIGNALLED", "failure": "PROC_FAILED" } }]',
  }),
  'os/pid': osEffect({
    description: 'Read the host process id (grant exec). Success payload: { pid }.',
    params: [],
    example: '["os/pid", { "emit": { "success": "PID_READ", "failure": "PROC_FAILED" } }]',
  }),
  'os/ppid': osEffect({
    description: 'Read the parent process id (grant exec). Success payload: { pid }.',
    params: [],
    example: '["os/ppid", { "emit": { "success": "PPID_READ", "failure": "PROC_FAILED" } }]',
  }),
  'os/current-exe': osEffect({
    description: 'Read the absolute path of the running host binary, so a program can locate the binaries installed beside it (no grant: a fact of the process itself, like os/pid). Success payload: { path }.',
    params: [],
    example: '["os/current-exe", { "emit": { "success": "EXE_READ", "failure": "PROC_FAILED" } }]',
  }),
  'os/watch-process': osEffect({
    description: 'Watch a process by name (grant exec). Events are { pid, name, exitCode, signal, args, duration } as processes start and exit. The options object also takes debounceMs.',
    params: [arg('name', STRING, 'Process name to monitor (e.g., "orbital")'), arg('args', OS_STRING_LIST, 'Arguments the process must carry, e.g. ["validate"]')],
    stream: true,
    example: '["os/watch-process", "orbital", ["validate"], { "emit": { "success": "PROC_EVENT", "failure": "WATCH_FAILED", "key": "orbital-proc" } }]',
  }),
  'os/watch-signal': osEffect({
    description: 'Receive an OS signal (grant exec). Events are { signal }.',
    params: [arg('signal', OS_SIGNAL, 'Signal name: USR1, USR2, HUP or TERM')],
    stream: true,
    example: '["os/watch-signal", "USR1", { "emit": { "success": "SIGNAL_SEEN", "failure": "WATCH_FAILED", "key": "usr1" } }]',
  }),
};

