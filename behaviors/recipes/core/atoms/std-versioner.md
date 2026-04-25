# std-versioner — Recipe

**Status**: proposed (never shipped)
**Kind**: atom

## Why a recipe and not a behavior

Etag check on write. Stops 'last writer wins' silently overwriting concurrent edits. Stamps every fetched entity with its etag and rejects writes whose etag is no longer current, kicking the molecule into the proposed Reconciler.

## Sketch

```
[idle] -READ-> [held(etag=v)] -WRITE(etag=v)-> [idle]   (server bumps to v+1)
                       |
                       +-WRITE(etag=v, server has v+1)-> [stale]   (emits CONFLICT)
```

## How to author inline

```
;; trait OptimisticWrite = Versioner.traits.EtagGuard -> Item {
;;   config: { etagPath: "@response.headers.etag" }
;; }
```
