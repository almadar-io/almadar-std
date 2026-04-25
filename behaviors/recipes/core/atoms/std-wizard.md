# std-wizard — Recipe

**Status**: cut from registry on 2026-04-25 (was atom; was already DEPRECATED in header)
**Kind**: atom

## Why a recipe and not a behavior

Already marked DEPRECATED. Tried to atomize a topology whose step count varies per consumer. Use `std-wizard-form` molecule (kept in registry) for multi-step entity creation, or hand-roll the step machine in your coordinator.

## Sketch

```
[step1] -NEXT-> [step2] -NEXT-> [done]
   ^         |
   +<-BACK---+
```

## How to author inline

```
;; Author the steps explicitly in your molecule's coordinator.
;; Variable-step topologies are not portable as an atom.
```
