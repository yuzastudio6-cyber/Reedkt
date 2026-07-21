import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import {
  EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS,
  materializeEditReferenceControlledMediaFixture,
} from '../edit-references/edit-reference-controlled-media-fixtures'
import { inspectEditReferenceLongFormSource } from '../edit-references/edit-reference-long-form-source-inspector'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'

const root = await mkdtemp(path.join(tmpdir(), 'reeditpro-long-form-inspector-'))
try {
  const fixtureDefinition = EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS[0]
  assert(fixtureDefinition)
  const fixture = await materializeEditReferenceControlledMediaFixture({
    outputRoot: path.join(root, 'fixture'),
    definition: fixtureDefinition,
    timeoutMs: 60_000,
  })
  const bytes = await readFile(fixture.videoPath)
  const checksum = createHash('sha256').update(bytes).digest('hex')
  const context = createContext(root)
  const uploadService = createUploadService(context)
  const upload = await uploadService.createUploadIntent({
    workspaceId: 'workspace-long-form-inspector',
    editReferenceId: 'edit-reference-long-form-inspector',
    uploadPurpose: 'reference_media',
    originalFileName: 'controlled-reference.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: bytes.length,
    checksumSha256: checksum,
  })
  await uploadService.uploadLocalObject(
    upload.uploadIntent.id,
    'workspace-long-form-inspector',
    bytes,
    'video/mp4',
  )
  const finalized = await uploadService.finalizeUploadIntent({
    workspaceId: 'workspace-long-form-inspector',
    uploadIntentId: upload.uploadIntent.id,
    sizeBytes: bytes.length,
    checksumSha256: checksum,
  })

  const beforeChecksum = createHash('sha256').update(bytes).digest('hex')
  const inspection = await inspectEditReferenceLongFormSource({
    env: context.env,
    storageObject: finalized.storageObjectRecord,
  })
  const storedBytes = await readFile(path.join(
    root,
    finalized.storageObjectRecord.bucketName,
    finalized.storageObjectRecord.objectPath,
  ))
  const afterChecksum = createHash('sha256').update(storedBytes).digest('hex')
  assert.equal(afterChecksum, beforeChecksum)
  assert.equal(inspection.source.privateMediaArtifactId, finalized.storageObjectRecord.id)
  assert.equal(inspection.source.mediaChecksumSha256, checksum)
  assert.equal(inspection.source.sizeBytes, bytes.length)
  assert.equal(inspection.source.mimeType, 'video/mp4')
  assert.equal(typeof inspection.source.hasAudio, 'boolean')
  assert.equal(inspection.mediaMetadata.hasAudio, inspection.source.hasAudio)
  assert(inspection.source.durationSeconds > 0)
  assert.equal(inspection.mediaMetadata.width, fixtureDefinition.width)
  assert.equal(inspection.mediaMetadata.height, fixtureDefinition.height)
  assert.equal(inspection.mediaMetadata.orientation, fixtureDefinition.width > fixtureDefinition.height ? 'landscape' : 'portrait')
  assert.equal(inspection.privateOriginalOpened, true)
  assert.equal(inspection.originalMutated, false)
  assert.equal(inspection.rawProbePayloadPersisted, false)
  assert.match(inspection.ingestIntegrityDigestSha256, /^[a-f0-9]{64}$/)
  assert.match(inspection.mediaProbeDigestSha256, /^[a-f0-9]{64}$/)
  assert(inspection.mediaProbeObservedWallClockMs >= 1)

  const corruptUpload = await uploadService.createUploadIntent({
    workspaceId: 'workspace-long-form-inspector',
    editReferenceId: 'edit-reference-long-form-inspector',
    uploadPurpose: 'reference_media',
    originalFileName: 'corrupt-reference.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: 16,
    checksumSha256: createHash('sha256').update(Buffer.alloc(16)).digest('hex'),
  })
  await uploadService.uploadLocalObject(
    corruptUpload.uploadIntent.id,
    'workspace-long-form-inspector',
    Buffer.alloc(16),
    'video/mp4',
  )
  const corruptFinalized = await uploadService.finalizeUploadIntent({
    workspaceId: 'workspace-long-form-inspector',
    uploadIntentId: corruptUpload.uploadIntent.id,
    sizeBytes: 16,
    checksumSha256: createHash('sha256').update(Buffer.alloc(16)).digest('hex'),
  })
  await assert.rejects(
    () => inspectEditReferenceLongFormSource({
      env: context.env,
      storageObject: corruptFinalized.storageObjectRecord,
    }),
    (error: unknown) => (
      error instanceof Error
      && error.message.includes('original remains safely stored')
      && !error.message.toLowerCase().includes('too large')
    ),
  )

  console.log(JSON.stringify({
    status: 'passed',
    realFfprobeExecuted: true,
    exactFinalizedStorageBinding: true,
    originalChecksumUnchanged: true,
    durationSeconds: inspection.source.durationSeconds,
    videoStreamVerified: true,
    corruptVideoFailedWithRecovery: true,
    arbitraryFileSizeFailureMessageUsed: false,
    providerCallMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
  }))
} finally {
  await rm(root, { recursive: true, force: true })
}

function createContext(localStorageRoot: string): ServiceContext {
  return {
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      API_PORT: '8787',
      STORAGE_MODE: 'local',
      LOCAL_STORAGE_ROOT: localStorageRoot,
      SIGNED_URL_TTL_SECONDS: '900',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    }),
    clients: { admin: null, public: null },
    requestId: 'long-form-source-inspector-smoke',
    auth: { userId: 'user-long-form-source-inspector', isMockUser: true },
  }
}
