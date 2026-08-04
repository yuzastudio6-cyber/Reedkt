import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'
import { Storage } from '@google-cloud/storage'

import { loadRuntimeEnv } from '../config/env'
import { GcsStorageAdapter } from '../storage/gcs-storage-adapter'

type FakeGeneration = {
  body: Buffer
  generation: string
  etag: string
  metageneration: string
  contentType: string
  customMetadata?: Record<string, string>
}

type FakeFileOptions = {
  generation?: string | number
  preconditionOpts?: { ifGenerationMatch?: string | number }
}

type FakeSignedUrlConfig = {
  action: 'read' | 'write' | 'delete' | 'resumable'
  extensionHeaders?: Record<string, string>
}

class FakeGcsStorage {
  readonly signedUrlCalls: Array<{
    bucketName: string
    objectPath: string
    fileOptions?: FakeFileOptions
    config: FakeSignedUrlConfig
  }> = []

  private generationCounter = 1000
  private readonly objects = new Map<string, {
    liveGeneration?: string
    generations: Map<string, FakeGeneration>
  }>()

  bucket(bucketName: string) {
    return {
      file: (objectPath: string, options?: FakeFileOptions) => new FakeGcsFile(this, bucketName, objectPath, options),
    }
  }

  applySignedPut(input: {
    bucketName: string
    objectPath: string
    headers: Record<string, string>
    body: Buffer
    contentType: string
    customMetadata?: Record<string, string>
  }): FakeGeneration {
    const object = this.objectState(input.bucketName, input.objectPath)
    if (input.headers['x-goog-if-generation-match'] === '0' && object.liveGeneration) {
      throw providerError(412, 'create-only generation precondition failed')
    }
    return this.writeGeneration(input)
  }

  overwriteForRace(input: {
    bucketName: string
    objectPath: string
    body: Buffer
    contentType: string
  }): FakeGeneration {
    return this.writeGeneration(input)
  }

  metadata(bucketName: string, objectPath: string, generation?: string): FakeGeneration {
    const object = this.objectState(bucketName, objectPath)
    const resolvedGeneration = generation ?? object.liveGeneration
    const value = resolvedGeneration ? object.generations.get(resolvedGeneration) : undefined
    if (!value) throw providerError(404, 'object generation not found')
    return value
  }

  deleteGeneration(bucketName: string, objectPath: string, generation: string): void {
    const object = this.objectState(bucketName, objectPath)
    if (!object.generations.has(generation)) throw providerError(404, 'object generation not found')
    object.generations.delete(generation)
    if (object.liveGeneration === generation) object.liveGeneration = undefined
  }

  hasGeneration(bucketName: string, objectPath: string, generation: string): boolean {
    return this.objectState(bucketName, objectPath).generations.has(generation)
  }

  recordSignedUrl(
    bucketName: string,
    objectPath: string,
    fileOptions: FakeFileOptions | undefined,
    config: FakeSignedUrlConfig,
  ): string {
    this.signedUrlCalls.push({ bucketName, objectPath, fileOptions, config })
    const generation = fileOptions?.generation ? `?generation=${encodeURIComponent(String(fileOptions.generation))}` : ''
    return `https://fake-storage.invalid/${encodeURIComponent(bucketName)}/${encodeURIComponent(objectPath)}${generation}`
  }

  private writeGeneration(input: {
    bucketName: string
    objectPath: string
    body: Buffer
    contentType: string
    customMetadata?: Record<string, string>
  }): FakeGeneration {
    const generation = String(++this.generationCounter)
    const value: FakeGeneration = {
      body: Buffer.from(input.body),
      generation,
      etag: `etag-${generation}`,
      metageneration: '1',
      contentType: input.contentType,
      customMetadata: input.customMetadata,
    }
    const object = this.objectState(input.bucketName, input.objectPath)
    object.generations.set(generation, value)
    object.liveGeneration = generation
    return value
  }

  private objectState(bucketName: string, objectPath: string) {
    const key = `${bucketName}/${objectPath}`
    let object = this.objects.get(key)
    if (!object) {
      object = { generations: new Map() }
      this.objects.set(key, object)
    }
    return object
  }
}

class FakeGcsFile {
  private readonly storage: FakeGcsStorage
  private readonly bucketName: string
  private readonly objectPath: string
  private readonly options?: FakeFileOptions

