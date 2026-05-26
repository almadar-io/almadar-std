/**
 * RecurrenceEditorView
 *
 * Functional component — logic + state-based JSX rendering.
 *
 * @generated from schema
 * @trait RecurrenceEditor
 */

import { useRecurrenceEditorLogic } from '@/hooks/traits/useRecurrenceEditorLogic';
import type { RecurrenceEditorConfig } from '@/hooks/traits/useRecurrenceEditorLogic';
import type { EntityRow, FieldValue } from '@almadar/core';
import type { RecurrenceView } from '@app/shared';
import { Timeline } from '@almadar/ui/components';
import { Icon } from '@almadar/ui/components';
import { Button } from '@almadar/ui/components';
import { ErrorState } from '@almadar/ui/components';
import { Card } from '@almadar/ui/components';
import { LoadingState } from '@almadar/ui/components';
import { Badge } from '@almadar/ui/components';
import { Typography } from '@almadar/ui/components';
import { Form } from '@almadar/ui/components';
import { Stack } from '@almadar/ui/components';
import { UISlotComponent } from '@almadar/ui/components';
import { TraitScopeProvider } from '@almadar/ui/providers';

interface RecurrenceEditorViewProps {
  config?: RecurrenceEditorConfig;
}

export function RecurrenceEditorView({ config: propsConfig }: RecurrenceEditorViewProps) {
  const { state, data, lastPayload, lastEvent, loading, error, fields, dispatch, actions, config } = useRecurrenceEditorLogic(propsConfig);

  // Entity collection from server response data
  const entity: EntityRow[] = data['RecurrenceView'] ?? [];
  // Payload from last event (for @payload bindings in render-ui)
  const payload = lastPayload;

  if (state === 'loading') {
    return (
      <TraitScopeProvider orbital="RecurrenceOrbital" trait="RecurrenceEditor"><UISlotComponent slot="main" pattern="loading-state" sourceTrait="RecurrenceEditor">{lastEvent === 'RecurrenceSaved' ? (<LoadingState title="Refreshing…" />) : lastEvent === 'SAVE_RULE' ? (<LoadingState title="Saving rule…" />) : lastEvent === 'CANCEL_RULE' ? (<LoadingState title="Cancelling…" />) : lastEvent === 'SKIP_OCCURRENCE' ? (<LoadingState title="Skipping…" />) : lastEvent === 'RESCHEDULE_OCCURRENCE' ? (<LoadingState title="Rescheduling…" />) : lastEvent === 'CLOSE_EXCEPTION' ? (<LoadingState title="Closing…" />) : lastEvent === 'RESTART' ? (<LoadingState title="Restarting…" />) : (<LoadingState title="Loading schedule…" />)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'error') {
    return (
      <TraitScopeProvider orbital="RecurrenceOrbital" trait="RecurrenceEditor"><UISlotComponent slot="main" pattern="error-state" sourceTrait="RecurrenceEditor">{lastEvent === 'RecurrenceLoadFailed' ? (<ErrorState title="Failed to load" message={String(fields?.errorMessage ?? '')} />) : lastEvent === 'RecurrenceSaveFailed' ? (<ErrorState title="Save failed" message={String(fields?.errorMessage ?? '')} />) : (<ErrorState title="Failed to load" message={String(fields?.errorMessage ?? '')} />)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'viewing') {
    return (
      <TraitScopeProvider orbital="RecurrenceOrbital" trait="RecurrenceEditor"><UISlotComponent slot="main" pattern="stack" sourceTrait="RecurrenceEditor"><Stack direction="vertical" gap="lg"><Stack gap="sm" align="center" direction="horizontal"><Icon name="repeat" /><Typography variant="h3" content="Schedule" /><Badge variant="success" label="Active" /><Button label="Edit rule" variant="primary" action="RecurrenceOrbital.RecurrenceEditor.EDIT_RULE" icon="settings" /></Stack><Card look="elevated"><Stack direction="vertical" gap="xs"><Stack gap="xs" direction="horizontal" align="center"><Typography content="Repeats every" color="muted" /><Typography content={fields?.interval ?? 0} weight="bold" /><Typography content={String(fields?.frequency ?? '')} weight="bold" /></Stack><Stack gap="xs" direction="horizontal" align="center"><Typography content="Starts" color="muted" /><Typography content={String(fields?.startDate ?? '')} weight="bold" /><Typography color="muted" content="·" /><Typography color="muted" content="Ends" /><Typography content={String(fields?.endDate ?? '')} weight="bold" /></Stack></Stack></Card><Typography variant="h4" content="Next runs" /><Timeline entity={(fields?.occurrences) as readonly { date?: string; description?: string; id: string; rawStatus?: 'scheduled' | 'skipped' | 'completed' | 'rescheduled'; status?: 'complete' | 'active' | 'pending' | 'error'; title: string }[]} fields={["title", "description", "date", "status"]} itemActions={[{ label: "Manage", event: "RecurrenceOrbital.RecurrenceEditor.OPEN_EXCEPTION" }]} /><Stack direction="horizontal" gap="sm" align="center"><Button action="RecurrenceOrbital.RecurrenceEditor.CANCEL_SCHEDULE" variant="danger" icon="x-circle" label="End schedule" /></Stack></Stack></UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'awaiting_exception_decision') {
    return (
      <TraitScopeProvider orbital="RecurrenceOrbital" trait="RecurrenceEditor"><UISlotComponent slot="main" pattern="stack" sourceTrait="RecurrenceEditor"><Stack direction="vertical" gap="md"><Stack gap="sm" direction="horizontal" align="center"><Button icon="arrow-left" label="Back" action="RecurrenceOrbital.RecurrenceEditor.CLOSE_EXCEPTION" variant="ghost" /><Icon name="calendar-clock" /><Typography variant="h3" content={String(fields?.currentOccurrenceLabel ?? '')} /><Badge variant="primary" label={String(fields?.currentOccurrenceDate ?? '')} /></Stack><Card look="elevated"><Stack direction="vertical" gap="sm"><Typography variant="body" content="What would you like to do with this occurrence?" /><Stack align="center" direction="horizontal" gap="sm"><Button label="Skip" action="RecurrenceOrbital.RecurrenceEditor.SKIP_OCCURRENCE" icon="skip-forward" actionPayload={{id: fields?.currentOccurrenceId}} variant="secondary" /><Button icon="calendar-clock" variant="primary" actionPayload={{id: fields?.currentOccurrenceId}} label="Reschedule" action="RecurrenceOrbital.RecurrenceEditor.RESCHEDULE_OCCURRENCE" /></Stack></Stack></Card></Stack></UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'defining_rule') {
    return (
      <TraitScopeProvider orbital="RecurrenceOrbital" trait="RecurrenceEditor"><UISlotComponent slot="main" pattern="stack" sourceTrait="RecurrenceEditor"><Stack direction="vertical" gap="md"><Stack gap="sm" direction="horizontal" align="center"><Button action="RecurrenceOrbital.RecurrenceEditor.CANCEL_RULE" variant="ghost" icon="arrow-left" label="Back" /><Icon name="settings" /><Typography content="Edit recurrence rule" variant="h3" /></Stack><Card look="elevated"><Form entity={(entity) as readonly EntityRow[]} mode="edit" cancelEvent="RecurrenceOrbital.RecurrenceEditor.CANCEL_RULE" fields={[{ name: "frequency", label: "Frequency", type: "string", values: ["daily", "weekly", "monthly", "yearly"], required: true }, { name: "interval", label: "Interval", type: "number", required: true }, { name: "startDate", label: "StartDate", type: "string", required: true }, { name: "endDate", label: "EndDate", type: "string", required: true }, { name: "endAfterCount", label: "EndAfterCount", type: "number", required: true }]} submitEvent="RecurrenceOrbital.RecurrenceEditor.SAVE_RULE" /></Card></Stack></UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'cancelled') {
    return (
      <TraitScopeProvider orbital="RecurrenceOrbital" trait="RecurrenceEditor"><UISlotComponent slot="main" pattern="stack" sourceTrait="RecurrenceEditor"><Stack gap="lg" direction="vertical" align="center"><Icon size="lg" name="x-circle" /><Typography content="Schedule ended" align="center" variant="h2" /><Typography content="This recurring schedule has been cancelled. No further occurrences will fire." color="muted" align="center" variant="body" /><Button label="Start a new schedule" action="RecurrenceOrbital.RecurrenceEditor.RESTART" variant="secondary" icon="rotate-ccw" /></Stack></UISlotComponent></TraitScopeProvider>
    );
  }

  return null;
}

export default RecurrenceEditorView;
