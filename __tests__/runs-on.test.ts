// `runsOn` is the one statement of where an effect executes (Frictions Phase 6); every consumer derives from it.
import { describe, expect, it } from 'vitest';
import { STD_OPERATORS, getOperatorRunsOn, getOperatorsRunningOn } from '../registry.js';

const effects = Object.entries(STD_OPERATORS).filter(([, m]) => m.hasSideEffects);

describe('runsOn', () => {
  it('every effect operator declares one site and no pure operator declares any', () => {
    expect(effects.length).toBeGreaterThan(0);
    expect(effects.filter(([, m]) => m.runsOn === undefined).map(([k]) => k)).toEqual([]);
    const pureWithSite = Object.entries(STD_OPERATORS).filter(([, m]) => !m.hasSideEffects && m.runsOn !== undefined);
    expect(pureWithSite.map(([k]) => k)).toEqual([]);
  });

  it('the server set is the data-owning effects plus the OS watchers', () => {
    expect(getOperatorsRunningOn('server')).toEqual([
      'atomic', 'call-service', 'fetch', 'fetch-stream',
      'os/debounce', 'os/watch-cron', 'os/watch-env', 'os/watch-files', 'os/watch-http', 'os/watch-port', 'os/watch-process', 'os/watch-signal',
      'persist', 'swap',
    ]);
  });

  it('the client set is rendering, navigation, the server send and the browser device APIs', () => {
    expect(getOperatorsRunningOn('client')).toEqual([
      'browser/clipboard-read', 'browser/clipboard-write', 'browser/geolocation-current', 'browser/open-file-picker', 'browser/push-subscribe',
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
