import type {
  AssetTreatmentPlan,
  BrollIntegrationPlan,
  EditCue,
  EditCueConflictRecord,
  EditCueConflictState,
  EditCuesState,
  OverlayCompositionPlan,
  PlanningContext,
  ProfessionalIntegrationIssue,
  ProfessionalIntegrationState,
  ProfessionalQaCategory,
  ProfessionalQaIssueType,
  ProfessionalQaReport,
  ProfessionalQaReportItem,
  ProfessionalQaRisk,
  ProfessionalQaState,
  ProfessionalQaSummary,
  SourceLibraryAsset,
  SourceLibraryState,
  WorkflowTimeRange,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import {
  createPassedQaItem,
  makeQaItem,
  previewReadinessFromQaStatus,
  qaStatusFromItems,
} from './professional-qa-rules'

type BuildProfessionalQaStateInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  planningContext?: PlanningContext | null
  professionalIntegrationState?: ProfessionalIntegrationState | null
  sourceLibraryState?: SourceLibraryState | null
  editCuesState?: EditCuesState | null
  editCueConflictState?: EditCueConflictState | null
}

type QaItemDraft = {
  category: ProfessionalQaCategory
  type: ProfessionalQaIssueType
  status: ProfessionalQaReportItem['status']
  title: string
  message: string
  suggestedAction?: string
  relatedEditCueId?: string
  relatedMediaAssetId?: string
  relatedConflictId?: string
  relatedTreatmentPlanId?: string
  relatedComplianceCheckId?: string
}

function reportId(projectId: string) {
  return `${projectId}-professional-qa-report`
}

function isOpenBlockingConflict(conflict: EditCueConflictRecord) {
  return conflict.status === 'open' && conflict.severity === 'blocking'
}

function sourceAssetFor(mediaAssetId: string, sourceLibraryState?: SourceLibraryState | null) {
  return sourceLibraryState?.assets.find((asset) => asset.mediaAssetId === mediaAssetId)
}

function cueFor(editCueId: string | undefined, editCuesState?: EditCuesState | null) {
  if (!editCueId) return undefined
  return editCuesState?.cues.find((cue) => cue.id === editCueId)
}

function isDoNotUseSourceAsset(asset?: SourceLibraryAsset) {
  return Boolean(
    asset &&
    (asset.userRole === 'do_not_use' ||
      asset.priority === 'do_not_use' ||
      asset.reviewStatus === 'do_not_use'),
  )
}

function textHasPrivacySignal(value: string | undefined) {
  if (!value) return false
  const normalized = value.toLowerCase()
  return [
    'privacy',
    'private',
    'email',
    'phone',
    'address',
    'login',
    'account',
    'message',
    'sensitive',
    'personal',
    'redact',
    'blur',
  ].some((signal) => normalized.includes(signal))
}

function assetHasPrivacySignal(asset?: SourceLibraryAsset) {
  if (!asset) return false
  return (
    asset.mediaKind === 'screenshot' ||
    asset.mediaKind === 'screen_recording' ||
    asset.tags.some(textHasPrivacySignal) ||
    textHasPrivacySignal(asset.userNotes) ||
    textHasPrivacySignal(asset.aiSummary)
  )
}

function rangeDuration(range?: WorkflowTimeRange) {
  if (!range) return undefined
  return range.endMs - range.startMs
}

