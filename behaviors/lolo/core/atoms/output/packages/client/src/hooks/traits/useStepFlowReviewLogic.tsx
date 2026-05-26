/**
 * useStepFlowReviewLogic
 *
 * Pure logic hook — state machine, orbital bridge, actions.
 * Use the companion component for rendering.
 *
 * @generated from schema
 * @trait StepFlowReview
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useOrbitalBridge } from '@/hooks/useOrbitalBridge';
import type { EntityRow, EventPayload, EventPayloadValue, FieldValue } from '@almadar/core';
import type { EventResponse, StepFlowView, StepFlowReviewEventPayloadMap } from '@app/shared';
import { useUIEvents } from '@almadar/ui/hooks';
import { registerTraitSnapshot, type TraitStateSnapshot } from '@almadar/ui/lib';
import { useUser } from '@almadar/ui/context';

// ============================================================================
// State Machine
// ============================================================================

export type StepFlowReviewState =
  | 'loading'
  | 'running'
  | 'approved'
  | 'rejected'
  | 'escalated'
  | 'error';

export type StepFlowReviewEvent =
  | 'INIT'
  | 'StepItemsLoaded'
  | 'StepItemsLoadFailed'
  | 'StepItemsSaved'
  | 'StepItemsSaveFailed'
  | 'ADVANCE'
  | 'BACK'
  | 'REJECT'
  | 'ESCALATE'
  | 'RESTART';

interface StepFlowReviewInternalState {
  machineState: StepFlowReviewState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: StepFlowReviewEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<StepFlowView>;
}

type StepFlowReviewAction =
  | { type: 'EVENT_SUCCESS'; event: StepFlowReviewEvent; newState: string; data: Record<string, EntityRow[]>; payload?: EventPayload; fields?: Record<string, EventPayloadValue | undefined>; renderBearing?: boolean }
  | { type: 'EVENT_ERROR'; error: string }
  | { type: 'RESET_ERROR' }
  | { type: 'SET_FIELD'; field: keyof StepFlowView & string; value: EventPayloadValue | undefined }
  | { type: 'TICK'; updates: Partial<EntityRow>; collection: string };

function stepFlowReviewReducer(
  state: StepFlowReviewInternalState,
  action: StepFlowReviewAction
): StepFlowReviewInternalState {
  switch (action.type) {
    case 'EVENT_SUCCESS':
      return {
        machineState: action.newState as StepFlowReviewState,
        data: { ...state.data, ...action.data },
        lastPayload: action.renderBearing ? (action.payload ?? state.lastPayload) : state.lastPayload,
        lastEvent: action.renderBearing ? action.event : state.lastEvent,
        loading: false,
        error: null,
        fields: { ...state.fields, ...(action.fields ?? {}) } as Partial<StepFlowView>,
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
        fields: { ...state.fields, [action.field]: action.value } as Partial<StepFlowView>,
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

const initialState: StepFlowReviewInternalState = {
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

export interface StepFlowReviewConfig {
  linkedEntity?: string;
  entityId?: string;
  cardLook: 'elevated' | 'flat-bordered' | 'borderless-divider' | 'ticket' | 'invoice' | 'chip' | 'tile-image-first';
  steps: { allowedRoles?: string[]; description?: string; icon?: string; key?: string; label: string }[];
  title: string;
}

const DEFAULT_STEP_FLOW_REVIEW_CONFIG = {
  cardLook: "elevated",
  steps: [{ description: "Initial review by direct manager", icon: "user", key: "manager", label: "Manager Review" }, { description: "Department director sign-off", icon: "users", key: "director", label: "Director Approval" }, { description: "Final executive approval", icon: "shield", key: "executive", label: "Executive Sign-off" }],
  title: "Review",
} as StepFlowReviewConfig;

export interface StepFlowReviewLogicReturn {
  state: StepFlowReviewState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: StepFlowReviewEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<StepFlowView>;
  dispatch: (event: string, payload?: EventPayload) => Promise<EventResponse>;
  actions: { [K in keyof StepFlowReviewEventPayloadMap]: (payload?: StepFlowReviewEventPayloadMap[K]) => Promise<EventResponse> };
  config: StepFlowReviewConfig;
}

export function useStepFlowReviewLogic(config?: StepFlowReviewConfig): StepFlowReviewLogicReturn {
  const mergedConfig: StepFlowReviewConfig = { ...DEFAULT_STEP_FLOW_REVIEW_CONFIG, ...(config ?? {}) };

  // Orbital bridge: event bus + server communication
  const { sendEvent, eventBus } = useOrbitalBridge({ basePath: '/api/step-flow-review', orbitalName: 'StepFlowOrbital', traitName: 'StepFlowReview' });

  // Internal state with reducer
  const [internalState, dispatchReducer] = useReducer(stepFlowReviewReducer, initialState);
  const { machineState: state, data, lastPayload, lastEvent, loading, error, fields: _initialFields } = internalState;
  const fields = _initialFields;

  const machineStateRef = useRef(state);
  machineStateRef.current = state;

  // Actor model: sequential event queue (prevents cross-trait race conditions)
  const eventQueueRef = useRef<Array<{ event: string; payload?: EventPayload }>>([]);
  const processingRef = useRef(false);

  const { user } = useUser();

  // Transpiled client-side effects (Phase 4)
  // Each (fromState, event) transition's client effects are compiled to TypeScript.
  const executeTransitionEffects = useCallback((fromState: string, event: string, payload?: EventPayload): Record<string, EventPayloadValue | undefined> => {
    const _fields: Record<string, EventPayloadValue | undefined> = {};
    const payloadObj = payload;
    const entity: EntityRow[] = data['StepFlowView'] ?? [];
    let fields = _initialFields ?? {};


    if (fromState === 'loading' && event === 'StepItemsLoaded') {
      // loading → running (on StepItemsLoaded)
        _fields['id'] = (("id" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)(payloadObj?.data, 0)));
        fields = { ...(fields ?? {}), 'id': _fields['id'] } as typeof fields;
        _fields['currentStepIndex'] = 0;
        fields = { ...(fields ?? {}), 'currentStepIndex': _fields['currentStepIndex'] } as typeof fields;
        _fields['totalSteps'] = ([{ label: "Manager Review", icon: "user", key: "manager", description: "Initial review by direct manager" }, { icon: "users", key: "director", label: "Director Approval", description: "Department director sign-off" }, { label: "Executive Sign-off", icon: "shield", key: "executive", description: "Final executive approval" }]).length;
        fields = { ...(fields ?? {}), 'totalSteps': _fields['totalSteps'] } as typeof fields;
        _fields['wizardSteps'] = [{ title: "Manager Review", id: "manager", description: "Initial review by direct manager" }, { title: "Director Approval", id: "director", description: "Department director sign-off" }, { description: "Final executive approval", id: "executive", title: "Executive Sign-off" }];
        fields = { ...(fields ?? {}), 'wizardSteps': _fields['wizardSteps'] } as typeof fields;
        _fields['currentStepLabel'] = (("label" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ key: "manager", icon: "user", label: "Manager Review", description: "Initial review by direct manager" }, { description: "Department director sign-off", key: "director", icon: "users", label: "Director Approval" }, { key: "executive", icon: "shield", label: "Executive Sign-off", description: "Final executive approval" }], 0)));
        fields = { ...(fields ?? {}), 'currentStepLabel': _fields['currentStepLabel'] } as typeof fields;
        _fields['currentStepDescription'] = (("description" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ icon: "user", description: "Initial review by direct manager", label: "Manager Review", key: "manager" }, { key: "director", description: "Department director sign-off", label: "Director Approval", icon: "users" }, { label: "Executive Sign-off", description: "Final executive approval", key: "executive", icon: "shield" }], 0)) ?? "");
        fields = { ...(fields ?? {}), 'currentStepDescription': _fields['currentStepDescription'] } as typeof fields;
        _fields['currentStepIcon'] = (("icon" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ key: "manager", label: "Manager Review", description: "Initial review by direct manager", icon: "user" }, { description: "Department director sign-off", icon: "users", label: "Director Approval", key: "director" }, { description: "Final executive approval", key: "executive", label: "Executive Sign-off", icon: "shield" }], 0)) ?? "user");
        fields = { ...(fields ?? {}), 'currentStepIcon': _fields['currentStepIcon'] } as typeof fields;
        _fields['isFirstStep'] = true;
        fields = { ...(fields ?? {}), 'isFirstStep': _fields['isFirstStep'] } as typeof fields;
        _fields['isLastStep'] = (([{ key: "manager", label: "Manager Review", icon: "user", description: "Initial review by direct manager" }, { icon: "users", label: "Director Approval", key: "director", description: "Department director sign-off" }, { label: "Executive Sign-off", key: "executive", description: "Final executive approval", icon: "shield" }]).length === 1);
        fields = { ...(fields ?? {}), 'isLastStep': _fields['isLastStep'] } as typeof fields;
        _fields['primaryActionLabel'] = ((([{ icon: "user", label: "Manager Review", key: "manager", description: "Initial review by direct manager" }, { description: "Department director sign-off", label: "Director Approval", icon: "users", key: "director" }, { description: "Final executive approval", key: "executive", icon: "shield", label: "Executive Sign-off" }]).length === 1) ? "Finalize Approval" : "Approve & Continue");
        fields = { ...(fields ?? {}), 'primaryActionLabel': _fields['primaryActionLabel'] } as typeof fields;
        _fields['primaryActionVariant'] = ((([{ description: "Initial review by direct manager", label: "Manager Review", key: "manager", icon: "user" }, { description: "Department director sign-off", key: "director", label: "Director Approval", icon: "users" }, { key: "executive", label: "Executive Sign-off", description: "Final executive approval", icon: "shield" }]).length === 1) ? "success" : "primary");
        fields = { ...(fields ?? {}), 'primaryActionVariant': _fields['primaryActionVariant'] } as typeof fields;
        _fields['primaryActionIcon'] = ((([{ key: "manager", description: "Initial review by direct manager", icon: "user", label: "Manager Review" }, { label: "Director Approval", icon: "users", description: "Department director sign-off", key: "director" }, { key: "executive", icon: "shield", description: "Final executive approval", label: "Executive Sign-off" }]).length === 1) ? "check-circle" : "chevron-right");
        fields = { ...(fields ?? {}), 'primaryActionIcon': _fields['primaryActionIcon'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'StepItemsLoadFailed') {
      // loading → error (on StepItemsLoadFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'StepItemsSaveFailed') {
      // loading → error (on StepItemsSaveFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'running' && event === 'ADVANCE' && ((!fields?.isLastStep && (((((("allowedRoles" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ label: "Manager Review", description: "Initial review by direct manager", icon: "user", key: "manager" }, { icon: "users", label: "Director Approval", key: "director", description: "Department director sign-off" }, { description: "Final executive approval", key: "executive", label: "Executive Sign-off", icon: "shield" }], fields?.currentStepIndex)) ?? []) ?? []) as { readonly length: number }).length === 0) || (((("allowedRoles" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ icon: "user", description: "Initial review by direct manager", label: "Manager Review", key: "manager" }, { description: "Department director sign-off", icon: "users", label: "Director Approval", key: "director" }, { label: "Executive Sign-off", description: "Final executive approval", key: "executive", icon: "shield" }], fields?.currentStepIndex)) ?? []) ?? []) as readonly EventPayloadValue[]).includes(user?.role as EventPayloadValue))))) {
      // running → running (on ADVANCE)
        _fields['currentStepIndex'] = (+(fields?.currentStepIndex ?? 0) + 1);
        fields = { ...(fields ?? {}), 'currentStepIndex': _fields['currentStepIndex'] } as typeof fields;
        _fields['currentStepLabel'] = (("label" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ icon: "user", label: "Manager Review", description: "Initial review by direct manager", key: "manager" }, { label: "Director Approval", icon: "users", key: "director", description: "Department director sign-off" }, { icon: "shield", key: "executive", label: "Executive Sign-off", description: "Final executive approval" }], fields?.currentStepIndex)));
        fields = { ...(fields ?? {}), 'currentStepLabel': _fields['currentStepLabel'] } as typeof fields;
        _fields['currentStepDescription'] = (("description" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ label: "Manager Review", description: "Initial review by direct manager", key: "manager", icon: "user" }, { key: "director", description: "Department director sign-off", label: "Director Approval", icon: "users" }, { icon: "shield", key: "executive", description: "Final executive approval", label: "Executive Sign-off" }], fields?.currentStepIndex)) ?? "");
        fields = { ...(fields ?? {}), 'currentStepDescription': _fields['currentStepDescription'] } as typeof fields;
        _fields['currentStepIcon'] = (("icon" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ icon: "user", description: "Initial review by direct manager", label: "Manager Review", key: "manager" }, { label: "Director Approval", icon: "users", description: "Department director sign-off", key: "director" }, { key: "executive", icon: "shield", description: "Final executive approval", label: "Executive Sign-off" }], fields?.currentStepIndex)) ?? "user");
        fields = { ...(fields ?? {}), 'currentStepIcon': _fields['currentStepIcon'] } as typeof fields;
        _fields['isFirstStep'] = (fields?.currentStepIndex === 0);
        fields = { ...(fields ?? {}), 'isFirstStep': _fields['isFirstStep'] } as typeof fields;
        _fields['isLastStep'] = (fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1));
        fields = { ...(fields ?? {}), 'isLastStep': _fields['isLastStep'] } as typeof fields;
        _fields['primaryActionLabel'] = ((fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1)) ? "Finalize Approval" : "Approve & Continue");
        fields = { ...(fields ?? {}), 'primaryActionLabel': _fields['primaryActionLabel'] } as typeof fields;
        _fields['primaryActionVariant'] = ((fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1)) ? "success" : "primary");
        fields = { ...(fields ?? {}), 'primaryActionVariant': _fields['primaryActionVariant'] } as typeof fields;
        _fields['primaryActionIcon'] = ((fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1)) ? "check-circle" : "chevron-right");
        fields = { ...(fields ?? {}), 'primaryActionIcon': _fields['primaryActionIcon'] } as typeof fields;
    } else if (fromState === 'running' && event === 'ADVANCE' && ((fields?.isLastStep && (((((("allowedRoles" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ description: "Initial review by direct manager", key: "manager", icon: "user", label: "Manager Review" }, { key: "director", icon: "users", label: "Director Approval", description: "Department director sign-off" }, { icon: "shield", description: "Final executive approval", label: "Executive Sign-off", key: "executive" }], fields?.currentStepIndex)) ?? []) ?? []) as { readonly length: number }).length === 0) || (((("allowedRoles" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ label: "Manager Review", key: "manager", icon: "user", description: "Initial review by direct manager" }, { description: "Department director sign-off", key: "director", label: "Director Approval", icon: "users" }, { key: "executive", label: "Executive Sign-off", icon: "shield", description: "Final executive approval" }], fields?.currentStepIndex)) ?? []) ?? []) as readonly EventPayloadValue[]).includes(user?.role as EventPayloadValue))))) {
      // running → approved (on ADVANCE)
        _fields['finalStatus'] = "approved";
        fields = { ...(fields ?? {}), 'finalStatus': _fields['finalStatus'] } as typeof fields;
    } else if (fromState === 'running' && event === 'BACK') {
      // running → running (on BACK)
        _fields['currentStepIndex'] = (+(fields?.currentStepIndex ?? 0) - 1);
        fields = { ...(fields ?? {}), 'currentStepIndex': _fields['currentStepIndex'] } as typeof fields;
        _fields['currentStepLabel'] = (("label" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ icon: "user", key: "manager", description: "Initial review by direct manager", label: "Manager Review" }, { label: "Director Approval", icon: "users", description: "Department director sign-off", key: "director" }, { description: "Final executive approval", key: "executive", icon: "shield", label: "Executive Sign-off" }], fields?.currentStepIndex)));
        fields = { ...(fields ?? {}), 'currentStepLabel': _fields['currentStepLabel'] } as typeof fields;
        _fields['currentStepDescription'] = (("description" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ icon: "user", key: "manager", label: "Manager Review", description: "Initial review by direct manager" }, { label: "Director Approval", icon: "users", key: "director", description: "Department director sign-off" }, { description: "Final executive approval", key: "executive", label: "Executive Sign-off", icon: "shield" }], fields?.currentStepIndex)) ?? "");
        fields = { ...(fields ?? {}), 'currentStepDescription': _fields['currentStepDescription'] } as typeof fields;
        _fields['currentStepIcon'] = (("icon" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ icon: "user", key: "manager", description: "Initial review by direct manager", label: "Manager Review" }, { icon: "users", description: "Department director sign-off", key: "director", label: "Director Approval" }, { description: "Final executive approval", key: "executive", label: "Executive Sign-off", icon: "shield" }], fields?.currentStepIndex)) ?? "user");
        fields = { ...(fields ?? {}), 'currentStepIcon': _fields['currentStepIcon'] } as typeof fields;
        _fields['isFirstStep'] = (fields?.currentStepIndex === 0);
        fields = { ...(fields ?? {}), 'isFirstStep': _fields['isFirstStep'] } as typeof fields;
        _fields['isLastStep'] = (fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1));
        fields = { ...(fields ?? {}), 'isLastStep': _fields['isLastStep'] } as typeof fields;
        _fields['primaryActionLabel'] = ((fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1)) ? "Finalize Approval" : "Approve & Continue");
        fields = { ...(fields ?? {}), 'primaryActionLabel': _fields['primaryActionLabel'] } as typeof fields;
        _fields['primaryActionVariant'] = ((fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1)) ? "success" : "primary");
        fields = { ...(fields ?? {}), 'primaryActionVariant': _fields['primaryActionVariant'] } as typeof fields;
        _fields['primaryActionIcon'] = ((fields?.currentStepIndex === (+(fields?.totalSteps ?? 0) - 1)) ? "check-circle" : "chevron-right");
        fields = { ...(fields ?? {}), 'primaryActionIcon': _fields['primaryActionIcon'] } as typeof fields;
    } else if (fromState === 'running' && event === 'REJECT') {
      // running → rejected (on REJECT)
        _fields['finalStatus'] = "rejected";
        fields = { ...(fields ?? {}), 'finalStatus': _fields['finalStatus'] } as typeof fields;
        _fields['rejectionReason'] = payloadObj?.reason;
        fields = { ...(fields ?? {}), 'rejectionReason': _fields['rejectionReason'] } as typeof fields;
    } else if (fromState === 'running' && event === 'ESCALATE') {
      // running → escalated (on ESCALATE)
        _fields['finalStatus'] = "escalated";
        fields = { ...(fields ?? {}), 'finalStatus': _fields['finalStatus'] } as typeof fields;
    } else if (fromState === 'approved' && event === 'RESTART') {
      // approved → loading (on RESTART)
        _fields['finalStatus'] = "";
        fields = { ...(fields ?? {}), 'finalStatus': _fields['finalStatus'] } as typeof fields;
        _fields['currentStepIndex'] = 0;
        fields = { ...(fields ?? {}), 'currentStepIndex': _fields['currentStepIndex'] } as typeof fields;
    } else if (fromState === 'rejected' && event === 'RESTART') {
      // rejected → loading (on RESTART)
        _fields['finalStatus'] = "";
        fields = { ...(fields ?? {}), 'finalStatus': _fields['finalStatus'] } as typeof fields;
        _fields['currentStepIndex'] = 0;
        fields = { ...(fields ?? {}), 'currentStepIndex': _fields['currentStepIndex'] } as typeof fields;
        _fields['rejectionReason'] = "";
        fields = { ...(fields ?? {}), 'rejectionReason': _fields['rejectionReason'] } as typeof fields;
    } else if (fromState === 'escalated' && event === 'RESTART') {
      // escalated → loading (on RESTART)
        _fields['finalStatus'] = "";
        fields = { ...(fields ?? {}), 'finalStatus': _fields['finalStatus'] } as typeof fields;
        _fields['currentStepIndex'] = 0;
        fields = { ...(fields ?? {}), 'currentStepIndex': _fields['currentStepIndex'] } as typeof fields;
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
      case 'approved':
        return (['RESTART'] as const).includes(event as never);
      case 'error':
        return (['INIT'] as const).includes(event as never);
      case 'escalated':
        return (['RESTART'] as const).includes(event as never);
      case 'loading':
        return (['INIT', 'StepItemsLoadFailed', 'StepItemsLoaded', 'StepItemsSaveFailed'] as const).includes(event as never);
      case 'rejected':
        return (['RESTART'] as const).includes(event as never);
      case 'running':
        return (['ADVANCE', 'BACK', 'ESCALATE', 'REJECT'] as const).includes(event as never);
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
          event: event as StepFlowReviewEvent,
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
  const actions: { [K in keyof StepFlowReviewEventPayloadMap]: (payload?: StepFlowReviewEventPayloadMap[K]) => Promise<EventResponse> } = {
    'INIT': () => dispatch('INIT'),
    'StepItemsLoaded': (payload?: StepFlowReviewEventPayloadMap['StepItemsLoaded']) => dispatch('StepItemsLoaded', payload),
    'StepItemsLoadFailed': (payload?: StepFlowReviewEventPayloadMap['StepItemsLoadFailed']) => dispatch('StepItemsLoadFailed', payload),
    'StepItemsSaved': (payload?: StepFlowReviewEventPayloadMap['StepItemsSaved']) => dispatch('StepItemsSaved', payload),
    'StepItemsSaveFailed': (payload?: StepFlowReviewEventPayloadMap['StepItemsSaveFailed']) => dispatch('StepItemsSaveFailed', payload),
    'ADVANCE': (payload?: StepFlowReviewEventPayloadMap['ADVANCE']) => dispatch('ADVANCE', payload),
    'BACK': (payload?: StepFlowReviewEventPayloadMap['BACK']) => dispatch('BACK', payload),
    'REJECT': (payload?: StepFlowReviewEventPayloadMap['REJECT']) => dispatch('REJECT', payload),
    'ESCALATE': (payload?: StepFlowReviewEventPayloadMap['ESCALATE']) => dispatch('ESCALATE', payload),
    'RESTART': (payload?: StepFlowReviewEventPayloadMap['RESTART']) => dispatch('RESTART', payload),
  };

  useUIEvents(enqueueEvent, 'StepFlowOrbital.StepFlowReview', ['INIT', 'StepItemsLoaded', 'StepItemsLoadFailed', 'StepItemsSaved', 'StepItemsSaveFailed', 'ADVANCE', 'BACK', 'REJECT', 'ESCALATE', 'RESTART'] as const, eventBus);

  // Verifier snapshot registration (VG Foundation 1)
  const internalStateRef = useRef(internalState);
  internalStateRef.current = internalState;
  useEffect(() => {
    const unregister = registerTraitSnapshot('StepFlowReview', (): TraitStateSnapshot => ({
      traitName: 'StepFlowReview',
      currentState: internalStateRef.current.machineState,
      states: ['loading', 'running', 'approved', 'rejected', 'escalated', 'error'],
      events: ['INIT', 'StepItemsLoaded', 'StepItemsLoadFailed', 'StepItemsSaved', 'StepItemsSaveFailed', 'ADVANCE', 'BACK', 'REJECT', 'ESCALATE', 'RESTART'],
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
