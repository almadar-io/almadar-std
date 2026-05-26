/**
 * MultiPartyFlowPage
 *
 * Page component for MultiPartyFlowPage
 * Path: /multi-party-flow
 *
 * @generated from schema
 */

import React from 'react';
import { MultiPartyTransactionView } from '@/components/traits/MultiPartyTransactionView';
import { VStack, UISlotComponent } from '@almadar/ui/components';

interface MultiPartyFlowPageProps {
  // Add any page-level props here
}

export function MultiPartyFlowPage(_props: MultiPartyFlowPageProps) {
  return (
    <>
      <UISlotComponent slot="main">
        <VStack gap="lg" className="w-full">
          <MultiPartyTransactionView />
        </VStack>
      </UISlotComponent>
    </>
  );
}

export default MultiPartyFlowPage;
