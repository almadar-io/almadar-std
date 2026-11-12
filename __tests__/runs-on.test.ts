// `runsOn` is the one statement of where an effect executes (Frictions Phase 6); every consumer derives from it.
import { describe, expect, it } from 'vitest';
import { STD_OPERATORS, getOperatorRunsOn, getOperatorsRunningOn } from '../registry.js';
import { formatOperatorType } from '../signature.js';
import { OS_SYS_PAYLOADS } from '../modules/os-sys.js';

const OS_PURE = ['os/path-base', 'os/path-dir', 'os/path-ext', 'os/path-is-absolute', 'os/path-join', 'os/path-normalize', 'os/path-relative'];
const OS_EFFECTS = [
  'os/ac-power', 'os/access', 'os/append-file', 'os/battery-status', 'os/brightness-get', 'os/brightness-set', 'os/chdir', 'os/chmod', 'os/chown', 'os/clock-monotonic', 'os/copy',
  'os/cpu-usage', 'os/current-exe', 'os/cwd', 'os/default-gateway', 'os/disk-io', 'os/disk-usage', 'os/dns-resolve', 'os/environ', 'os/exists', 'os/fsync', 'os/getenv', 'os/gid', 'os/glob', 'os/group-of',
  'os/hibernate', 'os/hostname', 'os/irq-ack', 'os/irq-wait', 'os/isatty', 'os/kill', 'os/link', 'os/list-dir', 'os/load-avg', 'os/lstat', 'os/memory-info', 'os/mkdir', 'os/mktemp', 'os/mmio-read', 'os/mmio-write', 'os/mounts', 'os/network-connected',
  'os/network-interfaces', 'os/network-stats', 'os/notify', 'os/open', 'os/pid', 'os/ppid', 'os/process-list', 'os/read', 'os/read-file', 'os/readlink', 'os/realpath', 'os/recvfrom', 'os/remove',
  'os/rename', 'os/rmdir', 'os/seek', 'os/send', 'os/sendto', 'os/setenv', 'os/shutdown', 'os/spawn', 'os/speak', 'os/stat', 'os/stderr-write', 'os/stdin-read', 'os/stdout-write',
  'os/suspend', 'os/symlink', 'os/tcp-connect', 'os/tcp-listen', 'os/tls-upgrade', 'os/thermal-zones', 'os/truncate', 'os/tty-size', 'os/udp-bind', 'os/uid', 'os/uname', 'os/unsetenv', 'os/uptime',
  'os/username', 'os/utimes', 'os/volume-get', 'os/volume-mute', 'os/volume-set', 'os/wait', 'os/watch-cron', 'os/watch-env', 'os/watch-files', 'os/watch-port',
  'os/watch-process', 'os/watch-signal', 'os/write', 'os/write-file',
];

// Effects either side runs: the browser's HTTP port and the stream handles it answers (EXEC-HTTP).
const OS_ANY = ['os/close', 'os/fetch', 'os/recv'];

