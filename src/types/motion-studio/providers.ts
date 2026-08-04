import type { ID, ISODateString } from '../shared'
import type { MotionStudioOwnership, MotionStudioRegisteredExtension, MotionStudioVersionReference } from './shared'

export type MotionStudioProviderCapability =
  | 'image_generation'
  | 'image_edit'
  | 'video_generation'
  | 'video_edit'
  | 'speech_generation'
  | 'speech_alignment'
  | 'music_generation'
  | 'synchronized_foley'
  | 'deterministic_render'

export interface MotionStudioProviderRequest extends MotionStudioOwnership {
  id: ID
  productionId: ID
  jobId: ID
  attemptId: ID
  approvedSnapshotId: ID
  internalCostBudgetId: ID
  capability: MotionStudioProviderCapability
  inputArtifactVersions: MotionStudioVersionReference[]
  outputArtifactKind: string
  capabilityConstraints: {
    transportPolicy: 'disabled' | 'loopback_protocol_simulator' | 'owner_authorized_external'
    networkAllowed: boolean
    requestedDurationFrames?: number
    referenceAssetIds?: ID[]
    outputProfileId?: string
    extensions: MotionStudioRegisteredExtension[]
  }
  idempotencyKey: string
  providerPreferencePolicyId: ID
}

export interface MotionStudioProviderResult extends MotionStudioOwnership {
  id: ID
  productionId: ID
  requestId: ID
  jobId: ID
  attemptId: ID
  capability: MotionStudioProviderCapability
  providerAdapterId: string
  providerModelVersion: string
  outputAssetIds: ID[]
  usageEventIds: ID[]
  provenance: {
    providerRequestDigest: string
    inputArtifactVersionIds: ID[]
    outputAssetIds: ID[]
    extensions: MotionStudioRegisteredExtension[]
  }
  safetySummary: {
    status: 'passed' | 'review_required' | 'rejected'
    policyIds: string[]
    findings: string[]
    extensions: MotionStudioRegisteredExtension[]
  }
  completedAt: ISODateString
  rawProviderPayloadStored: false
}
