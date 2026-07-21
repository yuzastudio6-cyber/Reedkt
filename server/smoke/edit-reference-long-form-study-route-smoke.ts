import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type {
  EditReferenceApiSuccess,
  EditReferenceDetailData,
  EditReferenceLongFormStudyControlData,
  EditReferenceLongFormStudyStatusData,
} from '../../src/types/edit-reference'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS,
  materializeEditReferenceControlledMediaFixture,
} from '../edit-references/edit-reference-controlled-media-fixtures'
import { createUploadService } from '../services/upload-service'
import type { RuntimeClients, ServiceContext } from '../types'

interface EditReferenceUploadIntentRouteData {
  uploadIntent: {
    id: string
    editReferenceId?: string
    projectId?: string
    targetPath: string
  }
}

interface Membership {
  workspaceId: string
  userId: string
  role: string
}

const ownerUserId = 'mock-user-runtime'
const workspaceId = 'workspace-long-form-route-smoke'

const root = await mkdtemp(path.join(tmpdir(), 'reeditpro-long-form-route-'))
try {
  const fixtureDefinition = EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS[0]
  assert(fixtureDefinition)
  const fixture = await materializeEditReferenceControlledMediaFixture({
    outputRoot: path.join(root, 'fixture'),
    definition: fixtureDefinition,
    timeoutMs: 60_000,
  })
  const bytes = await readFile(fixture.videoPath)
  const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
  const env = runtimeEnv(root)
  const runtime = await startRuntime(env)
  try {
    const created = await mutation<EditReferenceDetailData>(runtime.baseUrl, '/v1/edit-references', 'long-form-route-create', {
      workspaceId,
      name: 'Long-form route proof',
      description: 'Authenticated route proof for durable whole-video study startup and status.',
      initialGoals: ['visual_language', 'story_and_pacing', 'captions', 'color', 'audio_and_sfx', 'graphics'],
    })
    const uploadRoutePath = `/v1/edit-references/${created.body.data.detail.reference.id}/upload-intents`
    const wrongStudyUpload = await mutationError(
      runtime.baseUrl,
      uploadRoutePath,
      'long-form-route-upload-wrong-study',
      {
        workspaceId,
        chatSessionId: 'preference-study-not-this-reference',
        uploadPurpose: 'reference_media',
        originalFileName: 'wrong-study.mp4',
        mimeType: 'video/mp4',
        expectedSizeBytes: bytes.length,
      },
    )
    assert.equal(wrongStudyUpload.status, 403)
    assert.equal(wrongStudyUpload.code, 'WORKSPACE_ACCESS_DENIED')
    const wrongPurposeUpload = await mutationError(
      runtime.baseUrl,
      uploadRoutePath,
      'long-form-route-upload-wrong-purpose',
      {
        workspaceId,
        chatSessionId: created.body.data.detail.study.id,
        uploadPurpose: 'source_media',
        originalFileName: 'wrong-purpose.mp4',
        mimeType: 'video/mp4',
        expectedSizeBytes: bytes.length,
      },
    )
    assert.equal(wrongPurposeUpload.status, 400)
    assert.equal(wrongPurposeUpload.code, 'VALIDATION_FAILED')
    const uploadRequest = {
      workspaceId,
      chatSessionId: created.body.data.detail.study.id,
      uploadPurpose: 'reference_media',
      originalFileName: 'route-proof-reference.mp4',
      mimeType: 'video/mp4',
      expectedSizeBytes: bytes.length,
      checksumSha256,
    } as const
    const uploadRoute = await mutation<EditReferenceUploadIntentRouteData>(
      runtime.baseUrl,
      uploadRoutePath,
      'long-form-route-upload-intent',
      uploadRequest,
    )
    const uploadIntent = uploadRoute.body.data.uploadIntent
    assert.equal(uploadRoute.replayed, null)
    assert.equal(uploadIntent.editReferenceId, created.body.data.detail.reference.id)
    assert.equal(uploadIntent.projectId, undefined)
    assert.match(uploadIntent.targetPath, new RegExp(`/edit-references/${created.body.data.detail.reference.id}/reference-media/`))
    assert.doesNotMatch(uploadIntent.targetPath, /\/projects\//)
    const uploadRouteReplay = await mutation<EditReferenceUploadIntentRouteData>(
      runtime.baseUrl,
      uploadRoutePath,
      'long-form-route-upload-intent',
      uploadRequest,
    )
    assert.equal(uploadRouteReplay.replayed, null)
    assert.equal(uploadRouteReplay.body.data.uploadIntent.id, uploadIntent.id)
    assert.equal(uploadRouteReplay.body.data.uploadIntent.targetPath, uploadIntent.targetPath)
    const conflictingUploadReplay = await mutationError(
      runtime.baseUrl,
      uploadRoutePath,
      'long-form-route-upload-intent',
      { ...uploadRequest, originalFileName: 'changed-after-idempotency.mp4' },
    )
    assert.equal(conflictingUploadReplay.status, 409)
    assert.equal(conflictingUploadReplay.code, 'IDEMPOTENCY_CONFLICT')
    const uploadService = createUploadService(serviceContext(env))
    await uploadService.uploadLocalObject(uploadIntent.id, workspaceId, bytes, 'video/mp4')
    const finalized = await uploadService.finalizeUploadIntent({
      workspaceId,
      uploadIntentId: uploadIntent.id,
      sizeBytes: bytes.length,
      checksumSha256,
    })
    assert.equal(finalized.storageObjectRecord.editReferenceId, created.body.data.detail.reference.id)
    assert.equal(finalized.storageObjectRecord.projectId, undefined)
    assert.equal(finalized.mediaAsset.editReferenceId, created.body.data.detail.reference.id)
    const evidence = await mutation<EditReferenceDetailData>(
      runtime.baseUrl,
      `/v1/edit-reference-studies/${created.body.data.detail.study.id}/evidence`,
      'long-form-route-evidence',
      {
        workspaceId,
        expectedStudyRevision: created.body.data.detail.study.revision,
        sourceType: 'reference_video_metadata',
        title: 'Controlled route reference',
        sourceLabel: 'Controlled route reference video',
        rightsBasis: 'reference_only',
        storageObjectRecordId: finalized.storageObjectRecord.id,
        mediaAssetId: finalized.mediaAsset.id,
      },
    )
    const asset = evidence.body.data.detail.assets.find((record) => (
      record.storageObjectRecordId === finalized.storageObjectRecord.id
    ))
    assert(asset)
    const routePath = `/v1/edit-reference-studies/${created.body.data.detail.study.id}/assets/${asset.id}/long-form-study`
    const started = await mutation<EditReferenceLongFormStudyStatusData>(
      runtime.baseUrl,
      routePath,
      'long-form-route-start',
      { workspaceId, expectedStudyRevision: evidence.body.data.detail.study.revision },
    )
    assert.equal(started.status, 202)
    assert.equal(started.body.data.referenceAssetId, asset.id)
    assert.equal(started.body.data.study.completedWorkItemCount, 2)
    assert.equal(started.body.data.study.temporalCoverageRatio, 0)
    assert.equal(started.body.data.study.fullyStudied, false)
    assert.equal(started.body.data.study.originalRemainsImmutable, true)
    assert.equal(started.body.data.safety.providerCallMade, false)
    assert.equal(started.body.data.safety.customerPriceCalculated, false)
    assert.equal(started.body.data.safety.customerCreditsMutated, false)

    const status = await query<EditReferenceLongFormStudyStatusData>(
      runtime.baseUrl,
      `${routePath}?${new URLSearchParams({ workspaceId })}`,
    )
    assert.deepEqual(status.body.data.study, started.body.data.study)

    const replay = await mutation<EditReferenceLongFormStudyStatusData>(
      runtime.baseUrl,
      routePath,
      'long-form-route-start',
      { workspaceId, expectedStudyRevision: evidence.body.data.detail.study.revision },
    )
    assert.equal(replay.status, 202)
    assert.equal(replay.replayed, 'true')
    assert.deepEqual(replay.body.data.study, started.body.data.study)

    const controlPath = `${routePath}/control`
    const paused = await mutation<EditReferenceLongFormStudyControlData>(
      runtime.baseUrl,
      controlPath,
      'long-form-route-pause',
      { workspaceId, expectedRunRevision: status.body.data.study.runRevision, action: 'pause' },
    )
    assert.equal(paused.status, 200)
    assert.equal(paused.body.data.study.state, 'paused')
    assert.equal(paused.body.data.study.controls.canResume, true)
    assert.equal(paused.body.data.control.completedCheckpointsPreserved, true)

    const pauseReplay = await mutation<EditReferenceLongFormStudyControlData>(
      runtime.baseUrl,
      controlPath,
      'long-form-route-pause',
      { workspaceId, expectedRunRevision: status.body.data.study.runRevision, action: 'pause' },
    )
    assert.equal(pauseReplay.replayed, 'true')
    assert.equal(pauseReplay.body.data.control.disposition, 'idempotent_replay')

    const staleResume = await mutationError(
      runtime.baseUrl,
      controlPath,
      'long-form-route-stale-resume',
      { workspaceId, expectedRunRevision: status.body.data.study.runRevision, action: 'resume' },
    )
    assert.equal(staleResume.status, 409)
    assert.equal(staleResume.code, 'VERSION_CONFLICT')

    const resumed = await mutation<EditReferenceLongFormStudyControlData>(
      runtime.baseUrl,
      controlPath,
      'long-form-route-resume',
      { workspaceId, expectedRunRevision: paused.body.data.study.runRevision, action: 'resume' },
    )
    assert.equal(resumed.body.data.study.state, 'running')
    assert.equal(resumed.body.data.study.controls.canPause, true)

    const cancelled = await mutation<EditReferenceLongFormStudyControlData>(
      runtime.baseUrl,
      controlPath,
      'long-form-route-cancel',
      { workspaceId, expectedRunRevision: resumed.body.data.study.runRevision, action: 'cancel' },
    )
    assert.equal(cancelled.body.data.study.state, 'cancelled')
    assert.equal(cancelled.body.data.study.controls.canPause, false)
    assert.equal(cancelled.body.data.study.controls.canCancel, false)
    assert.equal(cancelled.body.data.control.completedCheckpointsPreserved, true)

    const foreign = await queryError(
      runtime.baseUrl,
      `${routePath}?${new URLSearchParams({ workspaceId: 'workspace-long-form-route-foreign' })}`,
    )
    assert.equal(foreign.status, 404)
    assert.equal(foreign.code, 'PREFERENCE_STUDY_NOT_FOUND')

    const accessUserId = 'edit-reference-upload-access-user'
    const accessToken = 'edit-reference-upload-access-token'
    const accessWorkspaceId = 'workspace-edit-reference-upload-access'
    const memberships: Membership[] = [{
      workspaceId: accessWorkspaceId,
      userId: accessUserId,
      role: 'viewer',
    }]
    const accessRuntime = await startRuntime(env, createRouteClients(accessToken, accessUserId, memberships))
    try {
      const accessUploadPath = '/v1/edit-references/edit-reference-access-proof/upload-intents'
      const accessUploadRequest = {
        workspaceId: accessWorkspaceId,
        chatSessionId: 'edit-reference-study-access-proof',
        uploadPurpose: 'reference_media',
        originalFileName: 'access-proof.mp4',
        mimeType: 'video/mp4',
        expectedSizeBytes: 4,
      }
      const viewerDenied = await authenticatedMutationError(
        accessRuntime.baseUrl,
        accessUploadPath,
        accessToken,
        'edit-reference-upload-access-key',
        accessUploadRequest,
      )
      assert.equal(viewerDenied.status, 403)
      assert.equal(viewerDenied.code, 'WORKSPACE_ACCESS_DENIED')

      memberships[0]!.role = 'editor'
      const editorReachedPersistenceGate = await authenticatedMutationError(
        accessRuntime.baseUrl,
        accessUploadPath,
        accessToken,
        'edit-reference-upload-access-key',
        accessUploadRequest,
      )
      assert.equal(editorReachedPersistenceGate.status, 503)
      assert.equal(editorReachedPersistenceGate.code, 'EDIT_REFERENCE_PERSISTENCE_BLOCKED')
    } finally {
      await accessRuntime.close()
    }

    const payload = JSON.stringify(status.body.data)
    for (const forbidden of [root, checksumSha256, finalized.storageObjectRecord.objectPath, 'signedUrl', 'leaseToken']) {
      assert.equal(payload.includes(forbidden), false, `route payload leaked ${forbidden}`)
    }

    console.log(JSON.stringify({
      status: 'passed',
      authenticatedPostStatus: started.status,
      durableGetStatus: status.status,
      idempotentReplay: true,
      uploadIntentDomainReplay: true,
      genericCredentialResponseCacheUsed: false,
      changedUploadRequestRejected: true,
      viewerUploadDeniedBeforeSensitiveIdempotency: true,
      editorAdvancedToFailClosedPersistenceGate: true,
      revisionCheckedOwnerControls: true,
      pauseResumeCancelWired: true,
      completedCheckpointsPreservedOnControl: true,
      tenantIsolation: true,
      exactPrivateSourcePreflight: true,
      wholeSourceCoverageClaimed: false,
      originalRemainsImmutable: true,
      providerCallMade: false,
      customerPriceCalculated: false,
      customerCreditsMutated: false,
    }))
  } finally {
    await runtime.close()
  }
} finally {
  await rm(root, { recursive: true, force: true })
}

function runtimeEnv(localStorageRoot: string) {
  return loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    PROVIDER_EXECUTION_ENABLED: 'false',
    WORKER_RUNTIME_MODE: 'mock',
  })
}

