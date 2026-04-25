# std-drawer-master-list — Recipe

**Status**: cut from registry on 2026-04-25 (was molecule)
**Kind**: molecule

## Why a recipe and not a behavior

Browse on the left (60%), Drawer on the right (40%) for the focused row. Layout recipe — pure composition of `std-browse` + `std-drawer` with a focus event between them.

## Sketch

```
Browse                    Drawer
[browsing] -FOCUS(id)-> [open(id)] -CLOSE-> [closed]
```

## How to author inline

```
uses Drawer from "std/behaviors/std-drawer"
;; layout splits 60/40, Drawer's OPEN listens on Browse's FOCUS
```
