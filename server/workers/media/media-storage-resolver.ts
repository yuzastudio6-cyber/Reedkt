import path from 'node:path'
import type { ProductionStorageBucketPurpose } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import {
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
  resolvePathInsideRoot,
  safeJoinStoragePath,
  sanitizePathForLog,
} from './media-path-safety'
import type { MediaFoundationStorageReference, ResolvedLocalMediaPath } from './media-worker-types'

const allowedBucketPurposes: ProductionStorageBucketPurpose[] = [
  'source_media',
  'proxy_media',
  'analysis_artifacts',
  'transcripts',
  'masks',
  'generated_assets',
  'previews',
  'final_exports',
  'worker_temp',
  'qa_artifacts',
]

export interface ResolveLocalMediaPathInput {
  storageReference: MediaFoundationStorageReference
  localStorageRoot?: string
  storageMode?: 'local' | 'gcs_metadata_only'
}

export interface BuildStorageArtifactReferenceInput {
  sourceStorageObjectId?: string
  storageBucketPurpose: ProductionStorageBucketPurpose
  storageObjectPath: string
  localFilePath?: string
  contentType?: string
  sizeBytes?: number
}

export function assertStorageRefIsPrivate(input: Pick<MediaFoundationStorageReference, 'isPrivate' | 'sourceOfTruth'>): void {
  if (!input.isPrivate || !input.sourceOfTruth) {
    throw new Error('Media foundation artifacts must use private source-of-truth storage references.')
  }
}

export function assertNoSignedUrlStorageRef(input: Pick<MediaFoundationStorageReference, 'storageObjectPath' | 'localFilePath'>): void {
  assertNoSignedUrlOrRawUrl(input.storageObjectPath, 'storageObjectPath')
  if (input.localFilePath) {
    assertNoSignedUrlOrRawUrl(input.localFilePath, 'localFilePath')
  }
}

export function buildStorageArtifactReference(input: BuildStorageArtifactReferenceInput): MediaFoundationStorageReference {
  if (!allowedBucketPurposes.includes(input.storageBucketPurpose)) {
    throw new Error(`Unsupported storage bucket purpose: ${input.storageBucketPurpose}`)
  }

  assertNoSignedUrlOrRawUrl(input.storageObjectPath, 'storageObjectPath')
  assertNoPathTraversal(input.storageObjectPath, 'storageObjectPath')
  if (input.localFilePath) {
    assertNoSignedUrlOrRawUrl(input.localFilePath, 'localFilePath')
    assertNoPathTraversal(input.localFilePath, 'localFilePath')
  }

  return {
    sourceStorageObjectId: input.sourceStorageObjectId,
    storageBucketPurpose: input.storageBucketPurpose,
    storageObjectPath: input.storageObjectPath,
    localFilePath: input.localFilePath,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    isPrivate: true,
    sourceOfTruth: true,
  }
}

export function resolveLocalMediaPathFromStorageRef(input: ResolveLocalMediaPathInput): ResolvedLocalMediaPath {
  assertStorageRefIsPrivate(input.storageReference)
  assertNoSignedUrlStorageRef(input.storageReference)
  assertNoPathTraversal(input.storageReference.storageObjectPath, 'storageObjectPath')

  if ((input.storageMode ?? 'local') === 'gcs_metadata_only') {
    return {
      storageReference: input.storageReference,
      storageMode: 'gcs_metadata_only',
      pathSummary: `gcs-metadata:${input.storageReference.storageBucketPurpose}/${input.storageReference.storageObjectPath}`,
    }
  }

  const localFilePath = input.storageReference.localFilePath
    ? path.resolve(input.storageReference.localFilePath)
    : input.localStorageRoot
      ? resolvePathInsideRoot(input.localStorageRoot, input.storageReference.storageObjectPath)
      : undefined

  if (!localFilePath) {
    throw new Error('Local media path resolution requires localFilePath or localStorageRoot in local mode.')
  }

  return {
    storageReference: input.storageReference,
    localFilePath,
    storageMode: 'local',
    pathSummary: sanitizePathForLog(localFilePath),
  }
}

export function buildMediaObjectPath(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  folder: string
  filename: string
}): string {
  return safeJoinStoragePath(
    'workspaces',
    input.workspaceId,
    'projects',
    input.projectId,
    'media',
    input.mediaAssetId,
    input.folder,
    input.filename,
  )
}