function serviceContext(env: ReturnType<typeof runtimeEnv>): ServiceContext {
  return {
    env,
    clients: { admin: null, public: null },
    requestId: 'long-form-route-upload',
    auth: { userId: ownerUserId, isMockUser: true },
  }
}

async function startRuntime(env: ReturnType<typeof runtimeEnv>, clients?: RuntimeClients) {
  const server = createReeditProApiApp(env, clients ? { clients } : {}).listen(0, '127.0.0.1')
  await new Promise<void>((resolvePromise, reject) => {
    server.once('listening', resolvePromise)
    server.once('error', reject)
  })
  return {
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolvePromise, reject) => server.close((error) => (
      error ? reject(error) : resolvePromise()
    ))),
  }
}

async function mutation<T>(baseUrl: string, route: string, key: string, body: unknown) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as EditReferenceApiSuccess<T>
  assert.equal(payload.ok, true, JSON.stringify(payload))
  return { status: response.status, replayed: response.headers.get('idempotency-replayed'), body: payload }
}

async function query<T>(baseUrl: string, route: string) {
  const response = await fetch(`${baseUrl}${route}`)
  const payload = await response.json() as EditReferenceApiSuccess<T>
  assert.equal(payload.ok, true, JSON.stringify(payload))
  return { status: response.status, body: payload }
}

