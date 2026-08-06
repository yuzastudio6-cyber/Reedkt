import { z } from 'zod'

import type {
  MotionStudioDeliveryHandoffV1,
  MotionStudioFineCutArtifactV1,
  MotionStudioFineCutBindingV1,
  MotionStudioFineCutManifestV1,
  MotionStudioFineCutRenderQualityReportV1,
  MotionStudioFineCutReviewDecisionV1,
  MotionStudioFineCutWorkspaceDtoV1,
  MotionStudioPrivateReviewBindingV1,
  MotionStudioQualityControlReportV1,
  MotionStudioReviewCommentEventV1,
  MotionStudioReviewCommentV1,
  MotionStudioRevisionImpactV1,
} from '../../../types/motion-studio/fine-cut'
import {
  MOTION_STUDIO_DELIVERY_HANDOFF_VERSION,
  MOTION_STUDIO_FINE_CUT_ARTIFACT_VERSION,
  MOTION_STUDIO_FINE_CUT_BINDING_VERSION,
  MOTION_STUDIO_FINE_CUT_MANIFEST_VERSION,
  MOTION_STUDIO_FINE_CUT_RENDER_QUALITY_VERSION,
  MOTION_STUDIO_FINE_CUT_REVIEW_DECISION_VERSION,
  MOTION_STUDIO_FINE_CUT_WORKSPACE_DTO_VERSION,
  MOTION_STUDIO_PRIVATE_REVIEW_BINDING_VERSION,
  MOTION_STUDIO_QUALITY_CONTROL_REPORT_VERSION,
  MOTION_STUDIO_REVIEW_COMMENT_EVENT_VERSION,
  MOTION_STUDIO_REVIEW_COMMENT_VERSION,
  MOTION_STUDIO_REVISION_IMPACT_VERSION,
} from '../../../types/motion-studio/fine-cut'

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/u)
const positiveSafeInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const nonnegativeSafeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const timestamp = z.string().datetime({ offset: true })
const safeText = boundedSafeText(1, 4_000)
const targetPath = z.string().trim().min(1).max(512)
  .regex(/^\/(?:[A-Za-z0-9._:-]+(?:\/[A-Za-z0-9._:-]+)*)?$/u)
  .refine((value) => !value.includes('..'))

const ownershipSchema = z.object({
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
}).strict()

const versionReferenceSchema = z.object({
  artifactId: stableId,
  versionId: stableId,
  versionNumber: positiveSafeInteger,
  contentDigest: digest,
}).strict()

const timingAuthoritySchema = z.object({
  masterTimingPlanVersionId: stableId,
  confirmedFrameId: stableId,
  timingAuthorityDigest: digest,
  frameRate: positiveSafeInteger.max(120),
  width: positiveSafeInteger.max(8_192),
  height: positiveSafeInteger.max(8_192),
  aspectRatio: z.string().regex(/^\d{1,4}:\d{1,4}$/u),
  durationFrames: positiveSafeInteger.max(5_184_000),
  timebase: z.string().regex(/^\d{1,6}\/\d{1,6}$/u),
}).strict()

const authorityRoleSchema = z.enum([
  'picture_lock',
  'prepared_script',
  'story_bible',
  'research_package',
  'claim_ledger',
  'reconstruction_disclosure',
  'visual_coverage_plan',
  'reference_contract',
  'motion_dna',
  'motion_strategy',
  'visual_memory',
  'character_continuity',
  'location_continuity',
  'object_continuity',
  'source_audit',
  'rights_consent_provenance',
  'voice_bible',
  'pronunciation_performance',
  'music_bible',
  'cue_sheet',
  'scene_graph',
  'scene_document',
  'scene_recipe',
  'storyboard',
  'animatic',
  'audio_selection',
  'narration_assembly',
  'integrated_audio_mix',
  'caption_plan',
  'map_plan',
  'chart_plan',
  'document_plan',
  'exact_text_plan',
  'transition_plan',
  'color_plan',
])

const versionAuthoritySchema = z.object({
  role: authorityRoleSchema,
  version: versionReferenceSchema,
  state: z.enum(['approved', 'locked']),
  current: z.literal(true),
  qaPassed: z.literal(true),
  rightsVerified: z.literal(true),
  placeholder: z.literal(false),
}).strict()

const manifestAuthoritySchema = z.object({
  manifestId: stableId,
  manifestVersionId: stableId,
  manifestVersion: positiveSafeInteger,
  manifestDigest: digest,
  current: z.literal(true),
  qaPassed: z.literal(true),
}).strict()

const sceneAuthoritySchema = z.object({
  sceneId: stableId,
  sceneDocument: versionAuthoritySchema,
  startFrame: nonnegativeSafeInteger,
  endFrame: positiveSafeInteger,
  selectedAssetVersionIds: z.array(stableId).min(1).max(512).readonly(),
  propertyLockIds: z.array(stableId).max(512).readonly(),
}).strict().superRefine((value, context) => {
  if (value.sceneDocument.role !== 'scene_document') issue(context, ['sceneDocument', 'role'], 'Scene authority requires a SceneDocument role.')
  if (value.endFrame <= value.startFrame) issue(context, ['endFrame'], 'Scene frame range must be positive.')
  uniqueOrIssue(value.selectedAssetVersionIds, context, ['selectedAssetVersionIds'])
  uniqueOrIssue(value.propertyLockIds, context, ['propertyLockIds'])
})

const assetAuthoritySchema = z.object({
  assetId: stableId,
  assetVersionId: stableId,
  checksumSha256: digest,
  contentDigest: digest,
  mimeType: z.enum([
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/mp4',
    'audio/wav',
    'application/json',
    'text/vtt',
  ]),
  sceneId: stableId,
  layerId: stableId,
  startFrame: nonnegativeSafeInteger,
  endFrame: positiveSafeInteger,
  required: z.literal(true),
  current: z.literal(true),
  qaPassed: z.literal(true),
  privateAsset: z.literal(true),
  placeholder: z.literal(false),
  rightsVerified: z.literal(true),
  provenanceVerified: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.endFrame <= value.startFrame) issue(context, ['endFrame'], 'Asset frame range must be positive.')
})

