import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, mkdtemp, rm, stat } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import { MEDIA_UPLOAD_API_ROUTES } from '../../src/backend/api/routes/media-upload-api-routes'
import { finalizeUploadedSource } from '../../src/lib/large-media-finalization-client'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { clearLocalProjectMemoryForSmoke } from '../services/project-service'
import {
  claimPrivateLargeMediaFinalizationJob,
  clearPrivateLargeMediaFinalizationProcessStateForSmoke,
} from '../services/private-large-media-finalization-authority-store'
import { clearPrivateUploadMediaAuthorityProcessStateForSmoke } from '../services/private-upload-media-authority-store'
import { createLargeMediaFinalizationService } from '../services/large-media-finalization-service'
import { createUploadService } from '../services/upload-service'
import type {
  DownloadTarget,
  ObjectMetadata,
  StorageAdapter,
  UploadTarget,
} from '../storage/storage-types'
import {
  assessLargeMediaFinalizationCapacity,
  clearLargeMediaWorkerCapacityReservationsForSmoke,
} from '../workers/media/media-worker-capacity-policy'

const GIB = 1024 ** 3

async function main(): Promise<void> {
const workspaceId = 'large-media-finalization-workspace'
const localStorageRoot = await mkdtemp(join(tmpdir(), 'reeditpro-large-finalization-'))
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'gcs',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  GOOGLE_CLOUD_PROJECT_ID: 'large-media-finalization-smoke',
  WORKER_INSTANCE_ID: 'large-media-finalization-worker',
  WORKER_CLAIM_LEASE_SECONDS: '300',
})
const storage = new NoNetworkGcsStorageAdapter()
const server = await listen(createServer(createReeditProApiApp(env, {
  storageAdapter: storage,
  clients: { admin: null, public: null },
})))
const baseUrl = serverBaseUrl(server)
const context = {
  env,
  clients: { admin: null, public: null },
  requestId: 'large-media-finalization-service-smoke',
  auth: { userId: 'mock-user-runtime', isMockUser: true },
  storageAdapter: storage,
}

