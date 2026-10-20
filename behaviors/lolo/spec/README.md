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
| `infra/api-key-verifier.lolo` | `std-api-key-verifier` (bound) |
| `infra/stream-ticket.lolo` | `std-stream-ticket` (bound) |
| `infra/bearer-verify.lolo` | `std-bearer-verify` (unbound until WS-0 crypto operators land; `KeyDocument` persistent, verdicts emit `BEARER_VERIFIED { viewer }` / `BEARER_REFUSED { reason }`) |
| `ml/label-capture.lolo` | `std-ml-label-capture` |
| `ml/llm-provider.lolo` | `std-llm` (bound; dropping `LLM_FAILED` or the `LLM_GENERATE`/`LLM_CLASSIFY`/`LLM_EMBED` arms fails it) |
| `ui/core/gallery.lolo` | `std-gallery` |
| `infra/audit-entry.lolo` | any program with the audit row (`std-audit-capture`, `std-document-mgmt`) |
| `infra/throttle.lolo` | `std-throttle` (bound; proves `open ⇒ suppressed = 0`) |
| `infra/cooldown.lolo` | `std-cooldown` (bound; proves the remaining time is never negative) |
| `infra/circuit-breaker.lolo` | `std-circuit-breaker` (bound; `std-api-gateway` owes it under its own trait name) |
| `infra/rate-limiter.lolo` | `std-rate-limiter` (bound) |
| `infra/http-policy.lolo` | `std-http-policy` (bound; CORS preflight/echo, `/api` security headers, 16 MiB body limit, 1 KiB compression threshold from `orbital-server` `http_layers.rs`; rate limiting stays `std-rate-limiter`) |
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
| `infra/ci-run-logs.lolo` | `std-ci-run-logs` (bound; dropping the busy `CI_LOGS_LOAD` edge in `reading` fails it) |
| `infra/github-billing.lolo` | `std-github-billing` (bound; dropping `totalNetUsd` from `BILLING` fails it) |
| `infra/cloud-run-board.lolo` | `std-cloud-run-board` (bound; dropping the busy `CLOUD_RUN_REFRESH` edge in `reading` fails it) |
| `infra/app-hosting-board.lolo` | `std-app-hosting-board` (bound; dropping the queueing `AH_LOGS_LOAD` edge in `reading` fails it) |
| `infra/aws-board.lolo` | `std-aws-board` (bound; dropping `estimatedMonthlyCost` from `AWS_BOARD` fails it) |
| `infra/training-board.lolo` | `std-training-board` (bound; dropping the busy `TRAINING_REFRESH` edge in `reading` fails it) |
| `infra/llm-spend-board.lolo` | `std-llm-spend-board` (bound; both entities `[persistent]`, one written by `persist create`, one by `persist upsert`) |
| `infra/tab-capture.lolo` | `std-tab-capture` (bound; dropping `CAPTURE_FAILED` from the atom fails it) |
| `infra/file-drop.lolo` | `std-file-drop` (bound) |
| `infra/credential-admin.lolo` | `std-credential-admin` (bound; dropping the `CRED_ADMIN_GATE` edge fails it) |
| `infra/store-selection.lolo` | `std-store-selection` (bound; `reading` keeps `poolMax` absent or >= 0) |
| `infra/row-store.lolo` | the store drivers (unbound; declares the `Row*` record types the verbs and replies carry) |
| `infra/server.lolo` | the WS-S server program (unbound; route contract of `orbital-server`) |
| `infra/mock-seed.lolo` | `std-mock-seed` (bound; composes `std-mock-random` for the seeded draws; the index strategy matches the `sample-rows.index.json` golden on every row) |
| `infra/redis.lolo` | `std-redis` (bound; RESP over `os/tcp-connect`/`send`/`recv`/`close`; dropping the `handshaking`/`awaiting`/`closing` states or the `REDIS_WIRE_SENT` emit fails it) |

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
| Config knob with its type and default (`expects config { stdio : string = "pipe" }`) | `cli` |

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
