# Std specs

Design contracts for the generic substrate, written before the atom that satisfies them. A spec is an orbital of only `expects` lines (`docs/Almadar_LOLO_Spec_Proposal.md`): names and types, no topology. The atom or organism that implements it binds it with `uses Spec from "almadar-std/<name>"` (a spec resolves by its file name, like any behavior); `orb validate` then fails until every entity, field, trait event and page it names exists.

Flow: spec → `almadar-std` atom → (organism) → `almadar-behaviors` spec → atom → organism. Keep these specs subject-agnostic; subject vocabulary belongs in `almadar-behaviors/spec`.

A spec sits under the same folder path as the behavior it specs: the spec for `infra/atoms/std-retry.lolo` is `spec/infra/retry.lolo`, for `ui/game/atoms/std-score.lolo` it is `spec/ui/game/score.lolo`. The folder does not change binding (a spec still resolves by its file name).

| Spec | Satisfied by |
|---|---|
| `infra/approval-gate.lolo` | `std-approval-gate` (bound) |
| `infra/audit-trail.lolo` | `std-audit-capture` |
| `infra/timeout.lolo` | `std-timeout` |
| `infra/retry.lolo` | `std-retry` (bound; composers that rename the trait, `std-webhook` and its realizations, owe it under their own name) |
| `infra/api-keys.lolo` | `std-api-keys` |
| `ml/label-capture.lolo` | `std-ml-label-capture` |
| `ui/core/gallery.lolo` | `std-gallery` |
| `infra/audit-entry.lolo` | any program with the audit row (`std-audit-capture`, `std-document-mgmt`) |
| `infra/throttle.lolo` | `std-throttle` (bound; proves `open ⇒ suppressed = 0`) |
| `infra/cooldown.lolo` | `std-cooldown` (bound; proves the remaining time is never negative) |
| `infra/circuit-breaker.lolo` | `std-circuit-breaker` (bound; `std-api-gateway` owes it under its own trait name) |
| `infra/rate-limiter.lolo` | `std-rate-limiter` (bound) |
| `ui/game/score.lolo` | `std-score` (bound; score never negative) |
| `infra/lifecycle.lolo` | `std-lifecycle` (bound; a dry run never reaches the writing state) |
| `infra/data-import.lolo` | `std-data-import` (bound; `project-friday` proves it) |
| `infra/analytics.lolo` | `std-analytics` (bound; changing the status vocabulary or the page path fails it) |
| `infra/analytics-collector.lolo` | `std-analytics-collector` (bound; dropping `AnalyticsStats` from the page fails it) |
| `infra/cli.lolo` | `std-cli` (bound; moving the busy edge out of `running` fails it) |
| `infra/dependency-audit.lolo` | `std-dependency-audit` (bound; dropping the busy `AUDIT` edge in `auditing` fails it) |
| `infra/infra-projection.lolo` | `std-infra-projection` (bound; a page mounting another trait fails it) |
| `infra/name-claim.lolo` | `std-name-claim` (bound; both entities `[persistent]`, written only through a `persist batch`; a batch that stops writing `NameHolder` fails it) |
| `infra/deployment-registry.lolo` | `std-deployment-registry` (bound; all three entities `[persistent]`, written only through `persist batch`) |
| `infra/github.lolo` | `std-github` (bound; dropping `status` from `GITHUB_GRAPHQL_FAILED` fails it) |
| `infra/ci-status.lolo` | `std-ci-status` (bound; dropping the `CI_STATUS_REFRESH` edge in `loading` fails it) |

One spec per atom: a spec binds to the whole program that imports it, so a spec covering two atoms fails until both are composed. A composer owes an atom's spec under its own names: a trait reference's rename, `events`, `linkedEntity` and `fields`, or an orbital import's prefix and remaps (`docs/Almadar_LOLO.md`, Specs).

A spec states what the atom is, in the real syntax with every body left off: `expects entity X [persistent] { @key … @read none "…" }`, `expects trait T { state idle { E -> next }  emits { E { fields } } }`, `expects page "/p" -> T`. `orb validate` fails until each stated storage mode, mark, policy, state, edge, payload field and mounted trait exists, and a persistent entity is actually written and an emitted event actually fired. A spec may `uses` another spec and then owes both.

## What each spec demonstrates

| Obligation | Example |
|---|---|
| Persistent entity, written by the program | `approval-gate`, `audit-trail`, `api-keys`, `label-capture` |
| `[runtime]` entity, `CallKey` field | `timeout`, `retry` |
| `[runtime, shared]` | `gallery` |
| `@key` field mark | `label-capture` |
| `@read none "reason"` waiver | `approval-gate` |
| Event names that must be fired | `timeout`, `retry`, `gallery` |
| Event payload fields, types and required marks | `api-keys` |
| Trait states and a direct edge | `approval-gate`, `retry`, `timeout`, `label-capture` |
| Page with mounted traits | every spec |
| A spec built on another spec (`uses`) | `audit-trail` on `audit-entry` |

Not shown in a real spec: `@unique` (no atom carries it yet) and `@create`/`@update`/`@delete` policies (they belong to organisms; see `almadar-behaviors/spec/document-center`); `[local]` is in `almadar-behaviors/spec/learner-tuning`.

An atom-level spec that names the atom's own trait or page cannot be satisfied by an organism that composes the atom under another name, so a spec meant for organisms to build on states the entity only (`audit-entry`).

## Seeing a violation

Each line below, changed in the spec (or the provider), makes `orb validate` fail:

| Change | Error |
|---|---|
| `keyHash : number!` in `api-keys` | `ORB_S_EXPECTED_FIELD_TYPE_MISMATCH` |
| `reason : string!` on `API_KEY_FAILED` | `ORB_S_EXPECTED_FIELD_NOT_PROVIDED` |
| `input : string @key` in `label-capture` | `ORB_S_EXPECTATION_PROVIDER_MISMATCH` |
| `[runtime, local]` in `gallery` | `ORB_S_EXPECTATION_PROVIDER_MISMATCH` |
| `ApiKeyRecord [runtime]` in `api-keys` | `ORB_S_EXPECTATION_PROVIDER_MISMATCH` |
| `CAPTURE -> done` in `label-capture` | `ORB_S_EXPECTATION_UNSATISFIED` |

## Proof specs

`@invariant` and `@holds` lines make `orb validate` prove the program keeps them (`docs/Almadar_LOLO_Spec_Proposal.md` §7). A bound spec is imposed on every composer, so bind a proof spec in an atom only when every organism that composes it keeps its trait name and entity (G-ORB-378). `retry.lolo` and `approval-gate.lolo` carry propositions but stay unbound for that reason. Proofs are over the configured program, so an atom's default knobs decide which transitions are checked (G-ORB-376).
