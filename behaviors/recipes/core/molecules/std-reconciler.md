# std-reconciler — Recipe

**Status**: proposed (never shipped)
**Kind**: molecule

## Why a recipe and not a behavior

Pick a winner when local state drifts from server. For optimistic-update molecules where the entity changed both client and server-side between fetch and save. Default policy is configurable (server-wins, local-wins, merge-via-rule), with `[conflict]` exposing the diff to the UI when policy is 'ask'.

## Sketch

```
[synced] -LOCAL_EDIT-> [dirty] -SERVER_PUSH-> [conflict] -PICK_LOCAL-> [synced]
                                                       -PICK_SERVER-> [synced]
                                                       -MERGE------> [synced]
```

## How to author inline

```
;; uses Versioner from "std/behaviors/std-versioner"
;; uses Reconciler from "std/behaviors/std-reconciler"
;; trait CartReconcile = Reconciler.traits.OptimisticMerge -> CartItem {
;;   config: { policy: "ask" }
;; }
```