function riskToQaDraft(input: {
  risk: ProfessionalQaRisk
  sourceAsset?: SourceLibraryAsset
  relatedEditCueId?: string
  relatedMediaAssetId?: string
  relatedTreatmentPlanId?: string
  relatedComplianceCheckId?: string
  privacyBlur?: boolean
}): QaItemDraft | null {
  const related = {
    relatedEditCueId: input.relatedEditCueId,
    relatedMediaAssetId: input.relatedMediaAssetId,
    relatedTreatmentPlanId: input.relatedTreatmentPlanId,
    relatedComplianceCheckId: input.relatedComplianceCheckId,
  }

  if (input.risk === 'raw_edge_treatment') {
    return {
      ...related,
      category: 'overlay_composition',
      type: 'raw_edge_overlay_risk',
      status: 'warning',
      title: 'Overlay needs polished edge treatment',
      message: 'An overlay may look pasted in unless it receives framing, shadow, or card treatment.',
      suggestedAction: 'Use a professional overlay frame and safe margins.',
    }
  }
  if (input.risk === 'caption_collision') {
    return {
      ...related,
      category: 'caption_safety',
      type: 'caption_collision_risk',
      status: 'warning',
      title: 'Caption collision risk',
      message: 'A planned visual could collide with captions if placement is not protected.',
      suggestedAction: 'Keep overlays outside caption zones.',
    }
  }
  if (input.risk === 'face_collision') {
    return {
      ...related,
      category: 'face_safety',
      type: 'face_collision_risk',
      status: 'warning',
      title: 'Face collision risk',
      message: 'A visual treatment could cover a face or expression.',
      suggestedAction: 'Use face-aware placement or a safer layout.',
    }
  }
  if (input.risk === 'unsafe_zone') {
    return {
      ...related,
      category: 'safe_zone',
      type: 'unsafe_zone_risk',
      status: 'warning',
      title: 'Safe-zone risk',
      message: 'A planned element may sit too close to the frame edge or platform UI area.',
      suggestedAction: 'Keep treatment inside safe margins.',
    }
  }
  if (input.risk === 'unreadable_text') {
    return {
      ...related,
      category: 'readability',
      type: 'unreadable_text_risk',
      status: 'warning',
      title: 'Mobile readability risk',
      message: 'Text-heavy visual content may be too small or dense on mobile.',
      suggestedAction: 'Increase scale, simplify text, or hold the visual longer.',
    }
  }
  if (input.risk === 'privacy_sensitive' && input.privacyBlur !== true && assetHasPrivacySignal(input.sourceAsset)) {
    return {
      ...related,
      category: 'privacy',
      type: 'privacy_blur_missing',
      status: 'warning',
      title: 'Privacy blur may be needed',
      message: 'A screenshot or screen recording may contain private details that should be blurred before preview.',
      suggestedAction: 'Apply blur or redaction treatment.',
    }
  }
  if (input.risk === 'bad_crop') {
    return {
      ...related,
      category: 'asset_treatment',
      type: 'bad_crop_risk',
      status: 'warning',
      title: 'Crop needs review',
      message: 'A clip may need a safer crop to avoid cutting off important content.',
      suggestedAction: 'Use safe crop or fit treatment.',
    }
  }
  if (input.risk === 'low_resolution') {
    return {
      ...related,
      category: 'asset_treatment',
      type: 'low_resolution_risk',
      status: 'warning',
      title: 'Low-resolution risk',
      message: 'An asset may not hold up at the intended scale.',
      suggestedAction: 'Use a smaller placement, replacement asset, or review before render.',
    }
  }
  if (input.risk === 'audio_conflict') {
    return {
      ...related,
      category: 'audio',
      type: 'broll_audio_conflict',
      status: 'warning',
      title: 'Audio conflict risk',
      message: 'B-roll, music, or sound effects could compete with speech.',
      suggestedAction: 'Keep main voice clear and duck supporting audio.',
    }
  }
  if (input.risk === 'hard_audio_cut') {
    return {
      ...related,
      category: 'audio',
      type: 'hard_audio_cut_risk',
      status: 'warning',
      title: 'Hard audio cut risk',
      message: 'Audio treatment should avoid abrupt starts or stops.',
      suggestedAction: 'Use fades or transition-safe trimming.',
    }
  }
  if (input.risk === 'off_brand') {
    return {
      ...related,
      category: 'source_integrity',
      type: 'do_not_use_asset_in_plan',
      status: 'blocking',
      title: 'Do-not-use asset is still referenced',
      message: 'A treatment or cue references an asset that should not be used.',
      suggestedAction: 'Remove the asset from cues and regenerate treatment decisions.',
    }
  }
  if (input.risk === 'timing_mismatch') {
    return {
      ...related,
      category: 'timing',
      type: 'source_mapping_missing',
      status: 'warning',
      title: 'Timing needs review',
      message: 'A planned treatment may need a more reliable timing map before preview.',
      suggestedAction: 'Review cue mapping and rerun QA.',
    }
  }
  return null
}

