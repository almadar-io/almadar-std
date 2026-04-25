# std-upload — Recipe

**Status**: cut from registry on 2026-04-25 (was atom)
**Kind**: atom

## Why a recipe and not a behavior

Single-purpose lifecycle, only meaningful inside a form. Fold the upload state into the form's coordinator: `[idle] -PICK-> [uploading] -DONE-> [ready] -SUBMIT-> [persisted]`. No need for a standalone atom.

## Sketch

```
[idle] -PICK-> [uploading] -DONE-> [ready]
                    |
                    +-FAIL-> [error] -RETRY-> [uploading]
```

## How to author inline

```
(render-ui main { type: "file-input", action: "PICK", accept: "image/*" })
```
