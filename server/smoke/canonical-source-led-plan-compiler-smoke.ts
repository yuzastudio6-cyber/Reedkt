import assert from 'node:assert/strict'
import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import type { PlannerInput } from '../../src/types/reeditpro'
import {
  parseProfessionalSkillCompositionTrace,
} from '../../src/lib/professional-skills/professional-skill-composition-trace'
import {
  compileCanonicalSourceLedPlan,
} from '../services/canonical-source-led-plan-compiler'
import {
  createCanonicalToolPayloadAuthority,
} from '../edit-architecture/canonical-tool-payload-authority'
import {
  isExactCanonicalPrivateSourceSliceChunkPayload,
} from '../services/canonical-private-long-form-merge-execution-service'
import type {
  EditBriefMarkerRecord,
  EditBriefRecord,
} from '../services/private-edit-brief-authority-store'
import {
  validateOfflineRemotionFinalCompositionPlanningPayload,
} from '../tool-execution/remotion-render-execution'
import {
  validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload,
} from '../tool-execution/media-binary-execution'
import {
  createCanonicalSourceAnalysisAuthorityFixture,
} from './fixtures/canonical-source-led-content-analysis-authority-fixture'

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
  editLevel: 'premium',
  structurePreference: 'preserve_source_order',
  moodStyle: 'clean',
  visualPreference: 'no_extra_visuals',
  referenceUrl: '',
  customInstructions:
    'Preserve both source videos in order and keep the edit clean.',
  userInstructionHistory: [
    'Preserve both source videos in order and keep the edit clean.',
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
    editLevel: 'premium',
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

const fractionalDurationSeconds = 65.632233
const fractionalDurationFrames = Math.round(fractionalDurationSeconds * 30)
const fractionalPlannerInput: PlannerInput = {
  ...plannerInput,
  customInstructions:
    'Keep the speaker visible and natural, and preserve the full verified source.',
  clips: [{
    ...plannerInput.clips[0]!,
    fileName: 'visible-speaker-source.mp4',
    detectedType: 'Verified uploaded video with a speaker visible on camera',
    notes: 'Preserve the person and keep skin tones natural.',
    sourceRole: 'speaker',
    duration: String(fractionalDurationSeconds),
  }],
  sourceSequenceMode: 'single_complete_video',
}
const fractionalSourceMediaAssets = [{
  ...sourceMediaAssets[0]!,
  sourceMetadata: {
    ...sourceMediaAssets[0]!.sourceMetadata!,
    durationSeconds: fractionalDurationSeconds,
  },
}]
const fractionalCaptionMarker: EditBriefMarkerRecord = {
  ...captionMarker,
  timingStatus: 'display_seconds_only',
  startFrame: undefined,
  endFrame: undefined,
  frameRate: undefined,
  endSeconds: fractionalDurationSeconds,
}
const fractionalCompiled = compileCanonicalSourceLedPlan({
  plannerInput: fractionalPlannerInput,
  sourceMediaAssets: fractionalSourceMediaAssets,
  editBrief,
  confirmedCaptionMarkers: [fractionalCaptionMarker],
})
const gappedCaptionMarkers: EditBriefMarkerRecord[] = [{
  ...captionMarker,
  id: 'source-led-caption-marker-opening',
  note: 'Verified opening',
  startFrame: 0,
  endFrame: 30,
  startSeconds: 0,
  endSeconds: 1,
}, {
  ...captionMarker,
  id: 'source-led-caption-marker-closing',
  note: 'Verified closing',
  startFrame: fractionalDurationFrames - 30,
  endFrame: fractionalDurationFrames,
  startSeconds: (fractionalDurationFrames - 30) / 30,
  endSeconds: fractionalDurationFrames / 30,
}]
const gappedCaptionCompiled = compileCanonicalSourceLedPlan({
  plannerInput: fractionalPlannerInput,
  sourceMediaAssets: fractionalSourceMediaAssets,
  editBrief,
  confirmedCaptionMarkers: gappedCaptionMarkers,
})

assert.equal(compiled.evidence.browserPlanAccepted, false)
assert.equal(compiled.evidence.browserTimingAccepted, false)
assert.equal(compiled.evidence.sourceCount, 2)
assert.equal(compiled.evidence.totalFrames, 60)
assert.equal(compiled.evidence.captionCueCount, 1)
const selectedCompositionTrace = parseProfessionalSkillCompositionTrace(
  compiled.canonicalDraft.components.professionalSkillPlan?.compositionTrace,
)
assert.equal(selectedCompositionTrace.entries[0].disposition, 'selected')
assert.deepEqual(
  selectedCompositionTrace.entries[0].selectionSources,
  ['edit_brief', 'edit_cue'],
)
assert.equal(
  selectedCompositionTrace.selectionInferredFromLegacyOptionalComponent,
  false,
)
const captionCleanProfessionalRecompile = compileCanonicalSourceLedPlan({
  plannerInput,
  sourceMediaAssets,
  editBrief,
  confirmedCaptionMarkers: [],
  professionalCaptionSelectionMarkers: [captionMarker],
})
assert.equal(captionCleanProfessionalRecompile.evidence.captionCueCount, 0)
const captionCleanCompositionTrace = parseProfessionalSkillCompositionTrace(
  captionCleanProfessionalRecompile.canonicalDraft.components
    .professionalSkillPlan?.compositionTrace,
)
assert.equal(captionCleanCompositionTrace.entries[0].disposition, 'selected')
assert.deepEqual(
  captionCleanCompositionTrace.entries[0].selectionSources,
  ['edit_brief', 'edit_cue'],
)
assert.equal(
  captionCleanProfessionalRecompile.canonicalDraft.publication?.canonicalPlan
    .workItems.some((item) =>
      item.workerClass === 'canonical_caption_specialist_worker_v1'),
  false,
)
assert.equal(fractionalCompiled.evidence.totalFrames, fractionalDurationFrames)
assert.deepEqual(
  fractionalCompiled.plan.masterTimingPlan?.captionTimingItems.map((caption) => [
    caption.timeRange.startFrame,
    caption.timeRange.endFrame,
  ]),
  [[0, fractionalDurationFrames]],
)
const fractionalCanonicalPlan =
  fractionalCompiled.canonicalDraft.publication?.canonicalPlan
assert.ok(fractionalCanonicalPlan)
const fractionalColorItems = fractionalCanonicalPlan.workItems.filter((item) =>
  item.executionInput.operation ===
    'process_approved_source_professional_color_delivery')
const fractionalChunkItems = fractionalCanonicalPlan.workItems.filter((item) =>
  item.executionInput.operation === 'render_approved_4k_composition_chunk')
assert.equal(fractionalColorItems.length, 9)
assert.equal(fractionalChunkItems.length, 9)
let expectedFractionalSourceStartFrame = 0
fractionalChunkItems.forEach((chunkItem, index) => {
  const chunkIndex = index + 1
  const expectedDurationFrames = chunkIndex <= 7 ? 219 : 218
  const expectedSourceEndFrameExclusive =
    expectedFractionalSourceStartFrame + expectedDurationFrames
  const expectedColorWorkItemKey =
    `color-delivery-1-slice-${chunkIndex}-of-9`
  const colorItem = fractionalColorItems[index]!
  const colorPayload = colorItem.executionInput
    .structuredPayload as Record<string, unknown>
  const chunkPayload = chunkItem.executionInput
    .structuredPayload as Record<string, unknown>
  const chunkAuthority = chunkItem.executionInput
    .chunkAuthority as Record<string, unknown>
  const voiceTracks = chunkPayload.voiceTracks as Array<Record<string, unknown>>
  assert.equal(colorItem.workItemKey, expectedColorWorkItemKey)
  assert.equal(
    colorItem.expectedOutputs[0]?.outputKey,
    `${expectedColorWorkItemKey}-mkv`,
  )
  assert.equal(
    colorPayload.recipeProfileId,
    'approved_source_color_delivery_matroska_v2',
  )
  assert.equal(
    colorPayload.trimStartFrame,
    expectedFractionalSourceStartFrame,
  )
  assert.equal(
    colorPayload.trimEndFrameExclusive,
    expectedSourceEndFrameExclusive,
  )
  assert.equal(
    chunkAuthority.profileId,
    'canonical_private_4k_source_slice_mezzanine_finalize_3840_frames_v3',
  )
  assert.equal(chunkAuthority.chunkIndex, chunkIndex)
  assert.equal(chunkAuthority.chunkCount, 9)
  assert.equal(
    chunkAuthority.sourceStartFrame,
    expectedFractionalSourceStartFrame,
  )
  assert.equal(
    chunkAuthority.sourceEndFrameExclusive,
    expectedSourceEndFrameExclusive,
  )
  assert.equal(chunkPayload.sourceStartFrame, 0)
  assert.equal(chunkPayload.sourceEndFrameExclusive, expectedDurationFrames)
  assert.equal(chunkPayload.durationFrames, expectedDurationFrames)
  assert.deepEqual(
    chunkItem.dependencyKeys.filter((key) =>
      key.startsWith('color-delivery-')),
    [expectedColorWorkItemKey],
  )
  assert.deepEqual(
    chunkItem.dependencyKeys.filter((key) =>
      key.startsWith('voice-delivery-')),
    ['voice-delivery-1'],
  )
  assert.equal(voiceTracks.length, 1)
  assert.equal(voiceTracks[0]?.durationFrames, fractionalDurationFrames)
  assert.equal(
    voiceTracks[0]?.sourceStartFrame,
    expectedFractionalSourceStartFrame,
  )
  assert.equal(
    voiceTracks[0]?.sourceEndFrameExclusive,
    expectedSourceEndFrameExclusive,
  )
  expectedFractionalSourceStartFrame = expectedSourceEndFrameExclusive
})
assert.equal(expectedFractionalSourceStartFrame, fractionalDurationFrames)
const gappedCaptionChunkItems =
  gappedCaptionCompiled.canonicalDraft.publication?.canonicalPlan.workItems
    .filter((item) =>
      item.executionInput.operation ===
        'render_approved_4k_composition_chunk') ?? []
assert.equal(gappedCaptionChunkItems.length, 9)
assert.equal(
  gappedCaptionChunkItems.filter((item) => {
    const payload = item.executionInput.structuredPayload as Record<string, unknown>
    return Array.isArray(payload.captionOverlayCues) &&
      payload.captionOverlayCues.length === 0
  }).length,
  7,
)
const fractionalFinalItem = fractionalCanonicalPlan.workItems.find((item) =>
  item.workItemKey === 'final-export')
assert.equal(
  fractionalFinalItem?.executionInput.operation,
  'finalize_approved_4k_mezzanine_chunks',
)
const fractionalFinalPayload = fractionalFinalItem?.executionInput
  .structuredPayload as Record<string, unknown>
assert.equal(
  fractionalFinalPayload.videoFinalizationPolicy,
  'compatible_h264_stream_copy_v1',
)
assert.equal(
  fractionalFinalPayload.audioFinalizationPolicy,
  'single_approved_voice_delivery_audio_encode_v2',
)
assert.equal(
  fractionalFinalPayload.approvedVoiceOutputKey,
  'voice-delivery-1-wav',
)
assert.deepEqual(
  fractionalFinalItem?.dependencyKeys,
  [
    'source-trim-validation',
    'voice-delivery-1',
    ...Array.from({ length: 9 }, (_, index) =>
      `composition-chunk-${index + 1}`),
  ],
)
const validatedFractionalFinalization =
  validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload(
    fractionalFinalPayload,
  )
const fractionalToolPayloadAuthority = createCanonicalToolPayloadAuthority({
  workItems: fractionalCanonicalPlan.workItems,
})
assert.equal(
  fractionalToolPayloadAuthority.validatedWorkItems.some((item) =>
    item.workItemKey === 'final-export' &&
    item.canonicalToolId === 'ffmpeg' &&
    item.operationId === 'tool.ffmpeg.execute_approved_media_recipe.v1' &&
    item.validatorFamily === 'media_ffmpeg'),
  true,
)
const fractionalCleanupDecision =
  fractionalCanonicalPlan.components.sourceCleanupPlan.decisions[0]
const fractionalVoiceWorkItem = fractionalCanonicalPlan.workItems.find((item) =>
  item.executionInput.operation === 'process_approved_source_voice_delivery')
assert.ok(fractionalCleanupDecision)
assert.ok(fractionalVoiceWorkItem?.expectedOutputs[0])
fractionalChunkItems.forEach((chunkItem, index) => {
  const payload = validateOfflineRemotionFinalCompositionPlanningPayload(
    chunkItem.executionInput.structuredPayload,
  )
  const finalizedChunk = validatedFractionalFinalization.chunks[index]!
  const planned = {
    ...finalizedChunk,
    sourceSequenceItemIds: chunkItem.sourceSequenceItemIds,
    sourceCleanupDecisionIds: chunkItem.sourceCleanupDecisionIds,
  }
  const colorOutputKey = fractionalColorItems[index]?.expectedOutputs[0]?.outputKey
  assert.ok(colorOutputKey)
  assert.equal(
    isExactCanonicalPrivateSourceSliceChunkPayload({
      payload,
      planned,
      cleanupDecision: fractionalCleanupDecision,
      approvedVoiceOutputKeys: [
        fractionalVoiceWorkItem.expectedOutputs[0]!.outputKey,
      ],
      approvedColorOutputKeys: [colorOutputKey],
    }),
    true,
  )
  if (index !== 0) return
  assert.equal(
    isExactCanonicalPrivateSourceSliceChunkPayload({
      payload,
      planned,
      cleanupDecision: fractionalCleanupDecision,
      approvedVoiceOutputKeys: ['substituted-voice-output'],
      approvedColorOutputKeys: [colorOutputKey],
    }),
    false,
  )
  assert.equal(
    isExactCanonicalPrivateSourceSliceChunkPayload({
      payload,
      planned,
      cleanupDecision: fractionalCleanupDecision,
      approvedVoiceOutputKeys: [
        fractionalVoiceWorkItem.expectedOutputs[0]!.outputKey,
      ],
      approvedColorOutputKeys: [],
    }),
    false,
  )
  const shiftedColorPayload = validateOfflineRemotionFinalCompositionPlanningPayload({
    ...payload,
    sourceStartFrame: 1,
    sourceEndFrameExclusive: payload.durationFrames + 1,
  })
  assert.equal(
    isExactCanonicalPrivateSourceSliceChunkPayload({
      payload: shiftedColorPayload,
      planned,
      cleanupDecision: fractionalCleanupDecision,
      approvedVoiceOutputKeys: [
        fractionalVoiceWorkItem.expectedOutputs[0]!.outputKey,
      ],
      approvedColorOutputKeys: [colorOutputKey],
    }),
    false,
  )
  const preserveSourcePayloadInput = structuredClone(
    chunkItem.executionInput.structuredPayload,
  ) as Record<string, unknown>
  delete preserveSourcePayloadInput.sourceMediaPolicy
  delete preserveSourcePayloadInput.voiceTracks
  preserveSourcePayloadInput.audioPolicy = 'preserve_source'
  preserveSourcePayloadInput.sourceStartFrame = planned.sourceStartFrame
  preserveSourcePayloadInput.sourceEndFrameExclusive =
    planned.sourceEndFrameExclusive
  const preserveSourcePayload =
    validateOfflineRemotionFinalCompositionPlanningPayload(
      preserveSourcePayloadInput,
    )
  assert.equal(
    isExactCanonicalPrivateSourceSliceChunkPayload({
      payload: preserveSourcePayload,
      planned,
      cleanupDecision: fractionalCleanupDecision,
      approvedVoiceOutputKeys: [],
      approvedColorOutputKeys: [],
    }),
    true,
  )
})
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
assert.equal(
  parseProfessionalSkillCompositionTrace(
    captionFreeWithExplicitBrief.canonicalDraft.components
      .professionalSkillPlan?.compositionTrace,
  ).entries[0].disposition,
  'restrained',
)
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
assert.equal(
  parseProfessionalSkillCompositionTrace(
    captionFreeWithoutOptionalBrief.canonicalDraft.components
      .professionalSkillPlan?.compositionTrace,
  ).entries[0].disposition,
  'unresolved',
)
assert.deepEqual(
  captionFreeWithoutOptionalBrief.plan.masterTimingPlan?.captionTimingItems,
  [],
)
const unicodeTranscriptText = 'Ideas move through the frame — こんにちは'
const unicodePlannerInput: PlannerInput = {
  ...plannerInput,
  clips: [plannerInput.clips[0]!],
  sourceSequenceMode: 'single_complete_video',
}
const unicodeSourceMediaAssets = [sourceMediaAssets[0]!]
const unicodeTranscriptCompiled = compileCanonicalSourceLedPlan({
  plannerInput: unicodePlannerInput,
  sourceMediaAssets: unicodeSourceMediaAssets,
  editBrief,
  confirmedCaptionMarkers: [],
  professionalCaptionSelectionMarkers: [{
    ...captionMarker,
    editSessionId: 'unicode-source-led-edit',
    endSeconds: 1,
    endFrame: 30,
  }],
  sourceCleanupAuthority: createCanonicalSourceAnalysisAuthorityFixture({
    hasSpeech: true,
    sourceSequenceItemId:
      unicodeSourceMediaAssets[0]!.sourceSequenceItemId,
    mediaAssetId: unicodeSourceMediaAssets[0]!.mediaAssetId,
    uploadedOrder: unicodeSourceMediaAssets[0]!.uploadedOrder,
    checksumSha256: unicodeSourceMediaAssets[0]!.checksumSha256,
    byteLength: unicodeSourceMediaAssets[0]!.byteSize,
    durationFrames: 30,
    transcriptText: unicodeTranscriptText,
  }),
})
assert.equal(
  unicodeTranscriptCompiled.evidence.captionCueAuthority,
  'authenticated_source_transcript_segments',
)
assert.deepEqual(
  unicodeTranscriptCompiled.plan.masterTimingPlan?.captionTimingItems.map(
    (caption) => caption.captionText,
  ),
  [unicodeTranscriptText],
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
assert.throws(
  () => compileCanonicalSourceLedPlan({
    plannerInput: fractionalPlannerInput,
    sourceMediaAssets: fractionalSourceMediaAssets,
    editBrief,
    confirmedCaptionMarkers: [{
      ...fractionalCaptionMarker,
      endSeconds: Math.floor(fractionalDurationSeconds * 30) / 30,
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
  fractionalDurationFrames,
  adversarialAssertions: 17,
}, null, 2))
