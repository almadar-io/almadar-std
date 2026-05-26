/**
 * StepFlowReviewView
 *
 * Functional component — logic + state-based JSX rendering.
 *
 * @generated from schema
 * @trait StepFlowReview
 */

import { useStepFlowReviewLogic } from '@/hooks/traits/useStepFlowReviewLogic';
import type { StepFlowReviewConfig } from '@/hooks/traits/useStepFlowReviewLogic';
import type { EntityRow, FieldValue } from '@almadar/core';
import type { StepFlowView } from '@app/shared';
import { Stack } from '@almadar/ui/components';
import { Icon } from '@almadar/ui/components';
import { Button } from '@almadar/ui/components';
import { LoadingState } from '@almadar/ui/components';
import { Typography } from '@almadar/ui/components';
import { WizardProgress } from '@almadar/ui/components';
import { Card } from '@almadar/ui/components';
import { ErrorState } from '@almadar/ui/components';
import { UISlotComponent } from '@almadar/ui/components';
import { TraitScopeProvider } from '@almadar/ui/providers';

interface StepFlowReviewViewProps {
  config?: StepFlowReviewConfig;
}

export function StepFlowReviewView({ config: propsConfig }: StepFlowReviewViewProps) {
  const { state, data, lastPayload, lastEvent, loading, error, fields, dispatch, actions, config } = useStepFlowReviewLogic(propsConfig);

  // Entity collection from server response data
  const entity: EntityRow[] = data['StepFlowView'] ?? [];
  // Payload from last event (for @payload bindings in render-ui)
  const payload = lastPayload;

  if (state === 'loading') {
    return (
      <TraitScopeProvider orbital="StepFlowOrbital" trait="StepFlowReview"><UISlotComponent slot="main" pattern="loading-state" sourceTrait="StepFlowReview">{lastEvent === 'RESTART' ? (<LoadingState title="Restarting…" />) : (<LoadingState title="Loading review…" />)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'running') {
    return (
      <TraitScopeProvider orbital="StepFlowOrbital" trait="StepFlowReview"><UISlotComponent slot="main" pattern="stack" sourceTrait="StepFlowReview">{lastEvent === 'StepItemsLoaded' ? (<Stack gap="lg" direction="vertical"><Stack gap="sm" align="center" direction="horizontal"><Icon name="shield-check" /><Typography content="Review" variant="h3" /></Stack><WizardProgress allowNavigation={false} currentStep={fields?.currentStepIndex ?? 0} steps={fields?.wizardSteps} /><Card look="elevated"><Stack gap="md" direction="vertical"><Stack direction="horizontal" align="center" gap="sm"><Icon size="lg" name={String(fields?.currentStepIcon ?? '')} /><Stack direction="vertical" gap="xs"><Typography variant="h2" content={String(fields?.currentStepLabel ?? '')} /><Typography color="muted" content={String(fields?.currentStepDescription ?? '')} variant="body" /></Stack></Stack></Stack></Card><Stack direction="horizontal" gap="sm" align="center"><Button label="Back" disabled={fields?.isFirstStep} action="StepFlowOrbital.StepFlowReview.BACK" icon="chevron-left" variant="ghost" actionPayload={{id: fields?.id}} /><Button variant="ghost" action="StepFlowOrbital.StepFlowReview.REJECT" icon="x" actionPayload={{id: fields?.id}} label="Reject" /><Button label="Escalate" icon="alert-triangle" variant="ghost" action="StepFlowOrbital.StepFlowReview.ESCALATE" actionPayload={{id: fields?.id}} /><Button actionPayload={{id: fields?.id}} variant="primary" label={String(fields?.primaryActionLabel ?? '')} action="StepFlowOrbital.StepFlowReview.ADVANCE" icon={String(fields?.primaryActionIcon ?? '')} /></Stack></Stack>) : lastEvent === 'ADVANCE' ? (<Stack direction="vertical" gap="lg"><Stack align="center" gap="sm" direction="horizontal"><Icon name="shield-check" /><Typography variant="h3" content="Review" /></Stack><WizardProgress currentStep={fields?.currentStepIndex ?? 0} steps={fields?.wizardSteps} allowNavigation={false} /><Card look="elevated"><Stack gap="md" direction="vertical"><Stack direction="horizontal" align="center" gap="sm"><Icon size="lg" name={String(fields?.currentStepIcon ?? '')} /><Stack direction="vertical" gap="xs"><Typography variant="h2" content={String(fields?.currentStepLabel ?? '')} /><Typography variant="body" color="muted" content={String(fields?.currentStepDescription ?? '')} /></Stack></Stack></Stack></Card><Stack direction="horizontal" align="center" gap="sm"><Button actionPayload={{id: fields?.id}} icon="chevron-left" variant="ghost" action="StepFlowOrbital.StepFlowReview.BACK" disabled={fields?.isFirstStep} label="Back" /><Button actionPayload={{id: fields?.id}} label="Reject" action="StepFlowOrbital.StepFlowReview.REJECT" icon="x" variant="ghost" /><Button variant="ghost" actionPayload={{id: fields?.id}} action="StepFlowOrbital.StepFlowReview.ESCALATE" icon="alert-triangle" label="Escalate" /><Button variant="primary" label={String(fields?.primaryActionLabel ?? '')} icon={String(fields?.primaryActionIcon ?? '')} action="StepFlowOrbital.StepFlowReview.ADVANCE" actionPayload={{id: fields?.id}} /></Stack></Stack>) : lastEvent === 'BACK' ? (<Stack gap="lg" direction="vertical"><Stack direction="horizontal" gap="sm" align="center"><Icon name="shield-check" /><Typography variant="h3" content="Review" /></Stack><WizardProgress currentStep={fields?.currentStepIndex ?? 0} allowNavigation={false} steps={fields?.wizardSteps} /><Card look="elevated"><Stack gap="md" direction="vertical"><Stack align="center" direction="horizontal" gap="sm"><Icon name={String(fields?.currentStepIcon ?? '')} size="lg" /><Stack direction="vertical" gap="xs"><Typography content={String(fields?.currentStepLabel ?? '')} variant="h2" /><Typography variant="body" content={String(fields?.currentStepDescription ?? '')} color="muted" /></Stack></Stack></Stack></Card><Stack direction="horizontal" gap="sm" align="center"><Button variant="ghost" label="Back" disabled={fields?.isFirstStep} action="StepFlowOrbital.StepFlowReview.BACK" icon="chevron-left" actionPayload={{id: fields?.id}} /><Button label="Reject" action="StepFlowOrbital.StepFlowReview.REJECT" icon="x" variant="ghost" actionPayload={{id: fields?.id}} /><Button actionPayload={{id: fields?.id}} variant="ghost" icon="alert-triangle" action="StepFlowOrbital.StepFlowReview.ESCALATE" label="Escalate" /><Button actionPayload={{id: fields?.id}} icon={String(fields?.primaryActionIcon ?? '')} variant="primary" action="StepFlowOrbital.StepFlowReview.ADVANCE" label={String(fields?.primaryActionLabel ?? '')} /></Stack></Stack>) : (<Stack gap="lg" direction="vertical"><Stack align="center" direction="horizontal" gap="sm"><Icon name="shield-check" /><Typography variant="h3" content="Review" /></Stack><WizardProgress currentStep={fields?.currentStepIndex ?? 0} steps={fields?.wizardSteps} allowNavigation={false} /><Card look="elevated"><Stack gap="md" direction="vertical"><Stack align="center" gap="sm" direction="horizontal"><Icon size="lg" name={String(fields?.currentStepIcon ?? '')} /><Stack direction="vertical" gap="xs"><Typography variant="h2" content={String(fields?.currentStepLabel ?? '')} /><Typography variant="body" content={String(fields?.currentStepDescription ?? '')} color="muted" /></Stack></Stack></Stack></Card><Stack gap="sm" align="center" direction="horizontal"><Button disabled={fields?.isFirstStep} label="Back" action="StepFlowOrbital.StepFlowReview.BACK" icon="chevron-left" variant="ghost" actionPayload={{id: fields?.id}} /><Button icon="x" variant="ghost" action="StepFlowOrbital.StepFlowReview.REJECT" label="Reject" actionPayload={{id: fields?.id}} /><Button variant="ghost" label="Escalate" icon="alert-triangle" action="StepFlowOrbital.StepFlowReview.ESCALATE" actionPayload={{id: fields?.id}} /><Button variant="primary" actionPayload={{id: fields?.id}} icon={String(fields?.primaryActionIcon ?? '')} action="StepFlowOrbital.StepFlowReview.ADVANCE" label={String(fields?.primaryActionLabel ?? '')} /></Stack></Stack>)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'rejected') {
    return (
      <TraitScopeProvider orbital="StepFlowOrbital" trait="StepFlowReview"><UISlotComponent slot="main" pattern="stack" sourceTrait="StepFlowReview"><Stack direction="vertical" gap="lg" align="center"><Icon name="x-circle" size="lg" /><Typography content="Rejected" variant="h2" align="center" /><Card look="elevated"><Stack gap="sm" direction="vertical"><Typography content="Reason" variant="caption" color="muted" /><Typography content={String(fields?.rejectionReason ?? '')} variant="body" /></Stack></Card><Button variant="secondary" actionPayload={{id: fields?.id}} action="StepFlowOrbital.StepFlowReview.RESTART" icon="rotate-ccw" label="Start a new review" /></Stack></UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'escalated') {
    return (
      <TraitScopeProvider orbital="StepFlowOrbital" trait="StepFlowReview"><UISlotComponent slot="main" pattern="stack" sourceTrait="StepFlowReview"><Stack align="center" direction="vertical" gap="lg"><Icon name="alert-triangle" size="lg" /><Typography align="center" content="Escalated" variant="h2" /><Typography color="muted" align="center" content="This item has been escalated for further review." variant="body" /><Button label="Start a new review" actionPayload={{id: fields?.id}} action="StepFlowOrbital.StepFlowReview.RESTART" variant="secondary" icon="rotate-ccw" /></Stack></UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'error') {
    return (
      <TraitScopeProvider orbital="StepFlowOrbital" trait="StepFlowReview"><UISlotComponent slot="main" pattern="error-state" sourceTrait="StepFlowReview">{lastEvent === 'StepItemsLoadFailed' ? (<ErrorState title="Failed to load" message={String(fields?.errorMessage ?? '')} />) : lastEvent === 'StepItemsSaveFailed' ? (<ErrorState title="Save failed" message={String(fields?.errorMessage ?? '')} />) : (<ErrorState title="Failed to load" message={String(fields?.errorMessage ?? '')} />)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'approved') {
    return (
      <TraitScopeProvider orbital="StepFlowOrbital" trait="StepFlowReview"><UISlotComponent slot="main" pattern="stack" sourceTrait="StepFlowReview"><Stack direction="vertical" gap="lg" align="center"><Icon size="lg" name="check-circle" /><Typography content="Approved" align="center" variant="h2" /><Typography color="muted" align="center" content="All review steps completed successfully." variant="body" /><WizardProgress currentStep={fields?.totalSteps ?? 0} steps={fields?.wizardSteps} allowNavigation={false} /><Button action="StepFlowOrbital.StepFlowReview.RESTART" label="Start a new review" variant="secondary" icon="rotate-ccw" actionPayload={{id: fields?.id}} /></Stack></UISlotComponent></TraitScopeProvider>
    );
  }

  return null;
}

export default StepFlowReviewView;
