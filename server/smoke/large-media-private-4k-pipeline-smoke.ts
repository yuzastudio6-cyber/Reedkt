import assert from 'node:assert/strict'
import { createReadStream, openAsBlob } from 'node:fs'
import {
  mkdir,
  mkdtemp,
  open,
  readdir,
  rm,
  stat,
  type FileHandle,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable, Transform } from 'node:stream'

import { uploadFileToTemporaryObjectTarget } from '../../src/lib/temporary-object-upload-client'
import {
  REEDITPRO_ANALYSIS_PROXY_POLICY,
  REEDITPRO_RESUMABLE_UPLOAD_MIN_CHUNK_BYTES,
  REEDITPRO_RESUMABLE_UPLOAD_THRESHOLD_BYTES,
} from '../../src/types/large-media'
import { loadRuntimeEnv } from '../config/env'
import { clearLocalProjectMemoryForSmoke, createProjectService } from '../services/project-service'
import { createLargeMediaFinalizationService } from '../services/large-media-finalization-service'
import { clearPrivateLargeMediaFinalizationProcessStateForSmoke } from '../services/private-large-media-finalization-authority-store'
import { clearPrivateUploadMediaAuthorityProcessStateForSmoke } from '../services/private-upload-media-authority-store'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import type {
  DownloadTarget,
  ObjectMetadata,
  ObjectReadIdentity,
  StorageAdapter,
  UploadTarget,
  VerifyObjectInput,
} from '../storage/storage-types'
import {
  buildStorageArtifactReference,
  createProfessional4kResumableMediaFixture,
  inspectLocalMediaFileAuthority,
  probeMediaFile,
  runMediaAnalysisFoundation,
} from '../workers/media'
import {
  inspectLargeMediaFinalizationCapacity,
} from '../workers/media/media-worker-capacity-policy'
import {
  buildWorkerIdempotencyKey,
  type ProductionWorkerJobPayload,
} from '../workers/production'

const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/

