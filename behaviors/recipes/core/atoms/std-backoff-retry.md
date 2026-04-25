# std-backoff-retry — Recipe

**Status**: proposed (never shipped)
**Kind**: atom

## Why a recipe and not a behavior

Jittered re-attempt on transient failure. Distinct from `std-circuit-breaker`: the breaker decides *whether* to call, retry decides *when to call again*. Most call sites want both, layered.

## Sketch

```
[idle] -CALL-> [pending] -OK-> [done]
                  |
                  +-FAIL-> [waiting:t] -(t elapses)-> [pending]
                              +-MAX_TRIES-> [failed]
```

## How to author inline

```
;; trait FlakyServiceRetry = Retry.traits.Backoff -> Result {
;;   config: { maxTries: 5, initialMs: 100, jitter: 0.2 }
;; }
```