const costAuthoritySchema = z.object({
  approvedEstimateId: stableId,
  approvedEstimateDigest: digest,
  planApprovalId: stableId,
  planApprovalDigest: digest,
  costBudgetId: stableId,
  internalCostActualId: stableId,
  internalCostActualDigest: digest,
  maximumAuthorizedInternalCostMicros: positiveSafeInteger,
  inheritedActualInternalCostMicros: nonnegativeSafeInteger,
  fineCutMaximumIncrementalInternalCostMicros: nonnegativeSafeInteger,
  currency: z.literal('USD'),
  reconciled: z.literal(true),
  withinApprovedMaximum: z.literal(true),
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  walletMutationPerformed: z.literal(false),
  billingMutationPerformed: z.literal(false),
}).strict().superRefine((value, context) => {
  if (
    value.inheritedActualInternalCostMicros +
      value.fineCutMaximumIncrementalInternalCostMicros >
      value.maximumAuthorizedInternalCostMicros
  ) issue(context, ['maximumAuthorizedInternalCostMicros'], 'Fine Cut cost exceeds the exact approved maximum.')
})

export const motionStudioFineCutManifestV1Schema:
z.ZodType<MotionStudioFineCutManifestV1> = ownershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_FINE_CUT_MANIFEST_VERSION),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  productionRecordVersion: positiveSafeInteger,
  moduleCatalogVersion: stableId,
  stageProfileId: stableId,
  fineCutId: stableId,
  fineCutVersionId: stableId,
  fineCutVersion: positiveSafeInteger,
  supersedesFineCutVersionId: stableId.optional(),
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  timingAuthority: timingAuthoritySchema,
  pictureLock: versionAuthoritySchema,
  preparedScript: versionAuthoritySchema,
  storyBible: versionAuthoritySchema,
  researchPackage: versionAuthoritySchema,
  claimLedger: versionAuthoritySchema,
  reconstructionDisclosure: versionAuthoritySchema,
  visualCoveragePlan: versionAuthoritySchema,
  referenceContracts: z.array(versionAuthoritySchema).min(1).max(64).readonly(),
  motionDna: versionAuthoritySchema,
  motionStrategy: versionAuthoritySchema,
  visualMemory: z.array(versionAuthoritySchema).min(1).max(256).readonly(),
  continuityAuthorities: z.array(versionAuthoritySchema).min(3).max(256).readonly(),
  sourceAudits: z.array(versionAuthoritySchema).min(1).max(256).readonly(),
  rightsConsentProvenance: z.array(versionAuthoritySchema).min(1).max(256).readonly(),
  voiceBible: versionAuthoritySchema,
  pronunciationPerformance: versionAuthoritySchema,
  musicBible: versionAuthoritySchema,
  cueSheet: versionAuthoritySchema,
  sceneGraph: versionAuthoritySchema,
  sceneRecipes: z.array(versionAuthoritySchema).min(1).max(512).readonly(),
  storyboard: versionAuthoritySchema,
  animatic: versionAuthoritySchema,
  audioSelection: versionAuthoritySchema,
  narrationAssembly: versionAuthoritySchema,
  integratedAudioMix: versionAuthoritySchema,
  captionPlan: versionAuthoritySchema,
  mapPlan: versionAuthoritySchema,
  chartPlan: versionAuthoritySchema,
  documentPlan: versionAuthoritySchema,
  exactTextPlan: versionAuthoritySchema,
  transitionPlan: versionAuthoritySchema,
  colorPlan: versionAuthoritySchema,
  timelineManifest: manifestAuthoritySchema,
  renderManifest: manifestAuthoritySchema,
  dependencyGraphManifest: manifestAuthoritySchema,
  scenes: z.array(sceneAuthoritySchema).min(1).max(512).readonly(),
  requiredAssets: z.array(assetAuthoritySchema).min(1).max(4_096).readonly(),
  requiredWorkItemIds: z.array(stableId).min(1).max(4_096).readonly(),
  requiredQaGateIds: z.array(stableId).min(1).max(512).readonly(),
  costAuthority: costAuthoritySchema,
  sourceAuthorityDigest: digest,
  invalidationState: z.literal('current_no_unresolved_invalidation'),
  fineCutEligible: z.literal(true),
  eligibilityDerivedBy: z.literal('motion_studio_fine_cut_compiler_v1'),
  immutable: z.literal(true),
  timelineMutationAllowed: z.literal(false),
  providerCallAllowed: z.literal(false),
  exportAllowed: z.literal(false),
  publicDeliveryAllowed: z.literal(false),
  productReady: z.literal(false),
  createdAt: timestamp,
}).strict().superRefine(validateFineCutManifest)

export const motionStudioFineCutBindingV1Schema:
z.ZodType<MotionStudioFineCutBindingV1> = ownershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_FINE_CUT_BINDING_VERSION),
  productionId: stableId,
  bindingId: stableId,
  fineCutVersionId: stableId,
  fineCutManifestDigest: digest,
  approvedSnapshotId: stableId,
  packageRecordId: stableId,
  approvedWorkItemId: stableId,
  jobId: stableId,
  costBudgetId: stableId,
  maximumAttempts: z.literal(1),
  automaticRetry: z.literal(false),
  automaticFallback: z.literal(false),
  automaticSubstitution: z.literal(false),
  canonicalPackageQueue: z.literal(true),
  registeredCompositionOnly: z.literal(true),
  callerCodeAllowed: z.literal(false),
  callerArgumentsAllowed: z.literal(false),
  callerPathAllowed: z.literal(false),
  providerUrlAllowed: z.literal(false),
  privateReviewOnly: z.literal(true),
  immutable: z.literal(true),
}).strict()

