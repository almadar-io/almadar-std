# std-calendar-booking — Recipe

**Status**: cut from registry on 2026-04-25 (was molecule)
**Kind**: molecule

## Why a recipe and not a behavior

Calendar + Modal + Confirmation for booking flows. Three-trait recipe: pick a slot, fill modal form, confirm before persist.

## Sketch

```
Calendar              Modal-form                  Confirm
[picked:date] -SLOT-> [open] -SAVE-> ... -REQUEST-> [confirming] -CONFIRM-> persist create
```

## How to author inline

```
uses Calendar from "std/behaviors/std-calendar"
uses Modal    from "std/behaviors/std-modal"
uses Confirm  from "std/behaviors/std-confirmation"
```
