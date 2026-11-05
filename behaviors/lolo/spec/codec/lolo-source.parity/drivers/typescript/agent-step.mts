import { readFileSync } from 'node:fs';
import { Loop } from './packages/shared/src/traits/rendered.ts';
import type { Run } from './packages/shared/src/types/entities.ts';
import type { LoopTOOL_CHOSENPayload, LoopTOOL_RESULTPayload, LoopFINALPayload } from './packages/shared/src/types/events.ts';

type Step =
  | { event: 'TOOL_CHOSEN'; payload: LoopTOOL_CHOSENPayload }
  | { event: 'TOOL_RESULT'; payload: LoopTOOL_RESULTPayload }
  | { event: 'FINAL'; payload: LoopFINALPayload };
interface Spec {
  entity: { id: string };
  steps: Step[];
}

const spec: Spec = JSON.parse(readFileSync(process.argv[2] ?? '', 'utf8'));
const entity: Run = { id: spec.entity.id, createdAt: '', updatedAt: '' };
const t = new Loop(entity);
spec.steps.forEach((step, i) => {
  const n = t.emitted.length;
  switch (step.event) {
    case 'TOOL_CHOSEN':
      t.onToolChosen(step.payload);
      break;
    case 'TOOL_RESULT':
      t.onToolResult(step.payload);
      break;
    case 'FINAL':
      t.onFinal(step.payload);
      break;
  }
  for (const e of t.emitted.slice(n)) console.log(JSON.stringify({ step: i, event: e.event, payload: e.payload }));
});