export const motionStudioFineCutArtifactV1Schema:
z.ZodType<MotionStudioFineCutArtifactV1> = ownershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_FINE_CUT_ARTIFACT_VERSION),
  productionId: stableId,
  artifactId: stableId,
  artifactVersionId: stableId,
  fineCutVersionId: stableId,
  fineCutManifestDigest: digest,
  canonicalReviewAssemblyId: stableId,
  canonicalReviewManifestSha256: digest,
  checksumSha256: digest,
  byteLength: positiveSafeInteger.max(2 * 1024 * 1024 * 1024),
  mimeType: z.literal('video/mp4'),
  codec: z.literal('h264'),
  audioCodec: z.literal('aac'),
  pixelFormat: z.literal('yuv420p'),
  colorSpace: z.literal('bt709'),
  width: positiveSafeInteger.max(8_192),
  height: positiveSafeInteger.max(8_192),
  frameRate: positiveSafeInteger.max(120),
  durationFrames: positiveSafeInteger.max(5_184_000),
  privateAsset: z.literal(true),
  createOnly: z.literal(true),
  checksumVerified: z.literal(true),
  privateReadbackVerified: z.literal(true),
  proxyReviewArtifact: z.literal(true),
  masterExportQualityClaimed: z.literal(false),
  qaStatus: z.enum(['pending_independent_qa', 'passed', 'failed']),
  timelineReady: z.literal(false),
  exportReady: z.literal(false),
  publicDeliveryReady: z.literal(false),
  productReady: z.literal(false),
  createdAt: timestamp,
  immutable: z.literal(true),
}).strict()

export const MOTION_STUDIO_FINE_CUT_RENDER_QA_GATES = [
  'manifest_integrity',
  'media_integrity',
  'frame_count_and_duration',
  'frame_rate_and_output_frame',
  'video_decode',
  'audio_decode_and_stream_count',
  'audio_video_sync',
  'black_and_frozen_frames',
  'color_space_and_pixel_format',
  'checksum_and_private_readback',
] as const

const renderQaGateResultSchema = z.object({
  gate: z.enum(MOTION_STUDIO_FINE_CUT_RENDER_QA_GATES),
  status: z.enum(['passed', 'failed', 'not_run']),
  blocking: z.literal(true),
  evidenceId: stableId.optional(),
  evidenceDigest: digest.optional(),
  note: safeText,
}).strict().superRefine((value, context) => {
  if (value.status === 'passed' && (!value.evidenceId || !value.evidenceDigest)) {
    issue(context, ['evidenceId'], 'A passed render-QA gate requires exact evidence.')
  }
})

export const motionStudioFineCutRenderQualityReportV1Schema:
z.ZodType<MotionStudioFineCutRenderQualityReportV1> = ownershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_FINE_CUT_RENDER_QUALITY_VERSION),
  productionId: stableId,
  reportId: stableId,
  fineCutVersionId: stableId,
  fineCutManifestDigest: digest,
  artifactId: stableId,
  artifactVersionId: stableId,
  artifactChecksumSha256: digest,
  gateResults: z.array(renderQaGateResultSchema)
    .length(MOTION_STUDIO_FINE_CUT_RENDER_QA_GATES.length).readonly(),
  allBlockingGatesPassed: z.boolean(),
  privateReviewEligible: z.boolean(),
  humanOverrideAllowed: z.literal(false),
  createdAt: timestamp,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  exactGateSet(value.gateResults.map((result) => result.gate), MOTION_STUDIO_FINE_CUT_RENDER_QA_GATES, context)
  const passed = value.gateResults.every((result) => result.status === 'passed')
  if (value.allBlockingGatesPassed !== passed || value.privateReviewEligible !== passed) {
    issue(context, ['allBlockingGatesPassed'], 'Private review requires every render-QA gate to pass.')
  }
})

export const motionStudioPrivateReviewBindingV1Schema:
z.ZodType<MotionStudioPrivateReviewBindingV1> = ownershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_PRIVATE_REVIEW_BINDING_VERSION),
  productionId: stableId,
  reviewBindingId: stableId,
  fineCutVersionId: stableId,
  fineCutManifestDigest: digest,
  canonicalPackageRecordId: stableId,
  canonicalReviewAssemblyId: stableId,
  canonicalReviewManifestSha256: digest,
  canonicalFinalArtifactSha256: digest,
  artifactId: stableId,
  artifactVersionId: stableId,
  durationFrames: positiveSafeInteger.max(5_184_000),
  frameRate: positiveSafeInteger.max(120),
  width: positiveSafeInteger.max(8_192),
  height: positiveSafeInteger.max(8_192),
  renderQualityReportId: stableId,
  renderQualityReportDigest: digest,
  renderQaPassed: z.literal(true),
  current: z.literal(true),
  privateReviewReady: z.literal(true),
  publicExportReady: z.literal(false),
  productReady: z.literal(false),
  immutable: z.literal(true),
}).strict()

export const motionStudioFrameRangeV1Schema = z.object({
  startFrame: nonnegativeSafeInteger,
  endFrame: positiveSafeInteger,
}).strict().superRefine((value, context) => {
  if (value.endFrame <= value.startFrame) issue(context, ['endFrame'], 'Frame range must be positive.')
})

export const motionStudioReviewCommentV1Schema:
z.ZodType<MotionStudioReviewCommentV1> = ownershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_REVIEW_COMMENT_VERSION),
  productionId: stableId,
  commentId: stableId,
  fineCutVersionId: stableId,
  reviewBindingId: stableId,
  fineCutDurationFrames: positiveSafeInteger.max(5_184_000),
  frameRange: motionStudioFrameRangeV1Schema,
  body: boundedSafeText(2, 2_000),
  authoredByActorId: stableId,
  createdAt: timestamp,
  originalState: z.literal('open'),
  inertUntrustedText: z.literal(true),
  toolInvocationAllowed: z.literal(false),
  productionMutationAllowed: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.frameRange.endFrame > value.fineCutDurationFrames) {
    issue(context, ['frameRange', 'endFrame'], 'Review comment frame range must remain inside the exact Fine Cut duration.')
  }
})

