# std-related-master-detail — Recipe

**Status**: cut from registry on 2026-04-25 (was molecule)
**Kind**: molecule

## Why a recipe and not a behavior

Composition of `std-related` + master/detail. Two-recipe stack: pick a master, render its hydrated relations in a sibling pane.

## Sketch

```
RelatedMaster        RelatedDetail
[showing:id] ----------> [shown(relations)]
```

## How to author inline

```
uses Related from "std/behaviors/std-related"
;; the related field on the master is hydrated upstream
```