async function queryError(baseUrl: string, route: string) {
  const response = await fetch(`${baseUrl}${route}`)
  const payload = await response.json() as { error: { code: string } }
  return { status: response.status, code: payload.error.code }
}

async function mutationError(baseUrl: string, route: string, key: string, body: unknown) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as { error: { code: string } }
  return { status: response.status, code: payload.error.code }
}

async function authenticatedMutationError(
  baseUrl: string,
  route: string,
  token: string,
  key: string,
  body: unknown,
) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'idempotency-key': key,
    },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as { error: { code: string } }
  return { status: response.status, code: payload.error.code }
}

function createRouteClients(
  token: string,
  userId: string,
  memberships: Membership[],
): RuntimeClients {
  const publicClient = {
    auth: {
      getUser: async (providedToken: string) => ({
        data: { user: providedToken === token ? fakeUser(userId) : null },
        error: null,
      }),
    },
  } as unknown as SupabaseClient
  const adminClient = {
    from(table: string) {
      const filters = new Map<string, unknown>()
      const builder = {
        select() { return builder },
        eq(column: string, value: unknown) { filters.set(column, value); return builder },
        async maybeSingle() {
          if (table !== 'workspace_members') return { data: null, error: null }
          const membership = memberships.find((entry) => (
            entry.workspaceId === filters.get('workspace_id')
            && entry.userId === filters.get('user_id')
          ))
          return {
            data: membership ? {
              workspace_id: membership.workspaceId,
              user_id: membership.userId,
              role: membership.role,
            } : null,
            error: null,
          }
        },
      }
      return builder
    },
  } as unknown as SupabaseClient
  return { public: publicClient, admin: adminClient }
}

function fakeUser(id: string): User {
  return {
    id,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date(0).toISOString(),
  } as User
}
