# std-auditor — Recipe

**Status**: proposed (never shipped)
**Kind**: atom

## Why a recipe and not a behavior

Immutable log of every coordinator transition. Subscribes to a wildcard transition stream and persists each frame to an append-only log. Compliance and debugging fall out of one trait.

## Sketch

```
[listening] -ANY_TRANSITION-> [listening]
   (writes { trait, event, actor, payload, timestamp })
```

## How to author inline

```
;; trait AuditTap = Audit.traits.WildcardLog -> AuditEntry {
;;   config: { sinks: ["audit_log"] }
;; }
```
