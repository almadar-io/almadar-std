# Std-Behavior Composition Recipes

These recipes are working examples of composing std behaviors via `@almadar/core` builders + the per-behavior factory functions. Each one is:

- A self-contained TypeScript module that imports `std{Behavior}*` factories and `@almadar/core` builders.
- Exports a final `OrbitalSchema` value built via `makeSchema(...)`.
- Includes a tiny `verify-recipe.ts` script (one per recipe) that writes the schema to a temp `.orb` and runs `~/bin/orbital validate` on it — every recipe in this folder validates clean.

The recipes are ordered from simplest to most composed. Each one demonstrates a different builder primitive or composition shape; together they cover the full surface an AI agent (orbital-agent) would use to construct schemas programmatically.

## Recipe index

| # | Recipe | Builders / factories used | What it shows |
|---|---|---|---|
| 01 | [`01-single-atom`](./01-single-atom/) | `stdModal`, `makeSchema` | Drop a single atom into a runnable schema with default params. |
| 02 | [`02-atom-with-config`](./02-atom-with-config/) | `stdModal`, typed `StdModalConfig`, `makeSchema` | Specialise an atom via its typed config block (modal title, icon, mode). |
| 03 | [`03-atom-event-rename`](./03-atom-event-rename/) | `stdModal` with `events:` + `traitName:`, `makeSchema` | Rename atom events at the call site (`OPEN → ADD_ARTICLE`); page-trait refs stay in sync via the inline-phase rename map. |
| 04 | [`04-two-atoms-shared-entity`](./04-two-atoms-shared-entity/) | `stdBrowse` + `stdModal` + `stdConfirmation` inside `makeOrbitalWithUses`, `makeSchema` | Combine three atoms in one orbital with one shared entity — the std-cart pattern. Browse paints the initial list at /cart so the page renders on land. |
| 05 | [`05-cross-trait-listen`](./05-cross-trait-listen/) | `stdBrowse` + `stdModal` + `stdConfirmation` with `listens:` override, `makeSchema` | Same shape as 04 but the confirmation declares an explicit cross-trait listen on REQUEST_REMOVE. |
| 06 | [`06-multi-orbital-app`](./06-multi-orbital-app/) | `stdBrowse` + `stdModal` per orbital (Article + Comment), `makeSchema` | Split a domain across orbitals; each orbital has its own browse + modal pair so /articles and /comments both render lists on land. |
| 07 | [`07-typed-payload-listener`](./07-typed-payload-listener/) | per-event payload interfaces (`StdModalSavePayload`), typed cross-trait wiring | Use the regenerator's typed payload interfaces to construct cross-trait listens with shape parity. |
| 08 | [`08-organism-slice`](./08-organism-slice/) | One orbital sliced out of `stdCms`, `makeSchema` | Pick a single sub-orbital out of an organism (multi-orbital factory) and embed it elsewhere. |
| 09 | [`09-effect-override`](./09-effect-override/) | `stdModal` with `effects:` Replace, `makeSchema` | Replace the SExpression effect body for one event end-to-end. |
| 10 | [`10-whole-app`](./10-whole-app/) | All of the above composed | A complete app: multi-orbital, multi-atom (browse + modal + confirmation), cross-trait listens, page wiring. |

## Running the recipes

From the repo root:

```bash
node packages/almadar-std/behaviors/functions/recipes/01-single-atom/verify-recipe.ts
```

Each `verify-recipe.ts` prints the recipe's schema, writes it to `/tmp/recipe-<n>-<name>.orb`, and runs `~/bin/orbital validate`. A clean run is `Validation: ✅ CLEAN`.

## Why this matters for orbital-agent

An AI agent constructing schemas needs every primitive these recipes demonstrate. The agent's tool call to `stdModal({entityName, traitName, events, config, ...})` produces structurally-identical output to what these recipes compose by hand. If a recipe validates, the agent's equivalent tool call validates. The recipes serve as both **documentation** for the composition surface and **regression tests** that the surface stays usable.
