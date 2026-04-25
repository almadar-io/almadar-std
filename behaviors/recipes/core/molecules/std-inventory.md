# std-inventory — Recipe

**Status**: cut from registry on 2026-04-25 (was molecule)
**Kind**: molecule

## Why a recipe and not a behavior

Browse over an inventory entity, with stock-level columns. Pure domain example. The std-list molecule covers the structural pattern.

## Sketch

```
Browse                  Persistor
[browsing] -ADJUST(qty)-> ... -DO_ADJUST-> persist update
```

## How to author inline

```
;; uses Browse from "std/behaviors/std-browse" -> InventoryItem
;; coordinator handles ADJUST events
```
