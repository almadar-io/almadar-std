/**
 * BoardPage
 *
 * Page component for BoardPage
 * Path: /board
 *
 * @generated from schema
 */

import React from 'react';
import { BoardItemBoardView } from '@/components/traits/BoardItemBoardView';
import { VStack, UISlotComponent } from '@almadar/ui/components';

interface BoardPageProps {
  // Add any page-level props here
}

export function BoardPage(_props: BoardPageProps) {
  return (
    <>
      <UISlotComponent slot="main">
        <VStack gap="lg" className="w-full">
          <BoardItemBoardView />
        </VStack>
      </UISlotComponent>
    </>
  );
}

export default BoardPage;
