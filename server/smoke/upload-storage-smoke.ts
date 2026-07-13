import { createHash } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createProjectService } from '../services/project-service'
import { readPrivateUploadMediaAuthorityAggregate } from '../services/private-upload-media-authority-store'
import { createUploadService } from '../services/upload-service'
import { LocalStorageAdapter } from '../storage/local-storage-adapter'
import { buildCanonicalObjectPath, sanitizeFileName } from '../storage/storage-paths'
import { assertAllowedUpload } from '../storage/storage-validation'
import type {
  DownloadTarget,
  ObjectMetadata,
  ObjectReadIdentity,
  StorageAdapter,
  UploadTarget,
  VerifyObjectInput,
} from '../storage/storage-types'
import type { ServiceContext } from '../types'

class ClientMetadataOnlyGcsAdapter implements StorageAdapter {
  readonly mode = 'gcs' as const
  deleteAttempted = false

  async createUploadTarget(input: {
    uploadIntentId: string
    bucketName: string
    objectPath: string
    mimeType: string
    expiresAt: string
  }): Promise<UploadTarget> {
    return {
      uploadMethod: 'PUT',
      uploadUrl: `https://untrusted-upload.invalid/${input.uploadIntentId}`,
      uploadHeaders: {
        'content-type': input.mimeType,
        'x-goog-if-generation-match': '0',
      },
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
      createOnly: true,
    }
  }

  async putObject(): Promise<ObjectMetadata> {
    throw new Error('Client metadata-only smoke does not perform backend writes.')
  }

  async verifyUploadedObject(input: VerifyObjectInput): Promise<ObjectMetadata> {
    return {
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      sizeBytes: input.expectedSizeBytes ?? 0,
      // This models a forged x-goog-meta-sha256 value: the string matches the
      // user's claim, but no trusted backend hashed the stored bytes.
      checksumSha256: input.checksumSha256 ?? '',
      mimeType: 'video/mp4',
      exists: true,
      generation: 'forged-generation',
      etag: 'forged-etag',
      integrityVerified: false,
      checksumSource: 'unavailable',
    }
  }

  async createDownloadTarget(): Promise<DownloadTarget> {
    throw new Error('Client metadata-only smoke must never reach download creation.')
  }

  async getObjectMetadata(bucketName: string, objectPath: string): Promise<ObjectMetadata> {
    return {
      bucketName,
      objectPath,
      sizeBytes: 0,
      checksumSha256: '',
      exists: false,
      integrityVerified: false,
      checksumSource: 'unavailable',
    }
  }

  async createReadStream(): Promise<Readable> {
    throw new Error('Client metadata-only smoke must never stream an accepted object.')
  }

  async deleteObject(_bucketName: string, _objectPath: string, identity?: ObjectReadIdentity) {
    this.deleteAttempted = Boolean(identity?.generation && identity.etag)
    return { deleted: this.deleteAttempted, warnings: [] }
  }
}

class ProbeStagingGcsAdapter implements StorageAdapter {
  readonly mode = 'gcs' as const
  streamMode: 'exact' | 'short' | 'wrong_hash' | 'open_error'
  readonly deleteMode: 'success' | 'warning' | 'error'
  readonly readIdentities: Array<ObjectReadIdentity | undefined> = []
  readonly deleteIdentities: Array<ObjectReadIdentity | undefined> = []
  private readonly body: Buffer
  private readonly checksumSha256: string

  constructor(
    body: Buffer,
    streamMode: ProbeStagingGcsAdapter['streamMode'],
    deleteMode: ProbeStagingGcsAdapter['deleteMode'] = 'success',
  ) {
    this.body = body
    this.checksumSha256 = createHash('sha256').update(body).digest('hex')
    this.streamMode = streamMode
    this.deleteMode = deleteMode
  }

