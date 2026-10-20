// `runsOn` is the one statement of where an effect executes (Frictions Phase 6); every consumer derives from it.
import { describe, expect, it } from 'vitest';
import { STD_OPERATORS, getOperatorRunsOn, getOperatorsRunningOn } from '../registry.js';
import { formatOperatorType } from '../signature.js';
import { OS_SYS_PAYLOADS } from '../modules/os-sys.js';

const OS_PURE = ['os/path-base', 'os/path-dir', 'os/path-ext', 'os/path-is-absolute', 'os/path-join', 'os/path-normalize', 'os/path-relative'];
const OS_EFFECTS = [
  'os/ac-power', 'os/access', 'os/append-file', 'os/battery-status', 'os/brightness-get', 'os/brightness-set', 'os/chdir', 'os/chmod', 'os/chown', 'os/clock-monotonic', 'os/close', 'os/copy',
  'os/cpu-usage', 'os/current-exe', 'os/cwd', 'os/default-gateway', 'os/disk-io', 'os/disk-usage', 'os/dns-resolve', 'os/environ', 'os/exists', 'os/fsync', 'os/getenv', 'os/gid', 'os/glob', 'os/group-of',
  'os/hibernate', 'os/hostname', 'os/isatty', 'os/kill', 'os/link', 'os/list-dir', 'os/load-avg', 'os/lstat', 'os/memory-info', 'os/mkdir', 'os/mktemp', 'os/mounts', 'os/network-connected',
  'os/network-interfaces', 'os/network-stats', 'os/notify', 'os/open', 'os/pid', 'os/ppid', 'os/read', 'os/read-file', 'os/readlink', 'os/realpath', 'os/recv', 'os/recvfrom', 'os/remove',
  'os/rename', 'os/rmdir', 'os/seek', 'os/send', 'os/sendto', 'os/setenv', 'os/shutdown', 'os/spawn', 'os/speak', 'os/stat', 'os/stderr-write', 'os/stdin-read', 'os/stdout-write',
  'os/suspend', 'os/symlink', 'os/tcp-connect', 'os/tcp-listen', 'os/thermal-zones', 'os/truncate', 'os/tty-size', 'os/udp-bind', 'os/uid', 'os/uname', 'os/unsetenv', 'os/uptime',
  'os/username', 'os/utimes', 'os/volume-get', 'os/volume-mute', 'os/volume-set', 'os/wait', 'os/watch-cron', 'os/watch-env', 'os/watch-files', 'os/watch-http', 'os/watch-port',
  'os/watch-process', 'os/watch-signal', 'os/write', 'os/write-file',
];

const effects = Object.entries(STD_OPERATORS).filter(([, m]) => m.hasSideEffects);

