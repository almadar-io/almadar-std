/**
 * useWizardFormLogic
 *
 * Pure logic hook — state machine, orbital bridge, actions.
 * Use the companion component for rendering.
 *
 * @generated from schema
 * @trait WizardForm
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useOrbitalBridge } from '@/hooks/useOrbitalBridge';
import type { EntityRow, EventPayload, EventPayloadValue, FieldValue } from '@almadar/core';
import type { EventResponse, WizardView, WizardFormEventPayloadMap } from '@app/shared';
import { useUIEvents } from '@almadar/ui/hooks';
import { registerTraitSnapshot, type TraitStateSnapshot } from '@almadar/ui/lib';

// ============================================================================
// State Machine
// ============================================================================

export type WizardFormState =
  | 'loading'
  | 'running'
  | 'completed'
  | 'cancelled'
  | 'error';

export type WizardFormEvent =
  | 'INIT'
  | 'WizardLoaded'
  | 'WizardLoadFailed'
  | 'WizardSaved'
  | 'WizardSaveFailed'
  | 'ADVANCE'
  | 'RETREAT'
  | 'CANCEL'
  | 'RESTART';

interface WizardFormInternalState {
  machineState: WizardFormState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: WizardFormEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<WizardView>;
}

type WizardFormAction =
  | { type: 'EVENT_SUCCESS'; event: WizardFormEvent; newState: string; data: Record<string, EntityRow[]>; payload?: EventPayload; fields?: Record<string, EventPayloadValue | undefined>; renderBearing?: boolean }
  | { type: 'EVENT_ERROR'; error: string }
  | { type: 'RESET_ERROR' }
  | { type: 'SET_FIELD'; field: keyof WizardView & string; value: EventPayloadValue | undefined }
  | { type: 'TICK'; updates: Partial<EntityRow>; collection: string };

function wizardFormReducer(
  state: WizardFormInternalState,
  action: WizardFormAction
): WizardFormInternalState {
  switch (action.type) {
    case 'EVENT_SUCCESS':
      return {
        machineState: action.newState as WizardFormState,
        data: { ...state.data, ...action.data },
        lastPayload: action.renderBearing ? (action.payload ?? state.lastPayload) : state.lastPayload,
        lastEvent: action.renderBearing ? action.event : state.lastEvent,
        loading: false,
        error: null,
        fields: { ...state.fields, ...(action.fields ?? {}) } as Partial<WizardView>,
      };
    case 'EVENT_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'RESET_ERROR':
      return { ...state, error: null };
    case 'SET_FIELD': {
      // Back-compat for non-codegen consumers that still dispatch
      // SET_FIELD directly. Codegen folds field updates into
      // EVENT_SUCCESS so transitions commit in a single render.
      return {
        ...state,
        fields: { ...state.fields, [action.field]: action.value } as Partial<WizardView>,
      };
    }
    case 'TICK': {
      // Batch-update entity fields for tick effects. state.data's value
      // type is `EntityRow[]`, so the spread below carries
      // the id constraint forward (updates are merged onto a known-shaped
      // target).
      const arr = state.data[action.collection];
      const target = arr?.[0];
      if (!target) return state;
      const updated: EntityRow = { ...target, ...action.updates };
      return {
        ...state,
        data: { ...state.data, [action.collection]: [updated, ...arr.slice(1)] },
      };
    }
    default:
      return state;
  }
}

const initialState: WizardFormInternalState = {
  machineState: 'loading',
  data: {},
  lastPayload: undefined,
  lastEvent: null,
  loading: false,
  error: null,
  fields: {},
};

// ============================================================================
// Hook
// ============================================================================

export interface WizardFormConfig {
  linkedEntity?: string;
  entityId?: string;
  cardLook: 'elevated' | 'flat-bordered' | 'borderless-divider' | 'ticket' | 'invoice' | 'chip' | 'tile-image-first';
  steps: { allowedRoles?: string[]; description?: string; fields?: string[]; icon?: string; key?: string; label: string }[];
  title: string;
}

const DEFAULT_WIZARD_FORM_CONFIG = {
  cardLook: "elevated",
  steps: [{ description: "Basic information", fields: ["title", "description"], icon: "file-text", key: "details", label: "Details" }, { description: "Configure preferences", fields: ["category", "priority"], icon: "settings", key: "options", label: "Options" }, { description: "Confirm and submit", fields: ["notes"], icon: "check-circle", key: "review", label: "Review" }],
  title: "Wizard",
} as WizardFormConfig;

export interface WizardFormLogicReturn {
  state: WizardFormState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: WizardFormEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<WizardView>;
  dispatch: (event: string, payload?: EventPayload) => Promise<EventResponse>;
  actions: { [K in keyof WizardFormEventPayloadMap]: (payload?: WizardFormEventPayloadMap[K]) => Promise<EventResponse> };
  config: WizardFormConfig;
}

export function useWizardFormLogic(config?: WizardFormConfig): WizardFormLogicReturn {
  const mergedConfig: WizardFormConfig = { ...DEFAULT_WIZARD_FORM_CONFIG, ...(config ?? {}) };

  // Orbital bridge: event bus + server communication
  const { sendEvent, eventBus } = useOrbitalBridge({ basePath: '/api/wizard-form', orbitalName: 'WizardOrbital', traitName: 'WizardForm' });

  // Internal state with reducer
  const [internalState, dispatchReducer] = useReducer(wizardFormReducer, initialState);
  const { machineState: state, data, lastPayload, lastEvent, loading, error, fields: _initialFields } = internalState;
  const fields = _initialFields;

  const machineStateRef = useRef(state);
  machineStateRef.current = state;

  // Actor model: sequential event queue (prevents cross-trait race conditions)
  const eventQueueRef = useRef<Array<{ event: string; payload?: EventPayload }>>([]);
  const processingRef = useRef(false);

  // Transpiled client-side effects (Phase 4)
  // Each (fromState, event) transition's client effects are compiled to TypeScript.
  const executeTransitionEffects = useCallback((fromState: string, event: string, payload?: EventPayload): Record<string, EventPayloadValue | undefined> => {
    const _fields: Record<string, EventPayloadValue | undefined> = {};
    const payloadObj = payload;
    const entity: EntityRow[] = data['WizardView'] ?? [];
    let fields = _initialFields ?? {};


    if (fromState === 'loading' && event === 'WizardLoaded') {
      // loading → running (on WizardLoaded)
        _fields['currentStepIndex'] = 0;
        fields = { ...(fields ?? {}), 'currentStepIndex': _fields['currentStepIndex'] } as typeof fields;
        _fields['totalSteps'] = ([{ fields: ["title", "description"], label: "Details", key: "details", icon: "file-text", description: "Basic information" }, { icon: "settings", key: "options", fields: ["category", "priority"], description: "Configure preferences", label: "Options" }, { description: "Confirm and submit", fields: ["notes"], key: "review", label: "Review", icon: "check-circle" }]).length;
        fields = { ...(fields ?? {}), 'totalSteps': _fields['totalSteps'] } as typeof fields;
        _fields['wizardSteps'] = [{ description: "Basic information", id: "details", title: "Details" }, { description: "Configure preferences", id: "options", title: "Options" }, { title: "Review", description: "Confirm and submit", id: "review" }];
        fields = { ...(fields ?? {}), 'wizardSteps': _fields['wizardSteps'] } as typeof fields;
        _fields['currentStepLabel'] = (("label" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ icon: "file-text", description: "Basic information", key: "details", label: "Details", fields: ["title", "description"] }, { label: "Options", fields: ["category", "priority"], key: "options", icon: "settings", description: "Configure preferences" }, { icon: "check-circle", fields: ["notes"], key: "review", description: "Confirm and submit", label: "Review" }], 0)));
        fields = { ...(fields ?? {}), 'currentStepLabel': _fields['currentStepLabel'] } as typeof fields;
        _fields['currentStepDescription'] = (("description" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ label: "Details", description: "Basic information", icon: "file-text", key: "details", fields: ["title", "description"] }, { key: "options", label: "Options", icon: "settings", description: "Configure preferences", fields: ["category", "priority"] }, { icon: "check-circle", fields: ["notes"], label: "Review", key: "review", description: "Confirm and submit" }], 0)) ?? "");
        fields = { ...(fields ?? {}), 'currentStepDescription': _fields['currentStepDescription'] } as typeof fields;
        _fields['currentStepIcon'] = (("icon" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ fields: ["title", "description"], key: "details", description: "Basic information", label: "Details", icon: "file-text" }, { key: "options", label: "Options", fields: ["category", "priority"], icon: "settings", description: "Configure preferences" }, { label: "Review", description: "Confirm and submit", icon: "check-circle", fields: ["notes"], key: "review" }], 0)) ?? "circle");
        fields = { ...(fields ?? {}), 'currentStepIcon': _fields['currentStepIcon'] } as typeof fields;
        _fields['currentFields'] = (("fields" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ label: "Details", key: "details", description: "Basic information", icon: "file-text", fields: ["title", "description"] }, { key: "options", fields: ["category", "priority"], icon: "settings", label: "Options", description: "Configure preferences" }, { icon: "check-circle", description: "Confirm and submit", key: "review", fields: ["notes"], label: "Review" }], 0)) ?? []);
        fields = { ...(fields ?? {}), 'currentFields': _fields['currentFields'] } as typeof fields;
        _fields['isFirstStep'] = true;
        fields = { ...(fields ?? {}), 'isFirstStep': _fields['isFirstStep'] } as typeof fields;
        _fields['isLastStep'] = (([{ fields: ["title", "description"], key: "details", icon: "file-text", description: "Basic information", label: "Details" }, { fields: ["category", "priority"], icon: "settings", label: "Options", description: "Configure preferences", key: "options" }, { icon: "check-circle", description: "Confirm and submit", key: "review", fields: ["notes"], label: "Review" }]).length === 1);
        fields = { ...(fields ?? {}), 'isLastStep': _fields['isLastStep'] } as typeof fields;
        _fields['primaryActionLabel'] = ((([{ description: "Basic information", label: "Details", fields: ["title", "description"], icon: "file-text", key: "details" }, { key: "options", label: "Options", description: "Configure preferences", fields: ["category", "priority"], icon: "settings" }, { fields: ["notes"], key: "review", icon: "check-circle", description: "Confirm and submit", label: "Review" }]).length === 1) ? "Submit" : "Next");
        fields = { ...(fields ?? {}), 'primaryActionLabel': _fields['primaryActionLabel'] } as typeof fields;
        _fields['primaryActionIcon'] = ((([{ description: "Basic information", fields: ["title", "description"], icon: "file-text", key: "details", label: "Details" }, { key: "options", icon: "settings", fields: ["category", "priority"], description: "Configure preferences", label: "Options" }, { key: "review", description: "Confirm and submit", icon: "check-circle", label: "Review", fields: ["notes"] }]).length === 1) ? "check-circle" : "chevron-right");
        fields = { ...(fields ?? {}), 'primaryActionIcon': _fields['primaryActionIcon'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'WizardLoadFailed') {
      // loading → error (on WizardLoadFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'WizardSaveFailed') {
      // loading → error (on WizardSaveFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'running' && event === 'ADVANCE' && (!fields?.isLastStep)) {
      // running → running (on ADVANCE)
        _fields['currentStepIndex'] = (+(fields?.currentStepIndex ?? 0) + 1);
        fields = { ...(fields ?? {}), 'currentStepIndex': _fields['currentStepIndex'] } as typeof fields;
        _fields['currentStepLabel'] = (("label" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ description: "Basic information", label: "Details", fields: ["title", "description"], key: "details", icon: "file-text" }, { description: "Configure preferences", icon: "settings", key: "options", fields: ["category", "priority"], label: "Options" }, { label: "Review", icon: "check-circle", description: "Confirm and submit", fields: ["notes"], key: "review" }], fields?.currentStepIndex)));
        fields = { ...(fields ?? {}), 'currentStepLabel': _fields['currentStepLabel'] } as typeof fields;
        _fields['currentStepDescription'] = (("description" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ description: "Basic information", fields: ["title", "description"], label: "Details", key: "details", icon: "file-text" }, { key: "options", description: "Configure preferences", icon: "settings", label: "Options", fields: ["category", "priority"] }, { label: "Review", icon: "check-circle", key: "review", description: "Confirm and submit", fields: ["notes"] }], fields?.currentStepIndex)) ?? "");
        fields = { ...(fields ?? {}), 'currentStepDescription': _fields['currentStepDescription'] } as typeof fields;
        _fields['currentStepIcon'] = (("icon" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ key: "details", fields: ["title", "description"], icon: "file-text", description: "Basic information", label: "Details" }, { description: "Configure preferences", icon: "settings", fields: ["category", "priority"], label: "Options", key: "options" }, { fields: ["notes"], key: "review", icon: "check-circle", label: "Review", description: "Confirm and submit" }], fields?.currentStepIndex)) ?? "circle");
        fields = { ...(fields ?? {}), 'currentStepIcon': _fields['currentStepIcon'] } as typeof fields;
        _fields['currentFields'] = (("fields" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ label: "Details", description: "Basic information", fields: ["title", "description"], icon: "file-text", key: "details" }, { label: "Options", description: "Configure preferences", icon: "settings", key: "options", fields: ["category", "priority"] }, { fields: ["notes"], label: "Review", icon: "check-circle", description: "Confirm and submit", key: "review" }], fields?.currentStepIndex)) ?? []);
        fields = { ...(fields ?? {}), 'currentFields': _fields['currentFields'] } as typeof fields;
        _fields['isFirstStep'] = (fields?.currentStepIndex === 0);
        fields = { ...(fields ?? {}), 'isFirstStep': _fields['isFirstStep'] } as typeof fields;
        _fields['isLastStep'] = (fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1));
        fields = { ...(fields ?? {}), 'isLastStep': _fields['isLastStep'] } as typeof fields;
        _fields['primaryActionLabel'] = ((fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1)) ? "Submit" : "Next");
        fields = { ...(fields ?? {}), 'primaryActionLabel': _fields['primaryActionLabel'] } as typeof fields;
        _fields['primaryActionIcon'] = ((fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1)) ? "check-circle" : "chevron-right");
        fields = { ...(fields ?? {}), 'primaryActionIcon': _fields['primaryActionIcon'] } as typeof fields;
    } else if (fromState === 'running' && event === 'ADVANCE' && (fields?.isLastStep)) {
      // running → completed (on ADVANCE)
        _fields['completionMessage'] = "All steps completed. Your submission has been recorded.";
        fields = { ...(fields ?? {}), 'completionMessage': _fields['completionMessage'] } as typeof fields;
    } else if (fromState === 'running' && event === 'RETREAT') {
      // running → running (on RETREAT)
        _fields['currentStepIndex'] = (+(fields?.currentStepIndex ?? 0) - 1);
        fields = { ...(fields ?? {}), 'currentStepIndex': _fields['currentStepIndex'] } as typeof fields;
        _fields['currentStepLabel'] = (("label" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ label: "Details", description: "Basic information", icon: "file-text", fields: ["title", "description"], key: "details" }, { label: "Options", description: "Configure preferences", icon: "settings", key: "options", fields: ["category", "priority"] }, { label: "Review", description: "Confirm and submit", fields: ["notes"], key: "review", icon: "check-circle" }], fields?.currentStepIndex)));
        fields = { ...(fields ?? {}), 'currentStepLabel': _fields['currentStepLabel'] } as typeof fields;
        _fields['currentStepDescription'] = (("description" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ description: "Basic information", fields: ["title", "description"], label: "Details", key: "details", icon: "file-text" }, { label: "Options", fields: ["category", "priority"], key: "options", description: "Configure preferences", icon: "settings" }, { icon: "check-circle", label: "Review", fields: ["notes"], key: "review", description: "Confirm and submit" }], fields?.currentStepIndex)) ?? "");
        fields = { ...(fields ?? {}), 'currentStepDescription': _fields['currentStepDescription'] } as typeof fields;
        _fields['currentStepIcon'] = (("icon" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ key: "details", description: "Basic information", icon: "file-text", fields: ["title", "description"], label: "Details" }, { icon: "settings", fields: ["category", "priority"], description: "Configure preferences", key: "options", label: "Options" }, { description: "Confirm and submit", label: "Review", key: "review", icon: "check-circle", fields: ["notes"] }], fields?.currentStepIndex)) ?? "circle");
        fields = { ...(fields ?? {}), 'currentStepIcon': _fields['currentStepIcon'] } as typeof fields;
        _fields['currentFields'] = (("fields" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ fields: ["title", "description"], icon: "file-text", key: "details", description: "Basic information", label: "Details" }, { icon: "settings", label: "Options", description: "Configure preferences", key: "options", fields: ["category", "priority"] }, { description: "Confirm and submit", fields: ["notes"], label: "Review", key: "review", icon: "check-circle" }], fields?.currentStepIndex)) ?? []);
        fields = { ...(fields ?? {}), 'currentFields': _fields['currentFields'] } as typeof fields;
        _fields['isFirstStep'] = (fields?.currentStepIndex === 0);
        fields = { ...(fields ?? {}), 'isFirstStep': _fields['isFirstStep'] } as typeof fields;
        _fields['isLastStep'] = (fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1));
        fields = { ...(fields ?? {}), 'isLastStep': _fields['isLastStep'] } as typeof fields;
        _fields['primaryActionLabel'] = ((fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1)) ? "Submit" : "Next");
        fields = { ...(fields ?? {}), 'primaryActionLabel': _fields['primaryActionLabel'] } as typeof fields;
        _fields['primaryActionIcon'] = ((fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1)) ? "check-circle" : "chevron-right");
        fields = { ...(fields ?? {}), 'primaryActionIcon': _fields['primaryActionIcon'] } as typeof fields;
    } else if (fromState === 'running' && event === 'CANCEL') {
      // running → cancelled (on CANCEL)
        _fields['cancelReason'] = payloadObj?.reason;
        fields = { ...(fields ?? {}), 'cancelReason': _fields['cancelReason'] } as typeof fields;
    } else if (fromState === 'completed' && event === 'RESTART') {
      // completed → loading (on RESTART)
        _fields['currentStepIndex'] = 0;
        fields = { ...(fields ?? {}), 'currentStepIndex': _fields['currentStepIndex'] } as typeof fields;
        _fields['completionMessage'] = "";
        fields = { ...(fields ?? {}), 'completionMessage': _fields['completionMessage'] } as typeof fields;
    } else if (fromState === 'cancelled' && event === 'RESTART') {
      // cancelled → loading (on RESTART)
        _fields['currentStepIndex'] = 0;
        fields = { ...(fields ?? {}), 'currentStepIndex': _fields['currentStepIndex'] } as typeof fields;
        _fields['cancelReason'] = "";
        fields = { ...(fields ?? {}), 'cancelReason': _fields['cancelReason'] } as typeof fields;
    }
    return _fields;
  }, [eventBus, data]);

  // Per-transition render-ui presence map (codegen).
  // Used by dispatch to skip lastPayload/lastEvent updates for
  // transitions whose only effects are server-side or set/emit —
  // those don't change the rendered JSX, so the view should keep
  // the prior frame's payload until a render-bearing transition
  // (e.g. fetch.emit.success cascade) lands.
  const transitionHasRenderUi = useCallback((fromState: string, event: string): boolean => {
    switch (fromState) {
      case 'cancelled':
        return (['RESTART'] as const).includes(event as never);
      case 'completed':
        return (['RESTART'] as const).includes(event as never);
      case 'error':
        return (['INIT'] as const).includes(event as never);
      case 'loading':
        return (['INIT', 'WizardLoadFailed', 'WizardLoaded', 'WizardSaveFailed', 'WizardSaved'] as const).includes(event as never);
      case 'running':
        return (['ADVANCE', 'CANCEL', 'RETREAT'] as const).includes(event as never);
      default:
        return false;
    }
  }, []);

  /**
   * Dispatch an event through the orbital bridge.
   * Bridge emits lifecycle events on the bus, forwards to server.
   * Client effects are transpiled at compile time (Phase 4).
   */
  const dispatch = useCallback(async (event: string, payload?: EventPayload): Promise<EventResponse> => {
    const prevState = machineStateRef.current;
    try {
      const response = await sendEvent(event, payload, prevState);

      if (response.success) {
        const _fields = executeTransitionEffects(prevState, event, payload);
        const _renderBearing = transitionHasRenderUi(prevState, event);
        dispatchReducer({
          type: 'EVENT_SUCCESS',
          event: event as WizardFormEvent,
          newState: response.newState || prevState,
          data: response.data || {},
          payload,
          fields: _fields,
          renderBearing: _renderBearing,
        });

        if (response.newState) {
          machineStateRef.current = response.newState as typeof machineStateRef.current;
        }

      } else {
        dispatchReducer({
          type: 'EVENT_ERROR',
          error: response.error || 'Unknown error',
        });
      }

      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      dispatchReducer({ type: 'EVENT_ERROR', error: errorMsg });
      return { success: false, error: errorMsg } as EventResponse;
    }
  }, [sendEvent, executeTransitionEffects]);

  // Actor model: drain event queue one at a time
  const drainQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      while (eventQueueRef.current.length > 0) {
        const entry = eventQueueRef.current.shift()!;
        await dispatch(entry.event, entry.payload);
      }
    } finally {
      processingRef.current = false;
    }
  }, [dispatch]);

  // Actor model: enqueue event and start drain
  const enqueueEvent = useCallback((event: string, payload?: EventPayload) => {
    eventQueueRef.current.push({ event, payload });
    void drainQueue();
  }, [drainQueue]);

  // Action creators (typed per-event)
  const actions: { [K in keyof WizardFormEventPayloadMap]: (payload?: WizardFormEventPayloadMap[K]) => Promise<EventResponse> } = {
    'INIT': () => dispatch('INIT'),
    'WizardLoaded': (payload?: WizardFormEventPayloadMap['WizardLoaded']) => dispatch('WizardLoaded', payload),
    'WizardLoadFailed': (payload?: WizardFormEventPayloadMap['WizardLoadFailed']) => dispatch('WizardLoadFailed', payload),
    'WizardSaved': (payload?: WizardFormEventPayloadMap['WizardSaved']) => dispatch('WizardSaved', payload),
    'WizardSaveFailed': (payload?: WizardFormEventPayloadMap['WizardSaveFailed']) => dispatch('WizardSaveFailed', payload),
    'ADVANCE': (payload?: WizardFormEventPayloadMap['ADVANCE']) => dispatch('ADVANCE', payload),
    'RETREAT': () => dispatch('RETREAT'),
    'CANCEL': (payload?: WizardFormEventPayloadMap['CANCEL']) => dispatch('CANCEL', payload),
    'RESTART': () => dispatch('RESTART'),
  };

  useUIEvents(enqueueEvent, 'WizardOrbital.WizardForm', ['INIT', 'WizardLoaded', 'WizardLoadFailed', 'WizardSaved', 'WizardSaveFailed', 'ADVANCE', 'RETREAT', 'CANCEL', 'RESTART'] as const, eventBus);

  // Verifier snapshot registration (VG Foundation 1)
  const internalStateRef = useRef(internalState);
  internalStateRef.current = internalState;
  useEffect(() => {
    const unregister = registerTraitSnapshot('WizardForm', (): TraitStateSnapshot => ({
      traitName: 'WizardForm',
      currentState: internalStateRef.current.machineState,
      states: ['loading', 'running', 'completed', 'cancelled', 'error'],
      events: ['INIT', 'WizardLoaded', 'WizardLoadFailed', 'WizardSaved', 'WizardSaveFailed', 'ADVANCE', 'RETREAT', 'CANCEL', 'RESTART'],
      data: internalStateRef.current.data,
      lastPayload: internalStateRef.current.lastPayload,
      lastEventDispatched: internalStateRef.current.lastEvent !== null
        ? {
            event: internalStateRef.current.lastEvent,
            ...(internalStateRef.current.lastPayload !== undefined
              ? { payload: internalStateRef.current.lastPayload }
              : {}),
            timestamp: Date.now(),
          }
        : undefined,
      cascadeReceived: [],
    }));
    return unregister;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-init on mount
  useEffect(() => {
    dispatch('INIT', config?.entityId ? { entityId: config.entityId } : undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    data,
    lastPayload,
    lastEvent,
    loading,
    error,
    fields,
    dispatch,
    actions,
    config: mergedConfig,
  };
}
