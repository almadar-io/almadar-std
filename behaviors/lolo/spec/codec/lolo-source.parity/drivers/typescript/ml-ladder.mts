import { readFileSync } from 'node:fs';
import { LadderEntry, LadderVerdictSink } from './packages/shared/src/traits/rendered.ts';
import type { LadderRequest, LadderVerdict } from './packages/shared/src/types/entities.ts';
import type {
  LadderEntryDECIDEPayload,
  LadderVerdictSinkFROM_CLASSIFYPayload,
  LadderVerdictSinkFROM_CLASSIFY_FAILUREPayload,
  LadderVerdictSinkFROM_EXACTPayload,
  LadderVerdictSinkFROM_INFERPayload,
  LadderVerdictSinkFROM_LOOKUPPayload,
  LadderVerdictSinkFROM_SIMILARITYPayload,
} from './packages/shared/src/types/events.ts';

type NoPayload = Record<string, never>;
type Step =
  | { trait: 'LadderEntry'; event: 'INIT' | 'RESET'; payload: NoPayload }
  | { trait: 'LadderEntry'; event: 'DECIDE'; payload: LadderEntryDECIDEPayload }
  | { trait: 'LadderVerdictSink'; event: 'INIT' | 'RESET'; payload: NoPayload }
  | { trait: 'LadderVerdictSink'; event: 'FROM_EXACT'; payload: LadderVerdictSinkFROM_EXACTPayload }
  | { trait: 'LadderVerdictSink'; event: 'FROM_LOOKUP'; payload: LadderVerdictSinkFROM_LOOKUPPayload }
  | { trait: 'LadderVerdictSink'; event: 'FROM_SIMILARITY'; payload: LadderVerdictSinkFROM_SIMILARITYPayload }
  | { trait: 'LadderVerdictSink'; event: 'FROM_INFER'; payload: LadderVerdictSinkFROM_INFERPayload }
  | { trait: 'LadderVerdictSink'; event: 'FROM_CLASSIFY'; payload: LadderVerdictSinkFROM_CLASSIFYPayload }
  | { trait: 'LadderVerdictSink'; event: 'FROM_CLASSIFY_FAILURE'; payload: LadderVerdictSinkFROM_CLASSIFY_FAILUREPayload };
interface Spec {
  steps: Step[];
}

const spec: Spec = JSON.parse(readFileSync(process.argv[2] ?? '', 'utf8'));
const request: LadderRequest = { id: '1', createdAt: '', updatedAt: '' };
const verdict: LadderVerdict = { id: '1', createdAt: '', updatedAt: '' };
const entry = new LadderEntry(request);
const sink = new LadderVerdictSink(verdict);
spec.steps.forEach((step, i) => {
  const t = step.trait === 'LadderEntry' ? entry : sink;
  const n = t.emitted.length;
  if (step.trait === 'LadderEntry') {
    if (step.event === 'DECIDE') entry.onDecide(step.payload);
    else if (step.event === 'INIT') entry.onInit();
    else entry.onReset();
  } else {
    switch (step.event) {
      case 'INIT': sink.onInit(); break;
      case 'RESET': sink.onReset(); break;
      case 'FROM_EXACT': sink.onFromExact(step.payload); break;
      case 'FROM_LOOKUP': sink.onFromLookup(step.payload); break;
      case 'FROM_SIMILARITY': sink.onFromSimilarity(step.payload); break;
      case 'FROM_INFER': sink.onFromInfer(step.payload); break;
      case 'FROM_CLASSIFY': sink.onFromClassify(step.payload); break;
      case 'FROM_CLASSIFY_FAILURE': sink.onFromClassifyFailure(step.payload); break;
    }
  }
  for (const e of t.emitted.slice(n)) console.log(JSON.stringify({ step: i, event: e.event, payload: e.payload ?? {} }));
  console.log(JSON.stringify({ step: i, entity: t.entity }));
});