export const motionStudioReviewCommentEventV1Schema:
z.ZodType<MotionStudioReviewCommentEventV1> = ownershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_REVIEW_COMMENT_EVENT_VERSION),
  productionId: stableId,
  eventId: stableId,
  commentId: stableId,
  fineCutVersionId: stableId,
  sequence: positiveSafeInteger,
  expectedPreviousState: z.enum(['open', 'resolved', 'reopened', 'dismissed']),
  event: z.enum(['resolve', 'reopen', 'dismiss']),
  resultingState: z.enum(['resolved', 'reopened', 'dismissed']),
  reason: boundedSafeText(2, 1_000),
  actorId: stableId,
  createdAt: timestamp,
  appendOnly: z.literal(true),
  originalCommentMutated: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const valid = value.event === 'resolve'
    ? ['open', 'reopened'].includes(value.expectedPreviousState) && value.resultingState === 'resolved'
    : value.event === 'reopen'
      ? ['resolved', 'dismissed'].includes(value.expectedPreviousState) && value.resultingState === 'reopened'
      : ['open', 'reopened'].includes(value.expectedPreviousState) && value.resultingState === 'dismissed'
  if (!valid) issue(context, ['event'], 'Comment event does not form a valid append-only state transition.')
})

export function deriveMotionStudioReviewCommentStateV1(
  commentInput: MotionStudioReviewCommentV1,
  eventInputs: readonly MotionStudioReviewCommentEventV1[],
): 'open' | 'resolved' | 'reopened' | 'dismissed' {
  const comment = motionStudioReviewCommentV1Schema.parse(commentInput)
  const events = eventInputs.map((event) =>
    motionStudioReviewCommentEventV1Schema.parse(event))
  uniqueOrThrow(events.map((event) => event.eventId), 'Review comment event IDs')
  let state: 'open' | 'resolved' | 'reopened' | 'dismissed' = comment.originalState
  let lastCreatedAt = comment.createdAt
  events.forEach((event, index) => {
    if (
      event.workspaceId !== comment.workspaceId ||
      event.projectId !== comment.projectId ||
      event.editSessionId !== comment.editSessionId ||
      event.productionId !== comment.productionId ||
      event.commentId !== comment.commentId ||
      event.fineCutVersionId !== comment.fineCutVersionId
    ) throw new Error('Review comment events must preserve the exact immutable comment authority.')
    if (event.sequence !== index + 1) {
      throw new Error('Review comment events must be contiguous and append-only from sequence 1.')
    }
    if (event.expectedPreviousState !== state) {
      throw new Error('Review comment event previous state does not match current append-only state.')
    }
    if (event.createdAt <= lastCreatedAt) {
      throw new Error('Review comment events must preserve strictly increasing time authority.')
    }
    state = event.resultingState
    lastCreatedAt = event.createdAt
  })
  return state
}

export const motionStudioFineCutReviewDecisionV1Schema:
z.ZodType<MotionStudioFineCutReviewDecisionV1> = ownershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_FINE_CUT_REVIEW_DECISION_VERSION),
  productionId: stableId,
  decisionId: stableId,
  fineCutVersionId: stableId,
  reviewBindingId: stableId,
  canonicalReviewAssemblyId: stableId,
  canonicalReviewManifestSha256: digest,
  canonicalFinalArtifactSha256: digest,
  expectedReviewRecordVersion: positiveSafeInteger,
  decision: z.enum(['approve', 'request_changes', 'reject']),
  commentIds: z.array(stableId).max(2_048).readonly(),
  unresolvedActionRequiredCommentIds: z.array(stableId).max(2_048).readonly(),
  renderQaPassed: z.boolean(),
  blockingQualityControlPassed: z.boolean(),
  currentFineCutReverified: z.literal(true),
  decidedByActorId: stableId,
  decidedAt: timestamp,
  immutable: z.literal(true),
  humanOverrideOfBlockingQaAllowed: z.literal(false),
  fineCutLocked: z.boolean(),
  revisionImpactRequired: z.boolean(),
  deliveryEligible: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  renderStarted: z.literal(false),
  exportStarted: z.literal(false),
  publicDeliveryStarted: z.literal(false),
}).strict().superRefine((value, context) => {
  uniqueOrIssue(value.commentIds, context, ['commentIds'])
  uniqueOrIssue(value.unresolvedActionRequiredCommentIds, context, ['unresolvedActionRequiredCommentIds'])
  if (value.unresolvedActionRequiredCommentIds.some((id) => !value.commentIds.includes(id))) {
    issue(context, ['unresolvedActionRequiredCommentIds'], 'Unresolved comments must belong to this exact review decision.')
  }
  const approving = value.decision === 'approve'
  if (
    approving &&
    (!value.renderQaPassed || value.unresolvedActionRequiredCommentIds.length > 0 ||
      !value.fineCutLocked || value.revisionImpactRequired)
  ) issue(context, ['decision'], 'Fine Cut approval requires current passed render QA and no unresolved action comments.')
  if (!approving && (value.fineCutLocked || !value.revisionImpactRequired)) {
    issue(context, ['decision'], 'A change or rejection decision must preserve the prior version and require impact analysis.')
  }
})

const sampleRangeSchema = z.object({
  startSample: nonnegativeSafeInteger,
  endSample: positiveSafeInteger,
}).strict().superRefine((value, context) => {
  if (value.endSample <= value.startSample) issue(context, ['endSample'], 'Audio sample range must be positive.')
})

