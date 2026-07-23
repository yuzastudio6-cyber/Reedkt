import type { ID, ISODateString, JSONValue } from '../shared'

export const MOTION_STUDIO_PRODUCT_NAME = 'Motion Studio' as const
export const MOTION_STUDIO_CONTRACT_VERSION = 'ms-001.0' as const

export type MotionStudioId = ID
export type MotionStudioDigest = string
export type MotionStudioVersionNumber = number

export interface MotionStudioOwnership {
  workspaceId: ID
  projectId: ID
  editSessionId: ID
}

export type MotionStudioActorKind = 'user' | 'director' | 'system' | 'worker' | 'reviewer'

export interface MotionStudioActorReference {
  actorKind: MotionStudioActorKind
  actorId: ID
  displayName?: string
}

export interface MotionStudioVersionReference {
  artifactId: ID
  versionId: ID
  versionNumber: MotionStudioVersionNumber
  contentDigest: MotionStudioDigest
}

export interface TimingAuthorityRef {
  masterTimingPlanVersionId: ID
  confirmedFrameId: ID
  timingAuthorityDigest: MotionStudioDigest
  frameRate: number
  width: number
  height: number
  aspectRatio: string
  durationFrames: number
  timebase: string
}

export type MotionStudioTimingAuthority = TimingAuthorityRef

export interface AssetRef {
  referenceKind: 'asset_ref'
  assetId: ID
  assetVersionId?: ID
  contentDigest?: MotionStudioDigest
}

export interface StorageObjectRef {
  referenceKind: 'storage_object_ref'
  storageProvider: 'gcs' | 'supabase_storage' | 'local_private'
  objectId: ID
  bucketId: ID
  objectPath: string
  contentDigest?: MotionStudioDigest
}

export interface SourceLocator {
  referenceKind: 'source_locator'
  sourceId: ID
  locatorType: 'public_https'
  url: string
  retrievedAt?: ISODateString
}

export interface ProviderResultRef {
  referenceKind: 'provider_result_ref'
  providerResultId: ID
  providerAttemptId: ID
}

export interface MotionStudioDesignExtension {
  namespace: 'motion_studio.design.v1'
  version: '1.0.0'
  payload: {
    designTokenReferences: string[]
    notes: string[]
  }
}

export type MotionStudioRegisteredExtension = MotionStudioDesignExtension
export type MotionStudioStableReference = AssetRef | StorageObjectRef | SourceLocator | ProviderResultRef | TimingAuthorityRef
export type MotionStudioContractValue = JSONValue | MotionStudioStableReference

export interface MotionStudioArtifactPayload<TData extends JSONValue = JSONValue> {
  schemaVersion: string
  data: TData
  references: Array<AssetRef | StorageObjectRef | SourceLocator | ProviderResultRef>
  extensions: MotionStudioRegisteredExtension[]
}

export interface MotionStudioProvenance {
  createdBy: MotionStudioActorReference
  sourceArtifactVersionIds: ID[]
  sourceAssetIds: ID[]
  skillRunIds: ID[]
  toolRunIds: ID[]
  providerAttemptIds: ID[]
  createdAt: ISODateString
  extensions?: MotionStudioRegisteredExtension[]
}

export interface MotionStudioImmutablePayload<TPayload extends JSONValue = JSONValue> {
  payload: TPayload
  contentDigest: MotionStudioDigest
  immutable: boolean
}

export interface MotionStudioCompilerFingerprint {
  compilerId: string
  compilerVersion: string
  inputDigest: MotionStudioDigest
  outputDigest?: MotionStudioDigest
}