async function main(): Promise<void> {
  clearPrivateLargeMediaFinalizationProcessStateForSmoke()
  clearPrivateUploadMediaAuthorityProcessStateForSmoke()
  clearLocalProjectMemoryForSmoke()

  const fixtureResult = await createProfessional4kResumableMediaFixture()
  assert(fixtureResult.ok, fixtureResult.ok ? undefined : fixtureResult.skipReason.message)
  const { fixture } = fixtureResult
  const privateRoot = await mkdtemp(path.join(tmpdir(), 'reeditpro-private-4k-pipeline-'))
  const providerRoot = await mkdtemp(path.join(tmpdir(), 'reeditpro-private-4k-provider-'))
  const storage = new LocalBackedResumableGcsAdapter(providerRoot)

  try {
    const sourceAuthority = await inspectLocalMediaFileAuthority(fixture.sourceVideoPath)
    assert(sourceAuthority.sizeBytes > REEDITPRO_RESUMABLE_UPLOAD_THRESHOLD_BYTES)

    const env = loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      STORAGE_MODE: 'gcs',
      LOCAL_STORAGE_ROOT: privateRoot,
      GOOGLE_CLOUD_PROJECT_ID: 'reeditpro-private-4k-pipeline-smoke',
      WORKER_INSTANCE_ID: 'reeditpro-private-4k-pipeline-worker',
      WORKER_CLAIM_LEASE_SECONDS: '300',
    })
    const context: ServiceContext = {
      env,
      clients: { admin: null, public: null },
      requestId: 'large-media-private-4k-pipeline-smoke',
      auth: { userId: 'large-media-private-4k-user', isMockUser: true },
      storageAdapter: storage,
    }
    const workspaceId = 'large-media-private-4k-workspace'
    const project = await createProjectService(context).createProject({
      workspaceId,
      name: 'Professional 4K resumable pipeline proof',
    })
    const uploadService = createUploadService(context)
    const created = await uploadService.createUploadIntent({
      workspaceId,
      projectId: project.project.id,
      uploadPurpose: 'source_media',
      originalFileName: 'professional-4k-source.mkv',
      mimeType: 'video/x-matroska',
      expectedSizeBytes: sourceAuthority.sizeBytes,
      idempotencyKey: 'large-media-private-4k-upload-intent-v1',
    })
    assert.equal(created.uploadTarget.uploadProtocol, 'gcs_resumable')
    assert.equal(created.uploadTarget.supportsResume, true)
    assert.equal(created.uploadTarget.createOnly, true)

    const sourceBlob = await openAsBlob(fixture.sourceVideoPath, { type: 'video/x-matroska' })
    let wholeSourceArrayBufferCalled = false
    Object.defineProperty(sourceBlob, 'arrayBuffer', {
      value: async () => {
        wholeSourceArrayBufferCalled = true
        throw new Error('The browser upload path must not buffer the complete 4K source.')
      },
    })
    const progressStates: string[] = []
    const uploaded = await uploadFileToTemporaryObjectTarget({
      apiBaseUrl: 'https://api.reeditpro.invalid',
      authorization: 'Bearer private-browser-token-must-not-leak',
      fetchImpl: storage.fetch,
      file: sourceBlob,
      mimeType: 'video/x-matroska',
      target: created.uploadTarget,
      retryDelayMs: 0,
      onProgress: (progress) => progressStates.push(progress.state),
    })
    assert.equal(uploaded.protocol, 'gcs_resumable')
    assert.equal(uploaded.uploadedBytes, sourceAuthority.sizeBytes)
    assert.equal(uploaded.resumedAfterInterruption, true)
    assert.equal(wholeSourceArrayBufferCalled, false)
    assert(progressStates.includes('recovering'))
    assert.equal(progressStates.at(-1), 'completed')
    assert.equal(storage.crossOriginAuthorizationSeen, false)
    assert(storage.maximumChunkBodyBytes <= REEDITPRO_RESUMABLE_UPLOAD_MIN_CHUNK_BYTES)
    assert.equal(storage.committedBytes, sourceAuthority.sizeBytes)

    const capacity = await inspectLargeMediaFinalizationCapacity({
      filesystemPath: privateRoot,
      expectedSourceBytes: sourceAuthority.sizeBytes,
    })
    assert.equal(capacity.status, 'admitted', 'The private test worker must prove staging capacity before reading bytes.')

    const finalizationService = createLargeMediaFinalizationService(context)
    const queued = await finalizationService.enqueue({
      workspaceId,
      uploadIntentId: created.uploadIntent.id,
      suppliedSizeBytes: sourceAuthority.sizeBytes,
      idempotencyKey: 'large-media-private-4k-finalization-job-v1',
    })
    assert.equal(queued.job.status, 'queued')
    const completed = await finalizationService.run({
      workspaceId,
      jobId: queued.job.jobId,
    })
    assert.equal(completed.executionStarted, true)
    assert.equal(completed.job.status, 'completed')
    assert.equal(completed.job.attemptCount, 1)
    assert.equal(completed.job.result?.sizeBytes, sourceAuthority.sizeBytes)
    assert.equal(completed.job.result?.checksumSha256, sourceAuthority.checksumSha256)
    assert.equal(completed.job.result?.sourceMetadata?.probeStatus, 'probed')
    assert.equal(completed.job.result?.sourceMetadata?.width, 3840)
    assert.equal(completed.job.result?.sourceMetadata?.height, 2160)
    assert.equal(completed.job.result?.sourceMetadata?.hasAudio, true)
    assert.equal(storage.verifyUploadedObjectCalls, 1)
    assert.equal(storage.createReadStreamCalls, 1)
    assert.equal(storage.finalizationStreamedBytes, sourceAuthority.sizeBytes)
    await assertNoRegularFiles(path.join(privateRoot, 'upload-probes'))

    const finalizedStorage = await uploadService.getStorageObjectRecord(
      completed.job.result!.storageObjectRecordId,
      workspaceId,
    )
    const storageRecord = finalizedStorage.storageObjectRecord
    assert.equal(storageRecord.sizeBytes, sourceAuthority.sizeBytes)
    assert.equal(storageRecord.checksumSha256, sourceAuthority.checksumSha256)
    assert.equal(storageRecord.generation, storage.generation)
    assert.equal(storageRecord.etag, storage.etag)

    const workerPayload = exactMediaFoundationPayload({
      workspaceId,
      projectId: project.project.id,
      mediaAssetId: completed.job.result!.mediaAssetId,
      storageObjectRecordId: completed.job.result!.storageObjectRecordId,
    })
    const outputRoot = path.join(privateRoot, 'internal', 'large-media-4k-output')
    await assert.rejects(
      runMediaAnalysisFoundation({
        mode: 'local_dev',
        workspaceId,
        projectId: project.project.id,
        mediaAssetId: completed.job.result!.mediaAssetId,
        sourceStorageObjectId: completed.job.result!.storageObjectRecordId,
        workerPayload,
        requireExactSourceAuthority: true,
        source: buildStorageArtifactReference({
          sourceStorageObjectId: completed.job.result!.storageObjectRecordId,
          storageBucketPurpose: 'source_media',
          storageObjectPath: storageRecord.objectPath,
          localFilePath: storage.localFilePath(storageRecord.bucketName, storageRecord.objectPath),
          contentType: 'video/x-matroska',
          sizeBytes: sourceAuthority.sizeBytes,
          checksumSha256: '0'.repeat(64),
          generation: storageRecord.generation,
          etag: storageRecord.etag,
          authorityRole: 'immutable_source_master',
        }),
        outputRoot: path.join(privateRoot, 'internal', 'large-media-4k-tamper-output'),
        tasks: ['probe', 'create_proxy'],
        timeoutMs: 120_000,
      }),
      /checksum does not match/,
    )
    assert.equal((await readTreeIfExists(path.join(privateRoot, 'internal', 'large-media-4k-tamper-output'))).length, 0)
    const mediaFoundation = await runMediaAnalysisFoundation({
      mode: 'local_dev',
      workspaceId,
      projectId: project.project.id,
      mediaAssetId: completed.job.result!.mediaAssetId,
      sourceStorageObjectId: completed.job.result!.storageObjectRecordId,
      workerPayload,
      requireExactSourceAuthority: true,
      source: buildStorageArtifactReference({
        sourceStorageObjectId: completed.job.result!.storageObjectRecordId,
        storageBucketPurpose: 'source_media',
        storageObjectPath: storageRecord.objectPath,
        localFilePath: storage.localFilePath(storageRecord.bucketName, storageRecord.objectPath),
        contentType: 'video/x-matroska',
        sizeBytes: sourceAuthority.sizeBytes,
        checksumSha256: sourceAuthority.checksumSha256,
        generation: storageRecord.generation,
        etag: storageRecord.etag,
        authorityRole: 'immutable_source_master',
      }),
      outputRoot,
      tasks: ['probe', 'create_proxy', 'build_analysis_report'],
      timeoutMs: 120_000,
    })
    assert.equal(mediaFoundation.probe?.width, 3840)
    assert.equal(mediaFoundation.probe?.height, 2160)
    assert.equal(mediaFoundation.proxy?.status, 'created')
    assert.equal(mediaFoundation.proxy?.profileId, REEDITPRO_ANALYSIS_PROXY_POLICY.id)
    assert.equal(mediaFoundation.proxy?.width, 1920)
    assert.equal(mediaFoundation.proxy?.height, 1080)
    assert.equal(mediaFoundation.proxy?.originalMasterPreserved, true)
    assert.deepEqual(mediaFoundation.sourceAuthorityEvidence, {
      sourceStorageObjectId: completed.job.result!.storageObjectRecordId,
      authorityRole: 'immutable_source_master',
      expectedSizeBytes: sourceAuthority.sizeBytes,
      expectedChecksumSha256: sourceAuthority.checksumSha256,
      generation: storage.generation,
      etag: storage.etag,
      verifiedBeforeProcessing: true,
      verifiedAfterProcessing: true,
      immutableSourceMasterPreserved: true,
      analysisDerivativesFinalRenderEligible: false,
    })

    const proxyArtifact = mediaFoundation.proxy?.artifact
    assert(proxyArtifact?.localFilePath)
    assert(SHA256_HEX_PATTERN.test(proxyArtifact.checksum ?? ''))
    assert.equal(proxyArtifact.sourceChecksumSha256, sourceAuthority.checksumSha256)
    assert.equal(proxyArtifact.sourceGeneration, storage.generation)
    assert.equal(proxyArtifact.sourceEtag, storage.etag)
    assert.equal(proxyArtifact.derivativeRole, 'analysis_proxy')
    assert.equal(proxyArtifact.finalRenderEligible, false)
    assert.equal(proxyArtifact.immutableSourceMasterPreserved, true)
    const proxyRecord = mediaFoundation.artifactRecords.find((record) => record.artifactType === 'proxy_video')
    assert(proxyRecord)
    assert.equal(proxyRecord.checksum, proxyArtifact.checksum)
    assert.equal(proxyRecord.metadata.sourceChecksumSha256, sourceAuthority.checksumSha256)
    assert.equal(proxyRecord.metadata.derivativeRole, 'analysis_proxy')
    assert.equal(proxyRecord.metadata.finalRenderEligible, false)
    assert.equal(proxyRecord.metadata.immutableSourceMasterPreserved, true)

    const proxyProbe = await probeMediaFile({
      localFilePath: proxyArtifact.localFilePath,
      ffprobeBin: 'ffprobe',
      timeoutMs: 30_000,
    })
    assert.equal(proxyProbe.width, 1920)
    assert.equal(proxyProbe.height, 1080)
    assert.equal(proxyProbe.codecName, 'h264')
    assert.equal(proxyProbe.videoStreams[0]?.pixelFormat, 'yuv420p')
    assert.equal(proxyProbe.videoStreams[0]?.colorSpace, 'bt709')
    assert.equal(proxyProbe.audioStreams.length, 1)
    assert.equal(proxyProbe.audioStreams[0]?.sampleRate, 48000)
    assert.equal((await stat(proxyArtifact.localFilePath)).mode & 0o777, 0o600)
    assert.equal((await stat(path.dirname(proxyArtifact.localFilePath))).mode & 0o777, 0o700)

    const sourceAfterProxy = await inspectLocalMediaFileAuthority(
      storage.localFilePath(storageRecord.bucketName, storageRecord.objectPath),
    )
    assert.deepEqual(sourceAfterProxy, sourceAuthority)
    assert.notEqual(proxyArtifact.localFilePath, storage.localFilePath(storageRecord.bucketName, storageRecord.objectPath))

    clearPrivateLargeMediaFinalizationProcessStateForSmoke()
    clearPrivateUploadMediaAuthorityProcessStateForSmoke()
    clearLocalProjectMemoryForSmoke()
    const restartedService = createLargeMediaFinalizationService(context)
    const restarted = await restartedService.get({ workspaceId, jobId: queued.job.jobId })
    assert.equal(restarted.job.status, 'completed')
    const replay = await restartedService.run({ workspaceId, jobId: queued.job.jobId })
    assert.equal(replay.executionStarted, false)
    assert.equal(replay.job.status, 'completed')
    assert.equal(storage.verifyUploadedObjectCalls, 1)
    assert.equal(storage.createReadStreamCalls, 1)

    await assertPrivateTreeModes(path.join(privateRoot, 'internal', 'large-media-finalization'))
    assert.equal((await stat(storage.localFilePath(storageRecord.bucketName, storageRecord.objectPath))).mode & 0o777, 0o600)

    console.log(JSON.stringify({
      ok: true,
      status: 'resumable_sized_4k_private_pipeline_verified_live_cloud_and_huge_scale_unverified',
      evidence: {
        actual4kSourceDimensions: '3840x2160',
        actualSourceBytes: sourceAuthority.sizeBytes,
        crossedResumableThresholdBytes: REEDITPRO_RESUMABLE_UPLOAD_THRESHOLD_BYTES,
        interruptedUploadRecovered: uploaded.resumedAfterInterruption,
        uploadRequestCount: uploaded.requestCount,
        maximumChunkBodyBytes: storage.maximumChunkBodyBytes,
        wholeSourceBrowserArrayBufferCalled: wholeSourceArrayBufferCalled,
        backendStoredByteHashVerified: true,
        exactGenerationAndEtagBound: true,
        privateProbeStageCompletedAndCleaned: true,
        sourceMetadataProbeVerified: true,
        durableFinalizationReplayVerified: true,
        exactSourceAuthorityVerifiedBeforeAndAfterProxy: true,
        proxyProfileId: REEDITPRO_ANALYSIS_PROXY_POLICY.id,
        proxyDimensions: `${proxyProbe.width}x${proxyProbe.height}`,
        proxyChecksumVerified: true,
        immutableOriginalRetainedForFinalRender: true,
        analysisProxyFinalRenderEligible: false,
        observedWorkerAvailableBytes: capacity.availableBytes,
        requiredWorkerAvailableBytes: capacity.requiredAvailableBytes,
      },
      boundaries: {
        shortByteRepresentativeFixtureNotLongDuration: true,
        real50GiB250GiBAnd1TiBRunsVerified: false,
        liveGcsCorsIamAndLifecycleVerified: false,
        distributedDispatcherVerified: false,
        durableByteProgressVerified: false,
        malwareAndParserSandboxVerified: false,
        hdrColorManagedTransformVerified: false,
        providerActivationAuthorized: false,
        remoteSupabaseAuthorized: false,
        billingOrWalletMutationAuthorized: false,
        deploymentAuthorized: false,
        publicDeliveryAuthorized: false,
        productReady: false,
        externalBetaReady: false,
        productionReady: false,
      },
    }, null, 2))
  } finally {
    clearPrivateLargeMediaFinalizationProcessStateForSmoke()
    clearPrivateUploadMediaAuthorityProcessStateForSmoke()
    clearLocalProjectMemoryForSmoke()
    await Promise.all([
      fixture.cleanup(),
      rm(privateRoot, { recursive: true, force: true }),
      rm(providerRoot, { recursive: true, force: true }),
    ])
  }
}

