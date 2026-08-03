// Embeddings regen delegate. The sidecar artifacts (behaviors-embeddings.json,
// knob-embeddings.json) are committed publish-time data — regeneration is a
// monorepo-only step through the private @almadar/calibrate harness. In a
// standalone checkout (CI publish) the harness is absent and the prebuilt
// artifacts ship as-is.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Explicit opt-out for the case the standalone check cannot cover: the harness
// IS present but the embedding provider is unreachable (e.g. a 429 outage).
// Opt-in only — never inferred from a failure, so a provider problem can never
// silently ship stale embeddings without someone having asked for it.
if (process.env.ALMADAR_SKIP_EMBEDDINGS === '1') {
  console.log('[embed] ALMADAR_SKIP_EMBEDDINGS=1 — skipping regen; embeddings ship prebuilt AND STALE until the next run.');
  process.exit(0);
}

const cli = resolve(dirname(fileURLToPath(import.meta.url)), '../../almadar-calibrate/dist/cli.js');
if (!existsSync(cli)) {
  console.log('[embed] @almadar/calibrate not in tree (standalone checkout) — embeddings ship prebuilt.');
  process.exit(0);
}
const result = spawnSync(process.execPath, [cli, 'embed'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