function professionalIssueToQaDraft(issue: ProfessionalIntegrationIssue): QaItemDraft {
  const related = {
    relatedEditCueId: issue.relatedEditCueId,
    relatedMediaAssetId: issue.relatedMediaAssetId,
    relatedTreatmentPlanId: issue.relatedTreatmentPlanId,
  }
  const status = issue.severity === 'blocking' ? 'blocking' : issue.severity === 'warning' ? 'warning' : 'info'

  if (issue.type === 'privacy_blur_required') {
    return {
      ...related,
      category: 'privacy',
      type: 'privacy_blur_missing',
      status,
      title: 'Privacy treatment needs review',
      message: issue.message,
      suggestedAction: issue.suggestedAction,
    }
  }
  if (issue.type === 'caption_collision_risk') {
    return {
      ...related,
      category: 'caption_safety',
      type: 'caption_collision_risk',
      status,
      title: 'Caption safety needs review',
      message: issue.message,
      suggestedAction: issue.suggestedAction,
    }
  }
  if (issue.type === 'face_collision_risk') {
    return {
      ...related,
      category: 'face_safety',
      type: 'face_collision_risk',
      status,
      title: 'Face safety needs review',
      message: issue.message,
      suggestedAction: issue.suggestedAction,
    }
  }
  if (issue.type === 'audio_conflict_risk') {
    return {
      ...related,
      category: 'audio',
      type: 'broll_audio_conflict',
      status,
      title: 'Audio treatment needs review',
      message: issue.message,
      suggestedAction: issue.suggestedAction,
    }
  }
  if (issue.type === 'low_resolution_risk') {
    return {
      ...related,
      category: 'asset_treatment',
      type: 'low_resolution_risk',
      status,
      title: 'Asset resolution needs review',
      message: issue.message,
      suggestedAction: issue.suggestedAction,
    }
  }
  if (issue.type === 'raw_edge_treatment_risk') {
    return {
      ...related,
      category: 'overlay_composition',
      type: 'raw_edge_overlay_risk',
      status,
      title: 'Overlay treatment needs review',
      message: issue.message,
      suggestedAction: issue.suggestedAction,
    }
  }
  if (issue.type === 'planning_context_blocked' || issue.type === 'unresolved_cue_conflicts') {
    return {
      ...related,
      category: 'planning_readiness',
      type: issue.type === 'unresolved_cue_conflicts' ? 'unresolved_cue_conflict' : 'planning_context_blocked',
      status: 'blocking',
      title: 'Planning is blocked',
      message: issue.message,
      suggestedAction: issue.suggestedAction,
    }
  }

  return {
    ...related,
    category: 'professional_integration',
    type: issue.severity === 'blocking' ? 'professional_integration_blocked' : 'other',
    status,
    title: issue.severity === 'blocking' ? 'Professional Integration is blocked' : 'Professional Integration needs review',
    message: issue.message,
    suggestedAction: issue.suggestedAction,
  }
}

function hasTreatmentForCue(
  cue: EditCue,
  professionalIntegrationState: ProfessionalIntegrationState,
) {
  return [
    ...professionalIntegrationState.assetTreatmentPlans,
    ...professionalIntegrationState.brollIntegrationPlans,
    ...professionalIntegrationState.overlayCompositionPlans,
  ].some((plan) => plan.editCueId === cue.id)
}

