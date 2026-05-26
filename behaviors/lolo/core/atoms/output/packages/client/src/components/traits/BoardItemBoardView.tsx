/**
 * BoardItemBoardView
 *
 * Functional component — logic + state-based JSX rendering.
 *
 * @generated from schema
 * @trait BoardItemBoard
 */

import { useBoardItemBoardLogic } from '@/hooks/traits/useBoardItemBoardLogic';
import type { BoardItemBoardConfig } from '@/hooks/traits/useBoardItemBoardLogic';
import type { EntityRow, FieldValue } from '@almadar/core';
import type { BoardView } from '@app/shared';
import { DataGrid } from '@almadar/ui/components';
import { DataList } from '@almadar/ui/components';
import { FloatingActionButton } from '@almadar/ui/components';
import { Form } from '@almadar/ui/components';
import { Card } from '@almadar/ui/components';
import { Typography } from '@almadar/ui/components';
import { Button } from '@almadar/ui/components';
import { Stack } from '@almadar/ui/components';
import { Badge } from '@almadar/ui/components';
import { LoadingState } from '@almadar/ui/components';
import { Icon } from '@almadar/ui/components';
import { Divider } from '@almadar/ui/components';
import { ErrorState } from '@almadar/ui/components';
import { UISlotComponent } from '@almadar/ui/components';
import { TraitScopeProvider } from '@almadar/ui/providers';

interface BoardItemBoardViewProps {
  config?: BoardItemBoardConfig;
}