class LocalBackedResumableGcsAdapter implements StorageAdapter {
  readonly mode = 'gcs' as const
  readonly generation = '1700000000000001'
  etag = ''
  committedBytes = 0
  maximumChunkBodyBytes = 0
  crossOriginAuthorizationSeen = false
  verifyUploadedObjectCalls = 0
  createReadStreamCalls = 0
  finalizationStreamedBytes = 0

  private readonly providerRoot: string
  private readonly sessions = new Map<string, SessionRecord>()
  private readonly objects = new Map<string, SessionRecord>()
  private sessionSequence = 0
  private chunkWriteCount = 0
  private interruptionInjected = false

  constructor(providerRoot: string) {
    this.providerRoot = providerRoot
    this.fetch = this.fetch.bind(this)
  }

  async createUploadTarget(input: Parameters<StorageAdapter['createUploadTarget']>[0]): Promise<UploadTarget> {
    this.sessionSequence += 1
    const sessionId = `session-${this.sessionSequence}`
    const uploadUrl = `https://storage.example.invalid/resumable/${sessionId}`
    const record: SessionRecord = {
      uploadUrl,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      mimeType: input.mimeType,
      expectedSizeBytes: input.expectedSizeBytes ?? 0,
      localFilePath: path.join(this.providerRoot, 'objects', `${sessionId}.mkv`),
      committedBytes: 0,
    }
    this.sessions.set(uploadUrl, record)
    this.objects.set(objectKey(input.bucketName, input.objectPath), record)
    return {
      uploadMethod: 'PUT',
      uploadUrl,
      uploadHeaders: { 'content-type': input.mimeType },
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
      createOnly: true,
      uploadProtocol: 'gcs_resumable',
      supportsResume: true,
      recommendedChunkSizeBytes: REEDITPRO_RESUMABLE_UPLOAD_MIN_CHUNK_BYTES,
      sessionUriIsCredential: true,
    }
  }

