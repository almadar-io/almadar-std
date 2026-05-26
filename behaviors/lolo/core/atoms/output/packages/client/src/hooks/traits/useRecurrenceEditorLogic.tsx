/**
 * useRecurrenceEditorLogic
 *
 * Pure logic hook — state machine, orbital bridge, actions.
 * Use the companion component for rendering.
 *
 * @generated from schema
 * @trait RecurrenceEditor
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useOrbitalBridge } from '@/hooks/useOrbitalBridge';
import type { EntityRow, EventPayload, EventPayloadValue, FieldValue } from '@almadar/core';
import type { EventResponse, RecurrenceView, RecurrenceEditorEventPayloadMap } from '@app/shared';
import { useUIEvents } from '@almadar/ui/hooks';
import { registerTraitSnapshot, type TraitStateSnapshot } from '@almadar/ui/lib';

// ============================================================================
// State Machine
// ============================================================================

export type RecurrenceEditorState =
  | 'loading'
  | 'viewing'
  | 'defining_rule'
  | 'awaiting_exception_decision'
  | 'cancelled'
  | 'error';

export type RecurrenceEditorEvent =
  | 'INIT'
  | 'RecurrenceLoaded'
  | 'RecurrenceLoadFailed'
  | 'RecurrenceSaved'
  | 'RecurrenceSaveFailed'
  | 'EDIT_RULE'
  | 'OPEN_EXCEPTION'
  | 'CANCEL_SCHEDULE'
  | 'SAVE_RULE'
  | 'CANCEL_RULE'
  | 'SKIP_OCCURRENCE'
  | 'RESCHEDULE_OCCURRENCE'
  | 'CLOSE_EXCEPTION'
  | 'RESTART';

interface RecurrenceEditorInternalState {
  machineState: RecurrenceEditorState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: RecurrenceEditorEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<RecurrenceView>;
}

type RecurrenceEditorAction =
  | { type: 'EVENT_SUCCESS'; event: RecurrenceEditorEvent; newState: string; data: Record<string, EntityRow[]>; payload?: EventPayload; fields?: Record<string, EventPayloadValue | undefined>; renderBearing?: boolean }
  | { type: 'EVENT_ERROR'; error: string }
  | { type: 'RESET_ERROR' }
  | { type: 'SET_FIELD'; field: keyof RecurrenceView & string; value: EventPayloadValue | undefined }
  | { type: 'TICK'; updates: Partial<EntityRow>; collection: string };

function recurrenceEditorReducer(
  state: RecurrenceEditorInternalState,
  action: RecurrenceEditorAction
): RecurrenceEditorInternalState {
  switch (action.type) {
    case 'EVENT_SUCCESS':
      return {
        machineState: action.newState as RecurrenceEditorState,
        data: { ...state.data, ...action.data },
        lastPayload: action.renderBearing ? (action.payload ?? state.lastPayload) : state.lastPayload,
        lastEvent: action.renderBearing ? action.event : state.lastEvent,
        loading: false,
        error: null,
        fields: { ...state.fields, ...(action.fields ?? {}) } as Partial<RecurrenceView>,
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
        fields: { ...state.fields, [action.field]: action.value } as Partial<RecurrenceView>,
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

const initialState: RecurrenceEditorInternalState = {
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

export interface RecurrenceEditorConfig {
  linkedEntity?: string;
  entityId?: string;
  cardLook: 'elevated' | 'flat-bordered' | 'borderless-divider' | 'ticket' | 'invoice' | 'chip' | 'tile-image-first';
  formFields: string[];
  title: string;
}

const DEFAULT_RECURRENCE_EDITOR_CONFIG = {
  cardLook: "elevated",
  formFields: ["frequency", "interval", "startDate", "endDate", "endAfterCount"],
  title: "Schedule",
} as RecurrenceEditorConfig;

export interface RecurrenceEditorLogicReturn {
  state: RecurrenceEditorState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: RecurrenceEditorEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<RecurrenceView>;
  dispatch: (event: string, payload?: EventPayload) => Promise<EventResponse>;
  actions: { [K in keyof RecurrenceEditorEventPayloadMap]: (payload?: RecurrenceEditorEventPayloadMap[K]) => Promise<EventResponse> };
  config: RecurrenceEditorConfig;
}

export function useRecurrenceEditorLogic(config?: RecurrenceEditorConfig): RecurrenceEditorLogicReturn {
  const mergedConfig: RecurrenceEditorConfig = { ...DEFAULT_RECURRENCE_EDITOR_CONFIG, ...(config ?? {}) };

  // Orbital bridge: event bus + server communication
  const { sendEvent, eventBus } = useOrbitalBridge({ basePath: '/api/recurrence-editor', orbitalName: 'RecurrenceOrbital', traitName: 'RecurrenceEditor' });

  // Internal state with reducer
  const [internalState, dispatchReducer] = useReducer(recurrenceEditorReducer, initialState);
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
    const entity: EntityRow[] = data['RecurrenceView'] ?? [];
    let fields = _initialFields ?? {};


    if (fromState === 'loading' && event === 'RecurrenceLoaded') {
      // loading → viewing (on RecurrenceLoaded)
        _fields['frequency'] = (("frequency" as string).split('.').reduce((o: any, k: string) => o?.[k], ((payloadObj?.data ?? []) as readonly EventPayloadValue[])[0]) ?? "weekly");
        fields = { ...(fields ?? {}), 'frequency': _fields['frequency'] } as typeof fields;
        _fields['interval'] = (("interval" as string).split('.').reduce((o: any, k: string) => o?.[k], ((payloadObj?.data ?? []) as readonly EventPayloadValue[])[0]) ?? 1);
        fields = { ...(fields ?? {}), 'interval': _fields['interval'] } as typeof fields;
        _fields['startDate'] = (("startDate" as string).split('.').reduce((o: any, k: string) => o?.[k], ((payloadObj?.data ?? []) as readonly EventPayloadValue[])[0]) ?? "");
        fields = { ...(fields ?? {}), 'startDate': _fields['startDate'] } as typeof fields;
        _fields['endDate'] = (("endDate" as string).split('.').reduce((o: any, k: string) => o?.[k], ((payloadObj?.data ?? []) as readonly EventPayloadValue[])[0]) ?? "");
        fields = { ...(fields ?? {}), 'endDate': _fields['endDate'] } as typeof fields;
        _fields['endAfterCount'] = (("endAfterCount" as string).split('.').reduce((o: any, k: string) => o?.[k], ((payloadObj?.data ?? []) as readonly EventPayloadValue[])[0]) ?? 0);
        fields = { ...(fields ?? {}), 'endAfterCount': _fields['endAfterCount'] } as typeof fields;
        _fields['occurrences'] = ((payloadObj?.data ?? []) as readonly EntityRow[]).map(((row: EntityRow) => ({ description: (("notes" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? ""), date: (("date" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? ""), id: (("id" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? ""), rawStatus: "scheduled", title: (("title" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? "Occurrence"), status: "active" })));
        fields = { ...(fields ?? {}), 'occurrences': _fields['occurrences'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'RecurrenceLoadFailed') {
      // loading → error (on RecurrenceLoadFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'RecurrenceSaveFailed') {
      // loading → error (on RecurrenceSaveFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'viewing' && event === 'OPEN_EXCEPTION') {
      // viewing → awaiting_exception_decision (on OPEN_EXCEPTION)
        _fields['currentOccurrenceId'] = (payloadObj?.row as EventPayload | undefined)?.id;
        fields = { ...(fields ?? {}), 'currentOccurrenceId': _fields['currentOccurrenceId'] } as typeof fields;
        _fields['currentOccurrenceDate'] = (payloadObj?.row as EventPayload | undefined)?.date;
        fields = { ...(fields ?? {}), 'currentOccurrenceDate': _fields['currentOccurrenceDate'] } as typeof fields;
        _fields['currentOccurrenceLabel'] = (payloadObj?.row as EventPayload | undefined)?.title;
        fields = { ...(fields ?? {}), 'currentOccurrenceLabel': _fields['currentOccurrenceLabel'] } as typeof fields;
    } else if (fromState === 'awaiting_exception_decision' && event === 'RESCHEDULE_OCCURRENCE') {
      // awaiting_exception_decision → loading (on RESCHEDULE_OCCURRENCE)
        _fields['rescheduleDate'] = payloadObj?.newDate;
        fields = { ...(fields ?? {}), 'rescheduleDate': _fields['rescheduleDate'] } as typeof fields;
    }
    return _fields;
  }, [eventBus]);

  // Per-transition render-ui presence map (codegen).
  // Used by dispatch to skip lastPayload/lastEvent updates for
  // transitions whose only effects are server-side or set/emit —
  // those don't change the rendered JSX, so the view should keep
  // the prior frame's payload until a render-bearing transition
  // (e.g. fetch.emit.success cascade) lands.
  const transitionHasRenderUi = useCallback((fromState: string, event: string): boolean => {
    switch (fromState) {
      case 'awaiting_exception_decision':
        return (['CLOSE_EXCEPTION', 'RESCHEDULE_OCCURRENCE', 'SKIP_OCCURRENCE'] as const).includes(event as never);
      case 'cancelled':
        return (['RESTART'] as const).includes(event as never);
      case 'defining_rule':
        return (['CANCEL_RULE', 'SAVE_RULE'] as const).includes(event as never);
      case 'error':
        return (['INIT'] as const).includes(event as never);
      case 'loading':
        return (['INIT', 'RecurrenceLoadFailed', 'RecurrenceLoaded', 'RecurrenceSaveFailed', 'RecurrenceSaved'] as const).includes(event as never);
      case 'viewing':
        return (['CANCEL_SCHEDULE', 'EDIT_RULE', 'OPEN_EXCEPTION'] as const).includes(event as never);
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
          event: event as RecurrenceEditorEvent,
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
  const actions: { [K in keyof RecurrenceEditorEventPayloadMap]: (payload?: RecurrenceEditorEventPayloadMap[K]) => Promise<EventResponse> } = {
    'INIT': () => dispatch('INIT'),
    'RecurrenceLoaded': (payload?: RecurrenceEditorEventPayloadMap['RecurrenceLoaded']) => dispatch('RecurrenceLoaded', payload),
    'RecurrenceLoadFailed': (payload?: RecurrenceEditorEventPayloadMap['RecurrenceLoadFailed']) => dispatch('RecurrenceLoadFailed', payload),
    'RecurrenceSaved': (payload?: RecurrenceEditorEventPayloadMap['RecurrenceSaved']) => dispatch('RecurrenceSaved', payload),
    'RecurrenceSaveFailed': (payload?: RecurrenceEditorEventPayloadMap['RecurrenceSaveFailed']) => dispatch('RecurrenceSaveFailed', payload),
    'EDIT_RULE': () => dispatch('EDIT_RULE'),
    'OPEN_EXCEPTION': (payload?: RecurrenceEditorEventPayloadMap['OPEN_EXCEPTION']) => dispatch('OPEN_EXCEPTION', payload),
    'CANCEL_SCHEDULE': () => dispatch('CANCEL_SCHEDULE'),
    'SAVE_RULE': (payload?: RecurrenceEditorEventPayloadMap['SAVE_RULE']) => dispatch('SAVE_RULE', payload),
    'CANCEL_RULE': () => dispatch('CANCEL_RULE'),
    'SKIP_OCCURRENCE': (payload?: RecurrenceEditorEventPayloadMap['SKIP_OCCURRENCE']) => dispatch('SKIP_OCCURRENCE', payload),
    'RESCHEDULE_OCCURRENCE': (payload?: RecurrenceEditorEventPayloadMap['RESCHEDULE_OCCURRENCE']) => dispatch('RESCHEDULE_OCCURRENCE', payload),
    'CLOSE_EXCEPTION': () => dispatch('CLOSE_EXCEPTION'),
    'RESTART': () => dispatch('RESTART'),
  };

  useUIEvents(enqueueEvent, 'RecurrenceOrbital.RecurrenceEditor', ['INIT', 'RecurrenceLoaded', 'RecurrenceLoadFailed', 'RecurrenceSaved', 'RecurrenceSaveFailed', 'EDIT_RULE', 'OPEN_EXCEPTION', 'CANCEL_SCHEDULE', 'SAVE_RULE', 'CANCEL_RULE', 'SKIP_OCCURRENCE', 'RESCHEDULE_OCCURRENCE', 'CLOSE_EXCEPTION', 'RESTART'] as const, eventBus);

  // Verifier snapshot registration (VG Foundation 1)
  const internalStateRef = useRef(internalState);
  internalStateRef.current = internalState;
  useEffect(() => {
    const unregister = registerTraitSnapshot('RecurrenceEditor', (): TraitStateSnapshot => ({
      traitName: 'RecurrenceEditor',
      currentState: internalStateRef.current.machineState,
      states: ['loading', 'viewing', 'defining_rule', 'awaiting_exception_decision', 'cancelled', 'error'],
      events: ['INIT', 'RecurrenceLoaded', 'RecurrenceLoadFailed', 'RecurrenceSaved', 'RecurrenceSaveFailed', 'EDIT_RULE', 'OPEN_EXCEPTION', 'CANCEL_SCHEDULE', 'SAVE_RULE', 'CANCEL_RULE', 'SKIP_OCCURRENCE', 'RESCHEDULE_OCCURRENCE', 'CLOSE_EXCEPTION', 'RESTART'],
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
