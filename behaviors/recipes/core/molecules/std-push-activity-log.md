# std-push-activity-log — Recipe

**Status**: cut from registry on 2026-04-25 (was molecule)
**Kind**: molecule

## Why a recipe and not a behavior

Push subscription + Browse over activity rows. Two-trait recipe: `std-push` keeps the SSE/WebSocket alive, Browse renders the rolling list.

## Sketch

```
Push                       Browse
[subscribed] -EVENT(activity)-> ... -INIT-> [browsing]
```

## How to author inline

```
uses Push from "std/behaviors/std-push"
;; Browse listens on Push's EVENT, re-fetches
```
