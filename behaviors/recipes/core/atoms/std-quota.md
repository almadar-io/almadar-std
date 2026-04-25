# std-quota — Recipe

**Status**: proposed (never shipped)
**Kind**: atom

## Why a recipe and not a behavior

Per-actor consumption ceiling. Different from rate-limiter: not 'calls per second' but 'tokens spent this month'. Wraps anything with a measurable cost (LLM tokens, API credits, storage bytes).

## Sketch

```
[under] -HIT(cost)-> [under]   (used += cost)
           ...
[under] -HIT(cost)-> [over] -HIT-> [over]   (emits THROTTLED)
                       ^
                       +<-RESET (window or top-up)
```

## How to author inline

```
;; trait LLMTokenQuota = Quota.traits.Budget -> Completion {
;;   config: { capPerActor: 100000, costPath: "@response.tokens" }
;; }
```