try {
  const projectResponse = await postJson(`${baseUrl}/v1/projects`, {
    workspaceId,
    name: 'Restart-safe large media finalization',
  }, 'large-media-project')
  assert.equal(projectResponse.response.status, 201, JSON.stringify(projectResponse.json))
  const projectId = requiredString(projectResponse.json.data?.project?.id)

  const first = await createLargeUploadAndJob({
    baseUrl,
    projectId,
    workspaceId,
    expectedSizeBytes: 100 * GIB,
    suffix: 'concurrent',
  })

  assert.equal(first.inlineFinalize.response.status, 409)
  assert.equal(first.inlineFinalize.json.error?.code, 'SOURCE_MEDIA_NOT_READY')
  assert.equal(storage.verifyUploadedObjectCalls, 0)
  assert.equal(storage.createReadStreamCalls, 0)
  assert.equal(first.queued.response.status, 202)
  assert.equal(first.queued.json.data?.largeMediaFinalizationJob?.status, 'queued')
  assert.equal(first.replayed.response.status, 202)
  assert.equal(
    first.replayed.json.data?.largeMediaFinalizationJob?.jobId,
    first.queued.json.data?.largeMediaFinalizationJob?.jobId,
  )
  assert.equal(first.conflict.response.status, 409)
  assert.equal(first.conflict.json.error?.code, 'IDEMPOTENCY_CONFLICT')
  const firstJobId = requiredString(first.queued.json.data?.largeMediaFinalizationJob?.jobId)

  const queuedView = await getJson(
    `${baseUrl}/v1/large-media-finalization-jobs/${encodeURIComponent(firstJobId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
  )
  assert.equal(queuedView.response.status, 200, JSON.stringify(queuedView.json))
  assertSafePublicJobView(queuedView.json.data?.largeMediaFinalizationJob)

  const invalidInternalRun = await postJson(
    `${baseUrl}/v1/internal/large-media-finalization-jobs/${encodeURIComponent(firstJobId)}/run`,
    { workspaceId, purpose: 'browser_cannot_authorize_worker_execution' },
  )
  assert.equal(invalidInternalRun.response.status, 400)
  assert.equal(invalidInternalRun.json.error?.code, 'VALIDATION_FAILED')

  clearPrivateLargeMediaFinalizationProcessStateForSmoke()
  clearLargeMediaWorkerCapacityReservationsForSmoke()
  clearPrivateUploadMediaAuthorityProcessStateForSmoke()
  clearLocalProjectMemoryForSmoke()

  let releaseExecution!: () => void
  const executionRelease = new Promise<void>((resolve) => { releaseExecution = resolve })
  let executionStarted!: () => void
  const executionStart = new Promise<void>((resolve) => { executionStarted = resolve })
  let executionCount = 0
  const concurrentService = createLargeMediaFinalizationService(context, {
    inspectWorkerCapacity: admittedWorkerCapacity,
    executeFinalization: async (_context, input) => {
      executionCount += 1
      executionStarted()
      await executionRelease
      return syntheticFinalizationResult(input.uploadIntentId, input.expectedSizeBytes)
    },
  })
  const restartedRead = await concurrentService.get({ workspaceId, jobId: firstJobId })
  assert.equal(restartedRead.job.status, 'queued')

  const firstRunPromise = concurrentService.run({ workspaceId, jobId: firstJobId })
  await executionStart
  const overlappingRun = await concurrentService.run({ workspaceId, jobId: firstJobId })
  assert.equal(overlappingRun.executionStarted, false)
  assert.equal(overlappingRun.job.status, 'running')
  assert.equal(executionCount, 1)

  const runningRecordPath = await findLargeMediaJobRecord(localStorageRoot, firstJobId)
  const runningRecord = await readFile(runningRecordPath, 'utf8')
  assert(!runningRecord.includes('leaseCredential'))
  assert(!runningRecord.includes('large-media-http-enqueue-concurrent'))
  assert(!runningRecord.includes('https://storage.example.invalid'))

  releaseExecution()
  const completedRun = await firstRunPromise
  assert.equal(completedRun.executionStarted, true)
  assert.equal(completedRun.job.status, 'completed')
  assert.equal(completedRun.job.result?.sizeBytes, 100 * GIB)
  assert.equal(executionCount, 1)
  assertSafePublicJobView(completedRun.job)

  const completedReplay = await concurrentService.run({ workspaceId, jobId: firstJobId })
  assert.equal(completedReplay.executionStarted, false)
  assert.equal(completedReplay.job.status, 'completed')
  assert.equal(executionCount, 1)

  const completedHttpRead = await getJson(
    `${baseUrl}/v1/large-media-finalization-jobs/${encodeURIComponent(firstJobId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
  )
  assert.equal(completedHttpRead.response.status, 200)
  assert.equal(completedHttpRead.json.data?.largeMediaFinalizationJob?.status, 'completed')
  assertSafePublicJobView(completedHttpRead.json.data?.largeMediaFinalizationJob)

  const retry = await createLargeUploadAndJob({
    baseUrl,
    projectId,
    workspaceId,
    expectedSizeBytes: 250 * GIB,
    suffix: 'retry',
  })
  const retryJobId = requiredString(retry.queued.json.data?.largeMediaFinalizationJob?.jobId)
  let retryAttemptCount = 0
  const retryService = createLargeMediaFinalizationService(context, {
    inspectWorkerCapacity: admittedWorkerCapacity,
    executeFinalization: async (_context, input) => {
      retryAttemptCount += 1
      if (retryAttemptCount === 1) throw new Error('simulated restart-safe operational interruption')
      return syntheticFinalizationResult(input.uploadIntentId, input.expectedSizeBytes)
    },
  })
  const retryableFailure = await retryService.run({ workspaceId, jobId: retryJobId })
  assert.equal(retryableFailure.job.status, 'failed_retryable')
  assert.equal(retryableFailure.job.retryAvailable, true)
  const retrySuccess = await retryService.run({ workspaceId, jobId: retryJobId })
  assert.equal(retrySuccess.job.status, 'completed')
  assert.equal(retrySuccess.job.attemptCount, 2)
  assert.equal(retryAttemptCount, 2)

  const capacityBlocked = await createLargeUploadAndJob({
    baseUrl,
    projectId,
    workspaceId,
    expectedSizeBytes: 300 * GIB,
    suffix: 'capacity-blocked',
  })
  const capacityBlockedJobId = requiredString(capacityBlocked.queued.json.data?.largeMediaFinalizationJob?.jobId)
  let capacityBlockedExecutionCount = 0
  const capacityBlockedService = createLargeMediaFinalizationService(context, {
    inspectWorkerCapacity: async ({ expectedSourceBytes }) => assessLargeMediaFinalizationCapacity({
      expectedSourceBytes,
      availableBytes: expectedSourceBytes,
    }),
    executeFinalization: async (_context, input) => {
      capacityBlockedExecutionCount += 1
      return syntheticFinalizationResult(input.uploadIntentId, input.expectedSizeBytes)
    },
  })
  const capacityBlockedRun = await capacityBlockedService.run({
    workspaceId,
    jobId: capacityBlockedJobId,
  })
  assert.equal(capacityBlockedRun.executionStarted, false)
  assert.equal(capacityBlockedRun.job.status, 'queued')
  assert.equal(capacityBlockedRun.job.attemptCount, 0)
  assert.equal(capacityBlockedExecutionCount, 0)
  assert.match(capacityBlockedRun.warnings.join(' '), /enough verified private staging capacity/)

  const reclaim = await createLargeUploadAndJob({
    baseUrl,
    projectId,
    workspaceId,
    expectedSizeBytes: 400 * GIB,
    suffix: 'lease-reclaim',
  })
  const reclaimJobId = requiredString(reclaim.queued.json.data?.largeMediaFinalizationJob?.jobId)
  await assert.rejects(
    createUploadService(context).finalizeUploadIntent({
      workspaceId,
      uploadIntentId: reclaim.uploadIntentId,
      sizeBytes: 400 * GIB,
    }, { backgroundWorkerAuthority: true }),
    /Large inline finalization must fail closed before object verification/,
  )
  const retryEligibleCandidate = await createUploadService(context).getUploadFinalizationCandidate(
    reclaim.uploadIntentId,
    workspaceId,
  )
  assert.equal(retryEligibleCandidate.status, 'signed')
  const scope = {
    localStorageRoot,
    ownerUserId: 'mock-user-runtime',
    workspaceId,
  }
  const baseTimeMs = Date.now()
  const initialClaim = await claimPrivateLargeMediaFinalizationJob({
    scope,
    jobId: reclaimJobId,
    workerInstanceId: 'lease-worker-one',
    now: new Date(baseTimeMs).toISOString(),
    leaseDurationMs: 30_000,
    attemptTimeoutMs: 60_000,
    credentialFactory: () => 'a'.repeat(64),
  })
  assert.equal(initialClaim.disposition, 'claimed')
  const activeLeaseClaim = await claimPrivateLargeMediaFinalizationJob({
    scope,
    jobId: reclaimJobId,
    workerInstanceId: 'lease-worker-two',
    now: new Date(baseTimeMs + 10_000).toISOString(),
    leaseDurationMs: 30_000,
    attemptTimeoutMs: 60_000,
    credentialFactory: () => 'b'.repeat(64),
  })
  assert.equal(activeLeaseClaim.disposition, 'already_running')
  const reclaimedClaim = await claimPrivateLargeMediaFinalizationJob({
    scope,
    jobId: reclaimJobId,
    workerInstanceId: 'lease-worker-two',
    now: new Date(baseTimeMs + 31_000).toISOString(),
    leaseDurationMs: 30_000,
    attemptTimeoutMs: 60_000,
    credentialFactory: () => 'b'.repeat(64),
  })
  assert.equal(reclaimedClaim.disposition, 'claimed')
  assert.equal(reclaimedClaim.job.attemptCount, 2)

  await assertPrivateJobStoreModes(localStorageRoot)
  assert.equal(storage.verifyUploadedObjectCalls, 1)
  assert.equal(storage.createReadStreamCalls, 0)
  assert.equal(storage.putObjectCalls, 0)
  assert.equal(storage.deleteObjectCalls, 0)

  for (const routeId of [
    'media.largeFinalizationJob.create',
    'media.largeFinalizationJob.get',
    'media.largeFinalizationJob.runInternal',
  ]) {
    assert(MEDIA_UPLOAD_API_ROUTES.some((route) => route.id === routeId), `Missing route registry entry: ${routeId}`)
  }

  await assertBrowserLargeMediaFinalizationFlow()

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'large_inline_finalize_fails_closed_before_object_read',
      'authenticated_enqueue_and_poll_routes_are_registered_and_mounted',
      'durable_domain_idempotency_replay_and_conflict',
      'restart_read_from_checksum_protected_private_authority',
      'one_active_lease_prevents_duplicate_execution',
      'bounded_retry_can_complete_on_second_attempt',
      'insufficient_worker_capacity_starts_no_byte_traversal_and_consumes_no_attempt',
      'operational_verification_failure_preserves_retry_eligible_upload_authority',
      'expired_lease_is_reclaimable_without_reusing_credential',
      'public_job_view_exposes_no_paths_urls_or_lease_credentials',
      'private_job_files_are_0600_and_directories_are_0700',
      'browser_resumable_path_enqueues_polls_and_reads_canonical_finalization',
      'no_live_gcs_provider_supabase_render_credit_or_editing_execution',
    ],
    policyEvidenceOnly: true,
    liveLargeObjectProcessed: false,
    distributedQueueReady: false,
    productReady: false,
    externalBetaReady: false,
    productionReady: false,
  }))
} finally {
  await close(server)
  clearPrivateLargeMediaFinalizationProcessStateForSmoke()
  clearLargeMediaWorkerCapacityReservationsForSmoke()
  clearPrivateUploadMediaAuthorityProcessStateForSmoke()
  clearLocalProjectMemoryForSmoke()
  await rm(localStorageRoot, { recursive: true, force: true })
}
}

