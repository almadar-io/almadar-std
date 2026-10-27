/**
 * Browser Module - Browser Device Operators (client host path)
 *
 * User-initiated, async device APIs that resolve through the standard
 * trailing emit envelope `{ emit: { success, failure } }`. These run on
 * the client side only: in the React/runtime path they delegate to the
 * real `window`/`navigator` APIs; in the compiled Dioxus-native path they
 * are routed through the hybrid host bridge (WASI + capability manifest).
 *
 * All operators have side effects (they reach out to the device / user).
 * Effect-position only; never valid in guards.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';
import { BOOLEAN, BYTES, NUMBER, STRING, list, lit, mapOf, nullable, openShape, shape, union } from '../signature.js';

const EVENT_KEY: OperatorTypeRef = { kind: 'eventKey' };

const PAGE_FACT_FIELD: OperatorTypeRef = union(lit('hostname'), lit('referrer'), lit('screenWidth'));

const PAGE_FACTS_PRODUCES = shape({ available: BOOLEAN, hostname: STRING, referrer: STRING, screenWidth: nullable(NUMBER) });

const BEACON_PRODUCES = shape({ sent: BOOLEAN, via: union(lit('queue'), lit('fetch')), status: nullable(NUMBER), key: nullable(STRING) });

const PROMPT_PRODUCES = shape({ reply: STRING, key: nullable(STRING) });

const EMBED_PRODUCES = shape({ embeddings: list(list(NUMBER)), key: nullable(STRING) });

const TAB_REF = shape({ tab: NUMBER, elementId: STRING });

const TAB_LIST_PRODUCES = shape({ tabs: list(shape({ tab: NUMBER, url: STRING, title: STRING, active: BOOLEAN })), key: nullable(STRING) });

const TAB_OPEN_PRODUCES = shape({ tab: NUMBER, key: nullable(STRING) });

const TAB_CLOSE_PRODUCES = shape({ closed: BOOLEAN, key: nullable(STRING) });

const TAB_NAVIGATE_PRODUCES = shape({ url: STRING, key: nullable(STRING) });

const TAB_QUERY_PRODUCES = shape({ tab: NUMBER, elements: list(shape({ elementId: STRING, fields: mapOf(STRING, STRING) })), key: nullable(STRING) });

const TAB_WATCH_PRODUCES = shape({ watchId: STRING, key: nullable(STRING) });

const TAB_UNWATCH_PRODUCES = shape({ stopped: BOOLEAN, key: nullable(STRING) });

const TAB_APPLY_PRODUCES = shape({ applied: BOOLEAN, tab: NUMBER, elementId: STRING, treatment: STRING, key: nullable(STRING) });

const TAB_APPLY_MANY_PRODUCES = shape({ applied: list(TAB_REF), missing: list(TAB_REF), key: nullable(STRING) });

const TAB_ACT_PRODUCES = shape({ done: BOOLEAN, tab: NUMBER, elementId: STRING, key: nullable(STRING) });

const TAB_IMAGE_FORMAT = union(lit('png'), lit('jpeg'));

const TAB_CAPTURE_PRODUCES = shape({ tab: NUMBER, format: TAB_IMAGE_FORMAT, image: BYTES, key: nullable(STRING) });

const TAB_FIELD = openShape({ selector: STRING, attr: STRING, resolve: BOOLEAN, template: STRING, required: BOOLEAN });

const TAB_TREATMENT = union(lit('hide'), lit('blur'), lit('highlight'), lit('label'), lit('restore'));

const TAB_ACTION = union(lit('click'), lit('focus'), lit('type'));

const MODEL_OPTIONS = openShape({ key: STRING, emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY, cancelled: EVENT_KEY }) });

export const BROWSER_OPERATORS: Record<string, StdOperatorMeta> = {
  'browser/open-file-picker': {
    module: 'browser',
    category: 'std-browser',
    minArity: 0,
    maxArity: 1,
    description:
      'Open the OS file picker (window.showOpenFilePicker / host dialog). Resolves with the selected file metadata list, or emits failure when the user cancels or the capability is denied. Async; use the trailing { emit } envelope for success/failure events.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: list(shape({ name: STRING, size: NUMBER, type: STRING, lastModified: NUMBER })),
    params: [
      {
        name: 'options',
        type: {
          kind: 'object',
          fields: {
            multiple: 'string',
            accept: 'string',
          },
          open: true,
        },
        description: 'Optional picker config: { multiple?: boolean, accept?: string, types?: Array<{description, accept}> }',
        optional: true,
      },
    ],
    effect: {
      kind: 'custom',
      produces: {
        kind: 'array',
        of: {
          kind: 'object',
          fields: {
            name: 'string',
            size: 'number',
            type: 'string',
            lastModified: 'number',
          },
        },
      },
    },
    example: '["browser/open-file-picker", { "multiple": false }, { "emit": { "success": "FILES_PICKED", "failure": "PICK_CANCELLED" } }]',
  },
  'browser/clipboard-read': {
    module: 'browser',
    category: 'std-browser',
    minArity: 0,
    maxArity: 0,
    description:
      'Read text from the system clipboard (navigator.clipboard.readText / host clipboard). Requires a user gesture and clipboard permission. Resolves with the clipboard text via the trailing { emit } envelope.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: 'string',
    effect: {
      kind: 'custom',
      produces: 'string',
    },
    example: '["browser/clipboard-read", { "emit": { "success": "CLIPBOARD_READ", "failure": "CLIPBOARD_DENIED" } }]',
  },
  'browser/clipboard-write': {
    module: 'browser',
    category: 'std-browser',
    minArity: 1,
    maxArity: 1,
    description:
      'Write text to the system clipboard (navigator.clipboard.writeText / host clipboard). Requires a user gesture. Emits success/failure via the trailing { emit } envelope.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: 'void',
    params: [
      { name: 'text', type: 'string', description: 'Text to write to the clipboard' },
    ],
    effect: {
      kind: 'custom',
      produces: 'string',
    },
    example: '["browser/clipboard-write", "https://example.com/invite/abc", { "emit": { "success": "COPIED", "failure": "COPY_DENIED" } }]',
  },
  'browser/push-subscribe': {
    module: 'browser',
    category: 'std-browser',
    minArity: 0,
    maxArity: 0,
    description:
      'Subscribe this browser to Web Push notifications: registers the shared push service worker, fetches the VAPID public key from the host (/api/push/vapid-public-key — no key material in the schema), and calls PushManager.subscribe. Requires notification permission (user gesture). Resolves with the flat subscription credentials { endpoint, p256dh, auth } via the trailing { emit } envelope — persist them on an owner-scoped entity row and pass them back to the push.send service as subscription: { endpoint, keys: { p256dh, auth } }. Emits failure when the Push API is unavailable, permission is denied, or the host has no VAPID key configured.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: shape({ endpoint: STRING, p256dh: STRING, auth: STRING }),
    effect: {
      kind: 'custom',
      produces: {
        kind: 'object',
        fields: {
          endpoint: 'string',
          p256dh: 'string',
          auth: 'string',
        },
      },
    },
    example: '["browser/push-subscribe", { "emit": { "success": "PUSH_SUBSCRIBED", "failure": "PUSH_SUBSCRIBE_FAILED" } }]',
  },
  'browser/geolocation-current': {
    module: 'browser',
    category: 'std-browser',
    minArity: 0,
    maxArity: 1,
    description:
      'Read the current device position (navigator.geolocation.getCurrentPosition / host geolocation). Requires location permission. Resolves with { latitude, longitude, accuracy } via the trailing { emit } envelope.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: shape({ latitude: NUMBER, longitude: NUMBER, accuracy: NUMBER }),
    params: [
      {
        name: 'options',
        type: {
          kind: 'object',
          fields: {
            enableHighAccuracy: 'string',
            timeout: 'number',
            maximumAge: 'number',
          },
          open: true,
        },
        description: 'Optional PositionOptions: { enableHighAccuracy?: boolean, timeout?: number, maximumAge?: number }',
        optional: true,
      },
    ],
    effect: {
      kind: 'custom',
      produces: {
        kind: 'object',
        fields: {
          latitude: 'number',
          longitude: 'number',
          accuracy: 'number',
        },
      },
    },
    example: '["browser/geolocation-current", { "enableHighAccuracy": true }, { "emit": { "success": "LOCATED", "failure": "LOCATION_DENIED" } }]',
  },
  'browser/page-facts': {
    module: 'browser',
    // emit key order: effect/http.rs:898
    emitKeys: ['success', 'failure'],
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'Read the requested page facts (hostname, referrer, screenWidth) in list order. Resolves with { available, hostname, referrer, screenWidth } via the trailing { emit } envelope; a fact that was not requested keeps its default and is not readable. Without a page (no window or document) available is false, hostname and referrer are empty and screenWidth is null. A getter that throws emits failure { error }, which is not the no-page outcome.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: PAGE_FACTS_PRODUCES,
    params: [
      {
        name: 'fields',
        type: list(PAGE_FACT_FIELD),
        description: 'A non-empty, duplicate-free list of bare words from hostname | referrer | screenWidth; the list order is the read order',
      },
      {
        name: 'options',
        type: openShape({ key: STRING, emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY }) }),
        description: 'Optional trailing options: { key } is a non-empty string echoed as key in the success and failure payloads (absent: no key field); { emit: { success, failure } } routes the facts and the { error } failure',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: PAGE_FACTS_PRODUCES },
    example: '["browser/page-facts", ["referrer", "screenWidth"], { "emit": { "success": "FACTS", "failure": "FACTS_FAILED" } }]',
  },
  'browser/beacon': {
    module: 'browser',
    // emit key order: effect/http.rs:781
    emitKeys: ['success', 'failure', 'cancelled'],
    category: 'std-browser',
    minArity: 2,
    maxArity: 3,
    description:
      'POST text to an absolute http(s) URL as text/plain without waiting for a reply: the browser beacon queue first, then one keepalive cors fetch (status only; the body is never read). The URL origin must be declared in egress and a relative URL is refused. Resolves with { sent, via, status, key } via the trailing { emit } envelope; a queue acceptance is { sent: true, via: queue, status: null }. Cancelling stops waiting but never aborts the queue or the fetch. A host without a beacon port emits failure kind unavailable.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: BEACON_PRODUCES,
    params: [
      { name: 'url', type: STRING, description: 'Absolute http(s) URL: a string literal or a url-typed @config knob' },
      {
        name: 'request',
        type: openShape({ text: STRING, key: STRING }),
        description: 'The request: { text } is the body (required); { key } optionally names the call and is echoed in the result',
      },
      {
        name: 'options',
        type: openShape({ key: STRING, emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY, cancelled: EVENT_KEY }) }),
        description: 'Optional trailing options: { key } names the call; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: BEACON_PRODUCES },
    example: '["browser/beacon", "https://plausible.example.com/api/event", { "text": "@entity.body", "key": "@entity.id" }, { "emit": { "success": "BEACON_DONE", "failure": "BEACON_FAILED", "cancelled": "BEACON_CANCELLED" } }]',
  },
  'browser/prompt': {
    module: 'browser',
    // emit key order: effect/http.rs:951
    emitKeys: ['success', 'failure', 'cancelled'],
    // effect/keyed_call.rs:22 ON_DEVICE_OPERATORS; http.rs:1080 ORB_ON_DEVICE_EFFECT_ON_SERVER
    family: 'on-device',
    category: 'std-browser',
    minArity: 2,
    maxArity: 3,
    description:
      'Ask the host\'s on-device model for a reply to the text that satisfies the JSON Schema text. Resolves with { reply, key } via the trailing { emit } envelope: reply is the model\'s raw JSON text, which the program reads with json/parse under its own shape and checks. Keyed and cancellable like call-service: (cancel-call key) aborts the ask and fires emit.cancelled with { key }, and a late reply is dropped. A host with no model wired in emits failure { error, kind: unconfigured, key }, one whose model cannot answer now emits kind unavailable, and a model that errors emits kind failed. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: PROMPT_PRODUCES,
    params: [
      { name: 'text', type: STRING, description: 'The prompt text sent to the model' },
      { name: 'schema', type: STRING, description: 'JSON Schema text the reply must satisfy: a JSON object, usually built with json/stringify' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: PROMPT_PRODUCES },
    example: '["browser/prompt", "@payload.text", ["json/stringify", { "type": "object" }], { "key": "@entity.batchId", "emit": { "success": "REPLIED", "failure": "PROMPT_FAILED", "cancelled": "PROMPT_CANCELLED" } }]',
  },
  'browser/embed': {
    module: 'browser',
    // emit key order: effect/http.rs:951
    emitKeys: ['success', 'failure', 'cancelled'],
    // effect/keyed_call.rs:22 ON_DEVICE_OPERATORS; http.rs:1080 ORB_ON_DEVICE_EFFECT_ON_SERVER
    family: 'on-device',
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'Ask the host\'s on-device embedder for one vector per text. Resolves with { embeddings, key } via the trailing { emit } envelope, the vectors in input order; an empty list resolves with no vectors without asking the host. Keyed and cancellable like call-service. A host with no embedder wired in emits failure { error, kind: unconfigured, key }; an embedder that errors emits kind failed. The vectors are handed back as the host answered them; the program checks their count. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: EMBED_PRODUCES,
    params: [
      { name: 'texts', type: list(STRING), description: 'The texts to embed' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: EMBED_PRODUCES },
    example: '["browser/embed", "@payload.texts", { "key": "@entity.batchId", "emit": { "success": "EMBEDDED", "failure": "EMBED_FAILED", "cancelled": "EMBED_CANCELLED" } }]',
  },
  'browser/tab-list': {
    module: 'browser',
    // emit key order: effect/http.rs:1037
    emitKeys: ['success', 'failure', 'cancelled'],
    // orbital-core wire/tab.rs:29 TabOp::ALL; http.rs:1089 ORB_TAB_EFFECT_ON_SERVER
    family: 'tab',
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'List the open browser tabs, optionally only those whose URL matches a Chrome match pattern. Resolves with the shape it produces via the trailing { emit } envelope. Keyed and cancellable like call-service: (cancel-call key) aborts the ask and fires emit.cancelled with { key }. A request outside its closed keys, or a value the kernel refuses, emits failure { error, kind: invalid, key } and asks the host nothing; a host with no browser tabs emits kind unavailable, a tab with no page script kind not-ready, an element that left the page kind not-found. The kernel validates and shapes; the host only performs raw tab and page operations. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: TAB_LIST_PRODUCES,
    params: [
      { name: 'request', type: openShape({ match: STRING }), description: '{ match? } is a URL match pattern such as https://example.com/*' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: TAB_LIST_PRODUCES },
    example: '["browser/tab-list", { "match": "https://example.com/*" }, { "emit": { "success": "TABS", "failure": "TABS_FAILED" } }]',
  },
  'browser/tab-open': {
    module: 'browser',
    // emit key order: effect/http.rs:1037
    emitKeys: ['success', 'failure', 'cancelled'],
    // orbital-core wire/tab.rs:29 TabOp::ALL; http.rs:1089 ORB_TAB_EFFECT_ON_SERVER
    family: 'tab',
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'Open a URL in a new tab, adding the params to its query string. Resolves with the shape it produces via the trailing { emit } envelope. Keyed and cancellable like call-service: (cancel-call key) aborts the ask and fires emit.cancelled with { key }. A request outside its closed keys, or a value the kernel refuses, emits failure { error, kind: invalid, key } and asks the host nothing; a host with no browser tabs emits kind unavailable, a tab with no page script kind not-ready, an element that left the page kind not-found. The kernel validates and shapes; the host only performs raw tab and page operations. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: TAB_OPEN_PRODUCES,
    params: [
      { name: 'request', type: openShape({ url: STRING, params: mapOf(STRING, STRING), match: STRING, active: BOOLEAN }), description: '{ url } is absolute; { params? } are added to the query string, encoded; { match? } is the pattern the final URL must lie in; { active? } focuses the tab (default false)' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: TAB_OPEN_PRODUCES },
    example: '["browser/tab-open", { "url": "https://example.com/search", "params": { "q": "@payload.query" }, "match": "https://example.com/*", "active": false }, { "emit": { "success": "TAB_OPENED", "failure": "OPEN_FAILED" } }]',
  },
  'browser/tab-close': {
    module: 'browser',
    // emit key order: effect/http.rs:1037
    emitKeys: ['success', 'failure', 'cancelled'],
    // orbital-core wire/tab.rs:29 TabOp::ALL; http.rs:1089 ORB_TAB_EFFECT_ON_SERVER
    family: 'tab',
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'Close a tab. Resolves with the shape it produces via the trailing { emit } envelope. Keyed and cancellable like call-service: (cancel-call key) aborts the ask and fires emit.cancelled with { key }. A request outside its closed keys, or a value the kernel refuses, emits failure { error, kind: invalid, key } and asks the host nothing; a host with no browser tabs emits kind unavailable, a tab with no page script kind not-ready, an element that left the page kind not-found. The kernel validates and shapes; the host only performs raw tab and page operations. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: TAB_CLOSE_PRODUCES,
    params: [
      { name: 'request', type: openShape({ tab: NUMBER }), description: '{ tab } is a tab number from tab-open or tab-list' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: TAB_CLOSE_PRODUCES },
    example: '["browser/tab-close", { "tab": "@entity.tab" }, { "emit": { "success": "TAB_CLOSED", "failure": "CLOSE_FAILED" } }]',
  },
  'browser/tab-navigate': {
    module: 'browser',
    // emit key order: effect/http.rs:1037
    emitKeys: ['success', 'failure', 'cancelled'],
    // orbital-core wire/tab.rs:29 TabOp::ALL; http.rs:1089 ORB_TAB_EFFECT_ON_SERVER
    family: 'tab',
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'Point an existing tab at an absolute URL. Resolves with the shape it produces via the trailing { emit } envelope. Keyed and cancellable like call-service: (cancel-call key) aborts the ask and fires emit.cancelled with { key }. A request outside its closed keys, or a value the kernel refuses, emits failure { error, kind: invalid, key } and asks the host nothing; a host with no browser tabs emits kind unavailable, a tab with no page script kind not-ready, an element that left the page kind not-found. The kernel validates and shapes; the host only performs raw tab and page operations. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: TAB_NAVIGATE_PRODUCES,
    params: [
      { name: 'request', type: openShape({ tab: NUMBER, url: STRING }), description: '{ tab } and the absolute { url } to load' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: TAB_NAVIGATE_PRODUCES },
    example: '["browser/tab-navigate", { "tab": "@entity.tab", "url": "https://example.com/next" }, { "emit": { "success": "NAVIGATED", "failure": "NAVIGATE_FAILED" } }]',
  },
  'browser/tab-query': {
    module: 'browser',
    // emit key order: effect/http.rs:1037
    emitKeys: ['success', 'failure', 'cancelled'],
    // orbital-core wire/tab.rs:29 TabOp::ALL; http.rs:1089 ORB_TAB_EFFECT_ON_SERVER
    family: 'tab',
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'Read the elements of a tab\'s page that match a selector, each with the declared fields, optionally waiting for the page to load and a first match to appear. Resolves with the shape it produces via the trailing { emit } envelope. Keyed and cancellable like call-service: (cancel-call key) aborts the ask and fires emit.cancelled with { key }. A request outside its closed keys, or a value the kernel refuses, emits failure { error, kind: invalid, key } and asks the host nothing; a host with no browser tabs emits kind unavailable, a tab with no page script kind not-ready, an element that left the page kind not-found. The kernel validates and shapes; the host only performs raw tab and page operations. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: TAB_QUERY_PRODUCES,
    params: [
      { name: 'request', type: openShape({ tab: NUMBER, selector: STRING, fields: mapOf(STRING, TAB_FIELD), limit: NUMBER, waitMs: NUMBER }), description: '{ tab }, the CSS { selector }, the { fields } map of name to { selector?, attr?, resolve?, template?, required? }, optional { limit } and { waitMs }' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: TAB_QUERY_PRODUCES },
    example: '["browser/tab-query", { "tab": "@entity.tab", "selector": ".result", "fields": { "title": { "selector": "h2" } }, "limit": 10, "waitMs": 8000 }, { "emit": { "success": "RESULTS_READ", "failure": "QUERY_FAILED" } }]',
  },
  'browser/tab-watch': {
    module: 'browser',
    // emit key order: effect/http.rs:1037
    emitKeys: ['success', 'failure', 'cancelled'],
    // orbital-core wire/tab.rs:29 TabOp::ALL; http.rs:1089 ORB_TAB_EFFECT_ON_SERVER
    family: 'tab',
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'Watch every tab whose URL matches a pattern for elements matching a selector: each element is reported once, now and as the page changes, to the declared external input the event address names, as { tab, elementId, url, fields }. Asking again for the same watch from the same trait returns the same watchId. Resolves with the shape it produces via the trailing { emit } envelope. Keyed and cancellable like call-service: (cancel-call key) aborts the ask and fires emit.cancelled with { key }. A request outside its closed keys, or a value the kernel refuses, emits failure { error, kind: invalid, key } and asks the host nothing; a host with no browser tabs emits kind unavailable, a tab with no page script kind not-ready, an element that left the page kind not-found. The kernel validates and shapes; the host only performs raw tab and page operations. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: TAB_WATCH_PRODUCES,
    params: [
      { name: 'request', type: openShape({ match: STRING, selector: STRING, fields: mapOf(STRING, TAB_FIELD), event: EVENT_KEY }), description: '{ match } is the pages to watch, the CSS { selector }, the { fields } to read and the { event } address (Trait.EVENT) of a declared external input' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: TAB_WATCH_PRODUCES },
    example: '["browser/tab-watch", { "match": "https://example.com/*", "selector": ".item", "fields": { "title": { "selector": "h2" } }, "event": "PageWatch.ITEM_FOUND" }, { "emit": { "success": "WATCHING", "failure": "WATCH_FAILED" } }]',
  },
  'browser/tab-unwatch': {
    module: 'browser',
    // emit key order: effect/http.rs:1037
    emitKeys: ['success', 'failure', 'cancelled'],
    // orbital-core wire/tab.rs:29 TabOp::ALL; http.rs:1089 ORB_TAB_EFFECT_ON_SERVER
    family: 'tab',
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'Stop a watch started with tab-watch. Resolves with the shape it produces via the trailing { emit } envelope. Keyed and cancellable like call-service: (cancel-call key) aborts the ask and fires emit.cancelled with { key }. A request outside its closed keys, or a value the kernel refuses, emits failure { error, kind: invalid, key } and asks the host nothing; a host with no browser tabs emits kind unavailable, a tab with no page script kind not-ready, an element that left the page kind not-found. The kernel validates and shapes; the host only performs raw tab and page operations. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: TAB_UNWATCH_PRODUCES,
    params: [
      { name: 'request', type: openShape({ watchId: STRING }), description: '{ watchId } is the id tab-watch resolved with' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: TAB_UNWATCH_PRODUCES },
    example: '["browser/tab-unwatch", { "watchId": "@entity.watchId" }, { "emit": { "success": "UNWATCHED", "failure": "UNWATCH_FAILED" } }]',
  },
  'browser/tab-apply': {
    module: 'browser',
    // emit key order: effect/http.rs:1037
    emitKeys: ['success', 'failure', 'cancelled'],
    // orbital-core wire/tab.rs:29 TabOp::ALL; http.rs:1089 ORB_TAB_EFFECT_ON_SERVER
    family: 'tab',
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'Apply a visual treatment to one element of a tab (hide, blur, highlight or label it, or restore it). The treatments are a closed set: no arbitrary styles or scripts. Resolves with the shape it produces via the trailing { emit } envelope. Keyed and cancellable like call-service: (cancel-call key) aborts the ask and fires emit.cancelled with { key }. A request outside its closed keys, or a value the kernel refuses, emits failure { error, kind: invalid, key } and asks the host nothing; a host with no browser tabs emits kind unavailable, a tab with no page script kind not-ready, an element that left the page kind not-found. The kernel validates and shapes; the host only performs raw tab and page operations. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: TAB_APPLY_PRODUCES,
    params: [
      { name: 'request', type: openShape({ tab: NUMBER, elementId: STRING, treatment: TAB_TREATMENT, label: STRING }), description: '{ tab } and { elementId } from tab-query or a watch, the { treatment }, and an optional { label } shown with the element' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: TAB_APPLY_PRODUCES },
    example: '["browser/tab-apply", { "tab": "@payload.tab", "elementId": "@payload.elementId", "treatment": "hide", "label": "Not now" }, { "emit": { "success": "APPLIED", "failure": "APPLY_FAILED" } }]',
  },
  'browser/tab-apply-many': {
    module: 'browser',
    // emit key order: effect/http.rs:1037
    emitKeys: ['success', 'failure', 'cancelled'],
    // orbital-core wire/tab.rs:29 TabOp::ALL; http.rs:1089 ORB_TAB_EFFECT_ON_SERVER
    family: 'tab',
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'Apply a list of treatments in one ask per tab. An element that left the page, or a tab that closed, is listed in missing instead of failing the rest. Resolves with the shape it produces via the trailing { emit } envelope. Keyed and cancellable like call-service: (cancel-call key) aborts the ask and fires emit.cancelled with { key }. A request outside its closed keys, or a value the kernel refuses, emits failure { error, kind: invalid, key } and asks the host nothing; a host with no browser tabs emits kind unavailable, a tab with no page script kind not-ready, an element that left the page kind not-found. The kernel validates and shapes; the host only performs raw tab and page operations. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: TAB_APPLY_MANY_PRODUCES,
    params: [
      { name: 'request', type: openShape({ items: list(openShape({ tab: NUMBER, elementId: STRING, treatment: TAB_TREATMENT, label: STRING })) }), description: '{ items } each { tab, elementId, treatment, label? }' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: TAB_APPLY_MANY_PRODUCES },
    example: '["browser/tab-apply-many", { "items": "@payload.items" }, { "emit": { "success": "APPLIED_MANY", "failure": "APPLY_FAILED" } }]',
  },
  'browser/tab-act': {
    module: 'browser',
    // emit key order: effect/http.rs:1037
    emitKeys: ['success', 'failure', 'cancelled'],
    // orbital-core wire/tab.rs:29 TabOp::ALL; http.rs:1089 ORB_TAB_EFFECT_ON_SERVER
    family: 'tab',
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'Perform an interaction on one element of a tab: click it, focus it, or type text into it. Resolves with the shape it produces via the trailing { emit } envelope. Keyed and cancellable like call-service: (cancel-call key) aborts the ask and fires emit.cancelled with { key }. A request outside its closed keys, or a value the kernel refuses, emits failure { error, kind: invalid, key } and asks the host nothing; a host with no browser tabs emits kind unavailable, a tab with no page script kind not-ready, an element that left the page kind not-found. The kernel validates and shapes; the host only performs raw tab and page operations. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: TAB_ACT_PRODUCES,
    params: [
      { name: 'request', type: openShape({ tab: NUMBER, elementId: STRING, action: TAB_ACTION, text: STRING }), description: '{ tab } and { elementId }, the { action } and, for type, the { text }' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: TAB_ACT_PRODUCES },
    example: '["browser/tab-act", { "tab": "@payload.tab", "elementId": "@payload.elementId", "action": "click" }, { "emit": { "success": "DONE", "failure": "ACT_FAILED" } }]',
  },
  'browser/tab-capture': {
    module: 'browser',
    // emit key order: effect/http.rs:1037
    emitKeys: ['success', 'failure', 'cancelled'],
    // orbital-core wire/tab.rs:29 TabOp::ALL; http.rs:1089 ORB_TAB_EFFECT_ON_SERVER
    family: 'tab',
    category: 'std-browser',
    minArity: 1,
    maxArity: 2,
    description:
      'Capture what a tab shows: the host brings the tab to the front of its window and captures the window, as png (the default) or jpeg (an optional quality from 0 to 100). Hands back { tab, format, image, key } with the image as bytes. Resolves with the shape it produces via the trailing { emit } envelope. Keyed and cancellable like call-service: (cancel-call key) aborts the ask and fires emit.cancelled with { key }. A request outside its closed keys, or a value the kernel refuses, emits failure { error, kind: invalid, key } and asks the host nothing; a host with no browser tabs emits kind unavailable, a tab the browser will not capture kind not-ready. The kernel validates and shapes; the host only performs raw tab operations. Client only.',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: TAB_CAPTURE_PRODUCES,
    params: [
      { name: 'request', type: openShape({ tab: NUMBER, format: TAB_IMAGE_FORMAT, quality: NUMBER }), description: '{ tab }, an optional { format } (png or jpeg) and, for jpeg, an optional { quality } from 0 to 100' },
      {
        name: 'options',
        type: MODEL_OPTIONS,
        description: 'Optional trailing options: { key } names the call for cancel-call and is echoed as key; { emit: { success, failure, cancelled } } routes the result',
        optional: true,
      },
    ],
    effect: { kind: 'custom', produces: TAB_CAPTURE_PRODUCES },
    example: '["browser/tab-capture", { "tab": "@entity.tab", "format": "png" }, { "emit": { "success": "CAPTURED", "failure": "CAPTURE_FAILED" } }]',
  },
};
