# std-sort — Recipe

**Status**: cut from registry on 2026-04-25 (was atom)
**Kind**: atom

## Why a recipe and not a behavior

Trivial: holds one key. Coordinator can carry the sort key in payload, no need for an atom. Consumers were never importing it (zero internal uses).

## Sketch

```
[sorted:keyA] -SORT_BY(keyB)-> [sorted:keyB]
```

## How to author inline

```
;; Coordinator owns the sort key in its data block:
;;   SORT_BY -> idle (set sortKey @payload.key) (fetch X order @sortKey)
```