  async createUploadTarget(input: {
    uploadIntentId: string
    bucketName: string
    objectPath: string
    mimeType: string
    expiresAt: string
  }): Promise<UploadTarget> {
    return {
      uploadMethod: 'PUT',
      uploadUrl: `https://probe-staging.invalid/${input.uploadIntentId}`,
      uploadHeaders: {
        'content-type': input.mimeType,
        'x-goog-if-generation-match': '0',
      },
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
      createOnly: true,
    }
  }

  async putObject(): Promise<ObjectMetadata> {
    throw new Error('Probe staging smoke does not perform backend object writes.')
  }

  async verifyUploadedObject(input: VerifyObjectInput): Promise<ObjectMetadata> {
    return this.metadata(input.bucketName, input.objectPath)
  }

  async createDownloadTarget(): Promise<DownloadTarget> {
    throw new Error('Probe staging smoke does not create download targets.')
  }

  async getObjectMetadata(bucketName: string, objectPath: string): Promise<ObjectMetadata> {
    return this.metadata(bucketName, objectPath)
  }

  async createReadStream(
    _bucketName: string,
    _objectPath: string,
    identity?: ObjectReadIdentity,
  ): Promise<Readable> {
    this.readIdentities.push(identity)
    if (this.streamMode === 'open_error') throw new Error('Transient provider stream failure.')
    if (this.streamMode === 'short') return Readable.from([this.body.subarray(0, this.body.byteLength - 1)])
    if (this.streamMode === 'wrong_hash') {
      const wrongBytes = Buffer.from(this.body)
      wrongBytes[0] = wrongBytes[0] === 0 ? 1 : wrongBytes[0] - 1
      return Readable.from([wrongBytes])
    }
    return Readable.from([this.body])
  }

  async deleteObject(
    _bucketName: string,
    _objectPath: string,
    identity?: ObjectReadIdentity,
  ): Promise<{ deleted: boolean; warnings: string[] }> {
    this.deleteIdentities.push(identity)
    if (this.deleteMode === 'error') throw new Error('Exact-generation cleanup transport failure.')
    if (this.deleteMode === 'warning') {
      return { deleted: false, warnings: ['Exact-generation cleanup requires reconciliation.'] }
    }
    return { deleted: true, warnings: [] }
  }

  private metadata(bucketName: string, objectPath: string): ObjectMetadata {
    return {
      bucketName,
      objectPath,
      sizeBytes: this.body.byteLength,
      checksumSha256: this.checksumSha256,
      mimeType: 'video/mp4',
      exists: true,
      generation: 'probe-generation-1',
      etag: 'probe-etag-1',
      integrityVerified: true,
      checksumSource: 'server_computed_bytes',
    }
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: '.reeditpro-local-storage-smoke',
  FFPROBE_BIN: 'reeditpro-missing-ffprobe-upload-smoke',
  SIGNED_URL_TTL_SECONDS: '900',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})
await rm(env.localStorageRoot, { force: true, recursive: true })

const unsafeName = '..\\..//bad\u0000clip.mp4'
const safeName = sanitizeFileName(unsafeName)
assert(!safeName.includes('..'), 'Filename sanitizer should remove traversal markers.')
assert(!/[\\/]/.test(safeName), 'Filename sanitizer should remove slashes.')
assert(safeName.endsWith('.mp4'), 'Filename sanitizer should preserve safe extension.')

const canonicalPath = buildCanonicalObjectPath({
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  purpose: 'source_media',
  ownerId: 'upload-intent-smoke',
  fileName: unsafeName,
})
assert(
  canonicalPath.startsWith('workspaces/workspace-smoke/projects/project-smoke/source-media/upload-intent-smoke/'),
  'Canonical source media path should use workspace/project/source-media prefix.',
)

