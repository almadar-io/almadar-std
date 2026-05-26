/**
 * RatingReviewPage
 *
 * Page component for RatingReviewPage
 * Path: /reviews
 *
 * @generated from schema
 */

import React from 'react';
import { RatingReviewBoardView } from '@/components/traits/RatingReviewBoardView';
import { VStack, UISlotComponent } from '@almadar/ui/components';

interface RatingReviewPageProps {
  // Add any page-level props here
}

export function RatingReviewPage(_props: RatingReviewPageProps) {
  return (
    <>
      <UISlotComponent slot="main">
        <VStack gap="lg" className="w-full">
          <RatingReviewBoardView />
        </VStack>
      </UISlotComponent>
    </>
  );
}

export default RatingReviewPage;
