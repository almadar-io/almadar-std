/**
 * OS Module - the one `os/` operator family.
 *
 * Every effect is an `IoRequest::Os` the host answers under a program grant;
 * the `os/path-*` operators are pure string math. Contract: docs/Almadar_OS_Operators.md.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { OS_FS_OPERATORS } from './os-fs.js';
import { OS_DIR_OPERATORS } from './os-dir.js';
import { OS_PATH_OPERATORS } from './os-path.js';
import { OS_PROCESS_OPERATORS } from './os-process.js';
import { OS_ENV_STDIO_OPERATORS } from './os-env-stdio.js';
import { OS_NET_OPERATORS } from './os-net.js';
import { OS_TIME_USERS_OPERATORS } from './os-time-users.js';
import { OS_SYS_OPERATORS } from './os-sys.js';
import { OS_DESKTOP_OPERATORS } from './os-desktop.js';

export const OS_OPERATORS: Record<string, StdOperatorMeta> = {
  ...OS_FS_OPERATORS,
  ...OS_DIR_OPERATORS,
  ...OS_PATH_OPERATORS,
  ...OS_PROCESS_OPERATORS,
  ...OS_ENV_STDIO_OPERATORS,
  ...OS_NET_OPERATORS,
  ...OS_TIME_USERS_OPERATORS,
  ...OS_SYS_OPERATORS,
  ...OS_DESKTOP_OPERATORS,
};
