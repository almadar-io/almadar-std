/**
 * useRatingReviewBoardLogic
 *
 * Pure logic hook — state machine, orbital bridge, actions.
 * Use the companion component for rendering.
 *
 * @generated from schema
 * @trait RatingReviewBoard
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useOrbitalBridge } from '@/hooks/useOrbitalBridge';
import type { EntityRow, EventPayload, EventPayloadValue, FieldValue } from '@almadar/core';
import type { EventResponse, ReviewView, RatingReviewBoardEventPayloadMap } from '@app/shared';
import { useUIEvents } from '@almadar/ui/hooks';
import { registerTraitSnapshot, type TraitStateSnapshot } from '@almadar/ui/lib';

// ============================================================================
// State Machine
// ============================================================================

export type RatingReviewBoardState =
  | 'loading'
  | 'viewing'
  | 'composing'
  | 'submitting'
  | 'submitted'
  | 'error';

export type RatingReviewBoardEvent =
  | 'INIT'
  | 'ReviewsLoaded'
  | 'ReviewsLoadFailed'
  | 'ReviewSaved'
  | 'ReviewSaveFailed'
  | 'WRITE_REVIEW'
  | 'CHANGE_SORT'
  | 'MARK_HELPFUL'
  | 'RATE_DRAFT'
  | 'SUBMIT_REVIEW'
  | 'CANCEL_REVIEW'
  | 'RESTART';

interface RatingReviewBoardInternalState {
  machineState: RatingReviewBoardState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: RatingReviewBoardEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<ReviewView>;
}

type RatingReviewBoardAction =
  | { type: 'EVENT_SUCCESS'; event: RatingReviewBoardEvent; newState: string; data: Record<string, EntityRow[]>; payload?: EventPayload; fields?: Record<string, EventPayloadValue | undefined>; renderBearing?: boolean }
  | { type: 'EVENT_ERROR'; error: string }
  | { type: 'RESET_ERROR' }
  | { type: 'SET_FIELD'; field: keyof ReviewView & string; value: EventPayloadValue | undefined }
  | { type: 'TICK'; updates: Partial<EntityRow>; collection: string };

function ratingReviewBoardReducer(
  state: RatingReviewBoardInternalState,
  action: RatingReviewBoardAction
): RatingReviewBoardInternalState {
  switch (action.type) {
    case 'EVENT_SUCCESS':
      return {
        machineState: action.newState as RatingReviewBoardState,
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

const initialState: RatingReviewBoardInternalState = {
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

export interface RatingReviewBoardConfig {
  linkedEntity?: string;
  entityId?: string;
  cancelLabel: string;
  cardLook: 'elevated' | 'flat-bordered' | 'borderless-divider' | 'ticket' | 'invoice' | 'chip' | 'tile-image-first';
  reviewFields: string[];
  sortOptions: { icon?: string; id: string; label: string }[];
  starDistribution: { label: string; percentage: number }[];
  subjectTitle: string;
  submitLabel: string;
  writeLabel: string;
}

const DEFAULT_RATING_REVIEW_BOARD_CONFIG = {
  cancelLabel: "Cancel",
  cardLook: "elevated",
  reviewFields: ["draftComment"],
  sortOptions: [{ icon: "clock", id: "recent", label: "Most recent" }, { icon: "star", id: "highest", label: "Top rated" }, { icon: "trending-down", id: "lowest", label: "Lowest" }],
  starDistribution: [{ label: "5 stars", percentage: 74 }, { label: "4 stars", percentage: 18 }, { label: "3 stars", percentage: 5 }, { label: "2 stars", percentage: 2 }, { label: "1 star", percentage: 1 }],
  subjectTitle: "Bali Sunset Villa · 3 nights",
  submitLabel: "Submit review",
  writeLabel: "Write a review",
} as RatingReviewBoardConfig;

export interface RatingReviewBoardLogicReturn {
  state: RatingReviewBoardState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: RatingReviewBoardEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<ReviewView>;
  dispatch: (event: string, payload?: EventPayload) => Promise<EventResponse>;
  actions: { [K in keyof RatingReviewBoardEventPayloadMap]: (payload?: RatingReviewBoardEventPayloadMap[K]) => Promise<EventResponse> };
  config: RatingReviewBoardConfig;
}

export function useRatingReviewBoardLogic(config?: RatingReviewBoardConfig): RatingReviewBoardLogicReturn {
  const mergedConfig: RatingReviewBoardConfig = { ...DEFAULT_RATING_REVIEW_BOARD_CONFIG, ...(config ?? {}) };

  // Orbital bridge: event bus + server communication
  const { sendEvent, eventBus } = useOrbitalBridge({ basePath: '/api/rating-review-board', orbitalName: 'RatingReviewOrbital', traitName: 'RatingReviewBoard' });

  // Internal state with reducer
  const [internalState, dispatchReducer] = useReducer(ratingReviewBoardReducer, initialState);
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


    if (fromState === 'loading' && event === 'ReviewsLoaded') {
      // loading → viewing (on ReviewsLoaded)
        _fields['reviewsSource'] = ((payloadObj?.data ?? []) as readonly EntityRow[]).map(((row: EntityRow) => ({ helpful: (("helpful" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? 0), rating: (("rating" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? 5), authorName: (("authorName" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? "Guest"), id: (("id" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? ""), createdAt: (("createdAt" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? ""), avatarIcon: (("avatarIcon" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? "user"), comment: (("comment" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? "") })));
        fields = { ...(fields ?? {}), 'reviewsSource': _fields['reviewsSource'] } as typeof fields;
        _fields['reviews'] = fields?.reviewsSource;
        fields = { ...(fields ?? {}), 'reviews': _fields['reviews'] } as typeof fields;
        _fields['totalReviews'] = ((payloadObj?.data ?? []) as { readonly length: number }).length;
        fields = { ...(fields ?? {}), 'totalReviews': _fields['totalReviews'] } as typeof fields;
        _fields['averageRating'] = ((arr: readonly EntityRow[]) => arr.length ? arr.reduce((s: number, v: EntityRow) => s + (Number(v) || 0), 0) / arr.length : 0)(((((payloadObj?.data ?? []) as readonly EntityRow[]).map(((row: EntityRow) => (("rating" as string).split('.').reduce((o: any, k: string) => o?.[k], row) ?? 5))) ?? []) as readonly EntityRow[]));
        fields = { ...(fields ?? {}), 'averageRating': _fields['averageRating'] } as typeof fields;
        _fields['starDistribution'] = [{ label: "5 stars", percentage: 74 }, { label: "4 stars", percentage: 18 }, { label: "3 stars", percentage: 5 }, { percentage: 2, label: "2 stars" }, { percentage: 1, label: "1 star" }];
        fields = { ...(fields ?? {}), 'starDistribution': _fields['starDistribution'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'ReviewsLoadFailed') {
      // loading → error (on ReviewsLoadFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'ReviewSaveFailed') {
      // loading → error (on ReviewSaveFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'viewing' && event === 'WRITE_REVIEW') {
      // viewing → composing (on WRITE_REVIEW)
        _fields['draftRating'] = 0;
        fields = { ...(fields ?? {}), 'draftRating': _fields['draftRating'] } as typeof fields;
        _fields['draftComment'] = "";
        fields = { ...(fields ?? {}), 'draftComment': _fields['draftComment'] } as typeof fields;
    } else if (fromState === 'viewing' && event === 'CHANGE_SORT' && ((payloadObj?.tabId === "highest"))) {
      // viewing → viewing (on CHANGE_SORT)
        _fields['currentSort'] = "highest";
        fields = { ...(fields ?? {}), 'currentSort': _fields['currentSort'] } as typeof fields;
        _fields['reviews'] = [...(fields?.reviewsSource ?? [])].sort((a: EntityRow, b: EntityRow) => { const av = (a as EntityRow)?.["rating"], bv = (b as EntityRow)?.["rating"]; const dir = (("desc") as string) === 'desc' ? -1 : 1; if ((av as number) < (bv as number)) return -1 * dir; if ((av as number) > (bv as number)) return 1 * dir; return 0; });
        fields = { ...(fields ?? {}), 'reviews': _fields['reviews'] } as typeof fields;
    } else if (fromState === 'viewing' && event === 'CHANGE_SORT' && ((payloadObj?.tabId === "lowest"))) {
      // viewing → viewing (on CHANGE_SORT)
        _fields['currentSort'] = "lowest";
        fields = { ...(fields ?? {}), 'currentSort': _fields['currentSort'] } as typeof fields;
        _fields['reviews'] = [...(fields?.reviewsSource ?? [])].sort((a: EntityRow, b: EntityRow) => { const av = (a as EntityRow)?.["rating"], bv = (b as EntityRow)?.["rating"]; const dir = (("asc") as string) === 'desc' ? -1 : 1; if ((av as number) < (bv as number)) return -1 * dir; if ((av as number) > (bv as number)) return 1 * dir; return 0; });
        fields = { ...(fields ?? {}), 'reviews': _fields['reviews'] } as typeof fields;
    } else if (fromState === 'viewing' && event === 'CHANGE_SORT' && ((payloadObj?.tabId === "recent"))) {
      // viewing → viewing (on CHANGE_SORT)
        _fields['currentSort'] = "recent";
        fields = { ...(fields ?? {}), 'currentSort': _fields['currentSort'] } as typeof fields;
        _fields['reviews'] = [...(fields?.reviewsSource ?? [])].sort((a: EntityRow, b: EntityRow) => { const av = (a as EntityRow)?.["createdAt"], bv = (b as EntityRow)?.["createdAt"]; const dir = (("desc") as string) === 'desc' ? -1 : 1; if ((av as number) < (bv as number)) return -1 * dir; if ((av as number) > (bv as number)) return 1 * dir; return 0; });
        fields = { ...(fields ?? {}), 'reviews': _fields['reviews'] } as typeof fields;
    } else if (fromState === 'composing' && event === 'RATE_DRAFT') {
      // composing → composing (on RATE_DRAFT)
        _fields['draftRating'] = payloadObj?.rating;
        fields = { ...(fields ?? {}), 'draftRating': _fields['draftRating'] } as typeof fields;
    } else if (fromState === 'composing' && event === 'CANCEL_REVIEW') {
      // composing → viewing (on CANCEL_REVIEW)
        _fields['draftRating'] = 0;
        fields = { ...(fields ?? {}), 'draftRating': _fields['draftRating'] } as typeof fields;
        _fields['draftComment'] = "";
        fields = { ...(fields ?? {}), 'draftComment': _fields['draftComment'] } as typeof fields;
    } else if (fromState === 'submitting' && event === 'ReviewSaveFailed') {
      // submitting → error (on ReviewSaveFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
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
      case 'composing':
        return (['CANCEL_REVIEW', 'RATE_DRAFT', 'SUBMIT_REVIEW'] as const).includes(event as never);
      case 'error':
        return (['INIT'] as const).includes(event as never);
      case 'loading':
        return (['INIT', 'ReviewSaveFailed', 'ReviewSaved', 'ReviewsLoadFailed', 'ReviewsLoaded'] as const).includes(event as never);
      case 'submitted':
        return (['RESTART'] as const).includes(event as never);
      case 'submitting':
        return (['ReviewSaveFailed', 'ReviewSaved'] as const).includes(event as never);
      case 'viewing':
        return (['CHANGE_SORT', 'MARK_HELPFUL', 'WRITE_REVIEW'] as const).includes(event as never);
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
          event: event as RatingReviewBoardEvent,
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
  const actions: { [K in keyof RatingReviewBoardEventPayloadMap]: (payload?: RatingReviewBoardEventPayloadMap[K]) => Promise<EventResponse> } = {
    'INIT': () => dispatch('INIT'),
    'ReviewsLoaded': (payload?: RatingReviewBoardEventPayloadMap['ReviewsLoaded']) => dispatch('ReviewsLoaded', payload),
    'ReviewsLoadFailed': (payload?: RatingReviewBoardEventPayloadMap['ReviewsLoadFailed']) => dispatch('ReviewsLoadFailed', payload),
    'ReviewSaved': (payload?: RatingReviewBoardEventPayloadMap['ReviewSaved']) => dispatch('ReviewSaved', payload),
    'ReviewSaveFailed': (payload?: RatingReviewBoardEventPayloadMap['ReviewSaveFailed']) => dispatch('ReviewSaveFailed', payload),
    'WRITE_REVIEW': () => dispatch('WRITE_REVIEW'),
    'CHANGE_SORT': (payload?: RatingReviewBoardEventPayloadMap['CHANGE_SORT']) => dispatch('CHANGE_SORT', payload),
    'MARK_HELPFUL': (payload?: RatingReviewBoardEventPayloadMap['MARK_HELPFUL']) => dispatch('MARK_HELPFUL', payload),
    'RATE_DRAFT': (payload?: RatingReviewBoardEventPayloadMap['RATE_DRAFT']) => dispatch('RATE_DRAFT', payload),
    'SUBMIT_REVIEW': (payload?: RatingReviewBoardEventPayloadMap['SUBMIT_REVIEW']) => dispatch('SUBMIT_REVIEW', payload),
    'CANCEL_REVIEW': () => dispatch('CANCEL_REVIEW'),
    'RESTART': () => dispatch('RESTART'),
  };

  useUIEvents(enqueueEvent, 'RatingReviewOrbital.RatingReviewBoard', ['INIT', 'ReviewsLoaded', 'ReviewsLoadFailed', 'ReviewSaved', 'ReviewSaveFailed', 'WRITE_REVIEW', 'CHANGE_SORT', 'MARK_HELPFUL', 'RATE_DRAFT', 'SUBMIT_REVIEW', 'CANCEL_REVIEW', 'RESTART'] as const, eventBus);

  // Verifier snapshot registration (VG Foundation 1)
  const internalStateRef = useRef(internalState);
  internalStateRef.current = internalState;
  useEffect(() => {
    const unregister = registerTraitSnapshot('RatingReviewBoard', (): TraitStateSnapshot => ({
      traitName: 'RatingReviewBoard',
      currentState: internalStateRef.current.machineState,
      states: ['loading', 'viewing', 'composing', 'submitting', 'submitted', 'error'],
      events: ['INIT', 'ReviewsLoaded', 'ReviewsLoadFailed', 'ReviewSaved', 'ReviewSaveFailed', 'WRITE_REVIEW', 'CHANGE_SORT', 'MARK_HELPFUL', 'RATE_DRAFT', 'SUBMIT_REVIEW', 'CANCEL_REVIEW', 'RESTART'],
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
