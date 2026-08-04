import type {
  ApprovedEditExecutionPrivateInternalTestRunClientResult,
  ProfessionalEditDecisionManifestArtifactClientModel,
  ProfessionalEditDecisionManifestClientModel,
} from '../../src/lib/approved-edit-execution-package-client'
import type { SourceMediaMetadata } from '../../src/types/upload'

type PrivateInternalTestRunBase = NonNullable<
  ApprovedEditExecutionPrivateInternalTestRunClientResult['internalTestRun']
>
type PrivateFinalRenderArtifactBase = NonNullable<
  PrivateInternalTestRunBase['finalRenderArtifact']
>

export type PrivateStorageMirrorSmoke = {
  storageProvider: 'google_cloud_storage'
  bucketName: string
  objectPath: string
  mimeType: string
  byteSize: number
  sha256: string
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
}

export type PrivateInternalTestRunSmoke = Omit<
  PrivateInternalTestRunBase,
  'finalRenderArtifact' | 'privateInternalManifestPath'
> & {
  privateInternalManifestPath: string
  finalRenderArtifact: Omit<
    PrivateFinalRenderArtifactBase,
    'commandSummary' | 'editDecisionManifest' | 'editDecisionManifestArtifact'
  > & {
    privateStorageMirror?: PrivateStorageMirrorSmoke
    commandSummary: NonNullable<PrivateFinalRenderArtifactBase['commandSummary']> & {
      approvedFinalTimingCount: number
      approvedFinalTimelineDurationSeconds: number
      approvedVisualPolishCount: number
      visualPolish: NonNullable<
        NonNullable<PrivateFinalRenderArtifactBase['commandSummary']>['visualPolish']
      >
      privateCaptionArtifactCount: number
      privateCaptionFormats: string[]
      privateCaptionSource: string
    }
    editDecisionManifest: ProfessionalEditDecisionManifestClientModel
    editDecisionManifestArtifact: ProfessionalEditDecisionManifestArtifactClientModel & {
      privateStorageMirror?: PrivateStorageMirrorSmoke
    }
  }
}

export type UploadIntentSmoke = {
  id: string
}

export type UploadTargetSmoke = {
  uploadMethod: 'PUT' | 'POST'
  uploadUrl: string
  uploadHeaders?: Record<string, string>
  bucketName: string
  objectPath: string
}

export type SignedUrlEventSmoke = {
  metadataJson?: {
    bucketName?: string
    objectPath?: string
  }
}

export type MediaAssetSmoke = {
  id: string
  storageProvider: 'local_private' | 'google_cloud_storage' | 'supabase_storage'
  storageBucket?: string
  storagePath: string
  fileName: string
  mimeType: string
  sizeBytes: number
  checksumSha256?: string
  storageGeneration?: string
  storageEtag?: string
  sourceMetadata?: SourceMediaMetadata
}

export type StorageObjectRecordSmoke = {
  id: string
  bucketName: string
  objectPath: string
  checksumSha256?: string
  generation?: string
  etag?: string
}

export type ProjectSmoke = {
  id: string
  workspaceId: string
  name: string
}

export type PrivateInternalTestRunJsonResponse = {
  ok?: boolean
  data?: {
    internalTestRun?: PrivateInternalTestRunSmoke
    uploadIntent?: UploadIntentSmoke
    uploadTarget?: UploadTargetSmoke
    signedUrlEvent?: SignedUrlEventSmoke
    mediaAsset?: MediaAssetSmoke
    storageObjectRecord?: StorageObjectRecordSmoke
    project?: ProjectSmoke
  }
  error?: { code?: string; message?: string; details?: unknown }
  warnings?: string[]
}
