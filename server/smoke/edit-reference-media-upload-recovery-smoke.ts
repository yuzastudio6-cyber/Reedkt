import assert from 'node:assert/strict'
import {
  clearEditReferenceMediaUploadRecovery,
  readPendingEditReferenceMediaUploadRecovery,
  type EditReferenceMediaUploadRecoveryStorage,
} from '../../src/lib/edit-reference-media-upload-recovery'
import { uploadEditReferenceMedia } from '../../src/lib/edit-reference-media-upload-client'

const storage = createMemoryStorage()
const scope = {
  workspaceId: 'workspace-browser-recovery-proof',
  editReferenceId: 'edit-reference-browser-recovery-proof',
  studySessionId: 'study-browser-recovery-proof',
}
const file = new File(
  [new Uint8Array([11, 22, 33, 44, 55, 66, 77, 88])],
  'owner-private-reference-name.mp4',
  { type: 'video/mp4', lastModified: 1_784_607_200_000 },
)
const accessToken = 'browser-recovery-bearer-must-not-persist'
const firstCalls: Array<{ url: string; method: string; idempotencyKey?: string }> = []
const successfulFetch = (async (request: RequestInfo | URL, init?: RequestInit) => {
  const url = String(request)
  const method = init?.method ?? 'GET'
  const headers = new Headers(init?.headers)
  firstCalls.push({
    url,
    method,
    ...(headers.get('idempotency-key') ? { idempotencyKey: headers.get('idempotency-key') ?? undefined } : {}),
  })
  if (url.endsWith(`/v1/edit-references/${scope.editReferenceId}/upload-intents`)) {
    return jsonResponse({
      ok: true,
      data: {
        uploadIntent: { id: 'upload-intent-browser-recovery' },
        uploadTarget: {
          uploadMethod: 'PUT',
          uploadProtocol: 'single_put',
          uploadUrl: '/private-upload-browser-recovery',
          uploadHeaders: { 'x-upload-private': 'temporary-target-header' },
        },
      },
    }, 201)
  }
  if (url.endsWith('/private-upload-browser-recovery')) return new Response(undefined, { status: 201 })
  if (url.endsWith('/v1/upload-intents/upload-intent-browser-recovery/finalize')) {
    return jsonResponse({
      ok: true,
      data: {
        storageObjectRecord: {
          id: 'storage-object-browser-recovery',
          mimeType: 'video/mp4',
          sizeBytes: file.size,
          checksumSha256: 'a'.repeat(64),
        },
        mediaAsset: {
          id: 'media-asset-browser-recovery',
          mimeType: 'video/mp4',
          fileName: file.name,
        },
      },
    })
  }
  throw new Error(`Unexpected recovery smoke request: ${method} ${url}`)
}) as typeof fetch

const first = await uploadEditReferenceMedia({
  ...scope,
  file,
  configuredBaseUrl: 'https://edit-reference-recovery.invalid',
  fetchImpl: successfulFetch,
  getAccessToken: async () => accessToken,
  recoveryStorage: storage,
})
assert.equal(first.ok, true, first.message)
assert.equal(first.storageObjectRecordId, 'storage-object-browser-recovery')
assert.equal(first.mediaAssetId, 'media-asset-browser-recovery')
assert.equal(first.recovery?.stage, 'finalized')
assert.equal(firstCalls.length, 3)

const persistedText = storage.dump()
for (const forbidden of [
  accessToken,
  file.name,
  scope.workspaceId,
  scope.editReferenceId,
  scope.studySessionId,
  'temporary-target-header',
  '/private-upload-browser-recovery',
]) {
  assert.equal(persistedText.includes(forbidden), false, `Recovery storage leaked ${forbidden}`)
}

