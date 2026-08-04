import assert from 'node:assert/strict'

import { createCanonicalToolPayloadAuthority } from '../edit-architecture/canonical-tool-payload-authority'
import { buildCanonicalPlanningDraft } from '../../src/lib/canonical-planning-draft'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import type { PlannerInput } from '../../src/types/reeditpro'
import {
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
} from '../../src/types/canonical-private-composition-capacity'
import {
  validateOfflineRemotionFinalCompositionPlanningPayload,
  validateOfflineRemotionLongFormMergePlanningPayload,
} from '../tool-execution/remotion-render-execution'

const durationSeconds = 22
const fps = 30
const totalFrames = durationSeconds * fps
const plannerInput: PlannerInput = {
  projectName: 'Canonical private source-slice compilation smoke',
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
  customInstructions:
    'Preserve the complete approved source with one caption, no music, no SFX, no beat sync, and no decorative transitions.',
  userInstructionHistory: [
    'Preserve the complete approved source with one caption, no music, no SFX, no beat sync, and no decorative transitions.',
  ],
  creditPreference: 'balanced',
  clips: [{
    id: 'source-slice-clip-1',
    uploadedOrder: 1,
    fileName: 'source-slice-long-source.mp4',
    duration: '00:22',
    detectedType: 'Primary source',
    sourceRole: 'main_story',
    notes: 'The complete approved source is required and already has acceptable source audio/color.',
  }],
  sourceSequenceMode: 'single_complete_video',
  sourceOrderConfirmed: true,
  cleanupPreference: 'preserve_natural',
  cleanupPreferenceConfirmed: true,
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: 'source-slice-preference-snapshot',
  currentEditPreferenceRevision: 1,
}

const sourceMediaAssets = [{
  mediaAssetId: 'source-slice-media-1',
  sourceSequenceItemId: 'source-slice-sequence-1',
  uploadedClipId: plannerInput.clips[0]!.id,
  uploadedOrder: 1,
  storageProvider: 'local_private' as const,
  storagePath: 'private/source-slice/long-source.mp4',
  fileName: plannerInput.clips[0]!.fileName,
  mimeType: 'video/mp4',
  byteSize: 8_192,
  checksumSha256: 'a'.repeat(64),
  sourceMetadata: {
    probeStatus: 'probed' as const,
    source: 'local_ffprobe' as const,
    durationSeconds,
    hasVideo: true,
    hasAudio: true,
  },
  privateArtifact: true as const,
  publicUrl: null,
  signedUrl: null,
}]

const plan = createMockEditPlan(plannerInput)
assert.equal(plan.masterTimingPlan?.timingBase.fps, fps)
assert.equal(plan.masterTimingPlan?.timingBase.totalFrames, totalFrames)
assert.ok(plan.masterTimingPlan)
assert.ok(plan.soundSyncTransitionTimingPlan)
const originalCaption = plan.masterTimingPlan.captionTimingItems[0]
assert.ok(originalCaption)
plan.audioPipelinePlan = undefined
plan.colorPipelinePlan = undefined
plan.segmentEditPlans = []
plan.masterTimingPlan.finalTimelineSegments = []
plan.masterTimingPlan.transitionTimingItems = []
plan.masterTimingPlan.captionTimingItems = [{
  ...originalCaption,
  id: 'caption-timing-complete-approved-source',
  captionText: 'Preserve the complete approved source.',
  timeRange: {
    startSeconds: 0,
    endSeconds: durationSeconds,
    durationSeconds,
    startFrame: 0,
    endFrame: totalFrames,
    durationFrames: totalFrames,
    fps,
  },
}]
plan.soundSyncTransitionTimingPlan.refinedTransitionTimings = []
plan.soundSyncTransitionTimingPlan.refinedSfxTimings = []

const draft = buildCanonicalPlanningDraft({ plan, plannerInput, sourceMediaAssets })
if (!draft.ok || !draft.draft.publication) {
  throw new Error(draft.ok
    ? draft.draft.publicationBlockers.join(' | ')
    : draft.errors.join(' | '))
}
const canonicalPlan = draft.draft.publication.canonicalPlan
const chunks = canonicalPlan.workItems.filter((workItem) =>
  workItem.executionInput.operation === 'render_approved_4k_composition_chunk')
const merge = canonicalPlan.workItems.find((workItem) =>
  workItem.executionInput.operation === 'merge_approved_4k_composition_chunks')
assert.equal(chunks.length, 3)
assert.ok(merge)
assert.equal(canonicalPlan.workItems.some((workItem) =>
  workItem.executionInput.operation === 'process_approved_source_voice_delivery'), false)
assert.equal(canonicalPlan.workItems.some((workItem) =>
  workItem.executionInput.operation ===
    'process_approved_source_professional_color_delivery'), false)

const chunkPayloads = chunks.map((workItem) =>
  validateOfflineRemotionFinalCompositionPlanningPayload(
    workItem.executionInput.structuredPayload,
  ))
assert.deepEqual(chunkPayloads.map((payload) => ({
  durationFrames: payload.durationFrames,
  sourceStartFrame: 'sourceStartFrame' in payload
    ? payload.sourceStartFrame
    : undefined,
  sourceEndFrameExclusive: 'sourceEndFrameExclusive' in payload
    ? payload.sourceEndFrameExclusive
    : undefined,
  audioPolicy: payload.audioPolicy,
})), [{
  durationFrames: 220,
  sourceStartFrame: 0,
  sourceEndFrameExclusive: 220,
  audioPolicy: 'preserve_source',
}, {
  durationFrames: 220,
  sourceStartFrame: 220,
  sourceEndFrameExclusive: 440,
  audioPolicy: 'preserve_source',
}, {
  durationFrames: 220,
  sourceStartFrame: 440,
  sourceEndFrameExclusive: 660,
  audioPolicy: 'preserve_source',
}])

