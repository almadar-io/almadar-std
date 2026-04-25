# std-loading — Recipe

**Status**: cut from registry on 2026-04-25 (was atom)
**Kind**: atom

## Why a recipe and not a behavior

The loading state already exists in every Browse-shaped atom (`[loading] -OK-> [browsing]`). This atom duplicated it for no gain. If you need a loading spinner, render it in your trait's `loading` state directly.

## Sketch

```
[idle] -START-> [loading] -OK-> [loaded]
                   |
                   +-FAIL-> [error]
```

## How to author inline

```
(render-ui main { type: "stack", direction: "vertical", gap: "md", align: "center", children: [{ type: "spinner" }, { type: "typography", variant: "caption", color: "muted", content: "Loading…" }] })
```
