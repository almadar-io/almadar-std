import { readFileSync } from 'node:fs';
import { Score } from './packages/shared/src/traits/rendered.ts';
import type { Pair } from './packages/shared/src/types/entities.ts';
import type { ScoreSCOREPayload } from './packages/shared/src/types/events.ts';

type Step =
  | { event: 'SCORE'; payload: ScoreSCOREPayload };
interface Spec {
  entity: { id: string };
  steps: Step[];
}

const spec: Spec = JSON.parse(readFileSync(process.argv[2] ?? '', 'utf8'));
const entity: Pair = { id: spec.entity.id, createdAt: '', updatedAt: '' };
const t = new Score(entity);
spec.steps.forEach((step, i) => {
  const n = t.emitted.length;
  switch (step.event) {
    case 'SCORE':
      t.onScore(step.payload);
      break;
  }
  for (const e of t.emitted.slice(n)) console.log(JSON.stringify({ step: i, event: e.event, payload: e.payload }));
});