export const motionStudioRevisionImpactV1Schema:
z.ZodType<MotionStudioRevisionImpactV1> = ownershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_REVISION_IMPACT_VERSION),
  productionId: stableId,
  impactId: stableId,
  fineCutVersionId: stableId,
  sourceDecisionId: stableId,
  sourceCommentIds: z.array(stableId).max(2_048).readonly(),
  chatRevisionProposalId: stableId,
  normalizedRequestedChange: boundedSafeText(8, 4_000),
  affectedArtifactVersionIds: z.array(stableId).max(4_096).readonly(),
  affectedTargetPaths: z.array(targetPath).max(4_096).readonly(),
  affectedSceneIds: z.array(stableId).max(512).readonly(),
  affectedShotIds: z.array(stableId).max(4_096).readonly(),
  affectedFrameRanges: z.array(motionStudioFrameRangeV1Schema).max(4_096).readonly(),
  affectedAudioSampleRanges: z.array(sampleRangeSchema).max(4_096).readonly(),
  affectedJobIds: z.array(stableId).max(4_096).readonly(),
  affectedAssetVersionIds: z.array(stableId).max(4_096).readonly(),
  affectedRenderIds: z.array(stableId).max(4_096).readonly(),
  invalidatedLockIds: z.array(stableId).max(4_096).readonly(),
  preservedArtifactVersionIds: z.array(stableId).max(4_096).readonly(),
  preservedLockIds: z.array(stableId).max(4_096).readonly(),
  changesMeaning: z.boolean(),
  changesTimingOrFrame: z.boolean(),
  changesRightsOrConsent: z.boolean(),
  changesProviderRoute: z.boolean(),
  changesQualityAuthority: z.boolean(),
  requiresGeneration: z.boolean(),
  requiresPrivateRender: z.boolean(),
  changesInternalCost: z.boolean(),
  estimatedIncrementalInternalCostMicros: nonnegativeSafeInteger,
  remainingApprovedInternalCostMicros: nonnegativeSafeInteger,
  withinApprovedMaximum: z.boolean(),
  approvalStillCoversChange: z.boolean(),
  approvedFallbackAuthorityId: stableId.optional(),
  approvedFallbackAuthorityDigest: digest.optional(),
  route: z.enum([
    'covered_no_cost_metadata_or_render_only',
    'new_private_render_within_approved_maximum',
    'new_plan_estimate_and_approval_required',
    'blocked_for_user_review',
  ]),
  nextAction: z.enum(['return_to_chat', 'create_successor_fine_cut', 'request_plan_review']),
  approvedFineCutMutated: z.literal(false),
  executionStarted: z.literal(false),
  createdAt: timestamp,
  immutable: z.literal(true),
}).strict().superRefine(validateRevisionImpact)

export const MOTION_STUDIO_QUALITY_CONTROL_GATES = [
  'identity_snapshot_version_dependency_integrity',
  'required_asset_completeness_no_final_placeholder',
  'story_script_claim_source_and_disclosure',
  'visual_coverage_reference_motion_language',
  'character_object_location_continuity',
  'visual_artifacts_flicker_black_freeze_plausibility',
  'camera_motion_scene_transition_coherence',
  'exact_text_captions_data_maps_logos_safe_zones',
  'frame_timing_duration_caption_and_av_sync',
  'narration_pronunciation_continuity_loudness',
  'voice_music_cue_foley_sfx_and_speech_clarity',
  'color_codec_pixel_format_and_media_integrity',
  'rights_consent_provenance_retention_disclosure',
  'must_follow_avoid_and_professional_quality',
  'internal_cost_authorization_and_reconciliation',
  'tenant_private_readback_and_delivery_eligibility',
] as const

const qualityControlGateResultSchema = z.object({
  gate: z.enum(MOTION_STUDIO_QUALITY_CONTROL_GATES),
  status: z.enum(['passed', 'warning', 'failed', 'not_run']),
  blocking: z.boolean(),
  evidenceIds: z.array(stableId).max(128).readonly(),
  evidenceDigest: digest,
  frameRange: motionStudioFrameRangeV1Schema.optional(),
  recommendedAction: boundedSafeText(1, 1_000),
  warningAcknowledgementId: stableId.optional(),
}).strict().superRefine((value, context) => {
  if (value.status !== 'not_run' && value.evidenceIds.length < 1) {
    issue(context, ['evidenceIds'], 'A completed quality gate requires exact evidence.')
  }
  if (['failed', 'not_run'].includes(value.status) && !value.blocking) {
    issue(context, ['blocking'], 'Failed or not-run final Quality Control gates must block delivery.')
  }
  if (value.status === 'warning' && value.blocking) {
    issue(context, ['blocking'], 'A warning is non-blocking and requires explicit acknowledgement.')
  }
  if (value.status === 'passed' && !value.blocking) {
    issue(context, ['blocking'], 'A passed final Quality Control gate preserves its blocking authority.')
  }
  if (value.status !== 'warning' && value.warningAcknowledgementId) {
    issue(context, ['warningAcknowledgementId'], 'Only a warning can carry an acknowledgement.')
  }
})

export const motionStudioQualityControlReportV1Schema:
z.ZodType<MotionStudioQualityControlReportV1> = ownershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_QUALITY_CONTROL_REPORT_VERSION),
  productionId: stableId,
  reportId: stableId,
  fineCutVersionId: stableId,
  fineCutManifestDigest: digest,
  reviewDecisionId: stableId,
  gateResults: z.array(qualityControlGateResultSchema)
    .length(MOTION_STUDIO_QUALITY_CONTROL_GATES.length).readonly(),
  allRequiredGatesPresentExactlyOnce: z.boolean(),
  allBlockingGatesPassed: z.boolean(),
  allWarningsAcknowledged: z.boolean(),
  status: z.enum(['blocked', 'warnings_require_acknowledgement', 'passed']),
  deliveryEligible: z.boolean(),
  humanOverrideOfBlockingQaAllowed: z.literal(false),
  internalCostActualId: stableId,
  internalCostActualDigest: digest,
  approvedMaximumInternalCostMicros: positiveSafeInteger,
  reconciledActualInternalCostMicros: nonnegativeSafeInteger,
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  walletMutationPerformed: z.literal(false),
  billingMutationPerformed: z.literal(false),
  createdAt: timestamp,
  immutable: z.literal(true),
}).strict().superRefine(validateQualityControlReport)

