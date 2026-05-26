/**
 * useRatingReviewSubmitLogic
 *
 * Pure logic hook — state machine, orbital bridge, actions.
 * Use the companion component for rendering.
 *
 * @generated from schema
 * @trait RatingReviewSubmit
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useOrbitalBridge } from '@/hooks/useOrbitalBridge';
import type { EntityRow, EventPayload, EventPayloadValue, FieldValue } from '@almadar/core';
import type { EventResponse, ReviewView, RatingReviewSubmitEventPayloadMap } from '@app/shared';
import { useUIEvents } from '@almadar/ui/hooks';
import { registerTraitSnapshot, type TraitStateSnapshot } from '@almadar/ui/lib';

// ============================================================================
// State Machine
// ============================================================================

export type RatingReviewSubmitState =
  | 'composing'
  | 'submitting'
  | 'submitted'
  | 'error';

export type RatingReviewSubmitEvent =
  | 'INIT'
  | 'RATE_DRAFT'
  | 'SUBMIT_REVIEW'
  | 'CANCEL_REVIEW'
  | 'ReviewSaved'
  | 'ReviewSaveFailed'
  | 'RESTART';

interface RatingReviewSubmitInternalState {
  machineState: RatingReviewSubmitState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: RatingReviewSubmitEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<ReviewView>;
}

type RatingReviewSubmitAction =
  | { type: 'EVENT_SUCCESS'; event: RatingReviewSubmitEvent; newState: string; data: Record<string, EntityRow[]>; payload?: EventPayload; fields?: Record<string, EventPayloadValue | undefined>; renderBearing?: boolean }
  | { type: 'EVENT_ERROR'; error: string }
  | { type: 'RESET_ERROR' }
  | { type: 'SET_FIELD'; field: keyof ReviewView & string; value: EventPayloadValue | undefined }
  | { type: 'TICK'; updates: Partial<EntityRow>; collection: string };

function ratingReviewSubmitReducer(
  state: RatingReviewSubmitInternalState,
  action: RatingReviewSubmitAction
): RatingReviewSubmitInternalState {
  switch (action.type) {
    case 'EVENT_SUCCESS':
      return {
        machineState: action.newState as RatingReviewSubmitState,
        data: { ...state.data, ...action.data },
        lastPayload: action.renderBearing ? (action.payload ?? state.lastPayload) : state.lastPayload,
        lastEvent: action.renderBearing ? action.event : state.lastEvent,
        loading: false,
        error: null,
        fields: { ...state.fields, ...(action.fields ?? {}) } as Partial<ReviewView>,
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
        fields: { ...state.fields, [action.field]: action.value } as Partial<ReviewView>,
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

const initialState: RatingReviewSubmitInternalState = {
  machineState: 'composing',
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

export interface RatingReviewSubmitConfig {
  linkedEntity?: string;
  entityId?: string;
  allowComment: boolean;
  allowPhotos: boolean;
  cancelLabel: string;
  maxStars: number;
  submitEvent: string;
  submitLabel: string;
  title: string;
}

const DEFAULT_RATING_REVIEW_SUBMIT_CONFIG = {
  allowComment: true,
  allowPhotos: false,
  cancelLabel: "Cancel",
  maxStars: 5,
  submitEvent: "SUBMIT_REVIEW",
  submitLabel: "Submit review",
  title: "Write a review",
} as RatingReviewSubmitConfig;

export interface RatingReviewSubmitLogicReturn {
  state: RatingReviewSubmitState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: RatingReviewSubmitEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<ReviewView>;
  dispatch: (event: string, payload?: EventPayload) => Promise<EventResponse>;
  actions: { [K in keyof RatingReviewSubmitEventPayloadMap]: (payload?: RatingReviewSubmitEventPayloadMap[K]) => Promise<EventResponse> };
  config: RatingReviewSubmitConfig;
}

export function useRatingReviewSubmitLogic(config?: RatingReviewSubmitConfig): RatingReviewSubmitLogicReturn {
  const mergedConfig: RatingReviewSubmitConfig = { ...DEFAULT_RATING_REVIEW_SUBMIT_CONFIG, ...(config ?? {}) };

  // Orbital bridge: event bus + server communication
  const { sendEvent, eventBus } = useOrbitalBridge({ basePath: '/api/rating-review-submit', orbitalName: 'RatingReviewOrbital', traitName: 'RatingReviewSubmit' });

  // Internal state with reducer
  const [internalState, dispatchReducer] = useReducer(ratingReviewSubmitReducer, initialState);
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
    const entity: EntityRow[] = data['ReviewView'] ?? [];
    let fields = _initialFields ?? {};


    if (fromState === 'composing' && event === 'INIT') {
      // composing → composing (on INIT)
        _fields['draftRating'] = 0;
        fields = { ...(fields ?? {}), 'draftRating': _fields['draftRating'] } as typeof fields;
        _fields['draftComment'] = "";
        fields = { ...(fields ?? {}), 'draftComment': _fields['draftComment'] } as typeof fields;
    } else if (fromState === 'composing' && event === 'RATE_DRAFT') {
      // composing → composing (on RATE_DRAFT)
        _fields['draftRating'] = payloadObj?.rating;
        fields = { ...(fields ?? {}), 'draftRating': _fields['draftRating'] } as typeof fields;
    } else if (fromState === 'composing' && event === 'CANCEL_REVIEW') {
      // composing → composing (on CANCEL_REVIEW)
        _fields['draftRating'] = 0;
        fields = { ...(fields ?? {}), 'draftRating': _fields['draftRating'] } as typeof fields;
        _fields['draftComment'] = "";
        fields = { ...(fields ?? {}), 'draftComment': _fields['draftComment'] } as typeof fields;
    } else if (fromState === 'submitting' && event === 'ReviewSaveFailed') {
      // submitting → error (on ReviewSaveFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'submitted' && event === 'RESTART') {
      // submitted → composing (on RESTART)
        _fields['draftRating'] = 0;
        fields = { ...(fields ?? {}), 'draftRating': _fields['draftRating'] } as typeof fields;
        _fields['draftComment'] = "";
        fields = { ...(fields ?? {}), 'draftComment': _fields['draftComment'] } as typeof fields;
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
      case 'composing':
        return (['CANCEL_REVIEW', 'INIT', 'RATE_DRAFT', 'SUBMIT_REVIEW'] as const).includes(event as never);
      case 'error':
        return (['RESTART'] as const).includes(event as never);
      case 'submitted':
        return (['RESTART'] as const).includes(event as never);
      case 'submitting':
        return (['ReviewSaveFailed', 'ReviewSaved'] as const).includes(event as never);
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
          event: event as RatingReviewSubmitEvent,
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
  const actions: { [K in keyof RatingReviewSubmitEventPayloadMap]: (payload?: RatingReviewSubmitEventPayloadMap[K]) => Promise<EventResponse> } = {
    'INIT': () => dispatch('INIT'),
    'RATE_DRAFT': (payload?: RatingReviewSubmitEventPayloadMap['RATE_DRAFT']) => dispatch('RATE_DRAFT', payload),
    'SUBMIT_REVIEW': (payload?: RatingReviewSubmitEventPayloadMap['SUBMIT_REVIEW']) => dispatch('SUBMIT_REVIEW', payload),
    'CANCEL_REVIEW': () => dispatch('CANCEL_REVIEW'),
    'ReviewSaved': (payload?: RatingReviewSubmitEventPayloadMap['ReviewSaved']) => dispatch('ReviewSaved', payload),
    'ReviewSaveFailed': (payload?: RatingReviewSubmitEventPayloadMap['ReviewSaveFailed']) => dispatch('ReviewSaveFailed', payload),
    'RESTART': () => dispatch('RESTART'),
  };

  useUIEvents(enqueueEvent, 'RatingReviewOrbital.RatingReviewSubmit', ['INIT', 'RATE_DRAFT', 'SUBMIT_REVIEW', 'CANCEL_REVIEW', 'ReviewSaved', 'ReviewSaveFailed', 'RESTART'] as const, eventBus);

  // Verifier snapshot registration (VG Foundation 1)
  const internalStateRef = useRef(internalState);
  internalStateRef.current = internalState;
  useEffect(() => {
    const unregister = registerTraitSnapshot('RatingReviewSubmit', (): TraitStateSnapshot => ({
      traitName: 'RatingReviewSubmit',
      currentState: internalStateRef.current.machineState,
      states: ['composing', 'submitting', 'submitted', 'error'],
      events: ['INIT', 'RATE_DRAFT', 'SUBMIT_REVIEW', 'CANCEL_REVIEW', 'ReviewSaved', 'ReviewSaveFailed', 'RESTART'],
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
