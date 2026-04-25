# std-messaging — Recipe

**Status**: cut from registry on 2026-04-25 (was molecule)
**Kind**: molecule

## Why a recipe and not a behavior

Chat-shaped Browse over Message entity, scrolling pinned to bottom, input at the foot. Domain example. Author inline; the structural pattern is just Browse + Modal-with-form for compose.

## Sketch

```
Browse              MessageCompose
[browsing] -SEND(text)-> [open] -SAVE-> persist create
```

## How to author inline

```
;; std-list shape applied to chat: scroll to bottom, send-on-enter
```
