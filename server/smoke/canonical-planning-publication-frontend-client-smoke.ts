import assert from 'node:assert/strict'
import { createServer } from 'node:http'

import { buildCanonicalPlanningDraft } from '../../src/lib/canonical-planning-draft'
import { createGuidedMockEditPlan } from '../../src/lib/mock-planner/guided'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import {
  createContextAwareMockEditPlan,
  createContextAwarePlannerInput,
} from '../../src/lib/planning/mock-edit-plan-from-context'
import { buildProfessionalExportCreditCoverage } from '../../src/lib/professional-export-policy'
import type { PlanningContext } from '../../src/types'
import type { ProjectPersistenceScope } from '../../src/lib/project-persistence-scope'
import type { AudioOperationPlan, EditPlan, PlannerInput } from '../../src/types/reeditpro'
import {
  validateOfflineFfmpegPlanningPayload,
  validateOfflineFfprobePlanningPayload,
} from '../tool-execution/media-binary-execution/offline-media-binary-protocol'
import {
  OFFLINE_LIBASS_CAPTION_OPERATION,
  OFFLINE_LIBASS_CAPTION_PROTOCOL,
  validateOfflineLibassCaptionRequest,
} from '../tool-execution/libass-caption-execution/offline-libass-caption-protocol'
import {
  validateOfflineRemotionFinalCompositionPlanningPayload,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
import {
  createCanonicalPlanningHandoffSchema,
  publishCanonicalEditPlanFromHandoffSchema,
} from '../validation/canonical-planning-handoff-schemas'

const identity = {
  workspaceId: 'workspace-canonical-save-smoke',
  projectId: 'project-canonical-save-smoke',
  editSessionId: 'edit-canonical-save-smoke',
}
const sha = (value: string) => value.repeat(64).slice(0, 64)
const baseInput: PlannerInput = {
  projectName: 'Canonical planning publication smoke',
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
  customInstructions: 'Use the source only with one readable caption.',
  userInstructionHistory: ['Use the source only with one readable caption.'],
  creditPreference: 'balanced',
  clips: [{
    id: 'canonical-save-clip-1',
    uploadedOrder: 1,
    fileName: 'canonical-source.mp4',
    duration: '00:02',
    detectedType: 'Primary source',
    sourceRole: 'main_story',
  }],
  sourceSequenceMode: 'single_complete_video',
  sourceOrderConfirmed: true,
  cleanupPreference: 'preserve_natural',
  cleanupPreferenceConfirmed: true,
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: 'canonical-save-preference-snapshot',
  currentEditPreferenceRevision: 3,
}
const sourceMediaAssets = [{
  mediaAssetId: 'canonical-save-media-1',
  sourceSequenceItemId: 'canonical-save-source-1',
  uploadedClipId: 'canonical-save-clip-1',
  uploadedOrder: 1,
  storageProvider: 'local_private' as const,
  storagePath: 'private/source/path-must-never-cross-browser-request.mp4',
  fileName: 'canonical-source.mp4',
  mimeType: 'video/mp4',
  byteSize: 4_096,
  checksumSha256: sha('a'),
  sourceMetadata: {
    probeStatus: 'probed' as const,
    source: 'local_ffprobe' as const,
    durationSeconds: 2,
    hasVideo: true,
    hasAudio: true,
  },
  privateArtifact: true as const,
  publicUrl: null,
  signedUrl: null,
}]
const multiSourceInput: PlannerInput = {
  ...baseInput,
  clips: [{
    ...baseInput.clips[0]!,
    id: 'canonical-save-clip-1',
    fileName: 'canonical-source-1.mp4',
    duration: '00:01',
    uploadedOrder: 1,
  }, {
    ...baseInput.clips[0]!,
    id: 'canonical-save-clip-2',
    fileName: 'canonical-source-2.mp4',
    duration: '00:01',
    uploadedOrder: 2,
    sourceRole: 'context',
  }],
  sourceSequenceMode: 'multi_clip_story_order',
}
const multiSourceMediaAssets = [{
  ...sourceMediaAssets[0]!,
  mediaAssetId: 'canonical-save-media-1',
  sourceSequenceItemId: 'canonical-save-source-1',
  uploadedClipId: 'canonical-save-clip-1',
  uploadedOrder: 1,
  fileName: 'canonical-source-1.mp4',
  checksumSha256: sha('1'),
  sourceMetadata: { ...sourceMediaAssets[0]!.sourceMetadata, durationSeconds: 1 },
}, {
  ...sourceMediaAssets[0]!,
  mediaAssetId: 'canonical-save-media-2',
  sourceSequenceItemId: 'canonical-save-source-2',
  uploadedClipId: 'canonical-save-clip-2',
  uploadedOrder: 2,
  fileName: 'canonical-source-2.mp4',
  storagePath: 'private/second/source/path-must-never-cross-browser-request.mp4',
  checksumSha256: sha('2'),
  sourceMetadata: { ...sourceMediaAssets[0]!.sourceMetadata, durationSeconds: 1 },
}]

const cleanSignedInPlanningContext: PlanningContext = {
  id: 'canonical-clean-signed-in-planning-context',
  projectId: identity.projectId,
  workspaceId: identity.workspaceId,
  userId: 'canonical-clean-signed-in-user',
  status: 'ready',
  cleanAssembly: {
    cleanAssemblyId: 'canonical-clean-signed-in-assembly',
    version: 1,
    durationMs: 2_000,
    accepted: true,
    segmentCount: 2,
    sourceTimeMappingCount: 2,
    summary: 'Two accepted one-second private source clips in uploaded story order.',
  },
  sourceAssets: multiSourceMediaAssets.map((asset) => ({
    mediaAssetId: asset.mediaAssetId,
    sourceLibraryAssetId: asset.sourceSequenceItemId,
    label: asset.fileName,
    role: 'main_footage',
    status: 'main_footage',
    priority: 'must_follow',
    explanation: 'Use this accepted private source in confirmed uploaded order.',
  })),
  editBrief: {
    editBriefId: 'canonical-clean-signed-in-brief',
    status: 'ready',
    goal: 'Create a clean internal review edit that opens with the uploaded source proof and keeps the speaker clear.',
    targetPlatforms: ['youtube'],
    styleKeywords: ['clean', 'restrained'],
    mustUseAssetIds: multiSourceMediaAssets.map((asset) => asset.mediaAssetId),
    avoidAssetIds: [],
    mustIncludeNotes: ['Keep both uploaded sources in their confirmed order.'],
    avoidNotes: ['Do not add evidence boards, documentary claims, or decorative generated visuals.'],
    userProvidedReferenceUrls: [],
    ready: true,
  },
  cueUsages: [],
  readinessIssues: [],
  unresolvedConflictIds: [],
  blockingIssueCount: 0,
  warningIssueCount: 0,
  summary: 'Accepted two-source planning context with a ready clean Edit Brief.',
  createdAt: '2026-07-15T12:00:00.000Z',
  updatedAt: '2026-07-15T12:00:00.000Z',
}
const cleanSignedInInput: PlannerInput = {
  ...multiSourceInput,
  projectName: 'Clean signed-in private review',
  editingCategory: 'storytelling',
  workflowType: 'custom_let_ai_decide',
  structurePreference: 'improve_if_needed',
  moodStyle: 'clean',
  visualPreference: 'balanced_visual_mix',
  customInstructions: '',
  userInstructionHistory: [],
}
const cleanSignedInExactInput = createContextAwarePlannerInput(
  cleanSignedInPlanningContext,
  cleanSignedInInput,
)
const cleanSignedInPlanResult = createContextAwareMockEditPlan({
  planningContext: cleanSignedInPlanningContext,
  existingPlannerInput: cleanSignedInInput,
})
const cleanSignedInPlan = cleanSignedInPlanResult.editPlan
assert.match(
  cleanSignedInExactInput.userInstructionHistory?.at(-1) ?? '',
  /Edit Brief goal: Create a clean internal review edit that opens with the uploaded source proof and keeps the speaker clear\./,
  'A new signed-in edit with an empty chat history must compile its Edit Brief direction.',
)
assert.deepEqual(
  createContextAwarePlannerInput(cleanSignedInPlanningContext, cleanSignedInExactInput).userInstructionHistory,
  cleanSignedInExactInput.userInstructionHistory,
  'Canonical planning retries must not duplicate the same context instruction.',
)
assert.equal(cleanSignedInPlan.compiledIntent?.professionalEditingDirective.soundStyle, 'clean_voice_only')
assert.notEqual(
  cleanSignedInPlan.compiledIntent?.professionalEditingDirective.brollPolicy,
  'documentary_evidence_b_roll',
  'The phrase uploaded source proof must not be treated as a documentary b-roll request.',
)
assert.deepEqual(
  cleanSignedInPlan.videoUnderstandingReport?.visualSupportOpportunities.map((opportunity) => opportunity.opportunityType),
  ['caption_only'],
  'Generic source context must not create an evidence board or decorative still-card fallback.',
)
assert.equal(cleanSignedInPlan.visualAssetPlan?.length, 0)
assert.equal(cleanSignedInPlan.providerPromptPlans?.length, 0)
assert.deepEqual(
  cleanSignedInPlan.segmentEditPlans?.map((segment) => ({
    sourceClipIds: segment.sourceClipIds,
    sourceRange: [segment.sourceTimeRange?.startSeconds, segment.sourceTimeRange?.endSeconds],
    finalRange: [segment.finalTimeRange.startSeconds, segment.finalTimeRange.endSeconds],
  })),
  [{
    sourceClipIds: ['canonical-save-clip-1'],
    sourceRange: [0, 1],
    finalRange: [0, 1],
  }, {
    sourceClipIds: ['canonical-save-clip-2'],
    sourceRange: [0, 1],
    finalRange: [1, 2],
  }],
  'Confirmed improve-if-needed planning must preserve exact source ranges until a real reorder decision exists.',
)
assert.equal(
  cleanSignedInPlan.segmentEditPlans?.some((segment) =>
    segment.operations.some((operation) => operation.operationType === 'b_roll')),
  false,
  'A source-led caption decision must suppress unrequested b-roll across every source segment.',
)
assert.equal(cleanSignedInPlan.audioPipelinePlan?.musicBedPlan.policy, 'none')
assert.equal(cleanSignedInPlan.audioPipelinePlan?.sfxPlan.policy, 'none')
assert.equal(cleanSignedInPlan.audioPipelinePlan?.beatSyncPlan.strategy, 'none')
assert.deepEqual(cleanSignedInPlan.masterTimingPlan?.musicDuckingTimingItems, [])
assert.equal(
  cleanSignedInPlan.colorPipelinePlan?.clipPlans.some((clipPlan) => clipPlan.skinToneProtection),
  false,
  'Audio clarity language alone must not fabricate visual skin-tone evidence.',
)
const cleanSignedInDraft = buildCanonicalPlanningDraft({
  plan: cleanSignedInPlan,
  plannerInput: cleanSignedInExactInput,
  sourceMediaAssets: multiSourceMediaAssets,
})
if (!cleanSignedInDraft.ok || !cleanSignedInDraft.draft.publication) {
  throw new Error(
    `Clean signed-in planning context did not compile: ${
      cleanSignedInDraft.ok
        ? cleanSignedInDraft.draft.publicationBlockers.join(' | ')
        : cleanSignedInDraft.errors.join(' | ')
    }`,
  )
}
assert.deepEqual(cleanSignedInDraft.draft.publicationBlockers, [])

const explicitDocumentaryPlan = createMockEditPlan({
  ...baseInput,
  editingCategory: 'documentary_case_study',
  workflowType: 'custom_let_ai_decide',
  customInstructions: 'Build a neutral evidence board from the verified case evidence.',
  userInstructionHistory: ['Build a neutral evidence board from the verified case evidence.'],
  visualPreference: 'balanced_visual_mix',
})
assert.equal(
  explicitDocumentaryPlan.videoUnderstandingReport?.visualSupportOpportunities.some((opportunity) =>
    opportunity.opportunityType === 'evidence_board'),
  true,
  'Explicit documentary evidence direction must retain evidence-board planning.',
)
assert.equal(
  explicitDocumentaryPlan.compiledIntent?.professionalEditingDirective.brollPolicy,
  'documentary_evidence_b_roll',
  'Narrowing generic proof matching must preserve genuine documentary evidence b-roll intent.',
)

const sourceOnlyFullPlan = createMockEditPlan(baseInput)
assert.equal(sourceOnlyFullPlan.visualAssetPlan?.length, 0, 'Source-only preference must create no visual assets.')
assert.equal(sourceOnlyFullPlan.mapAnimationPlan?.items.length, 0, 'Source-only preference must create no map work.')
assert.equal(sourceOnlyFullPlan.dataVizPlan?.items.length, 0, 'Source-only preference must create no data-visualization work.')
assert.equal(sourceOnlyFullPlan.providerPromptPlans?.length, 0, 'Source-only preference must create no provider prompts.')
assert.equal(sourceOnlyFullPlan.compiledIntent?.professionalEditingDirective.brollPolicy, 'none')
assert.equal(sourceOnlyFullPlan.compiledIntent?.professionalEditingDirective.soundStyle, 'clean_voice_only')
assert.equal(
  sourceOnlyFullPlan.segmentEditPlans?.some((segment) =>
    segment.operations.some((operation) => operation.operationType === 'b_roll')),
  false,
  'Source-only intent must not produce a b-roll operation without an approved b-roll asset.',
)
assert.equal(sourceOnlyFullPlan.audioPipelinePlan?.musicBedPlan.policy, 'none')
assert.equal(sourceOnlyFullPlan.audioPipelinePlan?.musicBedPlan.duckingEnabled, false)
assert.equal(sourceOnlyFullPlan.audioPipelinePlan?.sfxPlan.policy, 'none')
assert.equal(sourceOnlyFullPlan.audioPipelinePlan?.beatSyncPlan.strategy, 'none')
assert.deepEqual(sourceOnlyFullPlan.audioPipelinePlan?.soundSyncCues, [])
assert.deepEqual(sourceOnlyFullPlan.audioPipelinePlan?.toolsPlanned, ['planning_only', 'ffmpeg'])
assert.deepEqual(sourceOnlyFullPlan.audioPipelinePlan?.stages, [
  'source_audio_analysis',
  'voice_cleanup',
  'loudness_normalization',
  'qa_check',
])
assert.deepEqual(sourceOnlyFullPlan.masterTimingPlan?.musicDuckingTimingItems, [])
assert.deepEqual(sourceOnlyFullPlan.soundSyncTransitionTimingPlan?.refinedMusicDuckingTimings, [])
assert.deepEqual(
  sourceOnlyFullPlan.audioPipelinePlan?.projectOperations.map((operation) => operation.operation).sort(),
  [
    'compression',
    'eq_cleanup',
    'loudness_normalization',
    'qa_loudness_check',
    'true_peak_limit',
    'voice_leveling',
  ],
  'Source-only Pro audio must retain the exact professional voice chain without invented music, SFX, beats, or silence removal.',
)

const richPlan = createGuidedMockEditPlan(baseInput)
richPlan.visualAssetPlan = [{ id: 'unrepresented-rich-visual' }] as unknown as NonNullable<EditPlan['visualAssetPlan']>
const richDraft = buildCanonicalPlanningDraft({
  plan: richPlan,
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(richDraft.ok, true, 'A rich plan should still compile its exact canonical handoff components.')
assert.equal(richDraft.ok && richDraft.draft.publication, undefined, 'A rich plan must not be silently downgraded into the narrow runner.')
assert.ok(richDraft.ok && richDraft.draft.publicationBlockers.length > 0, 'Unrepresented rich work must remain explicitly blocked.')
if (!richDraft.ok) throw new Error('Rich draft unexpectedly failed.')
assert.equal(createCanonicalPlanningHandoffSchema.safeParse({
  workspaceId: identity.workspaceId,
  purpose: 'prepare_canonical_planning_handoff',
  orderedSourceItems: richDraft.draft.orderedSourceItems,
  canonicalPlanComponents: richDraft.draft.components,
}).success, true, 'Rich handoff components must match the backend schema.')

const realisticRichMultiSourcePlan = createMockEditPlan(multiSourceInput)
const realisticRichMultiSourceDraft = buildCanonicalPlanningDraft({
  plan: realisticRichMultiSourcePlan,
  plannerInput: multiSourceInput,
  sourceMediaAssets: multiSourceMediaAssets,
})
const realisticTiming = realisticRichMultiSourcePlan.masterTimingPlan!
assert.equal(realisticTiming.timingBase.sourceDurationSeconds, 2)
assert.equal(realisticTiming.timingBase.finalDurationSeconds, 2)
assert.equal(realisticTiming.timingBase.totalFrames, 60)
assert.deepEqual(
  realisticTiming.finalTimelineSegments.map((segment) => [
    segment.finalRange.startFrame,
    segment.finalRange.endFrame,
  ]),
  [[0, 30], [30, 60]],
  'Confirmed source-order planning must not repeat or stretch one-second sources.',
)
assert.deepEqual(
  realisticTiming.sourceTimingItems.map((source) => [
    source.selectedRange.startFrame,
    source.selectedRange.endFrame,
  ]),
  [[0, 30], [0, 30]],
  'Selected source timing must stay inside each verified one-second source.',
)
assert.deepEqual(
  realisticTiming.captionTimingItems.map((caption) => [
    caption.timeRange.startFrame,
    caption.timeRange.endFrame,
    caption.readabilityScore,
  ]),
  [[0, 30, 'medium'], [30, 60, 'medium']],
  'Short captions must report readability risk without expanding beyond the final timeline.',
)
assert.equal(realisticRichMultiSourcePlan.timingValidationPlan?.approvalBlocked, false)
if (!realisticRichMultiSourceDraft.ok || !realisticRichMultiSourceDraft.draft.publication) {
  throw new Error(
    `Normal two-source source-only planning did not compile: ${
      realisticRichMultiSourceDraft.ok
        ? realisticRichMultiSourceDraft.draft.publicationBlockers.join(' | ')
        : realisticRichMultiSourceDraft.errors.join(' | ')
    }`,
  )
}
assert.equal(realisticRichMultiSourceDraft.ok, true,
  'A normal rich multi-source plan should preserve its handoff context.')
assert.deepEqual(realisticRichMultiSourceDraft.draft.publicationBlockers, [])
const realisticCanonicalPlan = realisticRichMultiSourceDraft.draft.publication.canonicalPlan
const realisticColorItems = realisticCanonicalPlan.workItems.filter((item) =>
  item.workerClass === 'color_processing_worker')
assert.equal(realisticColorItems.length, 2)
assert.deepEqual(realisticColorItems.map((item) => ({
  key: item.workItemKey,
  sourceIds: item.sourceSequenceItemIds,
  dependencies: item.dependencyKeys,
  outputKey: item.expectedOutputs[0]?.outputKey,
})), [{
  key: 'color-delivery-1',
  sourceIds: ['canonical-save-source-1'],
  dependencies: [],
  outputKey: 'color-delivery-1-mkv',
}, {
  key: 'color-delivery-2',
  sourceIds: ['canonical-save-source-2'],
  dependencies: ['color-delivery-1'],
  outputKey: 'color-delivery-2-mkv',
}])
const realisticReferenceColorPayload = validateOfflineFfmpegPlanningPayload(
  asRecord(realisticColorItems[0]!.executionInput.structuredPayload),
)
const realisticMatchedColorPayload = validateOfflineFfmpegPlanningPayload(
  asRecord(realisticColorItems[1]!.executionInput.structuredPayload),
)
assert.equal(realisticReferenceColorPayload.recipeProfileId,
  'approved_source_color_delivery_matroska_v1')
assert.equal(realisticMatchedColorPayload.recipeProfileId,
  'approved_source_color_match_delivery_matroska_v1')
if (realisticMatchedColorPayload.recipeProfileId !==
  'approved_source_color_match_delivery_matroska_v1') {
  throw new Error('Second source did not compile to the exact reference-bound color recipe.')
}
assert.equal(realisticMatchedColorPayload.referenceSourceSequenceItemId,
  'canonical-save-source-1')
assert.equal(realisticMatchedColorPayload.referenceOutputKey, 'color-delivery-1-mkv')
assert.equal(realisticMatchedColorPayload.referenceDurationFrames, 30)
assert.equal(realisticMatchedColorPayload.approvedColorOperationKinds.includes('shot_matching'), true)
const realisticFinalItem = realisticCanonicalPlan.workItems.find((item) =>
  item.workItemKey === 'final-export')!
const realisticFinalPayload = validateOfflineRemotionFinalCompositionPlanningPayload(
  asRecord(realisticFinalItem.executionInput.structuredPayload),
)
assert.equal(realisticFinalPayload.compositionProfileId,
  'approved_source_sequence_caption_track_final_v1')
assert.equal(realisticFinalPayload.sourceMediaPolicy,
  'approved_professional_color_intermediate_v1')
assert.deepEqual(realisticFinalPayload.sourceSegments.map((segment) => [
  segment.sourceStartFrame,
  segment.sourceEndFrameExclusive,
]), [[0, 30], [0, 30]])
assert.deepEqual(realisticFinalItem.dependencyKeys, [
  'source-trim-validation',
  'caption-overlay-1',
  'caption-overlay-2',
  'voice-delivery-1',
  'voice-delivery-2',
  'color-delivery-1',
  'color-delivery-2',
])
assert.deepEqual(realisticTiming.transitionTimingItems.map((transition) => ({
  type: transition.transitionType,
  startFrame: transition.timeRange.startFrame,
  endFrame: transition.timeRange.endFrame,
  sfxCueId: transition.sfxCueId,
})), [{ type: 'hard_cut', startFrame: 30, endFrame: 30, sfxCueId: undefined }])
assert.deepEqual(realisticRichMultiSourcePlan.soundSyncTransitionTimingPlan?.refinedSfxTimings, [])
assert.equal(publishCanonicalEditPlanFromHandoffSchema.safeParse({
  workspaceId: identity.workspaceId,
  planningRequestId: 'canonical-rich-multi-source-request',
  expectedHandoffHash: sha('9'),
  canonicalPlan: realisticCanonicalPlan,
}).success, true)

const guidedSourceTruthPlan = createGuidedMockEditPlan(multiSourceInput)
assert.equal(guidedSourceTruthPlan.masterTimingPlan?.timingBase.sourceDurationSeconds, 2)
assert.equal(guidedSourceTruthPlan.masterTimingPlan?.timingBase.finalDurationSeconds, 2)
assert.deepEqual(
  guidedSourceTruthPlan.masterTimingPlan?.finalTimelineSegments.map((segment) => [
    segment.finalRange.startFrame,
    segment.finalRange.endFrame,
  ]),
  [[0, 30], [30, 60]],
  'The signed-in guided planner path must preserve the same exact source duration.',
)
assert.deepEqual(
  guidedSourceTruthPlan.masterTimingPlan?.sourceTimingItems.map((source) => [
    source.selectedRange.startFrame,
    source.selectedRange.endFrame,
  ]),
  [[0, 30], [0, 30]],
)

const exactPlan = createExactPrivateReviewPlan()
const exactDraft = buildCanonicalPlanningDraft({
  plan: exactPlan,
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(exactDraft.ok, true, 'Exact source-and-caption plan should compile.')
if (!exactDraft.ok || !exactDraft.draft.publication) throw new Error('Exact publication candidate was not produced.')
const canonicalEstimate = exactDraft.draft.publication.canonicalPlan.estimate
assert.equal(
  canonicalEstimate.lineItems.reduce((sum, item) => sum + item.estimatedCredits, 0) + canonicalEstimate.fallbackAllowanceCredits,
  Math.round(exactPlan.creditEstimate.total),
  'The canonical approved maximum must equal the exact total shown to the user.',
)
assert.equal(
  canonicalEstimate.lineItems.some((item) => /fallback allowance$/i.test(item.label)),
  false,
  'Fallback allowance must be represented once in its dedicated authority field, not counted again as a line item.',
)
assert.deepEqual(
  exactDraft.draft.publication.canonicalPlan.workItems.map((item) => ({
    key: item.workItemKey,
    type: item.workItemType,
    dependencies: item.dependencyKeys,
    tools: item.approvedToolIds,
  })),
  [
    { key: 'snapshot-validation', type: 'validate_approved_snapshot', dependencies: [], tools: [] },
    { key: 'source-trim-validation', type: 'prepare_source_trim', dependencies: ['snapshot-validation'], tools: [] },
    { key: 'caption-overlay', type: 'custom', dependencies: [], tools: ['libass'] },
    { key: 'final-export', type: 'render_final_export', dependencies: ['source-trim-validation', 'caption-overlay'], tools: ['remotion'] },
    { key: 'final-qa', type: 'run_final_qa', dependencies: ['final-export'], tools: ['ffprobe'] },
  ],
  'Publication candidate must freeze the exact proven five-stage private review graph.',
)
assert.equal(createCanonicalPlanningHandoffSchema.safeParse({
  workspaceId: identity.workspaceId,
  purpose: 'prepare_canonical_planning_handoff',
  orderedSourceItems: exactDraft.draft.orderedSourceItems,
  canonicalPlanComponents: exactDraft.draft.components,
}).success, true)
assert.equal(publishCanonicalEditPlanFromHandoffSchema.safeParse({
  workspaceId: identity.workspaceId,
  planningRequestId: 'canonical-save-plan-request',
  expectedHandoffHash: sha('b'),
  canonicalPlan: exactDraft.draft.publication.canonicalPlan,
}).success, true, 'Exact candidate must match the persisted-handoff publication schema.')

const captionItem = exactDraft.draft.publication.canonicalPlan.workItems.find((item) => item.workItemKey === 'caption-overlay')!
validateOfflineLibassCaptionRequest({
  schemaVersion: OFFLINE_LIBASS_CAPTION_PROTOCOL,
  toolId: 'libass',
  operationId: OFFLINE_LIBASS_CAPTION_OPERATION,
  payload: asRecord(captionItem.executionInput.structuredPayload),
})
const finalItem = exactDraft.draft.publication.canonicalPlan.workItems.find((item) => item.workItemKey === 'final-export')!
validateOfflineRemotionFinalCompositionPlanningPayload(asRecord(finalItem.executionInput.structuredPayload))
const qaItem = exactDraft.draft.publication.canonicalPlan.workItems.find((item) => item.workItemKey === 'final-qa')!
validateOfflineFfprobePlanningPayload(asRecord(qaItem.executionInput.structuredPayload))

const multiSourcePlan = createExactMultiSourcePrivateReviewPlan()
const multiSourceDraft = buildCanonicalPlanningDraft({
  plan: multiSourcePlan,
  plannerInput: multiSourceInput,
  sourceMediaAssets: multiSourceMediaAssets,
})
assert.equal(multiSourceDraft.ok, true, 'Exact ordered multi-source plan should compile.')
if (!multiSourceDraft.ok || !multiSourceDraft.draft.publication) {
  throw new Error('Exact ordered multi-source publication candidate was not produced.')
}
const multiSourceTrimItem = multiSourceDraft.draft.publication.canonicalPlan.workItems.find((item) =>
  item.workItemKey === 'source-trim-validation')!
assert.deepEqual(
  multiSourceTrimItem.sourceSequenceItemIds,
  ['canonical-save-source-1', 'canonical-save-source-2'],
  'Trim validation must preserve the exact approved source order.',
)
assert.equal(multiSourceTrimItem.sourceCleanupDecisionIds.length, 2)
const multiSourceFinalItem = multiSourceDraft.draft.publication.canonicalPlan.workItems.find((item) =>
  item.workItemKey === 'final-export')!
const multiSourceCaptionItems = multiSourceDraft.draft.publication.canonicalPlan.workItems.filter((item) =>
  item.approvedToolIds.includes('libass'))
assert.deepEqual(
  multiSourceCaptionItems.map((item) => ({
    workItemKey: item.workItemKey,
    outputKey: item.expectedOutputs[0]?.outputKey,
    timingIds: item.expectedOutputs[0]?.timingIds,
  })),
  [{
    workItemKey: 'caption-overlay-1',
    outputKey: 'caption-overlay-1-png',
    timingIds: [multiSourcePlan.masterTimingPlan!.id, 'multi-caption-1'],
  }, {
    workItemKey: 'caption-overlay-2',
    outputKey: 'caption-overlay-2-png',
    timingIds: [multiSourcePlan.masterTimingPlan!.id, 'multi-caption-2'],
  }],
  'Each approved cue must compile to its own exact libass artifact lineage.',
)
assert.deepEqual(
  multiSourceFinalItem.dependencyKeys,
  ['source-trim-validation', 'caption-overlay-1', 'caption-overlay-2'],
  'Final composition must depend on the trim report and every approved caption artifact.',
)
const multiSourceFinalPayload = validateOfflineRemotionFinalCompositionPlanningPayload(
  asRecord(multiSourceFinalItem.executionInput.structuredPayload),
)
assert.equal(multiSourceFinalPayload.compositionProfileId, 'approved_source_sequence_caption_track_final_v1')
if (multiSourceFinalPayload.compositionProfileId !== 'approved_source_sequence_caption_track_final_v1') {
  throw new Error('Exact ordered multi-source plan compiled to the wrong Remotion profile.')
}
assert.deepEqual(multiSourceFinalPayload.sourceSegments, [{
  sourceSequenceItemId: 'canonical-save-source-1',
  sourceStartFrame: 0,
  sourceEndFrameExclusive: 24,
  timelineStartFrame: 0,
  timelineEndFrameExclusive: 24,
}, {
  sourceSequenceItemId: 'canonical-save-source-2',
  sourceStartFrame: 0,
  sourceEndFrameExclusive: 24,
  timelineStartFrame: 24,
  timelineEndFrameExclusive: 48,
}])
assert.equal(multiSourceFinalPayload.transitionPolicy, 'approved_hard_cuts_only')
assert.deepEqual(multiSourceFinalPayload.hardCutTransitions, [{
  transitionTimingItemId: 'approved-hard-cut-1',
  refinedTransitionTimingItemId: 'approved-refined-hard-cut-1',
  fromSegmentId: 'segment-1',
  toSegmentId: 'segment-2',
  fromSourceSequenceItemId: 'canonical-save-source-1',
  toSourceSequenceItemId: 'canonical-save-source-2',
  boundaryFrame: 24,
}])
assert.throws(
  () => validateOfflineRemotionFinalCompositionPlanningPayload({
    ...multiSourceFinalPayload,
    hardCutTransitions: multiSourceFinalPayload.hardCutTransitions.map((transition) => ({
      ...transition,
      boundaryFrame: 23,
    })),
  }),
  /hard cut|boundary/,
  'A changed hard-cut frame must fail before canonical publication or dispatch.',
)
const invalidSingleSourceTransitionPlan = structuredClone(exactPlan)
invalidSingleSourceTransitionPlan.masterTimingPlan!.transitionTimingItems = structuredClone(
  multiSourcePlan.masterTimingPlan!.transitionTimingItems,
)
invalidSingleSourceTransitionPlan.soundSyncTransitionTimingPlan!.refinedTransitionTimings = structuredClone(
  multiSourcePlan.soundSyncTransitionTimingPlan!.refinedTransitionTimings,
)
const invalidSingleSourceTransitionDraft = buildCanonicalPlanningDraft({
  plan: invalidSingleSourceTransitionPlan,
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(invalidSingleSourceTransitionDraft.ok, true)
assert.equal(
  invalidSingleSourceTransitionDraft.ok && invalidSingleSourceTransitionDraft.draft.publication,
  undefined,
  'A single-source plan with stray transition authority must fail closed before publication.',
)
assert.ok(
  invalidSingleSourceTransitionDraft.ok &&
  invalidSingleSourceTransitionDraft.draft.publicationBlockers.includes(
    'Timed transitions need their own canonical execution work items.',
  ),
  'A single-source plan must expose stray transition records as a publication blocker.',
)
assert.deepEqual(multiSourceFinalPayload.captionOverlayCues, [{
  outputKey: 'caption-overlay-1-png',
  startFrame: 0,
  endFrameExclusive: 24,
}, {
  outputKey: 'caption-overlay-2-png',
  startFrame: 24,
  endFrameExclusive: 48,
}])
assert.equal(
  multiSourceFinalItem.expectedOutputs[0]?.artifactType,
  'private_source_sequence_caption_track_4k_delivery_master_v1',
)

const voiceDeliveryPlan = createExactMultiSourceVoiceDeliveryPlan()
const voiceDeliveryDraft = buildCanonicalPlanningDraft({
  plan: voiceDeliveryPlan,
  plannerInput: multiSourceInput,
  sourceMediaAssets: multiSourceMediaAssets,
})
assert.equal(voiceDeliveryDraft.ok, true)
if (!voiceDeliveryDraft.ok || !voiceDeliveryDraft.draft.publication) {
  throw new Error('Exact source-bound voice delivery did not compile to a publication candidate.')
}
const voiceCanonicalPlan = voiceDeliveryDraft.draft.publication.canonicalPlan
const voiceItems = voiceCanonicalPlan.workItems.filter((item) =>
  item.approvedToolIds.length === 1 && item.approvedToolIds[0] === 'ffmpeg')
assert.deepEqual(
  voiceItems.map((item) => ({
    key: item.workItemKey,
    sourceIds: item.sourceSequenceItemIds,
    cleanupIds: item.sourceCleanupDecisionIds,
    outputKey: item.expectedOutputs[0]?.outputKey,
    contentType: item.expectedOutputs[0]?.contentType,
  })),
  [{
    key: 'voice-delivery-1',
    sourceIds: ['canonical-save-source-1'],
    cleanupIds: ['multi-source-cleanup-1'],
    outputKey: 'voice-delivery-1-wav',
    contentType: 'audio/wav',
  }, {
    key: 'voice-delivery-2',
    sourceIds: ['canonical-save-source-2'],
    cleanupIds: ['multi-source-cleanup-2'],
    outputKey: 'voice-delivery-2-wav',
    contentType: 'audio/wav',
  }],
  'Each approved source must compile to its own exact FFmpeg voice-delivery lineage.',
)
voiceItems.forEach((item, index) => {
  const payload = validateOfflineFfmpegPlanningPayload(
    asRecord(item.executionInput.structuredPayload),
  )
  assert.equal(payload.recipeProfileId, 'approved_voice_delivery_wav_v1')
  assert.equal(payload.trimStartFrame, 0)
  assert.equal(payload.trimEndFrameExclusive, 24)
  assert.equal(payload.frameRate, 24)
  assert.equal(item.maximumCreditBudget >= 0, true, `Voice item ${index + 1} has no bounded budget.`)
})
const voiceFinalItem = voiceCanonicalPlan.workItems.find((item) =>
  item.workItemKey === 'final-export')!
assert.deepEqual(voiceFinalItem.dependencyKeys, [
  'source-trim-validation',
  'caption-overlay-1',
  'caption-overlay-2',
  'voice-delivery-1',
  'voice-delivery-2',
])
const voiceFinalPayload = validateOfflineRemotionFinalCompositionPlanningPayload(
  asRecord(voiceFinalItem.executionInput.structuredPayload),
)
assert.equal(voiceFinalPayload.audioPolicy, 'replace_with_approved_voice_tracks')
assert.deepEqual(voiceFinalPayload.voiceTracks, [{
  sourceSequenceItemId: 'canonical-save-source-1',
  outputKey: 'voice-delivery-1-wav',
  durationFrames: 24,
}, {
  sourceSequenceItemId: 'canonical-save-source-2',
  outputKey: 'voice-delivery-2-wav',
  durationFrames: 24,
}])
assert.deepEqual(
  asRecord(voiceCanonicalPlan.components.toolStrategyPlan).toolIds,
  ['libass', 'ffmpeg', 'remotion', 'ffprobe'],
)

const colorDeliveryPlan = createExactProfessionalColorReviewPlan()
const colorDeliveryDraft = buildCanonicalPlanningDraft({
  plan: colorDeliveryPlan,
  plannerInput: baseInput,
  sourceMediaAssets,
})
if (!colorDeliveryDraft.ok) {
  throw new Error(
    `Exact source-bound professional color delivery did not compile: ${colorDeliveryDraft.errors.join(' | ')}`,
  )
}
if (!colorDeliveryDraft.draft.publication) {
  throw new Error(
    `Exact source-bound professional color delivery did not compile to a publication candidate: ${
      colorDeliveryDraft.draft.publicationBlockers.join(' | ')
    }`,
  )
}
assert.equal(colorDeliveryDraft.ok, true)
const colorCanonicalPlan = colorDeliveryDraft.draft.publication.canonicalPlan
const colorItems = colorCanonicalPlan.workItems.filter((item) =>
  item.workerClass === 'color_processing_worker')
assert.deepEqual(
  colorItems.map((item) => ({
    key: item.workItemKey,
    sourceIds: item.sourceSequenceItemIds,
    cleanupIds: item.sourceCleanupDecisionIds,
    outputKey: item.expectedOutputs[0]?.outputKey,
    contentType: item.expectedOutputs[0]?.contentType,
    dependencies: item.dependencyKeys,
    tools: item.approvedToolIds,
  })),
  [{
    key: 'color-delivery-1',
    sourceIds: ['canonical-save-source-1'],
    cleanupIds: ['guided-trim-canonical-save-clip-1'],
    outputKey: 'color-delivery-1-mkv',
    contentType: 'video/x-matroska',
    dependencies: [],
    tools: ['ffmpeg'],
  }],
  'Professional color must compile to one exact source-bound private Matroska artifact.',
)
const colorPayload = validateOfflineFfmpegPlanningPayload(
  asRecord(colorItems[0]!.executionInput.structuredPayload),
)
assert.equal(colorPayload.recipeProfileId, 'approved_source_color_delivery_matroska_v1')
if (colorPayload.recipeProfileId !== 'approved_source_color_delivery_matroska_v1') {
  throw new Error('Professional color compiled to the wrong confined FFmpeg recipe.')
}
assert.equal(colorPayload.trimStartFrame, 0)
assert.equal(colorPayload.trimEndFrameExclusive, 48)
assert.equal(colorPayload.frameRate, 24)
assert.equal(colorPayload.colorGradeStyle, 'premium_clean')
assert.equal(colorPayload.intensity, 'balanced')
assert.equal(colorPayload.preserveAudio, false)
assert.deepEqual(colorPayload.approvedColorOperationKinds, [
  'clarity',
  'contrast_curve',
  'exposure_correction',
  'highlight_recovery',
  'look_transform',
  'qa_histogram_check',
  'white_balance',
])
assert.equal(
  new Set(colorPayload.approvedColorOperationIds).size,
  colorPayload.approvedColorOperationIds.length,
)
const colorVoiceItem = colorCanonicalPlan.workItems.find((item) =>
  item.workItemKey === 'voice-delivery-1')!
assert.equal(
  validateOfflineFfmpegPlanningPayload(
    asRecord(colorVoiceItem.executionInput.structuredPayload),
  ).recipeProfileId,
  'approved_voice_delivery_wav_v1',
)
const colorFinalItem = colorCanonicalPlan.workItems.find((item) =>
  item.workItemKey === 'final-export')!
assert.deepEqual(colorFinalItem.dependencyKeys, [
  'source-trim-validation',
  'caption-overlay',
  'voice-delivery-1',
  'color-delivery-1',
])
const colorFinalPayload = validateOfflineRemotionFinalCompositionPlanningPayload(
  asRecord(colorFinalItem.executionInput.structuredPayload),
)
assert.equal(colorFinalPayload.compositionProfileId, 'approved_source_caption_final_v1')
if (colorFinalPayload.compositionProfileId !== 'approved_source_caption_final_v1') {
  throw new Error('Professional color compiled to the wrong single-source Remotion profile.')
}
assert.equal(colorFinalPayload.sourceMediaPolicy, 'approved_professional_color_intermediate_v1')
assert.equal(colorFinalPayload.sourceStartFrame, 0)
assert.equal(colorFinalPayload.sourceEndFrameExclusive, 48)
assert.equal(colorFinalPayload.audioPolicy, 'replace_with_approved_voice_tracks')
assert.deepEqual(colorFinalPayload.voiceTracks, [{
  sourceSequenceItemId: 'canonical-save-source-1',
  outputKey: 'voice-delivery-1-wav',
  durationFrames: 48,
}])
assert.deepEqual(
  asRecord(colorCanonicalPlan.components.toolStrategyPlan).toolIds,
  ['libass', 'ffmpeg', 'remotion', 'ffprobe'],
)
const colorWithoutReplacementVoicePlan = createExactProfessionalColorReviewPlan()
colorWithoutReplacementVoicePlan.audioPipelinePlan = undefined
const colorWithoutReplacementVoiceDraft = buildCanonicalPlanningDraft({
  plan: colorWithoutReplacementVoicePlan,
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(colorWithoutReplacementVoiceDraft.ok, true)
assert.equal(
  colorWithoutReplacementVoiceDraft.ok && colorWithoutReplacementVoiceDraft.draft.publication,
  undefined,
  'A silent professional-color intermediate must not replace an approved source without replacement voice.',
)
assert.match(
  colorWithoutReplacementVoiceDraft.ok
    ? colorWithoutReplacementVoiceDraft.draft.publicationBlockers.join(' ')
    : '',
  /color intermediate removes source audio.*voice delivery/i,
)

const badSourceDraft = buildCanonicalPlanningDraft({
  plan: exactPlan,
  plannerInput: baseInput,
  sourceMediaAssets: [{ ...sourceMediaAssets[0], checksumSha256: 'not-a-checksum' }],
})
assert.equal(badSourceDraft.ok, false, 'Malformed private source authority must fail before any browser request.')
const substitutedSourceDraft = buildCanonicalPlanningDraft({
  plan: exactPlan,
  plannerInput: baseInput,
  sourceMediaAssets: [{ ...sourceMediaAssets[0], uploadedClipId: 'foreign-clip' }],
})
assert.equal(substitutedSourceDraft.ok, false, 'A source record cannot be substituted for a different planned clip.')
const unprobedSourceDraft = buildCanonicalPlanningDraft({
  plan: exactPlan,
  plannerInput: baseInput,
  sourceMediaAssets: [{
    ...sourceMediaAssets[0],
    sourceMetadata: { ...sourceMediaAssets[0].sourceMetadata, probeStatus: 'unavailable' as const },
  }],
})
assert.equal(unprobedSourceDraft.ok, true, 'Unprobed source identity can still persist an exact planning handoff.')
assert.equal(
  unprobedSourceDraft.ok && unprobedSourceDraft.draft.publication,
  undefined,
  'Unprobed source metadata must block the execution candidate.',
)
const missingCleanupDecisionDraft = buildCanonicalPlanningDraft({
  plan: { ...exactPlan, sourceCleanupPlan: { ...exactPlan.sourceCleanupPlan!, decisions: [] } },
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(missingCleanupDecisionDraft.ok, false, 'The compiler must not invent a missing source cleanup decision.')
const contaminatedPlan = {
  ...exactPlan,
  compiledIntent: { ...exactPlan.compiledIntent!, storagePath: '/private/path-must-not-cross' },
} as EditPlan
const contaminatedDraft = buildCanonicalPlanningDraft({
  plan: contaminatedPlan,
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(contaminatedDraft.ok, false, 'Private path material in canonical components must fail before any browser request.')
const mismatchedCreditPlan = {
  ...exactPlan,
  creditEstimate: {
    ...exactPlan.creditEstimate,
    fallbackAllowanceCredits: (exactPlan.creditEstimate.fallbackAllowanceCredits ?? 0) + 1,
  },
}
const mismatchedCreditDraft = buildCanonicalPlanningDraft({
  plan: mismatchedCreditPlan,
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(mismatchedCreditDraft.ok, true, 'A stale estimate remains preservable as planning context.')
assert.equal(
  mismatchedCreditDraft.ok && mismatchedCreditDraft.draft.publication,
  undefined,
  'A mismatched visible total and fallback allowance must fail closed before canonical publication.',
)
assert.match(
  mismatchedCreditDraft.ok ? mismatchedCreditDraft.draft.publicationBlockers.join(' ') : '',
  /credit total and fallback allowance do not reconcile/i,
)

const originalMode = process.env.VITE_REEDITPRO_API_MODE
const originalBaseUrl = process.env.VITE_REEDITPRO_API_BASE_URL
const originalE2E = process.env.VITE_REEDITPRO_E2E
const originalToken = process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN
const requests: Array<{
  authorization?: string
  internalToken?: string
  body: Record<string, unknown>
  method?: string
  url?: string
}> = []
let responseIdentity = { ...identity }
let exactPreferenceAuthority = exactPreferenceFixture({
  ...exactPreferenceValues(baseInput),
  workflowType: 'custom_let_ai_decide',
  targetPlatform: 'custom',
}, 4, 2)

const server = createServer((request, response) => {
  const chunks: Buffer[] = []
  request.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
  request.on('end', () => {
    const bodyText = Buffer.concat(chunks).toString('utf8')
    const body = bodyText ? JSON.parse(bodyText) as Record<string, unknown> : {}
    requests.push({
      authorization: request.headers.authorization,
      internalToken: request.headers['x-reeditpro-internal-token'] as string | undefined,
      body,
      method: request.method,
      url: request.url,
    })
    const serialized = JSON.stringify(body)
    assert.doesNotMatch(serialized, /storagePath|path-must-never-cross|signedUrl|publicUrl|sourceBytes|bytesBase64/)
    response.setHeader('content-type', 'application/json')
    if (request.url?.includes('/edit-preferences')) {
      if (request.method === 'GET') {
        response.end(JSON.stringify({
          ok: true,
          data: { preferenceRecord: exactPreferenceAuthority },
          warnings: [],
        }))
        return
      }
      assert.equal(request.method, 'PATCH')
      assert.equal(body.workspaceId, identity.workspaceId)
      assert.equal(body.expectedRevision, exactPreferenceAuthority.recordRevision)
      const patch = body.patch as Record<string, unknown>
      assert.deepEqual(patch, {
        workflowType: baseInput.workflowType,
        targetPlatform: baseInput.targetPlatform,
      })
      exactPreferenceAuthority = exactPreferenceFixture(
        { ...exactPreferenceAuthority.values, ...patch } as ReturnType<typeof exactPreferenceValues>,
        exactPreferenceAuthority.recordRevision + 1,
        exactPreferenceAuthority.preferenceRevision + 1,
      )
      response.end(JSON.stringify({
        ok: true,
        data: {
          preferenceRecord: exactPreferenceAuthority,
          changedFields: Object.keys(patch),
          invalidation: {
            cause: 'preference_change',
            changedInputs: Object.keys(patch),
            draftPlanCleared: true,
            draftEstimateCleared: true,
            sourcePreparationReset: false,
            frameConfirmationReset: true,
            invalidatedAt: '2026-07-13T12:00:00.000Z',
          },
          replayed: false,
        },
        warnings: [],
      }))
      return
    }
    if (request.url?.endsWith('/plan-presentations')) {
      response.statusCode = 201
      response.end(JSON.stringify({
        ok: true,
        data: { canonicalPlanPublicationRequest: publicationFixture(responseIdentity) },
        warnings: [],
      }))
      return
    }
    if (request.url?.endsWith('/canonical-revision-plan-presentations')) {
      response.statusCode = 201
      response.end(JSON.stringify({
        ok: true,
        data: {
          canonicalRevisionPlanPresentation: revisionPresentationFixture(
            responseIdentity,
          ),
        },
        warnings: [],
      }))
      return
    }
    response.end(JSON.stringify({
      ok: true,
      data: { canonicalPlanningHandoff: handoffFixture(responseIdentity) },
      warnings: [],
    }))
  })
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object')
process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${address.port}`
process.env.VITE_REEDITPRO_E2E = 'true'
process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN = 'canonical-save-smoke-token'

const scope: ProjectPersistenceScope = {
  authMode: 'local_test',
  userId: 'canonical-save-user',
  workspaceId: identity.workspaceId,
}

try {
  const { getApiRouteById } = await import('../../src/backend/api/api-route-registry')
  const { saveCanonicalPlanningForNamedEdit } = await import('../../src/lib/canonical-planning-publication-client')
  for (const routeId of [
    'planning.exactEditPreferences.get',
    'planning.exactEditPreferences.update',
    'planning.canonicalHandoff.create',
    'planning.canonicalPublicationRequest.create',
    'planning.canonicalPlanPresentation.create',
    'planning.canonicalRevisionPlanPresentation.create',
  ]) {
    const route = getApiRouteById(routeId)
    assert.equal(route?.runtimeMode, 'frontend_safe')
    assert.equal(route?.status, 'frontend_safe_ready')
    assert.equal(route?.requiresServiceRole, false)
    assert.equal(route?.requiresProviderSecret, false)
    assert.equal(route?.requiresStripeSecret, false)
  }

  const richResult = await saveCanonicalPlanningForNamedEdit({
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    plan: richPlan,
    plannerInput: baseInput,
    sourceMediaAssets,
  })
  assert.equal(richResult.status, 'handoff_saved_waiting_for_compiler')
  assert.equal(richResult.handoffSaved, true)
  assert.equal(richResult.candidateSaved, false)
  assert.equal(requests.length, 3, 'The first save must synchronize exact preferences, then stop after the rich-plan handoff.')
  assert.deepEqual(requests.slice(0, 3).map((request) => request.method), ['GET', 'PATCH', 'POST'])

  const firstExactSave = saveCanonicalPlanningForNamedEdit({
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    plan: exactPlan,
    plannerInput: baseInput,
    sourceMediaAssets,
  })
  const duplicateExactSave = saveCanonicalPlanningForNamedEdit({
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    plan: exactPlan,
    plannerInput: baseInput,
    sourceMediaAssets,
  })
  assert.equal(duplicateExactSave, firstExactSave, 'Identical in-flight saves must share one bounded request chain.')
  const exactResult = await firstExactSave
  assert.equal(exactResult.status, 'plan_published_waiting_for_approval')
  assert.equal(exactResult.handoffSaved, true)
  assert.equal(exactResult.candidateSaved, true)
  assert.deepEqual(exactResult.presentedPlan, {
    planId: 'canonical-save-plan',
    planVersion: 1,
    planHash: sha('9'),
  })
  assert.equal(requests.length, 6, 'Exact save should read exact preferences, then issue one handoff and one presentation request.')
  assert.equal(requests.every((request) => request.authorization === 'Bearer canonical-save-smoke-token'), true)
  assert.match(requests[5]?.url ?? '', /canonical-planning-handoffs\/canonical-save-handoff\/plan-presentations$/)
  const exactHandoffBody = requests[4]?.body as {
    canonicalPlanComponents?: {
      confirmedSettings?: {
        preferenceSnapshotId?: string
        preferenceRevision?: number
        professionalExportCoverage?: unknown
      }
    }
  }
  assert.deepEqual(exactHandoffBody.canonicalPlanComponents?.confirmedSettings, {
    aspectRatio: '16:9',
    outputFrame: { width: 3840, height: 2160, fps: 24 },
    outputFramePurpose: 'private_canonical_4k_master_review',
    professionalExportCoverage: exactPlan.creditEstimate.professionalExportCoverage,
    outputFrameConfirmed: true,
    sourceOrderConfirmed: true,
    sourceCleanupConfirmed: true,
    editLevel: 'pro',
    targetPlatform: 'youtube',
    preferenceSnapshotId: 'server-authority-preference-snapshot',
    preferenceRevision: 3,
  }, 'Canonical components must use the exact server-owned baseline, preference revision, and approved 4K delivery ceiling.')
  assert.deepEqual(
    exactHandoffBody.canonicalPlanComponents?.confirmedSettings?.professionalExportCoverage,
    exactPlan.creditEstimate.professionalExportCoverage,
    'The frontend-safe handoff must forward the exact immutable 4K estimate coverage object without rewriting it.',
  )
  assert.equal(requests.some((request) => request.url?.endsWith('/publish')), false, 'The browser must never call the internal publication route.')
  assert.equal(requests.some((request) => Boolean(request.internalToken)), false)

  exactPreferenceAuthority = {
    ...exactPreferenceAuthority,
    lifecycle: {
      phase: 'revision_requested',
      locked: true,
    },
  }
  const revisionJourney = {
    identity: { ...identity },
    stage: 'revision_requested' as const,
    privateReviewMediaAuthority: {
      mode: 'history' as const,
      reviewAssemblyId: 'canonical-save-review-assembly',
      packageRecordId: 'canonical-save-package',
      expectedDecisionManifestSha256: sha('6'),
      expectedFinalArtifactSha256: sha('5'),
    },
    plan: {
      version: 1,
      status: 'approved' as const,
      estimateStatus: 'approved' as const,
      maximumCredits: exactPlan.creditEstimate.total,
      workItemCount: 5,
    },
    approval: {
      reservedCredits: exactPlan.creditEstimate.total,
      reservationStatus: 'reserved' as const,
      jobCount: 5,
    },
    review: {
      decision: 'request_revision' as const,
      decisionStatus: 'canonical_revision_requested' as const,
    },
    inspectionOnly: true as const,
    testOnly: true as const,
  }
  const revisionStart = requests.length
  const revisionResult = await saveCanonicalPlanningForNamedEdit({
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    plan: exactPlan,
    plannerInput: baseInput,
    sourceMediaAssets,
    revisionJourney,
  })
  assert.equal(revisionResult.status, 'plan_published_waiting_for_approval')
  assert.deepEqual(revisionResult.presentedPlan, {
    planId: 'canonical-save-plan-v2',
    planVersion: 2,
    planHash: sha('8'),
  })
  assert.equal(requests.length, revisionStart + 2)
  assert.deepEqual(
    requests.slice(revisionStart).map((request) => request.method),
    ['GET', 'POST'],
    'A revision must read locked preferences, then use only the server-owned revision coordinator.',
  )
  const revisionRequest = requests.at(-1)
  assert.match(
    revisionRequest?.url ?? '',
    /canonical-revision-plan-presentations$/,
  )
  assert.equal(
    JSON.stringify(revisionRequest?.body).includes('revisionAuthority'),
    false,
    'Raw revision publication authority must never be browser-authored.',
  )
  const revisionCanonicalPlan = asRecord(revisionRequest?.body.canonicalPlan)
  const revisionComponents = asRecord(revisionCanonicalPlan.components)
  const revisionCompiledIntent = asRecord(revisionComponents.compiledIntent)
  assert.equal('revisionIntentHash' in revisionCompiledIntent, false)
  assert.equal('priorApprovedSnapshotId' in revisionCompiledIntent, false)
  assert.equal('reviewDecisionId' in revisionCompiledIntent, false)

  const changedLockedPreferenceStart = requests.length
  const changedLockedPreference = await saveCanonicalPlanningForNamedEdit({
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    plan: exactPlan,
    plannerInput: {
      ...baseInput,
      moodStyle: 'premium',
    },
    sourceMediaAssets,
    revisionJourney,
  })
  assert.equal(changedLockedPreference.status, 'blocked')
  assert.match(changedLockedPreference.message, /structural replan/i)
  assert.equal(
    requests.length,
    changedLockedPreferenceStart + 1,
    'A locked-preference change may read exact authority but must not submit a replacement plan.',
  )
  assert.equal(requests.at(-1)?.method, 'GET')

  exactPreferenceAuthority = {
    ...exactPreferenceAuthority,
    lifecycle: { phase: 'planning', locked: false },
  }
  responseIdentity = { ...identity, workspaceId: 'workspace-foreign' }
  const foreign = await saveCanonicalPlanningForNamedEdit({
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    plan: exactPlan,
    plannerInput: { ...baseInput, customInstructions: 'Create a distinct save request.' },
    sourceMediaAssets,
  })
  assert.equal(foreign.status, 'invalid_response', 'Foreign workspace identity must fail closed before candidate submission.')
  assert.equal(foreign.handoffSaved, false)
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  restoreEnv('VITE_REEDITPRO_API_MODE', originalMode)
  restoreEnv('VITE_REEDITPRO_API_BASE_URL', originalBaseUrl)
  restoreEnv('VITE_REEDITPRO_E2E', originalE2E)
  restoreEnv('VITE_REEDITPRO_E2E_AUTH_TOKEN', originalToken)
}

console.log('Canonical planning publication frontend client smoke passed.')

function exactPreferenceValues(input: PlannerInput) {
  assert.ok(input.cleanupPreference)
  return {
    editLevel: input.editLevel,
    workflowType: input.workflowType,
    cleanupPreference: input.cleanupPreference,
    visualPreference: input.visualPreference,
    moodStyle: input.moodStyle,
    creditPreference: input.creditPreference,
    targetPlatform: input.targetPlatform,
  }
}

function exactPreferenceFixture(
  values: ReturnType<typeof exactPreferenceValues>,
  recordRevision: number,
  preferenceRevision: number,
) {
  const baselineValues = exactPreferenceValues(baseInput)
  return {
    schemaVersion: 'private-exact-edit-preferences-v1',
    workspaceId: identity.workspaceId,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    baseline: {
      values: baselineValues,
      preferenceSnapshotId: 'server-authority-preference-snapshot',
      capturedAt: '2026-07-13T12:00:00.000Z',
      persistenceSource: 'authenticated_private_internal_backend',
      provenance: 'saved_edit_preferences',
    },
    values,
    overrideKeys: Object.keys(values).filter((key) =>
      values[key as keyof typeof values] !== baselineValues[key as keyof typeof baselineValues]),
    recordRevision,
    preferenceRevision,
    preferenceUpdatedAt: '2026-07-13T12:00:00.000Z',
    planning: {
      planningInputRevision: preferenceRevision,
      preferenceFingerprintSha256: sha('7'),
      replanRequired: true,
      reestimateRequired: true,
      sourcePreparation: { status: 'not_started', updatedAt: '2026-07-13T12:00:00.000Z' },
      frameConfirmation: { status: 'unconfirmed', updatedAt: '2026-07-13T12:00:00.000Z' },
    },
    lifecycle: { phase: 'planning', locked: false },
    auditSummary: { eventCount: recordRevision + 1, latestEventAt: '2026-07-13T12:00:00.000Z' },
    createdAt: '2026-07-13T12:00:00.000Z',
    updatedAt: '2026-07-13T12:00:00.000Z',
    privateInternalOnly: true,
  }
}

function createExactPrivateReviewPlan(): EditPlan {
  const plan = createGuidedMockEditPlan(baseInput)
  const timing = plan.masterTimingPlan!
  timing.timingBase = {
    ...timing.timingBase,
    fps: 24,
    totalDurationSeconds: 2,
    totalFrames: 48,
    sourceDurationSeconds: 2,
    finalDurationSeconds: 2,
  }
  timing.finalTimelineSegments = [{
    ...timing.finalTimelineSegments[0]!,
    segmentId: 'segment-1',
    finalRange: frameRange(0, 2, 0, 48),
  }]
  timing.captionTimingItems = [{
    ...timing.captionTimingItems[0]!,
    captionText: 'Approved frame accurate caption',
    timeRange: frameRange(0, 2, 0, 48),
  }]
  timing.visualTimingItems = []
  timing.transitionTimingItems = []
  timing.sfxTimingItems = []
  timing.musicDuckingTimingItems = []
  timing.providerClipTimingItems = []
  const cleanup = plan.sourceCleanupPlan!
  const decision = cleanup.decisions[0]! as unknown as Record<string, unknown>
  decision.selectedRange = frameRange(0, 2, 0, 48)
  decision.sourceRange = {
    clipId: baseInput.clips[0]!.id,
    startSeconds: 0,
    endSeconds: 2,
    durationSeconds: 2,
    startFrame: 0,
    endFrame: 48,
    notes: [],
  }
  decision.decision = 'preserve'
  decision.riskLevel = 'low'
  synchronizeProfessionalExportCoverage(plan)
  plan.visualAssetPlan = []
  plan.providerPromptPlans = []
  plan.segmentEditPlans = []
  plan.colorPipelinePlan = undefined
  plan.audioPipelinePlan = undefined
  return plan
}

function createExactMultiSourcePrivateReviewPlan(): EditPlan {
  const plan = createGuidedMockEditPlan(multiSourceInput)
  const timing = plan.masterTimingPlan!
  timing.timingBase = {
    ...timing.timingBase,
    fps: 24,
    totalDurationSeconds: 2,
    totalFrames: 48,
    sourceDurationSeconds: 2,
    finalDurationSeconds: 2,
  }
  const segmentTemplate = timing.finalTimelineSegments[0]!
  timing.finalTimelineSegments = [{
    ...segmentTemplate,
    id: 'timeline-segment-1',
    segmentId: 'segment-1',
    label: 'First approved source',
    finalRange: frameRange(0, 1, 0, 24),
  }, {
    ...segmentTemplate,
    id: 'timeline-segment-2',
    segmentId: 'segment-2',
    label: 'Second approved source',
    finalRange: frameRange(1, 2, 24, 48),
  }]
  const captionTemplate = timing.captionTimingItems[0]!
  timing.captionTimingItems = [{
    ...captionTemplate,
    id: 'multi-caption-1',
    captionText: 'Approved first source caption',
    timeRange: frameRange(0, 1, 0, 24),
  }, {
    ...captionTemplate,
    id: 'multi-caption-2',
    captionText: 'Approved second source caption',
    timeRange: frameRange(1, 2, 24, 48),
  }]
  timing.visualTimingItems = []
  timing.sfxTimingItems = []
  timing.musicDuckingTimingItems = []
  timing.providerClipTimingItems = []
  applyExactMultiSourceHardCut(plan, timing)
  const cleanup = plan.sourceCleanupPlan!
  const decisionTemplate = cleanup.decisions[0]!
  cleanup.decisions = multiSourceInput.clips.map((clip, index) => ({
    ...decisionTemplate,
    id: `multi-source-cleanup-${index + 1}`,
    clipId: clip.id,
    decision: 'preserve',
    reason: `Preserve approved source ${index + 1} in confirmed upload order.`,
    sourceRange: {
      ...frameRange(0, 1, 0, 24),
      clipId: clip.id,
      notes: [],
    },
    selectedRange: frameRange(0, 1, 0, 24),
    riskLevel: 'low',
    userReviewRequired: false,
  }))
  cleanup.preservedRanges = [...cleanup.decisions]
  cleanup.cutRanges = []
  cleanup.userReviewItems = []
  cleanup.finalDurationImpactSeconds = 0
  synchronizeProfessionalExportCoverage(plan)
  plan.visualAssetPlan = []
  plan.providerPromptPlans = []
  plan.segmentEditPlans = []
  plan.colorPipelinePlan = undefined
  plan.audioPipelinePlan = undefined
  return plan
}

function applyExactMultiSourceHardCut(
  plan: EditPlan,
  timing: NonNullable<EditPlan['masterTimingPlan']>,
): void {
  const hardCutRange = frameRange(1, 1, 24, 24)
  timing.transitionTimingItems = [{
    id: 'approved-hard-cut-1',
    transitionType: 'hard_cut',
    timeRange: hardCutRange,
    fromSegmentId: 'segment-1',
    toSegmentId: 'segment-2',
    refinedTransitionTimingItemId: 'approved-refined-hard-cut-1',
    beatAligned: false,
    phraseBoundaryAligned: true,
    reason: 'Exact source boundary uses an approved speech-safe hard cut.',
    qaChecks: ['The hard cut is exactly on the approved source boundary.'],
  }]
  timing.remotionLayerTimingItems = [
    ...timing.remotionLayerTimingItems.filter((layer) => layer.layerType !== 'transition'),
    {
      id: 'remotion-layer-approved-hard-cut-1',
      label: 'Approved hard cut',
      layerType: 'transition',
      timeRange: hardCutRange,
      zIndex: 80,
      reason: 'Exact source boundary uses an approved speech-safe hard cut.',
      qaChecks: ['The hard cut is exactly on the approved source boundary.'],
    },
  ]
  const soundSync = plan.soundSyncTransitionTimingPlan!
  const beatSnapTemplate = soundSync.refinedTransitionTimings[0]?.beatSnapDecision
  const beatSnapDecision = {
    ...(beatSnapTemplate ?? {
      id: 'approved-hard-cut-snap-1',
      requestedFrame: 24,
      snappedFrame: 24,
      snapDecision: 'snap_to_phrase_boundary' as const,
      speechSafe: true,
      reason: 'The exact source boundary is speech safe.',
      qaChecks: ['Speech safety is confirmed at the source boundary.'],
    }),
    id: 'approved-hard-cut-snap-1',
    targetCueId: 'approved-hard-cut-1',
    requestedFrame: 24,
    snappedFrame: 24,
    snapDecision: 'snap_to_phrase_boundary' as const,
    speechSafe: true,
  }
  soundSync.refinedTransitionTimings = [{
    id: 'approved-refined-hard-cut-1',
    transitionType: 'hard_cut',
    timeRange: hardCutRange,
    fromSegmentId: 'segment-1',
    toSegmentId: 'segment-2',
    linkedMasterTransitionTimingItemId: 'approved-hard-cut-1',
    beatSnapDecision,
    phraseBoundaryAligned: true,
    beatAligned: false,
    downbeatAligned: false,
    visualMotivated: false,
    audioMotivated: false,
    durationFrames: 0,
    riskLevel: 'low',
    reason: 'Exact source boundary uses an approved speech-safe hard cut.',
    qaChecks: ['The refined hard cut matches the approved source boundary.'],
  }]
  soundSync.refinedSfxTimings = []
  soundSync.beatSnapDecisions = [beatSnapDecision]
}

function createExactMultiSourceVoiceDeliveryPlan(): EditPlan {
  const plan = createExactMultiSourcePrivateReviewPlan()
  const template = createMockEditPlan(multiSourceInput).audioPipelinePlan!
  const projectOperations = approvedVoiceOperations('voice-project')
  plan.audioPipelinePlan = {
    ...template,
    toolsPlanned: ['ffmpeg'],
    projectOperations,
    clipPlans: multiSourceInput.clips.map((clip, index) => {
      const operations = approvedVoiceOperations(`voice-clip-${index + 1}`)
      const templateClip = template.clipPlans[index] ?? template.clipPlans[0]!
      return {
        ...templateClip,
        id: `approved-voice-clip-${index + 1}`,
        clipId: clip.id,
        clipLabel: clip.fileName,
        cleanupOperations: operations.filter((operation) =>
          ['voice_leveling', 'eq_cleanup', 'compression'].includes(operation.operation)),
        loudnessOperations: operations.filter((operation) =>
          ['loudness_normalization', 'true_peak_limit'].includes(operation.operation)),
      }
    }),
    musicBedPlan: {
      ...template.musicBedPlan,
      policy: 'none',
      duckingEnabled: false,
      duckingStrength: 'none',
      introAllowed: false,
      outroAllowed: false,
    },
    sfxPlan: {
      ...template.sfxPlan,
      policy: 'none',
      intensity: 'none',
      allowedSfxTypes: [],
      maxSfxPerMinute: 0,
      cues: [],
    },
    beatSyncPlan: {
      ...template.beatSyncPlan,
      strategy: 'none',
      bpmDetectionPlanned: false,
      onsetDetectionPlanned: false,
      cutOnBeat: false,
      visualRevealOnBeat: false,
      captionEmphasisOnBeat: false,
      cues: [],
    },
    soundSyncCues: [],
  }
  return plan
}

function createExactProfessionalColorReviewPlan(): EditPlan {
  const plan = createExactPrivateReviewPlan()
  if (!sourceOnlyFullPlan.colorPipelinePlan || !sourceOnlyFullPlan.audioPipelinePlan) {
    throw new Error('Professional color review fixture requires planned color and source-bound voice pipelines.')
  }
  plan.colorPipelinePlan = structuredClone(sourceOnlyFullPlan.colorPipelinePlan)
  plan.audioPipelinePlan = structuredClone(sourceOnlyFullPlan.audioPipelinePlan)
  return plan
}

function approvedVoiceOperations(prefix: string): AudioOperationPlan[] {
  const operation = (
    operationId: AudioOperationPlan['operation'],
    settings: Record<string, unknown>,
  ): AudioOperationPlan => ({
    id: `${prefix}-${operationId}`,
    operation: operationId,
    label: operationId.replaceAll('_', ' '),
    toolId: 'ffmpeg',
    settings: { planningOnly: true, requiresApproval: true, ...settings },
    reason: `Approved fixed professional voice recipe requires ${operationId}.`,
    status: 'future_worker',
    qaChecks: ['Execute only from the approved source-bound snapshot.'],
    workerNotes: ['Use the fixed confined FFmpeg voice-delivery recipe.'],
  })
  return [
    operation('voice_leveling', {
      voiceCleanupEnabled: true,
      voiceLeveling: true,
      targetVoiceLoudness: -14,
    }),
    operation('eq_cleanup', { eqCleanup: true, compression: true }),
    operation('compression', { compression: true, speechPriority: true }),
    operation('loudness_normalization', {
      loudnessTarget: -14,
      truePeakTarget: -1,
      normalizationMode: 'voice_first',
    }),
    operation('true_peak_limit', { truePeakTarget: -1 }),
  ]
}

function frameRange(startSeconds: number, endSeconds: number, startFrame: number, endFrame: number) {
  return {
    startSeconds,
    endSeconds,
    durationSeconds: endSeconds - startSeconds,
    startFrame,
    endFrame,
    durationFrames: endFrame - startFrame,
    fps: 24,
  }
}

function synchronizeProfessionalExportCoverage(plan: EditPlan): void {
  const coverage = buildProfessionalExportCreditCoverage({
    durationSeconds: 2,
    outputFps: 24,
    approvedAspectRatio: '16:9',
  })
  const exportLine = plan.creditEstimate.breakdown.find((item) =>
    item.label === '4K UHD render and export ceiling')
  if (!exportLine || !plan.creditEstimate.professionalExportCoverage) {
    throw new Error('Exact publication fixture requires the mandatory 4K estimate line.')
  }
  plan.creditEstimate.total +=
    coverage.maximumInternalToolCostCredits - exportLine.credits
  exportLine.credits = coverage.maximumInternalToolCostCredits
  plan.creditEstimate.professionalExportCoverage = coverage
}

function handoffFixture(foreignIdentity: typeof identity): Record<string, unknown> {
  return {
    schemaVersion: 'canonical-planning-handoff-response-v1',
    source: 'canonical_planning_handoff_service',
    identity: { ...foreignIdentity },
    canonicalPlanComponentsHash: sha('c'),
    sourceBindingManifestCandidate: {},
    sourceMediaAuthority: {},
    planningInputAuthority: {},
    resolvedPlanningInputAuthority: {},
    readiness: {
      finalizedSourceMediaVerified: true,
      exactEditPreferencesVerified: true,
      preferenceApplicationVerified: true,
      editBriefVerified: true,
      outputFrameAndCleanupVerified: true,
      readyForCanonicalPlanPublication: true,
    },
    handoffHash: sha('b'),
    handoffId: 'canonical-save-handoff',
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      createOnly: true,
      checksumProtected: true,
      contentAddressed: true,
      distributed: false,
      productionAuthority: false,
    },
    noPlanPublished: true,
    noSnapshotCreated: true,
    noCreditReservation: true,
    noToolExecution: true,
    noProviderCall: true,
    noRender: true,
    testOnly: true,
  }
}

function publicationFixture(foreignIdentity: typeof identity): Record<string, unknown> {
  return {
    schemaVersion: 'canonical-plan-publication-request-inspection-v1',
    source: 'canonical_plan_publication_request_service',
    identity: {
      ...foreignIdentity,
      handoffId: 'canonical-save-handoff',
      candidateId: 'canonical-save-candidate',
    },
    candidateHash: sha('d'),
    handoffHash: sha('b'),
    canonicalPlanComponentsHash: sha('c'),
    publicationBodyHash: sha('e'),
    publicationRequestHash: sha('f'),
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      createOnly: true,
      checksumProtected: true,
      contentAddressed: true,
      distributed: false,
      productionAuthority: false,
    },
    permissions: {
      inspectionOnly: true,
      internalPublicationRequired: true,
      planMutation: false,
      snapshotCreation: false,
      creditReservation: false,
      toolExecution: false,
      providerCall: false,
      render: false,
    },
    requestBodyReturned: false,
    pathOrCredentialReturned: false,
    testOnly: true,
    publicationStatus: 'published',
    publication: {
      planId: 'canonical-save-plan',
      planningRequestId: 'canonical-save-planning-request',
      planVersion: 1,
      planStatus: 'presented',
      planHash: sha('9'),
      internalPublicationMayBeAttempted: false,
      fullRevalidationRequired: true,
      exactReplayOnlyAfterPublication: true,
    },
  }
}

function revisionPresentationFixture(
  foreignIdentity: typeof identity,
): Record<string, unknown> {
  return {
    schemaVersion: 'canonical-revision-plan-presentation-receipt-v1',
    source: 'canonical_revision_plan_presentation_coordinator_service',
    purpose: 'present_canonical_revision_plan',
    disposition: 'replacement_plan_presented',
    identity: {
      ...foreignIdentity,
      reviewAssemblyId: 'canonical-save-review-assembly',
    },
    replacementPlan: {
      planId: 'canonical-save-plan-v2',
      planVersion: 2,
      planHash: sha('8'),
      priorPlanVersion: 1,
      freshEstimatePresented: true,
      freshApprovalRequired: true,
    },
    authority: {
      exactRevisionDecisionRevalidated: true,
      immutablePriorSnapshotPreserved: true,
      immutablePriorReviewPreserved: true,
      lockedPreferenceEvidenceReusedWithoutMutation: true,
    },
    boundaries: {
      approvalRecorded: false,
      snapshotCreated: false,
      creditReservationMutated: false,
      customerWalletMutated: false,
      workGraphStarted: false,
      toolExecutionStarted: false,
      providerCallStarted: false,
      renderStarted: false,
      billingStarted: false,
      publicDeliveryStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      productionAuthority: false,
    },
    rawRevisionAuthorityReturned: false,
    jobOrToolDetailsReturned: false,
    pathOrCredentialReturned: false,
    replayed: false,
    testOnly: true,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  assert(value && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}
