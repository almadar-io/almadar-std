# std-detail — Recipe

**Status**: cut from registry on 2026-04-25 (was molecule)
**Kind**: molecule

## Why a recipe and not a behavior

Master/detail recipe: `Browse` → click row → `Modal` as a read-only view. Author inline; the std-detail molecule was a worked example, not a reusable composition.

## Sketch

```
Browse           Modal-as-View
[browsing] -VIEW(id)-> [open]
                          |
                          +-CLOSE-> [closed]
```

## How to author inline

```
trait ItemBrowse  -> Item { ;; list, fires VIEW with row+id
}
trait ItemView    = Modal.traits.ModalRecordModal -> Item {
  events: { OPEN: "VIEW" }
  config: { readOnly: true }
}
```
