// Embeddings regen delegate. The sidecar artifacts (behaviors-embeddings.json,
// knob-embeddings.json) are committed publish-time data — regeneration is a
// monorepo-only step through the private @almadar/calibrate harness. In a
// standalone checkout (CI publish) the harness is absent and the prebuilt
// artifacts ship as-is.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const cli = resolve(dirname(fileURLToPath(import.meta.url)), '../../almadar-calibrate/dist/cli.js');
if (!existsSync(cli)) {
  console.log('[embed] @almadar/calibrate not in tree (standalone checkout) — embeddings ship prebuilt.');
  process.exit(0);
}
const result = spawnSync(process.execPath, [cli, 'embed'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
