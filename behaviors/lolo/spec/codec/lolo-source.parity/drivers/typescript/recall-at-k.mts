import { readFileSync } from 'node:fs';
import { RecallAtK } from './packages/shared/src/traits/rendered.ts';
import type { Eval } from './packages/shared/src/types/entities.ts';
import type { RecallAtKSCOREPayload } from './packages/shared/src/types/events.ts';

type Step =
  | { event: 'SCORE'; payload: RecallAtKSCOREPayload };
interface Spec {
  entity: { id: string };
  steps: Step[];
}

const spec: Spec = JSON.parse(readFileSync(process.argv[2] ?? '', 'utf8'));
const entity: Eval = { id: spec.entity.id, createdAt: '', updatedAt: '' };
const t = new RecallAtK(entity);
spec.steps.forEach((step, i) => {
  const n = t.emitted.length;
  switch (step.event) {
    case 'SCORE':
      t.onScore(step.payload);
      break;
  }
  for (const e of t.emitted.slice(n)) console.log(JSON.stringify({ step: i, event: e.event, payload: e.payload }));
});
