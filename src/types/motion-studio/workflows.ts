import type { ID } from '../shared'
import type { MotionStudioArtifactKind } from './artifacts'
import type { MotionStudioStage, ProductionMode } from './production'

export type MotionStudioApprovalBoundary = 'none' | 'understanding' | 'stage_artifact' | 'expensive_work' | 'picture_lock' | 'delivery'

export interface ApprovalRequirement {
  id: ID
  boundary: MotionStudioApprovalBoundary
  requiredArtifactKinds: MotionStudioArtifactKind[]
  exactVersionDigestRequired: boolean
  approvedSnapshotRequired: boolean
  internalCostAuthorizationRequired: boolean
}

export interface QualityGate {
  id: ID
  category: 'story' | 'fact' | 'visual' | 'timing' | 'audio' | 'rights' | 'security' | 'render' | 'delivery'
  blocking: boolean
  evidenceRequired: string[]
  failureAction: 'retry' | 'fallback' | 'user_review' | 'new_approval' | 'block'
}

export interface MotionStudioWorkflowBoundary {
  description: string
  durableRecordKinds: string[]
  idempotencyRequired: boolean
}

export interface MotionStudioWorkflowDefinition {
  id: string
  label: string
  stage: MotionStudioStage
  supportedProductionModes: ProductionMode[]
  inputArtifactKinds: MotionStudioArtifactKind[]
  outputArtifactKinds: MotionStudioArtifactKind[]
  skillNodeIds: string[]
  toolCapabilityIds: string[]
  approval: MotionStudioWorkflowBoundary
  transaction: MotionStudioWorkflowBoundary
  job: MotionStudioWorkflowBoundary
  cost: MotionStudioWorkflowBoundary
  retryPolicy: string[]
  cancellationPolicy: string[]
  failureRecovery: string[]
  observabilityEvidence: string[]
  completionEvidence: string[]
  runtimeImplemented: false
}
