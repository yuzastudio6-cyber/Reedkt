import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from './approved-edit-execution-package-client'
import type {
  ColorOperationId,
  EditPlan,
  PlannerInput,
  TrimDecisionItem,
} from '../types/reeditpro'
import type { ProfessionalExportCreditCoverage } from '../types/professional-export'
import { REEDITPRO_SOURCE_MEDIA_MAX_BYTES } from '../types/large-media'
import {
  CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
  CANONICAL_PRIVATE_LONG_FORM_FINAL_ARTIFACT_TYPE,
  CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_FRAMES,
} from '../types/canonical-private-composition-capacity'
import {
  planCanonicalPrivateLongFormChunks,
  planCanonicalPrivateSourceSliceMezzanineChunks,
  type CanonicalPrivateLongFormChunkPlan,
} from './canonical-private-long-form-chunk-plan'
import {
  buildProfessionalExportCreditCoverage,
  resolveProfessionalExportFrame,
} from './professional-export-policy'

export const CANONICAL_PRIVATE_PLAN_SCHEMA_VERSION = 'private-edit-authority-plan-v2' as const

const FFPROBE_OPERATION = 'tool.ffprobe.inspect_approved_media.v1'
const FFMPEG_OPERATION = 'tool.ffmpeg.execute_approved_media_recipe.v1'
const LIBASS_OPERATION = 'tool.libass.render_approved_caption_track.v1'
const REMOTION_OPERATION = 'tool.remotion.render_approved_composition.v1'
const LONG_FORM_MERGE_COMPOSITION_PROFILE = 'approved_4k_composition_chunk_merge_final_v1'
const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const SHA256 = /^[a-f0-9]{64}$/
const CANONICAL_DIRECT_SOURCE_BUFFER_MAX_BYTES = 16 * 1024 * 1024
const SUPPORTED_PRIVATE_4K_MASTER_FRAMES = new Set([
  '3840x2160',
  '2160x3840',
  '2160x2160',
  '2160x2700',
  '2880x2160',
])
const FORBIDDEN_OUTBOUND_KEY = /^(?:secret|credential|accessToken|refreshToken|signedUrl|publicUrl|storagePath|localPath|absolutePath|relativePath|sourceBytes|bytesBase64|requestBody)$/i

type JsonRecord = Record<string, unknown>

export type CanonicalStorytellingStylePlanReviewSource = {
  schemaVersion: 'motion-studio.storytelling-style-plan-review-input.v1'
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  styleSelection: {
    schemaVersion: 'motion-studio.storytelling-style-selection.v1'
    id: string
    state: 'draft' | 'in_review' | 'selected_for_plan' | 'approved_snapshot_bound' | 'stale'
    selectionDigest: string
    styleProfile: {
      styleProfileId:
        | 'storytelling_style.editorial_collage'
        | 'storytelling_style.cinematic_realist_documentary'
        | 'storytelling_style.paper_diorama_documentary'
        | 'storytelling_style.technical_blueprint'
      styleProfileVersion: string
      styleProfileDigest: string
    }
    motionLanguage: {
      motionLanguageId: string
      motionLanguageVersion: string
      motionLanguageDigest: string
    }
    motionDnaVersion: CanonicalStorytellingStyleVersionReference
    referenceContractVersions: readonly CanonicalStorytellingStyleVersionReference[]
    sourceAuditDigests: readonly string[]
  }
  calibrationPlan: {
    schemaVersion: 'motion-studio.style-calibration-plan.v1'
    id: string
    planDigest: string
    styleSelectionDigest: string
    routePolicy: {
      policyId:
        | 'motion_studio_generation_route_policy_v1'
        | 'motion_studio_generation_route_policy_v2'
    }
    scenarios: ReadonlyArray<{
      id: string
      kind:
        | 'style_led_motion'
        | 'character_continuity'
        | 'strict_first_last_frame'
        | 'reference_heavy'
        | 'exact_text_data'
    }>
    estimatedInternalCostRangeMicros: {
      minimum: number
      maximum: number
    }
    approvalAuthority: { state: 'planning_only' | 'approved_bounded_execution' }
    automaticFallbackAllowed: false
    fallbackRequiresNewApproval: true
    bulkGenerationAllowed: false
  }
  internalCostEstimateId: string
  internalCostEstimateDigest: string
  internalCostEnvelopeIncludedInPlanReview: true
  customerPricingCalculatedHere: false
  customerCreditsMutated: false
  decisionAuthority: 'existing_plan_review'
  runtimeExecutionAuthorized: false
  immutable: true
}

export type CanonicalStorytellingStyleVersionReference = {
  artifactId: string
  versionId: string
  versionNumber: number
  contentDigest: string
}

export type CanonicalStorytellingStyleAuthorityDraft = {
  schemaVersion: 'canonical-storytelling-style-authority-v1'
  sourceSchemaVersion: 'motion-studio.storytelling-style-plan-review-input.v1'
  sourceAuthority: 'motion_studio_storytelling_style_planning_service'
  evidenceClass: 'controlled_local_browser_relayed_server_prepared_content_addressed'
  sourceRepositoryReverified: false
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  styleSelection: {
    schemaVersion: 'motion-studio.storytelling-style-selection.v1'
    id: string
    state: 'selected_for_plan'
    selectionDigest: string
    styleProfile: CanonicalStorytellingStylePlanReviewSource['styleSelection']['styleProfile']
    motionLanguage: CanonicalStorytellingStylePlanReviewSource['styleSelection']['motionLanguage']
    motionDnaVersion: CanonicalStorytellingStyleVersionReference
    referenceContractVersions: CanonicalStorytellingStyleVersionReference[]
    sourceAuditDigests: string[]
  }
  calibrationPlan: {
    schemaVersion: 'motion-studio.style-calibration-plan.v1'
    id: string
    planDigest: string
    styleSelectionDigest: string
    routePolicyId:
      | 'motion_studio_generation_route_policy_v1'
      | 'motion_studio_generation_route_policy_v2'
    scenarioIds: string[]
    scenarioKinds: Array<CanonicalStorytellingStylePlanReviewSource['calibrationPlan']['scenarios'][number]['kind']>
    estimatedInternalCostRangeMicros: { minimum: number; maximum: number }
    approvalState: 'planning_only'
    automaticFallbackAllowed: false
    fallbackRequiresNewApproval: true
    bulkGenerationAllowed: false
  }
  internalCostEnvelope: {
    schemaVersion: 'motion-studio-storytelling-style-internal-cost-envelope-v1'
    estimateId: string
    estimateDigest: string
    unit: 'usd_micros'
    minimumEstimatedInternalProductionCostMicros: number
    maximumEstimatedInternalProductionCostMicros: number
    approvalState: 'estimate_only_pending_plan_approval'
    internalProductionCostOnly: true
    customerPriceIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
  }
  decisionAuthority: 'existing_plan_review'
  planReviewIsSoleApprovalAuthority: true
  changedStyleRequiresFreshPlanAndEstimate: true
  historicalApprovedSnapshotRemainsImmutable: true
  runtimeExecutionAuthorized: false
  providerExecutionAuthorized: false
  customerCommercialAuthorityGranted: false
  productionReady: false
  immutable: true
}

type ApprovedVoiceDeliverySource = {
  sourceSequenceItemId: string
  cleanupDecisionId: string
  trimStartFrame: number
  trimEndFrameExclusive: number
  durationFrames: number
}

type ApprovedColorDeliverySource = {
  recipeProfileId:
    | 'approved_source_color_delivery_matroska_v1'
    | 'approved_source_color_match_delivery_matroska_v1'
  sourceSequenceItemId: string
  cleanupDecisionId: string
  trimStartFrame: number
  trimEndFrameExclusive: number
  durationFrames: number
  colorGradeStyle: 'clean_natural' | 'premium_clean'
  intensity: 'subtle' | 'balanced'
  approvedColorOperationIds: string[]
  approvedColorOperationKinds: ApprovedColorOperationKind[]
  referenceSourceSequenceItemId?: string
  referenceCleanupDecisionId?: string
  referenceDurationFrames?: number
  referenceOutputKey?: string
}

type ApprovedColorOperationKind = Extract<
  ColorOperationId,
  | 'clarity'
  | 'contrast_curve'
  | 'exposure_correction'
  | 'highlight_recovery'
  | 'look_transform'
  | 'qa_histogram_check'
  | 'saturation'
  | 'shot_matching'
  | 'white_balance'
>

type ApprovedHardCutTransition = {
  transitionTimingItemId: string
  refinedTransitionTimingItemId: string
  fromSegmentId: string
  toSegmentId: string
  fromSourceSequenceItemId: string
  toSourceSequenceItemId: string
  boundaryFrame: number
}

export type CanonicalSourceAuthorityItem = {
  sourceSequenceItemId: string
  mediaAssetId: string
  uploadedOrder: number
  checksumSha256: string
  required: boolean
}

export type CanonicalPlanComponentsDraft = {
  compiledIntent: JsonRecord
  professionalEditingDirective: JsonRecord
  confirmedSettings: {
    aspectRatio: string
    outputFrame: { width: number; height: number; fps: number }
    outputFramePurpose: 'private_canonical_4k_master_review'
    professionalExportCoverage: ProfessionalExportCreditCoverage
    outputFrameConfirmed: true
    sourceOrderConfirmed: true
    sourceCleanupConfirmed: true
    editLevel: 'basic' | 'pro' | 'premium'
    targetPlatform: string
    preferenceSnapshotId?: string
    preferenceRevision?: number
    preferencePlanningInputRevision?: number
    preferenceFingerprintSha256?: string
  }
  sourceSequence: CanonicalSourceAuthorityItem[]
  sourceCleanupSummary: {
    status: 'confirmed'
    cleanupPreference: string
    trimValidationStatus: 'passed' | 'warning'
    meaningValidationStatus: 'passed' | 'warning'
    userReviewRequired: false
  }
  sourceCleanupPlan: {
    status: 'confirmed'
    decisions: CanonicalSourceCleanupDecisionDraft[]
  }
  masterTimingPlan: JsonRecord
  captionVisualCueTimingPlan: JsonRecord
  soundSyncTransitionTimingPlan: JsonRecord
  timingValidationPlan: JsonRecord
  timingSummary: {
    validationStatus: 'passed' | 'warning'
    approvalBlocked: false
    fps: number
    totalFrames: number
  }
  segments: Array<{
    segmentId: string
    startFrame: number
    endFrameExclusive: number
    operationIds: string[]
  }>
  visualAssetPlan: JsonRecord
  colorPipelinePlan: JsonRecord
  rendererPlan: JsonRecord
  toolStrategyPlan: JsonRecord
  qaPlan: JsonRecord
  qaSummary: { status: 'passed' | 'warning'; approvalBlocked: false }
  providerPolicy: {
    veoPolicy: 'forbidden' | 'final_fallback_only'
    approvedRoutes: string[]
  }
  fallbackPolicy: JsonRecord
  motionStudioStorytellingStyleAuthority?: CanonicalStorytellingStyleAuthorityDraft
}

export type CanonicalSourceCleanupDecisionDraft = {
  decisionId: string
  sourceSequenceItemId: string
  action: 'keep' | 'cut' | 'tighten' | 'preserve' | 'move_to_broll' | 'use_as_voiceover' | 'use_as_proof' | 'use_as_alt_take'
  startFrame: number
  endFrameExclusive: number
  reason: string
  confidence: number
  meaningPreservationStatus: 'passed' | 'warning'
  userReviewStatus: 'not_required' | 'resolved'
}

export type CanonicalExpectedOutputDraft = {
  outputKey: string
  artifactType: string
  assetRole: 'processed' | 'generated' | 'qa' | 'preview' | 'final'
  required: boolean
  previewPlaceholderAllowed: boolean
  contentType?: string
  segmentIds: string[]
  timingIds: string[]
  rendererLayerIds: string[]
}

export type CanonicalWorkItemDraft = {
  workItemKey: string
  workItemType: 'validate_approved_snapshot' | 'prepare_source_trim' | 'custom' | 'render_final_export' | 'run_final_qa'
  workerClass: string
  executionInput: JsonRecord
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
  expectedOutputs: CanonicalExpectedOutputDraft[]
  dependencyKeys: string[]
  approvedToolIds: string[]
  approvedProviderRoute?: string
  providerExecutionMode: 'none'
  fallbackPolicy: JsonRecord
  maxAttempts: number
  attemptTimeoutSeconds: number
  scheduledDelaySeconds: number
  maximumCreditBudget: number
  required: boolean
}

export type CanonicalPlanDraft = {
  schemaVersion: typeof CANONICAL_PRIVATE_PLAN_SCHEMA_VERSION
  components: CanonicalPlanComponentsDraft
  estimate: {
    lineItems: Array<{
      lineKey: string
      label: string
      category: string
      estimatedCredits: number
      removable: boolean
      metadata: JsonRecord
    }>
    fallbackAllowanceCredits: number
    validForSeconds: number
  }
  workItems: CanonicalWorkItemDraft[]
}

export type CanonicalPlanningDraft = {
  orderedSourceItems: CanonicalSourceAuthorityItem[]
  components: CanonicalPlanComponentsDraft
  publication?: {
    canonicalPlan: CanonicalPlanDraft
    planningRequestIdSeed: string
  }
  publicationBlockers: string[]
  warnings: string[]
}

export type CanonicalPlanningDraftResult =
  | { ok: true; draft: CanonicalPlanningDraft }
  | { ok: false; errors: string[] }

