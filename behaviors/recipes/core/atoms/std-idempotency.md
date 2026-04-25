# std-idempotency — Recipe

**Status**: proposed (never shipped)
**Kind**: atom

## Why a recipe and not a behavior

Dedupe replayed events at the edge. For inbox traits receiving webhooks, retried API calls, or any at-least-once delivery channel. Guarantees one logical execution per key.

## Sketch

```
[idle] -HIT(key)-> [check] -SEEN-> [idle]   (drop, return cached result)
                       |
                       +-NEW-> [forwarding] -DONE-> [idle]   (record key + result)
```

## How to author inline

```
;; trait WebhookInbox = Idempotency.traits.KeyedDedupe -> Event {
;;   config: { keyPath: "@payload.eventId" }
;; }
```
