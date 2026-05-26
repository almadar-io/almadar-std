/**
 * EventLogTimelineView
 *
 * Functional component — logic + state-based JSX rendering.
 *
 * @generated from schema
 * @trait EventLogTimeline
 */

import { useEventLogTimelineLogic } from '@/hooks/traits/useEventLogTimelineLogic';
import type { EventLogTimelineConfig } from '@/hooks/traits/useEventLogTimelineLogic';
import type { EntityRow, FieldValue } from '@almadar/core';
import type { EventLogView } from '@app/shared';
import { ErrorState } from '@almadar/ui/components';
import { LoadingState } from '@almadar/ui/components';
import { Tabs } from '@almadar/ui/components';
import { Typography } from '@almadar/ui/components';
import { Divider } from '@almadar/ui/components';
import { Card } from '@almadar/ui/components';
import { Stack } from '@almadar/ui/components';
import { Timeline } from '@almadar/ui/components';
import { Form } from '@almadar/ui/components';
import { Button } from '@almadar/ui/components';
import { Icon } from '@almadar/ui/components';
import { UISlotComponent } from '@almadar/ui/components';
import { TraitScopeProvider } from '@almadar/ui/providers';

interface EventLogTimelineViewProps {
  config?: EventLogTimelineConfig;
}

export function EventLogTimelineView({ config: propsConfig }: EventLogTimelineViewProps) {
  const { state, data, lastPayload, lastEvent, loading, error, fields, dispatch, actions, config } = useEventLogTimelineLogic(propsConfig);

  // Entity collection from server response data
  const entity: EntityRow[] = data['EventLogView'] ?? [];
  // Payload from last event (for @payload bindings in render-ui)
  const payload = lastPayload;

  if (state === 'viewing') {
    return (
      <TraitScopeProvider orbital="EventLogOrbital" trait="EventLogTimeline"><UISlotComponent slot="main" pattern="stack" sourceTrait="EventLogTimeline">{lastEvent === 'EventLogLoaded' ? (<Stack gap="md" direction="vertical"><Stack align="center" gap="sm" direction="horizontal"><Icon name="history" /><Typography variant="h3" content="Activity" /><Button label="Log event" action="EventLogOrbital.EventLogTimeline.OPEN_BACKFILL" icon="plus" variant="primary" /></Stack><Tabs activeTab={String(fields?.filterKind ?? '')} tabs={fields?.filterChips} tabChangeEvent="APPLY_FILTER" /><Timeline entity={(fields?.entries) as readonly { date?: string; description?: string; id: string; kind?: 'created' | 'updated' | 'approved' | 'rejected'; status?: 'complete' | 'active' | 'pending' | 'error'; title: string }[]} fields={["title", "description", "date", "status"]} /></Stack>) : lastEvent === 'APPLY_FILTER' ? (<Stack gap="md" direction="vertical"><Stack align="center" gap="sm" direction="horizontal"><Icon name="history" /><Typography variant="h3" content="Activity" /><Button label="Log event" icon="plus" action="EventLogOrbital.EventLogTimeline.OPEN_BACKFILL" variant="primary" /></Stack><Tabs tabs={fields?.filterChips} activeTab={String(fields?.filterKind ?? '')} tabChangeEvent="APPLY_FILTER" /><Timeline entity={(fields?.entries) as readonly { date?: string; description?: string; id: string; kind?: 'created' | 'updated' | 'approved' | 'rejected'; status?: 'complete' | 'active' | 'pending' | 'error'; title: string }[]} fields={["title", "description", "date", "status"]} /></Stack>) : lastEvent === 'CANCEL_BACKFILL' ? (<Stack direction="vertical" gap="md"><Stack align="center" direction="horizontal" gap="sm"><Icon name="history" /><Typography variant="h3" content="Activity" /><Button icon="plus" action="EventLogOrbital.EventLogTimeline.OPEN_BACKFILL" variant="primary" label="Log event" /></Stack><Tabs tabChangeEvent="APPLY_FILTER" tabs={fields?.filterChips} activeTab={String(fields?.filterKind ?? '')} /><Timeline entity={(fields?.entries) as readonly { date?: string; description?: string; id: string; kind?: 'created' | 'updated' | 'approved' | 'rejected'; status?: 'complete' | 'active' | 'pending' | 'error'; title: string }[]} fields={["title", "description", "date", "status"]} /></Stack>) : (<Stack gap="md" direction="vertical"><Stack direction="horizontal" align="center" gap="sm"><Icon name="history" /><Typography variant="h3" content="Activity" /><Button variant="primary" icon="plus" label="Log event" action="EventLogOrbital.EventLogTimeline.OPEN_BACKFILL" /></Stack><Tabs tabChangeEvent="APPLY_FILTER" activeTab={String(fields?.filterKind ?? '')} tabs={fields?.filterChips} /><Timeline entity={(fields?.entries) as readonly { date?: string; description?: string; id: string; kind?: 'created' | 'updated' | 'approved' | 'rejected'; status?: 'complete' | 'active' | 'pending' | 'error'; title: string }[]} fields={["title", "description", "date", "status"]} /></Stack>)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'loading') {
    return (
      <TraitScopeProvider orbital="EventLogOrbital" trait="EventLogTimeline"><UISlotComponent slot="main" pattern="loading-state" sourceTrait="EventLogTimeline">{lastEvent === 'EventLogSaved' ? (<LoadingState title="Refreshing…" />) : lastEvent === 'SAVE_BACKFILL' ? (<LoadingState title="Saving entry…" />) : (<LoadingState title="Loading activity…" />)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'error') {
    return (
      <TraitScopeProvider orbital="EventLogOrbital" trait="EventLogTimeline"><UISlotComponent slot="main" pattern="error-state" sourceTrait="EventLogTimeline">{lastEvent === 'EventLogLoadFailed' ? (<ErrorState message={String(fields?.errorMessage ?? '')} title="Failed to load" />) : lastEvent === 'EventLogSaveFailed' ? (<ErrorState message={String(fields?.errorMessage ?? '')} title="Save failed" />) : (<ErrorState message={String(fields?.errorMessage ?? '')} title="Failed to load" />)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'backfilling') {
    return (
      <TraitScopeProvider orbital="EventLogOrbital" trait="EventLogTimeline"><UISlotComponent slot="main" pattern="stack" sourceTrait="EventLogTimeline"><Stack gap="md" direction="vertical"><Stack gap="sm" align="center" direction="horizontal"><Button icon="arrow-left" variant="ghost" action="EventLogOrbital.EventLogTimeline.CANCEL_BACKFILL" label="Back" /><Icon name="plus-circle" /><Typography content="Log event" variant="h3" /></Stack><Divider /><Card look="elevated"><Form entity={(entity) as readonly EntityRow[]} cancelEvent="EventLogOrbital.EventLogTimeline.CANCEL_BACKFILL" fields={[{ name: "backfillTitle", label: "BackfillTitle", type: "string", required: true }, { name: "backfillDescription", label: "BackfillDescription", type: "string", required: true }, { name: "backfillKind", label: "BackfillKind", type: "string", required: true }, { name: "backfillDate", label: "BackfillDate", type: "string", required: true }]} mode="create" submitEvent="EventLogOrbital.EventLogTimeline.SAVE_BACKFILL" /></Card></Stack></UISlotComponent></TraitScopeProvider>
    );
  }

  return null;
}

export default EventLogTimelineView;