export function projectCanonicalStorytellingStyleAuthority(
  source: CanonicalStorytellingStylePlanReviewSource,
): CanonicalStorytellingStyleAuthorityDraft {
  if (
    source.styleSelection.state !== 'selected_for_plan' ||
    source.calibrationPlan.approvalAuthority.state !== 'planning_only' ||
    source.calibrationPlan.styleSelectionDigest !== source.styleSelection.selectionDigest ||
    source.internalCostEnvelopeIncludedInPlanReview !== true ||
    source.customerPricingCalculatedHere !== false ||
    source.customerCreditsMutated !== false ||
    source.decisionAuthority !== 'existing_plan_review' ||
    source.runtimeExecutionAuthorized !== false ||
    source.immutable !== true
  ) {
    throw new Error(
      'Storytelling style authority must be one exact immutable planning-only Plan Review input.',
    )
  }
  const range = source.calibrationPlan.estimatedInternalCostRangeMicros
  return {
    schemaVersion: 'canonical-storytelling-style-authority-v1',
    sourceSchemaVersion: source.schemaVersion,
    sourceAuthority: 'motion_studio_storytelling_style_planning_service',
    evidenceClass: 'controlled_local_browser_relayed_server_prepared_content_addressed',
    sourceRepositoryReverified: false,
    workspaceId: source.workspaceId,
    projectId: source.projectId,
    editSessionId: source.editSessionId,
    productionId: source.productionId,
    styleSelection: {
      schemaVersion: source.styleSelection.schemaVersion,
      id: source.styleSelection.id,
      state: 'selected_for_plan',
      selectionDigest: source.styleSelection.selectionDigest,
      styleProfile: { ...source.styleSelection.styleProfile },
      motionLanguage: { ...source.styleSelection.motionLanguage },
      motionDnaVersion: { ...source.styleSelection.motionDnaVersion },
      referenceContractVersions: source.styleSelection.referenceContractVersions.map((reference) => ({
        ...reference,
      })),
      sourceAuditDigests: [...source.styleSelection.sourceAuditDigests],
    },
    calibrationPlan: {
      schemaVersion: source.calibrationPlan.schemaVersion,
      id: source.calibrationPlan.id,
      planDigest: source.calibrationPlan.planDigest,
      styleSelectionDigest: source.calibrationPlan.styleSelectionDigest,
      routePolicyId: source.calibrationPlan.routePolicy.policyId,
      scenarioIds: source.calibrationPlan.scenarios.map((scenario) => scenario.id),
      scenarioKinds: source.calibrationPlan.scenarios.map((scenario) => scenario.kind),
      estimatedInternalCostRangeMicros: { ...range },
      approvalState: 'planning_only',
      automaticFallbackAllowed: source.calibrationPlan.automaticFallbackAllowed,
      fallbackRequiresNewApproval: source.calibrationPlan.fallbackRequiresNewApproval,
      bulkGenerationAllowed: source.calibrationPlan.bulkGenerationAllowed,
    },
    internalCostEnvelope: {
      schemaVersion: 'motion-studio-storytelling-style-internal-cost-envelope-v1',
      estimateId: source.internalCostEstimateId,
      estimateDigest: source.internalCostEstimateDigest,
      unit: 'usd_micros',
      minimumEstimatedInternalProductionCostMicros: range.minimum,
      maximumEstimatedInternalProductionCostMicros: range.maximum,
      approvalState: 'estimate_only_pending_plan_approval',
      internalProductionCostOnly: true,
      customerPriceIncluded: false,
      customerCreditsIncluded: false,
      serviceFeeIncluded: false,
    },
    decisionAuthority: source.decisionAuthority,
    planReviewIsSoleApprovalAuthority: true,
    changedStyleRequiresFreshPlanAndEstimate: true,
    historicalApprovedSnapshotRemainsImmutable: true,
    runtimeExecutionAuthorized: source.runtimeExecutionAuthorized,
    providerExecutionAuthorized: false,
    customerCommercialAuthorityGranted: false,
    productionReady: false,
    immutable: source.immutable,
  }
}

export function buildCanonicalPlanningDraft(input: {
  plan: EditPlan
  plannerInput: PlannerInput
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  motionStudioStorytellingStylePlan?: CanonicalStorytellingStylePlanReviewSource
}): CanonicalPlanningDraftResult {
  const errors: string[] = []
  const { plan, plannerInput } = input
  let motionStudioStorytellingStyleAuthority: CanonicalStorytellingStyleAuthorityDraft | undefined
  if (input.motionStudioStorytellingStylePlan) {
    try {
      motionStudioStorytellingStyleAuthority = projectCanonicalStorytellingStyleAuthority(
        input.motionStudioStorytellingStylePlan,
      )
    } catch {
      errors.push('Refresh the exact Storytelling style direction before canonical planning can continue.')
    }
  }
  const orderedSourceItems = buildSourceItems(input.sourceMediaAssets, plannerInput, errors)

  if (!plannerInput.aspectRatioConfirmed || plannerInput.aspectRatio === 'let_ai_decide') {
    errors.push('Confirm the output frame before saving this plan to the canonical workflow.')
  }
  if (!plannerInput.sourceOrderConfirmed) {
    errors.push('Confirm the source order before saving this plan to the canonical workflow.')
  }
  if (!plannerInput.cleanupPreferenceConfirmed || !plannerInput.cleanupPreference) {
    errors.push('Confirm source cleanup before saving this plan to the canonical workflow.')
  }
  if (!plan.masterTimingPlan || plan.masterTimingPlan.status !== 'ready') {
    errors.push('The frame-accurate timing plan must be ready before canonical planning can continue.')
  }
  if (!plan.timingValidationPlan || plan.timingValidationPlan.approvalBlocked) {
    errors.push('Resolve the blocking timing validation before canonical planning can continue.')
  }
  if (plan.trimReviewPlan?.approvalBlocked) {
    errors.push(plan.trimReviewPlan.approvalBlockReasons[0] ?? 'Resolve source meaning review before canonical planning can continue.')
  }
  if (!plan.compiledIntent || !plan.professionalEditingDirective) {
    errors.push('The plan must include compiled intent and professional editing direction.')
  }
  const professionalExportCoverage = plan.creditEstimate.professionalExportCoverage
  const approvedExportAspectRatio = professionalExportCoverage?.approvedAspectRatio
  if (
    !professionalExportCoverage ||
    !approvedExportAspectRatio ||
    approvedExportAspectRatio !== plannerInput.aspectRatio ||
    professionalExportCoverage.costBasisProfileId !== 'uhd_2160' ||
    professionalExportCoverage.includedInInitialEstimate !== true ||
    professionalExportCoverage.requiresSeparateExportEstimate !== false ||
    professionalExportCoverage.allowsAdditionalExportCharge !== false
  ) {
    errors.push('The canonical plan requires the confirmed aspect ratio and mandatory 4K UHD export ceiling in the initial edit estimate.')
  }

  if (
    errors.length > 0 ||
    !plan.masterTimingPlan ||
    !plannerInput.cleanupPreference ||
    !professionalExportCoverage ||
    !approvedExportAspectRatio
  ) {
    return { ok: false, errors: unique(errors) }
  }

  const fps = plan.masterTimingPlan.timingBase.fps
  const totalFrames = plan.masterTimingPlan.timingBase.totalFrames
  if (!Number.isInteger(totalFrames) || totalFrames <= 0 || !Number.isFinite(fps) || fps <= 0) {
    return { ok: false, errors: ['The approved timing base is not frame-safe.'] }
  }
  const expectedExportCoverage = buildProfessionalExportCreditCoverage({
    durationSeconds: totalFrames / fps,
    outputFps: fps,
    approvedAspectRatio: approvedExportAspectRatio,
  })
  if (
    professionalExportCoverage.outputFps !== expectedExportCoverage.outputFps ||
    professionalExportCoverage.durationSeconds !== expectedExportCoverage.durationSeconds ||
    professionalExportCoverage.megapixelFrames !== expectedExportCoverage.megapixelFrames ||
    professionalExportCoverage.lowInternalToolCostCredits !== expectedExportCoverage.lowInternalToolCostCredits ||
    professionalExportCoverage.expectedInternalToolCostCredits !== expectedExportCoverage.expectedInternalToolCostCredits ||
    professionalExportCoverage.maximumInternalToolCostCredits !== expectedExportCoverage.maximumInternalToolCostCredits ||
    JSON.stringify(professionalExportCoverage.approvedFrames) !==
      JSON.stringify(expectedExportCoverage.approvedFrames)
  ) {
    return {
      ok: false,
      errors: ['The mandatory 4K UHD estimate is stale for the approved duration, FPS, or output frame.'],
    }
  }

  const cleanup = buildCleanupDecisions({
    plan,
    plannerInput,
    orderedSourceItems,
    sourceMediaAssets: input.sourceMediaAssets,
    fps,
  })
  if (!cleanup.ok) return cleanup

  const segments = buildSegments(plan, totalFrames)
  if (!segments.ok) return segments
  const approvedVoiceDeliverySources = buildApprovedVoiceDeliverySources({
    plan,
    plannerInput,
    sourceItems: orderedSourceItems,
    sourceMediaAssets: input.sourceMediaAssets,
    cleanupDecisions: cleanup.decisions,
  })
  const approvedColorDeliverySources = buildApprovedColorDeliverySources({
    plan,
    plannerInput,
    sourceItems: orderedSourceItems,
    cleanupDecisions: cleanup.decisions,
  })
  const approvedHardCutTransitions = buildApprovedHardCutTransitions({
    plan,
    sourceItems: orderedSourceItems,
    segments: segments.segments,
    fps,
    totalFrames,
  })

  const frame = canonicalFourKMasterFrame(approvedExportAspectRatio)
  const timingValidationPlan = plan.timingValidationPlan
  if (!timingValidationPlan) {
    return { ok: false, errors: ['The timing validation result is missing.'] }
  }
  const timingStatus = timingValidationPlan.overallStatus === 'warning' ? 'warning' : 'passed'
  const meaningStatus = plan.trimReviewPlan?.meaningPreservationValidationPlan.status === 'warning' ? 'warning' : 'passed'
  const preferenceSnapshotId = safeOptionalKey(plannerInput.preferenceSnapshotId)
  const preferenceRevision = Number.isInteger(plannerInput.currentEditPreferenceRevision) &&
    Number(plannerInput.currentEditPreferenceRevision) >= 0
    ? Number(plannerInput.currentEditPreferenceRevision)
    : undefined
  const preferencePlanningInputRevision =
    Number.isInteger(plannerInput.currentEditPreferencePlanningInputRevision) &&
    Number(plannerInput.currentEditPreferencePlanningInputRevision) >= 0
      ? Number(plannerInput.currentEditPreferencePlanningInputRevision)
      : undefined
  const preferenceFingerprintSha256 = /^[a-f0-9]{64}$/.test(
    plannerInput.currentEditPreferenceFingerprintSha256 ?? '',
  )
    ? plannerInput.currentEditPreferenceFingerprintSha256
    : undefined
  const sourceSliceMezzanineFinalizationRequired =
    orderedSourceItems.length === 1 &&
    totalFrames > CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES
  const toolStrategy = {
    schemaVersion: 'canonical-browser-tool-strategy-projection-v1',
    toolIds: unique([
      'libass',
      ...(approvedVoiceDeliverySources || approvedColorDeliverySources ||
        sourceSliceMezzanineFinalizationRequired ? ['ffmpeg'] : []),
      'remotion',
      'ffprobe',
    ]),
    exactOperationIds: unique([
      LIBASS_OPERATION,
      ...(approvedVoiceDeliverySources || approvedColorDeliverySources ||
        sourceSliceMezzanineFinalizationRequired ? [FFMPEG_OPERATION] : []),
      REMOTION_OPERATION,
      FFPROBE_OPERATION,
    ]),
    plannedStrategy: toJsonRecord(plan.toolStrategyPlan, { status: 'not_provided' }),
    frontendExecutionAllowed: false,
  }

  const components: CanonicalPlanComponentsDraft = {
    compiledIntent: toJsonRecord(plan.compiledIntent, { goalSummary: plan.goalSummary }),
    professionalEditingDirective: toJsonRecord(plan.professionalEditingDirective, { mustFollowRules: ['Preserve source meaning.'] }),
    confirmedSettings: {
      aspectRatio: plannerInput.aspectRatio,
      outputFrame: { ...frame, fps },
      outputFramePurpose: 'private_canonical_4k_master_review',
      professionalExportCoverage,
      outputFrameConfirmed: true,
      sourceOrderConfirmed: true,
      sourceCleanupConfirmed: true,
      editLevel: plannerInput.editLevel,
      targetPlatform: plannerInput.targetPlatform,
      ...(preferenceSnapshotId ? { preferenceSnapshotId } : {}),
      ...(preferenceRevision !== undefined ? { preferenceRevision } : {}),
      ...(preferencePlanningInputRevision !== undefined
        ? { preferencePlanningInputRevision }
        : {}),
      ...(preferenceFingerprintSha256 ? { preferenceFingerprintSha256 } : {}),
    },
    sourceSequence: orderedSourceItems.map((item) => ({ ...item })),
    sourceCleanupSummary: {
      status: 'confirmed',
      cleanupPreference: plannerInput.cleanupPreference,
      trimValidationStatus: plan.sourceCleanupPlan?.status === 'confirmed' ? 'passed' : 'warning',
      meaningValidationStatus: meaningStatus,
      userReviewRequired: false,
    },
    sourceCleanupPlan: { status: 'confirmed', decisions: cleanup.decisions },
    masterTimingPlan: toJsonRecord(plan.masterTimingPlan, { status: 'ready' }),
    captionVisualCueTimingPlan: toJsonRecord(plan.captionVisualCueTimingPlan, { status: 'not_needed' }),
    soundSyncTransitionTimingPlan: toJsonRecord(plan.soundSyncTransitionTimingPlan, { status: 'not_needed', speechPriority: true }),
    timingValidationPlan: toJsonRecord(timingValidationPlan, { overallStatus: timingStatus, approvalBlocked: false }),
    timingSummary: { validationStatus: timingStatus, approvalBlocked: false, fps, totalFrames },
    segments: segments.segments,
    visualAssetPlan: {
      status: (plan.visualAssetPlan?.length ?? 0) > 0 ? 'planned' : 'not_needed',
      assets: toJsonValue(plan.visualAssetPlan ?? []),
      randomBrollAllowed: false,
    },
    colorPipelinePlan: toJsonRecord(plan.colorPipelinePlan, { status: 'not_provided' }),
    rendererPlan: {
      renderer: 'remotion',
      frameOwnedByRenderer: true,
      renderPurpose: 'private_4k_delivery_master_v1',
      deliveryProfileId: 'uhd_2160',
      sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
      reviewUsesExactMasterArtifact: true,
      composition: toJsonValue(plan.rendererCompositionPlan ?? {}),
      strategy: toJsonValue(plan.renderStrategyPlan ?? {}),
    },
    toolStrategyPlan: toolStrategy,
    qaPlan: toJsonRecord(plan.editQAPlan, { checks: plan.qaChecks ?? [] }),
    qaSummary: { status: timingStatus, approvalBlocked: false },
    providerPolicy: {
      veoPolicy: plannerInput.editLevel === 'premium' ? 'final_fallback_only' : 'forbidden',
      approvedRoutes: [],
    },
    fallbackPolicy: {
      unapprovedFallbackAllowed: false,
      policy: toJsonValue(plan.agentQAFallbackPlan ?? {}),
    },
    ...(motionStudioStorytellingStyleAuthority
      ? {
          motionStudioStorytellingStyleAuthority,
        }
      : {}),
  }
  if (containsForbiddenOutboundMaterial(components)) {
    return {
      ok: false,
      errors: ['The plan contains private path, credential, or source-byte material that cannot cross the browser planning boundary.'],
    }
  }

  const publicationBlockers = privateReviewPublicationBlockers({
    plan,
    plannerInput,
    orderedSourceItems,
    sourceMediaAssets: input.sourceMediaAssets,
    frame,
    fps,
    totalFrames,
    cleanupDecisions: cleanup.decisions,
    segments: segments.segments,
    approvedVoiceDeliverySources,
    approvedColorDeliverySources,
    approvedHardCutTransitions,
  })
  if (
    !preferenceSnapshotId
    || preferenceRevision === undefined
    || preferencePlanningInputRevision === undefined
    || !preferenceFingerprintSha256
  ) {
    publicationBlockers.push(
      'Refresh the canonical exact-edit preference authority before publishing this plan.',
    )
  }
  const canonicalEstimate = buildEstimate(plan)
  if (!canonicalEstimate.ok) publicationBlockers.push(canonicalEstimate.blocker)
  const publication = publicationBlockers.length === 0 && canonicalEstimate.ok
    ? {
        canonicalPlan: buildPrivateReviewCanonicalPlan({
          plan,
          components,
          estimate: canonicalEstimate.estimate,
          sourceItems: orderedSourceItems,
          cleanupDecisions: cleanup.decisions,
          frame,
          fps: fps as 24 | 30,
          totalFrames,
          approvedVoiceDeliverySources,
          approvedColorDeliverySources,
          approvedHardCutTransitions: approvedHardCutTransitions ?? [],
        }),
        planningRequestIdSeed: safeKey(plan.planningInputTrace?.fingerprint ?? plan.planningContextTrace?.planningContextId ?? 'named-edit-plan', 'named-edit-plan'),
      }
    : undefined

  return {
    ok: true,
    draft: {
      orderedSourceItems,
      components,
      publication,
      publicationBlockers,
      warnings: publicationBlockers.length > 0
        ? ['The exact planning inputs can be saved, but the current private review runner cannot yet represent every approved plan requirement.']
        : [],
    },
  }
}

