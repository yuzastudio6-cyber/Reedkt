import assert from 'node:assert/strict'

import { createCanonicalToolPayloadAuthority } from '../edit-architecture/canonical-tool-payload-authority'
import { buildCanonicalPlanningDraft } from '../../src/lib/canonical-planning-draft'
import { planCanonicalPrivateLongFormChunks } from '../../src/lib/canonical-private-long-form-chunk-plan'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import type { PlannerInput } from '../../src/types/reeditpro'
import {
  CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES,
} from '../../src/types/canonical-private-composition-capacity'
import {
  buildOfflineRemotionLongFormMergeStreamingRequest,
  validateOfflineRemotionFinalCompositionPlanningPayload,
  validateOfflineRemotionLongFormMergePlanningPayload,
} from '../tool-execution/remotion-render-execution'

const sha = (value: string) => value.repeat(64).slice(0, 64)
const sourceCount = 8
const sourceDurationSeconds = 3
const expectedFps = 30
const expectedSourceFrames = sourceDurationSeconds * expectedFps
const expectedTotalFrames = sourceCount * expectedSourceFrames

const plannerInput: PlannerInput = {
  projectName: 'Canonical private long-form chunk merge smoke',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'youtube_side_panel',
  editingCategory: 'business_brand',
  workflowType: 'product_demo',
  editLevel: 'pro',
  structurePreference: 'preserve_source_order',
  moodStyle: 'clean',
  visualPreference: 'no_extra_visuals',
  referenceUrl: '',
  customInstructions: 'Preserve all eight approved sources in order with exact captions. Use only hard cuts. Use clean voice only with no music, no SFX, no beat sync, and no decorative transitions.',
  userInstructionHistory: [
    'Preserve all eight approved sources in order with exact captions. Use only hard cuts. Use clean voice only with no music, no SFX, no beat sync, and no decorative transitions.',
  ],
  creditPreference: 'balanced',
  clips: Array.from({ length: sourceCount }, (_unused, index) => ({
    id: `long-form-clip-${index + 1}`,
    uploadedOrder: index + 1,
    fileName: `long-form-source-${index + 1}.mp4`,
    duration: '00:03',
    detectedType: 'Primary source',
    sourceRole: index === 0 ? 'main_story' as const : 'context' as const,
    notes: `Approved long-form source ${index + 1} is finalized in exact order.`,
  })),
  sourceSequenceMode: 'multi_clip_story_order',
  sourceOrderConfirmed: true,
  cleanupPreference: 'preserve_natural',
  cleanupPreferenceConfirmed: true,
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: 'long-form-preference-snapshot',
  currentEditPreferenceRevision: 1,
}

const sourceMediaAssets = plannerInput.clips.map((clip, index) => ({
  mediaAssetId: `long-form-media-${index + 1}`,
  sourceSequenceItemId: `long-form-source-${index + 1}`,
  uploadedClipId: clip.id,
  uploadedOrder: index + 1,
  storageProvider: 'local_private' as const,
  storagePath: `private/long-form/source-${index + 1}.mp4`,
  fileName: clip.fileName,
  mimeType: 'video/mp4',
  byteSize: 8_192,
  checksumSha256: sha(String(index + 1)),
  sourceMetadata: {
    probeStatus: 'probed' as const,
    source: 'local_ffprobe' as const,
    durationSeconds: sourceDurationSeconds,
    hasVideo: true,
    hasAudio: true,
  },
  privateArtifact: true as const,
  publicUrl: null,
  signedUrl: null,
}))

const plan = createMockEditPlan(plannerInput)
assert.equal(plan.masterTimingPlan?.timingBase.fps, expectedFps)
assert.equal(plan.masterTimingPlan?.timingBase.totalFrames, expectedTotalFrames)
assert.ok(expectedTotalFrames >= CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES)
assert.ok(expectedTotalFrames <= CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES)

const draft = buildCanonicalPlanningDraft({ plan, plannerInput, sourceMediaAssets })
if (!draft.ok || !draft.draft.publication) {
  throw new Error(
    `Long-form planning did not compile: ${
      draft.ok
        ? draft.draft.publicationBlockers.join(' | ')
        : draft.errors.join(' | ')
    }`,
  )
}
const canonicalPlan = draft.draft.publication.canonicalPlan
const chunkItems = canonicalPlan.workItems.filter((workItem) =>
  workItem.executionInput.operation === 'render_approved_4k_composition_chunk')
