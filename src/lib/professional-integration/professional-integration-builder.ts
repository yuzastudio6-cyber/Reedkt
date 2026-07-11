import type {
  AssetTreatmentPlan,
  BrollIntegrationPlan,
  ContextAwareMockEditPlanResult,
  CueComplianceCheck,
  EditCuesState,
  OverlayCompositionPlan,
  PlanningContext,
  ProfessionalIntegrationIssue,
  ProfessionalIntegrationIssueType,
  ProfessionalIntegrationPlan,
  ProfessionalIntegrationState,
  ProfessionalIntegrationSummary,
  ProfessionalQaRisk,
  SourceLibraryState,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import { buildAssetTreatmentPlans } from './asset-treatment-planner'
import {
  buildBrollIntegrationPlans,
  buildCueComplianceChecks,
  buildOverlayCompositionPlans,
} from './cue-treatment-planner'
import {
  getProfessionalIntegrationNextActions,
  getProfessionalIntegrationReadinessStatus,
} from './professional-integration-readiness'

type BuildProfessionalIntegrationStateInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  planningContext: PlanningContext | null
  sourceLibraryState?: SourceLibraryState | null
  editCuesState?: EditCuesState | null
  contextAwarePlanResult?: ContextAwareMockEditPlanResult | null
}

type ProfessionalIntegrationIssueDraft = Omit<ProfessionalIntegrationIssue, 'id'>

function planId(projectId: string) {
  return `${projectId}-professional-integration-plan`
}

function issueId(projectId: string, index: number) {
  return `${projectId}-professional-integration-issue-${String(index).padStart(3, '0')}`
}

function createIssues(projectId: string, drafts: ProfessionalIntegrationIssueDraft[]) {
  return drafts.map((issue, index): ProfessionalIntegrationIssue => ({
    ...issue,
    id: issueId(projectId, index + 1),
  }))
}

function riskIssueType(risk: ProfessionalQaRisk): ProfessionalIntegrationIssueType {
  if (risk === 'privacy_sensitive') return 'privacy_blur_required'
  if (risk === 'caption_collision') return 'caption_collision_risk'
  if (risk === 'face_collision') return 'face_collision_risk'
  if (risk === 'audio_conflict' || risk === 'hard_audio_cut') return 'audio_conflict_risk'
  if (risk === 'low_resolution') return 'low_resolution_risk'
  if (risk === 'raw_edge_treatment') return 'raw_edge_treatment_risk'
  return 'other'
}

function riskMessage(risk: ProfessionalQaRisk) {
  if (risk === 'privacy_sensitive') return 'Privacy-sensitive content should receive blur or redaction treatment.'
  if (risk === 'caption_collision') return 'An overlay could collide with captions if it is not composed carefully.'
  if (risk === 'face_collision') return 'An overlay could cover faces or expressions if it is not placed carefully.'
  if (risk === 'audio_conflict') return 'Audio treatment should protect speech clarity.'
  if (risk === 'hard_audio_cut') return 'Sound or music should avoid hard cuts.'
  if (risk === 'low_resolution') return 'An asset may need scale or resolution review before render.'
  if (risk === 'raw_edge_treatment') return 'Overlay assets should avoid raw pasted edges.'
  if (risk === 'bad_crop') return 'B-roll crop should be checked for professional framing.'
  if (risk === 'unsafe_zone') return 'Treatment should preserve safe margins.'
  if (risk === 'unreadable_text') return 'Text-heavy visuals should stay readable on mobile.'
  if (risk === 'off_brand') return 'Asset treatment should avoid off-brand or do-not-use material.'
  return 'Professional treatment should review this item before generation.'
}

function riskSuggestedAction(risk: ProfessionalQaRisk) {
  if (risk === 'privacy_sensitive') return 'Apply blur/redaction and confirm the overlay treatment.'
  if (risk === 'caption_collision') return 'Keep overlays outside caption zones.'
  if (risk === 'face_collision') return 'Use face-aware placement or a safer layout.'
  if (risk === 'audio_conflict' || risk === 'hard_audio_cut') return 'Use voice-first mixing and smooth transitions.'
  if (risk === 'raw_edge_treatment') return 'Use a framed card, soft shadow, or polished overlay treatment.'
  return 'Review the generated treatment before approval.'
}