function buildSourceItems(
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[],
  plannerInput: PlannerInput,
  errors: string[],
): CanonicalSourceAuthorityItem[] {
  const durable = sourceMediaAssets
    .filter((asset) => asset.privateArtifact === true && asset.publicUrl === null && asset.signedUrl === null)
    .sort((left, right) => left.uploadedOrder - right.uploadedOrder)
  if (
    sourceMediaAssets.length === 0 ||
    sourceMediaAssets.length !== plannerInput.clips.length ||
    durable.length !== sourceMediaAssets.length
  ) {
    errors.push('Every source in the confirmed sequence must have a finalized private upload before canonical planning.')
    return []
  }

  const items = durable.flatMap((asset, index): CanonicalSourceAuthorityItem[] => {
    const sourceSequenceItemId = asset.sourceSequenceItemId?.trim() ?? ''
    const mediaAssetId = asset.mediaAssetId?.trim() ?? ''
    const checksumSha256 = asset.checksumSha256?.trim().toLowerCase() ?? ''
    const expectedClipId = plannerInput.clips[index]?.id
    if (
      asset.uploadedOrder !== index + 1 ||
      !expectedClipId ||
      asset.uploadedClipId !== expectedClipId ||
      !safeIdentity(sourceSequenceItemId) ||
      !safeIdentity(mediaAssetId) ||
      !SHA256.test(checksumSha256)
    ) {
      errors.push('The finalized source sequence contains an invalid identity, order, or checksum.')
      return []
    }
    return [{ sourceSequenceItemId, mediaAssetId, uploadedOrder: index + 1, checksumSha256, required: true }]
  })
  if (items.length !== durable.length || new Set(items.map((item) => item.sourceSequenceItemId)).size !== items.length ||
      new Set(items.map((item) => item.mediaAssetId)).size !== items.length) {
    errors.push('The finalized source sequence must use unique source and media identities.')
  }
  return items
}

function buildCleanupDecisions(input: {
  plan: EditPlan
  plannerInput: PlannerInput
  orderedSourceItems: CanonicalSourceAuthorityItem[]
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  fps: number
}): { ok: true; decisions: CanonicalSourceCleanupDecisionDraft[] } | { ok: false; errors: string[] } {
  const decisions: CanonicalSourceCleanupDecisionDraft[] = []
  const errors: string[] = []
  if (!input.plan.sourceCleanupPlan || input.plan.sourceCleanupPlan.status !== 'confirmed') {
    return { ok: false, errors: ['The source cleanup plan must be confirmed before canonical planning.'] }
  }
  const planDecisions = input.plan.sourceCleanupPlan.decisions

  input.orderedSourceItems.forEach((sourceItem, index) => {
    const clip = input.plannerInput.clips[index]
    const asset = input.sourceMediaAssets.find((candidate) => candidate.uploadedOrder === sourceItem.uploadedOrder)
    const planDecision = planDecisions.find((decision) => decision.clipId === clip?.id || decision.clipId === asset?.uploadedClipId)
    if (!planDecision || !planDecision.reason.trim()) {
      errors.push(`The confirmed source cleanup decision for ${clip?.fileName ?? `source ${index + 1}`} is missing or has no reason.`)
      return
    }
    if (planDecision?.userReviewRequired || planDecision?.decision === 'needs_user_review' || planDecision?.decision === 'cannot_decide_mock') {
      errors.push(`Resolve the source cleanup review for ${clip?.fileName ?? `source ${index + 1}`} before canonical planning.`)
      return
    }
    const range = cleanupRange(planDecision, asset, input.fps)
    if (!range) {
      errors.push(`The source cleanup range for ${clip?.fileName ?? `source ${index + 1}`} is not frame-safe.`)
      return
    }
    decisions.push({
      decisionId: safeKey(planDecision?.id ?? `cleanup-source-${index + 1}`, `cleanup-source-${index + 1}`),
      sourceSequenceItemId: sourceItem.sourceSequenceItemId,
      action: canonicalCleanupAction(planDecision?.decision),
      startFrame: range.startFrame,
      endFrameExclusive: range.endFrameExclusive,
      reason: boundedText(planDecision.reason, 'Preserve the confirmed source range without changing its meaning.', 1_000),
      confidence: planDecision?.riskLevel === 'high' ? 0.7 : planDecision?.riskLevel === 'medium' ? 0.85 : 0.95,
      meaningPreservationStatus: planDecision?.riskLevel === 'high' ? 'warning' : 'passed',
      userReviewStatus: 'not_required',
    })
  })

  return errors.length > 0 ? { ok: false, errors: unique(errors) } : { ok: true, decisions }
}

function buildSegments(
  plan: EditPlan,
  totalFrames: number,
): { ok: true; segments: CanonicalPlanComponentsDraft['segments'] } | { ok: false; errors: string[] } {
  const timingSegments = plan.masterTimingPlan?.finalTimelineSegments ?? []
  const planSegments = new Map((plan.segmentEditPlans ?? []).map((segment) => [segment.id, segment]))
  const segments = timingSegments.map((segment, index) => {
    const startFrame = segment.finalRange.startFrame
    const endFrameExclusive = segment.finalRange.endFrame
    const segmentId = safeKey(segment.segmentId ?? segment.id, `segment-${index + 1}`)
    const operationIds = planSegments.get(segment.segmentId ?? '')?.operations.map((operation, operationIndex) =>
      safeKey(operation.id, `${segmentId}-operation-${operationIndex + 1}`)) ?? [`${segmentId}-operation`]
    return { segmentId, startFrame, endFrameExclusive, operationIds: unique(operationIds) }
  })
  if (segments.length === 0) {
    return { ok: true, segments: [{ segmentId: 'segment-1', startFrame: 0, endFrameExclusive: totalFrames, operationIds: ['segment-1-operation'] }] }
  }
  let previousEnd = 0
  for (const segment of segments) {
    if (!Number.isInteger(segment.startFrame) || !Number.isInteger(segment.endFrameExclusive) ||
        segment.startFrame < previousEnd || segment.endFrameExclusive <= segment.startFrame ||
        segment.endFrameExclusive > totalFrames) {
      return { ok: false, errors: ['The final timeline contains an overlapping or out-of-range segment.'] }
    }
    previousEnd = segment.endFrameExclusive
  }
  return { ok: true, segments }
}

function privateReviewPublicationBlockers(input: {
  plan: EditPlan
  plannerInput: PlannerInput
  orderedSourceItems: CanonicalSourceAuthorityItem[]
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  frame: { width: number; height: number }
  fps: number
  totalFrames: number
  cleanupDecisions: CanonicalSourceCleanupDecisionDraft[]
  segments: CanonicalPlanComponentsDraft['segments']
  approvedVoiceDeliverySources: ApprovedVoiceDeliverySource[] | null
  approvedColorDeliverySources: ApprovedColorDeliverySource[] | null
  approvedHardCutTransitions: ApprovedHardCutTransition[] | null
}): string[] {
  const blockers: string[] = []
  const captionCues = approvedCaptionCues(input.plan, input.totalFrames)
  if (input.orderedSourceItems.length > CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS) {
    blockers.push('Private canonical review currently supports at most eight ordered source videos per composition.')
  }
  if (input.sourceMediaAssets.some((asset) => asset.mimeType.toLowerCase() !== 'video/mp4')) {
    blockers.push('Every source in the private canonical review sequence must be an MP4.')
  }
  if (input.sourceMediaAssets.some((asset) =>
    asset.byteSize < 64 || asset.byteSize > REEDITPRO_SOURCE_MEDIA_MAX_BYTES)) {
    blockers.push('Each private canonical review source must stay within the professional source-media ceiling.')
  }
  const largeSourceCount = input.sourceMediaAssets.filter((asset) =>
    asset.byteSize > CANONICAL_DIRECT_SOURCE_BUFFER_MAX_BYTES).length
  if (
    largeSourceCount > 0 &&
    input.approvedColorDeliverySources?.length !== input.sourceMediaAssets.length
  ) {
    blockers.push('Large private sources require one approved professional color intermediate per source before final composition.')
  }
  if (input.sourceMediaAssets.some((asset) =>
    asset.sourceMetadata?.probeStatus !== 'probed' || asset.sourceMetadata.hasVideo !== true)) {
    blockers.push('Every private canonical review source requires verified video metadata before an execution candidate can be saved.')
  }
  if (!SUPPORTED_PRIVATE_4K_MASTER_FRAMES.has(`${input.frame.width}x${input.frame.height}`)) {
    blockers.push('Private canonical execution requires an exact registered 4K UHD master frame for the confirmed aspect ratio.')
  }
  if (![24, 30].includes(input.fps)) blockers.push('Private canonical review currently supports a 24fps or 30fps timing base.')
  const sourceTimeline = buildOrderedSourceTimeline(input.orderedSourceItems, input.cleanupDecisions)
  if (!sourceTimeline || sourceTimeline.at(-1)?.timelineEndFrameExclusive !== input.totalFrames) {
    blockers.push('Approved source ranges must form one contiguous, duration-preserving final timeline in confirmed source order.')
  }
  if (input.totalFrames < CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES) {
    blockers.push('Private canonical composition requires at least 24 approved frames.')
  } else if (input.orderedSourceItems.length === 1) {
    if (input.totalFrames > CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES) {
      if (input.totalFrames > CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_FRAMES) {
        blockers.push('The private single-source slice profile supports at most 3,840 approved frames; larger programs require distributed object/mezzanine evidence.')
      } else if (sourceTimeline) {
        const sourceSlicePlan = planCanonicalPrivateSourceSliceMezzanineChunks({
          totalFrames: input.totalFrames,
          sourceSegments: sourceTimeline,
        })
        if (!sourceSlicePlan.ok) blockers.push(sourceSlicePlan.blocker)
      }
      if (input.sourceMediaAssets[0]?.sourceMetadata?.hasAudio !== true) {
        blockers.push('The private mezzanine finalizer requires one verified approved source audio stream for continuous final audio.')
      }
    }
  } else if (input.totalFrames > CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES) {
    if (input.totalFrames > CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES) {
      blockers.push('The first private long-form profile supports at most 1,920 approved frames; a larger profile requires source-slice and distributed merge evidence.')
    } else if (sourceTimeline) {
      const longFormPlan = planCanonicalPrivateLongFormChunks({
        totalFrames: input.totalFrames,
        sourceSegments: sourceTimeline,
      })
      if (!longFormPlan.ok) blockers.push(longFormPlan.blocker)
    }
  }
  input.cleanupDecisions.forEach((cleanupDecision, index) => {
    const sourceItem = input.orderedSourceItems[index]
    const sourceAsset = input.sourceMediaAssets.find((asset) =>
      asset.uploadedOrder === sourceItem?.uploadedOrder)
    if (!['keep', 'preserve', 'tighten'].includes(cleanupDecision.action)) {
      blockers.push(`Source ${index + 1} requires an unsupported cleanup action for this bounded composition.`)
    }
    const sourceDurationFrames = durationFrames(
      sourceAsset?.sourceMetadata?.durationSeconds,
      input.fps,
    )
    if (sourceDurationFrames === undefined || cleanupDecision.endFrameExclusive > sourceDurationFrames) {
      blockers.push(`The approved range for source ${index + 1} must fit inside its verified source duration.`)
    }
    if (
      cleanupDecision.endFrameExclusive - cleanupDecision.startFrame >
      CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES &&
      input.orderedSourceItems.length !== 1
    ) {
      blockers.push(
        `The approved range for source ${index + 1} exceeds the current 240-frame source-operation ceiling and requires chunk render, QA, and merge evidence.`,
      )
    }
  })
  if (
    !sourceTimeline || input.segments.length !== sourceTimeline.length ||
    input.segments.some((segment, index) =>
      segment.startFrame !== sourceTimeline[index]?.timelineStartFrame ||
      segment.endFrameExclusive !== sourceTimeline[index]?.timelineEndFrameExclusive)
  ) {
    blockers.push('Final timeline segments must map one-to-one to the ordered approved source ranges for this bounded composition.')
  }
  if ((input.plan.visualAssetPlan?.length ?? 0) > 0) blockers.push('The planned visual assets need their exact canonical tool or provider work items before publication.')
  if ((input.plan.providerPromptPlans?.length ?? 0) > 0) blockers.push('Provider-backed plan items remain gated until their canonical work items are compiled.')
  if (!captionCues) {
    blockers.push('Private canonical review requires one full-duration caption or two to seven safe, ordered, non-overlapping caption cues.')
  }
  if ((input.plan.masterTimingPlan?.visualTimingItems.length ?? 0) > 0) blockers.push('Timed visual cues need their own canonical execution work items.')
  const plannedTransitionCount = Math.max(
    input.plan.masterTimingPlan?.transitionTimingItems.length ?? 0,
    input.plan.soundSyncTransitionTimingPlan?.refinedTransitionTimings.length ?? 0,
  )
  const expectedTransitionCount = Math.max(0, input.orderedSourceItems.length - 1)
  if (
    plannedTransitionCount !== expectedTransitionCount ||
    !input.approvedHardCutTransitions
  ) blockers.push('Timed transitions need their own canonical execution work items.')
  if (
    (input.plan.masterTimingPlan?.sfxTimingItems.length ?? 0) > 0 ||
    (input.plan.soundSyncTransitionTimingPlan?.refinedSfxTimings.length ?? 0) > 0
  ) blockers.push('Sound-effect cues need their own canonical execution work items.')
  if ((input.plan.masterTimingPlan?.musicDuckingTimingItems.length ?? 0) > 0) blockers.push('Music ducking needs its own canonical audio work items.')
  if ((input.plan.masterTimingPlan?.providerClipTimingItems.length ?? 0) > 0) blockers.push('Provider clips need their own canonical execution work items.')
  if (hasUnrepresentedSegmentOperations(input.plan, {
    audioCleanupRepresented: Boolean(input.approvedVoiceDeliverySources),
    colorWorkRepresented: Boolean(input.approvedColorDeliverySources),
  })) blockers.push('The planned edit includes operations outside the current source-and-caption private review runner.')
  if (hasUnrepresentedColorWork(input.plan, input.approvedColorDeliverySources)) {
    blockers.push('The planned color work needs exact canonical processing work items.')
  }
  if (input.approvedColorDeliverySources && !input.approvedVoiceDeliverySources) {
    blockers.push(
      'The source-color intermediate removes source audio and requires exact approved voice delivery before composition.',
    )
  }
  if (hasPlannedAudioWork(input.plan) && !input.approvedVoiceDeliverySources) {
    blockers.push(
      'The planned audio work exceeds the exact source-bound voice delivery recipe and needs additional canonical work items.',
    )
  }
  if (
    input.orderedSourceItems.length === 1 &&
    input.totalFrames > CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES &&
    (input.approvedVoiceDeliverySources || input.approvedColorDeliverySources)
  ) {
    blockers.push(
      'The source-slice profile preserves the approved source audio/color as-is; slice-aware professional audio and color preprocessing need separate continuity evidence before this planned processing can execute.',
    )
  }
  return unique(blockers)
}

