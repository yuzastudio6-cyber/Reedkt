import { z } from 'zod'

import {
  CAPTION_PRIVATE_JOB_EVIDENCE_SET_VERSION,
  CAPTION_PRIVATE_MULTILINGUAL_INSPECTION_RECEIPT_VERSION,
  CAPTION_PRIVATE_QUALIFICATION_FIXTURE_CATALOG_VERSION,
  CAPTION_PRIVATE_QUALIFICATION_FIXTURE_IDS,
  CAPTION_PRIVATE_QUALIFICATION_REPORT_VERSION,
  CAPTION_PRIVATE_VISUAL_INSPECTION_RECEIPT_VERSION,
  type CaptionPrivateJobEvidenceSet,
  type CaptionPrivateJobQualificationEvidence,
  type CaptionPrivateMultilingualInspectionReceipt,
  type CaptionPrivateQualificationFixtureId,
  type CaptionPrivateQualificationFixtureResult,
  type CaptionPrivateQualificationReport,
  type CaptionPrivateVisualInspectionReceipt,
} from '../../src/types/caption-private-qualification'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
  type CaptionsSupportedJobType,
} from '../../src/types/captions-specialist'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

interface FixtureDefinition {
  fixtureId: CaptionPrivateQualificationFixtureId
  requiredJobTypes: CaptionsSupportedJobType[]
  ownerIds: string[]
  mediaRequirement: 'required' | 'optional' | 'none'
  directVisualInspectionRequired: boolean
  exactConfirmedOutputFrameRequired: boolean
  exactTimingRequired: boolean
}

const fixture = (
  fixtureId: CaptionPrivateQualificationFixtureId,
  requiredJobTypes: CaptionsSupportedJobType[],
  ownerIds: string[],
  mediaRequirement: FixtureDefinition['mediaRequirement'],
  directVisualInspectionRequired = mediaRequirement === 'required',
  exactConfirmedOutputFrameRequired = mediaRequirement !== 'none',
  exactTimingRequired = mediaRequirement !== 'none',
): FixtureDefinition => ({
  fixtureId, requiredJobTypes, ownerIds, mediaRequirement,
  directVisualInspectionRequired, exactConfirmedOutputFrameRequired,
  exactTimingRequired,
})

export const CAPTION_PRIVATE_QUALIFICATION_CATALOG:
readonly FixtureDefinition[] = Object.freeze([
  fixture('uploaded_reference_video', [
    'plan_caption_strategy', 'inspect_project_caption_continuity',
  ], ['captions', 'canonical_upload_owner'], 'required', true, false, false),
  fixture('clean_documentary', [
    'map_caption_opportunities', 'compile_caption_approval_envelope',
    'estimate_caption_work', 'reserve_caption_space',
    'check_caption_finish_readiness', 'resolve_late_bound_caption_scene',
    'compile_caption_scene_graph', 'compile_caption_render_spec',
    'compile_accessible_caption_projection', 'recompose_caption_output',
    'inspect_caption_specific_result',
  ], ['captions', 'master_timing', 'story_timing', 'remotion'], 'required'),
  fixture('dynamic_short', [
    'classify_caption_integration', 'resolve_multi_track_caption_scene',
    'resolve_caption_mode_transition',
  ], ['captions', 'story_timing', 'remotion'], 'required'),
  fixture('small_transcript_hero_track', [
    'resolve_semantic_caption_phrases', 'resolve_hero_typography',
    'provide_speech_derived_typography_spec', 'provide_caption_phrase_lineage',
  ], ['captions', 'canonical_transcript', 'story_timing', 'remotion'], 'required'),
  fixture('text_behind_subject', [
    'resolve_subject_occluded_typography', 'provide_caption_safe_region_constraints',
  ], ['captions', 'track_all', 'remotion'], 'required'),
  fixture('text_in_front_of_subject', [
    'resolve_front_of_subject_typography',
  ], ['captions', 'track_all', 'remotion'], 'required'),
  fixture('object_anchor', [
    'resolve_object_anchored_typography', 'resolve_environmental_typography',
  ], ['captions', 'track_all', 'remotion'], 'required'),
  fixture('persistent_list', [
    'resolve_persistent_topic_typography',
  ], ['captions', 'story_timing', 'remotion'], 'required'),
  fixture('broll_co_composition', [
    'provide_caption_broll_composition_constraints',
  ], ['captions', 'broll_owner', 'remotion'], 'optional'),
  fixture('caption_to_visual', [
    'plan_caption_to_visual_handoff', 'provide_caption_to_visual_handoff_spec',
  ], ['captions', 'canonical_visual_receiver', 'story_timing'], 'optional'),
  fixture('caption_to_living_frame', [
    'provide_caption_living_frame_handoff_constraints',
    'inspect_caption_boundary_behavior',
  ], ['captions', 'living_frame', 'story_timing'], 'none', false, true, true),
  fixture('sound_designed_hero_word', [
    'provide_typographic_transition_support',
    'prepare_caption_boundary_timing_requirements',
    'provide_typographic_transition_component',
  ], ['captions', 'soundsync', 'story_timing'], 'optional'),
  fixture('multi_speaker', [
    'resolve_spatial_typography', 'resolve_multi_track_caption_scene',
  ], ['captions', 'canonical_transcript', 'remotion'], 'required'),
  fixture('busy_background', [
    'plan_caption_blocking_preview', 'resolve_spatial_typography',
    'provide_caption_safe_region_constraints',
  ], ['captions', 'visual_intelligence', 'remotion'], 'required'),
  fixture('dark_light_change', [
    'plan_caption_style_language',
  ], ['captions', 'visual_intelligence', 'remotion'], 'required'),
  fixture('multilingual', [
    'plan_caption_projections', 'compile_accessible_caption_projection',
    'provide_accessible_text_projection',
  ], ['captions', 'canonical_font_runtime', 'libass', 'remotion'], 'required'),
  fixture('reduced_motion', [
    'compile_reduced_motion_caption_projection',
  ], ['captions', 'story_timing', 'remotion'], 'required'),
  fixture('mask_failure', [
    'resolve_subject_occluded_typography', 'repair_caption_scene',
  ], ['captions', 'track_all'], 'none', false, true, true),
  fixture('alignment_failure', [
    'resolve_late_bound_caption_scene', 'repair_caption_scene',
  ], ['captions', 'canonical_transcript'], 'none', false, false, true),
  fixture('visual_intelligence_failure', [
    'plan_caption_blocking_preview', 'inspect_caption_specific_result',
  ], ['captions', 'visual_intelligence'], 'none', false, true, true),
  fixture('remotion_failure', [
    'compile_caption_render_spec', 'repair_caption_scene',
    'recompose_caption_output',
  ], ['captions', 'remotion'], 'optional', true, true, true),
  fixture('old_snapshot_compatibility', [
    'inspect_project_caption_continuity', 'check_caption_finish_readiness',
  ], ['captions', 'approved_snapshot_owner'], 'none', false, false, false),
  fixture('multiple_output_ratios', [
    'recompose_caption_output',
  ], ['captions', 'confirmed_frame_owner', 'remotion'], 'required'),
])

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const languageTag = z.string().min(2).max(64)
  .regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u)

