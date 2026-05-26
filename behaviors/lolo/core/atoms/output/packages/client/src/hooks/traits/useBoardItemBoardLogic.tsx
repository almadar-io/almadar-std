/**
 * useBoardItemBoardLogic
 *
 * Pure logic hook — state machine, orbital bridge, actions.
 * Use the companion component for rendering.
 *
 * @generated from schema
 * @trait BoardItemBoard
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useOrbitalBridge } from '@/hooks/useOrbitalBridge';
import type { EntityRow, EventPayload, EventPayloadValue, FieldValue } from '@almadar/core';
import type { EventResponse, BoardView, BoardItemBoardEventPayloadMap } from '@app/shared';
import { useUIEvents } from '@almadar/ui/hooks';
import { registerTraitSnapshot, type TraitStateSnapshot } from '@almadar/ui/lib';

// ============================================================================
// State Machine
// ============================================================================

export type BoardItemBoardState =
  | 'loading'
  | 'viewing_board'
  | 'viewing_card'
  | 'adding'
  | 'error';

export type BoardItemBoardEvent =
  | 'INIT'
  | 'BoardItemsLoaded'
  | 'BoardItemsLoadFailed'
  | 'BoardItemsSaveFailed'
  | 'OPEN_CARD'
  | 'ADD_CARD'
  | 'MOVE_CARD'
  | 'REORDER_CARD'
  | 'REORDER_POSITION'
  | 'BoardItemsSaved'
  | 'CLOSE_CARD'
  | 'DELETE_CARD'
  | 'SAVE_CARD'
  | 'CANCEL_ADD';

interface BoardItemBoardInternalState {
  machineState: BoardItemBoardState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: BoardItemBoardEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<BoardView>;
}

type BoardItemBoardAction =
  | { type: 'EVENT_SUCCESS'; event: BoardItemBoardEvent; newState: string; data: Record<string, EntityRow[]>; payload?: EventPayload; fields?: Record<string, EventPayloadValue | undefined>; renderBearing?: boolean }
  | { type: 'EVENT_ERROR'; error: string }
  | { type: 'RESET_ERROR' }
  | { type: 'SET_FIELD'; field: keyof BoardView & string; value: EventPayloadValue | undefined }
  | { type: 'TICK'; updates: Partial<EntityRow>; collection: string };

function boardItemBoardReducer(
  state: BoardItemBoardInternalState,
  action: BoardItemBoardAction
): BoardItemBoardInternalState {
  switch (action.type) {
    case 'EVENT_SUCCESS':
      return {
        machineState: action.newState as BoardItemBoardState,
        data: { ...state.data, ...action.data },
        lastPayload: action.renderBearing ? (action.payload ?? state.lastPayload) : state.lastPayload,
        lastEvent: action.renderBearing ? action.event : state.lastEvent,
        loading: false,
        error: null,
        fields: { ...state.fields, ...(action.fields ?? {}) } as Partial<BoardView>,
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
        fields: { ...state.fields, [action.field]: action.value } as Partial<BoardView>,
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

const initialState: BoardItemBoardInternalState = {
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

export interface BoardItemBoardConfig {
  linkedEntity?: string;
  entityId?: string;
  cardLook: 'elevated' | 'flat-bordered' | 'borderless-divider' | 'ticket' | 'invoice' | 'chip' | 'tile-image-first';
  columns: { icon?: string; key: string; label: string; variant?: string }[];
  formFields: string[];
  gridCols: number;
  title: string;
}

const DEFAULT_BOARD_ITEM_BOARD_CONFIG = {
  cardLook: "elevated",
  columns: [{ icon: "circle", key: "todo", label: "To Do", variant: "default" }, { icon: "circle-dot", key: "doing", label: "In Progress", variant: "primary" }, { icon: "check-circle", key: "done", label: "Done", variant: "success" }],
  formFields: ["title", "description", "stage", "notes"],
  gridCols: 3,
  title: "Board",
} as BoardItemBoardConfig;

export interface BoardItemBoardLogicReturn {
  state: BoardItemBoardState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: BoardItemBoardEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<BoardView>;
  dispatch: (event: string, payload?: EventPayload) => Promise<EventResponse>;
  actions: { [K in keyof BoardItemBoardEventPayloadMap]: (payload?: BoardItemBoardEventPayloadMap[K]) => Promise<EventResponse> };
  config: BoardItemBoardConfig;
}

export function useBoardItemBoardLogic(config?: BoardItemBoardConfig): BoardItemBoardLogicReturn {
  const mergedConfig: BoardItemBoardConfig = { ...DEFAULT_BOARD_ITEM_BOARD_CONFIG, ...(config ?? {}) };

  // Orbital bridge: event bus + server communication
  const { sendEvent, eventBus } = useOrbitalBridge({ basePath: '/api/board-item-board', orbitalName: 'BoardOrbital', traitName: 'BoardItemBoard' });

  // Internal state with reducer
  const [internalState, dispatchReducer] = useReducer(boardItemBoardReducer, initialState);
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
    const entity: EntityRow[] = data['BoardView'] ?? [];
    let fields = _initialFields ?? {};


    if (fromState === 'loading' && event === 'BoardItemsLoaded') {
      // loading → viewing_board (on BoardItemsLoaded)
        _fields['boards'] = [{ key: "todo", variant: "default", label: "To Do", icon: "circle", items: [...(((payloadObj?.data ?? []) as readonly EntityRow[]).filter(((item: EntityRow) => ((("stage" as string).split('.').reduce((o: any, k: string) => o?.[k], item)) === "todo"))))].sort((a: EntityRow, b: EntityRow) => { const av = (a as EntityRow)?.["position"], bv = (b as EntityRow)?.["position"]; if ((av as number) < (bv as number)) return -1; if ((av as number) > (bv as number)) return 1; return 0; }), count: ((((payloadObj?.data ?? []) as readonly EntityRow[]).filter(((item: EntityRow) => ((("stage" as string).split('.').reduce((o: any, k: string) => o?.[k], item)) === "todo"))) ?? []) as { readonly length: number }).length }, { label: "In Progress", icon: "circle-dot", variant: "primary", key: "doing", items: [...(((payloadObj?.data ?? []) as readonly EntityRow[]).filter(((item: EntityRow) => ((("stage" as string).split('.').reduce((o: any, k: string) => o?.[k], item)) === "doing"))))].sort((a: EntityRow, b: EntityRow) => { const av = (a as EntityRow)?.["position"], bv = (b as EntityRow)?.["position"]; if ((av as number) < (bv as number)) return -1; if ((av as number) > (bv as number)) return 1; return 0; }), count: ((((payloadObj?.data ?? []) as readonly EntityRow[]).filter(((item: EntityRow) => ((("stage" as string).split('.').reduce((o: any, k: string) => o?.[k], item)) === "doing"))) ?? []) as { readonly length: number }).length }, { key: "done", count: ((((payloadObj?.data ?? []) as readonly EntityRow[]).filter(((item: EntityRow) => ((("stage" as string).split('.').reduce((o: any, k: string) => o?.[k], item)) === "done"))) ?? []) as { readonly length: number }).length, variant: "success", items: [...(((payloadObj?.data ?? []) as readonly EntityRow[]).filter(((item: EntityRow) => ((("stage" as string).split('.').reduce((o: any, k: string) => o?.[k], item)) === "done"))))].sort((a: EntityRow, b: EntityRow) => { const av = (a as EntityRow)?.["position"], bv = (b as EntityRow)?.["position"]; if ((av as number) < (bv as number)) return -1; if ((av as number) > (bv as number)) return 1; return 0; }), icon: "check-circle", label: "Done" }];
        fields = { ...(fields ?? {}), 'boards': _fields['boards'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'BoardItemsLoadFailed') {
      // loading → error (on BoardItemsLoadFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'BoardItemsSaveFailed') {
      // loading → error (on BoardItemsSaveFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'viewing_board' && event === 'OPEN_CARD') {
      // viewing_board → viewing_card (on OPEN_CARD)
        _fields['currentId'] = (payloadObj?.row as EventPayload | undefined)?.id;
        fields = { ...(fields ?? {}), 'currentId': _fields['currentId'] } as typeof fields;
        _fields['currentTitle'] = (payloadObj?.row as EventPayload | undefined)?.title;
        fields = { ...(fields ?? {}), 'currentTitle': _fields['currentTitle'] } as typeof fields;
        _fields['currentDescription'] = (payloadObj?.row as EventPayload | undefined)?.description;
        fields = { ...(fields ?? {}), 'currentDescription': _fields['currentDescription'] } as typeof fields;
        _fields['currentStage'] = (payloadObj?.row as EventPayload | undefined)?.stage;
        fields = { ...(fields ?? {}), 'currentStage': _fields['currentStage'] } as typeof fields;
        _fields['currentNotes'] = (payloadObj?.row as EventPayload | undefined)?.notes;
        fields = { ...(fields ?? {}), 'currentNotes': _fields['currentNotes'] } as typeof fields;
    } else if (fromState === 'viewing_board' && event === 'ADD_CARD') {
      // viewing_board → adding (on ADD_CARD)
        _fields['currentId'] = "";
        fields = { ...(fields ?? {}), 'currentId': _fields['currentId'] } as typeof fields;
        _fields['currentTitle'] = "";
        fields = { ...(fields ?? {}), 'currentTitle': _fields['currentTitle'] } as typeof fields;
        _fields['currentDescription'] = "";
        fields = { ...(fields ?? {}), 'currentDescription': _fields['currentDescription'] } as typeof fields;
        _fields['currentStage'] = "";
        fields = { ...(fields ?? {}), 'currentStage': _fields['currentStage'] } as typeof fields;
        _fields['currentNotes'] = "";
        fields = { ...(fields ?? {}), 'currentNotes': _fields['currentNotes'] } as typeof fields;
    } else if (fromState === 'viewing_board' && event === 'BoardItemsLoaded') {
      // viewing_board → viewing_board (on BoardItemsLoaded)
        _fields['boards'] = [{ icon: "circle", key: "todo", items: [...(((payloadObj?.data ?? []) as readonly EntityRow[]).filter(((item: EntityRow) => ((("stage" as string).split('.').reduce((o: any, k: string) => o?.[k], item)) === "todo"))))].sort((a: EntityRow, b: EntityRow) => { const av = (a as EntityRow)?.["position"], bv = (b as EntityRow)?.["position"]; if ((av as number) < (bv as number)) return -1; if ((av as number) > (bv as number)) return 1; return 0; }), count: ((((payloadObj?.data ?? []) as readonly EntityRow[]).filter(((item: EntityRow) => ((("stage" as string).split('.').reduce((o: any, k: string) => o?.[k], item)) === "todo"))) ?? []) as { readonly length: number }).length, variant: "default", label: "To Do" }, { items: [...(((payloadObj?.data ?? []) as readonly EntityRow[]).filter(((item: EntityRow) => ((("stage" as string).split('.').reduce((o: any, k: string) => o?.[k], item)) === "doing"))))].sort((a: EntityRow, b: EntityRow) => { const av = (a as EntityRow)?.["position"], bv = (b as EntityRow)?.["position"]; if ((av as number) < (bv as number)) return -1; if ((av as number) > (bv as number)) return 1; return 0; }), count: ((((payloadObj?.data ?? []) as readonly EntityRow[]).filter(((item: EntityRow) => ((("stage" as string).split('.').reduce((o: any, k: string) => o?.[k], item)) === "doing"))) ?? []) as { readonly length: number }).length, key: "doing", variant: "primary", icon: "circle-dot", label: "In Progress" }, { icon: "check-circle", key: "done", count: ((((payloadObj?.data ?? []) as readonly EntityRow[]).filter(((item: EntityRow) => ((("stage" as string).split('.').reduce((o: any, k: string) => o?.[k], item)) === "done"))) ?? []) as { readonly length: number }).length, variant: "success", label: "Done", items: [...(((payloadObj?.data ?? []) as readonly EntityRow[]).filter(((item: EntityRow) => ((("stage" as string).split('.').reduce((o: any, k: string) => o?.[k], item)) === "done"))))].sort((a: EntityRow, b: EntityRow) => { const av = (a as EntityRow)?.["position"], bv = (b as EntityRow)?.["position"]; if ((av as number) < (bv as number)) return -1; if ((av as number) > (bv as number)) return 1; return 0; }) }];
        fields = { ...(fields ?? {}), 'boards': _fields['boards'] } as typeof fields;
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
      case 'adding':
        return (['CANCEL_ADD', 'SAVE_CARD'] as const).includes(event as never);
      case 'error':
        return (['INIT'] as const).includes(event as never);
      case 'loading':
        return (['BoardItemsLoadFailed', 'BoardItemsLoaded', 'BoardItemsSaveFailed', 'INIT'] as const).includes(event as never);
      case 'viewing_board':
        return (['ADD_CARD', 'OPEN_CARD'] as const).includes(event as never);
      case 'viewing_card':
        return (['CLOSE_CARD', 'DELETE_CARD', 'MOVE_CARD'] as const).includes(event as never);
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
          event: event as BoardItemBoardEvent,
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
  const actions: { [K in keyof BoardItemBoardEventPayloadMap]: (payload?: BoardItemBoardEventPayloadMap[K]) => Promise<EventResponse> } = {
    'INIT': () => dispatch('INIT'),
    'BoardItemsLoaded': (payload?: BoardItemBoardEventPayloadMap['BoardItemsLoaded']) => dispatch('BoardItemsLoaded', payload),
    'BoardItemsLoadFailed': (payload?: BoardItemBoardEventPayloadMap['BoardItemsLoadFailed']) => dispatch('BoardItemsLoadFailed', payload),
    'BoardItemsSaveFailed': (payload?: BoardItemBoardEventPayloadMap['BoardItemsSaveFailed']) => dispatch('BoardItemsSaveFailed', payload),
    'OPEN_CARD': (payload?: BoardItemBoardEventPayloadMap['OPEN_CARD']) => dispatch('OPEN_CARD', payload),
    'ADD_CARD': () => dispatch('ADD_CARD'),
    'MOVE_CARD': (payload?: BoardItemBoardEventPayloadMap['MOVE_CARD']) => dispatch('MOVE_CARD', payload),
    'REORDER_CARD': (payload?: BoardItemBoardEventPayloadMap['REORDER_CARD']) => dispatch('REORDER_CARD', payload),
    'REORDER_POSITION': (payload?: BoardItemBoardEventPayloadMap['REORDER_POSITION']) => dispatch('REORDER_POSITION', payload),
    'BoardItemsSaved': (payload?: BoardItemBoardEventPayloadMap['BoardItemsSaved']) => dispatch('BoardItemsSaved', payload),
    'CLOSE_CARD': () => dispatch('CLOSE_CARD'),
    'DELETE_CARD': (payload?: BoardItemBoardEventPayloadMap['DELETE_CARD']) => dispatch('DELETE_CARD', payload),
    'SAVE_CARD': (payload?: BoardItemBoardEventPayloadMap['SAVE_CARD']) => dispatch('SAVE_CARD', payload),
    'CANCEL_ADD': () => dispatch('CANCEL_ADD'),
  };

  useUIEvents(enqueueEvent, 'BoardOrbital.BoardItemBoard', ['INIT', 'BoardItemsLoaded', 'BoardItemsLoadFailed', 'BoardItemsSaveFailed', 'OPEN_CARD', 'ADD_CARD', 'MOVE_CARD', 'REORDER_CARD', 'REORDER_POSITION', 'BoardItemsSaved', 'CLOSE_CARD', 'DELETE_CARD', 'SAVE_CARD', 'CANCEL_ADD'] as const, eventBus);

  // Verifier snapshot registration (VG Foundation 1)
  const internalStateRef = useRef(internalState);
  internalStateRef.current = internalState;
  useEffect(() => {
    const unregister = registerTraitSnapshot('BoardItemBoard', (): TraitStateSnapshot => ({
      traitName: 'BoardItemBoard',
      currentState: internalStateRef.current.machineState,
      states: ['loading', 'viewing_board', 'viewing_card', 'adding', 'error'],
      events: ['INIT', 'BoardItemsLoaded', 'BoardItemsLoadFailed', 'BoardItemsSaveFailed', 'OPEN_CARD', 'ADD_CARD', 'MOVE_CARD', 'REORDER_CARD', 'REORDER_POSITION', 'BoardItemsSaved', 'CLOSE_CARD', 'DELETE_CARD', 'SAVE_CARD', 'CANCEL_ADD'],
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