function buildPrivateReviewCanonicalPlan(input: {
  plan: EditPlan
  components: CanonicalPlanComponentsDraft
  estimate: CanonicalPlanDraft['estimate']
  sourceItems: CanonicalSourceAuthorityItem[]
  cleanupDecisions: CanonicalSourceCleanupDecisionDraft[]
  frame: { width: number; height: number }
  fps: 24 | 30
  totalFrames: number
  approvedVoiceDeliverySources: ApprovedVoiceDeliverySource[] | null
  approvedColorDeliverySources: ApprovedColorDeliverySource[] | null
  approvedHardCutTransitions: ApprovedHardCutTransition[]
}): CanonicalPlanDraft {
  const segmentIds = input.components.segments.map((segment) => segment.segmentId)
  const timingId = safeKey(input.plan.masterTimingPlan?.id ?? 'master-timing-plan', 'master-timing-plan')
  const captionCues = approvedCaptionCues(input.plan, input.totalFrames)
  if (!captionCues) throw new Error('Canonical caption cues changed after publication validation.')
  const panelBackground = safeColor(input.plan.aspectRatioFramePlan?.panelBackgroundColor)
  const estimate = input.estimate
  const sourceIds = input.sourceItems.map((source) => source.sourceSequenceItemId)
  const cleanupIds = input.cleanupDecisions.map((decision) => decision.decisionId)
  const sourceTimeline = buildOrderedSourceTimeline(input.sourceItems, input.cleanupDecisions)
  if (!sourceTimeline || sourceTimeline.at(-1)?.timelineEndFrameExclusive !== input.totalFrames) {
    throw new Error('Canonical source sequence lost its exact approved timeline during compilation.')
  }
  const longFormChunkPlan = sourceTimeline.length === 1 &&
    input.totalFrames > CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES
    ? planCanonicalPrivateSourceSliceMezzanineChunks({
        totalFrames: input.totalFrames,
        sourceSegments: sourceTimeline,
      })
    : input.totalFrames > CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES
      ? planCanonicalPrivateLongFormChunks({
          totalFrames: input.totalFrames,
          sourceSegments: sourceTimeline,
        })
      : null
  if (longFormChunkPlan && !longFormChunkPlan.ok) {
    throw new Error(`Canonical long-form compilation failed: ${longFormChunkPlan.blocker}`)
  }
  const approvedLongFormChunkPlan = longFormChunkPlan?.ok
    ? longFormChunkPlan.plan
    : null
  const budgets = fitBudgets(
    estimate.lineItems.reduce((sum, item) => sum + item.estimatedCredits, 0) +
      estimate.fallbackAllowanceCredits,
    captionCues.length,
    input.approvedVoiceDeliverySources?.length ?? 0,
    input.approvedColorDeliverySources?.length ?? 0,
    approvedLongFormChunkPlan ? approvedLongFormChunkPlan.chunkCount + 1 : 1,
  )
  const sourceSequenceComposition = sourceTimeline.length > 1
  const captionTrackComposition = captionCues.length > 1
  const voiceDeliverySources = input.approvedVoiceDeliverySources ?? []
  const colorDeliverySources = input.approvedColorDeliverySources ?? []
  const replaceSourceAudio = voiceDeliverySources.length > 0
  if (replaceSourceAudio && voiceDeliverySources.length !== sourceTimeline.length) {
    throw new Error('Canonical voice delivery lost its one-to-one approved source binding.')
  }
  if (colorDeliverySources.length > 0 && colorDeliverySources.length !== sourceTimeline.length) {
    throw new Error('Canonical color delivery lost its one-to-one approved source binding.')
  }
  if (
    sourceSequenceComposition &&
    input.approvedHardCutTransitions.length !== sourceTimeline.length - 1
  ) throw new Error('Canonical source sequence lost its approved hard-cut transition authority.')
  const transitionTimingIds = input.approvedHardCutTransitions.flatMap((transition) => [
    transition.transitionTimingItemId,
    transition.refinedTransitionTimingItemId,
  ])
  const transitionRendererLayerIds = input.approvedHardCutTransitions.map(
    (_transition, index) => `approved-hard-cut-boundary-${index + 1}`,
  )

  const output = (
    outputKey: string,
    artifactType: string,
    assetRole: CanonicalExpectedOutputDraft['assetRole'],
    contentType: string,
    lineage: {
      segmentIds?: string[]
      timingIds?: string[]
      rendererLayerIds?: string[]
    } = {},
  ): CanonicalExpectedOutputDraft => ({
    outputKey,
    artifactType,
    assetRole,
    required: true,
    previewPlaceholderAllowed: false,
    contentType,
    segmentIds: lineage.segmentIds ?? [],
    timingIds: lineage.timingIds ?? [],
    rendererLayerIds: lineage.rendererLayerIds ?? [],
  })

  const captionWorkItems = captionCues.map((cue, index): CanonicalWorkItemDraft => {
    const ordinal = index + 1
    const workItemKey = captionTrackComposition ? `caption-overlay-${ordinal}` : 'caption-overlay'
    const outputKey = captionTrackComposition ? `caption-overlay-${ordinal}-png` : 'caption-overlay-png'
    const rendererLayerId = captionTrackComposition
      ? `caption-overlay-layer-${ordinal}`
      : 'caption-overlay-layer'
    const cueSegmentIds = input.components.segments
      .filter((segment) =>
        segment.startFrame < cue.endFrameExclusive && segment.endFrameExclusive > cue.startFrame)
      .map((segment) => segment.segmentId)
    const captionLayout = professionalCaptionLayout(input.frame)
    return {
      workItemKey,
      workItemType: 'custom',
      workerClass: 'render_worker',
      executionInput: {
        operation: 'render_approved_caption_overlay',
        approvedToolOperationIds: [LIBASS_OPERATION],
        expectedOutputKeys: [outputKey],
        structuredPayload: {
          captionProfileId: 'approved_ass_track_render_v1',
          fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
          collisionPolicy: 'fail_on_reserved_zone_collision',
          preserveSpeechTiming: true,
          width: input.frame.width,
          height: input.frame.height,
          timestampMs: 1_000,
          fontSize: captionLayout.fontSize,
          marginV: captionLayout.marginV,
          alignment: 2,
          caption: cue.caption,
        },
      },
      sourceSequenceItemIds: [],
      sourceCleanupDecisionIds: [],
      expectedOutputs: [output(
        outputKey,
        'controlled_libass_caption_overlay_png',
        'processed',
        'image/png',
        {
          segmentIds: cueSegmentIds,
          timingIds: [timingId, cue.timingId],
          rendererLayerIds: [rendererLayerId],
        },
      )],
      dependencyKeys: [],
      approvedToolIds: ['libass'],
      providerExecutionMode: 'none',
      fallbackPolicy: {},
      maxAttempts: 2,
      attemptTimeoutSeconds: 300,
      scheduledDelaySeconds: 0,
      maximumCreditBudget: budgets[2 + index]!,
      required: true,
    }
  })
  const captionDependencyKeys = captionWorkItems.map((item) => item.workItemKey)
  const captionOutputKeys = captionWorkItems.map((item) => item.expectedOutputs[0]!.outputKey)
  const captionRendererLayerIds = captionWorkItems.flatMap((item) =>
    item.expectedOutputs[0]!.rendererLayerIds)
  const voiceWorkItems = voiceDeliverySources.map((source, index): CanonicalWorkItemDraft => {
    const ordinal = index + 1
    const workItemKey = `voice-delivery-${ordinal}`
    const outputKey = `voice-delivery-${ordinal}-wav`
    const segmentId = input.components.segments[index]!.segmentId
    const rendererLayerId = `voice-track-layer-${ordinal}`
    return {
      workItemKey,
      workItemType: 'custom',
      workerClass: 'audio_processing_worker',
      executionInput: {
        operation: 'process_approved_source_voice_delivery',
        approvedToolOperationIds: [FFMPEG_OPERATION],
        expectedOutputKeys: [outputKey],
        structuredPayload: {
          recipeProfileId: 'approved_voice_delivery_wav_v1',
          timestampPolicy: 'normalize_from_zero',
          overwriteExistingArtifact: false,
          allowUnreviewedCodec: false,
          trimStartFrame: source.trimStartFrame,
          trimEndFrameExclusive: source.trimEndFrameExclusive,
          frameRate: input.fps,
          sampleRate: 48_000,
          channelMode: 'stereo',
          targetLufs: -14,
          truePeakDbtp: -1,
          loudnessRangeLufs: 7,
          highpassHz: 70,
          compressorPreset: 'gentle_voice_v1',
        },
      },
      sourceSequenceItemIds: [source.sourceSequenceItemId],
      sourceCleanupDecisionIds: [source.cleanupDecisionId],
      expectedOutputs: [output(
        outputKey,
        'controlled_ffmpeg_professional_voice_delivery_wav',
        'processed',
        'audio/wav',
        {
          segmentIds: [segmentId],
          timingIds: [timingId],
          rendererLayerIds: [rendererLayerId],
        },
      )],
      dependencyKeys: [],
      approvedToolIds: ['ffmpeg'],
      providerExecutionMode: 'none',
      fallbackPolicy: {},
      maxAttempts: 2,
      attemptTimeoutSeconds: 600,
      scheduledDelaySeconds: 0,
      maximumCreditBudget: budgets[2 + captionCues.length + index]!,
      required: true,
    }
  })
  const voiceDependencyKeys = voiceWorkItems.map((item) => item.workItemKey)
  const voiceRendererLayerIds = voiceWorkItems.flatMap((item) =>
    item.expectedOutputs[0]!.rendererLayerIds)
  const approvedVoiceTracks = voiceWorkItems.map((item, index) => ({
    sourceSequenceItemId: voiceDeliverySources[index]!.sourceSequenceItemId,
    outputKey: item.expectedOutputs[0]!.outputKey,
    durationFrames: voiceDeliverySources[index]!.durationFrames,
  }))
  const colorWorkItems = colorDeliverySources.map((source, index): CanonicalWorkItemDraft => {
    const ordinal = index + 1
    const workItemKey = `color-delivery-${ordinal}`
    const outputKey = `color-delivery-${ordinal}-mkv`
    const segmentId = input.components.segments[index]!.segmentId
    const rendererLayerId = `color-source-layer-${ordinal}`
    return {
      workItemKey,
      workItemType: 'custom',
      workerClass: 'color_processing_worker',
      executionInput: {
        operation: 'process_approved_source_professional_color_delivery',
        approvedToolOperationIds: [FFMPEG_OPERATION],
        expectedOutputKeys: [outputKey],
        structuredPayload: {
          recipeProfileId: source.recipeProfileId,
          timestampPolicy: 'normalize_from_zero',
          overwriteExistingArtifact: false,
          allowUnreviewedCodec: false,
          trimStartFrame: source.trimStartFrame,
          trimEndFrameExclusive: source.trimEndFrameExclusive,
          frameRate: input.fps,
          colorGradeStyle: source.colorGradeStyle,
          intensity: source.intensity,
          approvedColorOperationIds: source.approvedColorOperationIds,
          approvedColorOperationKinds: source.approvedColorOperationKinds,
          analysisProfileId: 'approved_three_frame_rgb_stats_v1',
          correctionProfileId: source.recipeProfileId ===
            'approved_source_color_match_delivery_matroska_v1'
            ? 'bounded_reference_matched_professional_source_color_v1'
            : 'bounded_professional_source_color_v1',
          ...(source.recipeProfileId === 'approved_source_color_match_delivery_matroska_v1'
            ? {
                shotMatchProfileId: 'approved_reference_three_frame_rgb_match_v1',
                referenceSourceSequenceItemId: source.referenceSourceSequenceItemId!,
                referenceDurationFrames: source.referenceDurationFrames!,
                referenceOutputKey: source.referenceOutputKey!,
              }
            : {}),
          outputColorSpace: 'bt709',
          outputPixelFormat: 'yuv420p',
          preserveAudio: false,
        },
      },
      sourceSequenceItemIds: [source.sourceSequenceItemId],
      sourceCleanupDecisionIds: [source.cleanupDecisionId],
      expectedOutputs: [output(
        outputKey,
        'controlled_ffmpeg_professional_color_delivery_matroska',
        'processed',
        'video/x-matroska',
        {
          segmentIds: [segmentId],
          timingIds: [timingId],
          rendererLayerIds: [rendererLayerId],
        },
      )],
      dependencyKeys: source.recipeProfileId ===
        'approved_source_color_match_delivery_matroska_v1'
        ? ['color-delivery-1']
        : [],
      approvedToolIds: ['ffmpeg'],
      providerExecutionMode: 'none',
      fallbackPolicy: {},
      maxAttempts: 2,
      attemptTimeoutSeconds: 900,
      scheduledDelaySeconds: 0,
      maximumCreditBudget: budgets[
        2 + captionCues.length + voiceWorkItems.length + index
      ]!,
      required: true,
    }
  })
  const colorDependencyKeys = colorWorkItems.map((item) => item.workItemKey)
  const colorRendererLayerIds = colorWorkItems.flatMap((item) =>
    item.expectedOutputs[0]!.rendererLayerIds)
  const compositionSourceTimeline = colorWorkItems.length > 0
    ? sourceTimeline.map((segment, index) => ({
        ...segment,
        sourceStartFrame: 0,
        sourceEndFrameExclusive: colorDeliverySources[index]!.durationFrames,
      }))
    : sourceTimeline
  const finalBudgetIndex = 2 + captionCues.length + voiceWorkItems.length +
    colorWorkItems.length
  const finalArtifactType = sourceSequenceComposition
    ? captionTrackComposition
      ? 'private_source_sequence_caption_track_4k_delivery_master_v1'
      : 'private_source_sequence_caption_4k_delivery_master_v1'
    : captionTrackComposition
      ? 'private_source_caption_track_4k_delivery_master_v1'
      : 'private_source_caption_4k_delivery_master_v1'

  const longFormRenderWorkItems: CanonicalWorkItemDraft[] = approvedLongFormChunkPlan
    ? buildLongFormRenderWorkItems({
        chunkPlan: approvedLongFormChunkPlan,
        frame: input.frame,
        fps: input.fps,
        totalFrames: input.totalFrames,
        panelBackground,
        timingId,
        components: input.components,
        cleanupDecisions: input.cleanupDecisions,
        captionCues,
        captionWorkItems,
        captionOutputKeys,
        voiceWorkItems,
        approvedVoiceTracks,
        colorWorkItems,
        approvedHardCutTransitions: input.approvedHardCutTransitions,
        finalBudgetIndex,
        budgets,
        output,
        finalArtifactType: CANONICAL_PRIVATE_LONG_FORM_FINAL_ARTIFACT_TYPE,
        finalLineage: {
          segmentIds,
          timingIds: [timingId, ...transitionTimingIds],
          rendererLayerIds: [
            'source-video-layer',
            ...transitionRendererLayerIds,
            ...colorRendererLayerIds,
            ...voiceRendererLayerIds,
            ...captionRendererLayerIds,
          ],
        },
      })
    : []

  return {
    schemaVersion: CANONICAL_PRIVATE_PLAN_SCHEMA_VERSION,
    components: input.components,
    estimate,
    workItems: [
      {
        workItemKey: 'snapshot-validation', workItemType: 'validate_approved_snapshot', workerClass: 'authority_worker',
        executionInput: { operation: 'validate_snapshot_manifest' }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
        expectedOutputs: [output('snapshot-validation-evidence', 'authority_validation_evidence', 'qa', 'application/json')],
        dependencyKeys: [], approvedToolIds: [], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1,
        attemptTimeoutSeconds: 60, scheduledDelaySeconds: 0, maximumCreditBudget: budgets[0], required: true,
      },
      {
        workItemKey: 'source-trim-validation', workItemType: 'prepare_source_trim', workerClass: 'authority_worker',
        executionInput: { operation: 'validate_approved_source_trim_plan' },
        sourceSequenceItemIds: sourceIds, sourceCleanupDecisionIds: cleanupIds,
        expectedOutputs: [output(
          'source-trim-validation-evidence',
          'source_trim_validation_evidence',
          'qa',
          'application/json',
          { segmentIds, timingIds: [timingId] },
        )],
        dependencyKeys: ['snapshot-validation'], approvedToolIds: [], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1,
        attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0, maximumCreditBudget: budgets[1], required: true,
      },
      ...captionWorkItems,
      ...voiceWorkItems,
      ...colorWorkItems,
      ...(approvedLongFormChunkPlan ? longFormRenderWorkItems : [{
        workItemKey: 'final-export', workItemType: 'render_final_export', workerClass: 'render_worker',
        executionInput: {
          operation: sourceSequenceComposition
            ? captionTrackComposition
              ? 'render_approved_source_sequence_caption_track_final'
              : 'render_approved_source_sequence_caption_final'
            : captionTrackComposition
              ? 'render_approved_source_caption_track_final'
              : 'render_approved_source_caption_final',
          approvedToolOperationIds: [REMOTION_OPERATION],
          expectedOutputKeys: ['final-export'], structuredPayload: {
            ...(sourceSequenceComposition
              ? {
                  compositionProfileId: captionTrackComposition
                    ? 'approved_source_sequence_caption_track_final_v1'
                    : 'approved_source_sequence_caption_final_v1',
                  sourceSegments: compositionSourceTimeline,
                  transitionPolicy: 'approved_hard_cuts_only',
                  hardCutTransitions: input.approvedHardCutTransitions,
                  audioPolicy: replaceSourceAudio
                    ? 'replace_with_approved_voice_tracks'
                    : 'preserve_source_sequence',
                }
              : {
                  compositionProfileId: captionTrackComposition
                    ? 'approved_source_caption_track_final_v1'
                    : 'approved_source_caption_final_v1',
                  sourceStartFrame: colorWorkItems.length > 0
                    ? 0
                    : input.cleanupDecisions[0]!.startFrame,
                  sourceEndFrameExclusive: colorWorkItems.length > 0
                    ? colorDeliverySources[0]!.durationFrames
                    : input.cleanupDecisions[0]!.endFrameExclusive,
                  audioPolicy: replaceSourceAudio
                    ? 'replace_with_approved_voice_tracks'
                    : 'preserve_source',
                }),
            width: input.frame.width, height: input.frame.height,
            fps: input.fps, durationFrames: input.totalFrames, sourceFit: 'contain',
            panelBackground,
            renderPurpose: 'private_4k_delivery_master_v1',
            deliveryProfileId: 'uhd_2160',
            estimateCostBasisProfileId: 'uhd_2160',
            sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
            usesApprovedEditReservation: true,
            requiresSeparateExportEstimate: false,
            allowsAdditionalExportCharge: false,
            captionOverlayPolicy: captionTrackComposition
              ? 'approved_timed_full_frame_rgba_track'
              : 'approved_full_frame_rgba',
            ...(colorWorkItems.length > 0
              ? { sourceMediaPolicy: 'approved_professional_color_intermediate_v1' }
              : {}),
            ...(captionTrackComposition
              ? {
                  captionOverlayCues: captionCues.map((cue, index) => ({
                    outputKey: captionOutputKeys[index]!,
                    startFrame: cue.startFrame,
                    endFrameExclusive: cue.endFrameExclusive,
                  })),
                }
              : {}),
            ...(replaceSourceAudio ? { voiceTracks: approvedVoiceTracks } : {}),
          },
        },
        sourceSequenceItemIds: sourceIds, sourceCleanupDecisionIds: cleanupIds,
        expectedOutputs: [output(
          'final-export',
          finalArtifactType,
          'final',
          'video/mp4',
          {
            segmentIds,
            timingIds: [timingId, ...transitionTimingIds],
            rendererLayerIds: [
              'source-video-layer',
              ...transitionRendererLayerIds,
              ...colorRendererLayerIds,
              ...voiceRendererLayerIds,
              ...captionRendererLayerIds,
            ],
          },
        )],
        dependencyKeys: [
          'source-trim-validation',
          ...captionDependencyKeys,
          ...voiceDependencyKeys,
          ...colorDependencyKeys,
        ], approvedToolIds: ['remotion'], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 2,
        attemptTimeoutSeconds: 1_800, scheduledDelaySeconds: 0, maximumCreditBudget: budgets[finalBudgetIndex]!, required: true,
      }]),
      {
        workItemKey: 'final-qa', workItemType: 'run_final_qa', workerClass: 'qa_worker',
        executionInput: {
          operation: 'inspect_final_artifact', approvedToolOperationIds: [FFPROBE_OPERATION],
          expectedOutputKeys: ['final-qa-report'], structuredPayload: {
            inspectionProfileId: 'final_export_v1', countFrames: true, verifyDurationAndSync: true, emitMachineJsonOnly: true,
          },
        },
        sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
        expectedOutputs: [output(
          'final-qa-report',
          'final_qa_report',
          'qa',
          'application/json',
          {
            segmentIds,
            timingIds: [timingId, ...transitionTimingIds],
            rendererLayerIds: [
              'source-video-layer',
              ...transitionRendererLayerIds,
              ...colorRendererLayerIds,
              ...voiceRendererLayerIds,
              ...captionRendererLayerIds,
            ],
          },
        )],
        dependencyKeys: ['final-export'], approvedToolIds: ['ffprobe'], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 2,
        attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0,
        maximumCreditBudget: budgets[
          finalBudgetIndex + (approvedLongFormChunkPlan ? approvedLongFormChunkPlan.chunkCount + 1 : 1)
        ]!, required: true,
      },
    ] as CanonicalWorkItemDraft[],
  }
}

