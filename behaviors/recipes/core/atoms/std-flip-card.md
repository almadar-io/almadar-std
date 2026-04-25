# std-flip-card — Recipe

**Status**: cut from registry on 2026-04-25 (was atom)
**Kind**: atom

## Why a recipe and not a behavior

UI component for flashcards. Two states with no real coordination. The flip is local UI state; if you need it, render `<FlipCard>` directly.

## Sketch

```
[front] -FLIP-> [back]
   ^              |
   +-FLIP---------+
```

## How to author inline

```
(render-ui main { type: "flip-card", front: { ... }, back: { ... } })
```
