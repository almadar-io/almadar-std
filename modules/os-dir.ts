import type { StdOperatorMeta } from '../types.js';
import { BOOLEAN, NUMBER, STRING } from '../signature.js';
import { OS_PATH, OS_PERMISSION_BITS, arg, osEffect } from './os-common.js';

export const OS_DIR_OPERATORS: Record<string, StdOperatorMeta> = {
  'os/mkdir': osEffect({
    description: 'Create a directory (grant fs: create). Success payload: {}.',
    params: [arg('path', OS_PATH, 'Directory path'), arg('recursive', BOOLEAN, 'Create missing parents', true), arg('mode', OS_PERMISSION_BITS, 'Permission bits', true)],
    example: '["os/mkdir", "/data/out", true, { "emit": { "success": "DIR_MADE", "failure": "DIR_FAILED" } }]',
  }),
  'os/rmdir': osEffect({
    description: 'Remove a directory (grant fs: remove). Success payload: {}.',
    params: [arg('path', OS_PATH, 'Directory path'), arg('recursive', BOOLEAN, 'Remove contents too', true)],
    example: '["os/rmdir", "/data/tmp", { "emit": { "success": "DIR_REMOVED", "failure": "DIR_FAILED" } }]',
  }),
  'os/list-dir': osEffect({
    description: 'List a directory (grant fs: read). Success payload: { entries: [{ name, kind }] }.',
    params: [arg('path', OS_PATH, 'Directory path')],
    example: '["os/list-dir", "/data", { "emit": { "success": "DIR_LISTED", "failure": "DIR_FAILED" } }]',
  }),
  'os/glob': osEffect({
    description: 'Expand a glob pattern (grant fs: read). The pattern may be anchored ({ anchor, path }); a computed anchored pattern passes under a narrow anchored grant, and the host drops every match the grants do not cover. Success payload: { paths }: absolute for a plain pattern, relative to the anchor for an anchored one.',
    params: [arg('pattern', OS_PATH, 'Glob pattern')],
    example: '["os/glob", "/data/**/*.json", { "emit": { "success": "GLOBBED", "failure": "DIR_FAILED" } }]',
  }),
  'os/mktemp': osEffect({
    description: 'Create a unique temporary file (grant fs: create). Success payload: { path }.',
    params: [arg('prefix', STRING, 'File name prefix'), arg('dir', OS_PATH, 'Parent directory', true)],
    example: '["os/mktemp", "job-", "/data/tmp", { "emit": { "success": "TEMP_MADE", "failure": "DIR_FAILED" } }]',
  }),
  'os/realpath': osEffect({
    description: 'Resolve a path to its canonical form (grant fs: meta). Success payload: { path }.',
    params: [arg('path', OS_PATH, 'Path to resolve')],
    example: '["os/realpath", "/data/../data/a.txt", { "emit": { "success": "PATH_RESOLVED", "failure": "DIR_FAILED" } }]',
  }),
  'os/cwd': osEffect({
    description: 'Read the working directory (grant fs: meta). Success payload: { path }.',
    params: [],
    example: '["os/cwd", { "emit": { "success": "CWD_READ", "failure": "DIR_FAILED" } }]',
  }),
  'os/chdir': osEffect({
    description: 'Change the working directory (grant fs: meta). Success payload: {}.',
    params: [arg('path', OS_PATH, 'Directory path')],
    example: '["os/chdir", "/data", { "emit": { "success": "CWD_CHANGED", "failure": "DIR_FAILED" } }]',
  }),
  'os/stat': osEffect({
    description: 'Stat a path, following links (grant fs: meta). Success payload: { kind, size, mode, uid, gid, atime, mtime, ctime }.',
    params: [arg('path', OS_PATH, 'Path')],
    example: '["os/stat", "/data/a.txt", { "emit": { "success": "STATTED", "failure": "DIR_FAILED" } }]',
  }),
  'os/lstat': osEffect({
    description: 'Stat a path without following links (grant fs: meta). Success payload: { kind, size, mode, uid, gid, atime, mtime, ctime }.',
    params: [arg('path', OS_PATH, 'Path')],
    example: '["os/lstat", "/data/a.txt", { "emit": { "success": "STATTED", "failure": "DIR_FAILED" } }]',
  }),
  'os/access': osEffect({
    description: 'Check access to a path (grant fs: meta). Success payload: { ok }.',
    params: [arg('path', OS_PATH, 'Path'), arg('mode', STRING, 'Access to test', true)],
    example: '["os/access", "/data/a.txt", { "emit": { "success": "ACCESS_CHECKED", "failure": "DIR_FAILED" } }]',
  }),
  'os/exists': osEffect({
    description: 'Check that a path exists (grant fs: meta). Success payload: { ok }.',
    params: [arg('path', OS_PATH, 'Path'), arg('mode', STRING, 'Access to test', true)],
    example: '["os/exists", "/data/a.txt", { "emit": { "success": "EXISTENCE_CHECKED", "failure": "DIR_FAILED" } }]',
  }),
  'os/chmod': osEffect({
    description: 'Change permission bits (grant fs: meta). Success payload: {}.',
    params: [arg('path', OS_PATH, 'Path'), arg('mode', OS_PERMISSION_BITS, 'Permission bits')],
    example: '["os/chmod", "/data/a.txt", 420, { "emit": { "success": "MODE_SET", "failure": "DIR_FAILED" } }]',
  }),
  'os/chown': osEffect({
    description: 'Change owner (grant fs: meta). Success payload: {}.',
    params: [arg('path', OS_PATH, 'Path'), arg('uid', NUMBER, 'User id'), arg('gid', NUMBER, 'Group id')],
    example: '["os/chown", "/data/a.txt", 1000, 1000, { "emit": { "success": "OWNER_SET", "failure": "DIR_FAILED" } }]',
  }),
  'os/utimes': osEffect({
    description: 'Set access and modification times (grant fs: meta). Success payload: {}.',
    params: [arg('path', OS_PATH, 'Path'), arg('atime', NUMBER, 'Access time'), arg('mtime', NUMBER, 'Modification time')],
    example: '["os/utimes", "/data/a.txt", 1700000000, 1700000000, { "emit": { "success": "TIMES_SET", "failure": "DIR_FAILED" } }]',
  }),
};
