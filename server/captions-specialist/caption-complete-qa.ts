import { z } from 'zod'

import {
  CAPTION_COMPLETE_QA_REPORT_VERSION,
  CAPTION_DIRECT_VISUAL_INSPECTION_RECEIPT_VERSION,
  CAPTION_LOCAL_REPAIR_FALLBACK_PLAN_VERSION,
  type CaptionCompleteQaBundle,
  type CaptionCompleteQaCategory,
  type CaptionCompleteQaCheck,
  type CaptionCompleteQaReport,
  type CaptionDirectVisualInspectionReceipt,
  type CaptionLocalRepairFallbackItem,
  type CaptionLocalRepairFallbackPlan,
} from '../../src/types/caption-complete-qa'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type { CaptionAccessibilityExportBundle } from
  './caption-accessibility-export'
import type { CaptionRemotionRenderSpec } from
  '../../src/types/caption-remotion-scene-group'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import { createCaptionDomainContract } from './caption-domain-contracts'
import { CAPTION_DESIGN_COMPOSITE } from './caption-design-composite'
import {
  parseCaptionAccessibilityExportPlan,
  parseCaptionAccessibleArtifactSet,
} from './caption-accessibility-export'
import {
  parseCaptionRemotionRenderSpec,
  parseCaptionRemotionSceneGroup,
} from './caption-remotion-scene-group'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const rangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((range) => range.endFrameExclusive > range.startFrame)
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(rangeSchema).min(1).max(512),
}).strict()
const categorySchema = z.enum([
  'transcript', 'alignment', 'semantic', 'typography', 'visual_placement',
  'occlusion_mask', 'motion', 'sound', 'accessibility_localization',
  'render_export', 'policy_security',
])

const inspectionItemSchema = z.object({
  inspectionItemId: safeKey,
  sourceArtifactRef: refSchema,
  sourceKind: z.enum([
    'remotion_full_motion_golden', 'remotion_reduced_motion_golden',
    'libass_widescreen_overlay', 'libass_vertical_overlay_rejected',
    'libass_vertical_overlay_repair',
  ]),
  outputId: safeKey,
  width: z.number().int().positive().max(3_840),
  height: z.number().int().positive().max(3_840),
  frameNumber: z.number().int().nonnegative().nullable(),
  rasterSha256: sha256,
  disposition: z.enum(['passed', 'failed_repaired']),
  findingCodes: z.array(safeKey).max(64),
  actualRasterOpenedAndInspected: z.literal(true),
}).strict()