async function assertBrowserLargeMediaFinalizationFlow(): Promise<void> {
  const requests: Array<{ method: string; url: string; authorization?: string; idempotencyKey?: string }> = []
  const progress: string[] = []
  let pollCount = 0
  const fetchImpl = (async (request: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(request)
    const headers = new Headers(init?.headers)
    const method = init?.method ?? 'GET'
    requests.push({
      method,
      url,
      authorization: headers.get('authorization') ?? undefined,
      idempotencyKey: headers.get('idempotency-key') ?? undefined,
    })
    if (method === 'POST' && url.endsWith('/v1/upload-intents/client-upload/finalization-jobs')) {
      return jsonResponse(202, {
        ok: true,
        data: { largeMediaFinalizationJob: clientJob('queued', 0) },
        warnings: ['queued privately'],
      })
    }
    if (method === 'GET' && url.includes('/v1/large-media-finalization-jobs/client-job')) {
      pollCount += 1
      return jsonResponse(200, {
        ok: true,
        data: { largeMediaFinalizationJob: clientJob(pollCount === 1 ? 'running' : 'completed', 1) },
        warnings: [],
      })
    }
    if (method === 'POST' && url.endsWith('/v1/upload-intents/client-upload/finalize')) {
      return jsonResponse(200, {
        ok: true,
        data: {
          uploadIntent: { id: 'client-upload', status: 'finalized' },
          storageObjectRecord: { id: 'client-storage' },
          mediaAsset: { id: 'client-media' },
        },
        warnings: ['canonical authority read'],
      })
    }
    return jsonResponse(404, { ok: false, error: { message: 'unexpected client smoke route' } })
  }) as typeof fetch

  const result = await finalizeUploadedSource<{
    uploadIntent: { id: string }
    storageObjectRecord: { id: string }
    mediaAsset: { id: string }
  }>({
    apiBaseUrl: 'https://api.reeditpro.invalid',
    uploadIntentId: 'client-upload',
    workspaceId: 'client-workspace',
    sizeBytes: 100 * GIB,
    uploadProtocol: 'gcs_resumable',
    supportsResume: true,
    authorization: 'Bearer browser-user-token',
    finalizeIdempotencyKey: 'client-finalize-key',
    finalizationJobIdempotencyKey: 'client-job-key',
    fetchImpl,
    pollIntervalMs: 0,
    maximumPollDurationMs: 1_000,
    onProgress: (state) => progress.push(state.status),
  })
  assert.equal(result.sourceFinalizationJobCreated, true)
  assert.equal(result.sourceFinalizationJobId, 'client-job')
  assert.equal(result.finalized.mediaAsset.id, 'client-media')
  assert.deepEqual(progress, ['queued', 'running', 'completed'])
  assert.equal(pollCount, 2)
  assert(requests.every((request) => request.authorization === 'Bearer browser-user-token'))
  assert(requests.some((request) => request.idempotencyKey === 'client-job-key'))
  assert(requests.some((request) => request.idempotencyKey === 'client-finalize-key'))
  assert(requests.every((request) => !request.url.includes('/v1/internal/')))
}

