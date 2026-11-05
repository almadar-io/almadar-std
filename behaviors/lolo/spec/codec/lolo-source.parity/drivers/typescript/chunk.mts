import { readFileSync } from 'node:fs';
import { Chunk } from './packages/shared/src/traits/rendered.ts';
import type { Doc } from './packages/shared/src/types/entities.ts';
import type { ChunkCHUNKPayload } from './packages/shared/src/types/events.ts';

type Step =
  | { event: 'CHUNK'; payload: ChunkCHUNKPayload };
interface Spec {
  entity: { id: string };
  steps: Step[];
}

const spec: Spec = JSON.parse(readFileSync(process.argv[2] ?? '', 'utf8'));
const entity: Doc = { id: spec.entity.id, createdAt: '', updatedAt: '' };
const t = new Chunk(entity);
spec.steps.forEach((step, i) => {
  const n = t.emitted.length;
  switch (step.event) {
    case 'CHUNK':
      t.onChunk(step.payload);
      break;
  }
  for (const e of t.emitted.slice(n)) console.log(JSON.stringify({ step: i, event: e.event, payload: e.payload }));
});
