# std-notifier — Recipe

**Status**: proposed (never shipped)
**Kind**: atom

## Why a recipe and not a behavior

Turn coordinator outputs (`SAVED`, `DELETED`, `FAILED`) into UI toasts via a `std-notification` sibling. Removes the per-molecule boilerplate.

## Sketch

```
[idle] -SAVED-> [showing] -DISMISS-> [idle]
   ^   -DELETED-+
   +---FAILED----+
```

## How to author inline

```
;; trait OutcomeNotifier = Notifier.traits.OutcomeToast -> Item {
;;   config: { onSaved: "info", onFailed: "error" }
;; }
```