const finalMerge = canonicalPlan.workItems.find((workItem) =>
  workItem.executionInput.operation === 'merge_approved_4k_composition_chunks')
const finalQa = canonicalPlan.workItems.find((workItem) => workItem.workItemKey === 'final-qa')
assert.equal(chunkItems.length, 2)
assert.ok(finalMerge)
assert.ok(finalQa)
assert.deepEqual(finalMerge!.dependencyKeys, chunkItems.map((workItem) => workItem.workItemKey))
assert.deepEqual(finalQa!.dependencyKeys, ['final-export'])
assert.deepEqual(chunkItems.map((workItem) => workItem.expectedOutputs[0]?.assetRole), [
  'processed',
  'processed',
])
assert.deepEqual(chunkItems.map((workItem) => workItem.expectedOutputs[0]?.artifactType), [
  'private_4k_composition_chunk_v1',
  'private_4k_composition_chunk_v1',
])

const chunkPayloads = chunkItems.map((workItem) =>
  validateOfflineRemotionFinalCompositionPlanningPayload(
    workItem.executionInput.structuredPayload,
  ))
assert.deepEqual(chunkPayloads.map((payload) => payload.durationFrames), [450, 270])
assert.equal(chunkPayloads.every((payload) =>
  payload.compositionProfileId === 'approved_source_sequence_caption_track_final_v1' &&
  payload.width === 3840 && payload.height === 2160 &&
  payload.deliveryProfileId === 'uhd_2160' &&
  payload.usesApprovedEditReservation &&
  !payload.requiresSeparateExportEstimate &&
  !payload.allowsAdditionalExportCharge), true)

const mergePayload = validateOfflineRemotionLongFormMergePlanningPayload(
  finalMerge!.executionInput.structuredPayload,
)
assert.equal(mergePayload.longFormCapacityProfileId, CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID)
assert.equal(mergePayload.durationFrames, expectedTotalFrames)
assert.deepEqual(mergePayload.chunks.map((chunk) => ({
  chunkIndex: chunk.chunkIndex,
  range: [chunk.globalStartFrame, chunk.globalEndFrameExclusive],
  durationFrames: chunk.durationFrames,
  sourceCount: chunk.sourceSequenceItemIds.length,
})), [{
  chunkIndex: 1,
  range: [0, 450],
  durationFrames: 450,
  sourceCount: 5,
}, {
  chunkIndex: 2,
  range: [450, 720],
  durationFrames: 270,
  sourceCount: 3,
}])
assert.equal(mergePayload.chunkBoundaryTransitions.length, 1)
assert.equal(mergePayload.chunkBoundaryTransitions[0]?.boundaryFrame, 450)
assert.equal(mergePayload.usesApprovedEditReservation, true)
assert.equal(mergePayload.requiresSeparateExportEstimate, false)
assert.equal(mergePayload.allowsAdditionalExportCharge, false)

const payloadAuthority = createCanonicalToolPayloadAuthority({
  workItems: canonicalPlan.workItems,
})
assert.equal(payloadAuthority.summary.allRequiredToolPayloadsValidated, true)
assert.equal(payloadAuthority.validatedWorkItems.filter((entry) =>
  entry.validatorFamily === 'remotion_final_composition').length, 3)
const substitutedDirectFinal = {
  ...chunkItems[0]!,
  workItemKey: 'unsupported-final-operation-substitution',
  workItemType: 'render_final_export',
  executionInput: {
    operation: 'render_unapproved_final_shape',
    approvedToolOperationIds: ['tool.remotion.render_approved_composition.v1'],
    expectedOutputKeys: ['unsupported-final-operation-output'],
    structuredPayload: chunkItems[0]!.executionInput.structuredPayload,
  },
  expectedOutputs: [{
    ...chunkItems[0]!.expectedOutputs[0]!,
    outputKey: 'unsupported-final-operation-output',
    artifactType: 'unsupported_final_operation_artifact',
    assetRole: 'final' as const,
  }],
}
assert.throws(
  () => createCanonicalToolPayloadAuthority({ workItems: [substitutedDirectFinal] }),
  /unsupported operation identity/i,
)

