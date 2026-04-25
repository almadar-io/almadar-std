# std-notification — Recipe

**Status**: cut from registry on 2026-04-25 (was atom; subsumed by Notifier coordinator)
**Kind**: atom

## Why a recipe and not a behavior

The atom held a hidden/visible pair, which is just `Toast.show()`. The reusable behavior is the **Notifier coordinator** (proposed): listen for `SAVED` / `DELETED` / `FAILED` from any persistor and forward to a toast surface. Until that lands, drive notifications from the molecule's coordinator inline.

## Sketch

```
[hidden] -SHOW-> [visible] -DISMISS-> [hidden]
            (auto-dismiss after T)
```

## How to author inline

```
;; Coordinator transition:
;;   ITEM_SAVED -> idle
;;     (toast "Saved")
```
