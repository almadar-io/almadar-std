# std-debouncer — Recipe

**Status**: proposed (never shipped)
**Kind**: atom

## Why a recipe and not a behavior

Collapse rapid events into one. Caller sees a single downstream event after the burst settles. For search-as-you-type, scroll commits, slider drags.

## Sketch

```
[open] -HIT-> [pending] -(idle for T)-> [open]   (fires the LAST hit)
                  ^   |
                  +-HIT (resets timer)
```

## How to author inline

```
;; trait SearchInputDebouncer = Debouncer.traits.Coalesce -> Query {
;;   config: { window: 300 }
;; }
```
