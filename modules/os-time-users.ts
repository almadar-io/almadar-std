import type { StdOperatorMeta } from '../types.js';
import { STRING } from '../signature.js';
import { arg, osEffect } from './os-common.js';

export const OS_TIME_USERS_OPERATORS: Record<string, StdOperatorMeta> = {
  'os/clock-monotonic': osEffect({
    grant: [],
    description: 'Read the monotonic clock (no grant; journaled, so a replay sees the same value). Success payload: { nanos }.',
    params: [],
    example: '["os/clock-monotonic", { "emit": { "success": "CLOCK_READ", "failure": "CLOCK_FAILED" } }]',
  }),
  'os/uid': osEffect({
    grant: [{ kind: 'sys', access: 'identity' }],
    description: 'Read the user id of the host process (grant sys: identity). Success payload: { uid }.',
    params: [],
    example: '["os/uid", { "emit": { "success": "UID_READ", "failure": "USER_FAILED" } }]',
  }),
  'os/gid': osEffect({
    grant: [{ kind: 'sys', access: 'identity' }],
    description: 'Read the group id of the host process (grant sys: identity). Success payload: { gid }.',
    params: [],
    example: '["os/gid", { "emit": { "success": "GID_READ", "failure": "USER_FAILED" } }]',
  }),
  'os/username': osEffect({
    grant: [{ kind: 'sys', access: 'identity' }],
    description: 'Read the user name of the host process (grant sys: identity). Success payload: { username }.',
    params: [],
    example: '["os/username", { "emit": { "success": "USERNAME_READ", "failure": "USER_FAILED" } }]',
  }),
  'os/group-of': osEffect({
    grant: [{ kind: 'sys', access: 'identity' }],
    description: 'Look up a group by name (grant sys: identity). Success payload: { gid, members }.',
    params: [arg('name', STRING, 'Group name')],
    example: '["os/group-of", "staff", { "emit": { "success": "GROUP_READ", "failure": "USER_FAILED" } }]',
  }),
  'os/watch-cron': osEffect({
    grant: [],
    description: 'Fire on a cron schedule (no grant). Events are { scheduledAt }. The options object also takes debounceMs.',
    params: [arg('expr', STRING, 'Cron expression (e.g., "*/5 * * * *" for every 5 minutes)')],
    stream: true,
    example: '["os/watch-cron", "0 */6 * * *", { "emit": { "success": "CRON_FIRED", "failure": "WATCH_FAILED", "key": "six-hourly" } }]',
  }),
};