function uniqueRiskIssues(input: {
  projectId: string
  assetTreatmentPlans: AssetTreatmentPlan[]
  cueComplianceChecks: CueComplianceCheck[]
}): ProfessionalIntegrationIssueDraft[] {
  const issues = new Map<string, ProfessionalIntegrationIssueDraft>()

  input.assetTreatmentPlans.forEach((plan) => {
    plan.qaRisks.forEach((risk) => {
      const type = riskIssueType(risk)
      if (type === 'other' && risk !== 'bad_crop' && risk !== 'unsafe_zone' && risk !== 'unreadable_text') return
      const key = `${type}:${plan.mediaAssetId}`
      if (!issues.has(key)) {
        issues.set(key, {
          projectId: input.projectId,
          severity: risk === 'off_brand' ? 'blocking' : 'warning',
          type,
          message: riskMessage(risk),
          suggestedAction: riskSuggestedAction(risk),
          relatedEditCueId: plan.editCueId,
          relatedMediaAssetId: plan.mediaAssetId,
          relatedTreatmentPlanId: plan.id,
        })
      }
    })
  })

  input.cueComplianceChecks.forEach((check) => {
    check.risks.forEach((risk) => {
      const type = riskIssueType(risk)
      const key = `${type}:${check.editCueId}`
      if (!issues.has(key)) {
        issues.set(key, {
          projectId: input.projectId,
          severity: check.status === 'failed' ? 'blocking' : 'warning',
          type,
          message: riskMessage(risk),
          suggestedAction: riskSuggestedAction(risk),
          relatedEditCueId: check.editCueId,
          relatedTreatmentPlanId: check.id,
        })
      }
    })
  })

  return Array.from(issues.values())
}

export function getProfessionalIntegrationIssues(input: {
  projectId: string
  planningContext: PlanningContext | null
  assetTreatmentPlans: AssetTreatmentPlan[]
  brollIntegrationPlans: BrollIntegrationPlan[]
  overlayCompositionPlans: OverlayCompositionPlan[]
  cueComplianceChecks: CueComplianceCheck[]
}): ProfessionalIntegrationIssue[] {
  const drafts: ProfessionalIntegrationIssueDraft[] = []

  if (!input.planningContext) {
    drafts.push({
      projectId: input.projectId,
      severity: 'blocking',
      type: 'missing_planning_context',
      message: 'Professional Integration needs a Planning Context before treatment decisions can be created.',
      suggestedAction: 'Create the AI Edit Plan from Planning Context first.',
    })
    return createIssues(input.projectId, drafts)
  }

  if (input.planningContext.status === 'blocked') {
    drafts.push({
      projectId: input.projectId,
      severity: 'blocking',
      type: 'planning_context_blocked',
      message: 'The Planning Context has blocking issues.',
      suggestedAction: 'Resolve blocking planning issues before generation.',
    })
  }

  if (input.planningContext.unresolvedConflictIds.length > 0) {
    drafts.push({
      projectId: input.projectId,
      severity: 'blocking',
      type: 'unresolved_cue_conflicts',
      message: 'There are unresolved cue conflicts in the Planning Context.',
      suggestedAction: 'Resolve or explicitly ignore cue conflicts before generation.',
    })
  }

  input.planningContext.cueUsages
    .filter((cue) => cue.priority === 'must_follow')
    .forEach((cue) => {
      const compliance = input.cueComplianceChecks.find((check) => check.editCueId === cue.editCueId)
      if (!compliance || compliance.status !== 'passed') {
        drafts.push({
          projectId: input.projectId,
          severity: cue.status === 'blocked' ? 'blocking' : 'warning',
          type: 'untreated_must_follow_cue',
          message: `Must-follow cue "${cue.title}" needs a clean professional treatment path.`,
          suggestedAction: 'Review the cue or regenerate Professional Integration after resolving cue issues.',
          relatedEditCueId: cue.editCueId,
          relatedTreatmentPlanId: compliance?.id,
        })
      }
    })

  input.planningContext.sourceAssets
    .filter((asset) => asset.status === 'must_use' || asset.status === 'main_footage')
    .forEach((asset) => {
      const treatment = input.assetTreatmentPlans.find((plan) => plan.mediaAssetId === asset.mediaAssetId)
      if (!treatment) {
        drafts.push({
          projectId: input.projectId,
          severity: 'warning',
          type: 'untreated_must_use_asset',
          message: `Must-use source asset "${asset.label}" needs a treatment decision.`,
          suggestedAction: 'Regenerate Professional Integration or review Source Library roles.',
          relatedMediaAssetId: asset.mediaAssetId,
        })
      }
    })

  input.cueComplianceChecks
    .filter((check) => check.status === 'warning' || check.status === 'failed')
    .forEach((check) => {
      drafts.push({
        projectId: input.projectId,
        severity: check.status === 'failed' ? 'blocking' : 'warning',
        type: check.status === 'failed' ? 'untreated_must_follow_cue' : 'other',
        message: check.message,
        suggestedAction: check.status === 'failed'
          ? 'Resolve the blocked cue before generation.'
          : 'Review this cue treatment before generation.',
        relatedEditCueId: check.editCueId,
        relatedTreatmentPlanId: check.id,
      })
    })

  drafts.push(...uniqueRiskIssues({
    projectId: input.projectId,
    assetTreatmentPlans: input.assetTreatmentPlans,
    cueComplianceChecks: input.cueComplianceChecks,
  }))

  return createIssues(input.projectId, drafts)
}

