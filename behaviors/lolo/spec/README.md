# Std specs

Design contracts for the generic substrate, written before the atom that satisfies them. A spec is an orbital of only `expects` lines (`docs/Almadar_LOLO_Spec_Proposal.md`): names and types, no topology. The atom or organism that implements it binds it with `uses Spec from "almadar-std/<name>"` (a spec resolves by its file name, like any behavior); `orb validate` then fails until every entity, field, trait event and page it names exists.

Flow: spec → `almadar-std` atom → (organism) → `almadar-behaviors` spec → atom → organism. Keep these specs subject-agnostic; subject vocabulary belongs in `almadar-behaviors/spec`.

A spec sits under the same folder path as the behavior it specs: the spec for `flow/atoms/std-retry.lolo` is `spec/flow/retry.lolo`, for `ui/game/atoms/std-score.lolo` it is `spec/ui/game/score.lolo`. The folder does not change binding (a spec still resolves by its file name).

| Spec | Satisfied by |
|---|---|
| `cli/orb-circuit.lolo` | `std-orb-circuit` (bound; one lowered guard or effect to an AVL circuit tree of call, binding, literal, object, array and lambda nodes with the operator table's visual form, ir-calls paths and an optional per-path type; 18 replay goldens in `cli/orb-circuit.replay.goldens.json`) |
| `store/approval-gate.lolo` | `std-approval-gate` (bound) |
| `connect/asset-pack.lolo` | `std-asset-pack` (bound; loading, missing and failed keys render placeholders and emit `ASSET_PACK_MISSING` once per key; replay goldens `connect/asset-pack.replay.goldens.json`) |
| `store/audit-trail.lolo` | `std-audit-capture` |
| `store/timeout.lolo` | `std-timeout` |
| `store/retry.lolo` | `std-retry` (bound; composers that rename the trait, `std-webhook` and its realizations, owe it under their own name) |
| `store/api-keys.lolo` | `std-api-keys` |
| `store/api-key-verifier.lolo` | `std-api-key-verifier` (bound) |
| `store/stream-ticket.lolo` | `std-stream-ticket` (bound) |
| `store/bearer-verify.lolo` | `std-bearer-verify` (unbound until WS-0 crypto operators land; `KeyDocument` persistent, verdicts emit `BEARER_VERIFIED { viewer }` / `BEARER_REFUSED { reason }`) |
| `codec/semver.lolo` | `std-semver` (bound; strict parse, precedence compare, bump, node-semver ranges (^ ~ comparators, x-ranges, partials, hyphen, space-joined sets, `||`), min; optional `requestId` echoed on every answer; ~790 replay goldens generated from the semver npm package in `semver-*.replay.goldens.json`, sharded because the replay runner holds ~30 MB per case; workspace:/link:/file: pins refused) |
| `codec/toml.lolo` | `std-toml` (bound; TOML 1.0 to a Map value, date-times kept as their text, refusals by closed code with the line; 92 replay goldens from the toml.io examples checked against Python tomllib, paired refusal controls, the real `orbital-rust/Cargo.toml` in `codec/toml.replay.goldens.json`) |
| `store/jws.lolo` | `std-jws` (bound; compact RS256/ES256 JWS verify through the `rsa/verify` and `ecdsa/p256-verify` operators, claim policy stays in `std-bearer-verify`) |
| `ml/label-capture.lolo` | `std-ml-label-capture` |
| `ml/ladder.lolo` | `std-ml-ladder` (bound; `std-escalating-decision` composes both traits) |
| `ml/llm-provider.lolo` | `std-llm` (bound; dropping `LLM_FAILED` or the `LLM_GENERATE`/`LLM_CLASSIFY`/`LLM_EMBED` arms fails it) |
| `ui/core/gallery.lolo` | `std-gallery` |
| `ui/core/canvas-theme.lolo` | `std-canvas-theme` (bound; twin of `canvas_theme.rs`; `CANVAS_THEME_PRESET` merges one preset with its dark variant and resolves; 124 Chromium fixtures + 10 Rust-semantics edge cases in `ui/core/canvas-theme-{1,2,3}.replay.goldens.json`; the atom is generated text, regenerate nothing by hand) |
| `ui/core/theme-resolve.lolo` | `std-theme-resolve` (bound; twin of `theme.rs` `theme_keys`, `carry_theme_definitions`, `resolve_theme` precedence and key split; 26 replay goldens from the Rust tests, each paired with a control, in `ui/core/theme-resolve.replay.goldens.json`) |
| `ui/core/theme-resolve.lolo` (css) | `std-theme-resolve` `THEME_MERGE` and `THEME_CSS_VARS` (tokens to CSS custom properties, twin of `theme.rs` `merge_theme_tokens`, `css_axes` and `css_vars`; 64 replay goldens (the nested preset token record goes in as the preset JSON carries it and the atom flattens it) from the Rust `css_vars_tests`, each paired with a control, in `ui/core/theme-css-vars.replay.goldens.json`) |
| `ui/core/theme-boot.lolo` | `std-theme-boot` (organism in `ui/core/organisms`; composes `std-theme-resolve`, `std-canvas-theme` and `std-motion`; `THEME_BOOT` and `THEME_TOGGLE` answer one `THEME_APPLIED { theme, canvasTheme, motion }` with the kernel `SnapshotWire` field names (theme = key, base, mode, merged tokens); 13 replay goldens from three raw presets in light and dark, a toggle, a boot-mode override and unknown-key controls; once-only emission was probed by hand, see G-STD-111) |
| `ui/core/dashboard-layout.lolo` | `ui-dashboard-layout` (bound; the `SIGN_OUT` arm of `DashboardLayoutRender` ends the session with the `auth/sign-out` host ask, G-ORB-523/589; the effect is checked with `orb test --execute`, the goldens replay cannot assert client effects) |
| `ui/core/collection-fetch.lolo` | `std-collection-fetch` (bound; dropping the failure event or its `idle` edge fails it) |
| `store/audit-entry.lolo` | any program with the audit row (`std-audit-capture`, `std-document-mgmt`) |
| `store/throttle.lolo` | `std-throttle` (bound; proves `open ⇒ suppressed = 0`) |
| `store/verify-judge.lolo` | `std-verify-judge` (bound; `effects_fired` ported; `proposition_held`, `entity_data_bound` listed in `unported`) |
| `store/machine.lolo` | `std-machine` (bound; a program's transitions as rows over bounded array maps; groups of sibling unguarded transitions give one row per target, guarded groups one row per arm) |
| `store/cooldown.lolo` | `std-cooldown` (bound; proves the remaining time is never negative) |
| `store/circuit-breaker.lolo` | `std-circuit-breaker` (bound; `std-api-gateway` owes it under its own trait name) |
| `store/rate-limiter.lolo` | `std-rate-limiter` (bound) |
| `store/http-policy.lolo` | `std-http-policy` (bound; CORS preflight/echo, `/api` security headers, 16 MiB body limit, 1 KiB compression threshold from `orbital-server` `http_layers.rs`; rate limiting stays `std-rate-limiter`) |
| `ui/game/score.lolo` | `std-score` (bound; score never negative) |
| `store/lifecycle.lolo` | `std-lifecycle` (bound; a dry run never reaches the writing state) |
| `store/data-import.lolo` | `std-data-import` (bound; `project-friday` proves it) |
| `store/analytics.lolo` | `std-analytics` (bound; changing the status vocabulary or the page path fails it) |
| `store/analytics-collector.lolo` | `std-analytics-collector` (bound; dropping `AnalyticsStats` from the page fails it) |
| `store/cli.lolo` | `std-cli` (bound; moving the busy edge out of `running` fails it) |
| `ops/system-stats.lolo` | `std-system-stats` (bound; a sample reads memory, cpu, load average and uptime and the resident memory of named pids through one `ps -o pid= -o rss=` run composed from `std-cli`; a stat the host cannot answer is named in `STATS_FAILED` and left at zero, a pid `ps` does not list is `missing`, never zero; 44 replay goldens in `ops/system-stats.replay.goldens.json`, each paired with a control; the one-second `[background]` tick is not played) |
| `store/dependency-audit.lolo` | `std-dependency-audit` (bound; dropping the busy `AUDIT` edge in `auditing` fails it) |
| `store/infra-projection.lolo` | `std-infra-projection` (bound; a page mounting another trait fails it) |
| `store/name-claim.lolo` | `std-name-claim` (bound; both entities `[persistent]`, written only through a `persist batch`; a batch that stops writing `NameHolder` fails it) |
| `store/deployment-registry.lolo` | `std-deployment-registry` (bound; all three entities `[persistent]`, written only through `persist batch`) |
| `store/github.lolo` | `std-github` (bound; dropping `status` from `GITHUB_GRAPHQL_FAILED` fails it) |
| `store/ci-status.lolo` | `std-ci-status` (bound; dropping the `CI_STATUS_REFRESH` edge in `loading` fails it) |
| `store/ci-run-logs.lolo` | `std-ci-run-logs` (bound; dropping the busy `CI_LOGS_LOAD` edge in `reading` fails it) |
| `store/github-billing.lolo` | `std-github-billing` (bound; dropping `totalNetUsd` from `BILLING` fails it) |
| `store/cloud-run-board.lolo` | `std-cloud-run-board` (bound; dropping the busy `CLOUD_RUN_REFRESH` edge in `reading` fails it) |
| `store/app-hosting-board.lolo` | `std-app-hosting-board` (bound; dropping the queueing `AH_LOGS_LOAD` edge in `reading` fails it) |
| `store/aws-board.lolo` | `std-aws-board` (bound; dropping `estimatedMonthlyCost` from `AWS_BOARD` fails it) |
| `store/training-board.lolo` | `std-training-board` (bound; dropping the busy `TRAINING_REFRESH` edge in `reading` fails it) |
| `store/llm-spend-board.lolo` | `std-llm-spend-board` (bound; both entities `[persistent]`, one written by `persist create`, one by `persist upsert`) |
| `store/tab-capture.lolo` | `std-tab-capture` (bound; dropping `CAPTURE_FAILED` from the atom fails it) |
| `store/file-drop.lolo` | `std-file-drop` (bound) |
| `store/credential-admin.lolo` | `std-credential-admin` (bound; dropping the `CRED_ADMIN_GATE` edge fails it) |
| `agent/completion.lolo` | `std-agent-completion` (bound; a failed generation ends `done`, never stuck `generating`) |
| `agent/planner.lolo` | `std-agent-planner` (bound; a failed recall still plans, a failed generation still ends `planned`) |
| `ml/similarity.lolo` | `std-ml-similarity` (bound; an embed failure resolves as an abstain, never stays `embedding`) |
| `store/sha256.lolo` | `std-sha256` (unbound until the `bit/*` operators land; `SHA256_DIGEST { data, encoding }` answers `SHA256_DIGESTED { digest }` / `SHA256_REFUSED { reason }`, golden vectors in the description) |
| `store/row-store.lolo` | the store drivers (unbound; declares the `Row*` record types the verbs and replies carry) |
| `store/row-store-kv.lolo` | `std-row-store-kv` (unbound; the file driver's public contract with `config.store` for `config.dir`, so `store:` swaps drivers; waits on the `kv/*` operators) |
| `store/server.lolo` | the WS-S server program (unbound; route contract of `orbital-server`) |
| `store/mock-seed.lolo` | `std-mock-seed` (bound; composes `std-mock-random` for the seeded draws; the index strategy's goldens are the atom's own replay goldens) |
| `store/redis.lolo` | `std-redis` (bound; RESP over `os/tcp-connect`/`send`/`recv`/`close`; dropping the `handshaking`/`awaiting`/`closing` states or the `REDIS_WIRE_SENT` emit fails it) |
| `store/package-registry.lolo` | the package registry server (unbound; publish/fetch/list/yank routes, sha256 integrity, exact versions) |
| `store/tar.lolo` | `std-tar` (bound; rows carry `kind` file|directory, PAX `path`/`size` override the next entry, an unknown non-metadata PAX key refuses `pax-key`, every unsupported typeflag refuses by name; dropping the `TAR_REFUSED` emit fails it) |
| `cli/orb-packages.lolo` | `orb add|update|remove|list` + `orb engines` (unbound; golden = packages.rs / engines_cmd.rs) |

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
