# std-async — Recipe

**Status**: cut from registry on 2026-04-25 (was atom)
**Kind**: atom

## Why a recipe and not a behavior

Generic async wrapper duplicates `std-cache-aside` (memoised reads) and `std-circuit-breaker` (failure guard). Pick the specific one. The catch-all `[idle] -> [pending] -> [success]/[failed]` machine added nothing on top.

## Sketch

```
[idle] -START-> [pending] -OK-> [success]
                    |
                    +-FAIL-> [failed]
```

## How to author inline

```
;; For cached reads:
;;   uses Cache from "std/behaviors/std-cache-aside"
;; For breaker-protected calls:
;;   uses Breaker from "std/behaviors/std-circuit-breaker"
```
