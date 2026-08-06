import assert from 'node:assert/strict'
import { rm } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { clearLocalProjectMemoryForSmoke, createProjectService } from '../services/project-service'
import { createUploadService } from '../services/upload-service'
import { LocalStorageAdapter } from '../storage/local-storage-adapter'
import type { StorageAdapter } from '../storage/storage-types'
import type { ServiceContext } from '../types'
import {
  assertCanonicalDurableUploadTargetConformanceEvidence,
  createInMemoryCanonicalDurableUploadTargetStatePort,
  runCanonicalDurableUploadTargetConformance,
} from '../upload-target-authority'

const localStorageRoot = `/tmp/reeditpro-canonical-upload-target-${process.pid}`
await rm(localStorageRoot, { force: true, recursive: true })
clearLocalProjectMemoryForSmoke()

class CountingLocalStorageAdapter extends LocalStorageAdapter {
  createUploadTargetCount = 0

  override async createUploadTarget(
    input: Parameters<StorageAdapter['createUploadTarget']>[0],
  ) {
    this.createUploadTargetCount += 1
    return super.createUploadTarget(input)
  }
}

try {
  const conformance = await runCanonicalDurableUploadTargetConformance()
  assertCanonicalDurableUploadTargetConformanceEvidence(conformance)
  assert.ok(conformance.checkCount >= 10)
  assert.equal(conformance.targetCreationCount, 1)
  assert.equal(conformance.unknownTargetDuplicateCreationCount, 0)

  const env = loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    API_PORT: '8787',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    SIGNED_URL_TTL_SECONDS: '900',
    SUPABASE_URL: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
  })
  const storageAdapter = new CountingLocalStorageAdapter(localStorageRoot)
  const authority = createInMemoryCanonicalDurableUploadTargetStatePort()
  const context: ServiceContext = {
    env,
    clients: { admin: null, public: null },
    requestId: 'canonical-upload-target-service-smoke',
    auth: {
      userId: 'user-canonical-upload-target',
      isMockUser: true,
    },
    storageAdapter,
    canonicalDurableUploadTargetStatePort: authority.port,
    canonicalUploadTargetCredentialEscrow: authority.escrow,
  }
  const project = await createProjectService(context).createProject({
    workspaceId: 'workspace-canonical-upload-target',
    name: 'Canonical upload target service smoke',
  })
  const uploadInput = {
    workspaceId: 'workspace-canonical-upload-target',
    projectId: project.project.id,
    uploadPurpose: 'source_media' as const,
    originalFileName: 'professional-source-4k.mov',
    mimeType: 'video/quicktime',
    expectedSizeBytes: 64 * 1024 * 1024,
    idempotencyKey: 'canonical-upload-target-service-domain-key',
  }
  const uploadService = createUploadService(context)
  const first = await uploadService.createUploadIntent(uploadInput)
  const replay = await uploadService.createUploadIntent(uploadInput)
  assert.equal(first.uploadIntent.id, replay.uploadIntent.id)
  assert.equal(first.uploadTarget.uploadUrl, replay.uploadTarget.uploadUrl)
  assert.equal(storageAdapter.createUploadTargetCount, 1)
  assert.match(replay.warnings.join(' '), /recovered_exact_target/u)
  assert.deepEqual(authority.fixture.snapshot().operationLog, [
    'resolve_intent',
    'claim_target',
    'commit_target',
  ])
  await uploadService.authorizeUploadIntentWrite(
    first.uploadIntent.id,
    uploadInput.workspaceId,
  )
  await assert.rejects(
    () => uploadService.createUploadIntent({
      ...uploadInput,
      originalFileName: 'changed-source.mov',
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'IDEMPOTENCY_CONFLICT',
  )
  assert.equal(storageAdapter.createUploadTargetCount, 1)

  const routeAuthority = createInMemoryCanonicalDurableUploadTargetStatePort()
  const routeStorageAdapter = new CountingLocalStorageAdapter(localStorageRoot)
  const server = await listen(createServer(createReeditProApiApp(env, {
    clients: { admin: null, public: null },
    storageAdapter: routeStorageAdapter,
    canonicalDurableUploadTargetStatePort: routeAuthority.port,
    canonicalUploadTargetCredentialEscrow: routeAuthority.escrow,
  })))
  try {
    const baseUrl = serverBaseUrl(server)
    const projectResponse = await fetch(`${baseUrl}/v1/projects`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'canonical-upload-target-http-project-key',
      },
      body: JSON.stringify({
        workspaceId: 'workspace-canonical-upload-target-http',
        name: 'Canonical HTTP upload target smoke',
      }),
    })
    const projectResponseBody = await projectResponse.text()
    assert.equal(projectResponse.status, 201, projectResponseBody)
    const projectPayload = JSON.parse(projectResponseBody) as {
      data?: { project?: { id?: string } }
    }
    const projectId = projectPayload.data?.project?.id
    assert.ok(projectId)
    const routeUploadBody = {
      workspaceId: 'workspace-canonical-upload-target-http',
      uploadPurpose: 'source_media',
      originalFileName: 'route-professional-source.mp4',
      mimeType: 'video/mp4',
      expectedSizeBytes: 96 * 1024 * 1024,
    }
    const createRouteUpload = () => fetch(
      `${baseUrl}/v1/projects/${projectId}/upload-intents`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': 'canonical-upload-target-http-domain-key',
        },
        body: JSON.stringify(routeUploadBody),
      },
    )
    const firstRouteResponse = await createRouteUpload()
    const firstRouteResponseBody = await firstRouteResponse.text()
    assert.equal(firstRouteResponse.status, 201, firstRouteResponseBody)
    const firstRoutePayload = JSON.parse(firstRouteResponseBody) as UploadRoutePayload
    const replayRouteResponse = await createRouteUpload()
    const replayRouteResponseBody = await replayRouteResponse.text()
    assert.equal(replayRouteResponse.status, 201, replayRouteResponseBody)
    const replayRoutePayload = JSON.parse(replayRouteResponseBody) as UploadRoutePayload
    assert.equal(
      firstRoutePayload.data?.uploadIntent?.id,
      replayRoutePayload.data?.uploadIntent?.id,
    )
    assert.equal(
      firstRoutePayload.data?.uploadTarget?.uploadUrl,
      replayRoutePayload.data?.uploadTarget?.uploadUrl,
    )
    assert.equal(routeStorageAdapter.createUploadTargetCount, 1)
    assert.equal(replayRouteResponse.headers.get('idempotency-replayed'), null)
  } finally {
    await close(server)
  }

  const incompleteContext: ServiceContext = {
    ...context,
    canonicalUploadTargetCredentialEscrow: undefined,
  }
  await assert.rejects(
    () => createUploadService(incompleteContext).authorizeCreateUploadIntent(uploadInput),
    (error: unknown) => error instanceof ApiError &&
      error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )

  console.log(JSON.stringify({
    verdict: 'CANONICAL_DURABLE_UPLOAD_TARGET_AUTHORITY_LOCAL_CONFORMANCE_PASSED_PRODUCTION_BLOCKED',
    conformance,
    serviceIntegration: {
      exactIntentReplay: true,
      exactTemporaryTargetReplay: true,
      storageTargetCreationCount: storageAdapter.createUploadTargetCount,
      downstreamPrivateLifecycleProjectionReadable: true,
      changedRequestConflict: true,
      partialAuthorityInjectionRejected: true,
      actualHttpRouteInjectedAuthorityReplay: true,
      productionAuthority: false,
      liveDatabaseUsed: false,
      liveGcsSessionCreated: false,
      providerCallMade: false,
      customerPriceCreditsServiceFeeIncluded: false,
    },
  }, null, 2))
} finally {
  clearLocalProjectMemoryForSmoke()
  await rm(localStorageRoot, { force: true, recursive: true })
}

interface UploadRoutePayload {
  data?: {
    uploadIntent?: { id?: string }
    uploadTarget?: { uploadUrl?: string }
  }
}

async function listen(server: Server): Promise<Server> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })
  return server
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}

function serverBaseUrl(server: Server): string {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Smoke server address is unavailable.')
  return `http://127.0.0.1:${address.port}`
}