const MEM_EFFECTS = ['mem/alloc', 'mem/arena-drop', 'mem/arena-new', 'mem/atomic-add', 'mem/atomic-cas', 'mem/atomic-load', 'mem/atomic-store', 'mem/borrow', 'mem/free', 'mem/freeze', 'mem/release', 'mem/write'];
const KERNEL_EFFECTS = ['kernel/queue-back', 'kernel/queue-front'];
const KERNEL_PURE = ['kernel/apply', 'kernel/frame', 'kernel/stamp', 'kernel/worklist'];
const FFI_EFFECTS = ['ffi/call'];
const GPU_EFFECTS = ['gpu/bind-group-create', 'gpu/buffer-create', 'gpu/device-close', 'gpu/device-open', 'gpu/pipeline-create', 'gpu/query-create', 'gpu/release', 'gpu/sampler-create', 'gpu/shader-create', 'gpu/submit', 'gpu/texture-create'];
const MEM_PURE = ['mem/length', 'mem/read', 'mem/read-int', 'mem/read-uint'];

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
      'access-check', 'behavior/catalog', 'behavior/dependencies', 'behavior/describe', 'behavior/packages', 'behavior/resolve', 'behavior/source', 'call-service', 'cancel-call', 'credential-connect', 'credential-forget', 'credential-list', 'credential-mode', 'credential-remove', 'credential-rotate', 'credential-set', 'credential-status', 'credential-test', 'fetch', 'fetch-stream', 'ffi/call', 'identity/sign-in', 'identity/sign-out',
      'oauth-authorize', 'oauth-connection-forget', 'oauth-connection-status', ...OS_EFFECTS,
      'persist', 'persist/read-named', 'program/close', 'program/compose', 'program/dispatch', 'program/eval', 'program/inputs', 'program/live', 'program/navigate', 'program/open', 'program/os-grants', 'program/print', 'program/prove', 'program/read', 'program/resolve-rows', 'program/self', 'program/step', 'program/tick', 'program/validate', 'random-bytes',
    ].sort());
  });

  it('program/validate is a server program-host effect that returns the validator report and takes the eval program argument', () => {
    const validate = STD_OPERATORS['program/validate'];
    const evaluate = STD_OPERATORS['program/eval'];
    expect(validate.host).toBe('program');
    expect(validate.runsOn).toBe('server');
    expect(validate.hasSideEffects).toBe(true);
    expect(validate.params?.[0]).toEqual(evaluate.params?.[0]);
    const diagnostic = { kind: 'object', fields: { code: 'string', path: 'string', message: 'string' }, open: true };
    const nullable = (of: unknown) => ({ kind: 'union', of: [of, { kind: 'literal', value: null }] });
    expect(validate.returnType).toEqual({
      kind: 'union',
      of: [
        {
          kind: 'object',
          fields: {
            success: 'boolean',
            valid: 'boolean',
            errors: nullable({ kind: 'array', of: diagnostic }),
            warnings: nullable({ kind: 'array', of: diagnostic }),
            stats: nullable({ kind: 'object', fields: { orbitals: 'number', entities: 'number', traits: 'number', pages: 'number' }, open: true }),
          },
        },
        {
          kind: 'object',
          fields: {
            valid: 'boolean',
            errors: { kind: 'array', of: { kind: 'object', fields: { code: 'string', message: 'string' }, open: true } },
            warnings: { kind: 'array', of: { kind: 'object', fields: { code: 'string', message: 'string' }, open: true } },
          },
        },
      ],
    });
    expect(evaluate.returnType, 'control: eval returns the written program or its report').toEqual({
      kind: 'union',
      of: ['EvaluatedProgram', { kind: 'object', fields: { files: 'number', lines: { kind: 'array', of: 'string' }, nextSteps: { kind: 'array', of: 'string' }, warnings: { kind: 'array', of: 'string' } } }],
    });
  });

  it('the os family is exactly the contract: effects run on the server, path math is pure, os/debounce is gone', () => {
    const declared = Object.keys(STD_OPERATORS).filter((k) => k.startsWith('os/')).sort();
    expect(declared).toEqual([...OS_EFFECTS, ...OS_PURE, ...OS_ANY].sort());
    for (const name of OS_ANY) {
      expect(STD_OPERATORS[name].hasSideEffects, name).toBe(true);
      expect(STD_OPERATORS[name].runsOn, name).toBe('any');
    }
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
    expect(JSON.stringify(Object.entries(STD_OPERATORS).filter(([k]) => k.startsWith('os/')), (key, value) => (key === 'runsOn' ? undefined : value))).not.toMatch(/"(any|unknown|json)"/);
  });

  it('the mem family is kernel-owned: effects run on either side with host kernel, reads are pure', () => {
    const declared = Object.keys(STD_OPERATORS).filter((k) => k.startsWith('mem/')).sort();
    expect(declared).toEqual([...MEM_EFFECTS, ...MEM_PURE].sort());
    for (const name of MEM_EFFECTS) {
      expect(STD_OPERATORS[name].hasSideEffects, name).toBe(true);
      expect(STD_OPERATORS[name].runsOn, name).toBe('any');
      expect(STD_OPERATORS[name].host, name).toBe('kernel');
      expect(STD_OPERATORS[name].category, name).toBe('std-mem');
    }
    for (const name of MEM_PURE) {
      expect(STD_OPERATORS[name].hasSideEffects, name).toBe(false);
      expect(STD_OPERATORS[name].runsOn, name).toBeUndefined();
      expect(STD_OPERATORS[name].category, name).toBe('std-mem-read');
    }
  });

  it('the kernel family is kernel-owned: queue reorders are effects on either side, the reads are pure with host kernel', () => {
    const declared = Object.keys(STD_OPERATORS).filter((k) => k.startsWith('kernel/')).sort();
    expect(declared).toEqual([...KERNEL_EFFECTS, ...KERNEL_PURE].sort());
    for (const name of KERNEL_EFFECTS) {
      expect(STD_OPERATORS[name].hasSideEffects, name).toBe(true);
      expect(STD_OPERATORS[name].runsOn, name).toBe('any');
      expect(STD_OPERATORS[name].host, name).toBe('kernel');
      expect(STD_OPERATORS[name].category, name).toBe('std-kernel');
    }
    for (const name of KERNEL_PURE) {
      expect(STD_OPERATORS[name].hasSideEffects, name).toBe(false);
      expect(STD_OPERATORS[name].runsOn, name).toBeUndefined();
      expect(STD_OPERATORS[name].host, name).toBe('kernel');
      expect(STD_OPERATORS[name].category, name).toBe('std-kernel-read');
    }
  });

  it('the ffi family is a server os effect with the ffi grant', () => {
    const declared = Object.keys(STD_OPERATORS).filter((k) => k.startsWith('ffi/')).sort();
    expect(declared).toEqual(FFI_EFFECTS);
    for (const name of FFI_EFFECTS) {
      expect(STD_OPERATORS[name].hasSideEffects, name).toBe(true);
      expect(STD_OPERATORS[name].runsOn, name).toBe('server');
      expect(STD_OPERATORS[name].host, name).toBe('os');
      expect(STD_OPERATORS[name].module, name).toBe('ffi');
      expect(STD_OPERATORS[name].category, name).toBe('std-ffi');
      expect(STD_OPERATORS[name].grant, name).toEqual([{ kind: 'ffi', library: 0, symbol: 1 }]);
    }
  });

  it('the gpu family is a host-answered os effect that runs on any side, with the gpu grant on open and submit', () => {
    const declared = Object.keys(STD_OPERATORS).filter((k) => k.startsWith('gpu/')).sort();
    expect(declared).toEqual(GPU_EFFECTS);
    for (const name of GPU_EFFECTS) {
      expect(STD_OPERATORS[name].hasSideEffects, name).toBe(true);
      expect(STD_OPERATORS[name].runsOn, name).toBe('any');
      expect(STD_OPERATORS[name].host, name).toBe('os');
      expect(STD_OPERATORS[name].module, name).toBe('gpu');
      expect(STD_OPERATORS[name].category, name).toBe('std-gpu');
    }
    expect(STD_OPERATORS['gpu/device-open'].grant).toEqual([{ kind: 'gpu', access: 'open' }]);
    expect(STD_OPERATORS['gpu/submit'].grant).toEqual([{ kind: 'gpu', access: 'compute', commands: 1 }]);
    for (const name of GPU_EFFECTS.filter((n) => !['gpu/device-open', 'gpu/submit'].includes(n))) {
      expect(STD_OPERATORS[name].grant, name).toEqual([]);
    }
  });

  it('every os/ sys payload is a closed shape documented in its description', () => {
    expect(Object.keys(OS_SYS_PAYLOADS)).toHaveLength(17);
    for (const [op, payload] of Object.entries(OS_SYS_PAYLOADS)) {
      const text = formatOperatorType(payload);
      expect(STD_OPERATORS[op].description, op).toContain(`Success payload: ${text}`);
      expect(text, op).not.toMatch(/\b(any|unknown|json|object)\b/);
    }
  });

  it('bytes/ is a pure closed family and os/ reads return bytes', () => {
    const names = Object.keys(STD_OPERATORS).filter((k) => k.startsWith('bytes/')).sort();
    expect(names).toEqual(['bytes/at', 'bytes/concat', 'bytes/equals', 'bytes/from-base64', 'bytes/from-string', 'bytes/index-of', 'bytes/length', 'bytes/read-int', 'bytes/read-uint', 'bytes/slice', 'bytes/to-base64', 'bytes/to-string', 'bytes/valid-utf8', 'bytes/write-uint', 'bytes/xor']);
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
    for (const op of ['os/write-file', 'os/append-file', 'os/write', 'os/sendto', 'os/stdout-write', 'os/stderr-write']) {
      expect(typeOf(op, 'data'), op).toBe('bytes');
    }
    // os/send also takes credential segments the host resolves at the boundary (EXEC-CRYPTO), each with an optional encode and scope.
    const literals = (...values: string[]) => ({ kind: 'union', of: values.map((value) => ({ kind: 'literal', value })) });
    const segment = {
      kind: 'object',
      fields: { bytes: 'bytes', credential: 'string', encode: literals('base64', 'uri', 'form'), scope: literals('app', 'user') },
      optional: ['encode', 'scope'],
    };
    expect(typeOf('os/send', 'data')).toEqual({ kind: 'union', of: ['bytes', { kind: 'array', of: segment }] });
    const anchored = { kind: 'object', fields: { anchor: { kind: 'union', of: [{ kind: 'literal', value: 'cwd' }, { kind: 'literal', value: 'exe-dir' }, { kind: 'object', fields: { env: 'string' } }] }, path: 'string' } };
    expect(typeOf('os/write-file', 'path')).toEqual({ kind: 'union', of: ['string', anchored] });
    expect(typeOf('os/sendto', 'port')).toEqual({ kind: 'union', of: ['number', { kind: 'object', fields: { anchor: { kind: 'object', fields: { env: 'string' } } } }] });
  });

  it('the client set is rendering, navigation, audio, sign-in, a guest ask relay, the server send and the browser device APIs', () => {
    expect(getOperatorsRunningOn('client')).toEqual([
      'audio/change-music', 'audio/clock', 'audio/play-sound', 'audio/schedule', 'audio/stop-music', 'audio/stop-sound', 'auth/consent', 'auth/sign-in', 'auth/sign-out',
      'browser/beacon', 'browser/clipboard-read', 'browser/clipboard-write', 'browser/embed', 'browser/geolocation-current', 'browser/open-file-picker', 'browser/page-facts', 'browser/prompt', 'browser/push-subscribe', 'browser/read-file',
      'browser/tab-act', 'browser/tab-apply', 'browser/tab-apply-many', 'browser/tab-capture', 'browser/tab-close', 'browser/tab-list', 'browser/tab-navigate', 'browser/tab-open', 'browser/tab-query', 'browser/tab-unwatch', 'browser/tab-watch',
      'navigate', 'navigate-back', 'program/host-ask', 'render-ui', 'send-server',
    ]);
  });

  it('reads that run on either side stay `any`, and the three sets partition the effects', () => {
    for (const op of ['emit', 'set', 'log', 'notify', 'spawn', 'despawn']) {
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
