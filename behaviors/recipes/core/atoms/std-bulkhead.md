# std-bulkhead — Recipe

**Status**: proposed (never shipped)
**Kind**: atom

## Why a recipe and not a behavior

Per-tenant resource pool isolation. Keyed rate-limiter where the key is the actor/tenant. One runaway tenant hits its own ceiling without starving others.

## Sketch

```
[tenant:A pool open] -HIT-> [tenant:A pool open]   (independent counter per tenant)
[tenant:A pool full] -HIT-> [tenant:A pool full]   (REJECTED, tenant B unaffected)
```

## How to author inline

```
;; trait TenantBulkhead = Bulkhead.traits.PerTenantQueue -> Request {
;;   config: { capacity: 50, key: "@actor.tenantId" }
;; }
```
