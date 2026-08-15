import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from './approved-edit-execution-package-client'
import type {
  ColorOperationId,
  EditPlan,
  PlannerInput,
  TrimDecisionItem,
} from '../types/reeditpro'
import type { ProfessionalExportCreditCoverage } from '../types/professional-export'
import type { PrepareCanonicalStorytellingPlanningResponse } from '../types/motion-studio'
import type { LivingFrameProfessionalSkillComponent } from '../types/living-frame'
import type { CanonicalEditBriefAudioPlanningInput } from '../types/edit-brief-authority'
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
import {
  buildCanonicalEditBriefAudioPlanningBinding,
  type CanonicalEditBriefAudioPlanningBinding,
} from './canonical-edit-brief-audio-planning'

export const CANONICAL_PRIVATE_PLAN_SCHEMA_VERSION = 'private-edit-authority-plan-v2' as const

const FFPROBE_OPERATION = 'tool.ffprobe.inspect_approved_media.v1'
const FFMPEG_OPERATION = 'tool.ffmpeg.execute_approved_media_recipe.v1'
const LIBASS_OPERATION = 'tool.libass.render_approved_caption_track.v1'
const REMOTION_OPERATION = 'tool.remotion.render_approved_composition.v1'
const D3_OPERATION = 'tool.d3.render_chart_or_diagram.v1'
const ECHARTS_OPERATION = 'tool.echarts.render_standard_chart.v1'
const LONG_FORM_MERGE_COMPOSITION_PROFILE = 'approved_4k_composition_chunk_merge_final_v1'
const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const SHA256 = /^[a-f0-9]{64}$/
const EXACT_EDIT_PREFERENCE_KEYS = [
  'editLevel',
  'workflowType',
  'cleanupPreference',
  'visualPreference',
  'moodStyle',
  'creditPreference',
  'targetPlatform',
] as const
const CANONICAL_DIRECT_SOURCE_BUFFER_MAX_BYTES = 16 * 1024 * 1024
const SUPPORTED_PRIVATE_4K_MASTER_FRAMES = new Set([
  '3840x2160',
  '2160x3840',
  '2160x2160',
  '2160x2700',
  '2880x2160',
])
type JsonRecord = Record<string, unknown>

export type CanonicalStorytellingPlanningPreparationSource = Extract<
  PrepareCanonicalStorytellingPlanningResponse['preparation'],
  { state: 'ready_for_canonical_plan' }
>

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
    | 'approved_source_color_delivery_matroska_v2'
    | 'approved_source_color_match_delivery_matroska_v2'
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