const adapter = new LocalStorageAdapter(env.localStorageRoot)
const body = Buffer.from('fake mp4 bytes for upload smoke')
const checksumSha256 = createHash('sha256').update(body).digest('hex')
const metadata = await adapter.putObject({
  bucketName: 'source-media',
  objectPath: canonicalPath,
  body,
  mimeType: 'video/mp4',
})
assert(metadata.exists, 'Local adapter should write object metadata.')
assert(metadata.sizeBytes === body.byteLength, 'Local adapter should report size.')
assert(metadata.checksumSha256 === checksumSha256, 'Local adapter should report checksum.')
const identicalRetry = await adapter.putObject({
  bucketName: 'source-media',
  objectPath: canonicalPath,
  body,
  mimeType: 'video/mp4',
})
assert(identicalRetry.checksumSha256 === checksumSha256, 'Create-only local writes should accept byte-identical retries.')

const verifiedMetadata = await adapter.verifyUploadedObject({
  bucketName: 'source-media',
  objectPath: canonicalPath,
  expectedSizeBytes: body.byteLength,
  checksumSha256,
})
assert(verifiedMetadata.exists, 'Local adapter should verify uploaded object.')

let unsafeMimeRejected = false
try {
  assertAllowedUpload({ purpose: 'source_media', mimeType: 'text/html', expectedSizeBytes: 1 })
} catch {
  unsafeMimeRejected = true
}
assert(unsafeMimeRejected, 'Upload validation should reject unsafe MIME types.')

const serviceContext: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'upload-smoke-request',
  auth: {
    userId: 'user-smoke',
    isMockUser: true,
  },
}
const uploadService = createUploadService(serviceContext)
const projectService = createProjectService(serviceContext)
const otherUserProjectService = createProjectService({
  ...serviceContext,
  requestId: 'upload-smoke-other-user-project-request',
  auth: {
    userId: 'user-other',
    isMockUser: true,
  },
})
const otherUserUploadService = createUploadService({
  ...serviceContext,
  requestId: 'upload-smoke-other-user-request',
  auth: {
    userId: 'user-other',
    isMockUser: true,
  },
})
const createdProject = await projectService.createProject({
  workspaceId: 'workspace-smoke',
  name: 'Upload storage smoke project',
})
const projectId = createdProject.project.id
const listedProjects = await projectService.listProjects('workspace-smoke')
assert(
  listedProjects.projects.some((project) => project.id === projectId && project.name === 'Upload storage smoke project'),
  'Project list should include current-user internal testing projects.',
)
const otherUserListedProjects = await otherUserProjectService.listProjects('workspace-smoke')
assert(
  !otherUserListedProjects.projects.some((project) => project.id === projectId),
  'Project list must not expose another user project.',
)
const created = await uploadService.createUploadIntent({
  workspaceId: 'workspace-smoke',
  projectId,
  uploadPurpose: 'source_media',
  originalFileName: 'clip.mp4',
  mimeType: 'video/mp4',
  expectedSizeBytes: body.byteLength,
  checksumSha256,
})
assert(created.uploadTarget.uploadUrl.includes('/local-object'), 'Local upload target should be a backend route.')
assert(created.uploadTarget.uploadUrl.includes('workspaceId=workspace-smoke'), 'Local upload target should carry exact workspace scope.')
assert(created.uploadTarget.createOnly, 'Local upload targets should be create-only.')
assert(!created.uploadIntent.targetPath.includes('http'), 'Canonical target path should not be a signed URL.')

const clientMetadataOnlyAdapter = new ClientMetadataOnlyGcsAdapter()
const clientMetadataOnlyUploadService = createUploadService({
  ...serviceContext,
  requestId: 'upload-smoke-client-metadata-only',
  storageAdapter: clientMetadataOnlyAdapter,
})
const forgedChecksumIntent = await clientMetadataOnlyUploadService.createUploadIntent({
  workspaceId: 'workspace-smoke',
  projectId,
  uploadPurpose: 'source_media',
  originalFileName: 'forged-checksum.mp4',
  mimeType: 'video/mp4',
  expectedSizeBytes: body.byteLength,
  checksumSha256,
})
await assertRejects(
  () => clientMetadataOnlyUploadService.finalizeUploadIntent({
    workspaceId: 'workspace-smoke',
    uploadIntentId: forgedChecksumIntent.uploadIntent.id,
  }),
  'A client-controlled checksum metadata value must not finalize without server-computed byte evidence.',
)
assert(clientMetadataOnlyAdapter.deleteAttempted, 'Rejected GCS integrity evidence should trigger exact-generation cleanup.')