function addAssetTreatmentChecks(
  drafts: QaItemDraft[],
  plans: AssetTreatmentPlan[],
  sourceLibraryState?: SourceLibraryState | null,
) {
  plans.forEach((plan) => {
    const sourceAsset = sourceAssetFor(plan.mediaAssetId, sourceLibraryState)
    if (!plan.treatmentSummary.trim()) {
      drafts.push({
        category: 'asset_treatment',
        type: 'untreated_asset',
        status: 'blocking',
        title: 'Asset treatment is missing',
        message: 'An asset treatment exists without an execution summary.',
        suggestedAction: 'Regenerate Professional Integration.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    } else {
      drafts.push({
        category: 'asset_treatment',
        type: 'passed_check',
        status: 'passed',
        title: 'Asset treatment has a plan',
        message: plan.treatmentSummary,
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }

    if (isDoNotUseSourceAsset(sourceAsset)) {
      drafts.push({
        category: 'source_integrity',
        type: 'do_not_use_asset_in_plan',
        status: 'blocking',
        title: 'Do-not-use asset is treated',
        message: `${sourceAsset?.label ?? plan.mediaAssetId} is marked do-not-use but appears in a treatment plan.`,
        suggestedAction: 'Remove this asset from cues or Source Library usage.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }

    if (plan.colorMatch === false && plan.kind !== 'music_treatment' && plan.kind !== 'sound_treatment' && plan.kind !== 'reference_only') {
      drafts.push({
        category: 'style_consistency',
        type: 'color_match_missing',
        status: 'warning',
        title: 'Color match is missing',
        message: 'A visual asset treatment does not include color matching.',
        suggestedAction: 'Enable color match or review the treatment.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }

    plan.qaRisks
      .map((risk) => riskToQaDraft({
        risk,
        sourceAsset,
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
        privacyBlur: plan.privacyBlur,
      }))
      .filter((draft): draft is QaItemDraft => Boolean(draft))
      .forEach((draft) => drafts.push(draft))
  })
}

function addBrollChecks(drafts: QaItemDraft[], plans: BrollIntegrationPlan[]) {
  plans.forEach((plan) => {
    const duration = rangeDuration(plan.targetCleanAssemblyRange)
    if (!plan.keepMainAudio || !plan.muteAssetAudio) {
      drafts.push({
        category: 'audio',
        type: 'broll_audio_conflict',
        status: 'warning',
        title: 'B-roll audio needs review',
        message: 'B-roll should usually protect the main voice and mute source audio unless explicitly needed.',
        suggestedAction: 'Use voice-first mixing or review the cue audio behavior.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
    if (plan.cropMode === 'original') {
      drafts.push({
        category: 'asset_treatment',
        type: 'bad_crop_risk',
        status: 'warning',
        title: 'B-roll crop needs review',
        message: 'Original crop may not fit the output frame professionally.',
        suggestedAction: 'Use safe crop or fill treatment.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
    if (!plan.colorMatch) {
      drafts.push({
        category: 'style_consistency',
        type: 'color_match_missing',
        status: 'warning',
        title: 'B-roll color match is missing',
        message: 'B-roll should be color matched before preview.',
        suggestedAction: 'Enable color match or review treatment.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
    if (!plan.stabilize) {
      drafts.push({
        category: 'asset_treatment',
        type: 'stabilization_needed',
        status: 'warning',
        title: 'Stabilization may be needed',
        message: 'B-roll treatment does not include stabilization.',
        suggestedAction: 'Review whether the asset is stable enough.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
    if (duration !== undefined && duration < 500) {
      drafts.push({
        category: 'timing',
        type: 'timing_too_short',
        status: 'warning',
        title: 'B-roll timing is very short',
        message: 'A B-roll treatment shorter than half a second may feel accidental.',
        suggestedAction: 'Review timing or let the AI adjust it.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
    if (duration !== undefined && duration > 30000) {
      drafts.push({
        category: 'timing',
        type: 'timing_too_long',
        status: 'warning',
        title: 'B-roll timing is long',
        message: 'A long B-roll treatment may need pacing review.',
        suggestedAction: 'Review timing before preview.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }

    if (
      plan.keepMainAudio &&
      plan.muteAssetAudio &&
      plan.cropMode !== 'original' &&
      plan.colorMatch &&
      plan.stabilize
    ) {
      drafts.push({
        category: 'broll_treatment',
        type: 'passed_check',
        status: 'passed',
        title: 'B-roll treatment protects polish',
        message: 'B-roll has safe audio, crop, color match, and stabilization treatment.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
  })
}

function addOverlayChecks(
  drafts: QaItemDraft[],
  plans: OverlayCompositionPlan[],
  sourceLibraryState?: SourceLibraryState | null,
) {
  plans.forEach((plan) => {
    const sourceAsset = sourceAssetFor(plan.mediaAssetId, sourceLibraryState)
    const duration = rangeDuration(plan.targetRange)
    if (!plan.safeZoneAware) {
      drafts.push({
        category: 'safe_zone',
        type: 'unsafe_zone_risk',
        status: 'warning',
        title: 'Overlay safe zone is not protected',
        message: 'Overlay composition should stay inside platform-safe margins.',
        suggestedAction: 'Enable safe-zone aware placement.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
    if (!plan.avoidCaptions) {
      drafts.push({
        category: 'caption_safety',
        type: 'caption_collision_risk',
        status: 'warning',
        title: 'Overlay may collide with captions',
        message: 'Overlay composition does not explicitly avoid caption zones.',
        suggestedAction: 'Enable caption avoidance.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
    if (!plan.avoidFaces) {
      drafts.push({
        category: 'face_safety',
        type: 'face_collision_risk',
        status: 'warning',
        title: 'Overlay may cover faces',
        message: 'Overlay composition does not explicitly avoid faces.',
        suggestedAction: 'Enable face-aware placement.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
    if (!plan.readableOnMobile) {
      drafts.push({
        category: 'readability',
        type: 'unreadable_text_risk',
        status: 'warning',
        title: 'Overlay readability needs review',
        message: 'Overlay text may not be readable on mobile.',
        suggestedAction: 'Increase scale or simplify the overlay.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
    if (plan.frameStyle === 'none') {
      drafts.push({
        category: 'overlay_composition',
        type: 'raw_edge_overlay_risk',
        status: 'warning',
        title: 'Overlay may look pasted in',
        message: 'Overlay composition has no frame style.',
        suggestedAction: 'Use a rounded card, browser frame, or soft shadow.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
    if (assetHasPrivacySignal(sourceAsset) && !plan.privacyBlur) {
      drafts.push({
        category: 'privacy',
        type: 'privacy_blur_missing',
        status: 'warning',
        title: 'Privacy blur may be missing',
        message: 'A screenshot or screen recording overlay may expose private information.',
        suggestedAction: 'Apply blur or redaction before preview.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
    if (duration !== undefined && duration < 500) {
      drafts.push({
        category: 'timing',
        type: 'timing_too_short',
        status: 'warning',
        title: 'Overlay timing is very short',
        message: 'A very short overlay may be unreadable.',
        suggestedAction: 'Extend timing or simplify the visual.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
    if (duration !== undefined && duration > 30000) {
      drafts.push({
        category: 'timing',
        type: 'timing_too_long',
        status: 'warning',
        title: 'Overlay timing is long',
        message: 'A long overlay should be reviewed for pacing and visual fatigue.',
        suggestedAction: 'Review the cue or let the AI adjust timing.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }

    if (
      plan.safeZoneAware &&
      plan.avoidCaptions &&
      plan.avoidFaces &&
      plan.readableOnMobile &&
      plan.frameStyle !== 'none'
    ) {
      drafts.push({
        category: 'overlay_composition',
        type: 'passed_check',
        status: 'passed',
        title: 'Overlay composition is protected',
        message: 'Overlay treatment is safe-zone, caption, face, and readability aware.',
        relatedEditCueId: plan.editCueId,
        relatedMediaAssetId: plan.mediaAssetId,
        relatedTreatmentPlanId: plan.id,
      })
    }
  })
}

function addCueComplianceChecks(drafts: QaItemDraft[], state: ProfessionalIntegrationState) {
  state.cueComplianceChecks.forEach((check) => {
    if (check.status === 'failed') {
      drafts.push({
        category: 'cue_compliance',
        type: 'cue_compliance_failed',
        status: 'blocking',
        title: 'Cue compliance failed',
        message: check.message,
        suggestedAction: 'Resolve the cue or regenerate Professional Integration.',
        relatedEditCueId: check.editCueId,
        relatedTreatmentPlanId: check.id,
        relatedComplianceCheckId: check.id,
      })
    } else if (check.status === 'warning' || check.status === 'pending') {
      drafts.push({
        category: 'cue_compliance',
        type: 'untreated_cue',
        status: 'warning',
        title: 'Cue compliance needs review',
        message: check.message,
        suggestedAction: 'Review this cue treatment before preview.',
        relatedEditCueId: check.editCueId,
        relatedTreatmentPlanId: check.id,
        relatedComplianceCheckId: check.id,
      })
    } else {
      drafts.push({
        category: 'cue_compliance',
        type: 'passed_check',
        status: 'passed',
        title: 'Cue compliance passed',
        message: check.message,
        relatedEditCueId: check.editCueId,
        relatedTreatmentPlanId: check.id,
        relatedComplianceCheckId: check.id,
      })
    }

    check.risks
      .map((risk) => riskToQaDraft({
        risk,
        relatedEditCueId: check.editCueId,
        relatedTreatmentPlanId: check.id,
        relatedComplianceCheckId: check.id,
      }))
      .filter((draft): draft is QaItemDraft => Boolean(draft))
      .forEach((draft) => drafts.push(draft))
  })
}

function addPlanningChecks(
  drafts: QaItemDraft[],
  planningContext?: PlanningContext | null,
  editCueConflictState?: EditCueConflictState | null,
  sourceLibraryState?: SourceLibraryState | null,
) {
  if (!planningContext) {
    drafts.push({
      category: 'planning_readiness',
      type: 'planning_context_blocked',
      status: 'blocking',
      title: 'Planning Context is missing',
      message: 'QA needs Planning Context before preview can be considered ready.',
      suggestedAction: 'Create the AI Edit Plan from Planning Context.',
    })
    return
  }

  drafts.push({
    category: 'planning_readiness',
    type: 'passed_check',
    status: 'passed',
    title: 'Planning Context exists',
    message: 'QA can trace the edit back to Clean Assembly, Source Library, brief, cues, and conflicts.',
  })

  if (planningContext.status === 'blocked' || planningContext.blockingIssueCount > 0) {
    drafts.push({
      category: 'planning_readiness',
      type: 'planning_context_blocked',
      status: 'blocking',
      title: 'Planning Context is blocked',
      message: 'The Planning Context still has blocking issues.',
      suggestedAction: 'Resolve blocking planning issues before preview/generation.',
    })
  }

  planningContext.readinessIssues
    .filter((issue) => issue.severity === 'warning')
    .forEach((issue) => {
      drafts.push({
        category: issue.source === 'source_library' ? 'source_integrity' : 'planning_readiness',
        type: 'style_consistency_warning',
        status: 'warning',
        title: 'Planning readiness warning',
        message: issue.message,
        suggestedAction: issue.suggestedAction,
        relatedEditCueId: issue.relatedEditCueId,
        relatedMediaAssetId: issue.relatedMediaAssetId,
        relatedConflictId: issue.relatedConflictId,
      })
    })

  const blockingConflicts = editCueConflictState?.conflicts.filter(isOpenBlockingConflict) ?? []
  blockingConflicts.forEach((conflict) => {
    drafts.push({
      category: 'cue_compliance',
      type: 'unresolved_cue_conflict',
      status: 'blocking',
      title: 'Blocking cue conflict is unresolved',
      message: conflict.message,
      suggestedAction: conflict.suggestedResolution ?? 'Resolve, ignore, or let AI decide before preview/generation.',
      relatedConflictId: conflict.id,
    })
  })
  if (blockingConflicts.length === 0) {
    drafts.push({
      category: 'cue_compliance',
      type: 'passed_check',
      status: 'passed',
      title: 'No unresolved blocking cue conflicts',
      message: 'Cue conflicts do not currently block preview readiness.',
    })
  }

  if (!planningContext.cleanAssembly.accepted) {
    drafts.push({
      category: 'planning_readiness',
      type: 'style_consistency_warning',
      status: 'warning',
      title: 'Clean Assembly not accepted',
      message: 'Cleanup review has not been accepted yet.',
      suggestedAction: 'Accept cleanup review or review remaining cleanup decisions.',
    })
  }

  if (sourceLibraryState?.sourceLibrary.status !== 'confirmed') {
    drafts.push({
      category: 'source_integrity',
      type: 'style_consistency_warning',
      status: 'warning',
      title: 'Source Library not confirmed',
      message: 'Source Library roles are not confirmed yet.',
      suggestedAction: 'Confirm Source Library roles before final generation.',
    })
  }
}

function addTreatmentCoverageChecks(
  drafts: QaItemDraft[],
  planningContext: PlanningContext | undefined | null,
  professionalIntegrationState: ProfessionalIntegrationState | undefined | null,
  editCuesState?: EditCuesState | null,
) {
  if (!planningContext || !professionalIntegrationState) return

  planningContext.cueUsages
    .filter((usage) => usage.priority === 'must_follow')
    .forEach((usage) => {
      const cue = cueFor(usage.editCueId, editCuesState)
      const compliance = professionalIntegrationState.cueComplianceChecks.find((check) => check.editCueId === usage.editCueId)
      if ((cue && !hasTreatmentForCue(cue, professionalIntegrationState)) || !compliance || compliance.status === 'failed') {
        drafts.push({
          category: 'cue_compliance',
          type: 'untreated_cue',
          status: 'blocking',
          title: 'Must-follow cue needs treatment',
          message: `Must-follow cue "${usage.title}" does not have a safe professional treatment path.`,
          suggestedAction: 'Resolve the cue or regenerate Professional Integration.',
          relatedEditCueId: usage.editCueId,
          relatedComplianceCheckId: compliance?.id,
        })
      }
    })

  planningContext.sourceAssets
    .filter((asset) => asset.status === 'must_use' || asset.status === 'main_footage')
    .forEach((asset) => {
      const hasTreatment = professionalIntegrationState.assetTreatmentPlans.some((plan) => plan.mediaAssetId === asset.mediaAssetId)
      if (!hasTreatment) {
        drafts.push({
          category: 'asset_treatment',
          type: 'untreated_asset',
          status: 'blocking',
          title: 'Required asset has no treatment',
          message: `${asset.label} is required for planning but has no asset treatment plan.`,
          suggestedAction: 'Regenerate Professional Integration or review Source Library roles.',
          relatedMediaAssetId: asset.mediaAssetId,
        })
      }
    })
}

function addDoNotUseCueChecks(
  drafts: QaItemDraft[],
  editCuesState?: EditCuesState | null,
  sourceLibraryState?: SourceLibraryState | null,
) {
  editCuesState?.cues.forEach((cue) => {
    cue.assetRefs.forEach((assetRef) => {
      const sourceAsset = sourceAssetFor(assetRef.mediaAssetId, sourceLibraryState)
      if (isDoNotUseSourceAsset(sourceAsset)) {
        drafts.push({
          category: 'source_integrity',
          type: 'do_not_use_asset_in_plan',
          status: 'blocking',
          title: 'Cue uses a do-not-use asset',
          message: `${sourceAsset?.label ?? assetRef.label ?? assetRef.mediaAssetId} is attached to cue "${cue.title}" but is marked do-not-use.`,
          suggestedAction: 'Remove the asset from the cue or change Source Library direction.',
          relatedEditCueId: cue.id,
          relatedMediaAssetId: assetRef.mediaAssetId,
        })
      }
    })
  })
}

function buildReportSummary(status: ProfessionalQaReport['status'], counts: {
  blocking: number
  warning: number
  acceptedWarning: number
  passed: number
}) {
  if (status === 'blocked') return `QA found ${counts.blocking} blocking issue${counts.blocking === 1 ? '' : 's'} that should be resolved before preview/generation.`
  if (status === 'needs_review') return `QA found ${counts.warning} warning${counts.warning === 1 ? '' : 's'} to review before preview.`
  if (status === 'accepted_with_warnings') return `QA warnings were accepted locally; preview planning can continue with caution.`
  if (status === 'passed') return `QA passed with ${counts.passed} passed check${counts.passed === 1 ? '' : 's'}.`
  return 'Run QA before treating the preview as ready.'
}

export function summarizeProfessionalQa(
  report: ProfessionalQaReport | null,
  items: ProfessionalQaReportItem[],
): ProfessionalQaSummary {
  const status = report?.status ?? qaStatusFromItems(items)
  const categories = Array.from(new Set(items.map((item) => item.category))).map((category) => {
    const categoryItems = items.filter((item) => item.category === category)
    return {
      category,
      total: categoryItems.length,
      blocking: categoryItems.filter((item) => item.status === 'blocking').length,
      warning: categoryItems.filter((item) => item.status === 'warning').length,
      passed: categoryItems.filter((item) => item.status === 'passed').length,
      info: categoryItems.filter((item) => item.status === 'info').length,
    }
  })
  const blockingCount = items.filter((item) => item.status === 'blocking').length
  const warningCount = items.filter((item) => item.status === 'warning').length
  const acceptedWarningCount = items.filter((item) => item.status === 'accepted_warning').length
  const passedCount = items.filter((item) => item.status === 'passed').length
  const nextRecommendedActions: string[] = []

  if (!report) nextRecommendedActions.push('Run QA')
  if (blockingCount > 0) nextRecommendedActions.push('Resolve blocking QA issues')
  if (items.some((item) => item.type === 'professional_integration_missing')) nextRecommendedActions.push('Create/accept Professional Integration')
  if (items.some((item) => item.type === 'unresolved_cue_conflict')) nextRecommendedActions.push('Review cue conflicts')
  if (warningCount > 0) nextRecommendedActions.push('Accept warnings or update treatment decisions')
  if (blockingCount === 0 && warningCount === 0 && report) nextRecommendedActions.push('Continue to preview planning')

  return {
    status,
    totalItems: items.length,
    blockingCount,
    warningCount,
    infoCount: items.filter((item) => item.status === 'info').length,
    passedCount,
    acceptedWarningCount,
    categories,
    previewReadiness: previewReadinessFromQaStatus(status),
    nextRecommendedActions: Array.from(new Set(nextRecommendedActions)),
  }
}

export function buildProfessionalQaState(input: BuildProfessionalQaStateInput): ProfessionalQaState {
  const id = reportId(input.projectId)
  const drafts: QaItemDraft[] = []

  addPlanningChecks(drafts, input.planningContext, input.editCueConflictState, input.sourceLibraryState)

  if (!input.professionalIntegrationState?.professionalIntegrationPlan) {
    drafts.push({
      category: 'professional_integration',
      type: 'professional_integration_missing',
      status: 'blocking',
      title: 'Professional Integration is missing',
      message: 'QA needs treatment decisions before preview can be considered ready.',
      suggestedAction: 'Create Professional Integration from the Planning Context.',
    })
  } else {
    drafts.push({
      category: 'professional_integration',
      type: 'passed_check',
      status: 'passed',
      title: 'Professional Integration exists',
      message: 'QA can evaluate treatment decisions for assets, B-roll, overlays, and cue compliance.',
    })

    if (
      input.professionalIntegrationState.summary.status === 'blocked' ||
      input.professionalIntegrationState.summary.blockingIssueCount > 0
    ) {
      drafts.push({
        category: 'professional_integration',
        type: 'professional_integration_blocked',
        status: 'blocking',
        title: 'Professional Integration is blocked',
        message: 'Treatment decisions still have blocking issues.',
        suggestedAction: 'Resolve Professional Integration blockers and rerun QA.',
      })
    }

    if (input.professionalIntegrationState.summary.status === 'needs_review') {
      drafts.push({
        category: 'professional_integration',
        type: 'style_consistency_warning',
        status: 'warning',
        title: 'Professional Integration needs review',
        message: 'Some treatment decisions have warnings.',
        suggestedAction: 'Review treatment warnings or accept them locally.',
      })
    }

    input.professionalIntegrationState.issues
      .map(professionalIssueToQaDraft)
      .forEach((draft) => drafts.push(draft))

    addCueComplianceChecks(drafts, input.professionalIntegrationState)
    addAssetTreatmentChecks(drafts, input.professionalIntegrationState.assetTreatmentPlans, input.sourceLibraryState)
    addBrollChecks(drafts, input.professionalIntegrationState.brollIntegrationPlans)
    addOverlayChecks(drafts, input.professionalIntegrationState.overlayCompositionPlans, input.sourceLibraryState)
  }

  addTreatmentCoverageChecks(
    drafts,
    input.planningContext,
    input.professionalIntegrationState,
    input.editCuesState,
  )
  addDoNotUseCueChecks(drafts, input.editCuesState, input.sourceLibraryState)

  const items = drafts.map((draft, index) =>
    draft.status === 'passed'
      ? createPassedQaItem({
          ...draft,
          projectId: input.projectId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          reportId: id,
          index: index + 1,
        })
      : makeQaItem({
          ...draft,
          projectId: input.projectId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          reportId: id,
          index: index + 1,
        }),
  )
  const status = qaStatusFromItems(items)
  const counts = {
    blocking: items.filter((item) => item.status === 'blocking').length,
    warning: items.filter((item) => item.status === 'warning').length,
    acceptedWarning: items.filter((item) => item.status === 'accepted_warning').length,
    passed: items.filter((item) => item.status === 'passed').length,
  }
  const report: ProfessionalQaReport = {
    id,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    planningContextId: input.planningContext?.id,
    professionalIntegrationPlanId: input.professionalIntegrationState?.professionalIntegrationPlan?.id,
    status,
    itemIds: items.map((item) => item.id),
    summary: buildReportSummary(status, counts),
    blockingCount: counts.blocking,
    warningCount: counts.warning,
    passedCount: counts.passed,
    acceptedWarningCount: counts.acceptedWarning,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }

  return {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    report,
    items,
    operations: [],
    summary: summarizeProfessionalQa(report, items),
    updatedAt: MOCK_CREATED_AT,
  }
}