function isApprovedColorMatchRecipe(
  recipeProfileId: ApprovedColorDeliverySource['recipeProfileId'],
): recipeProfileId is
  | 'approved_source_color_match_delivery_matroska_v1'
  | 'approved_source_color_match_delivery_matroska_v2' {
  return recipeProfileId === 'approved_source_color_match_delivery_matroska_v1' ||
    recipeProfileId === 'approved_source_color_match_delivery_matroska_v2'
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

type ApprovedBoundedSourceTransition = ApprovedHardCutTransition & {
  transitionType: 'hard_cut' | 'smooth_panel_dip'
  startFrame: number
  endFrameExclusive: number
  durationFrames: number
  visualCurve: 'none' | 'linear_dip_to_panel'
  audioPolicy: 'hard_cut_at_boundary'
}

type ApprovedSourceTransitionAuthority =
  | {
      policy: 'approved_hard_cuts_only'
      transitions: ApprovedHardCutTransition[]
    }
  | {
      policy: 'approved_bounded_source_transitions_v1'
      transitions: ApprovedBoundedSourceTransition[]
    }

type ApprovedControlledDataVizOverlay = {
  toolId: 'd3' | 'echarts'
  operationId: typeof D3_OPERATION | typeof ECHARTS_OPERATION
  outputKey: 'controlled-dataviz-overlay-svg'
  rendererLayerId: 'controlled-dataviz-overlay-layer'
  visualAssetPlanItemId: string
  dataVizPlanItemId: string
  visualTimingItemId: string
  segmentIds: string[]
  startFrame: number
  endFrameExclusive: number
  x: number
  y: number
  width: number
  height: number
  intrinsicWidth: number
  intrinsicHeight: number
  title: string
  xAxisLabel: string
  yAxisLabel: string
  theme: 'light' | 'dark'
  data: Array<{ label: string; value: number }>
  sourceConfidence: 'verified' | 'mock' | 'fictional'
  safeWording: 'verified data' | 'mock demo data' | 'fictional story data'
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
  exactEditPreferenceInstruction?: {
    schemaVersion: 'canonical-exact-edit-preference-instruction-v1'
    source: 'current_edit_preferences' | 'explicit_chat_setup'
    base: {
      preferenceRevision: number
      planningInputRevision: number
      preferenceFingerprintSha256: string
      preferenceSnapshotId: string
    }
    effectiveValues: NonNullable<PlannerInput['currentEditPreferenceAuthorityValues']>
    overrideKeys: Array<(typeof EXACT_EDIT_PREFERENCE_KEYS)[number]>
    overrides: Partial<NonNullable<PlannerInput['currentEditPreferenceAuthorityValues']>>
    browserMutationAuthorityGranted: false
  }
  sourceSequence: CanonicalSourceAuthorityItem[]
  sourceCleanupSummary: {
    status: 'confirmed' | 'not_applicable'
    cleanupPreference: string
    trimValidationStatus: 'passed' | 'warning' | 'not_applicable'
    meaningValidationStatus: 'passed' | 'warning' | 'not_applicable'
    userReviewRequired: false
    reason?: 'idea_first_storytelling_has_no_uploaded_media_source'
  }
  sourceCleanupPlan: {
    status: 'confirmed' | 'not_applicable'
    decisions: CanonicalSourceCleanupDecisionDraft[]
    reason?: 'idea_first_storytelling_has_no_uploaded_media_source'
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
  editBriefAudioPlanning?: CanonicalEditBriefAudioPlanningBinding
  bRollSkill?: JsonRecord
  livingFrame?: LivingFrameProfessionalSkillComponent
  motionStudioStorytellingStyleAuthority?: CanonicalStorytellingStyleAuthorityDraft
  motionStudioStorytellingProductionAuthority?: JsonRecord
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
  workItemType:
    | 'validate_approved_snapshot'
    | 'prepare_source_trim'
    | 'render_chart_asset'
    | 'custom'
    | 'render_remotion_preview'
    | 'render_final_export'
    | 'process_audio_asset'
    | 'run_asset_qa'
    | 'run_final_qa'
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
  planningRequestIdSeed: string
  estimate?: CanonicalPlanDraft['estimate']
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
  editBriefAudioPlanningInputs?: readonly CanonicalEditBriefAudioPlanningInput[]
  livingFrameComponent?: LivingFrameProfessionalSkillComponent
  motionStudioStorytellingStylePlan?: CanonicalStorytellingStylePlanReviewSource
  motionStudioStorytellingPlanningPreparation?: CanonicalStorytellingPlanningPreparationSource
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
  const storytellingPlanning = input.motionStudioStorytellingPlanningPreparation
  const ideaFirstStorytelling = Boolean(storytellingPlanning)
  if (storytellingPlanning) {
    const authority = storytellingPlanning.authority
    if (
      !motionStudioStorytellingStyleAuthority ||
      authority.workspaceId !== motionStudioStorytellingStyleAuthority.workspaceId ||
      authority.projectId !== motionStudioStorytellingStyleAuthority.projectId ||
      authority.editSessionId !== motionStudioStorytellingStyleAuthority.editSessionId ||
      authority.productionId !== motionStudioStorytellingStyleAuthority.productionId ||
      authority.schemaVersion !==
        'canonical-motion-studio-storytelling-production-authority-v1' ||
      authority.componentKey !== 'motionStudioStorytellingProductionAuthority' ||
      !SHA256.test(authority.authorityHash) ||
      !SHA256.test(authority.sourceProposal.componentProposalDigest)
    ) {
      errors.push('Refresh the exact source-verified Storytelling production authority before planning.')
    }
    if (input.sourceMediaAssets.length !== 0 || plannerInput.clips.length !== 0) {
      errors.push('Idea-first Storytelling cannot combine fabricated or uploaded source authority with its private animatic plan.')
    }
  }
  const orderedSourceItems = buildSourceItems(
    input.sourceMediaAssets,
    plannerInput,
    errors,
    ideaFirstStorytelling,
  )

  if (!plannerInput.aspectRatioConfirmed || plannerInput.aspectRatio === 'let_ai_decide') {
    errors.push('Confirm the output frame before saving this plan to the canonical workflow.')
  }
  if (!ideaFirstStorytelling && !plannerInput.sourceOrderConfirmed) {
    errors.push('Confirm the source order before saving this plan to the canonical workflow.')
  }
  if (
    !ideaFirstStorytelling &&
    (!plannerInput.cleanupPreferenceConfirmed || !plannerInput.cleanupPreference)
  ) {
    errors.push('Confirm source cleanup before saving this plan to the canonical workflow.')
  }
  if (!ideaFirstStorytelling && (!plan.masterTimingPlan || plan.masterTimingPlan.status !== 'ready')) {
    errors.push('The frame-accurate timing plan must be ready before canonical planning can continue.')
  }
  if (
    !ideaFirstStorytelling &&
    (!plan.timingValidationPlan || plan.timingValidationPlan.approvalBlocked)
  ) {
    errors.push('Resolve the blocking timing validation before canonical planning can continue.')
  }
  if (!ideaFirstStorytelling && plan.trimReviewPlan?.approvalBlocked) {
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
    (!ideaFirstStorytelling && !plan.masterTimingPlan) ||
    (!ideaFirstStorytelling && !plannerInput.cleanupPreference) ||
    !professionalExportCoverage ||
    !approvedExportAspectRatio
  ) {
    return { ok: false, errors: unique(errors) }
  }

  const fps = storytellingPlanning?.components.timingSummary.fps ??
    plan.masterTimingPlan!.timingBase.fps
  const totalFrames = storytellingPlanning?.components.timingSummary.totalFrames ??
    plan.masterTimingPlan!.timingBase.totalFrames
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

  const cleanup = ideaFirstStorytelling
    ? { ok: true as const, decisions: [] as CanonicalSourceCleanupDecisionDraft[] }
    : buildCleanupDecisions({
        plan,
        plannerInput,
        orderedSourceItems,
        sourceMediaAssets: input.sourceMediaAssets,
        fps,
      })
  if (!cleanup.ok) return cleanup

  const segments = ideaFirstStorytelling
    ? {
        ok: true as const,
        segments: storytellingPlanning!.components.segments.map((segment) => ({
          ...segment,
          operationIds: [...segment.operationIds],
        })),
      }
    : buildSegments(plan, totalFrames)
  if (!segments.ok) return segments
  const approvedVoiceDeliverySources = ideaFirstStorytelling
    ? null
    : buildApprovedVoiceDeliverySources({
        plan,
        plannerInput,
        sourceItems: orderedSourceItems,
        sourceMediaAssets: input.sourceMediaAssets,
        cleanupDecisions: cleanup.decisions,
      })
  const approvedColorDeliverySources = ideaFirstStorytelling
    ? null
    : buildApprovedColorDeliverySources({
        plan,
        plannerInput,
        sourceItems: orderedSourceItems,
        cleanupDecisions: cleanup.decisions,
      })
  const approvedSourceTransitions: ApprovedSourceTransitionAuthority | null =
    ideaFirstStorytelling
      ? { policy: 'approved_hard_cuts_only', transitions: [] }
      : buildApprovedSourceTransitionAuthority({
        plan,
        sourceItems: orderedSourceItems,
        segments: segments.segments,
        fps,
        totalFrames,
      })

  const frame = canonicalFourKMasterFrame(approvedExportAspectRatio)
  if (storytellingPlanning && (
    storytellingPlanning.authority.confirmedOutputFrame.width !== frame.width ||
    storytellingPlanning.authority.confirmedOutputFrame.height !== frame.height ||
    storytellingPlanning.authority.confirmedOutputFrame.aspectRatio !== approvedExportAspectRatio ||
    storytellingPlanning.authority.confirmedOutputFrame.frameRate !== fps ||
    storytellingPlanning.authority.confirmedOutputFrame.durationFrames !== totalFrames
  )) {
    return {
      ok: false,
      errors: ['The approved Storytelling script frame or timing changed; create a fresh plan and 4K estimate.'],
    }
  }
  const timingValidationPlan = ideaFirstStorytelling
    ? storytellingPlanning!.components.timingValidationPlan
    : plan.timingValidationPlan
  if (!timingValidationPlan) {
    return { ok: false, errors: ['The timing validation result is missing.'] }
  }
  const timingStatus = ideaFirstStorytelling || timingValidationPlan.overallStatus === 'warning'
    ? 'warning'
    : 'passed'
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
  const exactEditPreferenceInstruction =
    buildExactEditPreferenceInstruction(plannerInput)
  const sourceSliceMezzanineFinalizationRequired =
    orderedSourceItems.length === 1 &&
    totalFrames > CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES
  const editBriefAudioPlanning = buildCanonicalEditBriefAudioPlanningBinding({
    audioInputs: input.editBriefAudioPlanningInputs,
    fps,
    totalFrames,
  })
  if (!editBriefAudioPlanning.ok) {
    return { ok: false, errors: [editBriefAudioPlanning.error] }
  }
  const controlledDataViz = ideaFirstStorytelling
    ? { overlay: undefined, blockers: [] as string[] }
    : deriveApprovedControlledDataVizOverlay({
        plan,
        frame,
        totalFrames,
        segments: segments.segments,
      })
  const toolStrategy = ideaFirstStorytelling
    ? storytellingPlanning!.components.toolStrategyPlan
    : {
    schemaVersion: 'canonical-browser-tool-strategy-projection-v1',
    toolIds: unique([
      'libass',
      ...(approvedVoiceDeliverySources || approvedColorDeliverySources ||
        sourceSliceMezzanineFinalizationRequired ||
        editBriefAudioPlanning.binding ? ['ffmpeg'] : []),
      ...(controlledDataViz.overlay ? [controlledDataViz.overlay.toolId] : []),
      'remotion',
      'ffprobe',
    ]),
    exactOperationIds: unique([
      LIBASS_OPERATION,
      ...(approvedVoiceDeliverySources || approvedColorDeliverySources ||
        sourceSliceMezzanineFinalizationRequired ||
        editBriefAudioPlanning.binding ? [FFMPEG_OPERATION] : []),
      ...(controlledDataViz.overlay ? [controlledDataViz.overlay.operationId] : []),
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
    ...(exactEditPreferenceInstruction
      ? { exactEditPreferenceInstruction }
      : {}),
    sourceSequence: orderedSourceItems.map((item) => ({ ...item })),
    sourceCleanupSummary: ideaFirstStorytelling
      ? {
          status: 'not_applicable',
          cleanupPreference: 'idea_first_not_applicable',
          trimValidationStatus: 'not_applicable',
          meaningValidationStatus: 'not_applicable',
          userReviewRequired: false,
          reason: 'idea_first_storytelling_has_no_uploaded_media_source',
        }
      : {
          status: 'confirmed',
          cleanupPreference: plannerInput.cleanupPreference!,
          trimValidationStatus: plan.sourceCleanupPlan?.status === 'confirmed' ? 'passed' : 'warning',
          meaningValidationStatus: meaningStatus,
          userReviewRequired: false,
        },
    sourceCleanupPlan: ideaFirstStorytelling
      ? {
          status: 'not_applicable',
          decisions: [],
          reason: 'idea_first_storytelling_has_no_uploaded_media_source',
        }
      : { status: 'confirmed', decisions: cleanup.decisions },
    masterTimingPlan: ideaFirstStorytelling
      ? { ...storytellingPlanning!.components.masterTimingPlan }
      : toJsonRecord(plan.masterTimingPlan, { status: 'ready' }),
    captionVisualCueTimingPlan: ideaFirstStorytelling
      ? { ...storytellingPlanning!.components.captionVisualCueTimingPlan }
      : toJsonRecord(plan.captionVisualCueTimingPlan, { status: 'not_needed' }),
    soundSyncTransitionTimingPlan: ideaFirstStorytelling
      ? { ...storytellingPlanning!.components.soundSyncTransitionTimingPlan }
      : toJsonRecord(plan.soundSyncTransitionTimingPlan, { status: 'not_needed', speechPriority: true }),
    timingValidationPlan: ideaFirstStorytelling
      ? { ...storytellingPlanning!.components.timingValidationPlan }
      : toJsonRecord(timingValidationPlan, { overallStatus: timingStatus, approvalBlocked: false }),
    timingSummary: ideaFirstStorytelling
      ? { ...storytellingPlanning!.components.timingSummary }
      : { validationStatus: timingStatus, approvalBlocked: false, fps, totalFrames },
    segments: segments.segments,
    visualAssetPlan: ideaFirstStorytelling
      ? { ...storytellingPlanning!.components.visualAssetPlan }
      : {
          status: (plan.visualAssetPlan?.length ?? 0) > 0 ? 'planned' : 'not_needed',
          assets: toJsonValue(plan.visualAssetPlan ?? []),
          randomBrollAllowed: false,
        },
    colorPipelinePlan: ideaFirstStorytelling
      ? { ...storytellingPlanning!.components.colorPipelinePlan }
      : toJsonRecord(plan.colorPipelinePlan, { status: 'not_provided' }),
    rendererPlan: ideaFirstStorytelling
      ? { ...storytellingPlanning!.components.rendererPlan }
      : {
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
    qaPlan: ideaFirstStorytelling
      ? { ...storytellingPlanning!.components.qaPlan }
      : toJsonRecord(plan.editQAPlan, { checks: plan.qaChecks ?? [] }),
    qaSummary: ideaFirstStorytelling
      ? { ...storytellingPlanning!.components.qaSummary }
      : { status: timingStatus, approvalBlocked: false },
    providerPolicy: ideaFirstStorytelling
      ? { ...storytellingPlanning!.components.providerPolicy }
      : {
          veoPolicy: plannerInput.editLevel === 'premium' ? 'final_fallback_only' : 'forbidden',
          approvedRoutes: [],
        },
    fallbackPolicy: ideaFirstStorytelling
      ? { ...storytellingPlanning!.components.fallbackPolicy }
      : {
          unapprovedFallbackAllowed: false,
          policy: toJsonValue(plan.agentQAFallbackPlan ?? {}),
        },
    ...(editBriefAudioPlanning.binding
      ? { editBriefAudioPlanning: editBriefAudioPlanning.binding }
      : {}),
    ...(input.livingFrameComponent
      ? { livingFrame: structuredClone(input.livingFrameComponent) }
      : {}),
    ...(motionStudioStorytellingStyleAuthority
      ? {
          motionStudioStorytellingStyleAuthority,
        }
      : {}),
    ...(storytellingPlanning
      ? {
          motionStudioStorytellingProductionAuthority:
            structuredClone(storytellingPlanning.authority),
        }
      : {}),
  }
  if (containsForbiddenCanonicalPlanningMaterial({
    components,
    workItems: storytellingPlanning?.workItems ?? [],
  })) {
    return {
      ok: false,
      errors: ['The plan contains private path, credential, or source-byte material that cannot cross the browser planning boundary.'],
    }
  }

  const publicationBlockers = ideaFirstStorytelling
    ? []
    : privateReviewPublicationBlockers({
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
        approvedSourceTransitions,
        editBriefAudioPlanning: editBriefAudioPlanning.binding,
        controlledDataVizOverlay: controlledDataViz.overlay,
        controlledDataVizBlockers: controlledDataViz.blockers,
      })
  if (
    !preferenceSnapshotId ||
    preferenceRevision === undefined ||
    preferencePlanningInputRevision === undefined ||
    !preferenceFingerprintSha256
  ) {
    publicationBlockers.push(
      'Refresh the canonical exact-edit preference authority before publishing this plan.',
    )
  }
  const canonicalEstimate = buildEstimate(plan)
  if (!canonicalEstimate.ok) publicationBlockers.push(canonicalEstimate.blocker)
  const planningRequestIdSeed = safeKey(
    plan.planningInputTrace?.fingerprint ??
      plan.planningContextTrace?.planningContextId ??
      'named-edit-plan',
    'named-edit-plan',
  )
  const publication = publicationBlockers.length === 0 && canonicalEstimate.ok
    ? {
        canonicalPlan: ideaFirstStorytelling
          ? {
              schemaVersion: CANONICAL_PRIVATE_PLAN_SCHEMA_VERSION,
              components,
              estimate: canonicalEstimate.estimate,
              workItems: storytellingPlanning!.workItems.map((workItem) =>
                structuredClone(workItem)),
            }
          : buildPrivateReviewCanonicalPlan({
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
              approvedSourceTransitions: approvedSourceTransitions ?? {
                policy: 'approved_hard_cuts_only',
                transitions: [],
              },
              controlledDataVizOverlay: controlledDataViz.overlay,
            }),
        planningRequestIdSeed,
      }
    : undefined

  return {
    ok: true,
    draft: {
      orderedSourceItems,
      components,
      planningRequestIdSeed,
      ...(canonicalEstimate.ok
        ? { estimate: structuredClone(canonicalEstimate.estimate) }
        : {}),
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
  ideaFirstStorytelling = false,
): CanonicalSourceAuthorityItem[] {
  if (ideaFirstStorytelling) return []
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
  approvedSourceTransitions: ApprovedSourceTransitionAuthority | null
  editBriefAudioPlanning?: CanonicalEditBriefAudioPlanningBinding
  controlledDataVizOverlay?: ApprovedControlledDataVizOverlay
  controlledDataVizBlockers: string[]
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
      if (
        input.sourceMediaAssets[0]?.sourceMetadata?.hasAudio !== true &&
        !input.approvedVoiceDeliverySources
      ) {
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
  blockers.push(...input.controlledDataVizBlockers)
  if (
    input.controlledDataVizOverlay &&
    input.totalFrames > CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES
  ) {
    blockers.push(
      'Approved data-visualization overlays currently require the bounded direct compositor; chunk-spanning overlay continuity remains closed.',
    )
  }
  if ((input.plan.providerPromptPlans?.length ?? 0) > 0) blockers.push('Provider-backed plan items remain gated until their canonical work items are compiled.')
  if (!captionCues) {
    blockers.push('Private canonical review captions, when present, must be one full-duration cue or two to seven safe, ordered, non-overlapping cues.')
  }
  if (hasUnrepresentedVisualTiming(
    input.plan,
    input.totalFrames,
    input.controlledDataVizOverlay,
  )) {
    blockers.push('Timed visual cues need their own canonical execution work items.')
  }
  const plannedTransitionCount = Math.max(
    input.plan.masterTimingPlan?.transitionTimingItems.length ?? 0,
    input.plan.soundSyncTransitionTimingPlan?.refinedTransitionTimings.length ?? 0,
  )
  const expectedTransitionCount = Math.max(0, input.orderedSourceItems.length - 1)
  if (
    plannedTransitionCount !== expectedTransitionCount ||
    !input.approvedSourceTransitions
  ) blockers.push('Timed transitions need their own canonical execution work items.')
  if (
    input.approvedSourceTransitions?.policy ===
      'approved_bounded_source_transitions_v1' &&
    input.totalFrames > CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES
  ) {
    blockers.push(
      'Approved panel-dip transitions currently require the bounded direct source-sequence compositor; long-form chunk transition continuity remains hard-cut only.',
    )
  }
  blockers.push(...editBriefAudioPlanningPublicationBlockers({
    plan: input.plan,
    binding: input.editBriefAudioPlanning,
    sourceHasAudio: input.sourceMediaAssets.some((asset) =>
      asset.sourceMetadata?.hasAudio === true),
  }))
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
  if (
    hasPlannedSourceAudioProcessingWork(input.plan) &&
    !input.approvedVoiceDeliverySources
  ) {
    blockers.push(
      'The planned audio work exceeds the exact source-bound voice delivery recipe and needs additional canonical work items.',
    )
  }
  if (
    input.editBriefAudioPlanning &&
    (
      input.totalFrames > CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES ||
      (
        input.orderedSourceItems.length === 1 &&
        input.totalFrames > CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES
      )
    )
  ) {
    blockers.push(
      'Confirmed Edit Brief audio currently requires the bounded direct composition profile; chunk-spanning audio continuity evidence is not yet admitted.',
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
  approvedSourceTransitions: ApprovedSourceTransitionAuthority
  controlledDataVizOverlay?: ApprovedControlledDataVizOverlay
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
  const voiceDeliverySources = input.approvedVoiceDeliverySources ?? []
  const colorDeliverySources = input.approvedColorDeliverySources ?? []
  const useSourceSliceColorDeliveries =
    (
      approvedLongFormChunkPlan?.profileId ===
        CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID ||
      approvedLongFormChunkPlan?.profileId ===
        CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID
    ) &&
    colorDeliverySources.length === 1
  const colorWorkItemCount = useSourceSliceColorDeliveries
    ? approvedLongFormChunkPlan.chunkCount
    : colorDeliverySources.length
  const editBriefAudioItems =
    input.components.editBriefAudioPlanning?.items ?? []
  const budgets = fitBudgets(
    estimate.lineItems.reduce((sum, item) => sum + item.estimatedCredits, 0) +
      estimate.fallbackAllowanceCredits,
    captionCues.length,
    input.approvedVoiceDeliverySources?.length ?? 0,
    editBriefAudioItems.length,
    colorWorkItemCount,
    input.controlledDataVizOverlay ? 1 : 0,
    approvedLongFormChunkPlan ? approvedLongFormChunkPlan.chunkCount + 1 : 1,
  )
  const sourceSequenceComposition = sourceTimeline.length > 1
  // The timed-track profile is the canonical zero-or-many representation.
  // Keep the legacy single-cue profile only for exactly one full-duration
  // approved cue; a caption-free edit carries an empty, verified cue track.
  const captionTrackComposition = captionCues.length !== 1
  const replaceSourceAudio = voiceDeliverySources.length > 0
  const sourceTransitions = input.approvedSourceTransitions.transitions
  const approvedHardCutTransitions =
    input.approvedSourceTransitions.policy === 'approved_hard_cuts_only'
      ? input.approvedSourceTransitions.transitions
      : []
  if (replaceSourceAudio && voiceDeliverySources.length !== sourceTimeline.length) {
    throw new Error('Canonical voice delivery lost its one-to-one approved source binding.')
  }
  if (colorDeliverySources.length > 0 && colorDeliverySources.length !== sourceTimeline.length) {
    throw new Error('Canonical color delivery lost its one-to-one approved source binding.')
  }
  if (
    sourceSequenceComposition &&
    sourceTransitions.length !== sourceTimeline.length - 1
  ) throw new Error('Canonical source sequence lost its approved transition authority.')
  if (
    approvedLongFormChunkPlan &&
    input.approvedSourceTransitions.policy !== 'approved_hard_cuts_only'
  ) {
    throw new Error(
      'Canonical long-form compilation remains hard-cut only until bounded transition continuity is proven across chunks.',
    )
  }
  const transitionTimingIds = sourceTransitions.flatMap((transition) => [
    transition.transitionTimingItemId,
    transition.refinedTransitionTimingItemId,
  ])
  const transitionRendererLayerIds = sourceTransitions.map(
    (_transition, index) => input.approvedSourceTransitions.policy ===
      'approved_hard_cuts_only'
      ? `approved-hard-cut-boundary-${index + 1}`
      : `approved-bounded-transition-boundary-${index + 1}`,
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
  const editBriefAudioWorkItems = editBriefAudioItems.map(
    (item, index): CanonicalWorkItemDraft => {
      const ordinal = index + 1
      const workItemKey = `edit-brief-audio-${ordinal}`
      const outputKey = `${workItemKey}-wav`
      const rendererLayerId = `${workItemKey}-layer`
      const itemSegmentIds = input.components.segments
        .filter((segment) =>
          segment.startFrame < item.endFrameExclusive &&
          segment.endFrameExclusive > item.startFrame)
        .map((segment) => segment.segmentId)
      return {
        workItemKey,
        workItemType: 'process_audio_asset',
        workerClass: 'audio_processing_worker',
        executionInput: {
          operation: 'process_approved_edit_brief_audio_attachment',
          approvedToolOperationIds: [FFMPEG_OPERATION],
          expectedOutputKeys: [outputKey],
          structuredPayload: {
            recipeProfileId: item.markerType === 'music'
              ? 'approved_edit_brief_music_bed_wav_v1'
              : 'approved_edit_brief_sfx_wav_v1',
            timestampPolicy: 'normalize_from_zero',
            allowUnreviewedCodec: false,
            trimStartFrame: 0,
            trimEndFrameExclusive: item.sourceDurationFrames,
            attachmentId: item.attachmentId,
            markerId: item.markerId,
            privateAssetId: item.privateAssetId,
            markerType: item.markerType,
            startFrame: item.startFrame,
            endFrameExclusive: item.endFrameExclusive,
            sourceDurationFrames: item.sourceDurationFrames,
            placementDurationFrames: item.placementDurationFrames,
            fillPolicy: item.fillPolicy,
            mixProfileId: item.mixProfileId,
            frameRate: input.fps,
            sampleRate: 48_000,
            channelMode: 'stereo',
            targetLufs: item.markerType === 'music' ? -23 : -18,
            truePeakDbtp: -2,
            loudnessRangeLufs: item.markerType === 'music' ? 18 : 20,
            stripMetadata: true,
            overwriteExistingArtifact: false,
          },
        },
        sourceSequenceItemIds: [],
        sourceCleanupDecisionIds: [],
        expectedOutputs: [output(
          outputKey,
          item.markerType === 'music'
            ? 'controlled_ffmpeg_edit_brief_music_bed_wav'
            : 'controlled_ffmpeg_edit_brief_sfx_wav',
          'processed',
          'audio/wav',
          {
            segmentIds: itemSegmentIds,
            timingIds: [timingId, item.markerId],
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
        maximumCreditBudget: budgets[
          2 + captionCues.length + voiceWorkItems.length + index
        ]!,
        required: true,
      }
    },
  )
  const editBriefAudioDependencyKeys = editBriefAudioWorkItems.map((item) =>
    item.workItemKey)
  const editBriefAudioRendererLayerIds = editBriefAudioWorkItems.flatMap(
    (item) => item.expectedOutputs[0]!.rendererLayerIds,
  )
  const approvedEditBriefAudioTracks = editBriefAudioWorkItems.map(
    (workItem, index) => {
      const item = editBriefAudioItems[index]!
      return {
        outputKey: workItem.expectedOutputs[0]!.outputKey,
        attachmentId: item.attachmentId,
        markerId: item.markerId,
        markerType: item.markerType,
        startFrame: item.startFrame,
        endFrameExclusive: item.endFrameExclusive,
        fillPolicy: item.fillPolicy,
        mixProfileId: item.mixProfileId,
      }
    },
  )
  const colorWorkItemInputs = useSourceSliceColorDeliveries
    ? approvedLongFormChunkPlan.chunks.map((chunk) => {
        const sourceSlice = chunk.sourceSegments[0]
        if (
          chunk.sourceSegments.length !== 1 ||
          !sourceSlice?.sourceSliceKey ||
          sourceSlice.sourceSequenceItemId !==
            colorDeliverySources[0]!.sourceSequenceItemId
        ) {
          throw new Error(
            'Professional color source-slice work lost its exact approved source authority.',
          )
        }
        return {
          source: colorDeliverySources[0]!,
          sourceIndex: 0,
          sourceSlice: {
            chunkIndex: chunk.chunkIndex,
            chunkCount: chunk.chunkCount,
            sourceSliceKey: sourceSlice.sourceSliceKey,
            trimStartFrame: sourceSlice.sourceStartFrame,
            trimEndFrameExclusive: sourceSlice.sourceEndFrameExclusive,
          },
        }
      })
    : colorDeliverySources.map((source, sourceIndex) => ({
        source,
        sourceIndex,
        sourceSlice: undefined,
      }))
  const colorWorkItems = colorWorkItemInputs.map((
    item,
    colorWorkItemIndex,
  ): CanonicalWorkItemDraft => {
    const ordinal = item.sourceIndex + 1
    const source = item.source
    const sourceSliceSuffix = item.sourceSlice
      ? `-slice-${item.sourceSlice.chunkIndex}-of-${item.sourceSlice.chunkCount}`
      : ''
    const workItemKey = `color-delivery-${ordinal}${sourceSliceSuffix}`
    const outputKey = `${workItemKey}-mkv`
    const segmentId = input.components.segments[item.sourceIndex]!.segmentId
    const rendererLayerId = `color-source-layer-${ordinal}${sourceSliceSuffix}`
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
          trimStartFrame:
            item.sourceSlice?.trimStartFrame ?? source.trimStartFrame,
          trimEndFrameExclusive:
            item.sourceSlice?.trimEndFrameExclusive ??
            source.trimEndFrameExclusive,
          frameRate: input.fps,
          colorGradeStyle: source.colorGradeStyle,
          intensity: source.intensity,
          approvedColorOperationIds: source.approvedColorOperationIds,
          approvedColorOperationKinds: source.approvedColorOperationKinds,
          analysisProfileId: 'approved_three_frame_rgb_stats_v1',
          correctionProfileId: isApprovedColorMatchRecipe(source.recipeProfileId)
            ? 'bounded_reference_matched_professional_source_color_v1'
            : 'bounded_professional_source_color_v1',
          ...(isApprovedColorMatchRecipe(source.recipeProfileId)
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
      dependencyKeys: isApprovedColorMatchRecipe(source.recipeProfileId)
        ? ['color-delivery-1']
        : [],
      approvedToolIds: ['ffmpeg'],
      providerExecutionMode: 'none',
      fallbackPolicy: {},
      maxAttempts: 2,
      attemptTimeoutSeconds: 900,
      scheduledDelaySeconds: 0,
      maximumCreditBudget: budgets[
        2 + captionCues.length + voiceWorkItems.length +
        editBriefAudioWorkItems.length + colorWorkItemIndex
      ]!,
      required: true,
    }
  })
  const colorDependencyKeys = colorWorkItems.map((item) => item.workItemKey)
  const colorRendererLayerIds = colorWorkItems.flatMap((item) =>
    item.expectedOutputs[0]!.rendererLayerIds)
  const controlledDataVizWorkItems: CanonicalWorkItemDraft[] =
    input.controlledDataVizOverlay
      ? [{
          workItemKey: 'controlled-dataviz-overlay',
          workItemType: 'render_chart_asset',
          workerClass: 'controlled_graphics_worker',
          executionInput: {
            operation: 'render_approved_chart',
            approvedToolOperationIds: [
              input.controlledDataVizOverlay.operationId,
            ],
            expectedOutputKeys: [input.controlledDataVizOverlay.outputKey],
            structuredPayload: {
              width: input.controlledDataVizOverlay.intrinsicWidth,
              height: input.controlledDataVizOverlay.intrinsicHeight,
              title: input.controlledDataVizOverlay.title,
              xAxisLabel: input.controlledDataVizOverlay.xAxisLabel,
              yAxisLabel: input.controlledDataVizOverlay.yAxisLabel,
              theme: input.controlledDataVizOverlay.theme,
              data: input.controlledDataVizOverlay.data,
            },
          },
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
          expectedOutputs: [output(
            input.controlledDataVizOverlay.outputKey,
            'controlled_structured_dataviz_svg',
            'generated',
            'image/svg+xml',
            {
              segmentIds: input.controlledDataVizOverlay.segmentIds,
              timingIds: [
                timingId,
                input.controlledDataVizOverlay.visualTimingItemId,
              ],
              rendererLayerIds: [
                input.controlledDataVizOverlay.rendererLayerId,
              ],
            },
          )],
          dependencyKeys: ['snapshot-validation'],
          approvedToolIds: [input.controlledDataVizOverlay.toolId],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 2,
          attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: budgets[
            2 + captionCues.length + voiceWorkItems.length +
            editBriefAudioWorkItems.length + colorWorkItems.length
          ]!,
          required: true,
        }]
      : []
  const controlledDataVizDependencyKeys = controlledDataVizWorkItems.map(
    (item) => item.workItemKey,
  )
  const controlledDataVizRendererLayerIds = controlledDataVizWorkItems.flatMap(
    (item) => item.expectedOutputs[0]!.rendererLayerIds,
  )
  const controlledDataVizTimingIds = [
    ...new Set(controlledDataVizWorkItems.flatMap((item) =>
      item.expectedOutputs[0]!.timingIds)),
  ].filter((id) => id !== timingId)
  const compositionSourceTimeline = colorWorkItems.length > 0
    ? sourceTimeline.map((segment, index) => ({
        ...segment,
        sourceStartFrame: 0,
        sourceEndFrameExclusive: colorDeliverySources[index]!.durationFrames,
      }))
    : sourceTimeline
  const finalBudgetIndex = 2 + captionCues.length + voiceWorkItems.length +
    editBriefAudioWorkItems.length + colorWorkItems.length +
    controlledDataVizWorkItems.length
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
        approvedHardCutTransitions,
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
      ...editBriefAudioWorkItems,
      ...colorWorkItems,
      ...controlledDataVizWorkItems,
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
                  ...(input.approvedSourceTransitions.policy ===
                    'approved_hard_cuts_only'
                    ? {
                        transitionPolicy: 'approved_hard_cuts_only',
                        hardCutTransitions: input.approvedSourceTransitions.transitions,
                      }
                    : {
                        transitionPolicy: 'approved_bounded_source_transitions_v1',
                        sourceTransitions: input.approvedSourceTransitions.transitions,
                      }),
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
            ...(approvedEditBriefAudioTracks.length > 0
              ? {
                  supplementalAudioPolicy:
                    'approved_edit_brief_audio_tracks_v1',
                  supplementalAudioTracks: approvedEditBriefAudioTracks,
                }
              : {}),
            ...(input.controlledDataVizOverlay
              ? {
                  controlledVisualOverlayPolicy:
                    'approved_structured_svg_below_captions_v1',
                  controlledVisualOverlayLayers: [{
                    outputKey: input.controlledDataVizOverlay.outputKey,
                    rendererLayerId:
                      input.controlledDataVizOverlay.rendererLayerId,
                    toolId: input.controlledDataVizOverlay.toolId,
                    startFrame: input.controlledDataVizOverlay.startFrame,
                    endFrameExclusive:
                      input.controlledDataVizOverlay.endFrameExclusive,
                    x: input.controlledDataVizOverlay.x,
                    y: input.controlledDataVizOverlay.y,
                    width: input.controlledDataVizOverlay.width,
                    height: input.controlledDataVizOverlay.height,
                    fit: 'contain',
                    opacity: 1,
                    sourceConfidence:
                      input.controlledDataVizOverlay.sourceConfidence,
                    safeWording: input.controlledDataVizOverlay.safeWording,
                  }],
                }
              : {}),
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
            timingIds: [
              timingId,
              ...transitionTimingIds,
              ...controlledDataVizTimingIds,
            ],
            rendererLayerIds: [
              'source-video-layer',
              ...transitionRendererLayerIds,
              ...colorRendererLayerIds,
              ...voiceRendererLayerIds,
              ...editBriefAudioRendererLayerIds,
              ...controlledDataVizRendererLayerIds,
              ...captionRendererLayerIds,
            ],
          },
        )],
        dependencyKeys: [
          'source-trim-validation',
          ...captionDependencyKeys,
          ...voiceDependencyKeys,
          ...editBriefAudioDependencyKeys,
          ...colorDependencyKeys,
          ...controlledDataVizDependencyKeys,
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
            timingIds: [
              timingId,
              ...transitionTimingIds,
              ...controlledDataVizTimingIds,
            ],
            rendererLayerIds: [
              'source-video-layer',
              ...transitionRendererLayerIds,
              ...colorRendererLayerIds,
              ...voiceRendererLayerIds,
              ...editBriefAudioRendererLayerIds,
              ...controlledDataVizRendererLayerIds,
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
    sourceStartFrame?: number
    sourceEndFrameExclusive?: number
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
  const sourceSliceColorDeliveries =
    sourceSliceProfile &&
    input.cleanupDecisions.length === 1 &&
    input.colorWorkItems.length === input.chunkPlan.chunkCount
  if (
    sourceSliceProfile &&
    input.colorWorkItems.length > 0 &&
    !sourceSliceColorDeliveries &&
    input.colorWorkItems.length !== input.cleanupDecisions.length
  ) {
    throw new Error(
      'Long-form color delivery count does not match its source or source-slice authority.',
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
    if (chunkCaptionEntries.length > 7) {
      throw new Error('Every long-form chunk supports zero through seven exact caption cues.')
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
    const chunkColorWorkItems = sourceSliceColorDeliveries
      ? [input.colorWorkItems[chunkOffset]!]
      : sourceIndices.flatMap((sourceIndex) => {
          const item = input.colorWorkItems[sourceIndex]
          return item ? [item] : []
        })
    const sourceSegments = chunk.sourceSegments.map((segment) => {
      const sourceIndex = sourceIndexById.get(segment.sourceSequenceItemId)
      if (sourceIndex === undefined) {
        throw new Error('Long-form chunk lost approved source order.')
      }
      const cleanup = input.cleanupDecisions[sourceIndex]!
      return {
        sourceSequenceItemId: segment.sourceSequenceItemId,
        sourceStartFrame: sourceSliceColorDeliveries
          ? 0
          : input.colorWorkItems.length > 0
          ? segment.sourceStartFrame - cleanup.startFrame
          : segment.sourceStartFrame,
        sourceEndFrameExclusive: sourceSliceColorDeliveries
          ? segment.sourceEndFrameExclusive - segment.sourceStartFrame
          : input.colorWorkItems.length > 0
          ? segment.sourceEndFrameExclusive - cleanup.startFrame
          : segment.sourceEndFrameExclusive,
        timelineStartFrame: segment.timelineStartFrame,
        timelineEndFrameExclusive: segment.timelineEndFrameExclusive,
      }
    })
    const voiceTracks = input.approvedVoiceTracks
      .filter((track) => sourceIdSet.has(track.sourceSequenceItemId))
      .map((track) => {
        if (!sourceSliceProfile) return track
        const sourceSegment = chunk.sourceSegments.find((segment) =>
          segment.sourceSequenceItemId === track.sourceSequenceItemId)
        const sourceIndex = sourceIndexById.get(track.sourceSequenceItemId)
        if (!sourceSegment || sourceIndex === undefined) {
          throw new Error('Long-form chunk lost source-bound voice slice authority.')
        }
        const cleanup = input.cleanupDecisions[sourceIndex]!
        return {
          ...track,
          sourceStartFrame: sourceSegment.sourceStartFrame - cleanup.startFrame,
          sourceEndFrameExclusive:
            sourceSegment.sourceEndFrameExclusive - cleanup.startFrame,
        }
      })
    const voiceDependencyKeys = sourceIndices.flatMap((sourceIndex) => {
      const item = input.voiceWorkItems[sourceIndex]
      return item ? [item.workItemKey] : []
    })
    const colorDependencyKeys = chunkColorWorkItems.map((item) =>
      item.workItemKey)
    if (
      (input.voiceWorkItems.length > 0 && voiceTracks.length !== sourceIds.length) ||
      (input.colorWorkItems.length > 0 &&
        colorDependencyKeys.length !== sourceIds.length)
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
      ...chunkColorWorkItems.flatMap((item) =>
        item.expectedOutputs[0]?.rendererLayerIds ?? []),
      ...sourceIndices.flatMap((sourceIndex) =>
        input.voiceWorkItems[sourceIndex]?.expectedOutputs[0]?.rendererLayerIds ?? []),
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
  const finalizerVoiceTrack = mezzanineFinalizationProfile
    ? input.approvedVoiceTracks[0]
    : undefined
  const finalizerVoiceWorkItem = mezzanineFinalizationProfile
    ? input.voiceWorkItems[0]
    : undefined
  if (
    mezzanineFinalizationProfile &&
    (!finalizerSource || !finalizerCleanup || input.cleanupDecisions.length !== 1 ||
      finalizerSource.sourceStartFrame !== finalizerCleanup.startFrame ||
      input.chunkPlan.chunks.at(-1)?.sourceSegments[0]?.sourceEndFrameExclusive !==
        finalizerCleanup.endFrameExclusive ||
      input.approvedVoiceTracks.length > 1 ||
      input.voiceWorkItems.length > 1 ||
      Boolean(finalizerVoiceTrack) !== Boolean(finalizerVoiceWorkItem) ||
      (
        finalizerVoiceTrack &&
        (
          finalizerVoiceTrack.sourceSequenceItemId !==
            finalizerSource.sourceSequenceItemId ||
          finalizerVoiceTrack.durationFrames !== input.totalFrames ||
          finalizerVoiceTrack.outputKey !==
            finalizerVoiceWorkItem?.expectedOutputs[0]?.outputKey
        )
      ))
  ) throw new Error(
    'Mezzanine finalization lost its exact approved source, cleanup, or voice authority.',
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
        audioFinalizationPolicy: finalizerVoiceTrack
          ? 'single_approved_voice_delivery_audio_encode_v2'
          : 'single_approved_source_audio_encode_v1',
        ...(finalizerVoiceTrack
          ? { approvedVoiceOutputKey: finalizerVoiceTrack.outputKey }
          : {}),
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
      ...(mezzanineFinalizationProfile && finalizerVoiceWorkItem
        ? [finalizerVoiceWorkItem.workItemKey]
        : []),
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
  editBriefAudioTrackCount: number,
  colorSourceCount: number,
  controlledDataVizCount: number,
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
    ...Array.from({ length: editBriefAudioTrackCount }, () => 2),
    ...Array.from({ length: colorSourceCount }, () => 2),
    ...Array.from({ length: controlledDataVizCount }, () => 1),
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
  if (timingItems.length > 7) return null
  if (timingItems.length === 0) return []
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

function deriveApprovedControlledDataVizOverlay(input: {
  plan: EditPlan
  frame: { width: number; height: number }
  totalFrames: number
  segments: CanonicalPlanComponentsDraft['segments']
}): {
  overlay?: ApprovedControlledDataVizOverlay
  blockers: string[]
} {
  const dataVizPlan = input.plan.dataVizPlan
  const visualAssets = input.plan.visualAssetPlan ?? []
  const dataVizItems = dataVizPlan?.items ?? []
  const hasDataVizIntent =
    dataVizItems.length > 0 ||
    visualAssets.some((asset) => asset.dataVizPlanItemId !== undefined)
  if (visualAssets.length === 0) {
    return hasDataVizIntent
      ? {
          blockers: [
            'Planned visual work must resolve to one exact source-safe D3 or ECharts overlay before private publication.',
          ],
        }
      : { blockers: [] }
  }
  if (!hasDataVizIntent) {
    return {
      blockers: [
        'Planned visual work must resolve to one exact source-safe D3 or ECharts overlay before private publication.',
      ],
    }
  }

  const blocker =
    'Planned visual work must resolve to one exact source-safe D3 or ECharts overlay before private publication.'
  const fail = (): { blockers: string[] } => ({ blockers: [blocker] })
  if (
    dataVizPlan?.active !== true ||
    dataVizItems.length !== 1 ||
    visualAssets.length !== 1 ||
    (input.plan.providerPromptPlans?.length ?? 0) > 0
  ) return fail()

  const item = dataVizItems[0]!
  const asset = visualAssets[0]!
  const toolId = item.preferredTool
  if (
    (toolId !== 'd3' && toolId !== 'echarts') ||
    item.toolIds.length !== 1 ||
    item.toolIds[0] !== toolId ||
    dataVizPlan.toolsPlanned.length !== 1 ||
    dataVizPlan.toolsPlanned[0] !== toolId ||
    asset.dataVizPlanItemId !== item.id ||
    item.visualAssetPlanItemId !== asset.id ||
    (item.assetPlanItemId !== undefined && item.assetPlanItemId !== asset.id) ||
    asset.assetType !== 'graphic_design_frame' ||
    asset.providerRoute.primaryModel !== 'none' ||
    asset.providerRoute.fallbackModels.length !== 0 ||
    asset.providerRoute.fallbackSteps.length !== 0 ||
    asset.providerRoute.veoAllowed !== false
  ) return fail()

  const segment = input.segments.find((candidate) =>
    candidate.segmentId === item.segmentId)
  const visualTimings = input.plan.masterTimingPlan?.visualTimingItems ?? []
  const matchingVisualTimings = visualTimings.filter((timing) =>
    timing.linkedVisualAssetPlanItemId === asset.id)
  const visualTiming = matchingVisualTimings[0]
  if (
    !segment ||
    matchingVisualTimings.length !== 1 ||
    !visualTiming ||
    visualTiming.linkedSegmentId !== segment.segmentId ||
    !['chart_or_diagram', 'graphic_explainer', 'graphic_design_frame']
      .includes(visualTiming.visualType) ||
    !Number.isInteger(visualTiming.timeRange.startFrame) ||
    !Number.isInteger(visualTiming.timeRange.endFrame) ||
    visualTiming.timeRange.startFrame < segment.startFrame ||
    visualTiming.timeRange.endFrame > segment.endFrameExclusive ||
    visualTiming.timeRange.endFrame <= visualTiming.timeRange.startFrame ||
    visualTiming.timeRange.durationFrames !==
      visualTiming.timeRange.endFrame - visualTiming.timeRange.startFrame ||
    visualTiming.timeRange.endFrame > input.totalFrames ||
    (
      asset.plannedDurationFrames !== undefined &&
      asset.plannedDurationFrames !== visualTiming.timeRange.durationFrames
    )
  ) return fail()

  const dataPlan = item.dataPlan
  const sourceConfidence = dataPlan.confidence
  if (
    sourceConfidence !== 'verified' &&
    sourceConfidence !== 'mock' &&
    sourceConfidence !== 'fictional'
  ) return fail()
  const safeWording = dataPlan.safeWording.trim().toLowerCase()
  const confidenceValid =
    (
      sourceConfidence === 'verified' &&
      safeWording === 'verified data' &&
      dataPlan.sourceNeeded === false &&
      dataPlan.mockData === false &&
      dataPlan.fictionalData === false &&
      validatedDataVizText(dataPlan.sourceLabel, 96) !== null &&
      !['unknown', 'mock_demo_data', 'fictional_story_data']
        .includes(dataPlan.dataSourceType)
    ) ||
    (
      sourceConfidence === 'mock' &&
      safeWording === 'mock demo data' &&
      dataPlan.sourceNeeded === false &&
      dataPlan.mockData === true &&
      dataPlan.fictionalData === false &&
      dataPlan.dataSourceType === 'mock_demo_data' &&
      item.title.startsWith('Mock ')
    ) ||
    (
      sourceConfidence === 'fictional' &&
      safeWording === 'fictional story data' &&
      dataPlan.sourceNeeded === false &&
      dataPlan.mockData === false &&
      dataPlan.fictionalData === true &&
      dataPlan.dataSourceType === 'fictional_story_data' &&
      item.title.startsWith('Fictional ')
    )
  if (
    !confidenceValid ||
    dataPlan.nodes.length !== 0 ||
    dataPlan.edges.length !== 0 ||
    dataPlan.dataPoints.length < 1 ||
    dataPlan.dataPoints.length > 12
  ) return fail()

  const title = validatedDataVizText(item.title, 96)
  const seenPointIds = new Set<string>()
  const seenLabels = new Set<string>()
  const data = dataPlan.dataPoints.flatMap((point) => {
    const id = safeOptionalKey(point.id)
    const label = validatedDataVizText(point.label, 48)
    if (
      !id ||
      seenPointIds.has(id) ||
      !label ||
      seenLabels.has(label) ||
      typeof point.value !== 'number' ||
      !Number.isFinite(point.value) ||
      point.value < 0 ||
      point.value > 1_000_000_000 ||
      point.confidence !== sourceConfidence ||
      (
        point.unit !== undefined &&
        validatedDataVizText(point.unit, 48) === null
      )
    ) return []
    seenPointIds.add(id)
    seenLabels.add(label)
    return [{ label, value: point.value }]
  })
  if (!title || data.length !== dataPlan.dataPoints.length) return fail()

  const units = unique(dataPlan.dataPoints.flatMap((point) =>
    point.unit ? [point.unit] : []))
  const yAxisLabel = units.length === 1
    ? validatedDataVizText(units[0], 48)
    : 'Value'
  if (!yAxisLabel) return fail()

  const framePlan = input.plan.aspectRatioFramePlan
  const canvasWidth = framePlan?.canvasWidth
  const canvasHeight = framePlan?.canvasHeight
  const visualZone = item.layout.visualZone ?? framePlan?.visualZone
  const captionSafeZone = item.layout.captionSafeZone ??
    framePlan?.captionSafeZone
  if (
    typeof canvasWidth !== 'number' ||
    typeof canvasHeight !== 'number' ||
    !Number.isInteger(canvasWidth) ||
    !Number.isInteger(canvasHeight) ||
    !canvasWidth ||
    !canvasHeight ||
    canvasWidth < 360 ||
    canvasHeight < 360 ||
    canvasWidth > 7_680 ||
    canvasHeight > 7_680 ||
    !visualZone ||
    !captionSafeZone ||
    !validBoundedRect(visualZone, canvasWidth, canvasHeight) ||
    !validBoundedRect(captionSafeZone, canvasWidth, canvasHeight) ||
    rectanglesIntersect(visualZone, captionSafeZone) ||
    (
      item.layout.visualZone !== undefined &&
      framePlan?.visualZone !== undefined &&
      !sameRect(item.layout.visualZone, framePlan.visualZone)
    ) ||
    (
      item.layout.captionSafeZone !== undefined &&
      framePlan?.captionSafeZone !== undefined &&
      !sameRect(item.layout.captionSafeZone, framePlan.captionSafeZone)
    )
  ) return fail()

  const x = Math.round(visualZone.x * input.frame.width / canvasWidth)
  const y = Math.round(visualZone.y * input.frame.height / canvasHeight)
  const width = Math.round(visualZone.width * input.frame.width / canvasWidth)
  const height = Math.round(
    visualZone.height * input.frame.height / canvasHeight,
  )
  if (
    width < 1 ||
    height < 1 ||
    x < 0 ||
    y < 0 ||
    x + width > input.frame.width ||
    y + height > input.frame.height
  ) return fail()
  const intrinsic = fitControlledDataVizIntrinsicFrame(width, height)
  if (!intrinsic) return fail()

  return {
    blockers: [],
    overlay: {
      toolId,
      operationId: toolId === 'd3' ? D3_OPERATION : ECHARTS_OPERATION,
      outputKey: 'controlled-dataviz-overlay-svg',
      rendererLayerId: 'controlled-dataviz-overlay-layer',
      visualAssetPlanItemId: asset.id,
      dataVizPlanItemId: item.id,
      visualTimingItemId: visualTiming.id,
      segmentIds: [segment.segmentId],
      startFrame: visualTiming.timeRange.startFrame,
      endFrameExclusive: visualTiming.timeRange.endFrame,
      x,
      y,
      width,
      height,
      intrinsicWidth: intrinsic.width,
      intrinsicHeight: intrinsic.height,
      title,
      xAxisLabel: 'Category',
      yAxisLabel,
      theme: dataVizTheme(
        item.layout.panelBackgroundColor ||
          framePlan?.panelBackgroundColor ||
          '#FFFFFF',
      ),
      data,
      sourceConfidence,
      safeWording: safeWording as ApprovedControlledDataVizOverlay['safeWording'],
    },
  }
}

function validatedDataVizText(
  value: string | undefined,
  maximumLength: number,
): string | null {
  if (
    !value ||
    value !== value.trim() ||
    value.length > maximumLength ||
    !/^[\x20-\x7E]+$/.test(value) ||
    /[<>{}\\[\]]/.test(value) ||
    /(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\$\(|`|&&|\|\||#!)/i
      .test(value)
  ) return null
  return value
}

function validBoundedRect(
  rect: { x: number; y: number; width: number; height: number },
  canvasWidth: number,
  canvasHeight: number,
): boolean {
  return [rect.x, rect.y, rect.width, rect.height].every(Number.isInteger) &&
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.x + rect.width <= canvasWidth &&
    rect.y + rect.height <= canvasHeight
}

function sameRect(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
): boolean {
  return left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
}

function rectanglesIntersect(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
): boolean {
  return left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
}

function fitControlledDataVizIntrinsicFrame(
  width: number,
  height: number,
): { width: number; height: number } | null {
  const downScale = Math.min(1, 1_920 / width, 1_080 / height)
  let fittedWidth = Math.round(width * downScale)
  let fittedHeight = Math.round(height * downScale)
  const upScale = Math.max(1, 320 / fittedWidth, 180 / fittedHeight)
  fittedWidth = Math.round(fittedWidth * upScale)
  fittedHeight = Math.round(fittedHeight * upScale)
  if (
    fittedWidth < 320 ||
    fittedWidth > 1_920 ||
    fittedHeight < 180 ||
    fittedHeight > 1_080
  ) return null
  return { width: fittedWidth, height: fittedHeight }
}

function dataVizTheme(value: string): 'light' | 'dark' {
  const match = /^#([a-f0-9]{6})$/i.exec(value.trim())
  if (!match) return 'light'
  const rgb = match[1]!
  const red = Number.parseInt(rgb.slice(0, 2), 16)
  const green = Number.parseInt(rgb.slice(2, 4), 16)
  const blue = Number.parseInt(rgb.slice(4, 6), 16)
  return (red * 299 + green * 587 + blue * 114) / 1_000 >= 140
    ? 'light'
    : 'dark'
}

function hasUnrepresentedVisualTiming(
  plan: EditPlan,
  totalFrames: number,
  controlledDataVizOverlay?: ApprovedControlledDataVizOverlay,
): boolean {
  const visualTimings = plan.masterTimingPlan?.visualTimingItems ?? []
  if (visualTimings.length === 0) return false

  const captionCues = approvedCaptionCues(plan, totalFrames)
  if (!captionCues) return true

  const representedCaptionTimingIds = new Set<string>()
  return visualTimings.some((visualTiming) => {
    if (
      controlledDataVizOverlay &&
      visualTiming.id === controlledDataVizOverlay.visualTimingItemId
    ) return false
    if (
      visualTiming.visualType !== 'caption_only' ||
      visualTiming.linkedVisualAssetPlanItemId !== undefined ||
      visualTiming.timeRange.durationFrames !==
        visualTiming.timeRange.endFrame - visualTiming.timeRange.startFrame
    ) {
      return true
    }

    const matchingCaption = captionCues.find((captionCue) =>
      !representedCaptionTimingIds.has(captionCue.timingId) &&
      captionCue.startFrame === visualTiming.timeRange.startFrame &&
      captionCue.endFrameExclusive === visualTiming.timeRange.endFrame)
    if (!matchingCaption) return true

    representedCaptionTimingIds.add(matchingCaption.timingId)
    return false
  })
}

function hasPlannedMusicDuckingWork(plan: EditPlan): boolean {
  const hasDuckingTiming =
    (plan.masterTimingPlan?.musicDuckingTimingItems.length ?? 0) > 0 ||
    (plan.soundSyncTransitionTimingPlan?.refinedMusicDuckingTimings.length ?? 0) > 0
  if (!hasDuckingTiming) return false

  const musicBed = plan.audioPipelinePlan?.musicBedPlan
  return Boolean(musicBed && (
    musicBed.policy !== 'none' ||
    musicBed.duckingEnabled
  ))
}

function editBriefAudioPlanningPublicationBlockers(input: {
  plan: EditPlan
  binding?: CanonicalEditBriefAudioPlanningBinding
  sourceHasAudio: boolean
}): string[] {
  const blockers: string[] = []
  const audio = input.plan.audioPipelinePlan
  const masterSfx = input.plan.masterTimingPlan?.sfxTimingItems ?? []
  const refinedSfx =
    input.plan.soundSyncTransitionTimingPlan?.refinedSfxTimings ?? []
  const masterDucking =
    input.plan.masterTimingPlan?.musicDuckingTimingItems ?? []
  const refinedDucking =
    input.plan.soundSyncTransitionTimingPlan?.refinedMusicDuckingTimings ?? []
  const plannedMusic = Boolean(
    audio && (
      audio.musicBedPlan.policy !== 'none' ||
      audio.musicBedPlan.duckingEnabled ||
      hasPlannedMusicDuckingWork(input.plan)
    ),
  )
  const plannedSfx = Boolean(
    (audio && (
      audio.sfxPlan.policy !== 'none' ||
      audio.sfxPlan.cues.length > 0 ||
      audio.soundSyncCues.length > 0
    )) ||
    masterSfx.length > 0 ||
    refinedSfx.length > 0
  )

  if (!input.binding) {
    if (plannedSfx) {
      blockers.push(
        'Sound-effect cues need their own canonical execution work items.',
      )
    }
    if (plannedMusic) {
      blockers.push(
        'Music ducking needs its own canonical audio work items.',
      )
    }
    return blockers
  }

  const musicItems = input.binding.items.filter((item) =>
    item.markerType === 'music')
  const sfxItems = input.binding.items.filter((item) =>
    item.markerType === 'sfx')
  const exactRangeMatches = (
    item: CanonicalEditBriefAudioPlanningBinding['items'][number],
    startFrame: number,
    endFrameExclusive: number,
  ) =>
    item.startFrame === startFrame &&
    item.endFrameExclusive === endFrameExclusive
  const rangeFitsMusic = (startFrame: number, endFrameExclusive: number) =>
    musicItems.some((item) =>
      item.startFrame <= startFrame &&
      item.endFrameExclusive >= endFrameExclusive)

  if (musicItems.length > 0) {
    if (!audio || audio.musicBedPlan.policy === 'none') {
      blockers.push(
        'Confirmed Edit Brief music must be represented by the compiled music-bed plan before publication.',
      )
    }
    if (
      input.sourceHasAudio &&
      (
        !audio?.musicBedPlan.duckingEnabled ||
        audio.musicBedPlan.duckingStrength === 'none' ||
        (masterDucking.length === 0 && refinedDucking.length === 0)
      )
    ) {
      blockers.push(
        'Confirmed Edit Brief music over source narration requires exact speech-priority ducking ranges.',
      )
    }
  } else if (plannedMusic) {
    blockers.push(
      'The compiled music plan has no confirmed Edit Brief music attachment and cannot execute.',
    )
  }

  if (sfxItems.length > 0) {
    if (!audio || audio.sfxPlan.policy === 'none') {
      blockers.push(
        'Confirmed Edit Brief sound effects must be represented by the compiled SFX plan before publication.',
      )
    }
    const sfxRanges = unique(
      [...masterSfx, ...refinedSfx].map((item) =>
        `${item.timeRange.startFrame}:${item.timeRange.endFrame}`),
    ).map((range) => {
      const [startFrame, endFrameExclusive] = range.split(':').map(Number)
      return { startFrame: startFrame!, endFrameExclusive: endFrameExclusive! }
    })
    if (
      sfxRanges.length !== sfxItems.length ||
      sfxRanges.some((range) =>
        !sfxItems.some((item) =>
          exactRangeMatches(item, range.startFrame, range.endFrameExclusive))) ||
      sfxItems.some((item) =>
        !sfxRanges.some((range) =>
          exactRangeMatches(item, range.startFrame, range.endFrameExclusive)))
    ) {
      blockers.push(
        'Every confirmed Edit Brief sound effect must match one exact MasterTiming/SoundSync frame range.',
      )
    }
    if (
      audio?.soundSyncCues.some((cue) =>
        !sfxItems.some((item) =>
          item.startFrame === Math.round(cue.timeSeconds * input.binding!.fps)))
    ) {
      blockers.push(
        'SoundSync cue timing must resolve to a confirmed Edit Brief sound-effect marker.',
      )
    }
  } else if (plannedSfx) {
    blockers.push(
      'The compiled SFX plan has no confirmed Edit Brief sound-effect attachment and cannot execute.',
    )
  }

  if (
    masterDucking.some((item) =>
      !rangeFitsMusic(item.timeRange.startFrame, item.timeRange.endFrame)) ||
    refinedDucking.some((item) =>
      !item.voicePriority ||
      !rangeFitsMusic(item.timeRange.startFrame, item.timeRange.endFrame))
  ) {
    blockers.push(
      'Every music-ducking range must stay inside confirmed Edit Brief music and preserve voice priority.',
    )
  }
  if (
    audio && (
      audio.beatSyncPlan.strategy !== 'none' ||
      audio.beatSyncPlan.bpmDetectionPlanned ||
      audio.beatSyncPlan.onsetDetectionPlanned ||
      audio.beatSyncPlan.cues.length > 0
    )
  ) {
    blockers.push(
      'Beat-synchronized uploaded audio remains blocked until exact private analysis evidence is bound to the approved plan.',
    )
  }
  return unique(blockers)
}

function buildApprovedSourceTransitionAuthority(input: {
  plan: EditPlan
  sourceItems: CanonicalSourceAuthorityItem[]
  segments: CanonicalPlanComponentsDraft['segments']
  fps: number
  totalFrames: number
}): ApprovedSourceTransitionAuthority | null {
  const masterTransitions = input.plan.masterTimingPlan?.transitionTimingItems ?? []
  const refinedTransitions =
    input.plan.soundSyncTransitionTimingPlan?.refinedTransitionTimings ?? []
  const expectedCount = Math.max(0, input.sourceItems.length - 1)
  if (expectedCount === 0) {
    return masterTransitions.length === 0 && refinedTransitions.length === 0
      ? { policy: 'approved_hard_cuts_only', transitions: [] }
      : null
  }
  if (
    input.segments.length !== input.sourceItems.length ||
    masterTransitions.length !== expectedCount ||
    refinedTransitions.length !== expectedCount
  ) return null

  const refinedById = new Map(refinedTransitions.map((transition) => [transition.id, transition]))
  const transitionIds = new Set<string>()
  const refinedIds = new Set<string>()
  const approved = masterTransitions.flatMap((transition, index): ApprovedBoundedSourceTransition[] => {
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
      transition.fromSegmentId !== fromSegment.segmentId ||
      transition.toSegmentId !== toSegment.segmentId ||
      transition.timeRange.startFrame > boundaryFrame ||
      transition.timeRange.endFrame < boundaryFrame ||
      transition.timeRange.fps !== input.fps ||
      transition.sfxCueId !== undefined ||
      refined.linkedMasterTransitionTimingItemId !== transition.id ||
      refined.fromSegmentId !== fromSegment.segmentId ||
      refined.toSegmentId !== toSegment.segmentId ||
      refined.timeRange.fps !== input.fps || !refined.phraseBoundaryAligned ||
      refined.riskLevel !== 'low' || refined.sfxCueId !== undefined ||
      refined.beatSnapDecision?.speechSafe !== true ||
      (input.plan.soundSyncTransitionTimingPlan?.refinedSfxTimings ?? []).some(
        (sfx) => sfx.linkedTransitionTimingItemId === refined.id,
      )
    ) return []
    const common = {
      transitionTimingItemId: transition.id,
      refinedTransitionTimingItemId: refined.id,
      fromSegmentId: fromSegment.segmentId,
      toSegmentId: toSegment.segmentId,
      fromSourceSequenceItemId: fromSource.sourceSequenceItemId,
      toSourceSequenceItemId: toSource.sourceSequenceItemId,
      boundaryFrame,
      audioPolicy: 'hard_cut_at_boundary' as const,
    }
    let approvedTransition: ApprovedBoundedSourceTransition
    if (refined.transitionType === 'hard_cut') {
      if (
        transition.transitionType !== 'hard_cut' ||
        transition.timeRange.startFrame !== boundaryFrame ||
        transition.timeRange.endFrame !== boundaryFrame ||
        transition.timeRange.durationFrames !== 0 ||
        refined.timeRange.startFrame !== boundaryFrame ||
        refined.timeRange.endFrame !== boundaryFrame ||
        refined.timeRange.durationFrames !== 0 ||
        refined.durationFrames !== 0
      ) return []
      approvedTransition = {
        ...common,
        transitionType: 'hard_cut',
        startFrame: boundaryFrame,
        endFrameExclusive: boundaryFrame,
        durationFrames: 0,
        visualCurve: 'none',
      }
    } else if (refined.transitionType === 'smooth_panel_dip') {
      const expectedDurationFrames = Math.round(input.fps * 0.4)
      const expectedStartFrame =
        boundaryFrame - Math.floor(expectedDurationFrames / 2)
      const expectedEndFrameExclusive =
        expectedStartFrame + expectedDurationFrames
      if (
        expectedStartFrame < fromSegment.startFrame ||
        expectedEndFrameExclusive > toSegment.endFrameExclusive ||
        refined.timeRange.startFrame !== expectedStartFrame ||
        refined.timeRange.endFrame !== expectedEndFrameExclusive ||
        refined.timeRange.durationFrames !== expectedDurationFrames ||
        refined.durationFrames !== expectedDurationFrames ||
        refined.beatAligned ||
        refined.downbeatAligned ||
        refined.audioMotivated ||
        refined.beatSnapDecision?.requestedFrame !== boundaryFrame ||
        refined.beatSnapDecision.snappedFrame !== boundaryFrame ||
        refined.beatSnapDecision.snapDecision !== 'do_not_snap'
      ) return []
      approvedTransition = {
        ...common,
        transitionType: 'smooth_panel_dip',
        startFrame: expectedStartFrame,
        endFrameExclusive: expectedEndFrameExclusive,
        durationFrames: expectedDurationFrames,
        visualCurve: 'linear_dip_to_panel',
      }
    } else {
      return []
    }
    transitionIds.add(transition.id)
    refinedIds.add(refined.id)
    return [approvedTransition]
  })
  if (approved.length !== expectedCount) return null
  for (let index = 1; index < approved.length; index += 1) {
    if (approved[index - 1]!.endFrameExclusive > approved[index]!.startFrame) {
      return null
    }
  }
  if (approved.every((transition) => transition.transitionType === 'hard_cut')) {
    return {
      policy: 'approved_hard_cuts_only',
      transitions: approved.map((transition) => ({
        transitionTimingItemId: transition.transitionTimingItemId,
        refinedTransitionTimingItemId: transition.refinedTransitionTimingItemId,
        fromSegmentId: transition.fromSegmentId,
        toSegmentId: transition.toSegmentId,
        fromSourceSequenceItemId: transition.fromSourceSequenceItemId,
        toSourceSequenceItemId: transition.toSourceSequenceItemId,
        boundaryFrame: transition.boundaryFrame,
      })),
    }
  }
  return {
    policy: 'approved_bounded_source_transitions_v1',
    transitions: approved,
  }
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
        ? 'approved_source_color_delivery_matroska_v2'
        : 'approved_source_color_match_delivery_matroska_v2',
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

function hasPlannedSourceAudioProcessingWork(plan: EditPlan): boolean {
  const audio = plan.audioPipelinePlan
  return Boolean(audio && (
    audio.projectOperations.length > 0 ||
    audio.clipPlans.some((clip) =>
      clip.cleanupOperations.length > 0 ||
      clip.loudnessOperations.length > 0)
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
  if (!audio || !hasPlannedSourceAudioProcessingWork(input.plan)) return null
  if (
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

function buildExactEditPreferenceInstruction(
  plannerInput: PlannerInput,
): CanonicalPlanComponentsDraft['exactEditPreferenceInstruction'] | undefined {
  const authorityValues = plannerInput.currentEditPreferenceAuthorityValues
  const cleanupPreference = plannerInput.cleanupPreference
  const preferenceSnapshotId = safeOptionalKey(plannerInput.preferenceSnapshotId)
  const preferenceRevision = plannerInput.currentEditPreferenceRevision
  const planningInputRevision =
    plannerInput.currentEditPreferencePlanningInputRevision
  const preferenceFingerprintSha256 =
    plannerInput.currentEditPreferenceFingerprintSha256

  if (
    !authorityValues ||
    !cleanupPreference ||
    !preferenceSnapshotId ||
    !Number.isInteger(preferenceRevision) ||
    Number(preferenceRevision) < 0 ||
    !Number.isInteger(planningInputRevision) ||
    Number(planningInputRevision) < 0 ||
    !SHA256.test(preferenceFingerprintSha256 ?? '')
  ) {
    return undefined
  }

  const effectiveValues: NonNullable<
    PlannerInput['currentEditPreferenceAuthorityValues']
  > = {
    editLevel: plannerInput.editLevel,
    workflowType: plannerInput.workflowType,
    cleanupPreference,
    visualPreference: plannerInput.visualPreference,
    moodStyle: plannerInput.moodStyle,
    creditPreference: plannerInput.creditPreference,
    targetPlatform: plannerInput.targetPlatform,
  }
  const overrideKeys = EXACT_EDIT_PREFERENCE_KEYS.filter(
    (key) => authorityValues[key] !== effectiveValues[key],
  )
  const overrides = Object.fromEntries(
    overrideKeys.map((key) => [key, effectiveValues[key]]),
  ) as Partial<NonNullable<PlannerInput['currentEditPreferenceAuthorityValues']>>

  return {
    schemaVersion: 'canonical-exact-edit-preference-instruction-v1',
    source: overrideKeys.length > 0
      ? 'explicit_chat_setup'
      : 'current_edit_preferences',
    base: {
      preferenceRevision: Number(preferenceRevision),
      planningInputRevision: Number(planningInputRevision),
      preferenceFingerprintSha256: preferenceFingerprintSha256!,
      preferenceSnapshotId,
    },
    effectiveValues,
    overrideKeys: [...overrideKeys],
    overrides,
    browserMutationAuthorityGranted: false,
  }
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

export function containsForbiddenCanonicalPlanningMaterial(
  value: unknown,
  key = '',
): boolean {
  if (
    key === 'pathOrCredentialReturned' ||
    key === 'requestBodyReturned'
  ) return value !== false
  if (isForbiddenCanonicalPlanningKey(key)) return true
  if (Array.isArray(value)) {
    return value.some((entry) =>
      containsForbiddenCanonicalPlanningMaterial(entry))
  }
  if (isRecord(value)) {
    return Object.entries(value).some(([childKey, child]) =>
      containsForbiddenCanonicalPlanningMaterial(child, childKey))
  }
  return false
}

function isForbiddenCanonicalPlanningKey(key: string): boolean {
  const normalized = key.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
  if (!normalized) return false
  if (
    normalized.includes('secret') ||
    normalized.includes('credential') ||
    normalized.includes('url') ||
    normalized.includes('path') ||
    [
      'apikey',
      'accesstoken',
      'refreshtoken',
      'idtoken',
      'servicetoken',
      'authorizationheader',
      'authheader',
    ].some((fragment) => normalized.includes(fragment))
  ) return true
  if ([
    'accesstoken',
    'refreshtoken',
    'idtoken',
    'servicetoken',
    'apitoken',
    'apikey',
    'authorization',
    'cookie',
    'setcookie',
    'sourcebytes',
    'rawbytes',
    'bytesbase64',
    'binarypayload',
    'requestbody',
    'rawprompt',
  ].includes(normalized)) return true
  if (normalized.startsWith('provider')) {
    const providerField = normalized.slice('provider'.length)
    return /^(?:url|endpoint|request(?!count$)|response|prompt|headers?|body|payload|secret|credential|token)/.test(
      providerField,
    )
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
