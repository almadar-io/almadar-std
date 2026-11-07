import { readFileSync } from 'node:fs';
import type { EventPayload } from '@almadar/core';
import { MemoryStore, Program } from './packages/shared/src/traits/rendered.ts';

interface Step {
  trait: string;
  event: string;
  payload: EventPayload;
}
interface Spec {
  steps: Step[];
}

const spec: Spec = JSON.parse(readFileSync(process.argv[2] ?? '', 'utf8'));
const key = 'StoreOrbital.Notes';
const program = new Program({ [key]: { id: '1', createdAt: '', updatedAt: '' } }, new MemoryStore());
spec.steps.forEach((step, i) => {
  const n = program.log.length;
  program.dispatch('StoreOrbital.' + step.trait, step.event, step.payload);
  for (const e of program.log.slice(n)) console.log(JSON.stringify({ step: i, event: e.event, payload: e.payload }));
  console.log(JSON.stringify({ step: i, entity: program.traits[key]?.entity }));
});
