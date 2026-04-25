# std-undo — Recipe

**Status**: cut from registry on 2026-04-25 (was atom)
**Kind**: atom

## Why a recipe and not a behavior

Single state. The undo *log* belongs to the proposed Auditor coordinator (every transition gets recorded). The atom by itself added nothing actionable.

## Sketch

```
[committed] -UNDO-> [pending] -COMMIT-> [committed]
```

## How to author inline

```
;; If you need undo: store the previous payload in the coordinator's
;; data on every persist, expose UNDO that re-persists it.
```
