/**
 * WizardPage
 *
 * Page component for WizardPage
 * Path: /wizard
 *
 * @generated from schema
 */

import React from 'react';
import { WizardFormView } from '@/components/traits/WizardFormView';
import { VStack, UISlotComponent } from '@almadar/ui/components';

interface WizardPageProps {
  // Add any page-level props here
}

export function WizardPage(_props: WizardPageProps) {
  return (
    <>
      <UISlotComponent slot="main">
        <VStack gap="lg" className="w-full">
          <WizardFormView />
        </VStack>
      </UISlotComponent>
    </>
  );
}

export default WizardPage;