function buildLongFormRenderWorkItems(input: {
  chunkPlan: CanonicalPrivateLongFormChunkPlan
  frame: { width: number; height: number }
  fps: 24 | 30
  totalFrames: number
  panelBackground: string
  timingId: string
  components: CanonicalPlanComponentsDraft
  cleanupDecisions: CanonicalSourceCleanupDecisionDraft[]
  captionCues: Array<{
    timingId: string
    caption: string
    startFrame: number
    endFrameExclusive: number
  }>
  captionWorkItems: CanonicalWorkItemDraft[]
  captionOutputKeys: string[]
  voiceWorkItems: CanonicalWorkItemDraft[]
  approvedVoiceTracks: Array<{
    sourceSequenceItemId: string
    outputKey: string
    durationFrames: number
  }>
  colorWorkItems: CanonicalWorkItemDraft[]
  approvedHardCutTransitions: ApprovedHardCutTransition[]
  finalBudgetIndex: number
  budgets: number[]
  output: (
    outputKey: string,
    artifactType: string,
    assetRole: CanonicalExpectedOutputDraft['assetRole'],
    contentType: string,
    lineage?: {
      segmentIds?: string[]
      timingIds?: string[]
      rendererLayerIds?: string[]
    },
  ) => CanonicalExpectedOutputDraft
  finalArtifactType: string
  finalLineage: {
    segmentIds: string[]
    timingIds: string[]
    rendererLayerIds: string[]
  }
}): CanonicalWorkItemDraft[] {
  const mezzanineFinalizationProfile = input.chunkPlan.profileId ===
    CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID
  const sourceSliceProfile = mezzanineFinalizationProfile ||
    input.chunkPlan.profileId ===
      CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID
  if (
    sourceSliceProfile &&
    (input.voiceWorkItems.length > 0 || input.colorWorkItems.length > 0)
  ) {
    throw new Error(
      'Source-slice compilation cannot execute planned audio/color processing without continuity evidence.',
    )
  }
  const sourceIndexById = new Map(
    input.cleanupDecisions.map((decision, index) => [decision.sourceSequenceItemId, index]),
  )
  const chunkWorkItems = input.chunkPlan.chunks.map((chunk, chunkOffset): CanonicalWorkItemDraft => {
    const sourceIndices = chunk.sourceSegments.map((segment) => {
      const index = sourceIndexById.get(segment.sourceSequenceItemId)
      if (index === undefined) throw new Error('Long-form chunk lost approved source order.')
      return index
    })
    const sourceIds = sourceIndices.map((index) =>
      input.cleanupDecisions[index]!.sourceSequenceItemId)
    const cleanupIds = sourceIndices.map((index) => input.cleanupDecisions[index]!.decisionId)
    const sourceIdSet = new Set(sourceIds)
    const chunkCaptionEntries = input.captionCues.flatMap((cue, captionIndex) => {
      const startFrame = Math.max(cue.startFrame, chunk.globalStartFrame)
      const endFrameExclusive = Math.min(cue.endFrameExclusive, chunk.globalEndFrameExclusive)
      if (endFrameExclusive <= startFrame) return []
      return [{
        captionIndex,
        outputKey: input.captionOutputKeys[captionIndex]!,
        timingId: cue.timingId,
        startFrame: startFrame - chunk.globalStartFrame,
        endFrameExclusive: endFrameExclusive - chunk.globalStartFrame,
      }]
    })
    if (chunkCaptionEntries.length < 1 || chunkCaptionEntries.length > 7) {
      throw new Error('Every long-form chunk requires one through seven exact caption cues.')
    }
    const chunkTransitions = input.approvedHardCutTransitions
      .filter((transition) =>
        sourceIdSet.has(transition.fromSourceSequenceItemId) &&
        sourceIdSet.has(transition.toSourceSequenceItemId) &&
        transition.boundaryFrame > chunk.globalStartFrame &&
        transition.boundaryFrame < chunk.globalEndFrameExclusive)
      .map((transition) => ({
        ...transition,
        boundaryFrame: transition.boundaryFrame - chunk.globalStartFrame,
      }))
    if (chunkTransitions.length !== Math.max(0, sourceIds.length - 1)) {
      throw new Error('Long-form chunk lost its approved hard-cut authority.')
    }
    const sourceSegments = chunk.sourceSegments.map((segment) => {
      return {
        sourceSequenceItemId: segment.sourceSequenceItemId,
        sourceStartFrame: segment.sourceStartFrame,
        sourceEndFrameExclusive: segment.sourceEndFrameExclusive,
        timelineStartFrame: segment.timelineStartFrame,
        timelineEndFrameExclusive: segment.timelineEndFrameExclusive,
      }
    })
    const voiceTracks = input.approvedVoiceTracks.filter((track) =>
      sourceIdSet.has(track.sourceSequenceItemId))
    const voiceDependencyKeys = sourceIndices.flatMap((sourceIndex) => {
      const item = input.voiceWorkItems[sourceIndex]
      return item ? [item.workItemKey] : []
    })
    const colorDependencyKeys = sourceIndices.flatMap((sourceIndex) => {
      const item = input.colorWorkItems[sourceIndex]
      return item ? [item.workItemKey] : []
    })
    if (
      (input.voiceWorkItems.length > 0 && voiceTracks.length !== sourceIds.length) ||
      (input.colorWorkItems.length > 0 && colorDependencyKeys.length !== sourceIds.length)
    ) throw new Error('Long-form chunk lost source-bound voice or color authority.')
    const segmentIds = input.components.segments
      .filter((segment) =>
        segment.startFrame < chunk.globalEndFrameExclusive &&
        segment.endFrameExclusive > chunk.globalStartFrame)
      .map((segment) => segment.segmentId)
    const rendererLayerIds = [
      'source-video-layer',
      ...chunkTransitions.map((_transition, index) =>
        `approved-hard-cut-boundary-${sourceIndices[0]! + index + 1}`),
      ...sourceIndices.flatMap((sourceIndex) => [
        ...(input.colorWorkItems[sourceIndex]?.expectedOutputs[0]?.rendererLayerIds ?? []),
        ...(input.voiceWorkItems[sourceIndex]?.expectedOutputs[0]?.rendererLayerIds ?? []),
      ]),
      ...chunkCaptionEntries.flatMap(({ captionIndex }) =>
        input.captionWorkItems[captionIndex]?.expectedOutputs[0]?.rendererLayerIds ?? []),
    ]
    const sequence = sourceIds.length > 1
    const structuredPayload = {
      ...(sequence
        ? {
            compositionProfileId: 'approved_source_sequence_caption_track_final_v1',
            sourceSegments,
            transitionPolicy: 'approved_hard_cuts_only',
            hardCutTransitions: chunkTransitions,
            audioPolicy: voiceTracks.length > 0
              ? 'replace_with_approved_voice_tracks'
              : 'preserve_source_sequence',
          }
        : {
            compositionProfileId: 'approved_source_caption_track_final_v1',
            sourceStartFrame: sourceSegments[0]!.sourceStartFrame,
            sourceEndFrameExclusive: sourceSegments[0]!.sourceEndFrameExclusive,
            audioPolicy: voiceTracks.length > 0
              ? 'replace_with_approved_voice_tracks'
              : 'preserve_source',
          }),
      width: input.frame.width,
      height: input.frame.height,
      fps: input.fps,
      durationFrames: chunk.durationFrames,
      sourceFit: 'contain',
      panelBackground: input.panelBackground,
      renderPurpose: 'private_4k_delivery_master_v1',
      deliveryProfileId: 'uhd_2160',
      estimateCostBasisProfileId: 'uhd_2160',
      sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
      usesApprovedEditReservation: true,
      requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false,
      captionOverlayPolicy: 'approved_timed_full_frame_rgba_track',
      captionOverlayCues: chunkCaptionEntries.map((cue) => ({
        outputKey: cue.outputKey,
        startFrame: cue.startFrame,
        endFrameExclusive: cue.endFrameExclusive,
      })),
      ...(input.colorWorkItems.length > 0
        ? { sourceMediaPolicy: 'approved_professional_color_intermediate_v1' }
        : {}),
      ...(voiceTracks.length > 0 ? { voiceTracks } : {}),
    }
    return {
      workItemKey: `composition-chunk-${chunk.chunkIndex}`,
      workItemType: 'custom',
      workerClass: 'render_worker',
      executionInput: {
        operation: 'render_approved_4k_composition_chunk',
        approvedToolOperationIds: [REMOTION_OPERATION],
        expectedOutputKeys: [chunk.outputKey],
        chunkAuthority: {
          profileId: input.chunkPlan.profileId,
          chunkIndex: chunk.chunkIndex,
          chunkCount: chunk.chunkCount,
          globalStartFrame: chunk.globalStartFrame,
          globalEndFrameExclusive: chunk.globalEndFrameExclusive,
          durationFrames: chunk.durationFrames,
          outputKey: chunk.outputKey,
          ...(sourceSliceProfile
            ? {
                sourceSliceKey: chunk.sourceSegments[0]!.sourceSliceKey,
                sourceStartFrame: chunk.sourceSegments[0]!.sourceStartFrame,
                sourceEndFrameExclusive:
                  chunk.sourceSegments[0]!.sourceEndFrameExclusive,
              }
            : {}),
        },
        structuredPayload,
      },
      sourceSequenceItemIds: sourceIds,
      sourceCleanupDecisionIds: cleanupIds,
      expectedOutputs: [input.output(
        chunk.outputKey,
        'private_4k_composition_chunk_v1',
        'processed',
        'video/mp4',
        {
          segmentIds,
          timingIds: [
            input.timingId,
            ...chunkTransitions.flatMap((transition) => [
              transition.transitionTimingItemId,
              transition.refinedTransitionTimingItemId,
            ]),
            ...chunkCaptionEntries.map((cue) => cue.timingId),
          ],
          rendererLayerIds: unique(rendererLayerIds),
        },
      )],
      dependencyKeys: [
        'source-trim-validation',
        ...chunkCaptionEntries.map(({ captionIndex }) =>
          input.captionWorkItems[captionIndex]!.workItemKey),
        ...voiceDependencyKeys,
        ...colorDependencyKeys,
      ],
      approvedToolIds: ['remotion'],
      providerExecutionMode: 'none',
      fallbackPolicy: {},
      maxAttempts: 2,
      attemptTimeoutSeconds: 1_800,
      scheduledDelaySeconds: 0,
      maximumCreditBudget: input.budgets[input.finalBudgetIndex + chunkOffset]!,
      required: true,
    }
  })

  const chunkBoundaryTransitions = sourceSliceProfile
    ? []
    : input.chunkPlan.chunks.slice(0, -1).map((chunk) => {
        const transition = input.approvedHardCutTransitions.find((candidate) =>
          candidate.boundaryFrame === chunk.globalEndFrameExclusive)
        if (!transition) {
          throw new Error('Long-form final merge lost a chunk-boundary hard cut.')
        }
        return {
          transitionTimingItemId: transition.transitionTimingItemId,
          refinedTransitionTimingItemId: transition.refinedTransitionTimingItemId,
          fromSourceSequenceItemId: transition.fromSourceSequenceItemId,
          toSourceSequenceItemId: transition.toSourceSequenceItemId,
          boundaryFrame: transition.boundaryFrame,
        }
      })
  const chunkBoundaryContinuity = sourceSliceProfile
    ? input.chunkPlan.chunks.slice(0, -1).map((chunk, index) => {
        const fromSlice = chunk.sourceSegments.at(-1)!
        const toSlice = input.chunkPlan.chunks[index + 1]!.sourceSegments[0]!
        const sourceIndex = sourceIndexById.get(fromSlice.sourceSequenceItemId)
        if (
          sourceIndex === undefined ||
          fromSlice.sourceSequenceItemId !== toSlice.sourceSequenceItemId ||
          fromSlice.sourceEndFrameExclusive !== toSlice.sourceStartFrame ||
          fromSlice.sourceSliceIndex !== index + 1 ||
          toSlice.sourceSliceIndex !== index + 2 ||
          fromSlice.sourceSliceCount !== input.chunkPlan.chunkCount ||
          toSlice.sourceSliceCount !== input.chunkPlan.chunkCount ||
          !fromSlice.sourceSliceKey || !toSlice.sourceSliceKey
        ) throw new Error('Long-form source-slice continuity authority diverged.')
        return {
          sourceSequenceItemId: fromSlice.sourceSequenceItemId,
          sourceCleanupDecisionId: input.cleanupDecisions[sourceIndex]!.decisionId,
          boundaryFrame: chunk.globalEndFrameExclusive,
          previousSourceEndFrameExclusive: fromSlice.sourceEndFrameExclusive,
          nextSourceStartFrame: toSlice.sourceStartFrame,
          fromSourceSliceKey: fromSlice.sourceSliceKey,
          toSourceSliceKey: toSlice.sourceSliceKey,
        }
      })
    : []
  const finalizerSource = mezzanineFinalizationProfile
    ? input.chunkPlan.chunks[0]?.sourceSegments[0]
    : undefined
  const finalizerCleanup = finalizerSource
    ? input.cleanupDecisions[sourceIndexById.get(finalizerSource.sourceSequenceItemId)!]
    : undefined
  if (
    mezzanineFinalizationProfile &&
    (!finalizerSource || !finalizerCleanup || input.cleanupDecisions.length !== 1 ||
      finalizerSource.sourceStartFrame !== finalizerCleanup.startFrame ||
      input.chunkPlan.chunks.at(-1)?.sourceSegments[0]?.sourceEndFrameExclusive !==
        finalizerCleanup.endFrameExclusive)
  ) throw new Error(
    'Mezzanine finalization lost its exact approved source cleanup authority.',
  )
  const finalMerge: CanonicalWorkItemDraft = {
    workItemKey: 'final-export',
    workItemType: 'render_final_export',
    workerClass: 'render_worker',
    executionInput: {
      operation: mezzanineFinalizationProfile
        ? 'finalize_approved_4k_mezzanine_chunks'
        : 'merge_approved_4k_composition_chunks',
      approvedToolOperationIds: [
        mezzanineFinalizationProfile ? FFMPEG_OPERATION : REMOTION_OPERATION,
      ],
      expectedOutputKeys: ['final-export'],
      structuredPayload: mezzanineFinalizationProfile ? {
        recipeProfileId: 'approved_4k_source_slice_mezzanine_finalize_v1',
        capacityProfileId: input.chunkPlan.profileId,
        width: input.frame.width,
        height: input.frame.height,
        fps: input.fps,
        durationFrames: input.totalFrames,
        sourceSequenceItemId: finalizerSource!.sourceSequenceItemId,
        sourceCleanupDecisionId: finalizerCleanup!.decisionId,
        sourceStartFrame: finalizerCleanup!.startFrame,
        sourceEndFrameExclusive: finalizerCleanup!.endFrameExclusive,
        chunks: input.chunkPlan.chunks.map((chunk) => {
          const sourceSlice = chunk.sourceSegments[0]
          if (chunk.sourceSegments.length !== 1 || !sourceSlice?.sourceSliceKey) {
            throw new Error('Mezzanine finalization lost exact source-slice lineage.')
          }
          return {
            outputKey: chunk.outputKey,
            chunkIndex: chunk.chunkIndex,
            chunkCount: chunk.chunkCount,
            globalStartFrame: chunk.globalStartFrame,
            globalEndFrameExclusive: chunk.globalEndFrameExclusive,
            durationFrames: chunk.durationFrames,
            sourceSliceKey: sourceSlice.sourceSliceKey,
            sourceStartFrame: sourceSlice.sourceStartFrame,
            sourceEndFrameExclusive: sourceSlice.sourceEndFrameExclusive,
          }
        }),
        chunkBoundaryContinuity: chunkBoundaryContinuity.map((continuity) => ({
          boundaryFrame: continuity.boundaryFrame,
          previousSourceEndFrameExclusive:
            continuity.previousSourceEndFrameExclusive,
          nextSourceStartFrame: continuity.nextSourceStartFrame,
          fromSourceSliceKey: continuity.fromSourceSliceKey,
          toSourceSliceKey: continuity.toSourceSliceKey,
        })),
        videoFinalizationPolicy: 'compatible_h264_stream_copy_v1',
        audioFinalizationPolicy: 'single_approved_source_audio_encode_v1',
        codecCompatibilityPolicy: 'exact_h264_extradata_timebase_frame_color_v1',
        timestampPolicy: 'normalize_from_zero',
        outputContainer: 'mp4',
        outputVideoCodec: 'copy_h264',
        outputAudioCodec: 'aac_lc',
        audioSampleRate: 48_000,
        audioChannels: 2,
        audioBitrateKbps: 192,
        renderPurpose: 'private_4k_delivery_master_v1',
        deliveryProfileId: 'uhd_2160',
        estimateCostBasisProfileId: 'uhd_2160',
        sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
        usesApprovedEditReservation: true,
        requiresSeparateExportEstimate: false,
        allowsAdditionalExportCharge: false,
      } : {
        compositionProfileId: LONG_FORM_MERGE_COMPOSITION_PROFILE,
        longFormCapacityProfileId: input.chunkPlan.profileId,
        width: input.frame.width,
        height: input.frame.height,
        fps: input.fps,
        durationFrames: input.totalFrames,
        chunks: input.chunkPlan.chunks.map((chunk) => {
          const sourceSlice = chunk.sourceSegments[0]
          if (
            sourceSliceProfile &&
            (chunk.sourceSegments.length !== 1 || !sourceSlice?.sourceSliceKey)
          ) throw new Error('Long-form merge lost exact source-slice lineage.')
          return {
            outputKey: chunk.outputKey,
            chunkIndex: chunk.chunkIndex,
            chunkCount: chunk.chunkCount,
            globalStartFrame: chunk.globalStartFrame,
            globalEndFrameExclusive: chunk.globalEndFrameExclusive,
            durationFrames: chunk.durationFrames,
            sourceSequenceItemIds: chunk.sourceSegments.map((segment) =>
              segment.sourceSequenceItemId),
            sourceCleanupDecisionIds: chunk.sourceSegments.map((segment) =>
              input.cleanupDecisions[sourceIndexById.get(segment.sourceSequenceItemId)!]!.decisionId),
            ...(sourceSliceProfile
              ? {
                  sourceSliceKey: sourceSlice!.sourceSliceKey!,
                  sourceStartFrame: sourceSlice!.sourceStartFrame,
                  sourceEndFrameExclusive: sourceSlice!.sourceEndFrameExclusive,
                }
              : {}),
          }
        }),
        mergePolicy: sourceSliceProfile
          ? 'approved_contiguous_source_slice_4k_chunks_v2'
          : 'approved_contiguous_4k_chunks_v1',
        transitionPolicy: sourceSliceProfile
          ? 'continuous_approved_source_slices_only'
          : 'approved_hard_cuts_only',
        chunkBoundaryTransitions,
        ...(sourceSliceProfile ? { chunkBoundaryContinuity } : {}),
        audioPolicy: 'preserve_approved_chunk_audio',
        frameContinuityPolicy: sourceSliceProfile
          ? 'exact_integer_frame_and_source_slice_boundaries_v2'
          : 'exact_integer_frame_boundaries_v1',
        renderPurpose: 'private_4k_delivery_master_v1',
        deliveryProfileId: 'uhd_2160',
        estimateCostBasisProfileId: 'uhd_2160',
        sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
        usesApprovedEditReservation: true,
        requiresSeparateExportEstimate: false,
        allowsAdditionalExportCharge: false,
      },
    },
    sourceSequenceItemIds: input.cleanupDecisions.map((decision) =>
      decision.sourceSequenceItemId),
    sourceCleanupDecisionIds: input.cleanupDecisions.map((decision) => decision.decisionId),
    expectedOutputs: [input.output(
      'final-export',
      input.finalArtifactType,
      'final',
      'video/mp4',
      input.finalLineage,
    )],
    dependencyKeys: [
      ...(mezzanineFinalizationProfile ? ['source-trim-validation'] : []),
      ...chunkWorkItems.map((item) => item.workItemKey),
    ],
    approvedToolIds: [mezzanineFinalizationProfile ? 'ffmpeg' : 'remotion'],
    providerExecutionMode: 'none',
    fallbackPolicy: {},
    maxAttempts: 2,
    attemptTimeoutSeconds: mezzanineFinalizationProfile ? 1_800 : 3_600,
    scheduledDelaySeconds: 0,
    maximumCreditBudget:
      input.budgets[input.finalBudgetIndex + input.chunkPlan.chunkCount]!,
    required: true,
  }
  return [...chunkWorkItems, finalMerge]
}

