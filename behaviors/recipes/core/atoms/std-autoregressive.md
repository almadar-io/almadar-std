# std-autoregressive — Recipe

**Status**: cut from registry on 2026-04-25 (was atom)
**Kind**: atom

## Why a recipe and not a behavior

Misplaced in `core/`. The behavior is ML-specific (token-by-token generation) and belongs in `ml/` if anywhere. Two-state machine that never composed with the core surface.

## Sketch

```
[idle] -GENERATE-> [streaming] -DONE-> [idle]
```

## How to author inline

```
;; If you need it back, author it inline in an agent molecule:
;;   uses Provider from "std/behaviors/std-agent-provider"
```