  readonly fetch = async (request: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const uploadUrl = String(request)
    const session = this.sessions.get(uploadUrl)
    assert(session, 'Unknown private resumable test session.')
    const headers = new Headers(init?.headers)
    if (headers.has('authorization')) this.crossOriginAuthorizationSeen = true
    assert.equal(headers.get('content-type'), session.mimeType)
    const contentRange = headers.get('content-range') ?? ''

    const offsetQuery = /^bytes \*\/(\d+)$/.exec(contentRange)
    if (offsetQuery) {
      assert.equal(Number(offsetQuery[1]), session.expectedSizeBytes)
      return resumableProgressResponse(session.committedBytes)
    }

    const chunkRange = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(contentRange)
    assert(chunkRange, `Unreadable test Content-Range: ${contentRange}`)
    const start = Number(chunkRange[1])
    const end = Number(chunkRange[2])
    const total = Number(chunkRange[3])
    assert.equal(total, session.expectedSizeBytes)
    assert.equal(start, session.committedBytes)
    assert(end >= start)
    assert(init?.body instanceof Blob)
    const body = Buffer.from(await init.body.arrayBuffer())
    assert.equal(body.byteLength, end - start + 1)
    this.maximumChunkBodyBytes = Math.max(this.maximumChunkBodyBytes, body.byteLength)
    await this.writeChunk(session, body, start)
    session.committedBytes = end + 1
    this.committedBytes = session.committedBytes
    this.chunkWriteCount += 1

    if (this.chunkWriteCount === 2 && !this.interruptionInjected) {
      this.interruptionInjected = true
      throw new TypeError('Simulated response loss after the provider committed the second 4K source chunk.')
    }
    if (session.committedBytes === session.expectedSizeBytes) return new Response(null, { status: 200 })
    return resumableProgressResponse(session.committedBytes)
  }