  constructor(
    storage: FakeGcsStorage,
    bucketName: string,
    objectPath: string,
    options?: FakeFileOptions,
  ) {
    this.storage = storage
    this.bucketName = bucketName
    this.objectPath = objectPath
    this.options = options
  }

  async getSignedUrl(config: FakeSignedUrlConfig): Promise<[string]> {
    return [this.storage.recordSignedUrl(this.bucketName, this.objectPath, this.options, config)]
  }

  async getMetadata(): Promise<[Record<string, unknown>]> {
    const object = this.storage.metadata(
      this.bucketName,
      this.objectPath,
      this.options?.generation === undefined ? undefined : String(this.options.generation),
    )
    return [{
      size: String(object.body.byteLength),
      contentType: object.contentType,
      generation: object.generation,
      etag: object.etag,
      metageneration: object.metageneration,
      metadata: object.customMetadata,
    }]
  }

  createReadStream(): Readable {
    const object = this.storage.metadata(
      this.bucketName,
      this.objectPath,
      this.options?.generation === undefined ? undefined : String(this.options.generation),
    )
    return Readable.from([object.body])
  }

  async save(body: Buffer, options: {
    contentType?: string
    preconditionOpts?: { ifGenerationMatch?: string | number }
  }): Promise<void> {
    this.storage.applySignedPut({
      bucketName: this.bucketName,
      objectPath: this.objectPath,
      headers: {
        'x-goog-if-generation-match': String(
          options.preconditionOpts?.ifGenerationMatch ?? this.options?.preconditionOpts?.ifGenerationMatch ?? '',
        ),
      },
      body,
      contentType: options.contentType ?? 'application/octet-stream',
    })
  }

  async delete(): Promise<void> {
    const generation = this.options?.generation === undefined ? undefined : String(this.options.generation)
    const precondition = this.options?.preconditionOpts?.ifGenerationMatch
    if (!generation || String(precondition ?? '') !== generation) {
      throw providerError(412, 'generation-bound delete precondition missing')
    }
    this.storage.deleteGeneration(this.bucketName, this.objectPath, generation)
  }
}

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'gcs',
  GOOGLE_CLOUD_PROJECT_ID: 'reeditpro-gcs-integrity-smoke',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})
const fakeStorage = new FakeGcsStorage()
const adapter = new GcsStorageAdapter(env, fakeStorage as unknown as Storage)
const bucketName = 'reeditpro-source-media-integrity-smoke'
const replayPath = 'workspaces/workspace/projects/project/source-media/intent/replay.mp4'
const claimedChecksum = createHash('sha256').update('different claimed bytes').digest('hex')

const uploadTarget = await adapter.createUploadTarget({
  uploadIntentId: 'upload-intent-replay',
  bucketName,
  objectPath: replayPath,
  mimeType: 'video/mp4',
  checksumSha256: claimedChecksum,
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
})
assert.equal(uploadTarget.createOnly, true)
assert.equal(uploadTarget.uploadHeaders['x-goog-if-generation-match'], '0')
assert.equal(uploadTarget.uploadHeaders['x-goog-meta-sha256'], undefined)
assert.equal(
  fakeStorage.signedUrlCalls[0]?.config.extensionHeaders?.['x-goog-if-generation-match'],
  '0',
  'The create-only generation header must be part of the V4 signature.',
)

const firstBytes = Buffer.from('first immutable upload bytes')
const firstGeneration = fakeStorage.applySignedPut({
  bucketName,
  objectPath: replayPath,
  headers: uploadTarget.uploadHeaders,
  body: firstBytes,
  contentType: 'video/mp4',
  customMetadata: { sha256: claimedChecksum },
})
assert.throws(
  () => fakeStorage.applySignedPut({
    bucketName,
    objectPath: replayPath,
    headers: uploadTarget.uploadHeaders,
    body: Buffer.from('replayed overwrite bytes'),
    contentType: 'video/mp4',
    customMetadata: { sha256: claimedChecksum },
  }),
  /create-only generation precondition failed/,
)
assert.deepEqual(fakeStorage.metadata(bucketName, replayPath).body, firstBytes)

const unverifiedMetadata = await adapter.getObjectMetadata(bucketName, replayPath)
assert.equal(unverifiedMetadata.checksumSha256, '', 'Caller-controlled custom metadata must not be treated as SHA-256 evidence.')
assert.equal(unverifiedMetadata.integrityVerified, false)