export function BoardItemBoardView({ config: propsConfig }: BoardItemBoardViewProps) {
  const { state, data, lastPayload, lastEvent, loading, error, fields, dispatch, actions, config } = useBoardItemBoardLogic(propsConfig);

  // Entity collection from server response data
  const entity: EntityRow[] = data['BoardView'] ?? [];
  // Payload from last event (for @payload bindings in render-ui)
  const payload = lastPayload;

  if (state === 'error') {
    return (
      <TraitScopeProvider orbital="BoardOrbital" trait="BoardItemBoard"><UISlotComponent slot="main" pattern="error-state" sourceTrait="BoardItemBoard">{lastEvent === 'BoardItemsLoadFailed' ? (<ErrorState message={String(fields?.errorMessage ?? '')} title="Failed to load board" />) : lastEvent === 'BoardItemsSaveFailed' ? (<ErrorState message={String(fields?.errorMessage ?? '')} title="Save failed" />) : (<ErrorState message={String(fields?.errorMessage ?? '')} title="Failed to load board" />)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'adding') {
    return (
      <TraitScopeProvider orbital="BoardOrbital" trait="BoardItemBoard"><UISlotComponent slot="main" pattern="stack" sourceTrait="BoardItemBoard"><Stack gap="md" direction="vertical"><Stack gap="sm" align="center" direction="horizontal"><Button action="BoardOrbital.BoardItemBoard.CANCEL_ADD" label="Cancel" variant="ghost" icon="x" /><Icon name="plus" /><Typography variant="h3" content="New board item" /></Stack><Divider /><Form entity={(entity) as readonly EntityRow[]} mode="create" submitEvent="BoardOrbital.BoardItemBoard.SAVE_CARD" cancelEvent="BoardOrbital.BoardItemBoard.CANCEL_ADD" fields={[{ name: "title", label: "Title", type: "string", required: true }, { name: "description", label: "Description", type: "string", required: true }, { name: "stage", label: "Stage", type: "string", values: ["todo", "doing", "done"], required: true }, { name: "notes", label: "Notes", type: "string", required: true }]} /></Stack></UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'loading') {
    return (
      <TraitScopeProvider orbital="BoardOrbital" trait="BoardItemBoard"><UISlotComponent slot="main" pattern="loading-state" sourceTrait="BoardItemBoard">{lastEvent === 'CLOSE_CARD' ? (<LoadingState title="Refreshing board…" />) : lastEvent === 'MOVE_CARD' ? (<LoadingState title="Moving item…" />) : lastEvent === 'DELETE_CARD' ? (<LoadingState title="Deleting item…" />) : lastEvent === 'SAVE_CARD' ? (<LoadingState title="Saving…" />) : (<LoadingState title="Loading board…" />)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'viewing_board') {
    return (
      <TraitScopeProvider orbital="BoardOrbital" trait="BoardItemBoard"><UISlotComponent slot="main" pattern="stack" sourceTrait="BoardItemBoard">{lastEvent === 'BoardItemsLoaded' ? (<Stack gap="md" direction="vertical"><Stack direction="horizontal" align="center" gap="sm"><Icon name="kanban-square" /><Typography variant="h3" content="Board" /></Stack><Divider /><DataGrid entity={(fields?.boards) as readonly { count?: number; icon?: string; items?: { description?: string; id: string; notes?: string; position?: number; stage?: string; title?: string }[]; key: string; label: string; variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }[]} cols={3} gap="md" fields={[]} dndRoot={true}>{(col: { count?: number; icon?: string; items?: { description?: string; id: string; notes?: string; position?: number; stage?: string; title?: string }[]; key: string; label: string; variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }) => (<><Card look="elevated"><Stack direction="vertical" gap="sm"><Stack gap="xs" align="center" direction="horizontal"><Icon name={String(col?.icon ?? '')} /><Typography variant="h4" content={String(col?.label ?? '')} /><Badge label={String(col?.count ?? '')} variant={col?.variant} /></Stack><DataList entity={(col?.items) as readonly EntityRow[]} fields={[]} gap="sm" sortable={true} reorderEvent="REORDER_CARD" dropEvent="MOVE_CARD" accepts="*" dragGroup={String(col?.key ?? '')} positionEvent="REORDER_POSITION">{(item) => (<><Card look="elevated"><Stack direction="vertical" gap="xs"><Typography content={String(item?.title ?? '')} variant="h4" /><Typography content={String(item?.description ?? '')} color="muted" variant="caption" /><Stack direction="horizontal" gap="xs" align="center"><Button actionPayload={{row: item, id: item?.id}} variant="ghost" label="Open" icon="arrow-right" action="BoardOrbital.BoardItemBoard.OPEN_CARD" /></Stack></Stack></Card></>)}</DataList></Stack></Card></>)}</DataGrid><FloatingActionButton label="Add item" icon="plus" action="BoardOrbital.BoardItemBoard.ADD_CARD" variant="primary" /></Stack>) : lastEvent === 'CANCEL_ADD' ? (<LoadingState title="Cancelling…" />) : (<Stack gap="md" direction="vertical"><Stack gap="sm" direction="horizontal" align="center"><Icon name="kanban-square" /><Typography content="Board" variant="h3" /></Stack><Divider /><DataGrid entity={(fields?.boards) as readonly { count?: number; icon?: string; items?: { description?: string; id: string; notes?: string; position?: number; stage?: string; title?: string }[]; key: string; label: string; variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }[]} fields={[]} cols={3} gap="md" dndRoot={true}>{(col: { count?: number; icon?: string; items?: { description?: string; id: string; notes?: string; position?: number; stage?: string; title?: string }[]; key: string; label: string; variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }) => (<><Card look="elevated"><Stack gap="sm" direction="vertical"><Stack align="center" gap="xs" direction="horizontal"><Icon name={String(col?.icon ?? '')} /><Typography variant="h4" content={String(col?.label ?? '')} /><Badge label={String(col?.count ?? '')} variant={col?.variant} /></Stack><DataList entity={(col?.items) as readonly EntityRow[]} gap="sm" accepts="*" dropEvent="MOVE_CARD" dragGroup={String(col?.key ?? '')} positionEvent="REORDER_POSITION" reorderEvent="REORDER_CARD" fields={[]} sortable={true}>{(item) => (<><Card look="elevated"><Stack direction="vertical" gap="xs"><Typography variant="h4" content={String(item?.title ?? '')} /><Typography variant="caption" color="muted" content={String(item?.description ?? '')} /><Stack direction="horizontal" gap="xs" align="center"><Button variant="ghost" label="Open" actionPayload={{row: item, id: item?.id}} icon="arrow-right" action="BoardOrbital.BoardItemBoard.OPEN_CARD" /></Stack></Stack></Card></>)}</DataList></Stack></Card></>)}</DataGrid><FloatingActionButton icon="plus" label="Add item" variant="primary" action="BoardOrbital.BoardItemBoard.ADD_CARD" /></Stack>)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'viewing_card') {
    return (
      <TraitScopeProvider orbital="BoardOrbital" trait="BoardItemBoard"><UISlotComponent slot="main" pattern="stack" sourceTrait="BoardItemBoard"><Stack direction="vertical" gap="md"><Stack direction="horizontal" gap="sm" align="center"><Button label="Back" icon="arrow-left" action="BoardOrbital.BoardItemBoard.CLOSE_CARD" variant="ghost" /><Icon name="credit-card" /><Typography variant="h3" content={String(fields?.currentTitle ?? '')} /><Badge variant="primary" label={String(fields?.currentStage ?? '')} /></Stack><Divider /><Card look="elevated"><Stack gap="sm" direction="vertical"><Typography content="Description" color="muted" variant="caption" /><Typography content={String(fields?.currentDescription ?? '')} variant="body" /><Divider /><Typography variant="caption" content="Notes" color="muted" /><Typography content={String(fields?.currentNotes ?? '')} variant="body" /></Stack></Card><Divider /><Typography variant="caption" content="Move to stage:" color="muted" /><DataList entity={(fields?.boards) as readonly { count?: number; icon?: string; items?: { description?: string; id: string; notes?: string; position?: number; stage?: string; title?: string }[]; key: string; label: string; variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }[]} gap="sm" variant="default" fields={[]}>{(col: { count?: number; icon?: string; items?: { description?: string; id: string; notes?: string; position?: number; stage?: string; title?: string }[]; key: string; label: string; variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }) => (<><Button actionPayload={{targetGroup: col?.key, id: fields?.currentId}} icon={String(col?.icon ?? '')} action="BoardOrbital.BoardItemBoard.MOVE_CARD" label={String(col?.label ?? '')} variant="secondary" /></>)}</DataList><Stack align="center" gap="sm" direction="horizontal"><Button actionPayload={{id: fields?.currentId}} label="Delete" action="BoardOrbital.BoardItemBoard.DELETE_CARD" variant="danger" icon="trash-2" /></Stack></Stack></UISlotComponent></TraitScopeProvider>
    );
  }

  return null;
}

export default BoardItemBoardView;
