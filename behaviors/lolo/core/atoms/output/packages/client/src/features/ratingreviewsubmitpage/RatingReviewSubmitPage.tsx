/**
 * RatingReviewSubmitPage
 *
 * Page component for RatingReviewSubmitPage
 * Path: /reviews/new
 *
 * @generated from schema
 */

import React from 'react';
import { RatingReviewSubmitView } from '@/components/traits/RatingReviewSubmitView';
import { VStack, UISlotComponent } from '@almadar/ui/components';

interface RatingReviewSubmitPageProps {
  // Add any page-level props here
}

export function RatingReviewSubmitPage(_props: RatingReviewSubmitPageProps) {
  return (
    <>
      <UISlotComponent slot="main">
        <VStack gap="lg" className="w-full">
          <RatingReviewSubmitView />
        </VStack>
      </UISlotComponent>
    </>
  );
}

export default RatingReviewSubmitPage;
