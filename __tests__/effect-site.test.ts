// A data effect runs where its entity lives: `fetch`/`persist` declare which
// argument names the entity, and the site follows that entity's residence.
import { describe, expect, it } from 'vitest';
import { STD_OPERATORS, effectSiteFor } from '../registry.js';

const resident = (name: string) => name === 'LocalInvoice';

describe('entityArgPosition', () => {
  it('fetch and persist declare their entity argument', () => {
    expect(STD_OPERATORS['fetch'].entityArgPosition).toBe(0);
    expect(STD_OPERATORS['persist'].entityArgPosition).toBe(1);
  });

  it('only server-run effects declare one', () => {
    const declaring = Object.entries(STD_OPERATORS).filter(([, m]) => m.entityArgPosition !== undefined);
    expect(declaring.every(([, m]) => m.runsOn === 'server')).toBe(true);
  });
});

describe('effectSiteFor', () => {
  it('fetch on a browser-stored entity runs on the client', () => {
    expect(effectSiteFor('fetch', ['LocalInvoice', {}], resident)).toBe('client');
  });

  it('persist reads its entity from argument 1', () => {
    expect(effectSiteFor('persist', ['create', 'LocalInvoice', {}], resident)).toBe('client');
  });

  it('control: fetch on a server entity stays on the server', () => {
    expect(effectSiteFor('fetch', ['Invoice', {}], resident)).toBe('server');
    expect(effectSiteFor('persist', ['update', 'Invoice', {}], resident)).toBe('server');
  });

  it('control: an entity argument that is not a literal name stays on the server', () => {
    expect(effectSiteFor('fetch', ['@config.entity', {}], resident)).toBe('server');
  });

  it('control: call-service never follows residence', () => {
    expect(effectSiteFor('call-service', ['llm', 'call', {}], resident)).toBe('server');
  });

  it('control: a service that also runs on node, or a binding, stays on the server', () => {
    expect(effectSiteFor('call-service', ['llm', 'classify', {}], resident)).toBe('server');
    expect(effectSiteFor('call-service', ['webhook', 'send', {}], resident)).toBe('server');
    expect(effectSiteFor('call-service', ['@config.service', 'pageview', {}], resident)).toBe('server');
  });

  it('an http call whose literal request has no auth key runs where it is placed', () => {
    const get = (request?: unknown) => ['GET', 'https://api.example.com', '/x', ...(request === undefined ? [] : [request])];
    expect(effectSiteFor('http', get(), resident)).toBe('client');
    expect(effectSiteFor('http', get({ query: { q: 'a' }, timeoutMs: 5 }), resident)).toBe('client');
    expect(effectSiteFor('http', get(null), resident)).toBe('client');
  });

  it('control: any auth key, or a request that is not a literal object, keeps http on the server', () => {
    const get = (request: unknown) => ['GET', 'https://api.example.com', '/x', request];
    expect(effectSiteFor('http', get({ auth: { scheme: 'bearer', credential: '@config.k' } }), resident)).toBe('server');
    expect(effectSiteFor('http', get({ auth: null }), resident)).toBe('server');
    expect(effectSiteFor('http', get('@payload.request'), resident)).toBe('server');
    expect(effectSiteFor('http', get(['merge', {}]), resident)).toBe('server');
  });

  it('control: client and any effects keep their declared site', () => {
    expect(effectSiteFor('render-ui', ['main', {}], resident)).toBe('client');
    expect(effectSiteFor('emit', ['DONE'], resident)).toBe('any');
  });

  it('a pure or unknown operator has no site', () => {
    expect(effectSiteFor('math/abs', [1], resident)).toBeUndefined();
  });
});