let unexpectedReplayFetchCount = 0
const recoveredFinalized = await uploadEditReferenceMedia({
  ...scope,
  file,
  configuredBaseUrl: 'https://edit-reference-recovery.invalid',
  fetchImpl: (async () => {
    unexpectedReplayFetchCount += 1
    throw new Error('A finalized upload must not send the file again.')
  }) as typeof fetch,
  getAccessToken: async () => accessToken,
  recoveryStorage: storage,
})
assert.equal(recoveredFinalized.ok, true, recoveredFinalized.message)
assert.equal(recoveredFinalized.storageObjectRecordId, first.storageObjectRecordId)
assert.equal(recoveredFinalized.mediaAssetId, first.mediaAssetId)
assert.equal(recoveredFinalized.recovery?.recovered, true)
assert.equal(unexpectedReplayFetchCount, 0)

await clearEditReferenceMediaUploadRecovery({ ...scope, storage })
assert.equal(await readPendingEditReferenceMediaUploadRecovery({ ...scope, storage }), undefined)

const retryScope = {
  workspaceId: 'workspace-browser-retry-proof',
  editReferenceId: 'edit-reference-browser-retry-proof',
  studySessionId: 'study-browser-retry-proof',
}
const retryStorage = createMemoryStorage()
const retryKeys: string[] = []
const failedCreate = await uploadEditReferenceMedia({
  ...retryScope,
  file,
  configuredBaseUrl: 'https://edit-reference-recovery.invalid',
  fetchImpl: (async (_request: RequestInfo | URL, init?: RequestInit) => {
    retryKeys.push(new Headers(init?.headers).get('idempotency-key') ?? '')
    return jsonResponse({ ok: false, error: { message: 'Temporary private upload interruption.' } }, 503)
  }) as typeof fetch,
  getAccessToken: async () => accessToken,
  recoveryStorage: retryStorage,
})
assert.equal(failedCreate.ok, false)
assert.equal(failedCreate.recovery?.persistedInSession, true)

const retryFetch = (async (request: RequestInfo | URL, init?: RequestInit) => {
  const url = String(request)
  if (url.endsWith(`/v1/edit-references/${retryScope.editReferenceId}/upload-intents`)) {
    retryKeys.push(new Headers(init?.headers).get('idempotency-key') ?? '')
    return jsonResponse({
      ok: true,
      data: {
        uploadIntent: { id: 'upload-intent-browser-retry' },
        uploadTarget: {
          uploadMethod: 'PUT',
          uploadProtocol: 'single_put',
          uploadUrl: '/private-upload-browser-retry',
        },
      },
    }, 201)
  }
  if (url.endsWith('/private-upload-browser-retry')) return new Response(undefined, { status: 201 })
  if (url.endsWith('/v1/upload-intents/upload-intent-browser-retry/finalize')) {
    return jsonResponse({
      ok: true,
      data: {
        storageObjectRecord: { id: 'storage-object-browser-retry', sizeBytes: file.size },
        mediaAsset: { id: 'media-asset-browser-retry', mimeType: 'video/mp4', fileName: file.name },
      },
    })
  }
  throw new Error(`Unexpected retry smoke request: ${url}`)
}) as typeof fetch
const retried = await uploadEditReferenceMedia({
  ...retryScope,
  file,
  configuredBaseUrl: 'https://edit-reference-recovery.invalid',
  fetchImpl: retryFetch,
  getAccessToken: async () => accessToken,
  recoveryStorage: retryStorage,
})
assert.equal(retried.ok, true, retried.message)
assert.equal(retried.recovery?.recovered, true)
assert.equal(retryKeys.length, 2)
assert.equal(retryKeys[0], retryKeys[1])
assert.match(retryKeys[0] ?? '', /^reference-upload-intent-/)

console.log(JSON.stringify({
  status: 'passed',
  credentialFreeSessionDescriptor: true,
  sameFileRetryReusesIdempotencyKey: true,
  finalizedUploadIsNotSentTwice: true,
  rawFileNamePersisted: false,
  bearerOrTemporaryTargetPersisted: false,
  liveHostedResumableRecoveryClaimed: false,
}))

function createMemoryStorage(): EditReferenceMediaUploadRecoveryStorage & { dump: () => string } {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    dump: () => JSON.stringify(Array.from(values.entries())),
  }
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