function buildEstimate(plan: EditPlan):
  | { ok: true; estimate: CanonicalPlanDraft['estimate'] }
  | { ok: false; blocker: string } {
  const expectedTotal = Math.max(1, Math.round(plan.creditEstimate.total))
  const fallbackAllowanceCredits = Math.max(0, Math.round(plan.creditEstimate.fallbackAllowanceCredits ?? 0))
  const fallbackLineIndexes = plan.creditEstimate.breakdown
    .map((item, index) => /fallback allowance$/i.test(item.label.trim()) ? index : -1)
    .filter((index) => index >= 0)
  const fallbackLine = fallbackLineIndexes.length === 1
    ? plan.creditEstimate.breakdown[fallbackLineIndexes[0]!]
    : undefined

  if (
    fallbackAllowanceCredits >= expectedTotal ||
    (fallbackAllowanceCredits > 0 && (
      !fallbackLine ||
      Math.max(0, Math.round(fallbackLine.credits)) !== fallbackAllowanceCredits
    )) ||
    (fallbackAllowanceCredits === 0 && fallbackLineIndexes.length > 0)
  ) {
    return {
      ok: false,
      blocker: 'The shown credit total and fallback allowance do not reconcile. Refresh the plan before approval.',
    }
  }

  const fallbackIndexSet = new Set(fallbackLineIndexes)
  const lineItems = plan.creditEstimate.breakdown
    .filter((_, index) => !fallbackIndexSet.has(index))
    .map((item, index) => ({
      lineKey: safeKey(`${index + 1}-${item.label}`, `estimate-${index + 1}`),
      label: boundedText(item.label, `Estimate item ${index + 1}`, 160),
      category: index === 0 ? 'planning' : 'editing',
      estimatedCredits: Math.max(0, Math.round(item.credits)),
      removable: false,
      metadata: { reason: boundedText(item.reason, 'Included in the reviewed plan.', 1_000) },
    }))
  const itemTotal = lineItems.reduce((sum, item) => sum + item.estimatedCredits, 0)
  const expectedItemTotal = expectedTotal - fallbackAllowanceCredits
  if (itemTotal > expectedItemTotal) {
    return {
      ok: false,
      blocker: 'The itemized credit estimate exceeds the total shown for approval. Refresh the plan before approval.',
    }
  }
  if (itemTotal < expectedItemTotal) {
    lineItems.push({
      lineKey: 'estimate-remainder', label: 'Remaining approved edit work', category: 'editing',
      estimatedCredits: expectedItemTotal - itemTotal, removable: false, metadata: { reason: 'Keeps the canonical estimate equal to the reviewed total.' },
    })
  }
  const normalizedLineItems = lineItems.length > 0 ? lineItems : [{
    lineKey: 'edit-work', label: 'Approved edit work', category: 'editing', estimatedCredits: expectedItemTotal,
    removable: false, metadata: {},
  }]
  const approvedMaximumCredits = normalizedLineItems.reduce((sum, item) => sum + item.estimatedCredits, 0) + fallbackAllowanceCredits
  if (approvedMaximumCredits !== expectedTotal) {
    return {
      ok: false,
      blocker: 'The canonical credit maximum does not match the total shown for approval. Refresh the plan before approval.',
    }
  }
  return {
    ok: true,
    estimate: {
      lineItems: normalizedLineItems,
      fallbackAllowanceCredits,
      validForSeconds: 3_600,
    },
  }
}

