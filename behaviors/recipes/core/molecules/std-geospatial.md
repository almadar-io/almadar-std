# std-geospatial — Recipe

**Status**: cut from registry on 2026-04-25 (was molecule)
**Kind**: molecule

## Why a recipe and not a behavior

Map composition — markers from a Browse, click-to-focus drives a sibling detail pane. Domain example needing real map components; author inline once the map atom exists.

## Sketch

```
Browse              MapView
[browsing] -PIN(id)-> [focused:id]
```

## How to author inline

```
;; Renders { type: "map", markers: @payload.data, action: "PIN" }
```
