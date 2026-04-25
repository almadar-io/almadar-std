# std-authorizer — Recipe

**Status**: proposed (never shipped)
**Kind**: atom

## Why a recipe and not a behavior

Gate every transition by actor role. Sits in front of any destructive coordinator, reads the actor's role, emits the original event or `ACTION_DENIED`. Same wedge shape as `std-confirmation`, different decision input.

## Sketch

```
[idle] -REQUEST-> [checking] -ALLOWED-> [idle]
                       |
                       +-DENIED-> [idle]   (emits ACTION_DENIED)
```

## How to author inline

```
;; trait DeleteAuthorizer = Auth.traits.RoleGate -> Item {
;;   config: { roles: ["admin", "editor"] }
;; }
```
