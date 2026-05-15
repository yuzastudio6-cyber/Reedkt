import type { BaseRecord, CreditImpact, ID, JSONObject, ProcessingStatus } from './shared'

export type SignatureSystem =
  | 'stroke_motion'
  | 'graphic_design'
  | 'real_motion'
  | 'sound_sync'
  | 'none'

export type SignatureSystemDecision = 'recommended' | 'optional' | 'not_useful' | 'blocked' | 'user_requested'

export type SignatureWorkerTarget =
  | 'stroke_motion_story_agent'
  | 'stroke_motion_generation_worker'
  | 'graphic_design_worker'
  | 'real_motion_worker'
  | 'soundsync_worker'
  | 'none'

export interface SignatureSystemCatalogRecord extends BaseRecord {
  system: SignatureSystem
  displayName: string
  purpose: string
  isVisualSystem: boolean
  isAudioTimingSupport: boolean
  defaultCreditImpact: CreditImpact
  workerTargets: SignatureWorkerTarget[]
  active: boolean
}

export interface GraphicDesignPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  status: ProcessingStatus
  conceptSummary: string
  overlayTypes: string[]
  layoutGuidance: string
  captionRelationship: string
  creditImpact: CreditImpact
  generationRequestIds: ID[]
}

export interface RealMotionPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  status: ProcessingStatus
  overlayFirstRule: true
  faceSafePlacementRequired: true
  conceptSummary: string
  objectScaleMeaning: string
  placementHint: string
  creditImpact: 'premium'
  generationRequestIds: ID[]
}

export interface SoundSyncPlanRecord extends BaseRecord {
  projectId: ID
  editPlanId: ID
  status: ProcessingStatus
  musicMood: string
  beatTimingNotes: string
  duckingStrategy: string
  sfxStrategy: string
  supportsSignatureSystems: SignatureSystem[]
  metadata?: JSONObject
}

export const SIGNATURE_SYSTEMS: SignatureSystem[] = [
  'stroke_motion',
  'graphic_design',
  'real_motion',
  'sound_sync',
  'none',
]
