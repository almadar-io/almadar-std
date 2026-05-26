/**
 * useMultiPartyTransactionLogic
 *
 * Pure logic hook — state machine, orbital bridge, actions.
 * Use the companion component for rendering.
 *
 * @generated from schema
 * @trait MultiPartyTransaction
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useOrbitalBridge } from '@/hooks/useOrbitalBridge';
import type { EntityRow, EventPayload, EventPayloadValue, FieldValue } from '@almadar/core';
import type { EventResponse, MultiPartyView, MultiPartyTransactionEventPayloadMap } from '@app/shared';
import { useUIEvents } from '@almadar/ui/hooks';
import { registerTraitSnapshot, type TraitStateSnapshot } from '@almadar/ui/lib';

// ============================================================================
// State Machine
// ============================================================================

export type MultiPartyTransactionState =
  | 'loading'
  | 'awaiting'
  | 'capturing_dispute'
  | 'capturing_cancel'
  | 'funded'
  | 'released'
  | 'disputed'
  | 'cancelled'
  | 'error';

export type MultiPartyTransactionEvent =
  | 'INIT'
  | 'FlowLoaded'
  | 'FlowLoadFailed'
  | 'FlowSaved'
  | 'FlowSaveFailed'
  | 'PARTY_CONFIRM'
  | 'OPEN_DISPUTE'
  | 'CANCEL_TRANSACTION'
  | 'SUBMIT_DISPUTE'
  | 'CANCEL_REASON'
  | 'SUBMIT_CANCEL'
  | 'RELEASE'
  | 'RESTART';

interface MultiPartyTransactionInternalState {
  machineState: MultiPartyTransactionState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: MultiPartyTransactionEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<MultiPartyView>;
}

type MultiPartyTransactionAction =
  | { type: 'EVENT_SUCCESS'; event: MultiPartyTransactionEvent; newState: string; data: Record<string, EntityRow[]>; payload?: EventPayload; fields?: Record<string, EventPayloadValue | undefined>; renderBearing?: boolean }
  | { type: 'EVENT_ERROR'; error: string }
  | { type: 'RESET_ERROR' }
  | { type: 'SET_FIELD'; field: keyof MultiPartyView & string; value: EventPayloadValue | undefined }
  | { type: 'TICK'; updates: Partial<EntityRow>; collection: string };

function multiPartyTransactionReducer(
  state: MultiPartyTransactionInternalState,
  action: MultiPartyTransactionAction
): MultiPartyTransactionInternalState {
  switch (action.type) {
    case 'EVENT_SUCCESS':
      return {
        machineState: action.newState as MultiPartyTransactionState,
        data: { ...state.data, ...action.data },
        lastPayload: action.renderBearing ? (action.payload ?? state.lastPayload) : state.lastPayload,
        lastEvent: action.renderBearing ? action.event : state.lastEvent,
        loading: false,
        error: null,
        fields: { ...state.fields, ...(action.fields ?? {}) } as Partial<MultiPartyView>,
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
        fields: { ...state.fields, [action.field]: action.value } as Partial<MultiPartyView>,
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

const initialState: MultiPartyTransactionInternalState = {
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

export interface MultiPartyTransactionConfig {
  linkedEntity?: string;
  entityId?: string;
  cancelIcon: string;
  cancelLabel: string;
  cardLook: 'elevated' | 'flat-bordered' | 'borderless-divider' | 'ticket' | 'invoice' | 'chip' | 'tile-image-first';
  disputeIcon: string;
  disputeLabel: string;
  parties: { actionDescription?: string; actionIcon?: string; actionLabel?: string; actor?: string; description?: string; icon?: string; id?: string; key?: string; label?: string; name?: string; role?: string; stepLabel?: string; title?: string }[];
  reasonFields: string[];
  releaseIcon: string;
  releaseLabel: string;
  title: string;
  transactionAmount: string;
  transactionReference: string;
  transactionSubject: string;
}

const DEFAULT_MULTI_PARTY_TRANSACTION_CONFIG = {
  cancelIcon: "x",
  cancelLabel: "Cancel transaction",
  cardLook: "elevated",
  disputeIcon: "alert-triangle",
  disputeLabel: "Open dispute",
  parties: [{ actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", actionIcon: "credit-card", actionLabel: "Confirm payment", actor: "Alice Chen", description: "Funds the transaction and confirms receipt of the vehicle.", icon: "user", id: "buyer", stepLabel: "Step 1 of 2", title: "Buyer" }, { actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", actionIcon: "package", actionLabel: "Confirm shipment", actor: "Bob's Auto Sales LLC", description: "Ships the vehicle and uploads delivery proof.", icon: "user-check", id: "seller", stepLabel: "Step 2 of 2", title: "Seller" }],
  reasonFields: ["reason"],
  releaseIcon: "unlock",
  releaseLabel: "Release funds",
  title: "Escrow transaction",
  transactionAmount: "$28,500",
  transactionReference: "TXN-A8B2C-2024-001",
  transactionSubject: "Sale of 2024 Honda CR-V",
} as MultiPartyTransactionConfig;

export interface MultiPartyTransactionLogicReturn {
  state: MultiPartyTransactionState;
  data: Record<string, EntityRow[]>;
  lastPayload: EventPayload | undefined;
  lastEvent: MultiPartyTransactionEvent | null;
  loading: boolean;
  error: string | null;
  fields: Partial<MultiPartyView>;
  dispatch: (event: string, payload?: EventPayload) => Promise<EventResponse>;
  actions: { [K in keyof MultiPartyTransactionEventPayloadMap]: (payload?: MultiPartyTransactionEventPayloadMap[K]) => Promise<EventResponse> };
  config: MultiPartyTransactionConfig;
}

export function useMultiPartyTransactionLogic(config?: MultiPartyTransactionConfig): MultiPartyTransactionLogicReturn {
  const mergedConfig: MultiPartyTransactionConfig = { ...DEFAULT_MULTI_PARTY_TRANSACTION_CONFIG, ...(config ?? {}) };

  // Orbital bridge: event bus + server communication
  const { sendEvent, eventBus } = useOrbitalBridge({ basePath: '/api/multi-party-transaction', orbitalName: 'MultiPartyFlowOrbital', traitName: 'MultiPartyTransaction' });

  // Internal state with reducer
  const [internalState, dispatchReducer] = useReducer(multiPartyTransactionReducer, initialState);
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
    const entity: EntityRow[] = data['MultiPartyView'] ?? [];
    let fields = _initialFields ?? {};


    if (fromState === 'loading' && event === 'FlowLoaded') {
      // loading → awaiting (on FlowLoaded)
        _fields['currentPartyIndex'] = 0;
        fields = { ...(fields ?? {}), 'currentPartyIndex': _fields['currentPartyIndex'] } as typeof fields;
        _fields['totalParties'] = ([{ actionLabel: "Confirm payment", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", actionIcon: "credit-card", stepLabel: "Step 1 of 2", actor: "Alice Chen", id: "buyer", description: "Funds the transaction and confirms receipt of the vehicle.", title: "Buyer", icon: "user" }, { description: "Ships the vehicle and uploads delivery proof.", actor: "Bob\'s Auto Sales LLC", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", actionIcon: "package", stepLabel: "Step 2 of 2", id: "seller", title: "Seller", actionLabel: "Confirm shipment", icon: "user-check" }]).length;
        fields = { ...(fields ?? {}), 'totalParties': _fields['totalParties'] } as typeof fields;
        _fields['parties'] = [{ icon: "user", title: "Buyer", actionIcon: "credit-card", actor: "Alice Chen", id: "buyer", description: "Funds the transaction and confirms receipt of the vehicle.", actionLabel: "Confirm payment" }, { id: "seller", actionIcon: "package", icon: "user-check", actor: "Bob\'s Auto Sales LLC", actionLabel: "Confirm shipment", title: "Seller", description: "Ships the vehicle and uploads delivery proof." }];
        fields = { ...(fields ?? {}), 'parties': _fields['parties'] } as typeof fields;
        _fields['currentPartyId'] = (("id" as string).split('.').reduce((o: any, k: string) => o?.[k], (([{ description: "Funds the transaction and confirms receipt of the vehicle.", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", actor: "Alice Chen", title: "Buyer", id: "buyer", stepLabel: "Step 1 of 2", icon: "user", actionLabel: "Confirm payment", actionIcon: "credit-card" }, { description: "Ships the vehicle and uploads delivery proof.", actor: "Bob\'s Auto Sales LLC", icon: "user-check", stepLabel: "Step 2 of 2", actionLabel: "Confirm shipment", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", title: "Seller", id: "seller", actionIcon: "package" }]) as readonly EventPayloadValue[])[0]) ?? "");
        fields = { ...(fields ?? {}), 'currentPartyId': _fields['currentPartyId'] } as typeof fields;
        _fields['currentPartyTitle'] = (("title" as string).split('.').reduce((o: any, k: string) => o?.[k], (([{ description: "Funds the transaction and confirms receipt of the vehicle.", title: "Buyer", actionIcon: "credit-card", stepLabel: "Step 1 of 2", id: "buyer", icon: "user", actionLabel: "Confirm payment", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", actor: "Alice Chen" }, { actionLabel: "Confirm shipment", description: "Ships the vehicle and uploads delivery proof.", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", icon: "user-check", stepLabel: "Step 2 of 2", actor: "Bob\'s Auto Sales LLC", id: "seller", actionIcon: "package", title: "Seller" }]) as readonly EventPayloadValue[])[0]) ?? "");
        fields = { ...(fields ?? {}), 'currentPartyTitle': _fields['currentPartyTitle'] } as typeof fields;
        _fields['currentPartyActor'] = (("actor" as string).split('.').reduce((o: any, k: string) => o?.[k], (([{ title: "Buyer", actionIcon: "credit-card", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", id: "buyer", icon: "user", actor: "Alice Chen", stepLabel: "Step 1 of 2", actionLabel: "Confirm payment", description: "Funds the transaction and confirms receipt of the vehicle." }, { icon: "user-check", description: "Ships the vehicle and uploads delivery proof.", stepLabel: "Step 2 of 2", actionIcon: "package", title: "Seller", actor: "Bob\'s Auto Sales LLC", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", id: "seller", actionLabel: "Confirm shipment" }]) as readonly EventPayloadValue[])[0]) ?? "");
        fields = { ...(fields ?? {}), 'currentPartyActor': _fields['currentPartyActor'] } as typeof fields;
        _fields['currentPartyIcon'] = (("icon" as string).split('.').reduce((o: any, k: string) => o?.[k], (([{ actor: "Alice Chen", actionIcon: "credit-card", id: "buyer", icon: "user", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", description: "Funds the transaction and confirms receipt of the vehicle.", title: "Buyer", stepLabel: "Step 1 of 2", actionLabel: "Confirm payment" }, { actionLabel: "Confirm shipment", actionIcon: "package", title: "Seller", description: "Ships the vehicle and uploads delivery proof.", stepLabel: "Step 2 of 2", icon: "user-check", actor: "Bob\'s Auto Sales LLC", id: "seller", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt." }]) as readonly EventPayloadValue[])[0]) ?? "user");
        fields = { ...(fields ?? {}), 'currentPartyIcon': _fields['currentPartyIcon'] } as typeof fields;
        _fields['currentActionLabel'] = (("actionLabel" as string).split('.').reduce((o: any, k: string) => o?.[k], (([{ stepLabel: "Step 1 of 2", actor: "Alice Chen", actionIcon: "credit-card", icon: "user", actionLabel: "Confirm payment", id: "buyer", description: "Funds the transaction and confirms receipt of the vehicle.", title: "Buyer", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed." }, { actionIcon: "package", actionLabel: "Confirm shipment", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", id: "seller", title: "Seller", icon: "user-check", stepLabel: "Step 2 of 2", description: "Ships the vehicle and uploads delivery proof.", actor: "Bob\'s Auto Sales LLC" }]) as readonly EventPayloadValue[])[0]) ?? "Confirm");
        fields = { ...(fields ?? {}), 'currentActionLabel': _fields['currentActionLabel'] } as typeof fields;
        _fields['currentActionIcon'] = (("actionIcon" as string).split('.').reduce((o: any, k: string) => o?.[k], (([{ actionLabel: "Confirm payment", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", icon: "user", id: "buyer", actor: "Alice Chen", title: "Buyer", stepLabel: "Step 1 of 2", description: "Funds the transaction and confirms receipt of the vehicle.", actionIcon: "credit-card" }, { icon: "user-check", actor: "Bob\'s Auto Sales LLC", actionLabel: "Confirm shipment", stepLabel: "Step 2 of 2", description: "Ships the vehicle and uploads delivery proof.", actionIcon: "package", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", title: "Seller", id: "seller" }]) as readonly EventPayloadValue[])[0]) ?? "check");
        fields = { ...(fields ?? {}), 'currentActionIcon': _fields['currentActionIcon'] } as typeof fields;
        _fields['currentActionDescription'] = (("actionDescription" as string).split('.').reduce((o: any, k: string) => o?.[k], (([{ stepLabel: "Step 1 of 2", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", title: "Buyer", description: "Funds the transaction and confirms receipt of the vehicle.", actor: "Alice Chen", actionIcon: "credit-card", icon: "user", id: "buyer", actionLabel: "Confirm payment" }, { actionIcon: "package", stepLabel: "Step 2 of 2", description: "Ships the vehicle and uploads delivery proof.", title: "Seller", icon: "user-check", actionLabel: "Confirm shipment", actor: "Bob\'s Auto Sales LLC", id: "seller", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt." }]) as readonly EventPayloadValue[])[0]) ?? "");
        fields = { ...(fields ?? {}), 'currentActionDescription': _fields['currentActionDescription'] } as typeof fields;
        _fields['currentStepLabel'] = (("stepLabel" as string).split('.').reduce((o: any, k: string) => o?.[k], (([{ id: "buyer", actionLabel: "Confirm payment", title: "Buyer", description: "Funds the transaction and confirms receipt of the vehicle.", icon: "user", actionIcon: "credit-card", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", actor: "Alice Chen", stepLabel: "Step 1 of 2" }, { icon: "user-check", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", title: "Seller", id: "seller", actionIcon: "package", description: "Ships the vehicle and uploads delivery proof.", actionLabel: "Confirm shipment", stepLabel: "Step 2 of 2", actor: "Bob\'s Auto Sales LLC" }]) as readonly EventPayloadValue[])[0]) ?? "Step 1");
        fields = { ...(fields ?? {}), 'currentStepLabel': _fields['currentStepLabel'] } as typeof fields;
        _fields['audit'] = [{ title: "Transaction opened", status: "complete", description: ["Reference ", "TXN-A8B2C-2024-001"].join(''), timestamp: "Just now", id: "init" }];
        fields = { ...(fields ?? {}), 'audit': _fields['audit'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'FlowLoadFailed') {
      // loading → error (on FlowLoadFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'loading' && event === 'FlowSaveFailed') {
      // loading → error (on FlowSaveFailed)
        _fields['errorMessage'] = payloadObj?.error;
        fields = { ...(fields ?? {}), 'errorMessage': _fields['errorMessage'] } as typeof fields;
    } else if (fromState === 'awaiting' && event === 'PARTY_CONFIRM' && (!((+(fields?.currentPartyIndex ?? 0) + 1) === fields?.totalParties))) {
      // awaiting → awaiting (on PARTY_CONFIRM)
        _fields['audit'] = [...(fields?.audit ?? []), { timestamp: Date.now(), status: "complete", title: [fields?.currentPartyTitle, " confirmed"].join(''), id: ["confirm-", (("partyKey" as string).split('.').reduce((o: any, k: string) => o?.[k], payloadObj) ?? "")].join(''), description: [fields?.currentPartyActor, " completed: ", fields?.currentActionLabel].join('') }];
        fields = { ...(fields ?? {}), 'audit': _fields['audit'] } as typeof fields;
        _fields['currentPartyIndex'] = (+(fields?.currentPartyIndex ?? 0) + 1);
        fields = { ...(fields ?? {}), 'currentPartyIndex': _fields['currentPartyIndex'] } as typeof fields;
        _fields['currentPartyId'] = (("id" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ stepLabel: "Step 1 of 2", icon: "user", actor: "Alice Chen", actionLabel: "Confirm payment", title: "Buyer", id: "buyer", description: "Funds the transaction and confirms receipt of the vehicle.", actionIcon: "credit-card", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed." }, { actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", icon: "user-check", actionLabel: "Confirm shipment", actionIcon: "package", description: "Ships the vehicle and uploads delivery proof.", stepLabel: "Step 2 of 2", id: "seller", title: "Seller", actor: "Bob\'s Auto Sales LLC" }], fields?.currentPartyIndex)) ?? "");
        fields = { ...(fields ?? {}), 'currentPartyId': _fields['currentPartyId'] } as typeof fields;
        _fields['currentPartyTitle'] = (("title" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ description: "Funds the transaction and confirms receipt of the vehicle.", title: "Buyer", actionLabel: "Confirm payment", actionIcon: "credit-card", actor: "Alice Chen", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", id: "buyer", stepLabel: "Step 1 of 2", icon: "user" }, { title: "Seller", description: "Ships the vehicle and uploads delivery proof.", actionIcon: "package", actionLabel: "Confirm shipment", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", stepLabel: "Step 2 of 2", id: "seller", icon: "user-check", actor: "Bob\'s Auto Sales LLC" }], fields?.currentPartyIndex)) ?? "");
        fields = { ...(fields ?? {}), 'currentPartyTitle': _fields['currentPartyTitle'] } as typeof fields;
        _fields['currentPartyActor'] = (("actor" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ title: "Buyer", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", description: "Funds the transaction and confirms receipt of the vehicle.", id: "buyer", actionLabel: "Confirm payment", stepLabel: "Step 1 of 2", actionIcon: "credit-card", icon: "user", actor: "Alice Chen" }, { actionLabel: "Confirm shipment", title: "Seller", actor: "Bob\'s Auto Sales LLC", description: "Ships the vehicle and uploads delivery proof.", actionIcon: "package", id: "seller", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", icon: "user-check", stepLabel: "Step 2 of 2" }], fields?.currentPartyIndex)) ?? "");
        fields = { ...(fields ?? {}), 'currentPartyActor': _fields['currentPartyActor'] } as typeof fields;
        _fields['currentPartyIcon'] = (("icon" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ icon: "user", title: "Buyer", description: "Funds the transaction and confirms receipt of the vehicle.", actionIcon: "credit-card", stepLabel: "Step 1 of 2", actionLabel: "Confirm payment", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", actor: "Alice Chen", id: "buyer" }, { stepLabel: "Step 2 of 2", actor: "Bob\'s Auto Sales LLC", id: "seller", icon: "user-check", description: "Ships the vehicle and uploads delivery proof.", actionIcon: "package", actionLabel: "Confirm shipment", title: "Seller", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt." }], fields?.currentPartyIndex)) ?? "user");
        fields = { ...(fields ?? {}), 'currentPartyIcon': _fields['currentPartyIcon'] } as typeof fields;
        _fields['currentActionLabel'] = (("actionLabel" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ title: "Buyer", actionLabel: "Confirm payment", stepLabel: "Step 1 of 2", icon: "user", actor: "Alice Chen", description: "Funds the transaction and confirms receipt of the vehicle.", actionIcon: "credit-card", id: "buyer", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed." }, { actionLabel: "Confirm shipment", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", title: "Seller", icon: "user-check", description: "Ships the vehicle and uploads delivery proof.", id: "seller", stepLabel: "Step 2 of 2", actor: "Bob\'s Auto Sales LLC", actionIcon: "package" }], fields?.currentPartyIndex)) ?? "Confirm");
        fields = { ...(fields ?? {}), 'currentActionLabel': _fields['currentActionLabel'] } as typeof fields;
        _fields['currentActionIcon'] = (("actionIcon" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", icon: "user", id: "buyer", description: "Funds the transaction and confirms receipt of the vehicle.", actor: "Alice Chen", actionLabel: "Confirm payment", actionIcon: "credit-card", title: "Buyer", stepLabel: "Step 1 of 2" }, { icon: "user-check", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", description: "Ships the vehicle and uploads delivery proof.", id: "seller", title: "Seller", actor: "Bob\'s Auto Sales LLC", stepLabel: "Step 2 of 2", actionLabel: "Confirm shipment", actionIcon: "package" }], fields?.currentPartyIndex)) ?? "check");
        fields = { ...(fields ?? {}), 'currentActionIcon': _fields['currentActionIcon'] } as typeof fields;
        _fields['currentActionDescription'] = (("actionDescription" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", id: "buyer", icon: "user", actionLabel: "Confirm payment", actor: "Alice Chen", description: "Funds the transaction and confirms receipt of the vehicle.", stepLabel: "Step 1 of 2", actionIcon: "credit-card", title: "Buyer" }, { actionIcon: "package", title: "Seller", description: "Ships the vehicle and uploads delivery proof.", icon: "user-check", actionLabel: "Confirm shipment", id: "seller", stepLabel: "Step 2 of 2", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", actor: "Bob\'s Auto Sales LLC" }], fields?.currentPartyIndex)) ?? "");
        fields = { ...(fields ?? {}), 'currentActionDescription': _fields['currentActionDescription'] } as typeof fields;
        _fields['currentStepLabel'] = (("stepLabel" as string).split('.').reduce((o: any, k: string) => o?.[k], ((__a: EventPayloadValue | undefined, __i: number | undefined) => Array.isArray(__a) ? __a[__i ?? 0] : undefined)([{ actionIcon: "credit-card", actionDescription: "Authorize $28,500 to be held in escrow until delivery is confirmed.", actionLabel: "Confirm payment", id: "buyer", icon: "user", title: "Buyer", stepLabel: "Step 1 of 2", description: "Funds the transaction and confirms receipt of the vehicle.", actor: "Alice Chen" }, { id: "seller", stepLabel: "Step 2 of 2", actionDescription: "Mark the vehicle as shipped. Funds will release after the buyer confirms receipt.", actionIcon: "package", actor: "Bob\'s Auto Sales LLC", title: "Seller", icon: "user-check", description: "Ships the vehicle and uploads delivery proof.", actionLabel: "Confirm shipment" }], fields?.currentPartyIndex)) ?? "Step");
        fields = { ...(fields ?? {}), 'currentStepLabel': _fields['currentStepLabel'] } as typeof fields;
    } else if (fromState === 'awaiting' && event === 'PARTY_CONFIRM' && (((+(fields?.currentPartyIndex ?? 0) + 1) === fields?.totalParties))) {
      // awaiting → funded (on PARTY_CONFIRM)
        _fields['audit'] = [...(fields?.audit ?? []), { timestamp: Date.now(), description: [fields?.currentPartyActor, " completed: ", fields?.currentActionLabel].join(''), id: ["confirm-", (("partyKey" as string).split('.').reduce((o: any, k: string) => o?.[k], payloadObj) ?? "")].join(''), title: [fields?.currentPartyTitle, " confirmed"].join(''), status: "complete" }];
        fields = { ...(fields ?? {}), 'audit': _fields['audit'] } as typeof fields;
        _fields['audit'] = [...(fields?.audit ?? []), { id: "all-confirmed", title: "All parties confirmed", description: ["$28,500", " is now funded and ready for release."].join(''), status: "complete", timestamp: Date.now() }];
        fields = { ...(fields ?? {}), 'audit': _fields['audit'] } as typeof fields;
    } else if (fromState === 'awaiting' && event === 'OPEN_DISPUTE') {
      // awaiting → capturing_dispute (on OPEN_DISPUTE)
        _fields['reason'] = "";
        fields = { ...(fields ?? {}), 'reason': _fields['reason'] } as typeof fields;
    } else if (fromState === 'awaiting' && event === 'CANCEL_TRANSACTION') {
      // awaiting → capturing_cancel (on CANCEL_TRANSACTION)
        _fields['reason'] = "";
        fields = { ...(fields ?? {}), 'reason': _fields['reason'] } as typeof fields;
    } else if (fromState === 'capturing_dispute' && event === 'SUBMIT_DISPUTE') {
      // capturing_dispute → disputed (on SUBMIT_DISPUTE)
        _fields['disputeReason'] = (("reason" as string).split('.').reduce((o: any, k: string) => o?.[k], payloadObj?.data) ?? "");
        fields = { ...(fields ?? {}), 'disputeReason': _fields['disputeReason'] } as typeof fields;
        _fields['audit'] = [...(fields?.audit ?? []), { timestamp: Date.now(), title: "Dispute opened", status: "error", id: "dispute-opened", description: fields?.disputeReason }];
        fields = { ...(fields ?? {}), 'audit': _fields['audit'] } as typeof fields;
    } else if (fromState === 'capturing_cancel' && event === 'SUBMIT_CANCEL') {
      // capturing_cancel → cancelled (on SUBMIT_CANCEL)
        _fields['cancelReason'] = (("reason" as string).split('.').reduce((o: any, k: string) => o?.[k], payloadObj?.data) ?? "");
        fields = { ...(fields ?? {}), 'cancelReason': _fields['cancelReason'] } as typeof fields;
        _fields['audit'] = [...(fields?.audit ?? []), { id: "cancelled", title: "Transaction cancelled", description: fields?.cancelReason, status: "error", timestamp: Date.now() }];
        fields = { ...(fields ?? {}), 'audit': _fields['audit'] } as typeof fields;
    } else if (fromState === 'funded' && event === 'RELEASE') {
      // funded → released (on RELEASE)
        _fields['audit'] = [...(fields?.audit ?? []), { title: "Funds released", status: "complete", description: ["$28,500", " released to the seller. Transaction complete."].join(''), id: "released", timestamp: Date.now() }];
        fields = { ...(fields ?? {}), 'audit': _fields['audit'] } as typeof fields;
    } else if (fromState === 'funded' && event === 'OPEN_DISPUTE') {
      // funded → capturing_dispute (on OPEN_DISPUTE)
        _fields['reason'] = "";
        fields = { ...(fields ?? {}), 'reason': _fields['reason'] } as typeof fields;
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
      case 'awaiting':
        return (['CANCEL_TRANSACTION', 'OPEN_DISPUTE', 'PARTY_CONFIRM'] as const).includes(event as never);
      case 'cancelled':
        return (['RESTART'] as const).includes(event as never);
      case 'capturing_cancel':
        return (['CANCEL_REASON', 'SUBMIT_CANCEL'] as const).includes(event as never);
      case 'capturing_dispute':
        return (['CANCEL_REASON', 'SUBMIT_DISPUTE'] as const).includes(event as never);
      case 'disputed':
        return (['RESTART'] as const).includes(event as never);
      case 'error':
        return (['INIT'] as const).includes(event as never);
      case 'funded':
        return (['OPEN_DISPUTE', 'RELEASE'] as const).includes(event as never);
      case 'loading':
        return (['FlowLoadFailed', 'FlowLoaded', 'FlowSaveFailed', 'FlowSaved', 'INIT'] as const).includes(event as never);
      case 'released':
        return (['RESTART'] as const).includes(event as never);
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
          event: event as MultiPartyTransactionEvent,
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
  const actions: { [K in keyof MultiPartyTransactionEventPayloadMap]: (payload?: MultiPartyTransactionEventPayloadMap[K]) => Promise<EventResponse> } = {
    'INIT': () => dispatch('INIT'),
    'FlowLoaded': (payload?: MultiPartyTransactionEventPayloadMap['FlowLoaded']) => dispatch('FlowLoaded', payload),
    'FlowLoadFailed': (payload?: MultiPartyTransactionEventPayloadMap['FlowLoadFailed']) => dispatch('FlowLoadFailed', payload),
    'FlowSaved': (payload?: MultiPartyTransactionEventPayloadMap['FlowSaved']) => dispatch('FlowSaved', payload),
    'FlowSaveFailed': (payload?: MultiPartyTransactionEventPayloadMap['FlowSaveFailed']) => dispatch('FlowSaveFailed', payload),
    'PARTY_CONFIRM': (payload?: MultiPartyTransactionEventPayloadMap['PARTY_CONFIRM']) => dispatch('PARTY_CONFIRM', payload),
    'OPEN_DISPUTE': () => dispatch('OPEN_DISPUTE'),
    'CANCEL_TRANSACTION': () => dispatch('CANCEL_TRANSACTION'),
    'SUBMIT_DISPUTE': (payload?: MultiPartyTransactionEventPayloadMap['SUBMIT_DISPUTE']) => dispatch('SUBMIT_DISPUTE', payload),
    'CANCEL_REASON': () => dispatch('CANCEL_REASON'),
    'SUBMIT_CANCEL': (payload?: MultiPartyTransactionEventPayloadMap['SUBMIT_CANCEL']) => dispatch('SUBMIT_CANCEL', payload),
    'RELEASE': () => dispatch('RELEASE'),
    'RESTART': () => dispatch('RESTART'),
  };

  useUIEvents(enqueueEvent, 'MultiPartyFlowOrbital.MultiPartyTransaction', ['INIT', 'FlowLoaded', 'FlowLoadFailed', 'FlowSaved', 'FlowSaveFailed', 'PARTY_CONFIRM', 'OPEN_DISPUTE', 'CANCEL_TRANSACTION', 'SUBMIT_DISPUTE', 'CANCEL_REASON', 'SUBMIT_CANCEL', 'RELEASE', 'RESTART'] as const, eventBus);

  // Verifier snapshot registration (VG Foundation 1)
  const internalStateRef = useRef(internalState);
  internalStateRef.current = internalState;
  useEffect(() => {
    const unregister = registerTraitSnapshot('MultiPartyTransaction', (): TraitStateSnapshot => ({
      traitName: 'MultiPartyTransaction',
      currentState: internalStateRef.current.machineState,
      states: ['loading', 'awaiting', 'capturing_dispute', 'capturing_cancel', 'funded', 'released', 'disputed', 'cancelled', 'error'],
      events: ['INIT', 'FlowLoaded', 'FlowLoadFailed', 'FlowSaved', 'FlowSaveFailed', 'PARTY_CONFIRM', 'OPEN_DISPUTE', 'CANCEL_TRANSACTION', 'SUBMIT_DISPUTE', 'CANCEL_REASON', 'SUBMIT_CANCEL', 'RELEASE', 'RESTART'],
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