for (const streamMode of ['short', 'wrong_hash'] as const) {
  const probeAdapter = new ProbeStagingGcsAdapter(
    body,
    streamMode,
    streamMode === 'short' ? 'warning' : 'error',
  )
  const probeService = createUploadService({
    ...serviceContext,
    requestId: `upload-smoke-probe-${streamMode}`,
    storageAdapter: probeAdapter,
  })
  const probeIntent = await probeService.createUploadIntent({
    workspaceId: 'workspace-smoke',
    projectId,
    uploadPurpose: 'source_media',
    originalFileName: `probe-${streamMode}.mp4`,
    mimeType: 'video/mp4',
    expectedSizeBytes: body.byteLength,
    checksumSha256,
  })
  const probeError = await captureApiError(() => probeService.finalizeUploadIntent({
    workspaceId: 'workspace-smoke',
    uploadIntentId: probeIntent.uploadIntent.id,
  }))
  assert(
    (probeError.details as { reason?: string } | undefined)?.reason === (
      streamMode === 'short'
        ? 'source_probe_stage_size_mismatch'
        : 'source_probe_stage_checksum_mismatch'
    ),
    `Probe ${streamMode} must fail with the exact terminal integrity reason.`,
  )
  const cleanupDetails = probeError.details as {
    objectCleanupStatus?: string
    objectCleanupWarnings?: string[]
  }
  if (streamMode === 'short') {
    assert(cleanupDetails.objectCleanupStatus === 'warning', 'Provider cleanup warnings must remain attached to terminal evidence.')
    assert(
      cleanupDetails.objectCleanupWarnings?.includes('Exact-generation cleanup requires reconciliation.') === true,
      'Provider cleanup warning text must remain available to internal evidence.',
    )
  } else {
    assert(cleanupDetails.objectCleanupStatus === 'failed', 'Provider cleanup failure must remain attached to terminal evidence.')
  }
  const aggregate = await readPrivateUploadMediaAuthorityAggregate({
    localStorageRoot: env.localStorageRoot,
    ownerUserId: 'user-smoke',
    workspaceId: 'workspace-smoke',
  })
  const storedIntent = aggregate?.uploadIntents.find((record) => record.id === probeIntent.uploadIntent.id)
  assert(storedIntent?.status === 'failed', `Probe ${streamMode} integrity drift must mark the upload intent failed.`)
  assert(
    !aggregate?.mediaAssets.some((record) => record.uploadIntentId === probeIntent.uploadIntent.id),
    `Probe ${streamMode} integrity drift must not create ready media authority.`,
  )
  assert(
    probeAdapter.deleteIdentities.some((identity) =>
      identity?.generation === 'probe-generation-1' && identity.etag === 'probe-etag-1'
    ),
    `Probe ${streamMode} integrity drift must attempt exact-generation cleanup.`,
  )
}