  async putObject(): Promise<ObjectMetadata> {
    throw new Error('The resumable 4K proof must not use backend buffer uploads.')
  }

  async verifyUploadedObject(input: VerifyObjectInput): Promise<ObjectMetadata> {
    this.verifyUploadedObjectCalls += 1
    const record = this.requiredObject(input.bucketName, input.objectPath)
    const authority = await inspectLocalMediaFileAuthority(record.localFilePath)
    assert.equal(authority.sizeBytes, record.expectedSizeBytes)
    if (input.expectedSizeBytes !== undefined) assert.equal(authority.sizeBytes, input.expectedSizeBytes)
    if (input.checksumSha256 !== undefined) assert.equal(authority.checksumSha256, input.checksumSha256)
    this.etag = `"${authority.checksumSha256}"`
    return this.metadata(record, authority)
  }

  async createDownloadTarget(input: {
    storageObjectRecordId: string
    bucketName: string
    objectPath: string
    expiresAt: string
    generation?: string
    etag?: string
  }): Promise<DownloadTarget> {
    const record = this.requiredObject(input.bucketName, input.objectPath)
    this.assertIdentity(input)
    return {
      downloadMethod: 'GET',
      downloadUrl: `https://storage.example.invalid/private-download/${path.basename(record.localFilePath)}`,
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
      generation: this.generation,
      etag: this.etag,
    }
  }

