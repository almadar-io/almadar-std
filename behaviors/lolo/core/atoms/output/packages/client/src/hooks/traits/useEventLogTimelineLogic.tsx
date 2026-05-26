/**
 * useEventLogTimelineLogic
 *
 * Pure logic hook — state machine, orbital bridge, actions.
 * Use the companion component for rendering.
 *
 * @generated from schema
 * @trait EventLogTimeline
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useOrbitalBridge } from '@/hooks/useOrbitalBridge';
import type { EntityRow, EventPayload, EventPayloadValue, FieldValue } from '@almadar/core';
import type { EventResponse, EventLogView, EventLogTimelineEventPayloadMap } from '@app/shared';
import { useUIEvents } from '@almadar/ui/hooks';
import { registerTraitSnapshot, type TraitStateSnapshot } from '@almadar/ui/lib';

// ============================================================================
// State Machine
// ============================================================================

export type EventLogTimelineState =
  | 'loading'
  | 'viewing'
  | 'backfilling'
  | 'error';

export type EventLogTimelineEvent =
  | 'INIT'
  | 'EventLogLoaded'
  | 'EventLogLoadFailed'
  | 'EventLogSaved'
  | 'EventLogSaveFailed'
  | 'APPLY_FILTER'
  | 'OPEN_BACKFILL'
  | 'SAVE_BACKFILL'
  | 'CANCEL_BACKFILL';

interface EventLogTimelineInternalState {
  machineState: EventLogTimelineState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: EventLogTimelineEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<EventLogView>;
}

type EventLogTimelineAction =
  | { type: 'EVENT_SUCCESS'; event: EventLogTimelineEvent; newState: string; data: Record<string, EntityRow[]>; payload?: EventPayload; fields?: Record<string, EventPayloadValue | undefined>; renderBearing?: boolean }
  | { type: 'EVENT_ERROR'; error: string }
  | { type: 'RESET_ERROR' }
  | { type: 'SET_FIELD'; field: keyof EventLogView & string; value: EventPayloadValue | undefined }
  | { type: 'TICK'; updates: Partial<EntityRow>; collection: string };

function eventLogTimelineReducer(
  state: EventLogTimelineInternalState,
  action: EventLogTimelineAction
): EventLogTimelineInternalState {
  switch (action.type) {
    case 'EVENT_SUCCESS':
      return {
        machineState: action.newState as EventLogTimelineState,
        data: { ...state.data, ...action.data },
        lastPayload: action.renderBearing ? (action.payload ?? state.lastPayload) : state.lastPayload,
        lastEvent: action.renderBearing ? action.event : state.lastEvent,
        loading: false,
        error: null,
        fields: { ...state.fields, ...(action.fields ?? {}) } as Partial<EventLogView>,
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
        fields: { ...state.fields, [action.field]: action.value } as Partial<EventLogView>,
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

const initialState: EventLogTimelineInternalState = {
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

export interface EventLogTimelineConfig {
  linkedEntity?: string;
  entityId?: string;
  cardLook: 'elevated' | 'flat-bordered' | 'borderless-divider' | 'ticket' | 'invoice' | 'chip' | 'tile-image-first';
  formFields: string[];
  kindOptions: { icon?: string; key: string; label: string; status?: 'complete' | 'active' | 'pending' | 'error' }[];
  title: string;
}

const DEFAULT_EVENT_LOG_TIMELINE_CONFIG = {
  cardLook: "elevated",
  formFields: ["backfillTitle", "backfillDescription", "backfillKind", "backfillDate"],
  kindOptions: [{ icon: "plus-circle", key: "created", label: "Created", status: "active" }, { icon: "edit-3", key: "updated", label: "Updated", status: "pending" }, { icon: "check-circle", key: "approved", label: "Approved", status: "complete" }, { icon: "x-circle", key: "rejected", label: "Rejected", status: "error" }],
  title: "Activity",
} as EventLogTimelineConfig;

export interface EventLogTimelineLogicReturn {
  state: EventLogTimelineState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: EventLogTimelineEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<EventLogView>;
  dispatch: (event: string, payload?: EventPayload) => Promise<EventResponse>;
  actions: { [K in keyof EventLogTimelineEventPayloadMap]: (payload?: EventLogTimelineEventPayloadMap[K]) => Promise<EventResponse> };
  config: EventLogTimelineConfig;
}

export function useEventLogTimelineLogic(config?: EventLogTimelineConfig): EventLogTimelineLogicReturn {
  const mergedConfig: EventLogTimelineConfig = { ...DEFAULT_EVENT_LOG_TIMELINE_CONFIG, ...(config ?? {}) };

  // Orbital bridge: event bus + server communication
  const { sendEvent, eventBus } = useOrbitalBridge({ basePath: '/api/event-log-timeline', orbitalName: 'EventLogOrbital', traitName: 'EventLogTimeline' });

  // Internal state with reducer
  const [internalState, dispatchReducer] = useReducer(eventLogTimelineReducer, initialState);
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
    const entity: EntityRow[] = data['EventLogView'] ?? [];
    let fields = _initialFields ?? {};


    if (fromState === 'loading' && event === 'EventLogLoaded') {
      // loading → viewing (on EventLogLoaded)
        _fields['filterChips'] = [{ icon: "list", label: "All", id: "" }, ...([{ id: "created", icon: "plus-circle", label: "Created" }, { label: "Updated", icon: "edit-3", id: "updated" }, { id: "approved", label: "Approved", icon: "check-circle" }, { label: "Rejected", id: "rejected", icon: "x-circle" }])];
        fields = { ...(fields ?? {}), 'filterChips': _fields['filterChips'] } as typeof fields;
        _fields['allEntries'] = [...(((payloadObj?.data ?? []) as readonly EntityRow[]).map(((row: EntityRow) => ({ kind: (("kind" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? ""), title: (("title" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? ""), id: (("id" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? ""), description: (("description" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? ""), date: (("createdAt" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? (("date" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? "")), status: (("status" as string).split('.').reduce((o: any, k: string) => o?.[k], (([{ key: "created", icon: "plus-circle", status: "active", label: "Created" }, { label: "Updated", key: "updated", status: "pending", icon: "edit-3" }, { status: "complete", icon: "check-circle", key: "approved", label: "Approved" }, { icon: "x-circle", key: "rejected", status: "error", label: "Rejected" }]).find(((k: EntityRow) => ((("key" as string).split('.').reduce((o: any, k: string) => o?.[k], k)) === (("kind" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? "")))) || {  })) ?? "pending") }))))].sort((a: EntityRow, b: EntityRow) => { const av = (a as EntityRow)?.["date"], bv = (b as EntityRow)?.["date"]; const dir = (("desc") as string) === 'desc' ? -1 : 1; if ((av as number) < (bv as number)) return -1 * dir; if ((av as number) > (bv as number)) return 1 * dir; return 0; });
        fields = { ...(fields ?? {}), 'allEntries': _fields['allEntries'] } as typeof fields;
        _fields['entries'] = [...(((payloadObj?.data ?? []) as readonly EntityRow[]).map(((row: EntityRow) => ({ date: (("createdAt" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? (("date" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? "")), title: (("title" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? ""), id: (("id" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? ""), status: (("status" as string).split('.').reduce((o: any, k: string) => o?.[k], (([{ key: "created", icon: "plus-circle", status: "active", label: "Created" }, { icon: "edit-3", key: "updated", status: "pending", label: "Updated" }, { key: "approved", status: "complete", icon: "check-circle", label: "Approved" }, { status: "error", icon: "x-circle", key: "rejected", label: "Rejected" }]).find(((k: EntityRow) => ((("key" as string).split('.').reduce((o: any, k: string) => o?.[k], k)) === (("kind" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? "")))) || {  })) ?? "pending"), kind: (("kind" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? ""), description: (("description" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? "") }))))].sort((a: EntityRow, b: EntityRow) => { const av = (a as EntityRow)?.["date"], bv = (b as EntityRow)?.["date"]; const dir = (("desc") as string) === 'desc' ? -1 : 1; if ((av as number) < (bv as number)) return -1 * dir; if ((av as number) > (bv as number)) return 1 * dir; return 0; });
        fields = { ...(fields ?? {}), 'entries': _fields['entries'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'EventLogLoadFailed') {
      // loading → error (on EventLogLoadFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'EventLogSaveFailed') {
      // loading → error (on EventLogSaveFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'viewing' && event === 'APPLY_FILTER') {
      // viewing → viewing (on APPLY_FILTER)
        _fields['filterKind'] = payloadObj?.tabId;
        fields = { ...(fields ?? {}), 'filterKind': _fields['filterKind'] } as typeof fields;
        _fields['entries'] = ((fields?.allEntries ?? []) as readonly EntityRow[]).filter(((e: EntityRow) => ((payloadObj?.tabId === "") || ((("kind" as string).split('.').reduce((o: any, k: string) => o?.[k], e)) === payloadObj?.tabId))));
        fields = { ...(fields ?? {}), 'entries': _fields['entries'] } as typeof fields;
    } else if (fromState === 'viewing' && event === 'OPEN_BACKFILL') {
      // viewing → backfilling (on OPEN_BACKFILL)
        _fields['backfillTitle'] = "";
        fields = { ...(fields ?? {}), 'backfillTitle': _fields['backfillTitle'] } as typeof fields;
        _fields['backfillDescription'] = "";
        fields = { ...(fields ?? {}), 'backfillDescription': _fields['backfillDescription'] } as typeof fields;
        _fields['backfillDate'] = "";
        fields = { ...(fields ?? {}), 'backfillDate': _fields['backfillDate'] } as typeof fields;
        _fields['backfillKind'] = "";
        fields = { ...(fields ?? {}), 'backfillKind': _fields['backfillKind'] } as typeof fields;
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
      case 'backfilling':
        return (['CANCEL_BACKFILL', 'SAVE_BACKFILL'] as const).includes(event as never);
      case 'error':
        return (['INIT'] as const).includes(event as never);
      case 'loading':
        return (['EventLogLoadFailed', 'EventLogLoaded', 'EventLogSaveFailed', 'EventLogSaved', 'INIT'] as const).includes(event as never);
      case 'viewing':
        return (['APPLY_FILTER', 'OPEN_BACKFILL'] as const).includes(event as never);
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
          event: event as EventLogTimelineEvent,
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
  const actions: { [K in keyof EventLogTimelineEventPayloadMap]: (payload?: EventLogTimelineEventPayloadMap[K]) => Promise<EventResponse> } = {
    'INIT': () => dispatch('INIT'),
    'EventLogLoaded': (payload?: EventLogTimelineEventPayloadMap['EventLogLoaded']) => dispatch('EventLogLoaded', payload),
    'EventLogLoadFailed': (payload?: EventLogTimelineEventPayloadMap['EventLogLoadFailed']) => dispatch('EventLogLoadFailed', payload),
    'EventLogSaved': (payload?: EventLogTimelineEventPayloadMap['EventLogSaved']) => dispatch('EventLogSaved', payload),
    'EventLogSaveFailed': (payload?: EventLogTimelineEventPayloadMap['EventLogSaveFailed']) => dispatch('EventLogSaveFailed', payload),
    'APPLY_FILTER': (payload?: EventLogTimelineEventPayloadMap['APPLY_FILTER']) => dispatch('APPLY_FILTER', payload),
    'OPEN_BACKFILL': () => dispatch('OPEN_BACKFILL'),
    'SAVE_BACKFILL': (payload?: EventLogTimelineEventPayloadMap['SAVE_BACKFILL']) => dispatch('SAVE_BACKFILL', payload),
    'CANCEL_BACKFILL': () => dispatch('CANCEL_BACKFILL'),
  };

  useUIEvents(enqueueEvent, 'EventLogOrbital.EventLogTimeline', ['INIT', 'EventLogLoaded', 'EventLogLoadFailed', 'EventLogSaved', 'EventLogSaveFailed', 'APPLY_FILTER', 'OPEN_BACKFILL', 'SAVE_BACKFILL', 'CANCEL_BACKFILL'] as const, eventBus);

  // Verifier snapshot registration (VG Foundation 1)
  const internalStateRef = useRef(internalState);
  internalStateRef.current = internalState;
  useEffect(() => {
    const unregister = registerTraitSnapshot('EventLogTimeline', (): TraitStateSnapshot => ({
      traitName: 'EventLogTimeline',
      currentState: internalStateRef.current.machineState,
      states: ['loading', 'viewing', 'backfilling', 'error'],
      events: ['INIT', 'EventLogLoaded', 'EventLogLoadFailed', 'EventLogSaved', 'EventLogSaveFailed', 'APPLY_FILTER', 'OPEN_BACKFILL', 'SAVE_BACKFILL', 'CANCEL_BACKFILL'],
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