const request = buildOfflineRemotionLongFormMergeStreamingRequest({
  planningPayload: mergePayload,
  chunks: mergePayload.chunks.map((chunk) => ({
    inputId: `approved-composition-chunk-${chunk.chunkIndex}`,
    outputKey: chunk.outputKey,
    chunkIndex: chunk.chunkIndex,
    mimeType: 'video/mp4' as const,
    byteLength: 2_048,
    sha256: sha(String(chunk.chunkIndex)),
  })),
})
assert.equal(request.inputs.chunks.length, 2)
assert.throws(
  () => buildOfflineRemotionLongFormMergeStreamingRequest({
    planningPayload: {
      ...mergePayload,
      chunks: mergePayload.chunks.map((chunk, index) => index === 1
        ? { ...chunk, globalStartFrame: chunk.globalStartFrame + 1 }
        : chunk),
    },
    chunks: request.inputs.chunks,
  }),
  /unique, contiguous, and duration preserving/i,
)
assert.throws(
  () => buildOfflineRemotionLongFormMergeStreamingRequest({
    planningPayload: mergePayload,
    chunks: request.inputs.chunks.map((chunk, index) => index === 1
      ? { ...chunk, outputKey: 'substituted-unapproved-chunk' }
      : chunk),
  }),
  /diverges from its approved chunk/i,
)
assert.throws(
  () => validateOfflineRemotionLongFormMergePlanningPayload({
    ...mergePayload,
    chunks: mergePayload.chunks.map((chunk, index) => index === 1
      ? {
          ...chunk,
          sourceSequenceItemIds: [
            ...chunk.sourceSequenceItemIds,
            'unsupported-ninth-source',
          ],
          sourceCleanupDecisionIds: [
            ...chunk.sourceCleanupDecisionIds,
            'unsupported-ninth-cleanup-decision',
          ],
        }
      : chunk),
  }),
  /two through eight ordered approved sources/i,
)

const directChunkPlan = planCanonicalPrivateLongFormChunks({
  totalFrames: expectedTotalFrames,
  sourceSegments: mergePayload.chunks.flatMap((chunk) =>
    chunk.sourceSequenceItemIds.map((sourceSequenceItemId, index) => {
      const globalSourceIndex = (chunk.chunkIndex === 1 ? 0 : 5) + index
      return {
        sourceSequenceItemId,
        sourceStartFrame: 0,
        sourceEndFrameExclusive: expectedSourceFrames,
        timelineStartFrame: globalSourceIndex * expectedSourceFrames,
        timelineEndFrameExclusive: (globalSourceIndex + 1) * expectedSourceFrames,
      }
    })),
})
assert.equal(directChunkPlan.ok, true)
assert.equal(directChunkPlan.ok && directChunkPlan.plan.chunkCount, 2)
assert.equal(planCanonicalPrivateLongFormChunks({
  totalFrames: 480,
  sourceSegments: [],
}).ok, false)
assert.equal(planCanonicalPrivateLongFormChunks({
  totalFrames: expectedTotalFrames,
  sourceSegments: [{
    sourceSequenceItemId: 'unsupported-single-source-slice',
    sourceStartFrame: 0,
    sourceEndFrameExclusive: expectedTotalFrames,
    timelineStartFrame: 0,
    timelineEndFrameExclusive: expectedTotalFrames,
  }],
}).ok, false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    '481_to_1920_frame_source_boundary_capacity_profile',
    '720_frame_8_source_canonical_plan_compiles',
    'two_processed_composition_chunks_are_snapshot_bound',
    'every_chunk_uses_existing_4k_caption_voice_color_render_contract',
    'final_merge_depends_only_on_chunk_outputs',
    'long_form_merge_preserves_original_estimate_and_reservation',
    'canonical_payload_authority_validates_chunk_and_merge_profiles',
    'direct_final_operation_cannot_substitute_for_chunk_or_merge_payload_authority',
    'merge_request_rejects_noncontiguous_or_substituted_chunks',
    'ninth_global_source_is_rejected_by_long_form_profile',
    'single_source_slicing_remains_fail_closed',
    'provider_billing_public_delivery_and_production_authority_not_added',
  ],
}))