  async getObjectMetadata(
    bucketName: string,
    objectPath: string,
    identity?: ObjectReadIdentity,
  ): Promise<ObjectMetadata> {
    this.assertIdentity(identity)
    const record = this.requiredObject(bucketName, objectPath)
    const authority = await inspectLocalMediaFileAuthority(record.localFilePath)
    return this.metadata(record, authority)
  }

  async createReadStream(
    bucketName: string,
    objectPath: string,
    identity?: ObjectReadIdentity,
  ): Promise<Readable> {
    this.assertIdentity(identity)
    const record = this.requiredObject(bucketName, objectPath)
    this.createReadStreamCalls += 1
    const counter = new Transform({
      transform: (chunk: Buffer, _encoding, callback) => {
        this.finalizationStreamedBytes += chunk.byteLength
        callback(null, chunk)
      },
    })
    return createReadStream(record.localFilePath).pipe(counter)
  }

  async deleteObject(
    bucketName: string,
    objectPath: string,
    identity?: ObjectReadIdentity,
  ): Promise<{ deleted: boolean; warnings: string[] }> {
    this.assertIdentity(identity)
    const record = this.requiredObject(bucketName, objectPath)
    await rm(record.localFilePath, { force: true })
    return { deleted: true, warnings: [] }
  }

  localFilePath(bucketName: string, objectPath: string): string {
    return this.requiredObject(bucketName, objectPath).localFilePath
  }

