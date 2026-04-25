# std-batch-selected-list — Recipe

**Status**: cut from registry on 2026-04-25 (was molecule)
**Kind**: molecule

## Why a recipe and not a behavior

Selection + Confirmation pattern over a Browse. Three-trait recipe: list shows checkboxes, toolbar appears once any row is selected, Confirmation gates the bulk action.

## Sketch

```
Selection         Browse           Confirmation
[some] -BATCH_DELETE-> ... -REQUEST-> [confirming] -CONFIRM-> [bulk delete]
```

## How to author inline

```
uses Confirm  from "std/behaviors/std-confirmation"
;; trait BatchDeleteConfirm = Confirm.traits.ConfirmActionConfirmation
;;                              -> Item { events: { REQUEST: "BATCH_DELETE" } }
```
