import assert from 'node:assert/strict'
import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import type { PlannerInput } from '../../src/types/reeditpro'
import {
  compileCanonicalSourceLedPlan,
} from '../services/canonical-source-led-plan-compiler'
import type {
  EditBriefMarkerRecord,
  EditBriefRecord,
} from '../services/private-edit-brief-authority-store'

const sha = (character: string) => character.repeat(64).slice(0, 64)
const timestamp = '2026-07-28T15:00:00.000Z'

const plannerInput: PlannerInput = {
  projectName: 'Server source-led planning smoke',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'youtube_side_panel',
  editingCategory: 'business_brand',
  workflowType: 'simple_clean_edit',
  editLevel: 'basic',
  structurePreference: 'preserve_source_order',
  moodStyle: 'clean',
  visualPreference: 'no_extra_visuals',
  referenceUrl: '',
  customInstructions:
    'Preserve both source videos in order and render only the confirmed caption.',
  userInstructionHistory: [
    'Preserve both source videos in order and render only the confirmed caption.',
  ],
  creditPreference: 'balanced',
  clips: [{
    id: 'source-led-clip-1',
    uploadedOrder: 1,
    fileName: 'source-led-1.mp4',
    duration: '1',
    detectedType: 'Verified uploaded video',
    sourceRole: 'main_story',
    isImportant: true,
  }, {
    id: 'source-led-clip-2',
    uploadedOrder: 2,
    fileName: 'source-led-2.mp4',
    duration: '1',
    detectedType: 'Verified uploaded video',
    sourceRole: 'main_story',
    isImportant: true,
  }],
  sourceSequenceMode: 'multi_clip_story_order',
  sourceOrderConfirmed: true,
  cleanupPreference: 'preserve_natural',
  cleanupPreferenceConfirmed: true,
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: 'source-led-preference-snapshot',
  preferencePersistenceSource: 'authenticated_private_internal_backend',
  currentEditPreferenceAuthorityValues: {
    editLevel: 'basic',
    workflowType: 'simple_clean_edit',
    cleanupPreference: 'preserve_natural',
    visualPreference: 'no_extra_visuals',
    moodStyle: 'clean',
    creditPreference: 'balanced',
    targetPlatform: 'youtube',
  },
  currentEditPreferenceRecordRevision: 3,
  currentEditPreferenceRevision: 2,
  currentEditPreferencePlanningInputRevision: 2,
  currentEditPreferenceFingerprintSha256: sha('a'),
}

const sourceMediaAssets:
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] = [
    {
      mediaAssetId: 'source-led-media-1',
      storageObjectRecordId: 'source-led-object-1',
      sourceSequenceItemId: 'source-led-source-1',
      uploadedClipId: 'source-led-clip-1',
      uploadedOrder: 1,
      storageProvider: 'local_private',
      storageBucket: 'private-internal',
      storagePath: 'source-led/one.mp4',
      fileName: 'source-led-1.mp4',
      mimeType: 'video/mp4',
      byteSize: 4_096,
      checksumSha256: sha('1'),
      sourceMetadata: {
        probeStatus: 'probed',
        source: 'local_ffprobe',
        durationSeconds: 1,
        width: 1_920,
        height: 1_080,
        videoCodec: 'h264',
        audioCodec: 'aac',
        hasVideo: true,
        hasAudio: true,
      },
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    },
    {
      mediaAssetId: 'source-led-media-2',
      storageObjectRecordId: 'source-led-object-2',
      sourceSequenceItemId: 'source-led-source-2',
      uploadedClipId: 'source-led-clip-2',
      uploadedOrder: 2,
      storageProvider: 'local_private',
      storageBucket: 'private-internal',
      storagePath: 'source-led/two.mp4',
      fileName: 'source-led-2.mp4',
      mimeType: 'video/mp4',
      byteSize: 4_096,
      checksumSha256: sha('2'),
      sourceMetadata: {
        probeStatus: 'probed',
        source: 'local_ffprobe',
        durationSeconds: 1,
        width: 1_920,
        height: 1_080,
        videoCodec: 'h264',
        audioCodec: 'aac',
        hasVideo: true,
        hasAudio: true,
      },
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    },
  ]

const editBrief: EditBriefRecord = {
  id: 'source-led-brief',
  revision: 1,
  fields: {
    goal: 'Create a clean professional edit while preserving the complete source.',
    mustIncludeNotes: ['Keep both sources in confirmed upload order.'],
    avoidNotes: ['Do not infer transcript text or add generated visuals.'],
    captionPreference: 'minimal',
    musicPreference: 'none',
    status: 'ready',
  },
  createdAt: timestamp,
  updatedAt: timestamp,
}

const captionMarker: EditBriefMarkerRecord = {
  id: 'source-led-caption-marker',
  editSessionId: 'source-led-edit',
  briefId: editBrief.id,
  revision: 1,
  markerType: 'caption',
  timeKind: 'range',
  startSeconds: 0,
  endSeconds: 2,
  priority: 'must_follow',
  title: 'Exact approved caption',
  note: 'Verified source review',
  status: 'confirmed',
  timingStatus: 'frame_authoritative',
  startFrame: 0,
  endFrame: 60,
  frameRate: 30,
  confirmedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
}

