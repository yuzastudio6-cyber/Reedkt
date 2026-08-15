import type { CanonicalWorkItemInput } from '../../../validation/edit-planning-authority-schemas'

import { BROLL_PROVIDER_ROUTE_ID } from './b-roll-provider-authority-v5'

/**
 * Projects the canonical JSON candidate-manifest work item into the immutable
 * Gemini Omni V5 worker package's private raw-media output contract. The raw
 * MP4 role remains provider-private and is never registered as an active
 * public edit-skill artifact.
 */
export function projectCanonicalBrollWorkItemForImmutableGeminiOmniV5(
  input: CanonicalWorkItemInput,
) {
  const output = input.expectedOutputs[0]
  if (
    input.workItemType !== 'custom' ||
    input.workerClass !== 'provider_worker' ||
    input.approvedProviderRoute !== BROLL_PROVIDER_ROUTE_ID ||
    input.providerExecutionMode !== 'primary' ||
    input.expectedOutputs.length !== 1 ||
    output?.artifactType !== 'b_roll_candidate_media_manifest_v1' ||
    output.contentType !== 'application/json' ||
    output.assetRole !== 'generated' ||
    !output.required ||
    output.previewPlaceholderAllowed
  ) throw new Error('Gemini Omni V5 work projection rejected stale canonical B-roll work.')
  return {
    ...input,
    expectedOutputs: [{
      ...output,
      artifactType: 'provider_b_roll_candidate_video_mp4' as const,
      contentType: 'video/mp4' as const,
    }],
  }
}
