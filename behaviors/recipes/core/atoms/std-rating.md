# std-rating — Recipe

**Status**: cut from registry on 2026-04-25 (was atom)
**Kind**: atom

## Why a recipe and not a behavior

UI component (5-star picker). Use `@almadar/ui`'s `Rating` directly, render inline. There is no meaningful state to coordinate.

## Sketch

```
[idle] -RATE(n)-> [rated:n]
```

## How to author inline

```
(render-ui main { type: "rating", max: 5, value: @row.score, action: "RATE" })
```