await assert.rejects(
  () => adapter.verifyUploadedObject({
    bucketName,
    objectPath: replayPath,
    expectedSizeBytes: firstBytes.byteLength,
    checksumSha256: claimedChecksum,
  }),
  /checksum does not match expected checksum/,
)
assert.equal(
  fakeStorage.hasGeneration(bucketName, replayPath, firstGeneration.generation),
  false,
  'A failed-integrity generation should be deleted with an exact-generation precondition.',
)

const validPath = 'workspaces/workspace/projects/project/source-media/intent/valid.mp4'
const validBytes = Buffer.from('valid source media bytes')
const validChecksum = createHash('sha256').update(validBytes).digest('hex')
const validTarget = await adapter.createUploadTarget({
  uploadIntentId: 'upload-intent-valid',
  bucketName,
  objectPath: validPath,
  mimeType: 'video/mp4',
  checksumSha256: validChecksum,
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
})
fakeStorage.applySignedPut({
  bucketName,
  objectPath: validPath,
  headers: validTarget.uploadHeaders,
  body: validBytes,
  contentType: 'video/mp4',
  customMetadata: { sha256: claimedChecksum },
})

const verified = await adapter.verifyUploadedObject({
  bucketName,
  objectPath: validPath,
  expectedSizeBytes: validBytes.byteLength,
  checksumSha256: validChecksum,
})
assert.equal(verified.checksumSha256, validChecksum)
assert.equal(verified.integrityVerified, true)
assert.equal(verified.checksumSource, 'server_computed_bytes')
assert.ok(verified.generation)
assert.ok(verified.etag)

const downloadTarget = await adapter.createDownloadTarget({
  storageObjectRecordId: 'storage-object-valid',
  bucketName,
  objectPath: validPath,
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  generation: verified.generation,
  etag: verified.etag,
})
assert.equal(downloadTarget.generation, verified.generation)
assert.match(downloadTarget.downloadUrl, new RegExp(`generation=${verified.generation}`))

fakeStorage.overwriteForRace({
  bucketName,
  objectPath: validPath,
  body: Buffer.from('new privileged live generation'),
  contentType: 'video/mp4',
})
const generationBoundBytes = await readAll(await adapter.createReadStream(
  bucketName,
  validPath,
  { generation: verified.generation, etag: verified.etag },
))
assert.deepEqual(generationBoundBytes, validBytes, 'Reads must stay bound to the finalized object generation.')
await assert.rejects(
  () => adapter.getObjectMetadata(bucketName, validPath, {
    generation: verified.generation,
    etag: 'wrong-etag',
  }),
  /ETag does not match finalized object identity/,
)

const workerPath = 'workspaces/workspace/projects/project/qa-artifacts/job/idempotent.json'
const workerBytes = Buffer.from('{"ok":true}')
const firstWorkerWrite = await adapter.putObject({
  bucketName,
  objectPath: workerPath,
  body: workerBytes,
  mimeType: 'application/json',
})
const retriedWorkerWrite = await adapter.putObject({
  bucketName,
  objectPath: workerPath,
  body: workerBytes,
  mimeType: 'application/json',
})
assert.equal(retriedWorkerWrite.generation, firstWorkerWrite.generation)
await assert.rejects(
  () => adapter.putObject({
    bucketName,
    objectPath: workerPath,
    body: Buffer.from('{"ok":false}'),
    mimeType: 'application/json',
  }),
  /(?:size|checksum) does not match expected/,
)
assert.equal(
  fakeStorage.hasGeneration(bucketName, workerPath, firstWorkerWrite.generation ?? ''),
  true,
  'A mismatched backend idempotency collision must not delete the existing generation.',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'signed_put_has_create_only_generation_precondition',
    'signed_put_replay_cannot_overwrite_live_object',
    'client_custom_sha256_metadata_is_untrusted',
    'server_hashes_actual_generation_bytes',
    'false_checksum_cannot_verify',
    'failed_integrity_generation_deleted_exactly',
    'generation_and_etag_preserved',
    'download_target_bound_to_generation',
    'read_stream_bound_to_finalized_generation',
    'etag_mismatch_rejected',
    'backend_put_retry_accepts_only_identical_existing_bytes',
    'backend_put_collision_does_not_delete_existing_generation',
  ],
}))

async function readAll(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks)
}

function providerError(code: number, message: string): Error & { code: number } {
  return Object.assign(new Error(message), { code })
}