export const motionStudioDeliveryHandoffV1Schema:
z.ZodType<MotionStudioDeliveryHandoffV1> = ownershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_DELIVERY_HANDOFF_VERSION),
  productionId: stableId,
  handoffId: stableId,
  fineCutVersionId: stableId,
  fineCutManifestDigest: digest,
  fineCutReviewDecisionId: stableId,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  qualityControlReportId: stableId,
  qualityControlReportDigest: digest,
  existingExportRecordId: stableId,
  exportManifestId: stableId,
  exportManifestDigest: digest,
  timelineManifestId: stableId,
  timelineManifestDigest: digest,
  renderManifestId: stableId,
  renderManifestDigest: digest,
  internalCostActualId: stableId,
  deliveryApprovalId: stableId,
  deliveryApprovalDigest: digest,
  privateOutputAssetVersionIds: z.array(stableId).min(1).max(4_096).readonly(),
  provenanceRecordIds: z.array(stableId).min(1).max(4_096).readonly(),
  currentAuthorityDigest: digest,
  status: z.literal('ready_for_existing_export_system'),
  currentAuthorityReverified: z.literal(true),
  deliveryApproved: z.literal(true),
  publicUrlCreated: z.literal(false),
  publicLinkCreated: z.literal(false),
  externalUploadStarted: z.literal(false),
  publicExportStarted: z.literal(false),
  customerChargeStarted: z.literal(false),
  deploymentStarted: z.literal(false),
  immutable: z.literal(true),
  createdAt: timestamp,
}).strict().superRefine((value, context) => {
  uniqueOrIssue(value.privateOutputAssetVersionIds, context, ['privateOutputAssetVersionIds'])
  uniqueOrIssue(value.provenanceRecordIds, context, ['provenanceRecordIds'])
})

export const motionStudioFineCutWorkspaceDtoV1Schema:
z.ZodType<MotionStudioFineCutWorkspaceDtoV1> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_FINE_CUT_WORKSPACE_DTO_VERSION),
  productionId: stableId,
  state: z.enum([
    'empty',
    'preparing',
    'rendering',
    'failed',
    'reconciliation_required',
    'cancelled',
    'ready_for_review',
    'changes_requested',
    'stale',
    'approved_locked',
    'quality_control_blocked',
    'delivery_ready',
    'private_complete',
    'access_denied',
    'not_found',
    'unavailable',
  ]),
  currentFineCut: z.object({
    versionId: stableId,
    version: positiveSafeInteger,
    reviewable: z.boolean(),
    locked: z.boolean(),
  }).strict().optional(),
  review: z.object({
    mediaReady: z.boolean(),
    commentCount: nonnegativeSafeInteger.max(2_048),
    unresolvedActionRequiredCommentCount: nonnegativeSafeInteger.max(2_048),
    decision: z.enum(['approve', 'request_changes', 'reject']).optional(),
  }).strict().optional(),
  qualityControl: z.object({
    status: z.enum(['not_ready', 'blocked', 'warnings_require_acknowledgement', 'passed']),
    blockingFailureCount: nonnegativeSafeInteger.max(128),
    warningCount: nonnegativeSafeInteger.max(128),
  }).strict().optional(),
  delivery: z.object({
    readyForExistingExportSystem: z.boolean(),
    privateComplete: z.boolean(),
  }).strict().optional(),
  recovery: z.object({
    retryAvailable: z.boolean(),
    resumeAvailable: z.boolean(),
    reconciliationRequired: z.boolean(),
    preservedInput: z.boolean(),
  }).strict().optional(),
  primaryAction: z.enum([
    'continue_in_chat',
    'load_private_review',
    'review_changes',
    'acknowledge_warnings',
    'retry_preparation',
    'resume_preparation',
    'reconcile_result',
    'prepare_delivery',
    'none',
  ]),
  message: boundedSafeText(1, 500),
  privateOnly: z.literal(true),
  providerCallAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
  renderStartAllowedFromWorkspace: z.literal(false),
  exportStartAllowedFromWorkspace: z.literal(false),
  publicDeliveryAllowed: z.literal(false),
  customerCommercialAuthority: z.literal(false),
}).strict()