  private async writeChunk(record: SessionRecord, body: Buffer, position: number): Promise<void> {
    await mkdir(path.dirname(record.localFilePath), { recursive: true, mode: 0o700 })
    let handle: FileHandle | undefined
    try {
      handle = await open(record.localFilePath, position === 0 ? 'wx' : 'r+', 0o600)
      await handle.write(body, 0, body.byteLength, position)
      await handle.sync()
    } finally {
      await handle?.close()
    }
  }

  private requiredObject(bucketName: string, objectPath: string): SessionRecord {
    const record = this.objects.get(objectKey(bucketName, objectPath))
    assert(record, 'Private test object was not found.')
    assert.equal(record.committedBytes, record.expectedSizeBytes)
    return record
  }

  private assertIdentity(identity?: ObjectReadIdentity): void {
    if (!identity) return
    if (identity.generation !== undefined) assert.equal(identity.generation, this.generation)
    if (identity.etag !== undefined) assert.equal(identity.etag, this.etag)
  }

  private metadata(
    record: SessionRecord,
    authority: { sizeBytes: number; checksumSha256: string },
  ): ObjectMetadata {
    return {
      bucketName: record.bucketName,
      objectPath: record.objectPath,
      sizeBytes: authority.sizeBytes,
      checksumSha256: authority.checksumSha256,
      mimeType: record.mimeType,
      exists: true,
      generation: this.generation,
      etag: this.etag,
      metageneration: '1',
      integrityVerified: true,
      checksumSource: 'server_computed_bytes',
    }
  }
}

interface SessionRecord {
  uploadUrl: string
  bucketName: string
  objectPath: string
  mimeType: string
  expectedSizeBytes: number
  localFilePath: string
  committedBytes: number
}

function resumableProgressResponse(committedBytes: number): Response {
  return new Response(null, {
    status: 308,
    headers: committedBytes > 0 ? { range: `bytes=0-${committedBytes - 1}` } : undefined,
  })
}

function objectKey(bucketName: string, objectPath: string): string {
  return `${bucketName}\u0000${objectPath}`
}

function exactMediaFoundationPayload(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  storageObjectRecordId: string
}): ProductionWorkerJobPayload {
  const base: ProductionWorkerJobPayload = {
    jobId: 'large-media-private-4k-media-foundation-job',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    approvedSnapshotId: 'large-media-private-4k-approved-snapshot',
    editPlanId: 'large-media-private-4k-edit-plan',
    toolExecutionPlanId: 'large-media-private-4k-tool-execution-plan',
    workerType: 'cpu_analysis_worker',
    executionMode: 'mock_safe',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: 3,
    requestedToolIds: ['ffprobe', 'ffmpeg'],
    requestedRecipeIds: [REEDITPRO_ANALYSIS_PROXY_POLICY.id],
    storageReferenceIds: [input.storageObjectRecordId],
    creditReservationId: 'large-media-private-4k-synthetic-credit-reservation',
    createdAt: new Date().toISOString(),
    metadata: {
      sourceAuthority: 'immutable_source_master',
      proxyPolicyId: REEDITPRO_ANALYSIS_PROXY_POLICY.id,
      privateInternalOnly: true,
    },
  }
  return { ...base, idempotencyKey: buildWorkerIdempotencyKey(base) }
}

async function assertNoRegularFiles(root: string): Promise<void> {
  const entries = await readTreeIfExists(root)
  assert.equal(entries.filter((entry) => entry.kind === 'file').length, 0)
}

async function assertPrivateTreeModes(root: string): Promise<void> {
  for (const entry of await readTreeIfExists(root)) {
    const info = await stat(entry.path)
    assert.equal(info.mode & 0o777, entry.kind === 'directory' ? 0o700 : 0o600)
  }
}

async function readTreeIfExists(root: string): Promise<Array<{ path: string; kind: 'file' | 'directory' }>> {
  let directoryEntries
  try {
    directoryEntries = await readdir(root, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
  const result: Array<{ path: string; kind: 'file' | 'directory' }> = []
  for (const entry of directoryEntries) {
    const entryPath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      result.push({ path: entryPath, kind: 'directory' })
      result.push(...await readTreeIfExists(entryPath))
    } else if (entry.isFile()) {
      result.push({ path: entryPath, kind: 'file' })
    } else {
      assert.fail(`Unexpected private tree entry: ${entry.name}`)
    }
  }
  return result
}

await main()
