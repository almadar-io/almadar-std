/**
 * WizardFormView
 *
 * Functional component — logic + state-based JSX rendering.
 *
 * @generated from schema
 * @trait WizardForm
 */

import { useWizardFormLogic } from '@/hooks/traits/useWizardFormLogic';
import type { WizardFormConfig } from '@/hooks/traits/useWizardFormLogic';
import type { EntityRow, FieldValue } from '@almadar/core';
import type { WizardView } from '@app/shared';
import { WizardProgress } from '@almadar/ui/components';
import { LoadingState } from '@almadar/ui/components';
import { Divider } from '@almadar/ui/components';
import { Stack } from '@almadar/ui/components';
import { Typography } from '@almadar/ui/components';
import { Card } from '@almadar/ui/components';
import { Icon } from '@almadar/ui/components';
import { Form } from '@almadar/ui/components';
import { ErrorState } from '@almadar/ui/components';
import { Button } from '@almadar/ui/components';
import { UISlotComponent } from '@almadar/ui/components';
import { TraitScopeProvider } from '@almadar/ui/providers';

interface WizardFormViewProps {
  config?: WizardFormConfig;
}

export function WizardFormView({ config: propsConfig }: WizardFormViewProps) {
  const { state, data, lastPayload, lastEvent, loading, error, fields, dispatch, actions, config } = useWizardFormLogic(propsConfig);

  // Entity collection from server response data
  const entity: EntityRow[] = data['WizardView'] ?? [];
  // Payload from last event (for @payload bindings in render-ui)
  const payload = lastPayload;

  if (state === 'error') {
    return (
      <TraitScopeProvider orbital="WizardOrbital" trait="WizardForm"><UISlotComponent slot="main" pattern="error-state" sourceTrait="WizardForm">{lastEvent === 'WizardLoadFailed' ? (<ErrorState title="Failed to load" message={String(fields?.errorMessage ?? '')} />) : lastEvent === 'WizardSaveFailed' ? (<ErrorState message={String(fields?.errorMessage ?? '')} title="Save failed" />) : (<ErrorState title="Failed to load" message={String(fields?.errorMessage ?? '')} />)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'cancelled') {
    return (
      <TraitScopeProvider orbital="WizardOrbital" trait="WizardForm"><UISlotComponent slot="main" pattern="stack" sourceTrait="WizardForm"><Stack align="center" gap="lg" direction="vertical"><Icon size="lg" name="x-circle" /><Typography content="Cancelled" align="center" variant="h2" /><Typography align="center" variant="body" content="The wizard was cancelled. No data was submitted." color="muted" /><Button variant="secondary" label="Start a new wizard" action="WizardOrbital.WizardForm.RESTART" icon="rotate-ccw" /></Stack></UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'completed') {
    return (
      <TraitScopeProvider orbital="WizardOrbital" trait="WizardForm"><UISlotComponent slot="main" pattern="stack" sourceTrait="WizardForm"><Stack direction="vertical" align="center" gap="lg"><Icon size="lg" name="check-circle" /><Typography variant="h2" content="Complete" align="center" /><Typography color="muted" content={String(fields?.completionMessage ?? '')} variant="body" align="center" /><WizardProgress allowNavigation={false} steps={fields?.wizardSteps} currentStep={fields?.totalSteps ?? 0} /><Button label="Start a new wizard" icon="rotate-ccw" action="WizardOrbital.WizardForm.RESTART" variant="secondary" /></Stack></UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'running') {
    return (
      <TraitScopeProvider orbital="WizardOrbital" trait="WizardForm"><UISlotComponent slot="main" pattern="stack" sourceTrait="WizardForm">{lastEvent === 'WizardLoaded' ? (<Stack direction="vertical" gap="lg"><Stack gap="sm" direction="horizontal" align="center"><Icon name="list-checks" /><Typography content="Wizard" variant="h3" /></Stack><WizardProgress currentStep={fields?.currentStepIndex ?? 0} allowNavigation={false} steps={fields?.wizardSteps} /><Card look="elevated"><Stack direction="vertical" gap="md"><Stack align="center" gap="sm" direction="horizontal"><Icon name={String(fields?.currentStepIcon ?? '')} size="lg" /><Stack direction="vertical" gap="xs"><Typography content={String(fields?.currentStepLabel ?? '')} variant="h2" /><Typography variant="body" color="muted" content={String(fields?.currentStepDescription ?? '')} /></Stack></Stack><Divider /><Form entity={(entity) as readonly EntityRow[]} cancelEvent="WizardOrbital.WizardForm.CANCEL" mode="edit" showCancel={false} showSubmit={false} submitEvent="WizardOrbital.WizardForm.ADVANCE" fields={[]} /></Stack></Card><Stack gap="sm" direction="horizontal" align="center"><Button disabled={fields?.isFirstStep} variant="ghost" label="Back" action="WizardOrbital.WizardForm.RETREAT" icon="chevron-left" /><Button label="Cancel wizard" variant="ghost" icon="x" action="WizardOrbital.WizardForm.CANCEL" /><Button action="WizardOrbital.WizardForm.ADVANCE" icon={String(fields?.primaryActionIcon ?? '')} label={String(fields?.primaryActionLabel ?? '')} variant="primary" /></Stack></Stack>) : lastEvent === 'ADVANCE' ? (<Stack direction="vertical" gap="lg"><Stack gap="sm" align="center" direction="horizontal"><Icon name="list-checks" /><Typography variant="h3" content="Wizard" /></Stack><WizardProgress allowNavigation={false} currentStep={fields?.currentStepIndex ?? 0} steps={fields?.wizardSteps} /><Card look="elevated"><Stack direction="vertical" gap="md"><Stack direction="horizontal" gap="sm" align="center"><Icon size="lg" name={String(fields?.currentStepIcon ?? '')} /><Stack direction="vertical" gap="xs"><Typography content={String(fields?.currentStepLabel ?? '')} variant="h2" /><Typography variant="body" color="muted" content={String(fields?.currentStepDescription ?? '')} /></Stack></Stack><Divider /><Form entity={(entity) as readonly EntityRow[]} showCancel={false} mode="edit" submitEvent="WizardOrbital.WizardForm.ADVANCE" showSubmit={false} cancelEvent="WizardOrbital.WizardForm.CANCEL" fields={[]} /></Stack></Card><Stack direction="horizontal" align="center" gap="sm"><Button label="Back" variant="ghost" disabled={fields?.isFirstStep} icon="chevron-left" action="WizardOrbital.WizardForm.RETREAT" /><Button action="WizardOrbital.WizardForm.CANCEL" variant="ghost" label="Cancel wizard" icon="x" /><Button action="WizardOrbital.WizardForm.ADVANCE" icon={String(fields?.primaryActionIcon ?? '')} label={String(fields?.primaryActionLabel ?? '')} variant="primary" /></Stack></Stack>) : lastEvent === 'RETREAT' ? (<Stack direction="vertical" gap="lg"><Stack gap="sm" align="center" direction="horizontal"><Icon name="list-checks" /><Typography variant="h3" content="Wizard" /></Stack><WizardProgress allowNavigation={false} steps={fields?.wizardSteps} currentStep={fields?.currentStepIndex ?? 0} /><Card look="elevated"><Stack gap="md" direction="vertical"><Stack gap="sm" align="center" direction="horizontal"><Icon name={String(fields?.currentStepIcon ?? '')} size="lg" /><Stack direction="vertical" gap="xs"><Typography content={String(fields?.currentStepLabel ?? '')} variant="h2" /><Typography color="muted" variant="body" content={String(fields?.currentStepDescription ?? '')} /></Stack></Stack><Divider /><Form entity={(entity) as readonly EntityRow[]} submitEvent="WizardOrbital.WizardForm.ADVANCE" mode="edit" showCancel={false} cancelEvent="WizardOrbital.WizardForm.CANCEL" showSubmit={false} fields={[]} /></Stack></Card><Stack direction="horizontal" align="center" gap="sm"><Button variant="ghost" icon="chevron-left" action="WizardOrbital.WizardForm.RETREAT" label="Back" disabled={fields?.isFirstStep} /><Button action="WizardOrbital.WizardForm.CANCEL" icon="x" variant="ghost" label="Cancel wizard" /><Button icon={String(fields?.primaryActionIcon ?? '')} variant="primary" action="WizardOrbital.WizardForm.ADVANCE" label={String(fields?.primaryActionLabel ?? '')} /></Stack></Stack>) : (<Stack direction="vertical" gap="lg"><Stack gap="sm" align="center" direction="horizontal"><Icon name="list-checks" /><Typography content="Wizard" variant="h3" /></Stack><WizardProgress steps={fields?.wizardSteps} currentStep={fields?.currentStepIndex ?? 0} allowNavigation={false} /><Card look="elevated"><Stack direction="vertical" gap="md"><Stack gap="sm" align="center" direction="horizontal"><Icon name={String(fields?.currentStepIcon ?? '')} size="lg" /><Stack direction="vertical" gap="xs"><Typography variant="h2" content={String(fields?.currentStepLabel ?? '')} /><Typography color="muted" variant="body" content={String(fields?.currentStepDescription ?? '')} /></Stack></Stack><Divider /><Form entity={(entity) as readonly EntityRow[]} submitEvent="WizardOrbital.WizardForm.ADVANCE" showSubmit={false} cancelEvent="WizardOrbital.WizardForm.CANCEL" showCancel={false} mode="edit" fields={[]} /></Stack></Card><Stack direction="horizontal" gap="sm" align="center"><Button variant="ghost" disabled={fields?.isFirstStep} action="WizardOrbital.WizardForm.RETREAT" icon="chevron-left" label="Back" /><Button variant="ghost" icon="x" label="Cancel wizard" action="WizardOrbital.WizardForm.CANCEL" /><Button icon={String(fields?.primaryActionIcon ?? '')} action="WizardOrbital.WizardForm.ADVANCE" variant="primary" label={String(fields?.primaryActionLabel ?? '')} /></Stack></Stack>)}</UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'loading') {
    return (
      <TraitScopeProvider orbital="WizardOrbital" trait="WizardForm"><UISlotComponent slot="main" pattern="loading-state" sourceTrait="WizardForm">{lastEvent === 'WizardSaved' ? (<LoadingState title="Refreshing…" />) : lastEvent === 'RESTART' ? (<LoadingState title="Restarting…" />) : (<LoadingState title="Loading wizard…" />)}</UISlotComponent></TraitScopeProvider>
    );
  }

  return null;
}

export default WizardFormView;
