import { readFileSync, writeFileSync } from 'fs';
import { EmbeddingClient } from '@almadar/llm';

const embeddingsPath = 'behaviors/behaviors-embeddings.json';
const data = JSON.parse(readFileSync(embeddingsPath, 'utf8'));

const text = `learning-freeform
Freeform learning canvas — renders any diagram, flowchart, concept map, comparison panel, or step-through sequence with labeled shapes and arrows on a generic canvas.
Capabilities: interactive diagram step-through
Synonyms: diagram flowchart state machine concept map tree hierarchy timeline node-link arrow diagram box diagram labeled scene step-through process sequence tutorial comparison side-by-side before after conversion table mapping truth table decision tree pipeline workflow architecture memory layout data structure pointer reference call stack scope chain type coercion truthiness equality abstract operation graph network circuit logic gate boolean venn set subset relation function signature pipeline stage data flow control flow execution plan compile step parse tree AST`;

console.log('Calling embedding API...');
await new Promise(r => setTimeout(r, 5000));

const client = new EmbeddingClient({
  provider: 'openrouter',
  model: 'baai/bge-base-en-v1.5',
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

const result = await client.embed(text);
const floats = result.embedding;

// Quantize to int8-b64 (same as quantizeInt8)
let max = 0;
for (const v of floats) {
  const a = Math.abs(v);
  if (a > max) max = a;
}
const scale = max === 0 ? 1 : Number(max.toPrecision(6));
const bytes = Buffer.alloc(floats.length);
for (let i = 0; i < floats.length; i++) {
  bytes.writeInt8(Math.round(((floats[i] ?? 0) / max) * 127), i);
}
const quantized = { s: scale, d: bytes.toString('base64') };

data.vectors['learning-freeform'] = quantized;
writeFileSync(embeddingsPath, JSON.stringify(data, null, 2) + '\n');
console.log('SUCCESS: Injected learning-freeform embedding (int8-b64)');
console.log('Scale:', scale, 'Dims:', floats.length);