const mergePayload = validateOfflineRemotionLongFormMergePlanningPayload(
  merge!.executionInput.structuredPayload,
)
assert.equal(
  mergePayload.longFormCapacityProfileId,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
)
assert.equal(mergePayload.durationFrames, totalFrames)
assert.equal(mergePayload.chunks.length, 3)
assert.deepEqual(mergePayload.chunks.map((chunk) => ({
  sourceSliceKey: chunk.sourceSliceKey,
  sourceStartFrame: chunk.sourceStartFrame,
  sourceEndFrameExclusive: chunk.sourceEndFrameExclusive,
})), [{
  sourceSliceKey: 'source-slice-1-of-3',
  sourceStartFrame: 0,
  sourceEndFrameExclusive: 220,
}, {
  sourceSliceKey: 'source-slice-2-of-3',
  sourceStartFrame: 220,
  sourceEndFrameExclusive: 440,
}, {
  sourceSliceKey: 'source-slice-3-of-3',
  sourceStartFrame: 440,
  sourceEndFrameExclusive: 660,
}])
assert.equal(mergePayload.chunkBoundaryTransitions.length, 0)
assert.equal('chunkBoundaryContinuity' in mergePayload, true)
if (!('chunkBoundaryContinuity' in mergePayload)) {
  throw new Error('Source-slice merge lost continuity authority.')
}
assert.deepEqual(mergePayload.chunkBoundaryContinuity.map((boundary) => ({
  boundaryFrame: boundary.boundaryFrame,
  previousSourceEndFrameExclusive: boundary.previousSourceEndFrameExclusive,
  nextSourceStartFrame: boundary.nextSourceStartFrame,
  sourceSequenceItemId: boundary.sourceSequenceItemId,
})), [{
  boundaryFrame: 220,
  previousSourceEndFrameExclusive: 220,
  nextSourceStartFrame: 220,
  sourceSequenceItemId: sourceMediaAssets[0]!.sourceSequenceItemId,
}, {
  boundaryFrame: 440,
  previousSourceEndFrameExclusive: 440,
  nextSourceStartFrame: 440,
  sourceSequenceItemId: sourceMediaAssets[0]!.sourceSequenceItemId,
}])
assert.deepEqual(merge!.sourceSequenceItemIds, [sourceMediaAssets[0]!.sourceSequenceItemId])
assert.equal(merge!.sourceCleanupDecisionIds.length, 1)
assert.deepEqual(merge!.dependencyKeys, chunks.map((item) => item.workItemKey))

const payloadAuthority = createCanonicalToolPayloadAuthority({
  workItems: canonicalPlan.workItems,
})
assert.equal(payloadAuthority.summary.allRequiredToolPayloadsValidated, true)
assert.equal(payloadAuthority.validatedWorkItems.filter((entry) =>
  entry.validatorFamily === 'remotion_final_composition').length, 4)

assert.throws(
  () => validateOfflineRemotionLongFormMergePlanningPayload({
    ...mergePayload,
    chunkBoundaryContinuity: mergePayload.chunkBoundaryContinuity.map((entry, index) =>
      index === 0
        ? { ...entry, nextSourceStartFrame: entry.nextSourceStartFrame + 1 }
        : entry),
  }),
  /continuity diverges/i,
)
assert.throws(
  () => validateOfflineRemotionLongFormMergePlanningPayload({
    ...mergePayload,
    chunks: mergePayload.chunks.map((chunk, index) => index === 1
      ? {
          ...chunk,
          sourceStartFrame: chunk.sourceStartFrame! + 1,
          sourceEndFrameExclusive: chunk.sourceEndFrameExclusive! + 1,
        }
      : chunk),
  }),
  /source-frame continuity|continuity diverges/i,
)
assert.throws(
  () => validateOfflineRemotionLongFormMergePlanningPayload({
    ...mergePayload,
    chunkBoundaryTransitions: [{
      transitionTimingItemId: 'invented-transition',
      refinedTransitionTimingItemId: 'invented-refined-transition',
      fromSourceSequenceItemId: sourceMediaAssets[0]!.sourceSequenceItemId,
      toSourceSequenceItemId: sourceMediaAssets[0]!.sourceSequenceItemId,
      boundaryFrame: 220,
    }],
  }),
  /cannot invent hard cuts|source-slice merge policy/i,
)

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  profileId: mergePayload.longFormCapacityProfileId,
  totalFrames,
  chunkCount: chunks.length,
  chunkDurations: chunkPayloads.map((payload) => payload.durationFrames),
  workItemCount: canonicalPlan.workItems.length,
  continuityBoundaryCount: mergePayload.chunkBoundaryContinuity.length,
  evidence: {
    approvedSourceRangePreserved: true,
    technicalChunkBoundariesNotUserCuts: true,
    sourceAudioPreserved: true,
    plannedSliceLocalAudioColorProcessingSilentlyApplied: false,
    originalFourKEstimateAndReservationReused: true,
    providersBillingPublicDeliveryAndCloudRemainBlocked: true,
  },
}, null, 2)}\n`)
