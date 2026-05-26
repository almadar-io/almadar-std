/**
 * StepFlowPage
 *
 * Page component for StepFlowPage
 * Path: /step-flow
 *
 * @generated from schema
 */

import React from 'react';
import { StepFlowReviewView } from '@/components/traits/StepFlowReviewView';
import { VStack, UISlotComponent } from '@almadar/ui/components';

interface StepFlowPageProps {
  // Add any page-level props here
}

export function StepFlowPage(_props: StepFlowPageProps) {
  return (
    <>
      <UISlotComponent slot="main">
        <VStack gap="lg" className="w-full">
          <StepFlowReviewView />
        </VStack>
      </UISlotComponent>
    </>
  );
}

export default StepFlowPage;