const retryableProbeAdapter = new ProbeStagingGcsAdapter(body, 'open_error')
const retryableProbeService = createUploadService({
  ...serviceContext,
  requestId: 'upload-smoke-probe-retryable',
  storageAdapter: retryableProbeAdapter,
})
const retryableProbeIntent = await retryableProbeService.createUploadIntent({
  workspaceId: 'workspace-smoke',
  projectId,
  uploadPurpose: 'source_media',
  originalFileName: 'probe-retryable.mp4',
  mimeType: 'video/mp4',
  expectedSizeBytes: body.byteLength,
  checksumSha256,
})
const retryableProbeError = await captureApiError(() => retryableProbeService.finalizeUploadIntent({
  workspaceId: 'workspace-smoke',
  uploadIntentId: retryableProbeIntent.uploadIntent.id,
}))
assert(
  (retryableProbeError.details as { reason?: string } | undefined)?.reason === 'source_probe_stage_failed',
  'Operational source stream failure must be classified separately from integrity contradiction.',
)
const aggregateAfterRetryableFailure = await readPrivateUploadMediaAuthorityAggregate({
  localStorageRoot: env.localStorageRoot,
  ownerUserId: 'user-smoke',
  workspaceId: 'workspace-smoke',
})
assert(
  aggregateAfterRetryableFailure?.uploadIntents.find((record) => record.id === retryableProbeIntent.uploadIntent.id)?.status === 'signed',
  'Operational source stream failure must leave the upload intent retryable.',
)
assert(retryableProbeAdapter.deleteIdentities.length === 0, 'Operational source stream failure must not delete valid GCS media.')
retryableProbeAdapter.streamMode = 'exact'
const retryableProbeFinalized = await retryableProbeService.finalizeUploadIntent({
  workspaceId: 'workspace-smoke',
  uploadIntentId: retryableProbeIntent.uploadIntent.id,
})
assert(retryableProbeFinalized.uploadIntent.status === 'finalized', 'A retry after an operational stream failure must finalize safely.')
assert(
  retryableProbeAdapter.readIdentities.some((identity) =>
    identity?.generation === 'probe-generation-1' && identity.etag === 'probe-etag-1'
  ),
  'Retryable probe staging must reopen the exact verified object identity.',
)

await assertRejects(
  () => otherUserUploadService.uploadLocalObject(created.uploadIntent.id, 'workspace-smoke', body, 'video/mp4'),
  'Cross-user local object upload should be rejected.',
)
await assertRejects(
  () => uploadService.uploadLocalObject(created.uploadIntent.id, 'workspace-smoke', body, 'image/png'),
  'Local object upload MIME type must match the signed upload intent.',
)
await assertRejects(
  () => otherUserUploadService.recordSignedUrlEvent({
    workspaceId: 'workspace-smoke',
    uploadIntentId: created.uploadIntent.id,
    urlPurpose: 'upload',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  }),
  'Cross-user signed URL event for an upload intent should be rejected.',
)

const uploaded = await uploadService.uploadLocalObject(created.uploadIntent.id, 'workspace-smoke', body, 'video/mp4')
assert(uploaded.localObjectUpload.checksumSha256 === checksumSha256, 'Local object upload should compute checksum.')

await assertRejects(
  () => otherUserUploadService.finalizeUploadIntent({
    workspaceId: 'workspace-smoke',
    uploadIntentId: created.uploadIntent.id,
  }),
  'Cross-user upload finalization should be rejected.',
)

const finalized = await uploadService.finalizeUploadIntent({
  workspaceId: 'workspace-smoke',
  uploadIntentId: created.uploadIntent.id,
})
assert(finalized.storageObjectRecord.bucketName === created.uploadIntent.targetBucket, 'Finalized storage bucket should match intent.')
assert(finalized.storageObjectRecord.objectPath === created.uploadIntent.targetPath, 'Finalized object path should match intent.')
assert(!JSON.stringify(finalized.storageObjectRecord).toLowerCase().includes('signedurl'), 'Canonical storage metadata should not store signed URL fields.')
assert(finalized.mediaAsset.sourceMetadata?.probeStatus === 'unavailable', 'FFprobe-only failure must remain nonblocking after exact staging integrity passes.')
assert(
  finalized.mediaAsset.sourceMetadata?.unavailableReason?.includes('reeditpro-missing-ffprobe-upload-smoke') === true,
  'Upload probing must honor the configured FFPROBE_BIN value.',
)

await assertRejects(
  () => otherUserUploadService.getStorageObjectRecord(finalized.storageObjectRecord.id, 'workspace-smoke'),
  'Cross-user storage object read should be rejected.',
)
await assertRejects(
  () => otherUserUploadService.createDownloadTarget(finalized.storageObjectRecord.id, 'workspace-smoke'),
  'Cross-user local download target should be rejected.',
)
await assertRejects(
  () => otherUserUploadService.createLocalObjectStream(finalized.storageObjectRecord.id, 'workspace-smoke'),
  'Cross-user local object stream should be rejected.',
)

