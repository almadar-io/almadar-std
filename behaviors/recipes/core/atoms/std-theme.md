# std-theme — Recipe

**Status**: cut from registry on 2026-04-25 (was atom)
**Kind**: atom

## Why a recipe and not a behavior

Single state. Theme is configuration via context, not a transition graph. Belongs in an app-level provider (`ThemeProvider` from `@almadar/ui`), not the registry.

## Sketch

```
[active]   (one state, no transitions; just config)
```

## How to author inline

```
;; In your app shell:
;;   <ThemeProvider theme={resolved}>...</ThemeProvider>
;; Switch via @almadar/ui's existing context, not via an orb trait.
```