function validateFineCutManifest(
  value: MotionStudioFineCutManifestV1,
  context: z.RefinementCtx,
): void {
  const expectedRoles: Array<[keyof MotionStudioFineCutManifestV1, string]> = [
    ['pictureLock', 'picture_lock'],
    ['preparedScript', 'prepared_script'],
    ['storyBible', 'story_bible'],
    ['researchPackage', 'research_package'],
    ['claimLedger', 'claim_ledger'],
    ['reconstructionDisclosure', 'reconstruction_disclosure'],
    ['visualCoveragePlan', 'visual_coverage_plan'],
    ['motionDna', 'motion_dna'],
    ['motionStrategy', 'motion_strategy'],
    ['voiceBible', 'voice_bible'],
    ['pronunciationPerformance', 'pronunciation_performance'],
    ['musicBible', 'music_bible'],
    ['cueSheet', 'cue_sheet'],
    ['sceneGraph', 'scene_graph'],
    ['storyboard', 'storyboard'],
    ['animatic', 'animatic'],
    ['audioSelection', 'audio_selection'],
    ['narrationAssembly', 'narration_assembly'],
    ['integratedAudioMix', 'integrated_audio_mix'],
    ['captionPlan', 'caption_plan'],
    ['mapPlan', 'map_plan'],
    ['chartPlan', 'chart_plan'],
    ['documentPlan', 'document_plan'],
    ['exactTextPlan', 'exact_text_plan'],
    ['transitionPlan', 'transition_plan'],
    ['colorPlan', 'color_plan'],
  ]
  for (const [field, role] of expectedRoles) {
    const authority = value[field] as { role?: string }
    if (authority.role !== role) issue(context, [field, 'role'], `${String(field)} requires the ${role} authority role.`)
  }
  for (const [field, values, role] of [
    ['referenceContracts', value.referenceContracts, 'reference_contract'],
    ['visualMemory', value.visualMemory, 'visual_memory'],
    ['sourceAudits', value.sourceAudits, 'source_audit'],
    ['rightsConsentProvenance', value.rightsConsentProvenance, 'rights_consent_provenance'],
    ['sceneRecipes', value.sceneRecipes, 'scene_recipe'],
  ] as const) {
    values.forEach((authority, index) => {
      if (authority.role !== role) issue(context, [field, index, 'role'], `${field} contains an invalid authority role.`)
    })
    uniqueOrIssue(values.map((authority) => authority.version.versionId), context, [field])
  }
  const continuityRoles = new Set(value.continuityAuthorities.map((authority) => authority.role))
  for (const role of ['character_continuity', 'location_continuity', 'object_continuity'] as const) {
    if (!continuityRoles.has(role)) {
      issue(context, ['continuityAuthorities'], `Fine Cut requires the exact ${role} authority.`)
    }
  }
  if (continuityRoles.size !== value.continuityAuthorities.length) {
    issue(context, ['continuityAuthorities'], 'Continuity authority roles must be unique.')
  }
  uniqueOrIssue(
    value.continuityAuthorities.map((authority) => authority.version.versionId),
    context,
    ['continuityAuthorities'],
  )
  if (value.fineCutVersion === 1 && value.supersedesFineCutVersionId) {
    issue(context, ['supersedesFineCutVersionId'], 'The first Fine Cut version cannot supersede another version.')
  }
  if (value.fineCutVersion > 1 && !value.supersedesFineCutVersionId) {
    issue(context, ['supersedesFineCutVersionId'], 'A successor Fine Cut must identify the exact prior version.')
  }
  uniqueOrIssue(value.requiredWorkItemIds, context, ['requiredWorkItemIds'])
  uniqueOrIssue(value.requiredQaGateIds, context, ['requiredQaGateIds'])
  uniqueOrIssue(value.scenes.map((scene) => scene.sceneId), context, ['scenes'])
  uniqueOrIssue(value.scenes.map((scene) => scene.sceneDocument.version.versionId), context, ['scenes'])
  uniqueOrIssue(value.requiredAssets.map((asset) => asset.assetId), context, ['requiredAssets'])
  uniqueOrIssue(value.requiredAssets.map((asset) => asset.assetVersionId), context, ['requiredAssets'])

  const scenes = [...value.scenes].sort((left, right) => left.startFrame - right.startFrame)
  let expectedStart = 0
  const sceneById = new Map(scenes.map((scene) => [scene.sceneId, scene]))
  for (const [index, scene] of scenes.entries()) {
    if (scene.startFrame !== expectedStart) issue(context, ['scenes', index, 'startFrame'], 'Scene coverage must be ordered, contiguous and gap-free.')
    expectedStart = scene.endFrame
  }
  if (expectedStart !== value.timingAuthority.durationFrames) {
    issue(context, ['scenes'], 'Scene coverage must exactly equal Master Timing duration.')
  }

  const selectedAssetIds = scenes.flatMap((scene) => scene.selectedAssetVersionIds)
  uniqueOrIssue(selectedAssetIds, context, ['scenes'])
  if (!sameSet(selectedAssetIds, value.requiredAssets.map((asset) => asset.assetVersionId))) {
    issue(context, ['requiredAssets'], 'Every required asset must appear exactly once in its exact scene.')
  }
  const assetsByLayer = new Map<string, typeof value.requiredAssets[number][]>()
  value.requiredAssets.forEach((asset, index) => {
    const scene = sceneById.get(asset.sceneId)
    if (!scene || asset.startFrame < scene.startFrame || asset.endFrame > scene.endFrame) {
      issue(context, ['requiredAssets', index], 'Required asset frame authority must remain inside its exact scene.')
    }
    const key = `${asset.sceneId}\u0000${asset.layerId}`
    assetsByLayer.set(key, [...(assetsByLayer.get(key) ?? []), asset])
  })
  for (const assets of assetsByLayer.values()) {
    const ordered = [...assets].sort((left, right) => left.startFrame - right.startFrame)
    for (let index = 1; index < ordered.length; index += 1) {
      if (ordered[index].startFrame < ordered[index - 1].endFrame) {
        issue(context, ['requiredAssets'], 'One renderer layer cannot contain overlapping required assets.')
      }
    }
  }
}

