import type { ID } from '../shared'
import type { MotionStudioDigest, MotionStudioVersionReference } from './shared'

export type MotionStudioVoiceCastingState =
  | 'not_prepared'
  | 'ready'
  | 'selected_for_planning'
  | 'locked_read_only'
  | 'uploaded_narration'
  | 'catalog_unavailable'

export interface MotionStudioVoiceCastingCandidateDto {
  candidateReference: string
  displayName: string
  description?: string
  traits: {
    accent?: string
    age?: string
    gender?: string
    language?: string
    useCase?: string
    character?: string
  }
  auditionState: 'unavailable'
}

export interface MotionStudioVoiceCastingWorkspaceDto {
  productionId: ID
  projectId: ID
  editSessionId: ID
  state: MotionStudioVoiceCastingState
  catalogVersion?: MotionStudioDigest
  candidates: readonly MotionStudioVoiceCastingCandidateDto[]
  selectedCandidateReference?: string
  voiceBible?: {
    artifactId: ID
    providerCapability: 'speech_generation' | 'uploaded_narration'
    currentDraftVersion?: MotionStudioVersionReference
    currentApprovedVersion?: MotionStudioVersionReference
  }
  selectionAllowed: boolean
  notice: string
  localCandidateOnly: true
}

export interface SelectMotionStudioNarratorForPlanningRequest {
  candidateReference: string
  catalogVersion: MotionStudioDigest
  voiceBibleBaseVersionId: ID
  voiceBibleBaseVersionDigest: MotionStudioDigest
}

export interface MotionStudioNarratorPlanningSelectionReceiptDto {
  updatedVoiceBibleVersion: MotionStudioVersionReference
  workspace: MotionStudioVoiceCastingWorkspaceDto
  planApproved: false
  providerCallMade: false
  speechGenerated: false
  customerCreditsChanged: false
}
