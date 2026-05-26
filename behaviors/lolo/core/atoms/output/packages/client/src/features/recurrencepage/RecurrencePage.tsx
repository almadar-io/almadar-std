/**
 * RecurrencePage
 *
 * Page component for RecurrencePage
 * Path: /recurrence
 *
 * @generated from schema
 */

import React from 'react';
import { RecurrenceEditorView } from '@/components/traits/RecurrenceEditorView';
import { VStack, UISlotComponent } from '@almadar/ui/components';

interface RecurrencePageProps {
  // Add any page-level props here
}

export function RecurrencePage(_props: RecurrencePageProps) {
  return (
    <>
      <UISlotComponent slot="main">
        <VStack gap="lg" className="w-full">
          <RecurrenceEditorView />
        </VStack>
      </UISlotComponent>
    </>
  );
}

export default RecurrencePage;