const mediaEvidenceSchema = z.object({
  evidenceId: safeKey,
  artifactRef: refSchema,
  sourceMediaRef: refSchema,
  canonicalUploadManifestRef: refSchema.nullable(),
  canonicalUploadRereadVerified: z.boolean(),
  contentType: z.enum(['video/mp4', 'image/png']),
  width: z.number().int().positive().max(3_840),
  height: z.number().int().positive().max(3_840),
  fps: z.number().int().positive().max(120).nullable(),
  durationFrames: z.number().int().positive().max(36_000).nullable(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']),
  languageTags: z.array(languageTag).min(1).max(16),
  sourceClass: z.enum([
    'controlled_private_actual_media', 'prior_caption_private_runtime',
    'canonical_private_pipeline_artifact',
  ]),
  actualFileBytesProcessed: z.literal(true),
  actualPackageRuntimeExecuted: z.literal(true),
  deterministicTechnicalQaPassed: z.literal(true),
  deterministicReplayMatched: z.boolean(),
  directVisualInspectionRequired: z.boolean(),
  directVisualInspectionReceiptRef: refSchema.nullable(),
  completePlaybackInspected: z.boolean(),
  inspectedFrameNumbers: z.array(z.number().int().nonnegative()).max(64),
  privateInternalOnly: z.literal(true),
  customerMediaClaimed: z.literal(false),
  representativeProductionFootageClaimed: z.literal(false),
  pathsOrUrlsSerialized: z.literal(false),
  mediaBytesSerialized: z.literal(false),
  providerOrModelCallMade: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((item, context) => {
  if (item.artifactRef.contentHash !== item.sourceMediaRef.contentHash
    && item.sourceClass === 'prior_caption_private_runtime'
    && item.sourceMediaRef.id === item.artifactRef.id) {
    context.addIssue({ code: z.ZodIssueCode.custom,
      message: 'A prior runtime artifact cannot reuse its ID with a different digest.' })
  }
  if ((item.contentType === 'video/mp4') !== (item.fps !== null
    && item.durationFrames !== null)) {
    context.addIssue({ code: z.ZodIssueCode.custom,
      message: 'Only MP4 media may claim frame-rate and duration evidence.' })
  }
  if (item.directVisualInspectionRequired
    && (item.directVisualInspectionReceiptRef === null
      || item.inspectedFrameNumbers.length < 1)) {
    context.addIssue({ code: z.ZodIssueCode.custom,
      message: 'Directly inspected media requires an exact receipt and inspected frames.' })
  }
  if (!item.directVisualInspectionRequired
    && (item.directVisualInspectionReceiptRef !== null
      || item.completePlaybackInspected || item.inspectedFrameNumbers.length > 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom,
      message: 'Media cannot carry undeclared visual-inspection claims.' })
  }
  if (new Set(item.languageTags).size !== item.languageTags.length
    || new Set(item.inspectedFrameNumbers).size !== item.inspectedFrameNumbers.length) {
    context.addIssue({ code: z.ZodIssueCode.custom,
      message: 'Media evidence lists must be unique.' })
  }
})

const inspectionFrameSchema = z.object({
  frameNumber: z.number().int().nonnegative().max(36_000),
  rasterSha256: sha256,
  actualRasterOpenedAndInspected: z.literal(true),
  disposition: z.literal('passed'),
  findingCodes: z.array(safeKey).min(1).max(32),
}).strict()

const inspectionOutputSchema = z.object({
  outputId: safeKey,
  sourceClass: z.enum([
    'canonical_uploaded_source_composition',
    'caption_creative_scene_group_proxy',
  ]),
  artifactRef: refSchema,
  width: z.number().int().positive().max(3_840),
  height: z.number().int().positive().max(3_840),
  fps: z.number().int().positive().max(120),
  durationFrames: z.number().int().positive().max(36_000),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']),
  contactSheetRasterSha256: sha256,
  requestedFrameNumbers: z.array(z.number().int().nonnegative()).min(1).max(64),
  inspectedFrames: z.array(inspectionFrameSchema).min(1).max(64),
  directInspectionDisposition:
    z.literal('accepted_controlled_private_fixture'),
}).strict()

const inspectionReceiptSchema:
z.ZodType<CaptionPrivateVisualInspectionReceipt> = z.object({
  schemaVersion: z.literal(CAPTION_PRIVATE_VISUAL_INSPECTION_RECEIPT_VERSION),
  receiptId: safeKey,
  receiptDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  sourceManifestCandidateRef: refSchema,
  referenceManifestCandidateRef: refSchema,
  inspectedOutputs: z.array(inspectionOutputSchema).length(5),
  exactOutputSetComplete: z.literal(true),
  actualRenderedPixelsOpenedAndInspected: z.literal(true),
  everyRequestedFrameInspected: z.literal(true),
  completePlaybackInspectionPerformed: z.literal(false),
  qualifiedAiCompleteTimeReviewPerformed: z.literal(false),
  controlledFixtureOnly: z.literal(true),
  customerMediaClaimed: z.literal(false),
  representativeProductionFootageClaimed: z.literal(false),
  technicalQaReplaced: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  pathsOrUrlsSerialized: z.literal(false),
  mediaBytesSerialized: z.literal(false),
  providerOrModelCallMade: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const multilingualInspectionOutputSchema = z.object({
  outputId: z.enum(['fr-combining', 'ja', 'ar', 'hi']),
  languageTag: z.enum(['fr', 'ja', 'ar', 'hi']),
  captionDigestSha256: sha256,
  overlayArtifactRef: refSchema,
  compositeArtifactRef: refSchema,
  inspectedFrameRef: refSchema,
  width: z.literal(640),
  height: z.literal(360),
  fps: z.literal(24),
  durationFrames: z.literal(48),
  inspectedFrameNumber: z.literal(24),
  alphaBoundingBox: z.object({
    left: z.number().int().nonnegative().max(639),
    top: z.number().int().min(180).max(359),
    width: z.number().int().positive().max(640),
    height: z.number().int().positive().max(180),
  }).strict(),
  nonTransparentPixelCount: z.number().int().min(100).max(640 * 360),
  actualRasterOpenedAndInspected: z.literal(true),
  shapingDisposition: z.literal('accepted_reviewed_script_fixture'),
  findingCodes: z.array(safeKey).min(2).max(16),
}).strict()

const multilingualInspectionReceiptSchema:
z.ZodType<CaptionPrivateMultilingualInspectionReceipt> = z.object({
  schemaVersion: z.literal(
    CAPTION_PRIVATE_MULTILINGUAL_INSPECTION_RECEIPT_VERSION),
  receiptId: safeKey,
  receiptDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  controlledSourceArtifactRef: refSchema,
  libassImageRef: refSchema,
  remotionImageRef: refSchema,
  fontPackRef: refSchema,
  fontAssetRefs: z.array(refSchema).length(4),
  contactSheetRasterRef: refSchema,
  fontToolsVersion: z.literal('4.38.0'),
  openTypeSanitizerVersion: z.literal('8.2.1'),
  libassVersion: z.literal('0.17.5'),
  outputs: z.array(multilingualInspectionOutputSchema).length(4),
  exactOutputSetComplete: z.literal(true),
  actualFontToolsBuildValidationExecuted: z.literal(true),
  fontToolsSubsetRoundTripPassed: z.literal(true),
  actualOpenTypeSanitizerBuildValidationExecuted: z.literal(true),
  malformedFontRejectedByOpenTypeSanitizer: z.literal(true),
  actualLibassHarfBuzzFribidiRenderingExecuted: z.literal(true),
  actualRemotionFinalCompositionExecuted: z.literal(true),
  actualPinnedFfprobeQaExecuted: z.literal(true),
  directRenderedFrameInspectionExecuted: z.literal(true),
  completePlaybackInspectionPerformed: z.literal(false),
  remotionBrowserTextShapingClaimed: z.literal(false),
  colorEmojiIncluded: z.literal(false),
  runtimeFontDownloadOccurred: z.literal(false),
  callerFontPathAccepted: z.literal(false),
  controlledFixtureOnly: z.literal(true),
  customerMediaClaimed: z.literal(false),
  representativeProductionFootageClaimed: z.literal(false),
  pathsOrUrlsSerialized: z.literal(false),
  mediaBytesSerialized: z.literal(false),
  providerOrModelCallMade: z.literal(false),
  fullTrackOrVideoBurnInReady: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const exactInspectionOutputIds = [
  'caption-cap18-output-wide',
  'caption-cap18-output-vertical',
  'caption-cap18-output-square',
  'caption-cap18-output-creative-full',
  'caption-cap18-output-creative-reduced',
] as const

const exactMultilingualInspectionOutputs = [
  ['fr-combining', 'fr'], ['ja', 'ja'], ['ar', 'ar'], ['hi', 'hi'],
] as const
const exactMultilingualFontAssetIds = [
  'caption.font.noto-sans.regular',
  'caption.font.noto-sans-arabic.regular',
  'caption.font.noto-sans-devanagari.regular',
  'caption.font.noto-sans-jp.regular',
] as const

const fixtureResultSchema: z.ZodType<CaptionPrivateQualificationFixtureResult> =
  z.object({
    fixtureId: z.enum(CAPTION_PRIVATE_QUALIFICATION_FIXTURE_IDS),
    disposition: z.enum([
      'verified_private', 'verified_contract', 'missing_integration',
      'blocked_external',
    ]),
    blockerClass: z.enum(['none', 'caption_owned', 'shared_owner', 'external']),
    requiredJobTypes: z.array(z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)).min(1).max(41),
    ownerIds: z.array(safeKey).min(1).max(16),
    evidenceRefs: z.array(refSchema).max(128),
    mediaEvidence: z.array(mediaEvidenceSchema).max(16),
    blockerCodes: z.array(safeKey).max(64),
    fallbackOrRepairCodes: z.array(safeKey).max(64),
    directVisualInspectionSatisfied: z.boolean(),
    exactConfirmedOutputFrameBound: z.boolean(),
    exactMasterTimingOrStoryTimingBound: z.boolean(),
    privateArtifactPolicySatisfied: z.literal(true),
    noDuplicateOwnerCreated: z.literal(true),
  }).strict()

const jobEvidenceSchema: z.ZodType<CaptionPrivateJobQualificationEvidence> =
  z.object({
    jobType: z.enum(CAPTIONS_SUPPORTED_JOB_TYPES),
    disposition: z.enum([
      'qualified_private_evidence', 'qualified_contract_evidence',
      'blocked_shared_dependency', 'blocked_external_evidence',
    ]),
    planningModeQualified: z.literal(true),
    privateRuntimeOwnedByCaptions: z.literal(false),
    supportingFixtureIds: z.array(z.enum(CAPTION_PRIVATE_QUALIFICATION_FIXTURE_IDS))
      .min(1).max(23),
    evidenceRefs: z.array(refSchema).max(256),
    blockerCodes: z.array(safeKey).max(128),
  }).strict()

const jobEvidenceSetSchema: z.ZodType<CaptionPrivateJobEvidenceSet> = z.object({
  schemaVersion: z.literal(CAPTION_PRIVATE_JOB_EVIDENCE_SET_VERSION),
  evidenceSetId: safeKey,
  evidenceSetDigestSha256: sha256,
  sourcePlanningQualificationSnapshotRef: refSchema,
  jobs: z.array(jobEvidenceSchema).length(CAPTIONS_SUPPORTED_JOB_TYPES.length),
  allCaptionJobTypesCovered: z.literal(true),
  planningQualificationPreserved: z.literal(true),
  runtimeOwnershipNotExpanded: z.literal(true),
  wholeSkillQualificationClaimed: z.literal(false),
  productionQualificationClaimed: z.literal(false),
}).strict()

const reportSchema: z.ZodType<CaptionPrivateQualificationReport> = z.object({
  schemaVersion: z.literal(CAPTION_PRIVATE_QUALIFICATION_REPORT_VERSION),
  reportId: safeKey,
  reportDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  fixtureCatalogVersion:
    z.literal(CAPTION_PRIVATE_QUALIFICATION_FIXTURE_CATALOG_VERSION),
  sourceReleaseRef: refSchema,
  sourcePlanningQualificationSnapshotRef: refSchema,
  jobEvidenceSetRef: refSchema,
  fixtureResults: z.array(fixtureResultSchema)
    .length(CAPTION_PRIVATE_QUALIFICATION_FIXTURE_IDS.length),
  jobEvidenceSet: jobEvidenceSetSchema,
  counts: z.object({
    totalFixtures: z.number().int().nonnegative(),
    verifiedPrivate: z.number().int().nonnegative(),
    verifiedContract: z.number().int().nonnegative(),
    missingIntegration: z.number().int().nonnegative(),
    blockedExternal: z.number().int().nonnegative(),
    totalJobs: z.number().int().nonnegative(),
    jobsWithPrivateEvidence: z.number().int().nonnegative(),
    jobsWithContractEvidence: z.number().int().nonnegative(),
    jobsBlockedSharedDependency: z.number().int().nonnegative(),
    jobsBlockedExternalEvidence: z.number().int().nonnegative(),
  }).strict(),
  captionOwnedRequirementsComplete: z.boolean(),
  sharedOwnerIntegrationComplete: z.boolean(),
  externalEvidenceComplete: z.boolean(),
  readyForCanonicalBackendWorkflowIntegration: z.boolean(),
  privateInternalSpecialistQualified: z.boolean(),
  privateInternalOnly: z.literal(true),
  actualMediaInspectedWhereClaimed: z.literal(true),
  historicalEvidenceRelabeledAsFreshRuntime: z.literal(false),
  planningContractRelabeledAsExecutionEvidence: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerRuntimeAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  finalQaApprovalAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

export function createCaptionPrivateVisualInspectionReceipt(
  input: Omit<CaptionPrivateVisualInspectionReceipt,
    'schemaVersion' | 'receiptDigestSha256'>,
): CaptionPrivateVisualInspectionReceipt {
  assertClosedContractTree(input,
    'Caption private visual inspection receipt input')
  const withoutDigest:
  Omit<CaptionPrivateVisualInspectionReceipt, 'receiptDigestSha256'> = {
    schemaVersion: CAPTION_PRIVATE_VISUAL_INSPECTION_RECEIPT_VERSION,
    ...structuredClone(input),
  }
  return parseCaptionPrivateVisualInspectionReceipt(withDigest(
    withoutDigest, 'receiptDigestSha256'))
}

export function parseCaptionPrivateVisualInspectionReceipt(
  value: unknown,
): CaptionPrivateVisualInspectionReceipt {
  assertClosedContractTree(value,
    'Caption private visual inspection receipt')
  const receipt = inspectionReceiptSchema.parse(value)
  verifyDigest(receipt as unknown as Record<string, unknown>,
    'receiptDigestSha256', 'Caption private visual inspection receipt')
  if (receipt.sourceManifestCandidateRef.version
      !== 'private-source-binding-manifest-candidate-v1'
    || receipt.referenceManifestCandidateRef.version
      !== 'private-source-binding-manifest-candidate-v1'
    || receipt.inspectedOutputs.map((item) => item.outputId).join('|')
      !== exactInspectionOutputIds.join('|')) {
    throw new Error('Caption private inspection source/output coverage is invalid.')
  }
  const expectedDimensions = new Map<string, {
    width: number
    height: number
    fps: number
    durationFrames: number
    sourceClass: CaptionPrivateVisualInspectionReceipt[
      'inspectedOutputs'][number]['sourceClass']
  }>([
    ['caption-cap18-output-wide', {
      width: 640, height: 360, fps: 24, durationFrames: 96,
      sourceClass: 'canonical_uploaded_source_composition',
    }],
    ['caption-cap18-output-vertical', {
      width: 360, height: 640, fps: 24, durationFrames: 96,
      sourceClass: 'canonical_uploaded_source_composition',
    }],
    ['caption-cap18-output-square', {
      width: 480, height: 480, fps: 24, durationFrames: 96,
      sourceClass: 'canonical_uploaded_source_composition',
    }],
    ['caption-cap18-output-creative-full', {
      width: 640, height: 360, fps: 30, durationFrames: 360,
      sourceClass: 'caption_creative_scene_group_proxy',
    }],
    ['caption-cap18-output-creative-reduced', {
      width: 640, height: 360, fps: 30, durationFrames: 360,
      sourceClass: 'caption_creative_scene_group_proxy',
    }],
  ])
  for (const output of receipt.inspectedOutputs) {
    const expected = expectedDimensions.get(output.outputId)!
    const aspectMatches = output.aspectRatio === '16:9'
      ? output.width * 9 === output.height * 16
      : output.aspectRatio === '9:16'
        ? output.width * 16 === output.height * 9
        : output.width === output.height
    if (output.width !== expected.width || output.height !== expected.height
      || output.fps !== expected.fps
      || output.durationFrames !== expected.durationFrames
      || output.sourceClass !== expected.sourceClass
      || !aspectMatches
      || output.requestedFrameNumbers.join('|')
        !== output.inspectedFrames.map((item) => item.frameNumber).join('|')
      || output.requestedFrameNumbers.some((frame) =>
        frame >= output.durationFrames)
      || new Set(output.requestedFrameNumbers).size
        !== output.requestedFrameNumbers.length
      || output.inspectedFrames.some((frame) =>
        new Set(frame.findingCodes).size !== frame.findingCodes.length)) {
      throw new Error(`Caption private inspection output ${output.outputId} is inconsistent.`)
    }
  }
  return structuredClone(receipt)
}

export function createCaptionPrivateMultilingualInspectionReceipt(
  input: Omit<CaptionPrivateMultilingualInspectionReceipt,
    'schemaVersion' | 'receiptDigestSha256'>,
): CaptionPrivateMultilingualInspectionReceipt {
  assertClosedContractTree(input,
    'Caption private multilingual inspection receipt input')
  const withoutDigest:
  Omit<CaptionPrivateMultilingualInspectionReceipt,
    'receiptDigestSha256'> = {
      schemaVersion:
        CAPTION_PRIVATE_MULTILINGUAL_INSPECTION_RECEIPT_VERSION,
      ...structuredClone(input),
    }
  return parseCaptionPrivateMultilingualInspectionReceipt(withDigest(
    withoutDigest, 'receiptDigestSha256'))
}

export function parseCaptionPrivateMultilingualInspectionReceipt(
  value: unknown,
): CaptionPrivateMultilingualInspectionReceipt {
  assertClosedContractTree(value,
    'Caption private multilingual inspection receipt')
  const receipt = multilingualInspectionReceiptSchema.parse(value)
  verifyDigest(receipt as unknown as Record<string, unknown>,
    'receiptDigestSha256',
    'Caption private multilingual inspection receipt')
  if (
    receipt.controlledSourceArtifactRef.version
      !== 'caption-controlled-source-media-v1'
    || receipt.libassImageRef.version
      !== 'offline-libass-caption-image-v2'
    || receipt.remotionImageRef.version
      !== 'offline-remotion-image-v1'
    || receipt.fontPackRef.version
      !== 'reeditpro-reviewed-font-pack-v2'
    || receipt.contactSheetRasterRef.version
      !== 'caption-direct-inspection-contact-sheet-v1'
    || receipt.fontAssetRefs.map((item) => item.id).join('|')
      !== exactMultilingualFontAssetIds.join('|')
    || new Set(receipt.fontAssetRefs.map(refKey)).size
      !== receipt.fontAssetRefs.length
    || receipt.outputs.map((item) =>
      `${item.outputId}:${item.languageTag}`).join('|')
      !== exactMultilingualInspectionOutputs.map((item) =>
        `${item[0]}:${item[1]}`).join('|')
    || new Set(receipt.outputs.map((item) =>
      item.overlayArtifactRef.contentHash)).size !== receipt.outputs.length
    || new Set(receipt.outputs.map((item) =>
      item.compositeArtifactRef.contentHash)).size !== receipt.outputs.length
  ) throw new Error(
    'Caption private multilingual inspection lineage is inconsistent.')
  const scriptFindingByOutput = new Map([
    ['fr-combining', 'combining_marks_visually_attached'],
    ['ja', 'japanese_glyphs_present'],
    ['ar', 'arabic_rtl_joining_visually_coherent'],
    ['hi', 'devanagari_conjuncts_visually_coherent'],
  ])
  for (const output of receipt.outputs) {
    if (
      output.overlayArtifactRef.version
        !== 'offline-libass-caption-overlay-v2'
      || output.compositeArtifactRef.version
        !== 'offline-remotion-caption-composite-v1'
      || output.inspectedFrameRef.version
        !== 'caption-direct-inspection-frame-v1'
      || output.alphaBoundingBox.left + output.alphaBoundingBox.width > 640
      || output.alphaBoundingBox.top + output.alphaBoundingBox.height > 360
      || new Set(output.findingCodes).size !== output.findingCodes.length
      || !output.findingCodes.includes(
        'direct_raster_visual_inspection_passed')
      || !output.findingCodes.includes(
        scriptFindingByOutput.get(output.outputId)!)
    ) throw new Error(
      `Caption multilingual output ${output.outputId} is inconsistent.`)
  }
  return structuredClone(receipt)
}

export function createCaptionPrivateQualificationReport(input: {
  reportId: string
  observedAt: string
  sourceReleaseRef: CaptionDomainRef
  sourcePlanningQualificationSnapshotRef: CaptionDomainRef
  fixtureResults: CaptionPrivateQualificationFixtureResult[]
}): CaptionPrivateQualificationReport {
  assertClosedContractTree(input, 'Caption private qualification input')
  const fixtureResults = input.fixtureResults.map((item) =>
    parseFixtureResult(item))
  validateFixtureSet(fixtureResults)
  const jobEvidenceSet = createJobEvidenceSet({
    evidenceSetId: `${input.reportId}.jobs`,
    sourcePlanningQualificationSnapshotRef:
      input.sourcePlanningQualificationSnapshotRef,
    fixtureResults,
  })
  const counts = {
    totalFixtures: fixtureResults.length,
    verifiedPrivate: fixtureResults.filter((item) =>
      item.disposition === 'verified_private').length,
    verifiedContract: fixtureResults.filter((item) =>
      item.disposition === 'verified_contract').length,
    missingIntegration: fixtureResults.filter((item) =>
      item.disposition === 'missing_integration').length,
    blockedExternal: fixtureResults.filter((item) =>
      item.disposition === 'blocked_external').length,
    totalJobs: jobEvidenceSet.jobs.length,
    jobsWithPrivateEvidence: jobEvidenceSet.jobs.filter((item) =>
      item.disposition === 'qualified_private_evidence').length,
    jobsWithContractEvidence: jobEvidenceSet.jobs.filter((item) =>
      item.disposition === 'qualified_contract_evidence').length,
    jobsBlockedSharedDependency: jobEvidenceSet.jobs.filter((item) =>
      item.disposition === 'blocked_shared_dependency').length,
    jobsBlockedExternalEvidence: jobEvidenceSet.jobs.filter((item) =>
      item.disposition === 'blocked_external_evidence').length,
  }
  const captionOwnedRequirementsComplete = !fixtureResults.some((item) =>
    item.disposition === 'missing_integration'
      && item.blockerClass === 'caption_owned')
  const sharedOwnerIntegrationComplete = !fixtureResults.some((item) =>
    item.disposition === 'missing_integration'
      && item.blockerClass === 'shared_owner')
  const externalEvidenceComplete = !fixtureResults.some((item) =>
    item.disposition === 'blocked_external')
  const withoutDigest: Omit<CaptionPrivateQualificationReport,
    'reportDigestSha256'> = {
    schemaVersion: CAPTION_PRIVATE_QUALIFICATION_REPORT_VERSION,
    reportId: safeKey.parse(input.reportId),
    observedAt: z.string().datetime({ offset: true }).parse(input.observedAt),
    fixtureCatalogVersion:
      CAPTION_PRIVATE_QUALIFICATION_FIXTURE_CATALOG_VERSION,
    sourceReleaseRef: refSchema.parse(input.sourceReleaseRef),
    sourcePlanningQualificationSnapshotRef:
      refSchema.parse(input.sourcePlanningQualificationSnapshotRef),
    jobEvidenceSetRef: {
      id: jobEvidenceSet.evidenceSetId,
      version: jobEvidenceSet.schemaVersion,
      contentHash: jobEvidenceSet.evidenceSetDigestSha256,
    },
    fixtureResults,
    jobEvidenceSet,
    counts,
    captionOwnedRequirementsComplete,
    sharedOwnerIntegrationComplete,
    externalEvidenceComplete,
    readyForCanonicalBackendWorkflowIntegration:
      captionOwnedRequirementsComplete,
    privateInternalSpecialistQualified:
      captionOwnedRequirementsComplete && sharedOwnerIntegrationComplete,
    privateInternalOnly: true,
    actualMediaInspectedWhereClaimed: true,
    historicalEvidenceRelabeledAsFreshRuntime: false,
    planningContractRelabeledAsExecutionEvidence: false,
    browserLocalCompletionAccepted: false,
    operationDispatchAuthority: false,
    providerRuntimeAuthority: false,
    assetMutationAuthority: false,
    creditOrBillingAuthority: false,
    finalQaApprovalAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  }
  return parseCaptionPrivateQualificationReport(withDigest(
    withoutDigest, 'reportDigestSha256'))
}

export function parseCaptionPrivateQualificationReport(
  value: unknown,
): CaptionPrivateQualificationReport {
  assertClosedContractTree(value, 'Caption private qualification report')
  const report = reportSchema.parse(value)
  verifyDigest(report as unknown as Record<string, unknown>,
    'reportDigestSha256', 'Caption private qualification report')
  validateFixtureSet(report.fixtureResults)
  const jobSet = parseJobEvidenceSet(report.jobEvidenceSet)
  const rebuilt = createJobEvidenceSet({
    evidenceSetId: jobSet.evidenceSetId,
    sourcePlanningQualificationSnapshotRef:
      report.sourcePlanningQualificationSnapshotRef,
    fixtureResults: report.fixtureResults,
  })
  if (JSON.stringify(rebuilt) !== JSON.stringify(jobSet)
    || !sameRef(report.jobEvidenceSetRef, {
      id: jobSet.evidenceSetId,
      version: jobSet.schemaVersion,
      contentHash: jobSet.evidenceSetDigestSha256,
    })) {
    throw new Error('Caption private job evidence does not match the fixture matrix.')
  }
  const expected = createCaptionPrivateQualificationReportUnchecked({
    ...report,
    reportDigestSha256: undefined,
  })
  if (JSON.stringify(expected.counts) !== JSON.stringify(report.counts)
    || expected.captionOwnedRequirementsComplete
      !== report.captionOwnedRequirementsComplete
    || expected.sharedOwnerIntegrationComplete
      !== report.sharedOwnerIntegrationComplete
    || expected.externalEvidenceComplete !== report.externalEvidenceComplete
    || expected.readyForCanonicalBackendWorkflowIntegration
      !== report.readyForCanonicalBackendWorkflowIntegration
    || expected.privateInternalSpecialistQualified
      !== report.privateInternalSpecialistQualified) {
    throw new Error('Caption private qualification summary is inconsistent.')
  }
  return structuredClone(report)
}

export function parseCaptionPrivateQualificationFixtureResult(
  value: unknown,
): CaptionPrivateQualificationFixtureResult {
  return parseFixtureResult(value)
}

function parseFixtureResult(value: unknown): CaptionPrivateQualificationFixtureResult {
  assertClosedContractTree(value, 'Caption private qualification fixture')
  const result = fixtureResultSchema.parse(value)
  const definition = CAPTION_PRIVATE_QUALIFICATION_CATALOG.find((item) =>
    item.fixtureId === result.fixtureId)!
  const verified = result.disposition === 'verified_private'
    || result.disposition === 'verified_contract'
  if (result.requiredJobTypes.join('|') !== definition.requiredJobTypes.join('|')
    || result.ownerIds.join('|') !== definition.ownerIds.join('|')
    || new Set(result.evidenceRefs.map(refKey)).size !== result.evidenceRefs.length
    || new Set(result.mediaEvidence.map((item) => item.evidenceId)).size
      !== result.mediaEvidence.length
    || new Set(result.blockerCodes).size !== result.blockerCodes.length
    || new Set(result.fallbackOrRepairCodes).size
      !== result.fallbackOrRepairCodes.length
    || (verified && (result.blockerClass !== 'none'
      || result.evidenceRefs.length === 0 || result.blockerCodes.length > 0))
    || (!verified && (result.blockerClass === 'none'
      || result.blockerCodes.length === 0))
    || (result.disposition === 'blocked_external'
      && result.blockerClass !== 'external')
    || (result.disposition === 'missing_integration'
      && !['caption_owned', 'shared_owner'].includes(result.blockerClass))
    || (result.disposition === 'verified_contract'
      && result.mediaEvidence.length > 0)
    || (result.disposition === 'verified_private'
      && (definition.mediaRequirement === 'none'
        || result.mediaEvidence.length === 0))
    || (definition.mediaRequirement === 'none'
      && result.mediaEvidence.length > 0)
    || (verified && definition.exactConfirmedOutputFrameRequired
      && !result.exactConfirmedOutputFrameBound)
    || (verified && definition.exactTimingRequired
      && !result.exactMasterTimingOrStoryTimingBound)
    || (verified && definition.directVisualInspectionRequired
      && !result.directVisualInspectionSatisfied)
    || result.directVisualInspectionSatisfied
      !== (result.mediaEvidence.length > 0
        && result.mediaEvidence.filter((item) =>
          item.directVisualInspectionRequired).every((item) =>
          item.directVisualInspectionReceiptRef !== null
            && item.inspectedFrameNumbers.length > 0))) {
    throw new Error(`Caption private fixture ${result.fixtureId} is inconsistent.`)
  }
  return structuredClone(result)
}

function createJobEvidenceSet(input: {
  evidenceSetId: string
  sourcePlanningQualificationSnapshotRef: CaptionDomainRef
  fixtureResults: CaptionPrivateQualificationFixtureResult[]
}): CaptionPrivateJobEvidenceSet {
  const jobs = CAPTIONS_SUPPORTED_JOB_TYPES.map((jobType) => {
    const supporting = input.fixtureResults.filter((fixtureResult) =>
      fixtureResult.requiredJobTypes.includes(jobType))
    if (supporting.length === 0) {
      throw new Error(`Caption job ${jobType} has no CAP-18 evidence fixture.`)
    }
    const hasCaptionBlocker = supporting.some((item) =>
      item.disposition === 'missing_integration'
        && item.blockerClass === 'caption_owned')
    const hasSharedBlocker = supporting.some((item) =>
      item.disposition === 'missing_integration'
        && item.blockerClass === 'shared_owner')
    const hasExternalBlocker = supporting.some((item) =>
      item.disposition === 'blocked_external')
    const hasPrivate = supporting.some((item) =>
      item.disposition === 'verified_private')
    const disposition: CaptionPrivateJobQualificationEvidence['disposition'] =
      hasCaptionBlocker || hasSharedBlocker
        ? 'blocked_shared_dependency'
        : hasExternalBlocker
          ? 'blocked_external_evidence'
          : hasPrivate
            ? 'qualified_private_evidence'
            : 'qualified_contract_evidence'
    const evidenceRefs = uniqueRefs(supporting.flatMap((item) =>
      item.evidenceRefs))
    const blockerCodes = Array.from(new Set(supporting.flatMap((item) =>
      item.blockerCodes)))
    return {
      jobType,
      disposition,
      planningModeQualified: true as const,
      privateRuntimeOwnedByCaptions: false as const,
      supportingFixtureIds: supporting.map((item) => item.fixtureId),
      evidenceRefs,
      blockerCodes,
    }
  })
  const withoutDigest: Omit<CaptionPrivateJobEvidenceSet,
    'evidenceSetDigestSha256'> = {
    schemaVersion: CAPTION_PRIVATE_JOB_EVIDENCE_SET_VERSION,
    evidenceSetId: safeKey.parse(input.evidenceSetId),
    sourcePlanningQualificationSnapshotRef:
      refSchema.parse(input.sourcePlanningQualificationSnapshotRef),
    jobs,
    allCaptionJobTypesCovered: true,
    planningQualificationPreserved: true,
    runtimeOwnershipNotExpanded: true,
    wholeSkillQualificationClaimed: false,
    productionQualificationClaimed: false,
  }
  return parseJobEvidenceSet(withDigest(
    withoutDigest, 'evidenceSetDigestSha256'))
}

function parseJobEvidenceSet(value: unknown): CaptionPrivateJobEvidenceSet {
  assertClosedContractTree(value, 'Caption private job evidence set')
  const set = jobEvidenceSetSchema.parse(value)
  verifyDigest(set as unknown as Record<string, unknown>,
    'evidenceSetDigestSha256', 'Caption private job evidence set')
  if (set.jobs.map((item) => item.jobType).join('|')
    !== CAPTIONS_SUPPORTED_JOB_TYPES.join('|')
    || set.jobs.some((job) =>
      new Set(job.supportingFixtureIds).size !== job.supportingFixtureIds.length
      || new Set(job.evidenceRefs.map(refKey)).size !== job.evidenceRefs.length
      || new Set(job.blockerCodes).size !== job.blockerCodes.length
      || (job.disposition.startsWith('qualified') && job.blockerCodes.length > 0)
      || (job.disposition.startsWith('blocked') && job.blockerCodes.length === 0))) {
    throw new Error('Caption private job evidence coverage is invalid.')
  }
  return structuredClone(set)
}

function validateFixtureSet(
  results: CaptionPrivateQualificationFixtureResult[],
): void {
  if (results.map((item) => item.fixtureId).join('|')
    !== CAPTION_PRIVATE_QUALIFICATION_FIXTURE_IDS.join('|')) {
    throw new Error('Caption private qualification fixture coverage is incomplete or reordered.')
  }
}

function createCaptionPrivateQualificationReportUnchecked(input:
  Omit<CaptionPrivateQualificationReport, 'reportDigestSha256'> & {
    reportDigestSha256?: undefined
  },
): Pick<CaptionPrivateQualificationReport,
  'counts' | 'captionOwnedRequirementsComplete'
  | 'sharedOwnerIntegrationComplete' | 'externalEvidenceComplete'
  | 'readyForCanonicalBackendWorkflowIntegration'
  | 'privateInternalSpecialistQualified'> {
  const fixtureResults = input.fixtureResults
  const jobs = input.jobEvidenceSet.jobs
  const captionOwnedRequirementsComplete = !fixtureResults.some((item) =>
    item.disposition === 'missing_integration'
      && item.blockerClass === 'caption_owned')
  const sharedOwnerIntegrationComplete = !fixtureResults.some((item) =>
    item.disposition === 'missing_integration'
      && item.blockerClass === 'shared_owner')
  const externalEvidenceComplete = !fixtureResults.some((item) =>
    item.disposition === 'blocked_external')
  return {
    counts: {
      totalFixtures: fixtureResults.length,
      verifiedPrivate: fixtureResults.filter((item) =>
        item.disposition === 'verified_private').length,
      verifiedContract: fixtureResults.filter((item) =>
        item.disposition === 'verified_contract').length,
      missingIntegration: fixtureResults.filter((item) =>
        item.disposition === 'missing_integration').length,
      blockedExternal: fixtureResults.filter((item) =>
        item.disposition === 'blocked_external').length,
      totalJobs: jobs.length,
      jobsWithPrivateEvidence: jobs.filter((item) =>
        item.disposition === 'qualified_private_evidence').length,
      jobsWithContractEvidence: jobs.filter((item) =>
        item.disposition === 'qualified_contract_evidence').length,
      jobsBlockedSharedDependency: jobs.filter((item) =>
        item.disposition === 'blocked_shared_dependency').length,
      jobsBlockedExternalEvidence: jobs.filter((item) =>
        item.disposition === 'blocked_external_evidence').length,
    },
    captionOwnedRequirementsComplete,
    sharedOwnerIntegrationComplete,
    externalEvidenceComplete,
    readyForCanonicalBackendWorkflowIntegration:
      captionOwnedRequirementsComplete,
    privateInternalSpecialistQualified:
      captionOwnedRequirementsComplete && sharedOwnerIntegrationComplete,
  }
}

function withDigest<T extends object>(
  value: T,
  field: string,
): T & Record<string, string> {
  const candidate = { ...value, [field]: '' }
  return {
    ...value,
    [field]: calculateSkillContractDigest(candidate, field),
  } as T & Record<string, string>
}

function verifyDigest(
  value: Record<string, unknown>,
  field: string,
  label: string,
): void {
  if (value[field] !== calculateSkillContractDigest(value, field)) {
    throw new Error(`${label} digest is stale.`)
  }
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function uniqueRefs(values: CaptionDomainRef[]): CaptionDomainRef[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = refKey(value)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).map((value) => structuredClone(value))
}
