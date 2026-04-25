# std-saga — Recipe

**Status**: proposed (never shipped)
**Kind**: molecule

## Why a recipe and not a behavior

Multi-step transactions with compensation. Cart's 'reserve inventory → charge card → confirm order' is the canonical hand-rolled case today. Saga makes it declarative: a list of forward steps, a list of compensations, with `[compensating-N]` walking backward on failure.

## Sketch

```
[idle] -START-> [step1] -OK-> [step2] -OK-> [step3] -OK-> [committed]
                   |             |              |
                   +-FAIL-> [compensating-1]    |
                                  <----+-FAIL---+
                              [compensating-N] -DONE-> [rolled-back]
```

## How to author inline

```
;; trait CheckoutSaga = Saga.traits.Forward -> Order {
;;   config: {
;;     steps:        [reserveInventory, chargeCard, confirmOrder],
;;     compensations: [releaseInventory, refundCard, cancelOrder]
;;   }
;; }
```
