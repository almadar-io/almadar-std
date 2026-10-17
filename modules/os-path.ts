import type { StdOperatorMeta } from '../types.js';
import { BOOLEAN, STRING } from '../signature.js';
import { OS_PATH, arg, osPure } from './os-common.js';

export const OS_PATH_OPERATORS: Record<string, StdOperatorMeta> = {
  'os/path-join': osPure({
    description: 'Join path segments with "/" and normalize (POSIX semantics on every host, no OS access)',
    params: [arg('...parts', STRING, 'Path segments')],
    returnType: STRING,
    variadic: true,
    example: '["os/path-join", "/data", "out", "a.txt"] // => "/data/out/a.txt"',
  }),
  'os/path-normalize': osPure({
    description: 'Collapse ".", ".." and repeated separators (POSIX semantics, no OS access)',
    params: [arg('path', OS_PATH, 'Path')],
    returnType: STRING,
    example: '["os/path-normalize", "/data/../tmp//a"] // => "/tmp/a"',
  }),
  'os/path-base': osPure({
    description: 'Final path component (POSIX semantics, no OS access)',
    params: [arg('path', OS_PATH, 'Path')],
    returnType: STRING,
    example: '["os/path-base", "/data/a.txt"] // => "a.txt"',
  }),
  'os/path-dir': osPure({
    description: 'Path without its final component (POSIX semantics, no OS access)',
    params: [arg('path', OS_PATH, 'Path')],
    returnType: STRING,
    example: '["os/path-dir", "/data/a.txt"] // => "/data"',
  }),
  'os/path-ext': osPure({
    description: 'Extension of the final component, with the dot, or an empty string (POSIX semantics, no OS access)',
    params: [arg('path', OS_PATH, 'Path')],
    returnType: STRING,
    example: '["os/path-ext", "/data/a.txt"] // => ".txt"',
  }),
  'os/path-relative': osPure({
    description: 'Relative path from one path to another (POSIX semantics, no OS access)',
    params: [arg('from', OS_PATH, 'Start path'), arg('to', OS_PATH, 'Target path')],
    returnType: STRING,
    example: '["os/path-relative", "/data", "/data/out/a.txt"] // => "out/a.txt"',
  }),
  'os/path-is-absolute': osPure({
    description: 'Whether the path starts at the root (POSIX semantics, no OS access)',
    params: [arg('path', OS_PATH, 'Path')],
    returnType: BOOLEAN,
    example: '["os/path-is-absolute", "/data"] // => true',
  }),
};
