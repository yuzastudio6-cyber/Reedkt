import type {
  AssetTreatmentKind,
  AssetTreatmentPlan,
  EditCuesState,
  PlanningAssetUsage,
  PlanningContext,
  SourceLibraryAsset,
  SourceLibraryState,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import {
  getDefaultCropModeForRole,
  getProfessionalQaRisksForCue,
  shouldApplyPrivacyBlur,
} from './professional-treatment-rules'

type BuildAssetTreatmentPlansInput = {
  professionalIntegrationPlanId: string
  planningContext: PlanningContext
  sourceLibraryState?: SourceLibraryState | null
  editCuesState?: EditCuesState | null
}

function treatmentId(planId: string, index: number) {
  return `${planId}-asset-treatment-${String(index).padStart(3, '0')}`
}

function sourceAssetFor(mediaAssetId: string, sourceLibraryState?: SourceLibraryState | null) {
  return sourceLibraryState?.assets.find((asset) => asset.mediaAssetId === mediaAssetId)
}

function assetAttachedToUsableCue(asset: PlanningAssetUsage, planningContext: PlanningContext) {
  return planningContext.cueUsages.some((cue) =>
    (cue.status === 'will_use' || cue.status === 'will_adjust') &&
    cue.relatedAssetIds.includes(asset.mediaAssetId),
  )
}

function shouldTreatAsset(asset: PlanningAssetUsage, planningContext: PlanningContext) {
  if (asset.status === 'do_not_use' || asset.status === 'avoid') return false
  if (asset.status === 'main_footage' || asset.status === 'must_use' || asset.status === 'prefer') return true
  if (asset.status === 'reference_only') return true
  return assetAttachedToUsableCue(asset, planningContext)
}

function inferTreatmentKind(asset: PlanningAssetUsage, sourceAsset?: SourceLibraryAsset): AssetTreatmentKind {
  if (asset.status === 'reference_only' || asset.role === 'reference_only') return 'reference_only'
  if (asset.role === 'b_roll' || asset.role === 'insert_clip' || asset.role === 'main_footage') return 'b_roll'
  if (asset.role === 'picture_in_picture') return 'picture_in_picture'
  if (asset.role === 'split_screen') return 'split_screen'
  if (asset.role === 'logo' || sourceAsset?.mediaKind === 'logo') return 'logo_treatment'
  if (asset.role === 'music' || sourceAsset?.mediaKind === 'music') return 'music_treatment'
  if (asset.role === 'sfx' || sourceAsset?.mediaKind === 'sfx') return 'sound_treatment'
  if (asset.role === 'overlay' || asset.role === 'screenshot' || sourceAsset?.mediaKind === 'screenshot' || sourceAsset?.mediaKind === 'screen_recording') return 'overlay_card'
  return 'graphic_treatment'
}

function cropModeForAsset(asset: PlanningAssetUsage, kind: AssetTreatmentKind) {
  if (kind === 'logo_treatment' || kind === 'overlay_card' || kind === 'reference_only') return 'fit'
  if (kind === 'b_roll') return getDefaultCropModeForRole('b_roll')
  if (asset.role === 'picture_in_picture') return getDefaultCropModeForRole('picture_in_picture')
  if (asset.role === 'split_screen') return getDefaultCropModeForRole('split_screen')
  return 'safe_crop'
}

function treatmentSummary(asset: PlanningAssetUsage, kind: AssetTreatmentKind) {
  if (kind === 'reference_only') return `${asset.label} will be used as planning reference only, not pasted into the render.`
  if (kind === 'b_roll') return `${asset.label} will be trimmed, cropped, color-matched, stabilized if needed, and kept audio-safe.`
  if (kind === 'overlay_card') return `${asset.label} will be framed as a polished card with safe margins, readable scale, and caption/face avoidance.`
  if (kind === 'logo_treatment') return `${asset.label} will receive safe-margin brand placement, not a random watermark.`
  if (kind === 'music_treatment') return `${asset.label} will be mixed below speech and ducked where needed.`
  if (kind === 'sound_treatment') return `${asset.label} will be timed to the planned cue and mixed speech-first.`
  return `${asset.label} will receive a professional treatment before render.`
}

export function buildAssetTreatmentPlans(input: BuildAssetTreatmentPlansInput): AssetTreatmentPlan[] {
  return input.planningContext.sourceAssets
    .filter((asset) => shouldTreatAsset(asset, input.planningContext))
    .map((asset, index): AssetTreatmentPlan => {
      const sourceAsset = sourceAssetFor(asset.mediaAssetId, input.sourceLibraryState)
      const relatedCue = input.editCuesState?.cues.find((cue) =>
        cue.assetRefs.some((ref) => ref.mediaAssetId === asset.mediaAssetId),
      )
      const kind = inferTreatmentKind(asset, sourceAsset)
      const risks = getProfessionalQaRisksForCue({
        cue: relatedCue,
        asset: sourceAsset,
        label: asset.label,
      })

      return {
        id: treatmentId(input.professionalIntegrationPlanId, index + 1),
        projectId: input.planningContext.projectId,
        workspaceId: input.planningContext.workspaceId,
        userId: input.planningContext.userId,
        professionalIntegrationPlanId: input.professionalIntegrationPlanId,
        editCueId: relatedCue?.id,
        mediaAssetId: asset.mediaAssetId,
        kind,
        cropMode: cropModeForAsset(asset, kind),
        targetAspectRatio: 'custom',
        colorMatch: kind !== 'reference_only' && kind !== 'music_treatment' && kind !== 'sound_treatment',
        stabilize: kind === 'b_roll' || kind === 'picture_in_picture' || kind === 'split_screen',
        privacyBlur: shouldApplyPrivacyBlur({ cue: relatedCue, asset: sourceAsset, label: asset.label }),
        treatmentSummary: treatmentSummary(asset, kind),
        qaRisks: risks,
        createdAt: MOCK_CREATED_AT,
        updatedAt: MOCK_CREATED_AT,
      }
    })
}
