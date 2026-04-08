# Std Behavior Authoring (post-Phase 3.5.G)

This directory holds the **TypeScript source** for every Almadar standard behavior. The `.orb` files in `../registry/` are **generated** by the ts-to-orb converter from these sources. The compiler embeds the registry, not these TS files.

## The two-tier model

- **`functions/atoms/std-X.ts`** — atom factories. The factory is invoked at convert time with default params; the resulting trait body becomes the canonical registry .orb. Atoms own state-machine topology (states, transitions, event keys). They are the source of truth for what an atom can do.
- **`functions/molecules/std-X.ts`** — molecule factories. They compose atoms via `extractTrait(stdAtom({...}))`. The converter detects these calls and lifts them into orb-native references with override arguments. The lifted molecule's `.orb` carries `uses[]` declarations and reference entries instead of inlined trait bodies.
- **`functions/organisms/std-X.ts`** — same model as molecules. They compose atoms and/or other molecules.

## Editing flow

Always edit the `.ts` source. Then re-run the converter:

```bash
# Convert one behavior
npx tsx tools/almadar-behavior-ts-to-orb/index.ts --name std-modal

# Convert all 138 behaviors
npx tsx tools/almadar-behavior-ts-to-orb/index.ts --all
```

The converter writes to `behaviors/registry/{atoms,molecules,organisms}/std-X.orb`. Those files are what the Rust compiler embeds and what other Almadar tooling reads.

After editing an atom whose state machine topology changed (added states, added transitions, added events), also rebuild the compiler:

```bash
cd orbital-rust && cargo build --release
```

This refreshes the embedded registry baked into the compiler binary.

## Authoring rules (Phase 3.5.G learnings)

1. **Atoms own topology.** If a molecule or organism needs a state or transition the atom doesn't have, the atom is incomplete. Extend the atom in this directory; do not post-process the molecule's bound trait variable.
2. **Permanent over conditional.** State machine elements that vary based on factory params (`if (c.saveEvent) transitions.push(...)`) cause topology mismatches when the molecule's customized output is diffed against the atom's default-params output. Make them permanent with sensible defaults instead, then molecules customize the EFFECTS of those transitions via the F.8 `effects` override field at the reference site.
3. **Use canonical patterns.** When composing std-confirmation, the REQUEST event stores `@payload.id` in `@entity.pendingId`; the CONFIRM event uses `@entity.pendingId` (NOT `@payload.id`). See `std-cart.ts` and `std-list.ts` for the worked pattern.
4. **No post-processing of bound trait variables.** The parser recognizes a small allowlist of safe mutations (`varName.name = '<lit>'`, `varName.listens = []`, `for (const e of varName.emits) { e.scope = '<lit>' }`). Anything else bails the lift to literal. The clean fix is to express the customization through factory params or to extend the atom.
5. **Run the converter and verify lift.** After any non-trivial atom or molecule edit, run the converter and confirm your behavior still appears in the "Variant references by alias" summary. If it dropped out, the lift broke and the .orb is now a literal snapshot — fix the cause before committing.

## Override surface (what molecules and organisms can do at the reference site)

When a molecule or organism imports a behavior via `uses[]` and references its trait via `{ref: "Alias.traits.X", ...}`, the following sibling fields are recognized as override arguments at the call site. The compiler's inline phase walks the resolved trait clone and applies them:

| Override | Meaning |
|---|---|
| `linkedEntity` | Rebinds the trait's entity. Rewrites every `["ref", X]` and `@X.path` reference inside. |
| `name` | Renames the inlined trait at the call site (gives it a contextual local name). |
| `events` | Per-key rename map: `{ "OPEN": "ADD_ITEM" }`. Rewrites events array, transition triggers, emit/listen event keys, `["emit", X]` SExprs. |
| `effects` | Per-event SExpression list replacement: `{ "ADD_ITEM": [["fetch", "X"], ["render-ui", ...]] }`. The unified content + effect override. |
| `listens` | Replaces the trait's `listens` array (most commonly `[]` to clear). |
| `emitsScope` | `'internal' \| 'external'`. Sets every emit's scope. |
| `config` | Reserved (not yet wired into the substitution pass). |

The state machine topology of the imported trait is fixed. States, transitions, and the event key set are owned by the atom that defines them.

## Why TS sources still exist

The TS layer:

1. **Holds atom logic.** Atoms have helper functions, content builders, and parameterized factories that aren't trivially expressible as raw `.orb`. Authoring atoms in TS is the canonical path.
2. **Bridges the converter.** The converter invokes the factory at runtime to capture the canonical trait shape, then writes the registry .orb.
3. **Feeds @almadar/agent gates and Storybook.** Several consumers still import from this directory for runtime introspection. They'll migrate over time.

This directory is **active source**, not a deprecated artifact. The naming "deprecated" never applied. What changed in Phase 3.5.G is that the **registry** at `../registry/` is now the compiler's source of truth, generated from these TS files, and molecules + organisms can also be authored as raw `.orb` files when their composition pattern is simple enough.

## Reference docs

- `/home/osamah/kflow.ai.builder/docs/Almadar_Orb_Behaviors.md` — full Phase 3.5.G writeup with the orbital-as-function model and worked examples
- `/home/osamah/kflow.ai.builder/orbital-rust/crates/orbital-compiler/tests/atomic_propagation.rs` — the acid test that proves edits to atoms propagate through molecules and organisms into the lowered OIR
- `/home/osamah/kflow.ai.builder/tools/almadar-behavior-ts-to-orb/UNCONVERTIBLE.md` — the gap report (currently empty: 100% adoption)
