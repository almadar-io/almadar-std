# std-lock — Recipe

**Status**: proposed (never shipped)
**Kind**: atom

## Why a recipe and not a behavior

Mutex per entity. Two siblings on different tabs both clicking SAVE on the same entity: the lock serializes them so only one persists. Lease has a TTL to avoid deadlocks.

## Sketch

```
[unlocked] -ACQUIRE(id)-> [locked-by-A] -RELEASE-> [unlocked]
                                  ^    |
                                  |    +-(TTL expires)-> [unlocked]
                                  +-ACQUIRE(id, B)-> [locked-by-A] (B gets DENIED)
```

## How to author inline

```
;; trait CartLock = Lock.traits.EntityMutex -> CartItem {
;;   config: { ttlMs: 30000, keyPath: "@row.id" }
;; }
```
