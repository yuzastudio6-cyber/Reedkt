import type {
  ID,
  PlatformAspectRatio,
  ProjectScopedRecord,
} from './workflow-common'

export type PictureLockSchemaVersion = 'picture-lock-manifest-v1'

export interface PictureLockVersionRef {
  id: ID
  version: number
  contentHash: string
}

export interface PictureLockOutputFrameRef extends PictureLockVersionRef {
  outputId: ID
  aspectRatio: PlatformAspectRatio
  width: number
  height: number
  fps: number
  confirmedByUser: true
  confirmationRecordId: ID
}

export interface PictureLockTimelineRef extends PictureLockVersionRef {
  totalFrames: number
  shotOrderLocked: boolean
  shotDurationsLocked: boolean
  sourceRangesLocked: boolean
  cutsLocked: boolean
  speedChangesLocked: boolean
  transitionsLocked: boolean
  reframingLocked: boolean
}

export type PictureLockDependencyKind =
  | 'visual_layout'
  | 'living_frame'
  | 'map_chart_graphic'
  | 'b_roll_layout'
  | 'lower_third'
  | 'mask_tracking'
  | 'color_proxy'
  | 'asset_manifest'

export interface PictureLockDependencyRef extends PictureLockVersionRef {
  kind: PictureLockDependencyKind
  required: boolean
  scopeIds: ID[]
  status: 'locked' | 'missing' | 'stale' | 'approved_exception'
  exceptionId?: ID
}

export interface PictureLockException {
  id: ID
  kind: PictureLockDependencyKind | 'timeline' | 'output_frame'
  affectedScopeIds: ID[]
  blocking: boolean
  approved: boolean
  approvalEvidenceIds: ID[]
  reason: string
  degradedRoute: string
}

export interface PictureLockManifest extends ProjectScopedRecord {
  schemaVersion: PictureLockSchemaVersion
  version: number
  editPlanId: ID
  editPlanVersionId: ID
  approvedPlanSnapshotRef: PictureLockVersionRef
  authority: 'edit_picture_lock_authority'
  status: 'draft' | 'locked' | 'stale' | 'superseded'
  contentHash: string
  timeline: PictureLockTimelineRef
  outputFrame: PictureLockOutputFrameRef
  dependencies: PictureLockDependencyRef[]
  maskTrackingManifestIds: ID[]
  visualFinishProxyArtifactIds: ID[]
  exceptions: PictureLockException[]
  lockedAt?: string
  lockedByActorId?: ID
  supersedesId?: ID
  immutable: true
  mockOnly: true
}

export interface PictureLockValidation {
  ok: boolean
  ready: boolean
  errors: string[]
  warnings: string[]
  staleScopeIds: ID[]
  blockingExceptionIds: ID[]
}
