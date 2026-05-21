import { createHash } from 'node:crypto'
import { loadRuntimeEnv } from '../config/env'
import { createUploadService } from '../services/upload-service'
import { LocalStorageAdapter } from '../storage/local-storage-adapter'
import { buildCanonicalObjectPath, sanitizeFileName } from '../storage/storage-paths'
import { assertAllowedUpload } from '../storage/storage-validation'
import type { ServiceContext } from '../types'

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
  SIGNED_URL_TTL_SECONDS: '900',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

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
const created = await uploadService.createUploadIntent({
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  uploadPurpose: 'source_media',
  originalFileName: 'clip.mp4',
  mimeType: 'video/mp4',
  expectedSizeBytes: body.byteLength,
  checksumSha256,
})
assert(created.uploadTarget.uploadUrl.includes('/local-object'), 'Local upload target should be a backend route.')
assert(!created.uploadIntent.targetPath.includes('http'), 'Canonical target path should not be a signed URL.')

const uploaded = await uploadService.uploadLocalObject(created.uploadIntent.id, body, 'video/mp4')
assert(uploaded.localObjectUpload.checksumSha256 === checksumSha256, 'Local object upload should compute checksum.')

const finalized = await uploadService.finalizeUploadIntent({
  workspaceId: 'workspace-smoke',
  uploadIntentId: created.uploadIntent.id,
})
assert(finalized.storageObjectRecord.bucketName === created.uploadIntent.targetBucket, 'Finalized storage bucket should match intent.')
assert(finalized.storageObjectRecord.objectPath === created.uploadIntent.targetPath, 'Finalized object path should match intent.')
assert(!JSON.stringify(finalized.storageObjectRecord).toLowerCase().includes('signedurl'), 'Canonical storage metadata should not store signed URL fields.')

const downloadTarget = await uploadService.createDownloadTarget(
  finalized.storageObjectRecord.id,
  'workspace-smoke',
)
assert(downloadTarget.downloadTarget.downloadUrl.includes('/local-object'), 'Local download target should be a backend route.')
assert(!downloadTarget.downloadTarget.downloadUrl.startsWith('file:'), 'Local download target must not expose file paths.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'filename_sanitizer_blocks_traversal',
    'canonical_path_builder',
    'local_adapter_write_metadata',
    'local_adapter_checksum_verification',
    'canonical_metadata_excludes_signed_url',
    'unsafe_mime_rejected',
    'local_download_target_backend_route',
  ],
}))
