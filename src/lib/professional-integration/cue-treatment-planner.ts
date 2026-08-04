import type {
  AssetTreatmentPlan,
  BrollIntegrationPlan,
  CueComplianceCheck,
  EditCue,
  EditCueVisualPlacement,
  EditCuesState,
  OverlayCompositionPlan,
  PlanningContext,
  PlanningCueUsage,
  SourceLibraryState,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import {
  getDefaultCropModeForRole,
  getDefaultOverlayFrameStyle,
  getDefaultPlacementForRole,
  getDefaultTransitionTreatment,
  getProfessionalQaRisksForCue,
  roleRequiresProfessionalTreatment,
  roleUsesBrollTreatment,
  roleUsesOverlayTreatment,
  shouldApplyPrivacyBlur,
} from './professional-treatment-rules'

type BuildCueTreatmentInput = {
  professionalIntegrationPlanId: string
  planningContext: PlanningContext
  editCuesState?: EditCuesState | null
  sourceLibraryState?: SourceLibraryState | null
}

type BuildComplianceInput = BuildCueTreatmentInput & {
  brollIntegrationPlans: BrollIntegrationPlan[]
  overlayCompositionPlans: OverlayCompositionPlan[]
  assetTreatmentPlans: AssetTreatmentPlan[]
}

function brollId(planId: string, index: number) {
  return `${planId}-broll-treatment-${String(index).padStart(3, '0')}`
}

function overlayId(planId: string, index: number) {
  return `${planId}-overlay-treatment-${String(index).padStart(3, '0')}`
}

function complianceId(planId: string, index: number) {
  return `${planId}-cue-compliance-${String(index).padStart(3, '0')}`
}

function cueFor(usage: PlanningCueUsage, editCuesState?: EditCuesState | null) {
  return editCuesState?.cues.find((cue) => cue.id === usage.editCueId)
}

function sourceAssetFor(mediaAssetId: string | undefined, sourceLibraryState?: SourceLibraryState | null) {
  if (!mediaAssetId) return undefined
  return sourceLibraryState?.assets.find((asset) => asset.mediaAssetId === mediaAssetId)
}

function firstMediaAssetId(cue?: EditCue) {
  return cue?.assetRefs[0]?.mediaAssetId
}

function isUsableCue(usage: PlanningCueUsage) {
  return usage.status === 'will_use' || usage.status === 'will_adjust'
}

function shouldMuteAssetAudio(cue?: EditCue) {
  return cue?.audioBehavior !== 'use_asset_audio' && cue?.audioBehavior !== 'mix_both'
}

function mapPlacement(placement?: EditCueVisualPlacement): OverlayCompositionPlan['placement'] | undefined {
  if (!placement) return undefined
  if (placement === 'full_screen' || placement === 'background') return 'center'
  return placement
}

function boundingBoxForPlacement(placement: OverlayCompositionPlan['placement']) {
  if (placement === 'left') return { x: 0.07, y: 0.2, width: 0.36, height: 0.56 }
  if (placement === 'right') return { x: 0.57, y: 0.2, width: 0.36, height: 0.56 }
  if (placement === 'top') return { x: 0.16, y: 0.08, width: 0.68, height: 0.24 }
  if (placement === 'bottom' || placement === 'lower_third') return { x: 0.12, y: 0.68, width: 0.76, height: 0.2 }
  if (placement === 'upper_third') return { x: 0.12, y: 0.12, width: 0.76, height: 0.2 }
  return { x: 0.18, y: 0.22, width: 0.64, height: 0.48 }
}

export function buildBrollIntegrationPlans(input: BuildCueTreatmentInput): BrollIntegrationPlan[] {
  return input.planningContext.cueUsages
    .filter((usage) => isUsableCue(usage) && roleUsesBrollTreatment(usage.role))
    .flatMap((usage) => {
      const cue = cueFor(usage, input.editCuesState)
      if (!cue || cue.assetRefs.length === 0) return []

      return cue.assetRefs.map((assetRef, assetIndex): BrollIntegrationPlan => {
        const sourceAsset = sourceAssetFor(assetRef.mediaAssetId, input.sourceLibraryState)
        return {
          id: brollId(input.professionalIntegrationPlanId, input.planningContext.cueUsages.indexOf(usage) + assetIndex + 1),
          projectId: input.planningContext.projectId,
          workspaceId: input.planningContext.workspaceId,
          userId: input.planningContext.userId,
          professionalIntegrationPlanId: input.professionalIntegrationPlanId,
          editCueId: cue.id,
          mediaAssetId: assetRef.mediaAssetId,
          targetCleanAssemblyRange: usage.mappedTimeRange,
          keepMainAudio: cue.audioBehavior !== 'use_asset_audio',
          muteAssetAudio: shouldMuteAssetAudio(cue),
          transitionIn: getDefaultTransitionTreatment({ cue, asset: sourceAsset, label: usage.title }),
          transitionOut: getDefaultTransitionTreatment({ cue, asset: sourceAsset, label: usage.title }),
          cropMode: getDefaultCropModeForRole(usage.role),
          colorMatch: true,
          stabilize: sourceAsset?.mediaKind !== 'screenshot' && sourceAsset?.mediaKind !== 'logo',
          reasoning: 'B-roll is treated as a polished insert: selected timing, safe crop, color match, stabilization when useful, and main voice protected.',
          createdAt: MOCK_CREATED_AT,
          updatedAt: MOCK_CREATED_AT,
        }
      })
    })
    .map((plan, index) => ({ ...plan, id: brollId(input.professionalIntegrationPlanId, index + 1) }))
}

export function buildOverlayCompositionPlans(input: BuildCueTreatmentInput): OverlayCompositionPlan[] {
  return input.planningContext.cueUsages
    .filter((usage) => isUsableCue(usage) && roleUsesOverlayTreatment(usage.role))
    .map((usage, index): OverlayCompositionPlan => {
      const cue = cueFor(usage, input.editCuesState)
      const mediaAssetId = firstMediaAssetId(cue) ?? `${usage.editCueId}-instruction-overlay`
      const sourceAsset = sourceAssetFor(mediaAssetId, input.sourceLibraryState)
      const placement = mapPlacement(cue?.visualBehavior?.placement) ?? getDefaultPlacementForRole(usage.role)
      const transition = getDefaultTransitionTreatment({ cue, asset: sourceAsset, label: usage.title })

      return {
        id: overlayId(input.professionalIntegrationPlanId, index + 1),
        projectId: input.planningContext.projectId,
        workspaceId: input.planningContext.workspaceId,
        userId: input.planningContext.userId,
        professionalIntegrationPlanId: input.professionalIntegrationPlanId,
        editCueId: cue?.id ?? usage.editCueId,
        mediaAssetId,
        targetRange: usage.mappedTimeRange,
        placement,
        boundingBox: boundingBoxForPlacement(placement),
        safeZoneAware: cue?.visualBehavior?.safeZoneAware ?? true,
        avoidFaces: cue?.visualBehavior?.avoidFaces ?? true,
        avoidCaptions: cue?.visualBehavior?.avoidCaptions ?? true,
        frameStyle: getDefaultOverlayFrameStyle({ cue, asset: sourceAsset, label: usage.title }),
        transitionIn: transition,
        transitionOut: transition,
        privacyBlur: shouldApplyPrivacyBlur({ cue, asset: sourceAsset, label: usage.title }),
        readableOnMobile: true,
        treatmentSummary: 'Overlay composition avoids raw pasted assets by applying safe zones, readable scale, caption/face avoidance, framing, and polished motion.',
        createdAt: MOCK_CREATED_AT,
        updatedAt: MOCK_CREATED_AT,
      }
    })
}

function hasMatchingTreatment(usage: PlanningCueUsage, input: BuildComplianceInput) {
  if (!roleRequiresProfessionalTreatment(usage.role)) return true
  const hasBroll = input.brollIntegrationPlans.some((plan) => plan.editCueId === usage.editCueId)
  const hasOverlay = input.overlayCompositionPlans.some((plan) => plan.editCueId === usage.editCueId)
  const hasAsset = input.assetTreatmentPlans.some((plan) => plan.editCueId === usage.editCueId)

  if (roleUsesBrollTreatment(usage.role) && hasBroll) return true
  if (roleUsesOverlayTreatment(usage.role) && hasOverlay) return true
  return hasAsset
}

export function buildCueComplianceChecks(input: BuildComplianceInput): CueComplianceCheck[] {
  return input.planningContext.cueUsages.map((usage, index): CueComplianceCheck => {
    const cue = cueFor(usage, input.editCuesState)
    const sourceAsset = sourceAssetFor(firstMediaAssetId(cue), input.sourceLibraryState)
    const risks = getProfessionalQaRisksForCue({ cue, asset: sourceAsset, label: usage.title })
    const matchingTreatment = hasMatchingTreatment(usage, input)
    const status: CueComplianceCheck['status'] = usage.status === 'blocked'
      ? 'failed'
      : usage.status === 'needs_review' || usage.status === 'not_ready'
        ? 'warning'
        : matchingTreatment
          ? 'passed'
          : 'warning'
    const message = status === 'passed'
      ? 'This cue has a professional treatment path.'
      : status === 'failed'
        ? 'This cue is blocked and needs review before generation.'
        : matchingTreatment
          ? 'This cue can be planned, but the treatment should be reviewed.'
          : 'This cue needs a matching professional treatment before generation.'

    return {
      id: complianceId(input.professionalIntegrationPlanId, index + 1),
      projectId: input.planningContext.projectId,
      workspaceId: input.planningContext.workspaceId,
      userId: input.planningContext.userId,
      professionalIntegrationPlanId: input.professionalIntegrationPlanId,
      editCueId: usage.editCueId,
      status,
      message,
      mappedTimeRange: usage.mappedTimeRange,
      risks,
      requiresUserReview: status !== 'passed' || risks.includes('privacy_sensitive'),
      createdAt: MOCK_CREATED_AT,
      updatedAt: MOCK_CREATED_AT,
    }
  })
}
