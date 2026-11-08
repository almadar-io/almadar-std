import { readFileSync } from 'node:fs';
import type { EventPayload } from '@almadar/core';
import { Program } from './packages/shared/src/traits/rendered.ts';
import type { Ops } from './packages/shared/src/types/entities.ts';

interface Step {
  trait: string;
  event: string;
  payload: EventPayload;
}
interface Spec {
  steps: Step[];
}

const spec: Spec = JSON.parse(readFileSync(process.argv[2] ?? '', 'utf8'));
const row: Ops = { id: '1', createdAt: '', updatedAt: '' };
const key = 'OpsOrbital.Probe';
const program = new Program({ [key]: row });
spec.steps.forEach((step, i) => {
  const n = program.log.length;
  program.dispatch('OpsOrbital.' + step.trait, step.event, step.payload);
  for (const e of program.log.slice(n)) console.log(JSON.stringify({ step: i, event: e.event, payload: e.payload }));
  console.log(JSON.stringify({ step: i, entity: program.traits[key]?.entity }));
});