function validateRevisionImpact(
  value: MotionStudioRevisionImpactV1,
  context: z.RefinementCtx,
): void {
  for (const [field, values] of [
    ['sourceCommentIds', value.sourceCommentIds],
    ['affectedArtifactVersionIds', value.affectedArtifactVersionIds],
    ['affectedTargetPaths', value.affectedTargetPaths],
    ['affectedSceneIds', value.affectedSceneIds],
    ['affectedShotIds', value.affectedShotIds],
    ['affectedJobIds', value.affectedJobIds],
    ['affectedAssetVersionIds', value.affectedAssetVersionIds],
    ['affectedRenderIds', value.affectedRenderIds],
    ['invalidatedLockIds', value.invalidatedLockIds],
    ['preservedArtifactVersionIds', value.preservedArtifactVersionIds],
    ['preservedLockIds', value.preservedLockIds],
  ] as const) uniqueOrIssue(values, context, [field])

  const derivedWithinMaximum = value.estimatedIncrementalInternalCostMicros <=
    value.remainingApprovedInternalCostMicros
  if (value.withinApprovedMaximum !== derivedWithinMaximum) {
    issue(context, ['withinApprovedMaximum'], 'Revision cost coverage must be derived from exact approved remaining cost.')
  }
  if (value.changesInternalCost !== (value.estimatedIncrementalInternalCostMicros > 0)) {
    issue(context, ['changesInternalCost'], 'Revision cost-change state must match the exact incremental internal cost.')
  }
  if (value.approvalStillCoversChange && !value.withinApprovedMaximum) {
    issue(context, ['approvalStillCoversChange'], 'Existing approval cannot cover an over-budget revision.')
  }
  const fallbackComplete = Boolean(
    value.approvedFallbackAuthorityId && value.approvedFallbackAuthorityDigest,
  )
  if (Boolean(value.approvedFallbackAuthorityId) !== Boolean(value.approvedFallbackAuthorityDigest)) {
    issue(context, ['approvedFallbackAuthorityId'], 'Approved fallback ID and digest must occur together.')
  }
  const material = value.changesMeaning || value.changesTimingOrFrame ||
    value.changesRightsOrConsent || value.changesProviderRoute ||
    value.changesQualityAuthority || value.requiresGeneration ||
    (value.changesInternalCost && !value.approvalStillCoversChange)
  if (material && (
    value.route !== 'new_plan_estimate_and_approval_required' ||
    value.nextAction !== 'request_plan_review' ||
    value.approvalStillCoversChange
  )) issue(context, ['route'], 'Material revision impact must return through a new plan, estimate and approval.')
  if (
    value.route === 'covered_no_cost_metadata_or_render_only' &&
    (material || value.changesInternalCost || !value.approvalStillCoversChange)
  ) issue(context, ['route'], 'A covered no-cost change must remain inside the exact approval without material or cost impact.')
  if (
    value.route === 'covered_no_cost_metadata_or_render_only' &&
    value.requiresPrivateRender !== fallbackComplete
  ) issue(context, ['approvedFallbackAuthorityId'], 'A covered no-cost render requires its exact approved fallback authority.')
  if (
    value.route === 'new_private_render_within_approved_maximum' &&
    (!value.requiresPrivateRender || !value.approvalStillCoversChange || material ||
      !value.changesInternalCost || !value.withinApprovedMaximum || !fallbackComplete)
  ) issue(context, ['route'], 'A covered private-render revision must remain inside the exact approval and cost maximum.')
  if (
    value.route !== 'new_private_render_within_approved_maximum' &&
    value.route !== 'covered_no_cost_metadata_or_render_only' && fallbackComplete
  ) issue(context, ['approvedFallbackAuthorityId'], 'Fallback authority is valid only for an approved covered render route.')
  const expectedAction = value.route === 'new_plan_estimate_and_approval_required'
    ? 'request_plan_review'
    : value.route === 'blocked_for_user_review'
      ? 'return_to_chat'
      : 'create_successor_fine_cut'
  if (value.nextAction !== expectedAction) {
    issue(context, ['nextAction'], 'Revision next action must be derived from its exact impact route.')
  }
}

function validateQualityControlReport(
  value: MotionStudioQualityControlReportV1,
  context: z.RefinementCtx,
): void {
  const gates = value.gateResults.map((result) => result.gate)
  const exact = sameSet(gates, MOTION_STUDIO_QUALITY_CONTROL_GATES)
  if (!exact || !value.allRequiredGatesPresentExactlyOnce) {
    issue(context, ['gateResults'], 'Every required Storytelling Quality Control gate must occur exactly once.')
  }
  const blockingPassed = value.gateResults.every((result) =>
    !result.blocking || result.status === 'passed')
  const warningsAcknowledged = value.gateResults
    .filter((result) => result.status === 'warning')
    .every((result) => Boolean(result.warningAcknowledgementId))
  const overBudget = value.reconciledActualInternalCostMicros >
    value.approvedMaximumInternalCostMicros
  const expectedStatus = !blockingPassed || overBudget
    ? 'blocked'
    : warningsAcknowledged
      ? 'passed'
      : 'warnings_require_acknowledgement'
  if (
    value.allBlockingGatesPassed !== (blockingPassed && !overBudget) ||
    value.allWarningsAcknowledged !== warningsAcknowledged ||
    value.status !== expectedStatus ||
    value.deliveryEligible !== (expectedStatus === 'passed')
  ) issue(context, ['status'], 'Quality Control status and delivery eligibility must be derived from exact gates, acknowledgements and cost.')
}

function exactGateSet(
  actual: readonly string[],
  expected: readonly string[],
  context: z.RefinementCtx,
): void {
  if (!sameSet(actual, expected)) issue(context, ['gateResults'], 'Every required gate must occur exactly once.')
}

function boundedSafeText(minimum: number, maximum: number) {
  return z.string().trim().min(minimum).max(maximum)
    .refine((value) => !/(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/iu.test(value))
    .refine((value) => [...value].every((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint === 9 || codePoint === 10 || codePoint === 13 ||
        (codePoint >= 32 && codePoint !== 127)
    }))
}

function uniqueOrIssue(
  values: readonly string[],
  context: z.RefinementCtx,
  path: PropertyKey[],
): void {
  if (new Set(values).size !== values.length) issue(context, path, 'Values must be unique.')
}

function uniqueOrThrow(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique.`)
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return new Set(left).size === left.length && new Set(right).size === right.length &&
    left.length === right.length && left.every((value) => right.includes(value))
}

function issue(context: z.RefinementCtx, path: PropertyKey[], message: string): void {
  context.addIssue({ code: 'custom', path, message })
}
