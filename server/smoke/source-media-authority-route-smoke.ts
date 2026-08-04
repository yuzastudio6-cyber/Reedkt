import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { clearLocalProjectMemoryForSmoke } from '../services/project-service'
import { clearPrivateUploadMediaAuthorityProcessStateForSmoke } from '../services/private-upload-media-authority-store'

const localStorageRoot = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-source-route-'))
const internalToken = 'source-authority-route-internal-token'
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  SIGNED_URL_TTL_SECONDS: '900',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: internalToken,
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})
const server = await listen(createServer(createReeditProApiApp(env)))
const baseUrl = serverBaseUrl(server)

try {
  const projectResponse = await postJson(`${baseUrl}/v1/projects`, {
    workspaceId: 'workspace-source-route',
    name: 'Source authority route smoke',
  }, 'source-route-project')
  assert.equal(projectResponse.response.status, 201, JSON.stringify(projectResponse.json))
  const projectId = requiredString(projectResponse.json.data?.project?.id)

  const bytes = Buffer.from('private route source bytes')
  const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
  const intentResponse = await postJson(`${baseUrl}/v1/projects/${projectId}/upload-intents`, {
    workspaceId: 'workspace-source-route',
    uploadPurpose: 'source_media',
    originalFileName: 'route-source.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: bytes.byteLength,
    checksumSha256,
  }, 'source-route-intent')
  assert.equal(intentResponse.response.status, 201, JSON.stringify(intentResponse.json))
  const uploadIntentId = requiredString(intentResponse.json.data?.uploadIntent?.id)
  const uploadUrl = requiredString(intentResponse.json.data?.uploadTarget?.uploadUrl)
  assert.match(uploadUrl, /workspaceId=workspace-source-route/)

  const uploadedResponse = await fetch(new URL(uploadUrl, baseUrl), {
    method: 'PUT',
    headers: { 'content-type': 'video/mp4' },
    body: bytes as unknown as BodyInit,
  })
  assert.equal(uploadedResponse.status, 201, await uploadedResponse.text())

  const finalizedResponse = await postJson(`${baseUrl}/v1/upload-intents/${uploadIntentId}/finalize`, {
    workspaceId: 'workspace-source-route',
  }, 'source-route-finalize')
  assert.equal(finalizedResponse.response.status, 201, JSON.stringify(finalizedResponse.json))
  const mediaAssetId = requiredString(finalizedResponse.json.data?.mediaAsset?.id)

  const candidateBody = {
    workspaceId: 'workspace-source-route',
    projectId,
    uploadPurpose: 'source_media',
    orderedItems: [{
      sourceSequenceItemId: 'source-route-sequence-1',
      mediaAssetId,
      uploadedOrder: 1,
      checksumSha256,
      required: true,
    }],
  }
  const candidateResponse = await postJson(
    `${baseUrl}/v1/internal/source-media-authority/manifest-candidates`,
    candidateBody,
    'source-route-candidate',
    { 'x-reeditpro-internal-token': internalToken },
  )
  assert.equal(candidateResponse.response.status, 201, JSON.stringify(candidateResponse.json))
  const candidate = candidateResponse.json.data?.sourceBindingManifestCandidate
  assert.equal(candidate?.authorityStatus, 'unapproved_manifest_candidate')
  assert.equal(candidate?.executionAuthorized, false)
  assert.equal(candidate?.approvedSnapshotMutated, false)
  assert.match(requiredString(candidate?.candidateHash), /^[a-f0-9]{64}$/)
  assert(!JSON.stringify(candidate).includes('objectPath'))
  assert(!JSON.stringify(candidate).includes('bucketName'))

  const replayedCandidate = await postJson(
    `${baseUrl}/v1/internal/source-media-authority/manifest-candidates`,
    candidateBody,
    'source-route-candidate',
    { 'x-reeditpro-internal-token': internalToken },
  )
  assert.equal(replayedCandidate.response.status, 201)
  assert.equal(replayedCandidate.response.headers.get('idempotency-replayed'), 'true')
  assert.deepEqual(replayedCandidate.json.data?.sourceBindingManifestCandidate, candidate)

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'authenticated_internal_manifest_candidate_route',
      'route_reads_restart_safe_upload_authority',
      'route_candidate_is_unapproved_and_nonexecuting',
      'route_candidate_exposes_no_storage_paths',
      'route_candidate_idempotency_replay',
    ],
  }))
} finally {
  await close(server)
  clearPrivateUploadMediaAuthorityProcessStateForSmoke()
  clearLocalProjectMemoryForSmoke()
  await rm(localStorageRoot, { recursive: true, force: true })
}

type JsonEnvelope = {
  data?: {
    project?: { id?: string }
    uploadIntent?: { id?: string }
    uploadTarget?: { uploadUrl?: string }
    mediaAsset?: { id?: string }
    sourceBindingManifestCandidate?: {
      authorityStatus?: string
      executionAuthorized?: boolean
      approvedSnapshotMutated?: boolean
      candidateHash?: string
    }
  }
  error?: { code?: string; message?: string }
}

async function postJson(
  url: string,
  body: Record<string, unknown>,
  idempotencyKey: string,
  extraHeaders: Record<string, string> = {},
): Promise<{ response: Response; json: JsonEnvelope }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  })
  return { response, json: await response.json() as JsonEnvelope }
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value) throw new Error('Required route-smoke string is missing.')
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
  if (!address || typeof address === 'string') throw new Error('Route smoke server address is unavailable.')
  return `http://127.0.0.1:${address.port}`
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}
