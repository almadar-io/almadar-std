import { readFileSync } from 'node:fs';
import type { EventPayload } from '@almadar/core';
import { Probe } from './packages/shared/src/traits/rendered.ts';
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
const probe = new Probe(row);
spec.steps.forEach((step, i) => {
  const n = probe.emitted.length;
  if (step.event !== 'INIT') throw new Error('the operator fixtures dispatch INIT only, not ' + step.event);
  probe.onInit();
  for (const e of probe.emitted.slice(n)) console.log(JSON.stringify({ step: i, event: e.event, payload: e.payload }));
  console.log(JSON.stringify({ step: i, entity: probe.entity }));
});