const inspectionReceiptSchema: z.ZodType<CaptionDirectVisualInspectionReceipt> = z.object({
  schemaVersion: z.literal(CAPTION_DIRECT_VISUAL_INSPECTION_RECEIPT_VERSION),
  receiptId: safeKey,
  receiptDigestSha256: sha256,
  canonicalScope: scopeSchema,
  fullMotionRenderSpecRef: refSchema.nullable(),
  reducedMotionRenderSpecRef: refSchema.nullable(),
  accessibilityPlanRef: refSchema,
  inspectedArtifacts: z.array(inspectionItemSchema).min(1).max(64),
  repairChain: z.array(z.object({
    issueId: safeKey,
    failureCode: z.literal('caption_vertical_single_line_horizontal_clipping'),
    failedArtifactRef: refSchema,
    repairedArtifactRef: refSchema,
    repairActionCode: z.literal(
      'reject_clipped_fixture_add_safe_width_guard_use_short_stable_cue'),
    repairVersion: z.literal(1),
    predispatchGuardVersion: z.literal('caption_libass_fixture_safe_width_guard_v1'),
    reinspectionDisposition: z.literal('passed'),
  }).strict()).max(8),
  coverage: z.object({
    renderDurationFrames: z.number().int().nonnegative().max(1_000_000),
    requiredGoldenFrameNumbers: z.array(z.number().int().nonnegative()).max(32),
    fullMotionGoldenFramesInspected: z.array(z.number().int().nonnegative()).max(32),
    reducedMotionGoldenFramesInspected: z.array(z.number().int().nonnegative()).max(32),
    acceptedLibassOutputProfile: z.enum([
      'widescreen_balanced_v1', 'vertical_compact_v1',
    ]),
    boundedGoldenRasterCoverageComplete: z.literal(true),
    completeTimePixelInspectionPerformed: z.literal(false),
    completeMotionPlaybackInspectionPerformed: z.literal(false),
  }).strict(),
  inspectorClass: z.literal('codex_agent_direct_raster_inspection'),
  actualRenderedPixelsInspected: z.literal(true),
  deterministicTechnicalQaReplaced: z.literal(false),
  qualifiedVisualIntelligenceEvidenceClaimed: z.literal(false),
  independentFinalQaGranted: z.literal(false),
  browserLocalCompletionClaimed: z.literal(false),
  mediaBytesSerialized: z.literal(false),
  localPathsSerialized: z.literal(false),
  providerCallMade: z.literal(false),
  repairExecutionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const qaCheckSchema: z.ZodType<CaptionCompleteQaCheck> = z.object({
  checkId: safeKey,
  category: categorySchema,
  disposition: z.enum(['passed', 'needs_evidence', 'not_applicable']),
  failureScope: z.enum(['none', 'local', 'global']),
  evidenceRefs: z.array(refSchema).min(1).max(128),
  reasonCodes: z.array(safeKey).min(1).max(64),
  repairActionCode: safeKey.nullable(),
  fallbackId: safeKey.nullable(),
  blocksCaptionScopeAcceptance: z.boolean(),
  blocksFinalDelivery: z.boolean(),
}).strict()

const reportSchema: z.ZodType<CaptionCompleteQaReport> = z.object({
  schemaVersion: z.literal(CAPTION_COMPLETE_QA_REPORT_VERSION),
  reportId: safeKey,
  reportDigestSha256: sha256,
  canonicalScope: scopeSchema,
  approvedSnapshotRef: refSchema.nullable(),
  sceneGroupRef: refSchema,
  storyTimingResolutionRef: refSchema,
  motionPlanRef: refSchema,
  motionLockRef: refSchema,
  soundAdmissionRef: refSchema,
  fullMotionRenderSpecRef: refSchema.nullable(),
  reducedMotionRenderSpecRef: refSchema.nullable(),
  accessibilityPlanRef: refSchema,
  accessibleArtifactSetRef: refSchema,
  directInspectionReceiptRef: refSchema,
  qualifiedVisualIntelligenceEvidenceRef: refSchema.nullable(),
  completeTrackExecutionEvidenceRef: refSchema.nullable(),
  finalExportEvidenceRef: refSchema.nullable(),
  checks: z.array(qaCheckSchema).length(11),
  passedCheckCount: z.number().int().nonnegative().max(11),
  needsEvidenceCheckCount: z.number().int().nonnegative().max(11),
  notApplicableCheckCount: z.number().int().nonnegative().max(11),
  deterministicCaptionQaPassed: z.literal(true),
  boundedDirectVisualInspectionPassed: z.literal(true),
  repairedEvidenceKeptSeparateFromPassedEvidence: z.literal(true),
  completeTimeQualifiedAiVisualReviewCompleted: z.boolean(),
  completeTrackRuntimeQaCompleted: z.boolean(),
  finalExportQaCompleted: z.boolean(),
  captionScopeRecommendation: z.enum([
    'accept_caption_scope', 'repair_caption_scope', 'blocked_external_evidence',
  ]),
  localUnrelatedWorkMayContinue: z.literal(true),
  independentFinalQaStillRequired: z.literal(true),
  finalDeliveryAllowed: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  repairExecutionAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  finalQaApprovalAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const repairItemSchema: z.ZodType<CaptionLocalRepairFallbackItem> = z.object({
  itemId: safeKey,
  sourceCheckId: safeKey,
  issueCode: safeKey,
  affectedSceneIds: z.array(safeKey).max(64),
  affectedNodeIds: z.array(safeKey).max(512),
  owner: z.enum([
    'caption_projection', 'caption_layout', 'track_all', 'soundsync',
    'visual_intelligence', 'canonical_font_runtime',
    'canonical_libass_runtime',
    'canonical_ffmpeg_packaging', 'independent_final_qa',
  ]),
  disposition: z.enum([
    'completed_and_reinspected', 'approved_fallback_selected',
    'blocked_external_owner',
  ]),
  repairActionCode: safeKey,
  fallbackId: safeKey.nullable(),
  evidenceRefs: z.array(refSchema).min(1).max(128),
  createsNewVersion: z.literal(true),
  preservesPriorArtifact: z.literal(true),
  requiresReinspection: z.boolean(),
  requiresNewApproval: z.boolean(),
  retryExecuted: z.literal(false),
}).strict()

const repairPlanSchema: z.ZodType<CaptionLocalRepairFallbackPlan> = z.object({
  schemaVersion: z.literal(CAPTION_LOCAL_REPAIR_FALLBACK_PLAN_VERSION),
  planId: safeKey,
  planDigestSha256: sha256,
  canonicalScope: scopeSchema,
  completeQaReportRef: refSchema,
  directInspectionReceiptRef: refSchema,
  items: z.array(repairItemSchema).min(1).max(64),
  fallbackLadder: z.tuple([
    z.literal('retry_deterministic_local_operation_when_idempotent'),
    z.literal('simplify_layout_or_motion_preserve_meaning'),
    z.literal('move_creative_track_to_safe_plane'),
    z.literal('replace_word_motion_with_stable_phrase_motion'),
    z.literal('stable_open_captions_through_libass'),
    z.literal('accessible_sidecars'),
    z.literal('request_user_review_or_new_approval'),
  ]),
  blockingExternalGateCodes: z.array(safeKey).min(1).max(32),
  completedRepairCount: z.number().int().nonnegative().max(64),
  selectedFallbackCount: z.number().int().nonnegative().max(64),
  blockedExternalOwnerCount: z.number().int().nonnegative().max(64),
  smallestAffectedScopeOnly: z.literal(true),
  hiddenQualityDowngradeAllowed: z.literal(false),
  unrelatedWorkMayContinue: z.literal(true),
  mapsChartsBrowserCaptionsTimingMasksQaFallbackToAiVideo: z.literal(false),
  retryOrRepairExecutionGranted: z.literal(false),
  snapshotMutationGranted: z.literal(false),
  assetMutationGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const categories: CaptionCompleteQaCategory[] = [
  'transcript', 'alignment', 'semantic', 'typography', 'visual_placement',
  'occlusion_mask', 'motion', 'sound', 'accessibility_localization',
  'render_export', 'policy_security',
]

export function createCaptionDirectVisualInspectionReceipt(input: {
  receiptId: string
  canonicalScope: CaptionDomainCanonicalScope
  sceneGroup: unknown
  fullMotionRenderSpec: CaptionRemotionRenderSpec | null
  reducedMotionRenderSpec: CaptionRemotionRenderSpec | null
  accessibilityBundle: CaptionAccessibilityExportBundle
  inspectedArtifacts: CaptionDirectVisualInspectionReceipt['inspectedArtifacts']
  repairChain: CaptionDirectVisualInspectionReceipt['repairChain']
}): CaptionDirectVisualInspectionReceipt {
  assertClosedContractTree(input, 'Caption direct visual inspection input')
  const group = parseCaptionRemotionSceneGroup(input.sceneGroup)
  const plan = parseCaptionAccessibilityExportPlan(
    input.accessibilityBundle.plan,
    group,
  )
  const full = input.fullMotionRenderSpec === null ? null
    : parseCaptionRemotionRenderSpec(input.fullMotionRenderSpec, group)
  const reduced = input.reducedMotionRenderSpec === null ? null
    : parseCaptionRemotionRenderSpec(input.reducedMotionRenderSpec, group)
  if ((full === null) !== (reduced === null)
    || !sameScope(input.canonicalScope, plan.canonicalScope)
    || (full !== null && reduced !== null
      && (!sameScope(full.canonicalScope, group.canonicalScope)
        || !sameScope(reduced.canonicalScope, group.canonicalScope)))) {
    throw new Error('Caption direct visual inspection inputs cross scope or render lineage.')
  }
  const base: Omit<CaptionDirectVisualInspectionReceipt, 'receiptDigestSha256'> = {
    schemaVersion: CAPTION_DIRECT_VISUAL_INSPECTION_RECEIPT_VERSION,
    receiptId: safeKey.parse(input.receiptId),
    canonicalScope: structuredClone(input.canonicalScope),
    fullMotionRenderSpecRef: renderSpecRef(full),
    reducedMotionRenderSpecRef: renderSpecRef(reduced),
    accessibilityPlanRef: ref(plan.planId, plan.schemaVersion, plan.planDigestSha256),
    inspectedArtifacts: structuredClone(input.inspectedArtifacts),
    repairChain: structuredClone(input.repairChain),
    coverage: {
      renderDurationFrames: full?.durationFrames ?? 0,
      requiredGoldenFrameNumbers: structuredClone(
        full?.goldenFrameNumbers ?? []),
      fullMotionGoldenFramesInspected: input.inspectedArtifacts.filter((item) =>
        item.sourceKind === 'remotion_full_motion_golden')
        .map((item) => item.frameNumber!).sort((left, right) => left - right),
      reducedMotionGoldenFramesInspected: input.inspectedArtifacts.filter((item) =>
        item.sourceKind === 'remotion_reduced_motion_golden')
        .map((item) => item.frameNumber!).sort((left, right) => left - right),
      acceptedLibassOutputProfile: plan.recompositionProfileId,
      boundedGoldenRasterCoverageComplete: true,
      completeTimePixelInspectionPerformed: false,
      completeMotionPlaybackInspectionPerformed: false,
    },
    inspectorClass: 'codex_agent_direct_raster_inspection',
    actualRenderedPixelsInspected: true,
    deterministicTechnicalQaReplaced: false,
    qualifiedVisualIntelligenceEvidenceClaimed: false,
    independentFinalQaGranted: false,
    browserLocalCompletionClaimed: false,
    mediaBytesSerialized: false,
    localPathsSerialized: false,
    providerCallMade: false,
    repairExecutionAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionDirectVisualInspectionReceipt(withDigest(
    base, 'receiptDigestSha256'), {
    accessibilityPlan: plan,
    fullMotionRenderSpec: full,
    reducedMotionRenderSpec: reduced,
  })
}

export function parseCaptionDirectVisualInspectionReceipt(
  value: unknown,
  context: {
    accessibilityPlan: CaptionAccessibilityExportBundle['plan']
    fullMotionRenderSpec: CaptionRemotionRenderSpec | null
    reducedMotionRenderSpec: CaptionRemotionRenderSpec | null
  },
): CaptionDirectVisualInspectionReceipt {
  assertClosedContractTree(value, 'Caption direct visual inspection receipt')
  const receipt = inspectionReceiptSchema.parse(value)
  verifyDigest(receipt as unknown as Record<string, unknown>,
    'receiptDigestSha256', 'Caption direct visual inspection receipt')
  const plan = context.accessibilityPlan
  const itemIds = new Set<string>()
  const exactOutput = receipt.inspectedArtifacts.every((item) =>
    item.outputId === receipt.canonicalScope.outputId
      && item.sourceArtifactRef.contentHash === item.rasterSha256)
  const fullFrames = receipt.coverage.fullMotionGoldenFramesInspected.join('|')
  const reducedFrames = receipt.coverage.reducedMotionGoldenFramesInspected.join('|')
  const requiredFrames = receipt.coverage.requiredGoldenFrameNumbers.join('|')
  const fullSpecFrames = context.fullMotionRenderSpec?.goldenFrameNumbers.join('|') ?? ''
  const reducedSpecFrames =
    context.reducedMotionRenderSpec?.goldenFrameNumbers.join('|') ?? ''
  const hasRenderSpecs = context.fullMotionRenderSpec !== null
    && context.reducedMotionRenderSpec !== null
  const hasPartialRenderSpecs = (context.fullMotionRenderSpec === null)
    !== (context.reducedMotionRenderSpec === null)
  const fullItems = receipt.inspectedArtifacts.filter((item) =>
    item.sourceKind === 'remotion_full_motion_golden')
  const reducedItems = receipt.inspectedArtifacts.filter((item) =>
    item.sourceKind === 'remotion_reduced_motion_golden')
  const fullHashes = new Map(fullItems.map((item) =>
    [item.frameNumber, item.rasterSha256]))
  const fullItemFrames = fullItems.map((item) => item.frameNumber)
    .sort((left, right) => (left ?? -1) - (right ?? -1)).join('|')
  const reducedItemFrames = reducedItems.map((item) => item.frameNumber)
    .sort((left, right) => (left ?? -1) - (right ?? -1)).join('|')
  const fullSpec = context.fullMotionRenderSpec
  const reducedSpec = context.reducedMotionRenderSpec
  const wideShape = hasRenderSpecs
    && fullSpec!.reducedMotion === false
    && reducedSpec!.reducedMotion === true
    && fullSpec!.durationFrames === reducedSpec!.durationFrames
    && receipt.coverage.renderDurationFrames === fullSpec!.durationFrames
    && requiredFrames === fullSpecFrames && requiredFrames === reducedSpecFrames
    && receipt.repairChain.length === 0
    && fullItems.length === fullSpec!.goldenFrameNumbers.length
    && reducedItems.length === reducedSpec!.goldenFrameNumbers.length
    && fullItemFrames === requiredFrames && reducedItemFrames === requiredFrames
    && fullItems.every((item) => item.frameNumber !== null
      && item.width === fullSpec!.reviewFrame.width
      && item.height === fullSpec!.reviewFrame.height)
    && reducedItems.every((item) => item.frameNumber !== null
      && item.width === reducedSpec!.reviewFrame.width
      && item.height === reducedSpec!.reviewFrame.height
      && fullHashes.get(item.frameNumber) === item.rasterSha256)
    && receipt.inspectedArtifacts.filter((item) =>
      item.sourceKind === 'libass_widescreen_overlay').length === 1
    && receipt.inspectedArtifacts.filter((item) =>
      item.sourceKind === 'libass_widescreen_overlay').every((item) =>
      item.frameNumber === null && item.width === 640 && item.height === 360)
    && receipt.inspectedArtifacts.every((item) => item.disposition === 'passed')
    && fullFrames === requiredFrames && reducedFrames === requiredFrames
  const verticalFailed = receipt.inspectedArtifacts.find((item) =>
    item.sourceKind === 'libass_vertical_overlay_rejected')
  const verticalRepair = receipt.inspectedArtifacts.find((item) =>
    item.sourceKind === 'libass_vertical_overlay_repair')
  const verticalShape = !hasRenderSpecs
    && receipt.coverage.renderDurationFrames === 0
    && receipt.inspectedArtifacts.length === 2
    && verticalFailed?.disposition === 'failed_repaired'
    && verticalRepair?.disposition === 'passed'
    && verticalFailed.frameNumber === null && verticalRepair.frameNumber === null
    && verticalFailed.width === 360 && verticalFailed.height === 640
    && verticalRepair.width === 360 && verticalRepair.height === 640
    && !sameRef(verticalFailed.sourceArtifactRef, verticalRepair.sourceArtifactRef)
    && receipt.repairChain.length === 1
    && sameRef(receipt.repairChain[0]!.failedArtifactRef,
      verticalFailed.sourceArtifactRef)
    && sameRef(receipt.repairChain[0]!.repairedArtifactRef,
      verticalRepair.sourceArtifactRef)
    && requiredFrames === '' && fullFrames === '' && reducedFrames === ''
  if (!sameScope(receipt.canonicalScope, plan.canonicalScope)
    || !sameRef(receipt.accessibilityPlanRef,
      ref(plan.planId, plan.schemaVersion, plan.planDigestSha256))
    || !sameRef(receipt.fullMotionRenderSpecRef,
      renderSpecRef(context.fullMotionRenderSpec))
    || !sameRef(receipt.reducedMotionRenderSpecRef,
      renderSpecRef(context.reducedMotionRenderSpec))
    || receipt.coverage.acceptedLibassOutputProfile !== plan.recompositionProfileId
    || receipt.inspectedArtifacts.some((item) => {
      const duplicate = itemIds.has(item.inspectionItemId)
      itemIds.add(item.inspectionItemId)
      return duplicate || item.findingCodes.length < 1
    })
    || hasPartialRenderSpecs || !exactOutput || (!wideShape && !verticalShape)) {
    throw new Error('Caption direct visual inspection receipt is stale or inconsistent.')
  }
  return receipt
}

export function createCaptionCompleteQaBundle(input: {
  reportId: string
  repairPlanId: string
  sceneGroup: unknown
  fullMotionRenderSpec: CaptionRemotionRenderSpec | null
  reducedMotionRenderSpec: CaptionRemotionRenderSpec | null
  accessibilityBundle: CaptionAccessibilityExportBundle
  soundAdmissionRef: CaptionDomainRef
  inspectionReceipt: CaptionDirectVisualInspectionReceipt
  qualifiedVisualIntelligenceEvidenceRef: CaptionDomainRef | null
  completeTrackExecutionEvidenceRef: CaptionDomainRef | null
  finalExportEvidenceRef: CaptionDomainRef | null
}): CaptionCompleteQaBundle {
  assertClosedContractTree(input, 'Caption complete QA input')
  const group = parseCaptionRemotionSceneGroup(input.sceneGroup)
  {
    const plan = parseCaptionAccessibilityExportPlan(
      input.accessibilityBundle.plan, group)
    const files = input.accessibilityBundle.files
    const artifactSet = parseCaptionAccessibleArtifactSet(
      input.accessibilityBundle.artifactSet, plan, files)
    const full = input.fullMotionRenderSpec === null ? null
      : parseCaptionRemotionRenderSpec(input.fullMotionRenderSpec, group)
    const reduced = input.reducedMotionRenderSpec === null ? null
      : parseCaptionRemotionRenderSpec(input.reducedMotionRenderSpec, group)
    const receipt = parseCaptionDirectVisualInspectionReceipt(
      input.inspectionReceipt, {
        accessibilityPlan: plan,
        fullMotionRenderSpec: full,
        reducedMotionRenderSpec: reduced,
      })
    if (!samePlanningScope(plan.canonicalScope, group.canonicalScope)
      || !sameRef(plan.approvedSnapshotRef, group.canonicalScope.approvedSnapshotRef)
      || (full === null) !== (reduced === null)
      || (full && reduced && (!sameScope(full.canonicalScope, group.canonicalScope)
        || !sameScope(reduced.canonicalScope, group.canonicalScope)))) {
      throw new Error('Caption complete QA inputs cross scope or source lineage.')
    }
    const refs = {
      group: ref(group.sceneGroupId, group.schemaVersion, group.sceneGroupDigestSha256),
      plan: ref(plan.planId, plan.schemaVersion, plan.planDigestSha256),
      artifactSet: ref(
        artifactSet.artifactSetId, artifactSet.schemaVersion,
        artifactSet.artifactSetDigestSha256,
      ),
      receipt: ref(receipt.receiptId, receipt.schemaVersion, receipt.receiptDigestSha256),
    }
    const checks = qaChecks({
      scope: plan.canonicalScope,
      groupRef: refs.group,
      planRef: refs.plan,
      artifactSetRef: refs.artifactSet,
      receiptRef: refs.receipt,
      storyTimingRef: group.storyTimingResolutionRef,
      motionPlanRef: group.motionPlanRef,
      motionLockRef: group.motionLockRef,
      soundAdmissionRef: input.soundAdmissionRef,
      hasRenderSpecs: full !== null,
      visualEvidenceRef: input.qualifiedVisualIntelligenceEvidenceRef,
      completeTrackRef: input.completeTrackExecutionEvidenceRef,
      finalExportRef: input.finalExportEvidenceRef,
    })
    const reportBase: Omit<CaptionCompleteQaReport, 'reportDigestSha256'> = {
      schemaVersion: CAPTION_COMPLETE_QA_REPORT_VERSION,
      reportId: safeKey.parse(input.reportId),
      canonicalScope: structuredClone(plan.canonicalScope),
      approvedSnapshotRef: structuredClone(plan.approvedSnapshotRef),
      sceneGroupRef: refs.group,
      storyTimingResolutionRef: structuredClone(group.storyTimingResolutionRef),
      motionPlanRef: structuredClone(group.motionPlanRef),
      motionLockRef: structuredClone(group.motionLockRef),
      soundAdmissionRef: refSchema.parse(input.soundAdmissionRef),
      fullMotionRenderSpecRef: renderSpecRef(full),
      reducedMotionRenderSpecRef: renderSpecRef(reduced),
      accessibilityPlanRef: refs.plan,
      accessibleArtifactSetRef: refs.artifactSet,
      directInspectionReceiptRef: refs.receipt,
      qualifiedVisualIntelligenceEvidenceRef: structuredClone(
        input.qualifiedVisualIntelligenceEvidenceRef),
      completeTrackExecutionEvidenceRef: structuredClone(
        input.completeTrackExecutionEvidenceRef),
      finalExportEvidenceRef: structuredClone(input.finalExportEvidenceRef),
      checks,
      passedCheckCount: checks.filter((check) => check.disposition === 'passed').length,
      needsEvidenceCheckCount: checks.filter((check) =>
        check.disposition === 'needs_evidence').length,
      notApplicableCheckCount: checks.filter((check) =>
        check.disposition === 'not_applicable').length,
      deterministicCaptionQaPassed: true,
      boundedDirectVisualInspectionPassed: true,
      repairedEvidenceKeptSeparateFromPassedEvidence: true,
      completeTimeQualifiedAiVisualReviewCompleted:
        input.qualifiedVisualIntelligenceEvidenceRef !== null,
      completeTrackRuntimeQaCompleted:
        input.completeTrackExecutionEvidenceRef !== null,
      finalExportQaCompleted: input.finalExportEvidenceRef !== null,
      captionScopeRecommendation: checks.some((check) =>
        check.blocksCaptionScopeAcceptance) ? 'blocked_external_evidence'
        : checks.some((check) => check.repairActionCode)
          ? 'repair_caption_scope' : 'accept_caption_scope',
      localUnrelatedWorkMayContinue: true,
      independentFinalQaStillRequired: true,
      finalDeliveryAllowed: false,
      operationDispatchAuthority: false,
      repairExecutionAuthority: false,
      assetMutationAuthority: false,
      creditOrBillingAuthority: false,
      finalQaApprovalAuthority: false,
      publicDeliveryAuthority: false,
      productionAuthority: false,
    }
    const report = parseCaptionCompleteQaReport(withDigest(
      reportBase, 'reportDigestSha256'))
    const repairPlan = createRepairPlan({
      planId: input.repairPlanId,
      report,
      receipt,
      sceneNodeIds: group.layers.map((layer) => layer.nodeId),
    })
    const sourceBindings = {
      captionCompositeRef: compositeRef(),
      confirmedOutputFrameRef: structuredClone(plan.confirmedOutputFrame.frameRef),
      canonicalTranscriptRef: structuredClone(plan.transcriptRef),
      masterTimingRef: structuredClone(plan.masterTimingRef),
      storyTimingRef: structuredClone(plan.storyTimingResolutionRef),
      captionApprovalEnvelopeRef: null,
    }
    const stalenessTuple = uniqueRefs([
      ...Object.values(sourceBindings),
      refs.group, group.motionPlanRef, group.motionLockRef,
      group.storyTimingResolutionRef, refs.plan, refs.artifactSet, refs.receipt,
    ])
    const domainQaContract = createCaptionDomainContract({
      contractId: `${report.reportId}.domain`,
      contractKind: 'qa_report',
      canonicalScope: structuredClone(report.canonicalScope),
      sourceBindings,
      stalenessTuple,
      payload: {
        checks: report.checks.map((check) => ({
          checkCode: check.checkId,
          disposition: check.disposition,
          affectedSceneIds: report.canonicalScope.sceneId
            ? [report.canonicalScope.sceneId] : [],
          evidenceRefs: structuredClone(check.evidenceRefs),
          proposedRepairCode: check.repairActionCode,
        })),
        captionQaRecommendation: report.captionScopeRecommendation
          === 'accept_caption_scope' ? 'accept_caption_scope'
          : report.captionScopeRecommendation === 'repair_caption_scope'
            ? 'repair_caption_scope' : 'block_caption_scope',
        independentFinalQaStillRequired: true,
      },
      privateArtifact: true,
      byteFree: true,
      authorityBoundary: domainClosedAuthority(),
    })
    const domainRepairContract = createCaptionDomainContract({
      contractId: `${repairPlan.planId}.domain`,
      contractKind: 'repair_plan',
      canonicalScope: structuredClone(repairPlan.canonicalScope),
      sourceBindings,
      stalenessTuple: uniqueRefs([...stalenessTuple,
        ref(report.reportId, report.schemaVersion, report.reportDigestSha256)]),
      payload: {
        repairs: repairPlan.items.map((item) => ({
          repairId: item.itemId,
          issueCode: item.issueCode,
          affectedSceneIds: structuredClone(item.affectedSceneIds),
          affectedNodeIds: structuredClone(item.affectedNodeIds),
          repairActionCode: item.repairActionCode,
          fallbackId: item.fallbackId,
          requiresNewApproval: item.requiresNewApproval,
          requiresReinspection: item.requiresReinspection,
        })),
        smallestAffectedScopeOnly: true,
        hiddenQualityDowngradeAllowed: false,
        unrelatedWorkMayContinue: true,
      },
      privateArtifact: true,
      byteFree: true,
      authorityBoundary: domainClosedAuthority(),
    })
    return { inspectionReceipt: receipt, report, repairPlan,
      domainQaContract, domainRepairContract }
  }
}

export function parseCaptionCompleteQaReport(value: unknown): CaptionCompleteQaReport {
  assertClosedContractTree(value, 'Caption complete QA report')
  const report = reportSchema.parse(value)
  verifyDigest(report as unknown as Record<string, unknown>,
    'reportDigestSha256', 'Caption complete QA report')
  const checkIds = new Set<string>()
  const measuredCategories = report.checks.map((check) => check.category).join('|')
  const passed = report.checks.filter((check) => check.disposition === 'passed').length
  const needs = report.checks.filter((check) =>
    check.disposition === 'needs_evidence').length
  const notApplicable = report.checks.filter((check) =>
    check.disposition === 'not_applicable').length
  const expectedRecommendation = report.checks.some((check) =>
    check.blocksCaptionScopeAcceptance) ? 'blocked_external_evidence'
    : report.checks.some((check) => check.repairActionCode)
      ? 'repair_caption_scope' : 'accept_caption_scope'
  const check = (category: CaptionCompleteQaCategory) => report.checks.find(
    (item) => item.category === category)!
  const fixedDispositions = check('transcript').disposition === 'passed'
    && check('alignment').disposition === 'needs_evidence'
    && check('semantic').disposition === 'passed'
    && check('typography').disposition === 'needs_evidence'
    && check('occlusion_mask').disposition === 'not_applicable'
    && check('sound').disposition === 'needs_evidence'
    && check('policy_security').disposition === 'passed'
  const hasRenderSpecs = report.fullMotionRenderSpecRef !== null
    && report.reducedMotionRenderSpecRef !== null
  const hasPartialRenderSpecs = (report.fullMotionRenderSpecRef === null)
    !== (report.reducedMotionRenderSpecRef === null)
  const visualDispositionCorrect = report.qualifiedVisualIntelligenceEvidenceRef
    ? check('visual_placement').disposition === 'passed'
      && hasEvidenceRef(check('visual_placement'),
        report.qualifiedVisualIntelligenceEvidenceRef)
    : check('visual_placement').disposition === 'needs_evidence'
  const accessibilityDispositionCorrect = report.completeTrackExecutionEvidenceRef
    ? check('accessibility_localization').disposition === 'passed'
      && hasEvidenceRef(check('accessibility_localization'),
        report.completeTrackExecutionEvidenceRef)
    : check('accessibility_localization').disposition === 'needs_evidence'
  const exportDispositionCorrect = report.finalExportEvidenceRef
    ? check('render_export').disposition === 'passed'
      && hasEvidenceRef(check('render_export'), report.finalExportEvidenceRef)
    : check('render_export').disposition === 'needs_evidence'
  if (!sameRef(report.approvedSnapshotRef, report.canonicalScope.approvedSnapshotRef)
    || measuredCategories !== categories.join('|')
    || report.checks.some((check) => {
      const duplicate = checkIds.has(check.checkId)
      checkIds.add(check.checkId)
      return duplicate || (check.disposition === 'passed'
        && (check.failureScope !== 'none' || check.blocksCaptionScopeAcceptance))
        || (check.disposition === 'needs_evidence'
          && (!check.blocksFinalDelivery || check.failureScope === 'none'))
        || (check.disposition === 'not_applicable'
          && (check.failureScope !== 'none' || check.blocksCaptionScopeAcceptance
            || check.blocksFinalDelivery))
    })
    || !fixedDispositions || hasPartialRenderSpecs
    || check('motion').disposition !== (hasRenderSpecs
      ? 'needs_evidence' : 'not_applicable')
    || !visualDispositionCorrect || !accessibilityDispositionCorrect
    || !exportDispositionCorrect
    || report.passedCheckCount !== passed
    || report.needsEvidenceCheckCount !== needs
    || report.notApplicableCheckCount !== notApplicable
    || passed + needs + notApplicable !== 11
    || report.completeTimeQualifiedAiVisualReviewCompleted
      !== (report.qualifiedVisualIntelligenceEvidenceRef !== null)
    || report.completeTrackRuntimeQaCompleted
      !== (report.completeTrackExecutionEvidenceRef !== null)
    || report.finalExportQaCompleted !== (report.finalExportEvidenceRef !== null)
    || report.captionScopeRecommendation !== expectedRecommendation) {
    throw new Error('Caption complete QA report is stale or inconsistent.')
  }
  return report
}

export function parseCaptionLocalRepairFallbackPlan(
  value: unknown,
  reportValue: unknown,
  receiptValue: unknown,
): CaptionLocalRepairFallbackPlan {
  assertClosedContractTree(value, 'Caption local repair and fallback plan')
  const plan = repairPlanSchema.parse(value)
  const report = parseCaptionCompleteQaReport(reportValue)
  const receipt = inspectionReceiptSchema.parse(receiptValue)
  verifyDigest(receipt as unknown as Record<string, unknown>,
    'receiptDigestSha256', 'Caption direct visual inspection receipt')
  verifyDigest(plan as unknown as Record<string, unknown>,
    'planDigestSha256', 'Caption local repair and fallback plan')
  const itemIds = new Set<string>()
  const completed = plan.items.filter((item) =>
    item.disposition === 'completed_and_reinspected').length
  const selected = plan.items.filter((item) =>
    item.disposition === 'approved_fallback_selected').length
  const blocked = plan.items.filter((item) =>
    item.disposition === 'blocked_external_owner').length
  const exactBlockingCodes = plan.items.filter((item) =>
    item.disposition === 'blocked_external_owner').map((item) => item.issueCode)
  if (!sameScope(plan.canonicalScope, report.canonicalScope)
    || !sameRef(plan.completeQaReportRef,
      ref(report.reportId, report.schemaVersion, report.reportDigestSha256))
    || !sameRef(plan.directInspectionReceiptRef,
      ref(receipt.receiptId, receipt.schemaVersion, receipt.receiptDigestSha256))
    || plan.items.some((item) => {
      const duplicate = itemIds.has(item.itemId)
      itemIds.add(item.itemId)
      return duplicate || !report.checks.some((check) =>
        check.checkId === item.sourceCheckId)
        || (item.disposition === 'completed_and_reinspected'
          && (!item.requiresReinspection || item.fallbackId !== null))
        || (item.disposition === 'blocked_external_owner'
          && (item.requiresReinspection || item.fallbackId !== null))
        || (item.disposition === 'approved_fallback_selected'
          && (item.fallbackId === null || item.requiresReinspection))
    })
    || plan.completedRepairCount !== completed
    || plan.selectedFallbackCount !== selected
    || plan.blockedExternalOwnerCount !== blocked
    || plan.completedRepairCount !== receipt.repairChain.length
    || plan.blockingExternalGateCodes.join('|') !== exactBlockingCodes.join('|')
    || blocked < 1) {
    throw new Error('Caption local repair and fallback plan is stale or inconsistent.')
  }
  return plan
}

function qaChecks(input: {
  scope: CaptionDomainCanonicalScope
  groupRef: CaptionDomainRef
  planRef: CaptionDomainRef
  artifactSetRef: CaptionDomainRef
  receiptRef: CaptionDomainRef
  storyTimingRef: CaptionDomainRef
  motionPlanRef: CaptionDomainRef
  motionLockRef: CaptionDomainRef
  soundAdmissionRef: CaptionDomainRef
  hasRenderSpecs: boolean
  visualEvidenceRef: CaptionDomainRef | null
  completeTrackRef: CaptionDomainRef | null
  finalExportRef: CaptionDomainRef | null
}): CaptionCompleteQaCheck[] {
  const check = (
    category: CaptionCompleteQaCategory,
    disposition: CaptionCompleteQaCheck['disposition'],
    evidenceRefs: CaptionDomainRef[],
    reasonCodes: string[],
    options: Partial<Pick<CaptionCompleteQaCheck,
    'failureScope' | 'repairActionCode' | 'fallbackId'
    | 'blocksCaptionScopeAcceptance' | 'blocksFinalDelivery'>> = {},
  ): CaptionCompleteQaCheck => ({
    checkId: `caption.qa.${input.scope.outputId}.${category}`,
    category,
    disposition,
    failureScope: options.failureScope ?? (disposition === 'passed' ? 'none' : 'global'),
    evidenceRefs,
    reasonCodes,
    repairActionCode: options.repairActionCode ?? null,
    fallbackId: options.fallbackId ?? null,
    blocksCaptionScopeAcceptance: options.blocksCaptionScopeAcceptance ?? false,
    blocksFinalDelivery: options.blocksFinalDelivery ?? disposition !== 'passed',
  })
  return [
    check('transcript', 'passed', [input.groupRef],
      ['exact_source_word_lineage_preserved']),
    check('alignment', 'needs_evidence', [input.storyTimingRef],
      ['authenticated_storytiming_and_alignment_reread_required'], {
        blocksCaptionScopeAcceptance: true,
        repairActionCode: 'reread_authenticated_storytiming_alignment',
      }),
    check('semantic', 'passed', [input.groupRef],
      ['semantic_phrase_meaning_and_accessible_counterparts_preserved']),
    check('typography', 'needs_evidence', [input.planRef],
      ['approved_multilingual_font_and_shaping_runtime_required'], {
        blocksCaptionScopeAcceptance: true,
        fallbackId: 'accessible_sidecars',
        repairActionCode: 'qualify_font_or_use_accessible_sidecars',
      }),
    check('visual_placement', input.visualEvidenceRef ? 'passed' : 'needs_evidence',
      [input.receiptRef, ...(input.visualEvidenceRef ? [input.visualEvidenceRef] : [])],
      [input.visualEvidenceRef
        ? 'bounded_and_complete_time_visual_evidence_bound'
        : 'complete_time_qualified_ai_visual_review_required'], {
        blocksCaptionScopeAcceptance: !input.visualEvidenceRef,
        repairActionCode: input.visualEvidenceRef
          ? null : 'request_visual_intelligence_complete_time_inspection',
      }),
    check('occlusion_mask', 'not_applicable', [input.groupRef],
      ['unqualified_depth_routes_use_declared_safe_plane_fallbacks'], {
        failureScope: 'none', fallbackId: 'safe_top_plane',
        blocksFinalDelivery: false,
      }),
    check('motion', input.hasRenderSpecs ? 'needs_evidence' : 'not_applicable',
      [input.motionPlanRef, input.motionLockRef, input.receiptRef],
      [input.hasRenderSpecs
        ? 'complete_motion_playback_inspection_required'
        : 'no_remotion_motion_render_in_output_fixture'], {
        failureScope: input.hasRenderSpecs ? 'global' : 'none',
        blocksCaptionScopeAcceptance: input.hasRenderSpecs,
        repairActionCode: input.hasRenderSpecs
          ? 'inspect_complete_motion_playback' : null,
        blocksFinalDelivery: input.hasRenderSpecs,
      }),
    check('sound', 'needs_evidence', [input.soundAdmissionRef],
      ['dialogue_protected_final_mix_qa_required'], {
        fallbackId: 'silent_caption_fallback',
        repairActionCode: 'retain_silence_until_soundsync_final_mix_qa',
      }),
    check('accessibility_localization', input.completeTrackRef
      ? 'passed' : 'needs_evidence', [input.planRef, input.artifactSetRef,
      ...(input.completeTrackRef ? [input.completeTrackRef] : [])],
    [input.completeTrackRef
      ? 'complete_track_runtime_and_accessibility_parity_bound'
      : 'complete_track_multilingual_runtime_qa_required'], {
      blocksCaptionScopeAcceptance: !input.completeTrackRef,
      fallbackId: input.completeTrackRef ? null : 'accessible_sidecars',
      repairActionCode: input.completeTrackRef
        ? null : 'run_complete_track_and_multilingual_accessibility_qa',
    }),
    check('render_export', input.finalExportRef ? 'passed' : 'needs_evidence',
      [input.artifactSetRef, ...(input.finalExportRef ? [input.finalExportRef] : [])],
      [input.finalExportRef ? 'final_export_evidence_bound'
        : 'canonical_ffmpeg_packaging_and_export_qa_required'], {
        blocksCaptionScopeAcceptance: !input.finalExportRef,
        repairActionCode: input.finalExportRef
          ? null : 'request_canonical_ffmpeg_packaging_and_export_qa',
      }),
    check('policy_security', 'passed', [input.groupRef, input.planRef,
      input.artifactSetRef],
    ['closed_authority_byte_free_private_scope_verified']),
  ]
}

function createRepairPlan(input: {
  planId: string
  report: CaptionCompleteQaReport
  receipt: CaptionDirectVisualInspectionReceipt
  sceneNodeIds: string[]
}): CaptionLocalRepairFallbackPlan {
  const sceneIds = input.report.canonicalScope.sceneId
    ? [input.report.canonicalScope.sceneId] : []
  const check = (category: CaptionCompleteQaCategory) => input.report.checks.find(
    (item) => item.category === category)!
  const refs = [ref(input.receipt.receiptId, input.receipt.schemaVersion,
    input.receipt.receiptDigestSha256)]
  const items: CaptionLocalRepairFallbackItem[] = []
  if (input.receipt.repairChain.length) items.push({
    itemId: `caption.repair.${input.report.canonicalScope.outputId}.vertical_clipping`,
    sourceCheckId: check('visual_placement').checkId,
    issueCode: 'caption_vertical_single_line_horizontal_clipping',
    affectedSceneIds: sceneIds,
    affectedNodeIds: [],
    owner: 'caption_layout',
    disposition: 'completed_and_reinspected',
    repairActionCode: 'reject_clipped_fixture_add_safe_width_guard_use_short_stable_cue',
    fallbackId: null,
    evidenceRefs: refs,
    createsNewVersion: true,
    preservesPriorArtifact: true,
    requiresReinspection: true,
    requiresNewApproval: false,
    retryExecuted: false,
  })
  items.push(
    fallbackItem('safe_plane', check('occlusion_mask'), 'track_all',
      'retain_declared_safe_plane_without_unqualified_mask', 'safe_top_plane',
      sceneIds, input.sceneNodeIds, refs),
    fallbackItem('silent_sound', check('sound'), 'soundsync',
      'retain_silence_until_dialogue_protected_mix_qa', 'silent_caption_fallback',
      sceneIds, input.sceneNodeIds, refs),
    fallbackItem('accessible_sidecars', check('accessibility_localization'),
      'caption_projection', 'publish_private_sidecar_plan_without_unqualified_burnin',
      'accessible_sidecars', sceneIds, input.sceneNodeIds, refs),
    blockedItem('alignment', check('alignment'), 'caption_projection',
      'authenticated_storytiming_alignment_reread_required', sceneIds, refs),
    blockedItem('font', check('typography'), 'canonical_font_runtime',
      'approved_multilingual_font_shaping_runtime_required', sceneIds, refs),
    blockedItem('final_qa', check('policy_security'), 'independent_final_qa',
      'independent_final_qa_required', sceneIds, refs),
  )
  if (check('visual_placement').disposition === 'needs_evidence') {
    items.push(blockedItem('visual', check('visual_placement'),
      'visual_intelligence', 'complete_time_qualified_ai_visual_review_required',
      sceneIds, refs))
  }
  if (check('accessibility_localization').disposition === 'needs_evidence') {
    items.push(blockedItem('complete_track', check('accessibility_localization'),
      'canonical_libass_runtime', 'complete_track_multilingual_runtime_qa_required',
      sceneIds, refs))
  }
  if (check('render_export').disposition === 'needs_evidence') {
    items.push(blockedItem('export', check('render_export'),
      'canonical_ffmpeg_packaging', 'canonical_ffmpeg_packaging_export_qa_required',
      sceneIds, refs))
  }
  if (check('motion').disposition === 'needs_evidence') {
    items.push(blockedItem('motion', check('motion'), 'caption_layout',
      'complete_motion_playback_inspection_required', sceneIds, refs))
  }
  const base: Omit<CaptionLocalRepairFallbackPlan, 'planDigestSha256'> = {
    schemaVersion: CAPTION_LOCAL_REPAIR_FALLBACK_PLAN_VERSION,
    planId: safeKey.parse(input.planId),
    canonicalScope: structuredClone(input.report.canonicalScope),
    completeQaReportRef: ref(input.report.reportId, input.report.schemaVersion,
      input.report.reportDigestSha256),
    directInspectionReceiptRef: refs[0]!,
    items,
    fallbackLadder: [
      'retry_deterministic_local_operation_when_idempotent',
      'simplify_layout_or_motion_preserve_meaning',
      'move_creative_track_to_safe_plane',
      'replace_word_motion_with_stable_phrase_motion',
      'stable_open_captions_through_libass',
      'accessible_sidecars',
      'request_user_review_or_new_approval',
    ],
    blockingExternalGateCodes: items.filter((item) =>
      item.disposition === 'blocked_external_owner').map((item) => item.issueCode),
    completedRepairCount: items.filter((item) =>
      item.disposition === 'completed_and_reinspected').length,
    selectedFallbackCount: items.filter((item) =>
      item.disposition === 'approved_fallback_selected').length,
    blockedExternalOwnerCount: items.filter((item) =>
      item.disposition === 'blocked_external_owner').length,
    smallestAffectedScopeOnly: true,
    hiddenQualityDowngradeAllowed: false,
    unrelatedWorkMayContinue: true,
    mapsChartsBrowserCaptionsTimingMasksQaFallbackToAiVideo: false,
    retryOrRepairExecutionGranted: false,
    snapshotMutationGranted: false,
    assetMutationGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionLocalRepairFallbackPlan(withDigest(
    base, 'planDigestSha256'), input.report, input.receipt)
}

function fallbackItem(
  suffix: string,
  check: CaptionCompleteQaCheck,
  owner: CaptionLocalRepairFallbackItem['owner'],
  action: string,
  fallbackId: string,
  sceneIds: string[],
  nodeIds: string[],
  evidenceRefs: CaptionDomainRef[],
): CaptionLocalRepairFallbackItem {
  return {
    itemId: `caption.fallback.${suffix}.${check.checkId}`,
    sourceCheckId: check.checkId,
    issueCode: check.reasonCodes[0]!,
    affectedSceneIds: sceneIds,
    affectedNodeIds: nodeIds,
    owner,
    disposition: 'approved_fallback_selected',
    repairActionCode: action,
    fallbackId,
    evidenceRefs,
    createsNewVersion: true,
    preservesPriorArtifact: true,
    requiresReinspection: false,
    requiresNewApproval: false,
    retryExecuted: false,
  }
}

function blockedItem(
  suffix: string,
  check: CaptionCompleteQaCheck,
  owner: CaptionLocalRepairFallbackItem['owner'],
  issueCode: string,
  sceneIds: string[],
  evidenceRefs: CaptionDomainRef[],
): CaptionLocalRepairFallbackItem {
  return {
    itemId: `caption.blocked.${suffix}.${check.checkId}`,
    sourceCheckId: check.checkId,
    issueCode,
    affectedSceneIds: sceneIds,
    affectedNodeIds: [],
    owner,
    disposition: 'blocked_external_owner',
    repairActionCode: `await_${issueCode}`,
    fallbackId: null,
    evidenceRefs,
    createsNewVersion: true,
    preservesPriorArtifact: true,
    requiresReinspection: false,
    requiresNewApproval: false,
    retryExecuted: false,
  }
}

function renderSpecRef(value: CaptionRemotionRenderSpec | null): CaptionDomainRef | null {
  return value === null ? null : ref(
    value.renderSpecId, value.schemaVersion, value.renderSpecDigestSha256,
  )
}

function compositeRef(): CaptionDomainRef {
  return ref(CAPTION_DESIGN_COMPOSITE.compositeId,
    CAPTION_DESIGN_COMPOSITE.compositeVersion,
    CAPTION_DESIGN_COMPOSITE.compositeDigestSha256)
}

function domainClosedAuthority() {
  return {
    canonicalApprovalGranted: false as const,
    snapshotMutationGranted: false as const,
    timelineMutationGranted: false as const,
    workCreationGranted: false as const,
    providerDispatchGranted: false as const,
    runtimeExecutionGranted: false as const,
    assetCreationGranted: false as const,
    costAuthorityGranted: false as const,
    billingAuthorityGranted: false as const,
    finalQaApprovalGranted: false as const,
    finalCanvasAuthorityGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
}

function withDigest<T extends Record<string, unknown>>(
  value: T,
  field: string,
): T & Record<string, string> {
  return { ...value, [field]: calculateSkillContractDigest(
    { ...value, [field]: '' }, field) }
}

function verifyDigest(value: Record<string, unknown>, field: string, label: string) {
  if (value[field] !== calculateSkillContractDigest(value, field)) {
    throw new Error(`${label} digest is stale.`)
  }
}

function ref(id: string, version: string, contentHash: string): CaptionDomainRef {
  return { id, version, contentHash }
}

function sameRef(left: CaptionDomainRef | null, right: CaptionDomainRef | null): boolean {
  return left === null || right === null ? left === right
    : left.id === right.id && left.version === right.version
      && left.contentHash === right.contentHash
}

function hasEvidenceRef(
  check: CaptionCompleteQaCheck,
  expected: CaptionDomainRef,
): boolean {
  return check.evidenceRefs.some((item) => sameRef(item, expected))
}

function uniqueRefs(values: Array<CaptionDomainRef | null>): CaptionDomainRef[] {
  const keys = new Set<string>()
  return values.filter((value): value is CaptionDomainRef => {
    if (value === null) return false
    const key = `${value.id}\u0000${value.version}\u0000${value.contentHash}`
    if (keys.has(key)) return false
    keys.add(key)
    return true
  })
}

function sameScope(left: CaptionDomainCanonicalScope, right: CaptionDomainCanonicalScope) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function samePlanningScope(
  left: CaptionDomainCanonicalScope,
  right: CaptionDomainCanonicalScope,
) {
  return left.ownerUserId === right.ownerUserId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.planVersionId === right.planVersionId
    && sameRef(left.approvedSnapshotRef, right.approvedSnapshotRef)
    && left.sceneId === right.sceneId
    && JSON.stringify(left.authorizedFrameRanges)
      === JSON.stringify(right.authorizedFrameRanges)
}