function fitBudgets(
  maximumCredits: number,
  captionCueCount: number,
  voiceTrackCount: number,
  colorSourceCount: number,
  remotionStageCount = 1,
): number[] {
  const remotionBudgets = remotionStageCount === 1
    ? [4]
    : [
        ...Array.from({ length: remotionStageCount - 1 }, () => 2),
        4,
      ]
  const defaults = [
    1,
    3,
    ...Array.from({ length: captionCueCount }, () => 1),
    ...Array.from({ length: voiceTrackCount }, () => 2),
    ...Array.from({ length: colorSourceCount }, () => 2),
    ...remotionBudgets,
    2,
  ]
  if (maximumCredits >= defaults.reduce((sum, budget) => sum + budget, 0)) return defaults
  const budgets = Array.from({ length: defaults.length }, () => 0)
  for (let index = 0; index < Math.max(0, maximumCredits); index += 1) budgets[index % budgets.length] += 1
  return budgets
}

function buildOrderedSourceTimeline(
  sourceItems: CanonicalSourceAuthorityItem[],
  cleanupDecisions: CanonicalSourceCleanupDecisionDraft[],
): Array<{
  sourceSequenceItemId: string
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  timelineStartFrame: number
  timelineEndFrameExclusive: number
}> | null {
  if (
    sourceItems.length < 1 || sourceItems.length > 8 ||
    cleanupDecisions.length !== sourceItems.length
  ) return null
  let timelineStartFrame = 0
  const segments = sourceItems.flatMap((sourceItem, index) => {
    const decision = cleanupDecisions[index]
    if (
      !decision || decision.sourceSequenceItemId !== sourceItem.sourceSequenceItemId ||
      decision.endFrameExclusive <= decision.startFrame
    ) return []
    const duration = decision.endFrameExclusive - decision.startFrame
    const segment = {
      sourceSequenceItemId: sourceItem.sourceSequenceItemId,
      sourceStartFrame: decision.startFrame,
      sourceEndFrameExclusive: decision.endFrameExclusive,
      timelineStartFrame,
      timelineEndFrameExclusive: timelineStartFrame + duration,
    }
    timelineStartFrame += duration
    return [segment]
  })
  return segments.length === sourceItems.length ? segments : null
}

function cleanupRange(
  decision: TrimDecisionItem | undefined,
  asset: ApprovedEditExecutionUploadedMediaSourceAssetClientInput | undefined,
  fps: number,
): { startFrame: number; endFrameExclusive: number } | null {
  const record = decision as unknown as Record<string, unknown> | undefined
  const selectedRange = isRecord(record?.selectedRange) ? record.selectedRange : undefined
  const sourceRange = isRecord(record?.sourceRange) ? record.sourceRange : undefined
  const range = selectedRange ?? sourceRange
  const startFrame = integerValue(range?.startFrame) ?? secondsFrame(range?.startSeconds, fps) ?? 0
  const endFrameExclusive = integerValue(range?.endFrameExclusive) ?? integerValue(range?.endFrame) ??
    secondsFrame(range?.endSeconds, fps) ?? durationFrames(asset?.sourceMetadata?.durationSeconds, fps)
  if (endFrameExclusive === undefined || !Number.isInteger(startFrame) || !Number.isInteger(endFrameExclusive) || startFrame < 0 || endFrameExclusive <= startFrame) return null
  return { startFrame, endFrameExclusive }
}

function canonicalCleanupAction(value: TrimDecisionItem['decision'] | undefined): CanonicalSourceCleanupDecisionDraft['action'] {
  if (value && ['keep', 'cut', 'tighten', 'preserve', 'move_to_broll', 'use_as_voiceover', 'use_as_proof', 'use_as_alt_take'].includes(value)) {
    return value as CanonicalSourceCleanupDecisionDraft['action']
  }
  return 'preserve'
}

function canonicalFourKMasterFrame(
  aspectRatio: NonNullable<ProfessionalExportCreditCoverage['approvedAspectRatio']>,
): { width: number; height: number } {
  const frame = resolveProfessionalExportFrame(aspectRatio, 'uhd_2160')
  return { width: frame.width, height: frame.height }
}

function professionalCaptionLayout(frame: { width: number; height: number }): {
  fontSize: number
  marginV: number
} {
  const shortEdge = Math.min(frame.width, frame.height)
  return {
    fontSize: Math.max(72, Math.min(160, Math.round(shortEdge * 0.045))),
    marginV: Math.max(96, Math.min(360, Math.round(frame.height * 0.055))),
  }
}