const compiled = compileCanonicalSourceLedPlan({
  plannerInput,
  sourceMediaAssets,
  editBrief,
  confirmedCaptionMarkers: [captionMarker],
})

assert.equal(compiled.evidence.browserPlanAccepted, false)
assert.equal(compiled.evidence.browserTimingAccepted, false)
assert.equal(compiled.evidence.sourceCount, 2)
assert.equal(compiled.evidence.totalFrames, 60)
assert.equal(compiled.evidence.captionCueCount, 1)
assert.deepEqual(
  compiled.plan.sourceCleanupPlan?.decisions.map((decision) => ({
    clipId: decision.clipId,
    sourceRange: [
      decision.sourceRange.startFrame,
      decision.sourceRange.endFrame,
    ],
    selectedRange: (() => {
      const selectedRange = (decision as unknown as {
        selectedRange: { startFrame: number; endFrame: number }
      }).selectedRange
      return [selectedRange.startFrame, selectedRange.endFrame]
    })(),
    action: decision.decision,
  })),
  [{
    clipId: 'source-led-clip-1',
    sourceRange: [0, 30],
    selectedRange: [0, 30],
    action: 'preserve',
  }, {
    clipId: 'source-led-clip-2',
    sourceRange: [0, 30],
    selectedRange: [0, 30],
    action: 'preserve',
  }],
)
assert.deepEqual(
  compiled.plan.masterTimingPlan?.finalTimelineSegments.map((segment) => [
    segment.finalRange.startFrame,
    segment.finalRange.endFrame,
  ]),
  [[0, 30], [30, 60]],
)
assert.deepEqual(
  compiled.plan.masterTimingPlan?.captionTimingItems.map((caption) => ({
    text: caption.captionText,
    range: [caption.timeRange.startFrame, caption.timeRange.endFrame],
  })),
  [{ text: 'Verified source review', range: [0, 60] }],
)
assert.deepEqual(compiled.plan.visualAssetPlan, [])
assert.deepEqual(compiled.plan.providerPromptPlans, [])
assert.deepEqual(compiled.plan.masterTimingPlan?.sfxTimingItems, [])
assert.deepEqual(compiled.plan.masterTimingPlan?.musicDuckingTimingItems, [])
assert.ok(compiled.canonicalDraft.publication)
assert.equal(compiled.canonicalDraft.publicationBlockers.length, 0)
assert.deepEqual(
  compiled.canonicalDraft.orderedSourceItems.map((source) => ({
    mediaAssetId: source.mediaAssetId,
    uploadedOrder: source.uploadedOrder,
  })),
  [
    { mediaAssetId: 'source-led-media-1', uploadedOrder: 1 },
    { mediaAssetId: 'source-led-media-2', uploadedOrder: 2 },
  ],
)

const captionFreeWithExplicitBrief = compileCanonicalSourceLedPlan({
    plannerInput,
    sourceMediaAssets,
    editBrief: {
      ...editBrief,
      fields: { ...editBrief.fields, captionPreference: 'none' },
    },
    confirmedCaptionMarkers: [],
  })
assert.equal(captionFreeWithExplicitBrief.evidence.captionCueCount, 0)
assert.deepEqual(
  captionFreeWithExplicitBrief.plan.masterTimingPlan?.captionTimingItems,
  [],
)
const captionFreeWithoutOptionalBrief = compileCanonicalSourceLedPlan({
  plannerInput,
  sourceMediaAssets,
  confirmedCaptionMarkers: [],
})
assert.equal(captionFreeWithoutOptionalBrief.evidence.captionCueCount, 0)
assert.deepEqual(
  captionFreeWithoutOptionalBrief.plan.masterTimingPlan?.captionTimingItems,
  [],
)
assert.throws(
  () => compileCanonicalSourceLedPlan({
    plannerInput: { ...plannerInput, visualPreference: 'balanced_visual_mix' },
    sourceMediaAssets,
    editBrief,
    confirmedCaptionMarkers: [captionMarker],
  }),
  /later server visual-planning route/i,
)
assert.throws(
  () => compileCanonicalSourceLedPlan({
    plannerInput,
    sourceMediaAssets: sourceMediaAssets.map((source, index) =>
      index === 0
        ? {
            ...source,
            sourceMetadata: {
              ...source.sourceMetadata!,
              probeStatus: 'unavailable' as const,
            },
          }
        : source),
    editBrief,
    confirmedCaptionMarkers: [captionMarker],
  }),
  /missing finalized private MP4 and FFprobe authority/i,
)
assert.throws(
  () => compileCanonicalSourceLedPlan({
    plannerInput,
    sourceMediaAssets,
    editBrief,
    confirmedCaptionMarkers: [{
      ...captionMarker,
      endSeconds: 1,
      endFrame: 30,
    }],
  }),
  /single confirmed caption must cover/i,
)

console.log(JSON.stringify({
  ok: true,
  sourceCount: compiled.evidence.sourceCount,
  totalFrames: compiled.evidence.totalFrames,
  captionCueCount: compiled.evidence.captionCueCount,
  publicationWorkItemCount:
    compiled.canonicalDraft.publication?.canonicalPlan.workItems.length,
  adversarialAssertions: 5,
}, null, 2))