const privateObjectStream = await uploadService.createLocalObjectStream(finalized.storageObjectRecord.id, 'workspace-smoke')
assert(privateObjectStream.storageObjectRecord.id === finalized.storageObjectRecord.id, 'Private object stream should return the canonical storage object record.')
const privateObjectBytes = await readStreamToBuffer(privateObjectStream.stream)
assert(privateObjectBytes.equals(body), 'Private object stream should return the uploaded private bytes.')

const downloadTarget = await uploadService.createDownloadTarget(
  finalized.storageObjectRecord.id,
  'workspace-smoke',
)
assert(downloadTarget.downloadTarget.downloadUrl.includes('/local-object'), 'Local download target should be a backend route.')
assert(!downloadTarget.downloadTarget.downloadUrl.startsWith('file:'), 'Local download target must not expose file paths.')

await assertRejects(
  () => adapter.putObject({
    bucketName: finalized.storageObjectRecord.bucketName,
    objectPath: finalized.storageObjectRecord.objectPath,
    body: Buffer.from('tampered private source bytes'),
    mimeType: 'video/mp4',
  }),
  'Create-only local storage must reject different-byte collisions.',
)
const finalizedObjectPath = path.resolve(
  env.localStorageRoot,
  finalized.storageObjectRecord.bucketName,
  finalized.storageObjectRecord.objectPath,
)
await mkdir(path.dirname(finalizedObjectPath), { recursive: true })
await writeFile(finalizedObjectPath, Buffer.from('tampered private source bytes'))
await assertRejects(
  () => uploadService.createLocalObjectStream(finalized.storageObjectRecord.id, 'workspace-smoke'),
  'Private object stream should reject checksum drift before serving bytes.',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'filename_sanitizer_blocks_traversal',
    'canonical_path_builder',
    'local_adapter_write_metadata',
    'local_adapter_create_only_identical_retry',
    'local_adapter_create_only_collision_rejected',
    'local_adapter_checksum_verification',
    'client_checksum_metadata_cannot_finalize',
    'rejected_generation_cleanup_attempted',
    'probe_short_stream_marks_intent_failed_and_deletes_exact_generation',
    'probe_wrong_hash_marks_intent_failed_and_deletes_exact_generation',
    'probe_operational_failure_remains_retryable_without_object_deletion',
    'probe_retry_reopens_exact_generation_and_finalizes',
    'canonical_metadata_excludes_signed_url',
    'ffprobe_only_failure_finalizes_as_unavailable_after_verified_staging',
    'configured_ffprobe_binary_is_honored',
    'unsafe_mime_rejected',
    'upload_intent_requires_owned_backend_project_record',
    'project_list_recovers_owned_internal_testing_project',
    'project_list_rejects_cross_user_project_visibility',
    'cross_user_upload_intent_access_rejected',
    'local_upload_mime_mismatch_rejected',
    'cross_user_private_object_access_rejected',
    'private_object_stream_returns_uploaded_bytes',
    'private_object_stream_rejects_checksum_drift',
    'local_download_target_backend_route',
  ],
}))
await rm(env.localStorageRoot, { force: true, recursive: true })

async function assertRejects(action: () => Promise<unknown>, message: string): Promise<void> {
  let rejected = false
  try {
    await action()
  } catch {
    rejected = true
  }
  assert(rejected, message)
}

async function captureApiError(action: () => Promise<unknown>): Promise<ApiError> {
  try {
    await action()
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw new Error('Expected source probe finalization to reject with ApiError.', { cause: error })
    }
    assert(error.code === 'UPLOAD_NOT_FINALIZED', 'Source probe finalization must fail with UPLOAD_NOT_FINALIZED.')
    return error
  }
  throw new Error('Expected source probe finalization to reject.')
}

async function readStreamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