describe('runsOn', () => {
  it('every effect operator declares one site and no pure operator declares any', () => {
    expect(effects.length).toBeGreaterThan(0);
    expect(effects.filter(([, m]) => m.runsOn === undefined).map(([k]) => k)).toEqual([]);
    const pureWithSite = Object.entries(STD_OPERATORS).filter(([, m]) => !m.hasSideEffects && m.runsOn !== undefined);
    expect(pureWithSite.map(([k]) => k)).toEqual([]);
  });

  it('the server set is the data-owning effects, the OS watchers, and the effects that read installed packages through orb', () => {
    expect(getOperatorsRunningOn('server')).toEqual([
      'atomic', 'behavior/catalog', 'behavior/dependencies', 'behavior/describe', 'behavior/resolve', 'behavior/source', 'call-service', 'cancel-call', 'credential-forget', 'credential-list', 'credential-mode', 'credential-remove', 'credential-rotate', 'credential-set', 'credential-status', 'credential-test', 'fetch', 'fetch-stream', 'http',
      'oauth-authorize', 'oauth-connection-forget', 'oauth-connection-status', ...OS_EFFECTS,
      'persist', 'persist/read-named', 'postgres', 'program/compose', 'program/dispatch', 'program/eval', 'program/inputs', 'program/machine', 'program/print', 'program/read', 'program/step', 'program/validate', 'random-bytes', 'redis', 'swap',
    ].sort());
  });

  it('program/validate is a server program-host effect that returns the validator report and takes the eval program argument', () => {
    const validate = STD_OPERATORS['program/validate'];
    const evaluate = STD_OPERATORS['program/eval'];
    expect(validate.host).toBe('program');
    expect(validate.runsOn).toBe('server');
    expect(validate.hasSideEffects).toBe(true);
    expect(validate.params?.[0]).toEqual(evaluate.params?.[0]);
    expect(validate.returnType).toEqual({
      kind: 'object',
      fields: {
        valid: 'boolean',
        errors: { kind: 'array', of: { kind: 'object', fields: { code: 'string', message: 'string' }, open: true } },
        warnings: { kind: 'array', of: { kind: 'object', fields: { code: 'string', message: 'string' }, open: true } },
      },
    });
    expect(evaluate.returnType, 'control: eval returns the written program').toBe('EvaluatedProgram');
  });

  it('the os family is exactly the contract: effects run on the server, path math is pure, os/debounce is gone', () => {
    const declared = Object.keys(STD_OPERATORS).filter((k) => k.startsWith('os/')).sort();
    expect(declared).toEqual([...OS_EFFECTS, ...OS_PURE].sort());
    for (const name of OS_EFFECTS) {
      expect(STD_OPERATORS[name].hasSideEffects, name).toBe(true);
      expect(STD_OPERATORS[name].runsOn, name).toBe('server');
      expect(STD_OPERATORS[name].returnType, name).toBe('void');
    }
    for (const name of OS_PURE) {
      expect(STD_OPERATORS[name].hasSideEffects, name).toBe(false);
      expect(STD_OPERATORS[name].runsOn, name).toBeUndefined();
    }
    expect(STD_OPERATORS['os/debounce']).toBeUndefined();
    expect(JSON.stringify(Object.entries(STD_OPERATORS).filter(([k]) => k.startsWith('os/')))).not.toMatch(/"(any|unknown|json)"/);
  });

  it('every os/ sys payload is a closed shape documented in its description', () => {
    expect(Object.keys(OS_SYS_PAYLOADS)).toHaveLength(16);
    for (const [op, payload] of Object.entries(OS_SYS_PAYLOADS)) {
      const text = formatOperatorType(payload);
      expect(STD_OPERATORS[op].description, op).toContain(`Success payload: ${text}`);
      expect(text, op).not.toMatch(/\b(any|unknown|json|object)\b/);
    }
  });

  it('bytes/ is a pure closed family and os/ reads return bytes', () => {
    const names = Object.keys(STD_OPERATORS).filter((k) => k.startsWith('bytes/')).sort();
    expect(names).toEqual(['bytes/at', 'bytes/concat', 'bytes/equals', 'bytes/from-string', 'bytes/index-of', 'bytes/length', 'bytes/read-uint', 'bytes/slice', 'bytes/to-string', 'bytes/write-uint']);
    for (const name of names) {
      expect(STD_OPERATORS[name].hasSideEffects, name).toBe(false);
      expect(STD_OPERATORS[name].runsOn, name).toBeUndefined();
      expect(STD_OPERATORS[name].description, name).toContain('standard padded base64');
    }
    expect(JSON.stringify(names.map((k) => STD_OPERATORS[k]))).not.toMatch(/"(any|unknown|json)"/);
    expect(STD_OPERATORS['bytes/to-string'].params?.[0].type).toBe('bytes');
    expect(STD_OPERATORS['bytes/from-string'].returnType).toBe('bytes');
    expect(STD_OPERATORS['bytes/concat'].params?.[0].type).toEqual({ kind: 'array', of: 'bytes' });
    expect(STD_OPERATORS['os/read-file'].params?.map((p) => p.name)).toEqual(['path', 'options']);
    for (const op of ['os/read-file', 'os/read', 'os/recv', 'os/recvfrom', 'os/stdin-read']) {
      expect(STD_OPERATORS[op].description, op).toContain('data: bytes');
    }
  });

  it('os/ binary data params are bytes; paths and names stay string', () => {
    const typeOf = (op: string, name: string) => STD_OPERATORS[op].params?.find((p) => p.name === name)?.type;
    for (const op of ['os/write-file', 'os/append-file', 'os/write', 'os/send', 'os/sendto', 'os/stdout-write', 'os/stderr-write']) {
      expect(typeOf(op, 'data'), op).toBe('bytes');
    }
    const anchored = { kind: 'object', fields: { anchor: { kind: 'union', of: [{ kind: 'literal', value: 'cwd' }, { kind: 'literal', value: 'exe-dir' }, { kind: 'object', fields: { env: 'string' } }] }, path: 'string' } };
    expect(typeOf('os/write-file', 'path')).toEqual({ kind: 'union', of: ['string', anchored] });
    expect(typeOf('os/sendto', 'port')).toEqual({ kind: 'union', of: ['number', { kind: 'object', fields: { anchor: { kind: 'object', fields: { env: 'string' } } } }] });
  });

  it('the client set is rendering, navigation, the server send and the browser device APIs', () => {
    expect(getOperatorsRunningOn('client')).toEqual([
      'browser/beacon', 'browser/clipboard-read', 'browser/clipboard-write', 'browser/embed', 'browser/geolocation-current', 'browser/open-file-picker', 'browser/page-facts', 'browser/prompt', 'browser/push-subscribe',
      'browser/tab-act', 'browser/tab-apply', 'browser/tab-apply-many', 'browser/tab-capture', 'browser/tab-close', 'browser/tab-list', 'browser/tab-navigate', 'browser/tab-open', 'browser/tab-query', 'browser/tab-unwatch', 'browser/tab-watch',
      'navigate', 'navigate-back', 'render-ui', 'send-server',
    ]);
  });

  it('reads that run on either side stay `any`, and the three sets partition the effects', () => {
    for (const op of ['emit', 'set', 'log', 'notify', 'ref', 'deref', 'watch', 'spawn', 'despawn']) {
      expect(getOperatorRunsOn(op), op).toBe('any');
    }
    const partitioned = (['client', 'server', 'any'] as const).flatMap((s) => getOperatorsRunningOn(s));
    expect(partitioned.sort()).toEqual(effects.map(([k]) => k).sort());
  });

  it('a pure or unknown operator has no site', () => {
    expect(getOperatorRunsOn('math/ln')).toBeUndefined();
    expect(getOperatorRunsOn('+')).toBeUndefined();
    expect(getOperatorRunsOn('no/such-op')).toBeUndefined();
  });
});