function validatedCaption(value: string | undefined): string | null {
  if (!value || value.length > 120 || value !== value.trim() || !/^[\x20-\x7E]+$/.test(value)) return null
  if (/[{}\\[\]]/.test(value) || /(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\$\(|`|&&|\|\||#!)/i.test(value)) return null
  return value
}

function approvedCaptionCues(
  plan: EditPlan,
  totalFrames: number,
): Array<{
  timingId: string
  caption: string
  startFrame: number
  endFrameExclusive: number
}> | null {
  const timingItems = plan.masterTimingPlan?.captionTimingItems ?? []
  if (timingItems.length < 1 || timingItems.length > 7) return null
  const seenTimingIds = new Set<string>()
  let previousEndFrame = 0
  const cues = timingItems.flatMap((item, index) => {
    const caption = validatedCaption(item.captionText)
    const startFrame = item.timeRange.startFrame
    const endFrameExclusive = item.timeRange.endFrame
    const timingId = safeKey(item.id, `caption-timing-${index + 1}`)
    if (
      !caption || !Number.isInteger(startFrame) || !Number.isInteger(endFrameExclusive) ||
      startFrame < previousEndFrame || startFrame < 0 || endFrameExclusive <= startFrame ||
      endFrameExclusive > totalFrames || item.timeRange.durationFrames !== endFrameExclusive - startFrame ||
      seenTimingIds.has(timingId)
    ) return []
    previousEndFrame = endFrameExclusive
    seenTimingIds.add(timingId)
    return [{ timingId, caption, startFrame, endFrameExclusive }]
  })
  if (cues.length !== timingItems.length) return null
  if (
    cues.length === 1 &&
    (cues[0]!.startFrame !== 0 || cues[0]!.endFrameExclusive !== totalFrames)
  ) return null
  return cues
}

function buildApprovedHardCutTransitions(input: {
  plan: EditPlan
  sourceItems: CanonicalSourceAuthorityItem[]
  segments: CanonicalPlanComponentsDraft['segments']
  fps: number
  totalFrames: number
}): ApprovedHardCutTransition[] | null {
  const masterTransitions = input.plan.masterTimingPlan?.transitionTimingItems ?? []
  const refinedTransitions =
    input.plan.soundSyncTransitionTimingPlan?.refinedTransitionTimings ?? []
  const expectedCount = Math.max(0, input.sourceItems.length - 1)
  if (expectedCount === 0) {
    return masterTransitions.length === 0 && refinedTransitions.length === 0 ? [] : null
  }
  if (
    input.segments.length !== input.sourceItems.length ||
    masterTransitions.length !== expectedCount ||
    refinedTransitions.length !== expectedCount
  ) return null

  const refinedById = new Map(refinedTransitions.map((transition) => [transition.id, transition]))
  const transitionIds = new Set<string>()
  const refinedIds = new Set<string>()
  const approved = masterTransitions.flatMap((transition, index) => {
    const fromSegment = input.segments[index]
    const toSegment = input.segments[index + 1]
    const fromSource = input.sourceItems[index]
    const toSource = input.sourceItems[index + 1]
    const refinedId = transition.refinedTransitionTimingItemId
    const refined = refinedId ? refinedById.get(refinedId) : undefined
    const boundaryFrame = fromSegment?.endFrameExclusive
    if (
      !fromSegment || !toSegment || !fromSource || !toSource || !refined ||
      !safeIdentity(transition.id) || !safeIdentity(refined.id) ||
      transitionIds.has(transition.id) || refinedIds.has(refined.id) ||
      boundaryFrame !== toSegment.startFrame || boundaryFrame <= 0 ||
      boundaryFrame >= input.totalFrames ||
      transition.transitionType !== 'hard_cut' ||
      transition.fromSegmentId !== fromSegment.segmentId ||
      transition.toSegmentId !== toSegment.segmentId ||
      transition.timeRange.startFrame !== boundaryFrame ||
      transition.timeRange.endFrame !== boundaryFrame ||
      transition.timeRange.durationFrames !== 0 ||
      transition.timeRange.fps !== input.fps ||
      transition.sfxCueId !== undefined ||
      refined.transitionType !== 'hard_cut' ||
      refined.linkedMasterTransitionTimingItemId !== transition.id ||
      refined.fromSegmentId !== fromSegment.segmentId ||
      refined.toSegmentId !== toSegment.segmentId ||
      refined.timeRange.startFrame !== boundaryFrame ||
      refined.timeRange.endFrame !== boundaryFrame ||
      refined.timeRange.durationFrames !== 0 || refined.durationFrames !== 0 ||
      refined.timeRange.fps !== input.fps || !refined.phraseBoundaryAligned ||
      refined.riskLevel !== 'low' || refined.sfxCueId !== undefined ||
      refined.beatSnapDecision?.speechSafe !== true ||
      (input.plan.soundSyncTransitionTimingPlan?.refinedSfxTimings ?? []).some(
        (sfx) => sfx.linkedTransitionTimingItemId === refined.id,
      )
    ) return []
    transitionIds.add(transition.id)
    refinedIds.add(refined.id)
    return [{
      transitionTimingItemId: transition.id,
      refinedTransitionTimingItemId: refined.id,
      fromSegmentId: fromSegment.segmentId,
      toSegmentId: toSegment.segmentId,
      fromSourceSequenceItemId: fromSource.sourceSequenceItemId,
      toSourceSequenceItemId: toSource.sourceSequenceItemId,
      boundaryFrame,
    }]
  })
  return approved.length === expectedCount ? approved : null
}

function hasUnrepresentedSegmentOperations(
  plan: EditPlan,
  represented: { audioCleanupRepresented: boolean; colorWorkRepresented: boolean },
): boolean {
  const supported = new Set([
    'trim',
    'cut',
    'caption',
    'transition',
    'frame_layout',
    'renderer_layer',
    'qa_check',
  ])
  if (represented.audioCleanupRepresented) supported.add('audio_cleanup')
  if (represented.colorWorkRepresented) supported.add('color_grade')
  return (plan.segmentEditPlans ?? []).some((segment) =>
    segment.operations.some((operation) => !supported.has(operation.operationType)))
}

function hasUnrepresentedColorWork(
  plan: EditPlan,
  approvedColorDeliverySources: ApprovedColorDeliverySource[] | null,
): boolean {
  const color = plan.colorPipelinePlan
  const hasWork = Boolean(color && (
    color.projectOperations.length > 0 ||
    color.clipPlans.some((clip) => clip.correctionOperations.length > 0 || clip.lookOperations.length > 0) ||
    color.assetMatchPlans.some((asset) => asset.operations.length > 0)
  ))
  return hasWork && !approvedColorDeliverySources
}

const APPROVED_COLOR_OPERATION_KINDS: Readonly<Record<
  ApprovedColorDeliverySource['colorGradeStyle'],
  ApprovedColorOperationKind[]
>> = {
  clean_natural: [
    'contrast_curve',
    'exposure_correction',
    'highlight_recovery',
    'qa_histogram_check',
    'saturation',
    'white_balance',
  ],
  premium_clean: [
    'clarity',
    'contrast_curve',
    'exposure_correction',
    'highlight_recovery',
    'look_transform',
    'qa_histogram_check',
    'white_balance',
  ],
}

function withShotMatching(kinds: ApprovedColorOperationKind[]): ApprovedColorOperationKind[] {
  return [...new Set([...kinds, 'shot_matching' as const])].sort()
}

function buildApprovedColorDeliverySources(input: {
  plan: EditPlan
  plannerInput: PlannerInput
  sourceItems: CanonicalSourceAuthorityItem[]
  cleanupDecisions: CanonicalSourceCleanupDecisionDraft[]
}): ApprovedColorDeliverySource[] | null {
  const color = input.plan.colorPipelinePlan
  if (!color) return null
  const sourceCount = input.plannerInput.clips.length
  const multiSource = sourceCount >= 2 && sourceCount <= 8
  if (
    input.plannerInput.editLevel === 'premium' ||
    (sourceCount !== 1 && !multiSource) || input.sourceItems.length !== sourceCount ||
    input.cleanupDecisions.length !== sourceCount || color.clipPlans.length !== sourceCount ||
    color.assetMatchPlans.length !== 0 || color.status !== 'planned' ||
    (color.colorGradeStyle !== 'clean_natural' && color.colorGradeStyle !== 'premium_clean') ||
    (color.intensity !== 'subtle' && color.intensity !== 'balanced') ||
    !color.toolsPlanned.includes('ffmpeg') ||
    color.toolsPlanned.some((toolId) =>
      !['planning_only', 'remotion_preview', 'ffmpeg'].includes(toolId)) ||
    (multiSource
      ? !color.stages.includes('shot_matching')
      : color.stages.includes('shot_matching'))
  ) return null

  const baselineKinds = APPROVED_COLOR_OPERATION_KINDS[color.colorGradeStyle]
  const expectedProjectKinds = multiSource ? withShotMatching(baselineKinds) : baselineKinds
  const expectedClipKinds = multiSource
    ? withShotMatching(baselineKinds.filter((kind) => kind !== 'qa_histogram_check'))
    : baselineKinds.filter((kind) => kind !== 'qa_histogram_check')
  const projectKinds = [...new Set(color.projectOperations.map((operation) => operation.operation))]
    .sort() as ApprovedColorOperationKind[]
  const clipOperations = color.clipPlans.map((clipPlan) => [
    ...clipPlan.correctionOperations,
    ...clipPlan.lookOperations,
  ])
  const allOperations = [...color.projectOperations, ...clipOperations.flat()]
  const operationIds = allOperations.map((operation) => operation.id).sort()

  if (
    projectKinds.join('|') !== expectedProjectKinds.join('|') ||
    color.projectOperations.length !== expectedProjectKinds.length ||
    color.clipPlans.some((clipPlan, index) => {
      const sourceItem = input.sourceItems[index]!
      const cleanup = input.cleanupDecisions[index]!
      const kinds = [...new Set(clipOperations[index]!.map((operation) => operation.operation))]
        .sort() as ApprovedColorOperationKind[]
      return clipPlan.clipId !== input.plannerInput.clips[index]!.id ||
        cleanup.sourceSequenceItemId !== sourceItem.sourceSequenceItemId ||
        clipPlan.skinToneProtection ||
        (multiSource
          ? clipPlan.referenceClipId !== (index === 0
              ? undefined
              : input.plannerInput.clips[0]!.id)
          : clipPlan.referenceClipId !== undefined) ||
        kinds.join('|') !== expectedClipKinds.join('|') ||
        clipOperations[index]!.length !== expectedClipKinds.length
    }) ||
    new Set(operationIds).size !== operationIds.length ||
    allOperations.some((operation) =>
      !safeIdentity(operation.id) || operation.toolId !== 'ffmpeg' ||
      operation.intensity !== color.intensity || operation.status !== 'future_worker' ||
      operation.settings.colorGradeStyle !== color.colorGradeStyle ||
      operation.settings.lookIntensity !== color.intensity)
  ) return null

  const projectBaselineOperations = color.projectOperations.filter((operation) =>
    operation.operation !== 'shot_matching')
  const shotMatchingOperations = allOperations.filter((operation) =>
    operation.operation === 'shot_matching')
  const referenceSource = input.sourceItems[0]!
  const referenceCleanup = input.cleanupDecisions[0]!
  const referenceOutputKey = 'color-delivery-1-mkv'
  const approvedColorGradeStyle = color.colorGradeStyle as 'clean_natural' | 'premium_clean'
  const approvedColorIntensity = color.intensity as 'subtle' | 'balanced'
  const results = input.sourceItems.map((sourceItem, index): ApprovedColorDeliverySource => {
    const cleanup = input.cleanupDecisions[index]!
    const approvedOperations = index === 0 || !multiSource
      ? [...projectBaselineOperations, ...clipOperations[index]!.filter((operation) =>
          operation.operation !== 'shot_matching')]
      : [
          ...projectBaselineOperations,
          ...clipOperations[index]!,
          ...shotMatchingOperations,
        ]
    const approvedColorOperationIds = [...new Set(
      approvedOperations.map((operation) => operation.id),
    )].sort()
    return {
      recipeProfileId: index === 0 || !multiSource
        ? 'approved_source_color_delivery_matroska_v1'
        : 'approved_source_color_match_delivery_matroska_v1',
      sourceSequenceItemId: sourceItem.sourceSequenceItemId,
      cleanupDecisionId: cleanup.decisionId,
      trimStartFrame: cleanup.startFrame,
      trimEndFrameExclusive: cleanup.endFrameExclusive,
      durationFrames: cleanup.endFrameExclusive - cleanup.startFrame,
      colorGradeStyle: approvedColorGradeStyle,
      intensity: approvedColorIntensity,
      approvedColorOperationIds,
      approvedColorOperationKinds: index === 0 || !multiSource
        ? [...baselineKinds]
        : withShotMatching(baselineKinds),
      ...(index > 0 && multiSource
        ? {
            referenceSourceSequenceItemId: referenceSource.sourceSequenceItemId,
            referenceCleanupDecisionId: referenceCleanup.decisionId,
            referenceDurationFrames:
              referenceCleanup.endFrameExclusive - referenceCleanup.startFrame,
            referenceOutputKey,
          }
        : {}),
    }
  })
  const representedOperationIds = new Set(results.flatMap((source) =>
    source.approvedColorOperationIds))
  return representedOperationIds.size === operationIds.length &&
    operationIds.every((operationId) => representedOperationIds.has(operationId))
    ? results
    : null
}

const APPROVED_VOICE_DELIVERY_PROCESSING_OPERATIONS = new Set([
  'voice_leveling',
  'eq_cleanup',
  'compression',
  'loudness_normalization',
  'true_peak_limit',
])
const APPROVED_VOICE_DELIVERY_QA_OPERATIONS = new Set([
  'qa_loudness_check',
  'qa_clipping_check',
])

function hasPlannedAudioWork(plan: EditPlan): boolean {
  const audio = plan.audioPipelinePlan
  return Boolean(audio && (
    audio.projectOperations.length > 0 ||
    audio.clipPlans.some((clip) => clip.cleanupOperations.length > 0 || clip.loudnessOperations.length > 0) ||
    audio.musicBedPlan.policy !== 'none' ||
    audio.sfxPlan.policy !== 'none' ||
    audio.sfxPlan.cues.length > 0 ||
    audio.beatSyncPlan.strategy !== 'none' ||
    audio.soundSyncCues.length > 0
  ))
}

function buildApprovedVoiceDeliverySources(input: {
  plan: EditPlan
  plannerInput: PlannerInput
  sourceItems: CanonicalSourceAuthorityItem[]
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  cleanupDecisions: CanonicalSourceCleanupDecisionDraft[]
}): ApprovedVoiceDeliverySource[] | null {
  const audio = input.plan.audioPipelinePlan
  if (!audio || !hasPlannedAudioWork(input.plan)) return null
  if (
    audio.musicBedPlan.policy !== 'none' || audio.musicBedPlan.duckingEnabled ||
    audio.sfxPlan.policy !== 'none' || audio.sfxPlan.cues.length > 0 ||
    audio.beatSyncPlan.strategy !== 'none' || audio.beatSyncPlan.bpmDetectionPlanned ||
    audio.beatSyncPlan.onsetDetectionPlanned || audio.soundSyncCues.length > 0 ||
    audio.clipPlans.length !== input.sourceItems.length ||
    input.sourceMediaAssets.length !== input.sourceItems.length ||
    input.cleanupDecisions.length !== input.sourceItems.length ||
    !audio.toolsPlanned.includes('ffmpeg')
  ) return null
  const operations = [
    ...audio.projectOperations,
    ...audio.clipPlans.flatMap((clip) => [
      ...clip.cleanupOperations,
      ...clip.loudnessOperations,
    ]),
  ]
  const allowedOperations = new Set([
    ...APPROVED_VOICE_DELIVERY_PROCESSING_OPERATIONS,
    ...APPROVED_VOICE_DELIVERY_QA_OPERATIONS,
  ])
  if (
    operations.length < 1 ||
    operations.some((operation) =>
      !allowedOperations.has(operation.operation) ||
      operation.settings.planningOnly !== true ||
      operation.settings.requiresApproval !== true ||
      (APPROVED_VOICE_DELIVERY_PROCESSING_OPERATIONS.has(operation.operation) &&
        operation.toolId !== 'ffmpeg') ||
      (APPROVED_VOICE_DELIVERY_QA_OPERATIONS.has(operation.operation) &&
        operation.toolId !== 'planning_only'))
  ) return null
  const projectOperationIds = new Set(audio.projectOperations.map((operation) => operation.operation))
  if ([...APPROVED_VOICE_DELIVERY_PROCESSING_OPERATIONS].some((operation) =>
    !projectOperationIds.has(operation as typeof audio.projectOperations[number]['operation']))) {
    return null
  }
  const voiceLeveling = operations.find((operation) => operation.operation === 'voice_leveling')
  const loudness = operations.find((operation) => operation.operation === 'loudness_normalization')
  const compression = operations.find((operation) => operation.operation === 'compression')
  const eqCleanup = operations.find((operation) => operation.operation === 'eq_cleanup')
  if (
    voiceLeveling?.settings.targetVoiceLoudness !== -14 ||
    loudness?.settings.loudnessTarget !== -14 || loudness.settings.truePeakTarget !== -1 ||
    compression?.settings.compression !== true || eqCleanup?.settings.eqCleanup !== true
  ) return null
  const exactSourceBindings = input.sourceItems.every((sourceItem, index) => {
    const clip = input.plannerInput.clips[index]
    const clipPlan = audio.clipPlans[index]
    const cleanup = input.cleanupDecisions[index]
    const sourceAsset = input.sourceMediaAssets.find((asset) =>
      asset.uploadedOrder === sourceItem.uploadedOrder &&
      asset.mediaAssetId === sourceItem.mediaAssetId)
    const clipOperations = new Set([
      ...(clipPlan?.cleanupOperations ?? []),
      ...(clipPlan?.loudnessOperations ?? []),
    ].map((operation) => operation.operation))
    return Boolean(
      !clip || !clipPlan || clipPlan.clipId !== clip.id || !cleanup ||
      !sourceAsset || sourceAsset.uploadedClipId !== clip.id ||
      sourceAsset.sourceMetadata?.probeStatus !== 'probed' ||
      sourceAsset.sourceMetadata.hasAudio !== true ||
      cleanup.sourceSequenceItemId !== sourceItem.sourceSequenceItemId ||
      !clipOperations.has('voice_leveling') ||
      !clipOperations.has('loudness_normalization') ||
      !clipOperations.has('true_peak_limit')
    ) === false
  })
  if (!exactSourceBindings) return null
  return input.sourceItems.map((sourceItem, index) => {
    const cleanup = input.cleanupDecisions[index]!
    return {
      sourceSequenceItemId: sourceItem.sourceSequenceItemId,
      cleanupDecisionId: cleanup.decisionId,
      trimStartFrame: cleanup.startFrame,
      trimEndFrameExclusive: cleanup.endFrameExclusive,
      durationFrames: cleanup.endFrameExclusive - cleanup.startFrame,
    }
  })
}

function safeColor(value: string | undefined): string {
  const color = value?.trim().toUpperCase()
  return color && /^#[A-F0-9]{6}$/.test(color) ? color : '#000000'
}

function safeIdentity(value: string): boolean {
  return value.length <= 200 && value === value.trim() && SAFE_KEY.test(value) && !value.includes('..')
}

function safeOptionalKey(value: string | undefined): string | undefined {
  return value && safeIdentity(value) ? value : undefined
}

function safeKey(value: string, fallback: string): string {
  let normalized = value.trim().replace(/[^A-Za-z0-9._:-]+/g, '-').replace(/\.{2,}/g, '.').slice(0, 150)
  if (!/^[A-Za-z0-9]/.test(normalized)) normalized = `rp-${normalized}`
  normalized = normalized.replace(/[-.]+$/g, '')
  return safeIdentity(normalized) ? normalized : fallback
}

function boundedText(value: string | undefined, fallback: string, maximum: number): string {
  const normalized = value?.trim().replace(/\s+/g, ' ')
  return (normalized || fallback).slice(0, maximum)
}

function integerValue(value: unknown): number | undefined {
  return Number.isInteger(value) ? Number(value) : undefined
}

function secondsFrame(value: unknown, fps: number): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value * fps) : undefined
}

function durationFrames(value: unknown, fps: number): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.max(1, Math.round(value * fps)) : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function containsForbiddenOutboundMaterial(value: unknown, key = ''): boolean {
  if (FORBIDDEN_OUTBOUND_KEY.test(key)) return true
  if (Array.isArray(value)) return value.some((entry) => containsForbiddenOutboundMaterial(entry))
  if (isRecord(value)) {
    return Object.entries(value).some(([childKey, child]) => containsForbiddenOutboundMaterial(child, childKey))
  }
  return false
}

function toJsonValue(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value)) as unknown
  } catch {
    return {}
  }
}

function toJsonRecord(value: unknown, fallback: JsonRecord): JsonRecord {
  const serialized = toJsonValue(value)
  return isRecord(serialized) ? serialized : fallback
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