function clientJob(status: 'queued' | 'running' | 'completed', attemptCount: number) {
  return {
    jobId: 'client-job',
    status,
    attemptCount,
    maximumAttempts: 3,
    pollAfterMs: 0,
    retryAvailable: false,
  }
}

function jsonResponse(status: number, value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

class NoNetworkGcsStorageAdapter implements StorageAdapter {
  readonly mode = 'gcs' as const
  createUploadTargetCalls = 0
  verifyUploadedObjectCalls = 0
  createReadStreamCalls = 0
  putObjectCalls = 0
  deleteObjectCalls = 0

  async createUploadTarget(input: Parameters<StorageAdapter['createUploadTarget']>[0]): Promise<UploadTarget> {
    this.createUploadTargetCalls += 1
    return {
      uploadMethod: 'PUT',
      uploadUrl: `https://storage.example.invalid/resumable/${encodeURIComponent(input.uploadIntentId)}`,
      uploadHeaders: { 'content-type': input.mimeType },
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
      createOnly: true,
      uploadProtocol: 'gcs_resumable',
      supportsResume: true,
      recommendedChunkSizeBytes: 32 * 1024 ** 2,
      sessionUriIsCredential: true,
    }
  }

  async putObject(): Promise<ObjectMetadata> {
    this.putObjectCalls += 1
    throw new Error('No-network smoke must not write object bytes.')
  }

  async verifyUploadedObject(): Promise<ObjectMetadata> {
    this.verifyUploadedObjectCalls += 1
    throw new Error('Large inline finalization must fail closed before object verification.')
  }

  async createDownloadTarget(): Promise<DownloadTarget> {
    throw new Error('No-network smoke must not create a download target.')
  }

  async getObjectMetadata(): Promise<ObjectMetadata> {
    throw new Error('No-network smoke must not read provider metadata.')
  }

  async createReadStream(): Promise<Readable> {
    this.createReadStreamCalls += 1
    throw new Error('No-network smoke must not stream provider bytes.')
  }

  async deleteObject(): Promise<{ deleted: boolean; warnings: string[] }> {
    this.deleteObjectCalls += 1
    throw new Error('No-network smoke must not delete provider objects.')
  }
}

async function createLargeUploadAndJob(input: {
  baseUrl: string
  projectId: string
  workspaceId: string
  expectedSizeBytes: number
  suffix: string
}) {
  const intent = await postJson(`${input.baseUrl}/v1/projects/${encodeURIComponent(input.projectId)}/upload-intents`, {
    workspaceId: input.workspaceId,
    uploadPurpose: 'source_media',
    originalFileName: `${input.suffix}-camera-master.mxf`,
    mimeType: 'application/mxf',
    expectedSizeBytes: input.expectedSizeBytes,
  }, `large-media-intent-${input.suffix}`)
  assert.equal(intent.response.status, 201, JSON.stringify(intent.json))
  const uploadIntentId = requiredString(intent.json.data?.uploadIntent?.id)
  assert.equal(intent.json.data?.uploadTarget?.supportsResume, true)

  const inlineFinalize = await postJson(
    `${input.baseUrl}/v1/upload-intents/${encodeURIComponent(uploadIntentId)}/finalize`,
    { workspaceId: input.workspaceId, sizeBytes: input.expectedSizeBytes },
    `large-media-inline-finalize-${input.suffix}`,
  )
  const enqueueBody = { workspaceId: input.workspaceId, sizeBytes: input.expectedSizeBytes }
  const queued = await postJson(
    `${input.baseUrl}/v1/upload-intents/${encodeURIComponent(uploadIntentId)}/finalization-jobs`,
    enqueueBody,
    `large-media-http-enqueue-${input.suffix}`,
  )
  const replayed = await postJson(
    `${input.baseUrl}/v1/upload-intents/${encodeURIComponent(uploadIntentId)}/finalization-jobs`,
    enqueueBody,
    `large-media-http-enqueue-${input.suffix}`,
  )
  const conflict = await postJson(
    `${input.baseUrl}/v1/upload-intents/${encodeURIComponent(uploadIntentId)}/finalization-jobs`,
    enqueueBody,
    `large-media-http-conflict-${input.suffix}`,
  )
  assert.equal(queued.response.status, 202, JSON.stringify(queued.json))
  return { uploadIntentId, intent, inlineFinalize, queued, replayed, conflict }
}

function syntheticFinalizationResult(uploadIntentId: string, sizeBytes: number) {
  const checksumSha256 = createHash('sha256').update(`${uploadIntentId}:${sizeBytes}`).digest('hex')
  return {
    uploadIntent: { id: uploadIntentId },
    storageObjectRecord: {
      id: `storage-${uploadIntentId}`,
      sizeBytes,
      checksumSha256,
    },
    mediaAsset: {
      id: `media-${uploadIntentId}`,
      sizeBytes,
      checksumSha256,
    },
  }
}

async function admittedWorkerCapacity(input: {
  expectedSourceBytes: number
}) {
  const requirement = assessLargeMediaFinalizationCapacity({
    expectedSourceBytes: input.expectedSourceBytes,
  }).requiredAvailableBytes
  return assessLargeMediaFinalizationCapacity({
    expectedSourceBytes: input.expectedSourceBytes,
    availableBytes: requirement,
  })
}

function assertSafePublicJobView(value: unknown): void {
  assert(value && typeof value === 'object')
  const serialized = JSON.stringify(value)
  for (const forbidden of [
    'objectPath',
    'bucketName',
    'uploadUrl',
    'downloadUrl',
    'localStorageRoot',
    'leaseCredential',
    'credentialSha256',
    'idempotencyKeyHash',
    'requestHash',
  ]) {
    assert(!serialized.includes(forbidden), `Public finalization view leaked ${forbidden}.`)
  }
}

async function assertPrivateJobStoreModes(root: string): Promise<void> {
  const jobRoot = join(root, 'internal', 'large-media-finalization')
  const paths = await walk(jobRoot)
  const jsonFiles = paths.filter((path) => path.endsWith('.json'))
  assert(jsonFiles.length >= 3)
  for (const path of paths) {
    const info = await stat(path)
    assert.equal(info.mode & 0o777, info.isDirectory() ? 0o700 : 0o600, `Unsafe private mode at ${path}`)
  }
}

async function findLargeMediaJobRecord(root: string, jobId: string): Promise<string> {
  const matches = (await walk(join(root, 'internal', 'large-media-finalization')))
    .filter((path) => path.endsWith(`/${jobId}.json`))
  assert.equal(matches.length, 1)
  return matches[0]!
}

async function walk(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const paths: string[] = []
  for (const entry of entries) {
    const path = join(root, entry.name)
    paths.push(path)
    if (entry.isDirectory()) paths.push(...await walk(path))
  }
  return paths
}

type JsonEnvelope = {
  data?: {
    project?: { id?: string }
    uploadIntent?: { id?: string }
    uploadTarget?: { supportsResume?: boolean }
    largeMediaFinalizationJob?: Record<string, unknown> & {
      jobId?: string
      status?: string
    }
  }
  error?: { code?: string; message?: string }
}

async function postJson(
  url: string,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<{ response: Response; json: JsonEnvelope }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  })
  return { response, json: await response.json() as JsonEnvelope }
}

async function getJson(url: string): Promise<{ response: Response; json: JsonEnvelope }> {
  const response = await fetch(url)
  return { response, json: await response.json() as JsonEnvelope }
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value) throw new Error('Required smoke value is missing.')
  return value
}

async function listen(server: Server): Promise<Server> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })
  return server
}

function serverBaseUrl(server: Server): string {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Smoke server address is unavailable.')
  return `http://127.0.0.1:${address.port}`
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}

await main()
