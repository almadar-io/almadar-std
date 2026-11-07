import { readFileSync } from 'node:fs';
import type { EventPayload } from '@almadar/core';
import { Program } from './packages/shared/src/traits/rendered.ts';
import type { Match } from './packages/shared/src/types/entities.ts';

interface Step {
  trait: string;
  event: string;
  payload: EventPayload;
}
interface Spec {
  steps: Step[];
}

const spec: Spec = JSON.parse(readFileSync(process.argv[2] ?? '', 'utf8'));
const row = (): Match => ({ id: '1', createdAt: '', updatedAt: '' });
const program = new Program({ 'ArenaOrbital.Arena': row(), 'ArenaOrbital.Score': row() });
spec.steps.forEach((step, i) => {
  const n = program.log.length;
  const key = 'ArenaOrbital.' + step.trait;
  program.dispatch(key, step.event, step.payload);
  for (const e of program.log.slice(n)) console.log(JSON.stringify({ step: i, event: e.event, payload: e.payload }));
  console.log(JSON.stringify({ step: i, entity: program.traits[key]?.entity }));
});
