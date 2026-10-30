/**
 * Standard Library Modules
 *
 * Re-exports all module operator definitions.
 *
 * @packageDocumentation
 */

export { CORE_OPERATORS, getCoreOperators } from './core.js';
export { MATH_OPERATORS, getMathOperators } from './math.js';
export { STR_OPERATORS, getStrOperators } from './str.js';
export { ARRAY_OPERATORS, getArrayOperators, getLambdaArrayOperators } from './array.js';
export { OBJECT_OPERATORS, getObjectOperators } from './object.js';
export { JSON_OPERATORS, getJsonOperators } from './json.js';
export { CSV_OPERATORS, getCsvOperators } from './csv.js';
export { XML_OPERATORS, getXmlOperators } from './xml.js';
export { YAML_OPERATORS, getYamlOperators } from './yaml.js';
export { TIME_OPERATORS, getTimeOperators } from './time.js';
export { VALIDATE_OPERATORS, getValidateOperators } from './validate.js';
export { FORMAT_OPERATORS, getFormatOperators } from './format.js';
export { I18N_OPERATORS, getI18nOperators } from './i18n.js';

// Probabilistic programming module
export { PROB_OPERATORS, getProbOperators } from './prob.js';

// OS triggers module
export { OS_OPERATORS } from './os.js';
export { KV_OPERATORS } from './kv.js';

// Bytes module (pure binary operators)
export { BYTES_OPERATORS } from './bytes.js';

// Browser device module (client host path)
export { BROWSER_OPERATORS } from './browser.js';

// Behavior composition module (compile-time operators)
export { COMPOSITION_OPERATORS, getCompositionOperators } from './composition.js';

// Game modules (vec/geo/grid/anim/ease)
export { VEC_OPERATORS, getVecOperators } from './vector.js';
export { GEO_OPERATORS, getGeoOperators } from './geo.js';
export { GRID_OPERATORS, getGridOperators } from './grid.js';
export { ANIM_OPERATORS, getAnimOperators } from './anim.js';
export { EASE_OPERATORS, getEaseOperators } from './ease.js';
export { NOISE_OPERATORS, getNoiseOperators } from './noise.js';
export { PATH_OPERATORS, getPathOperators } from './path.js';

// Substrate modules (Almadar_Rabit_LOLO_Plan.md Phase 3)
export { LLM_OPERATORS, getLlmOperators } from './llm.js';
export { WORKSPACE_OPERATORS, getWorkspaceOperators } from './workspace.js';
export { SESSION_OPERATORS, getSessionOperators } from './session.js';
export { MEMORY_OPERATORS, getMemoryOperators } from './memory.js';
export { TRACE_OPERATORS, getTraceOperators } from './trace.js';
export { AUDIO_OPERATORS, getAudioOperators } from './audio.js';
export { AUTH_OPERATORS, getAuthOperators } from './auth.js';
export { BEHAVIOR_OPERATORS, getBehaviorOperators } from './behavior.js';
