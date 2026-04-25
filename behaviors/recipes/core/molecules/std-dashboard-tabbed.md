# std-dashboard-tabbed — Recipe

**Status**: cut from registry on 2026-04-25 (was molecule)
**Kind**: molecule

## Why a recipe and not a behavior

Tabs + Display panels switched by tab. Layout recipe: `std-tabs` owns the active key, sibling traits render in the panel by binding on the active tab.

## Sketch

```
Tabs                   Panel
[on:summary] ----------> [shown(summaryEntity)]
[on:activity] ---------> [shown(activityEntity)]
```

## How to author inline

```
uses Tabs from "std/behaviors/std-tabs"
;; render panel content via @trait.Tabs.activeKey
```