export function summarizeProfessionalIntegration(state: ProfessionalIntegrationState): ProfessionalIntegrationSummary {
  const qaRiskCount = [
    ...state.assetTreatmentPlans.flatMap((plan) => plan.qaRisks),
    ...state.cueComplianceChecks.flatMap((check) => check.risks),
  ].length
  const blockingIssueCount = state.issues.filter((issue) => issue.severity === 'blocking').length
  const warningIssueCount = state.issues.filter((issue) => issue.severity === 'warning').length
  const summaryBase: ProfessionalIntegrationSummary = {
    status: 'draft',
    assetTreatmentCount: state.assetTreatmentPlans.length,
    brollTreatmentCount: state.brollIntegrationPlans.length,
    overlayTreatmentCount: state.overlayCompositionPlans.length,
    cueComplianceCheckCount: state.cueComplianceChecks.length,
    passedCueComplianceCount: state.cueComplianceChecks.filter((check) => check.status === 'passed').length,
    warningCueComplianceCount: state.cueComplianceChecks.filter((check) => check.status === 'warning').length,
    failedCueComplianceCount: state.cueComplianceChecks.filter((check) => check.status === 'failed').length,
    qaRiskCount,
    blockingIssueCount,
    warningIssueCount,
    accepted: state.operations.some((operation) =>
      operation.type === 'accept_integration_plan' &&
      operation.status === 'applied',
    ),
    nextRecommendedActions: [],
  }
  const withBaseSummary = { ...state, summary: summaryBase }
  const status = getProfessionalIntegrationReadinessStatus(withBaseSummary)

  return {
    ...summaryBase,
    status,
    nextRecommendedActions: getProfessionalIntegrationNextActions({
      ...withBaseSummary,
      summary: { ...summaryBase, status },
    }),
  }
}

function buildPlanSummary(planningContext: PlanningContext) {
  const usableCueCount = planningContext.cueUsages.filter((cue) =>
    cue.status === 'will_use' ||
    cue.status === 'will_adjust',
  ).length

  return `Professional Integration will treat Clean Assembly v${planningContext.cleanAssembly.version}, ${planningContext.sourceAssets.length} source assets, and ${usableCueCount} usable cue inputs with crop, placement, safe-zone, audio, color, motion, and privacy decisions before render.`
}

