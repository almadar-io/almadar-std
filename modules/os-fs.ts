import type { StdOperatorMeta } from '../types.js';
import { BOOLEAN, BYTES, NUMBER, STRING, lit, shape, union } from '../signature.js';
import { OS_DATA, OS_HANDLE, OS_PATH, OS_PERMISSION_BITS, arg, osEffect } from './os-common.js';

const SEEK_WHENCE = union(lit('set'), lit('cur'), lit('end'));

export const OS_FS_OPERATORS: Record<string, StdOperatorMeta> = {
  'os/read-file': osEffect({
    answer: shape({ data: BYTES }),
    grant: [{ kind: 'fs', access: 'read', path: 0 }],
    description: 'Read a whole file (grant fs: read). Success payload: { data: bytes }. Always bytes; decode text with bytes/to-string.',
    params: [arg('path', OS_PATH, 'File path')],
    example: '["os/read-file", "/data/in.txt", { "emit": { "success": "FILE_READ", "failure": "FILE_FAILED" } }]',
  }),
  'os/write-file': osEffect({
    answer: shape({ bytes: NUMBER }),
    grant: [{ kind: 'fs', access: 'write', path: 0 }],
    description: 'Write a whole file (grant fs: write, create). Success payload: { bytes }.',
    params: [arg('path', OS_PATH, 'File path'), arg('data', OS_DATA, 'Content to write'), arg('mode', OS_PERMISSION_BITS, 'Permission bits for a created file', true)],
    example: '["os/write-file", "/data/out.txt", "aGVsbG8=", { "emit": { "success": "FILE_WRITTEN", "failure": "FILE_FAILED" } }]',
  }),
  'os/append-file': osEffect({
    answer: shape({ bytes: NUMBER }),
    grant: [{ kind: 'fs', access: 'write', path: 0 }],
    description: 'Append to a file (grant fs: write). Success payload: { bytes }.',
    params: [arg('path', OS_PATH, 'File path'), arg('data', OS_DATA, 'Content to append')],
    example: '["os/append-file", "/data/log.txt", "bGluZQ==", { "emit": { "success": "LINE_APPENDED", "failure": "FILE_FAILED" } }]',
  }),
  'os/open': osEffect({
    answer: shape({ fd: NUMBER }),
    grant: [{ kind: 'fs-open', path: 0, flags: 1 }],
    description: 'Open a file and get a descriptor (grant fs). Success payload: { fd }. The host owns the descriptor and closes it at teardown.',
    params: [arg('path', OS_PATH, 'File path'), arg('flags', STRING, 'Open flags'), arg('mode', OS_PERMISSION_BITS, 'Permission bits for a created file', true)],
    example: '["os/open", "/data/in.txt", "r", { "emit": { "success": "FILE_OPENED", "failure": "FILE_FAILED" } }]',
  }),
  'os/close': osEffect({
    answer: shape({}),
    grant: [],
    description: 'Close a file descriptor or a socket handle (grant fs for a descriptor, net for a socket). Success payload: {}.',
    params: [arg('handle', OS_HANDLE, 'The fd or sock handle')],
    example: '["os/close", "@payload.fd", { "emit": { "success": "HANDLE_CLOSED", "failure": "FILE_FAILED" } }]',
  }),
  'os/read': osEffect({
    answer: shape({ data: BYTES, eof: BOOLEAN }),
    grant: [],
    description: 'Read up to count bytes from a descriptor (grant fs). Success payload: { data: bytes, eof }.',
    params: [arg('fd', OS_HANDLE, 'File descriptor'), arg('count', NUMBER, 'Maximum bytes to read')],
    example: '["os/read", "@payload.fd", 4096, { "emit": { "success": "CHUNK_READ", "failure": "FILE_FAILED" } }]',
  }),
  'os/write': osEffect({
    answer: shape({ bytes: NUMBER }),
    grant: [],
    description: 'Write to a descriptor (grant fs: write). Success payload: { bytes }.',
    params: [arg('fd', OS_HANDLE, 'File descriptor'), arg('data', OS_DATA, 'Content to write')],
    example: '["os/write", "@payload.fd", "hello", { "emit": { "success": "CHUNK_WRITTEN", "failure": "FILE_FAILED" } }]',
  }),
  'os/seek': osEffect({
    answer: shape({ offset: NUMBER }),
    grant: [],
    description: 'Move a descriptor position (grant fs). Success payload: { offset }.',
    params: [arg('fd', OS_HANDLE, 'File descriptor'), arg('offset', NUMBER, 'Byte offset'), arg('whence', SEEK_WHENCE, 'Reference point: set, cur or end')],
    example: '["os/seek", "@payload.fd", 0, "set", { "emit": { "success": "SOUGHT", "failure": "FILE_FAILED" } }]',
  }),
  'os/truncate': osEffect({
    answer: shape({}),
    grant: [{ kind: 'fs', access: 'write', path: 0 }],
    description: 'Truncate a file given by path or descriptor to size bytes (grant fs: write). Success payload: {}.',
    params: [arg('target', union(OS_PATH, OS_HANDLE), 'Path or fd'), arg('size', NUMBER, 'New size in bytes')],
    example: '["os/truncate", "/data/log.txt", 0, { "emit": { "success": "TRUNCATED", "failure": "FILE_FAILED" } }]',
  }),
  'os/fsync': osEffect({
    answer: shape({}),
    grant: [],
    description: 'Flush a descriptor to storage (grant fs). Success payload: {}.',
    params: [arg('fd', OS_HANDLE, 'File descriptor')],
    example: '["os/fsync", "@payload.fd", { "emit": { "success": "SYNCED", "failure": "FILE_FAILED" } }]',
  }),
  'os/copy': osEffect({
    answer: shape({}),
    grant: [{ kind: 'fs', access: 'read', path: 0 }, { kind: 'fs', access: 'create', path: 1 }],
    description: 'Copy a file (grant fs: read on from, write and create on to). Success payload: {}.',
    params: [arg('from', OS_PATH, 'Source path'), arg('to', OS_PATH, 'Destination path')],
    example: '["os/copy", "/data/a.txt", "/data/b.txt", { "emit": { "success": "COPIED", "failure": "FILE_FAILED" } }]',
  }),
  'os/rename': osEffect({
    answer: shape({}),
    grant: [{ kind: 'fs', access: 'remove', path: 0 }, { kind: 'fs', access: 'create', path: 1 }],
    description: 'Rename or move a file (grant fs: write, remove). Success payload: {}.',
    params: [arg('from', OS_PATH, 'Source path'), arg('to', OS_PATH, 'Destination path')],
    example: '["os/rename", "/data/a.txt", "/data/b.txt", { "emit": { "success": "RENAMED", "failure": "FILE_FAILED" } }]',
  }),
  'os/remove': osEffect({
    answer: shape({}),
    grant: [{ kind: 'fs', access: 'remove', path: 0 }],
    description: 'Remove a file (grant fs: remove). Success payload: {}.',
    params: [arg('path', OS_PATH, 'File path')],
    example: '["os/remove", "/data/old.txt", { "emit": { "success": "REMOVED", "failure": "FILE_FAILED" } }]',
  }),
  'os/link': osEffect({
    answer: shape({}),
    grant: [{ kind: 'fs', access: 'write', path: 0 }, { kind: 'fs', access: 'create', path: 1 }],
    description: 'Create a hard link (grant fs: create). Success payload: {}.',
    params: [arg('target', OS_PATH, 'Existing file'), arg('path', OS_PATH, 'New link path')],
    example: '["os/link", "/data/a.txt", "/data/b.txt", { "emit": { "success": "LINKED", "failure": "FILE_FAILED" } }]',
  }),
  'os/symlink': osEffect({
    answer: shape({}),
    grant: [{ kind: 'fs', access: 'create', path: 1 }],
    description: 'Create a symbolic link (grant fs: create). Success payload: {}.',
    params: [arg('target', OS_PATH, 'Link target'), arg('path', OS_PATH, 'New link path')],
    example: '["os/symlink", "/data/a.txt", "/data/b.txt", { "emit": { "success": "LINKED", "failure": "FILE_FAILED" } }]',
  }),
  'os/readlink': osEffect({
    answer: shape({ target: STRING }),
    grant: [{ kind: 'fs', access: 'read', path: 0 }],
    description: 'Read a symbolic link target (grant fs: read). Success payload: { target }.',
    params: [arg('path', OS_PATH, 'Link path')],
    example: '["os/readlink", "/data/b.txt", { "emit": { "success": "LINK_READ", "failure": "FILE_FAILED" } }]',
  }),
  'os/watch-files': osEffect({
    answer: shape({}),
    events: shape({ path: STRING, name: STRING, dir: STRING, timestamp: STRING, kind: STRING }),
    grant: [{ kind: 'fs', access: 'read', path: 0 }],
    description: 'Watch files matching a glob (grant fs: read). Events are { path, name, dir, timestamp, kind } for modified, created and deleted files. The options object also takes recursive, ignoreInitial and debounceMs.',
    params: [arg('glob', STRING, 'Glob pattern to watch (e.g., "**/*.orb")')],
    stream: true,
    example: '["os/watch-files", "**/*.orb", { "emit": { "success": "FILE_CHANGED", "failure": "WATCH_FAILED", "key": "orb-files" } }]',
  }),
};
