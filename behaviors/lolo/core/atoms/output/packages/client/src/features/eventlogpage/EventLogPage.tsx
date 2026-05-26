/**
 * EventLogPage
 *
 * Page component for EventLogPage
 * Path: /event-log
 *
 * @generated from schema
 */

import React from 'react';
import { EventLogTimelineView } from '@/components/traits/EventLogTimelineView';
import { VStack, UISlotComponent } from '@almadar/ui/components';

interface EventLogPageProps {
  // Add any page-level props here
}

export function EventLogPage(_props: EventLogPageProps) {
  return (
    <>
      <UISlotComponent slot="main">
        <VStack gap="lg" className="w-full">
          <EventLogTimelineView />
        </VStack>
      </UISlotComponent>
    </>
  );
}

export default EventLogPage;
