import type { ID, ISODateString } from '../shared'
import type { MotionStudioActorReference, MotionStudioContractValue, MotionStudioDigest, MotionStudioOwnership } from './shared'

export type MotionStudioCommandKind =
  | 'create_version'
  | 'set_property'
  | 'insert_item'
  | 'remove_item'
  | 'move_item'
  | 'replace_asset'
  | 'set_timing_reference'
  | 'lock_property'
  | 'release_property_lock'
  | 'request_approval'
  | 'invalidate_dependencies'

export interface MotionStudioCommandOperation {
  operationId: ID
  kind: MotionStudioCommandKind
  targetPath: string
  value?: MotionStudioContractValue
  expectedValueDigest?: MotionStudioDigest
}

export interface MotionStudioCommandEnvelope extends MotionStudioOwnership {
  id: ID
  productionId: ID
  artifactId: ID
  baseVersionId: ID
  baseVersionDigest: MotionStudioDigest
  idempotencyKey: string
  actor: MotionStudioActorReference
  operations: MotionStudioCommandOperation[]
  reason: string
  createdAt: ISODateString
}

export interface MotionStudioChangeImpact {
  affectedArtifactVersionIds: ID[]
  invalidatedArtifactVersionIds: ID[]
  affectedSceneIds: ID[]
  affectedJobIds: ID[]
  newEstimateRequired: boolean
  approvalResetRequired: boolean
  explanation: string[]
}

export type MotionStudioCommandResult =
  | {
      status: 'applied'
      commandId: ID
      newVersionId: ID
      newVersionDigest: MotionStudioDigest
      impact: MotionStudioChangeImpact
    }
  | {
      status: 'conflict' | 'locked' | 'rejected'
      commandId: ID
      currentVersionId: ID
      currentVersionDigest: MotionStudioDigest
      conflictPaths: string[]
      message: string
    }
