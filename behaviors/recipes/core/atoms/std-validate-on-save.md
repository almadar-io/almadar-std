# std-validate-on-save — Recipe

**Status**: cut from registry on 2026-04-25 (was atom; subsumed by Validator coordinator)
**Kind**: atom

## Why a recipe and not a behavior

Per-field validation lives in the form. Cross-field rules live in the proposed **Validator coordinator** (sits between atom refs and Persistor, runs a rule set, blocks the cascade on failure). The standalone atom did neither cleanly.

## Sketch

```
[editing] -SAVE-> [validating] -OK-> [saved]
                       |
                       +-FAIL-> [invalid] -FIX-> [editing]
```

## How to author inline

```
;; Author cross-field rules in the coordinator's transition guard:
;;   SAVE [@payload.start < @payload.end] -> idle (persist create)
;;   SAVE                                 -> idle (toast "Invalid range")
```
