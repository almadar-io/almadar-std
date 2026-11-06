import { readFileSync } from 'node:fs';
import { ScoreKeeper } from './packages/shared/src/traits/rendered.ts';
import type { ScoreState } from './packages/shared/src/types/entities.ts';
import type { ScoreKeeperUNITS_CHANGEDPayload } from './packages/shared/src/types/events.ts';

type Step =
  | { event: 'INIT'; payload: Record<string, never> }
  | { event: 'UNITS_CHANGED'; payload: ScoreKeeperUNITS_CHANGEDPayload };
interface Spec {
  entity: { id: string };
  config: Partial<ScoreKeeper['config']>;
  steps: Step[];
}

const spec: Spec = JSON.parse(readFileSync(process.argv[2] ?? '', 'utf8'));
const entity: ScoreState = { id: spec.entity.id, createdAt: '', updatedAt: '' };
const t = new ScoreKeeper(entity, {}, spec.config);
spec.steps.forEach((step, i) => {
  const n = t.emitted.length;
  switch (step.event) {
    case 'INIT':
      t.onInit();
      break;
    case 'UNITS_CHANGED':
      t.onUnitsChanged(step.payload);
      break;
  }
  for (const e of t.emitted.slice(n)) console.log(JSON.stringify({ step: i, event: e.event, payload: e.payload }));
  console.log(JSON.stringify({ step: i, entity: t.entity }));
});
