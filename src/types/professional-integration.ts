import type {
  BoundingBox,
  ID,
  PlatformAspectRatio,
  ProjectScopedRecord,
  TimeRange,
} from './workflow-common'

export type ProfessionalIntegrationStatus =
  | 'draft'
  | 'ready'
  | 'approved'
  | 'used_in_render'
  | 'failed'
  | 'superseded'

export type AssetTreatmentKind =
  | 'b_roll'
  | 'overlay_card'
  | 'picture_in_picture'
  | 'split_screen'
  | 'insert_clip'
  | 'logo_treatment'
  | 'caption_treatment'
  | 'graphic_treatment'
  | 'sound_treatment'
  | 'music_treatment'
  | 'reference_only'

export type OverlayFrameStyle =
  | 'none'
  | 'rounded_card'
  | 'soft_shadow'
  | 'bordered_card'
  | 'glass_card'
  | 'device_frame'
  | 'browser_frame'
  | 'ai_decides'

export type TransitionTreatment =
  | 'none'
  | 'cut'
  | 'fade'
  | 'smooth_push'
  | 'scale_pop'
  | 'slide'
  | 'match_cut'
  | 'ai_decides'

export type ProfessionalQaRisk =
  | 'caption_collision'
  | 'face_collision'
  | 'unsafe_zone'
  | 'unreadable_text'
  | 'raw_edge_treatment'
  | 'bad_crop'
  | 'low_resolution'
  | 'audio_conflict'
  | 'hard_audio_cut'
  | 'privacy_sensitive'
  | 'off_brand'
  | 'timing_mismatch'

export interface ProfessionalIntegrationPlan extends ProjectScopedRecord {
  editPlanId?: ID
  cleanAssemblyId?: ID
  editBriefId?: ID
  editCueIds: ID[]
  status: ProfessionalIntegrationStatus
  assetTreatmentPlanIds: ID[]
  brollIntegrationPlanIds: ID[]
  overlayCompositionPlanIds: ID[]
  cueComplianceCheckIds: ID[]
  summary: string
  createdFromModel?: string
  version: number
}

export interface AssetTreatmentPlan extends ProjectScopedRecord {
  professionalIntegrationPlanId: ID
  editCueId?: ID
  mediaAssetId: ID
  kind: AssetTreatmentKind
  trimRange?: TimeRange
  cropMode?: 'fill' | 'fit' | 'safe_crop' | 'original'
  targetAspectRatio?: PlatformAspectRatio
  colorMatch?: boolean
  stabilize?: boolean
  privacyBlur?: boolean
  treatmentSummary: string
  qaRisks: ProfessionalQaRisk[]
}

export interface BrollIntegrationPlan extends ProjectScopedRecord {
  professionalIntegrationPlanId: ID
  editCueId?: ID
  mediaAssetId: ID
  sourceTrimRange?: TimeRange
  targetCleanAssemblyRange?: TimeRange
  keepMainAudio: boolean
  muteAssetAudio: boolean
  transitionIn: TransitionTreatment
  transitionOut: TransitionTreatment
  cropMode: 'fill' | 'fit' | 'safe_crop' | 'original'
  colorMatch: boolean
  stabilize: boolean
  reasoning?: string
}

export interface OverlayCompositionPlan extends ProjectScopedRecord {
  professionalIntegrationPlanId: ID
  editCueId?: ID
  mediaAssetId: ID
  targetRange?: TimeRange
  placement:
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'center'
    | 'lower_third'
    | 'upper_third'
    | 'ai_decides'
  boundingBox?: BoundingBox
  safeZoneAware: boolean
  avoidFaces: boolean
  avoidCaptions: boolean
  frameStyle: OverlayFrameStyle
  transitionIn: TransitionTreatment
  transitionOut: TransitionTreatment
  privacyBlur: boolean
  readableOnMobile: boolean
  treatmentSummary: string
}

export interface CueComplianceCheck extends ProjectScopedRecord {
  professionalIntegrationPlanId: ID
  editCueId: ID
  status: 'pending' | 'passed' | 'warning' | 'failed'
  message: string
  mappedTimeRange?: TimeRange
  risks: ProfessionalQaRisk[]
  requiresUserReview?: boolean
}
