<div align="center">

# @almadar/std

**The generic `.lolo` standard library: subject-agnostic atoms and organisms that every Almadar app composes.**

[![CI](https://github.com/almadar-io/almadar-std/actions/workflows/ci.yml/badge.svg)](https://github.com/almadar-io/almadar-std/actions/workflows/ci.yml)
[![Publish](https://github.com/almadar-io/almadar-std/actions/workflows/publish.yml/badge.svg)](https://github.com/almadar-io/almadar-std/actions/workflows/publish.yml)
[![npm](https://img.shields.io/npm/v/@almadar/std)](https://www.npmjs.com/package/@almadar/std)
[![license](https://img.shields.io/badge/license-BSL--1.1-blue)](./LICENSE)

</div>

<p align="center"><sub>Part of <a href="https://github.com/almadar-io/orb"><b>Orb</b></a>: a programming language of composable state machines. <a href="https://orb.almadar.io">orb.almadar.io</a></sub></p>

`@almadar/std` is the substrate of the Almadar language: the behaviors (state machines in `.lolo`) and the operator table that programs build on. A behavior here is generic and subject-agnostic, with all vocabulary declared in config; themed, product-shaped behaviors live downstream in [`@almadar-io/behaviors`](https://github.com/almadar-io/behaviors). The package ships `.lolo` source, the lowered `.orb` registry and a TypeScript entry that exposes the operator registry (`STD_OPERATORS`, `getStdOperatorMeta`, `isKnownStdOperator`).

## Where this fits

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/almadar-io/orb/main/static/img/readme/architecture/almadar-std-dark.svg">
  <img src="https://raw.githubusercontent.com/almadar-io/orb/main/static/img/readme/architecture/almadar-std-light.svg" width="100%" alt="Where almadar-std sits in the Almadar architecture">
</picture>

| Upstream (this repo depends on) | Downstream (depends on this repo) |
|---|---|
| [orb](https://github.com/almadar-io/orb): the `orb` binary validates, lowers and runs every `.lolo` here | [behaviors](https://github.com/almadar-io/behaviors): themed organisms that compose std atoms through `uses` (peer dependency on `@almadar/std`) |
| `@almadar/core` (in [orbital-shell-typescript](https://github.com/almadar-io/orbital-shell-typescript)): language data, patterns, types | [lolo-ar · lolo-sl](https://github.com/almadar-io/lolo-ar): language packs (std lists them as dev dependencies for its tests) |
| | Apps and sites (builder, kflow-academy, nata, rawi, almadar) through `behaviors` |

## Quick start

```bash
npm install @almadar/std
```

```ts
import { isKnownStdOperator, getStdOperatorMeta } from '@almadar/std';

isKnownStdOperator('str/len');          // is this an operator in the std table?
getStdOperatorMeta('str/len');          // its metadata, or undefined
```

The package also exports `@almadar/std/registry`, `@almadar/std/modules/*` and `@almadar/std/canonical-operators.json`. Node 22 or newer.

Compatibility: the package declares `"orb": { "language": "^1" }` and `"orbLanguage": { "language": "^1" }` in `package.json`. That is a range over the language-data version `@almadar/core` publishes as `orbLanguage.version`; the range is checked against the language data installed, and no longer against the orb binary's version.

## What's inside

Source is authored under `behaviors/lolo/<topic>/{atoms,organisms}`. An atom is one orbital and owns its topology; an organism collects orbitals through `uses`. `behaviors/registry/` and `behaviors/functions/` are emitted from the `.lolo` and never hand-edited. std never `uses` a `@almadar-io/behaviors` behavior in any spelling (publish fails on it).

860 `.lolo` files outside `spec/`, in 13 topics, plus 357 design-contract specs:

| Topic | Purpose | Files |
|---|---|---|
| `agent` | Agent building blocks: context, planner, pool, memory, session, fix loop, evals | 14 |
| `auth` | Bearer and API-key verification, OAuth, permission matrix, row access control, dev personas | 12 |
| `cli` | The `orb` commands and lints written in `.lolo` (`std-orb-*`) | 220 |
| `codec` | Encodings and formats: sha256, gzip, brotli, tar, toml, semver, x509 | 11 |
| `connect` | External services and models: LLM providers, calendar, page watch, asset packs | 38 |
| `dev` | Verification and testing helpers: verify plans, mock random, fork env, machine inspection | 24 |
| `flow` | Time and sequencing: lifecycle, queue, cooldown, timeout, approval gate, game clock | 23 |
| `mem` | In-memory buffers | 1 |
| `ml` | Classification, inference, tokenizing and vector lookup | 21 |
| `net` | HTTP policy, dispatch, SSE, compression, sidecar fetch | 22 |
| `ops` | Operations boards and hosts: docker, cloud, analytics, program host | 25 |
| `store` | Record stores and persistence: Postgres, file, cache-aside, migrations, RESP client | 32 |
| `ui` | `ui-*` molecules (`core` 287, `game` 82, `learning` 37, `avl` 11) | 417 |
| `spec` | Specs: `expects`-only orbitals written before the atom that satisfies them (see `behaviors/lolo/spec/README.md`) | 357 |

Counts are `.lolo` files per folder. The `ui-*` molecules are hand-authored source.

### Browse the behaviors

```bash
orb behaviors catalog              # every behavior with its metadata
orb behaviors describe <name>      # events, knobs, capabilities of one behavior
```

The launchpad (the `std-launchpad` behavior, which `orb` starts when run with no command) lists every behavior and runs each one, which makes it the behavior playground.

## Development

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
orb validate <each .lolo you touched>      # 0 errors and 0 warnings
pnpm exec eslint --no-warn-ignored --max-warnings 0 <files you touched>
```

CI runs on Node 22 and 24 (typecheck, materialize, build, lint, gate scripts). The repo uses Git LFS: run `git lfs pull` after cloning. Open gaps are tracked in [`Almadar_Gaps.md`](./Almadar_Gaps.md). Work on `main` only; releases go through the monorepo cascade and a `v*` tag, never a manual publish.

## Docs

- [Orb documentation](https://orb.almadar.io/docs): the language, the `orb` CLI and how the pieces fit

## License

Business Source License 1.1 (see [LICENSE](./LICENSE)). Converts to Apache 2.0 on 2030-02-01. Non-commercial production use and internal evaluation are free.
