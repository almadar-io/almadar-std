/**
 * RatingReviewSubmitView
 *
 * Functional component — logic + state-based JSX rendering.
 *
 * @generated from schema
 * @trait RatingReviewSubmit
 */

import { useRatingReviewSubmitLogic } from '@/hooks/traits/useRatingReviewSubmitLogic';
import type { RatingReviewSubmitConfig } from '@/hooks/traits/useRatingReviewSubmitLogic';
import type { EntityRow, FieldValue } from '@almadar/core';
import type { ReviewView } from '@app/shared';
import { Stack } from '@almadar/ui/components';
import { Form } from '@almadar/ui/components';
import { ErrorState } from '@almadar/ui/components';
import { StarRating } from '@almadar/ui/components';
import { Icon } from '@almadar/ui/components';
import { Typography } from '@almadar/ui/components';
import { Card } from '@almadar/ui/components';
import { UISlotComponent } from '@almadar/ui/components';
import { TraitScopeProvider } from '@almadar/ui/providers';

interface RatingReviewSubmitViewProps {
  config?: RatingReviewSubmitConfig;
}

export function RatingReviewSubmitView({ config: propsConfig }: RatingReviewSubmitViewProps) {
  const { state, data, lastPayload, lastEvent, loading, error, fields, dispatch, actions, config } = useRatingReviewSubmitLogic(propsConfig);

  // Entity collection from server response data
  const entity: EntityRow[] = data['ReviewView'] ?? [];
  // Payload from last event (for @payload bindings in render-ui)
  const payload = lastPayload;

  if (state === 'submitting') {
    return (
      <TraitScopeProvider orbital="RatingReviewOrbital" trait="RatingReviewSubmit"><UISlotComponent slot="main" pattern="stack" sourceTrait="RatingReviewSubmit"><Stack gap="md" align="center" direction="vertical"><Icon name="send" size="lg" /><Typography variant="h3" content="Submitting…" /></Stack></UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'submitted') {
    return (
      <TraitScopeProvider orbital="RatingReviewOrbital" trait="RatingReviewSubmit"><UISlotComponent slot="main" pattern="stack" sourceTrait="RatingReviewSubmit"><Stack gap="lg" direction="vertical" align="center"><Icon size="lg" name="check-circle" /><Typography content="Thanks for your review!" variant="h2" /></Stack></UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'error') {
    return (
      <TraitScopeProvider orbital="RatingReviewOrbital" trait="RatingReviewSubmit"><UISlotComponent slot="main" pattern="error-state" sourceTrait="RatingReviewSubmit"><ErrorState title="Submit failed" message={String(fields?.errorMessage ?? '')} /></UISlotComponent></TraitScopeProvider>
    );
  } else if (state === 'composing') {
    return (
      <TraitScopeProvider orbital="RatingReviewOrbital" trait="RatingReviewSubmit"><UISlotComponent slot="main" pattern="card" sourceTrait="RatingReviewSubmit">{lastEvent === 'RATE_DRAFT' ? (<Card look={config?.cardLook}><Stack gap="md" direction="vertical"><Typography variant="h3" content="Write a review" /><StarRating action="RatingReviewOrbital.RatingReviewSubmit.RATE_DRAFT" value={fields?.draftRating ?? 0} max={5} /><Form entity={(entity) as readonly EntityRow[]} fields={[{ name: "draftComment", label: "DraftComment", type: "string", required: true }]} mode="edit" submitEvent="RatingReviewOrbital.RatingReviewSubmit.SUBMIT_REVIEW" cancelEvent="RatingReviewOrbital.RatingReviewSubmit.CANCEL_REVIEW" submitLabel="Submit review" /></Stack></Card>) : lastEvent === 'CANCEL_REVIEW' ? (<Card look={config?.cardLook}><Stack direction="vertical" gap="md"><Typography content="Write a review" variant="h3" /><StarRating max={5} value={0} action="RatingReviewOrbital.RatingReviewSubmit.RATE_DRAFT" /><Form entity={(entity) as readonly EntityRow[]} cancelEvent="RatingReviewOrbital.RatingReviewSubmit.CANCEL_REVIEW" fields={[{ name: "draftComment", label: "DraftComment", type: "string", required: true }]} submitLabel="Submit review" mode="edit" submitEvent="RatingReviewOrbital.RatingReviewSubmit.SUBMIT_REVIEW" /></Stack></Card>) : lastEvent === 'RESTART' ? (<Card look={config?.cardLook}><Stack direction="vertical" gap="md"><Typography variant="h3" content="Write a review" /><StarRating max={5} action="RatingReviewOrbital.RatingReviewSubmit.RATE_DRAFT" value={0} /><Form entity={(entity) as readonly EntityRow[]} submitLabel="Submit review" cancelEvent="RatingReviewOrbital.RatingReviewSubmit.CANCEL_REVIEW" submitEvent="RatingReviewOrbital.RatingReviewSubmit.SUBMIT_REVIEW" fields={[{ name: "draftComment", label: "DraftComment", type: "string", required: true }]} mode="edit" /></Stack></Card>) : (<Card look={config?.cardLook}><Stack gap="md" direction="vertical"><Typography variant="h3" content="Write a review" /><StarRating value={fields?.draftRating ?? 0} action="RatingReviewOrbital.RatingReviewSubmit.RATE_DRAFT" max={5} /><Form entity={(entity) as readonly EntityRow[]} cancelEvent="RatingReviewOrbital.RatingReviewSubmit.CANCEL_REVIEW" submitLabel="Submit review" fields={[{ name: "draftComment", label: "DraftComment", type: "string", required: true }]} submitEvent="RatingReviewOrbital.RatingReviewSubmit.SUBMIT_REVIEW" mode="edit" /></Stack></Card>)}</UISlotComponent></TraitScopeProvider>
    );
  }

  return null;
}

export default RatingReviewSubmitView;
