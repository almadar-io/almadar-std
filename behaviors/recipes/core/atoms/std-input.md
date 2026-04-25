# std-input — Recipe

**Status**: cut from registry on 2026-04-25 (was atom)
**Kind**: atom

## Why a recipe and not a behavior

UI component, not a state machine. The form coordinator already owns submit/validate state. The atom held three states (empty/filled/invalid) but every form already drives those from the field's value, so the trait was never reused.

## Sketch

```
[empty] -TYPE-> [filled] -VALIDATE-> [valid]
               |                 |
               |                 +-> [invalid]
               +-CLEAR-> [empty]
```

## How to author inline

```
(render-ui main { type: "input", name: "title", required: true, placeholder: "Title" })
```
