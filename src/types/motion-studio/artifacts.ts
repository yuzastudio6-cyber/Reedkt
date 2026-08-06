import type { ID, ISODateString, JSONValue } from '../shared'
import type {
  MotionStudioActorReference,
  MotionStudioArtifactPayload,
  MotionStudioContractValue,
  MotionStudioDigest,
  MotionStudioOwnership,
  MotionStudioProvenance,
  MotionStudioVersionReference,
} from './shared'

export type MotionStudioArtifactKind =
  | 'production_brief'
  | 'story_bible'
  | 'prepared_script'
  | 'research_pack'
  | 'claim_ledger'
  | 'visual_coverage_plan'
  | 'reference_contract'
  | 'motion_dna'
  | 'motion_language'
  | 'narrative_function'
  | 'motion_strategy'
  | 'voice_bible'
  | 'music_bible'
  | 'cue_sheet'
  | 'scene_graph'
  | 'scene_recipe'
  | 'layer_plan'
  | 'scene_document'
  | 'sound_event_plan'
  | 'storyboard'
  | 'animatic'
  | 'fine_cut'
  | 'quality_report'
  | 'export_manifest'

export type MotionStudioArtifactVersionState =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'locked'
  | 'rejected'
  | 'superseded'
  | 'archived'

export interface MotionStudioArtifact extends MotionStudioOwnership {
  id: ID
  productionId: ID
  kind: MotionStudioArtifactKind
  currentDraftVersion?: MotionStudioVersionReference
  currentApprovedVersion?: MotionStudioVersionReference
  archivedAt?: ISODateString
  createdAt: ISODateString
}

export interface MotionStudioArtifactVersion<TPayload extends JSONValue = JSONValue> extends MotionStudioOwnership {
  id: ID
  productionId: ID
  artifactId: ID
  kind: MotionStudioArtifactKind
  versionNumber: number
  parentVersionId?: ID
  state: MotionStudioArtifactVersionState
  payload: MotionStudioArtifactPayload<TPayload>
  contentDigest: MotionStudioDigest
  immutable: boolean
  provenance: MotionStudioProvenance
  createdAt: ISODateString
}

export interface ArtifactApproval extends MotionStudioOwnership {
  id: ID
  productionId: ID
  artifactId: ID
  artifactVersion: MotionStudioVersionReference
  approvedSnapshotId: ID
  approvalKind: 'stage_artifact' | 'expensive_work' | 'picture_lock' | 'delivery'
  approvedBy: MotionStudioActorReference
  approvalDigest: MotionStudioDigest
  immutable: true
  createdAt: ISODateString
}

export type ArtifactDependencyKind =
  | 'requires_exact_version'
  | 'derives_from'
  | 'timing_authority'
  | 'style_authority'
  | 'asset_input'
  | 'approval_input'

export type ArtifactInvalidationPolicy = 'always' | 'material_change' | 'manual_review' | 'never'

export interface ArtifactDependency extends MotionStudioOwnership {
  id: ID
  productionId: ID
  upstream: MotionStudioVersionReference
  downstream: MotionStudioVersionReference
  dependencyKind: ArtifactDependencyKind
  invalidationPolicy: ArtifactInvalidationPolicy
  createdAt: ISODateString
}

export interface ArtifactInvalidation extends MotionStudioOwnership {
  id: ID
  productionId: ID
  causeVersion: MotionStudioVersionReference
  affectedVersion: MotionStudioVersionReference
  reason: string
  status: 'open' | 'accepted' | 'resolved' | 'dismissed'
  impactEstimateId?: ID
  createdAt: ISODateString
  resolvedAt?: ISODateString
}

export type PropertyLockKind = 'user_lock' | 'approval_lock' | 'picture_lock' | 'system_safety_lock'

export interface PropertyLock extends MotionStudioOwnership {
  id: ID
  productionId: ID
  artifactVersionId: ID
  targetPath: string
  lockKind: PropertyLockKind
  lockedBy: MotionStudioActorReference
  reason: string
  lockDigest: MotionStudioDigest
  createdAt: ISODateString
  releasedAt?: ISODateString
}

export interface ManualOverride extends MotionStudioOwnership {
  id: ID
  productionId: ID
  artifactVersionId: ID
  targetPath: string
  previousValueDigest: MotionStudioDigest
  replacementValue: MotionStudioContractValue
  authoredBy: MotionStudioActorReference
  reason: string
  conflictPolicy: 'fail_if_changed' | 'require_review'
  createdAt: ISODateString
}
