# std-validator — Recipe

**Status**: proposed (never shipped)
**Kind**: atom

## Why a recipe and not a behavior

Cross-field invariants beyond per-field rules. Listens on every sibling atom's SAVE, runs a rule-set, blocks the cascade if any rule fails by emitting `VALIDATION_FAILED` with the rule + field path.

## Sketch

```
[idle] -SAVE-> [checking] -OK-> [idle]
                   |
                   +-FAIL-> [blocked]
```

## How to author inline

```
;; trait FormValidator = Validator.traits.RuleSet -> Item {
;;   config: { rules: [...] }
;; }
```
