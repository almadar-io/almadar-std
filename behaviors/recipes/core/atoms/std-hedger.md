# std-hedger — Recipe

**Status**: proposed (never shipped)
**Kind**: atom

## Why a recipe and not a behavior

Race two providers, take the first response, abort the loser. Useful for `std-agent-provider` failover where two LLM gateways are reachable.

## Sketch

```
[idle] -CALL-> [racing-A,B] -A_OK-> [done]   (cancel B)
                   |          -B_OK-> [done]   (cancel A)
                   +-BOTH_FAIL-> [failed]
```

## How to author inline

```
;; trait LLMHedger = Hedger.traits.Race -> Completion {
;;   config: { providers: ["openrouter", "anthropic"] }
;; }
```