export function buildProfessionalIntegrationState(
  input: BuildProfessionalIntegrationStateInput,
): ProfessionalIntegrationState {
  if (!input.planningContext) {
    const initialState: ProfessionalIntegrationState = {
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      professionalIntegrationPlan: null,
      assetTreatmentPlans: [],
      brollIntegrationPlans: [],
      overlayCompositionPlans: [],
      cueComplianceChecks: [],
      issues: getProfessionalIntegrationIssues({
        projectId: input.projectId,
        planningContext: null,
        assetTreatmentPlans: [],
        brollIntegrationPlans: [],
        overlayCompositionPlans: [],
        cueComplianceChecks: [],
      }),
      operations: [],
      summary: {
        status: 'blocked',
        assetTreatmentCount: 0,
        brollTreatmentCount: 0,
        overlayTreatmentCount: 0,
        cueComplianceCheckCount: 0,
        passedCueComplianceCount: 0,
        warningCueComplianceCount: 0,
        failedCueComplianceCount: 0,
        qaRiskCount: 0,
        blockingIssueCount: 1,
        warningIssueCount: 0,
        accepted: false,
        nextRecommendedActions: ['Create Planning Context'],
      },
      updatedAt: MOCK_CREATED_AT,
    }
    return initialState
  }

  const professionalIntegrationPlanId = planId(input.projectId)
  const assetTreatmentPlans = buildAssetTreatmentPlans({
    professionalIntegrationPlanId,
    planningContext: input.planningContext,
    sourceLibraryState: input.sourceLibraryState,
    editCuesState: input.editCuesState,
  })
  const brollIntegrationPlans = buildBrollIntegrationPlans({
    professionalIntegrationPlanId,
    planningContext: input.planningContext,
    sourceLibraryState: input.sourceLibraryState,
    editCuesState: input.editCuesState,
  })
  const overlayCompositionPlans = buildOverlayCompositionPlans({
    professionalIntegrationPlanId,
    planningContext: input.planningContext,
    sourceLibraryState: input.sourceLibraryState,
    editCuesState: input.editCuesState,
  })
  const cueComplianceChecks = buildCueComplianceChecks({
    professionalIntegrationPlanId,
    planningContext: input.planningContext,
    sourceLibraryState: input.sourceLibraryState,
    editCuesState: input.editCuesState,
    assetTreatmentPlans,
    brollIntegrationPlans,
    overlayCompositionPlans,
  })
  const issues = getProfessionalIntegrationIssues({
    projectId: input.projectId,
    planningContext: input.planningContext,
    assetTreatmentPlans,
    brollIntegrationPlans,
    overlayCompositionPlans,
    cueComplianceChecks,
  })
  const professionalIntegrationPlan: ProfessionalIntegrationPlan = {
    id: professionalIntegrationPlanId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    cleanAssemblyId: input.planningContext.cleanAssembly.cleanAssemblyId,
    editBriefId: input.planningContext.editBrief?.editBriefId,
    editCueIds: input.planningContext.cueUsages.map((cue) => cue.editCueId),
    status: input.planningContext.status === 'blocked' ? 'draft' : 'ready',
    assetTreatmentPlanIds: assetTreatmentPlans.map((plan) => plan.id),
    brollIntegrationPlanIds: brollIntegrationPlans.map((plan) => plan.id),
    overlayCompositionPlanIds: overlayCompositionPlans.map((plan) => plan.id),
    cueComplianceCheckIds: cueComplianceChecks.map((check) => check.id),
    summary: buildPlanSummary(input.planningContext),
    createdFromModel: input.contextAwarePlanResult ? 'context-aware-mock-planner' : 'local-professional-integration-mock',
    version: 1,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
  const draftState: ProfessionalIntegrationState = {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    planningContextId: input.planningContext.id,
    professionalIntegrationPlan,
    assetTreatmentPlans,
    brollIntegrationPlans,
    overlayCompositionPlans,
    cueComplianceChecks,
    issues,
    operations: [],
    summary: {
      status: 'draft',
      assetTreatmentCount: assetTreatmentPlans.length,
      brollTreatmentCount: brollIntegrationPlans.length,
      overlayTreatmentCount: overlayCompositionPlans.length,
      cueComplianceCheckCount: cueComplianceChecks.length,
      passedCueComplianceCount: cueComplianceChecks.filter((check) => check.status === 'passed').length,
      warningCueComplianceCount: cueComplianceChecks.filter((check) => check.status === 'warning').length,
      failedCueComplianceCount: cueComplianceChecks.filter((check) => check.status === 'failed').length,
      qaRiskCount: 0,
      blockingIssueCount: 0,
      warningIssueCount: 0,
      accepted: false,
      nextRecommendedActions: [],
    },
    updatedAt: MOCK_CREATED_AT,
  }

  return {
    ...draftState,
    summary: summarizeProfessionalIntegration(draftState),
  }
}
