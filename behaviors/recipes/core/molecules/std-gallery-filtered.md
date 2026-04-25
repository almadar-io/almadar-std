# std-gallery-filtered — Recipe

**Status**: cut from registry on 2026-04-25 (was molecule)
**Kind**: molecule

## Why a recipe and not a behavior

Gallery + Filter. Domain example — substitute `std-gallery` for `std-browse` in the filtered-list recipe.

## Sketch

```
Filter            Gallery
[unfiltered] -APPLY-> ... -REFRESH-> [viewing:0]
```

## How to author inline

```
uses Filter  from "std/behaviors/std-filter"
uses Gallery from "std/behaviors/std-gallery"
```
