import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
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
import type { ServiceContext } from '../types'

interface EditReferenceUploadIntentRouteData {
  uploadIntent: {
    id: string
    editReferenceId?: string
    projectId?: string
    targetPath: string
  }
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
    const uploadRoute = await mutation<EditReferenceUploadIntentRouteData>(
      runtime.baseUrl,
      uploadRoutePath,
      'long-form-route-upload-intent',
      {
      workspaceId,
      chatSessionId: created.body.data.detail.study.id,
      uploadPurpose: 'reference_media',
      originalFileName: 'route-proof-reference.mp4',
      mimeType: 'video/mp4',
      expectedSizeBytes: bytes.length,
      checksumSha256,
      },
    )
    const uploadIntent = uploadRoute.body.data.uploadIntent
    assert.equal(uploadIntent.editReferenceId, created.body.data.detail.reference.id)
    assert.equal(uploadIntent.projectId, undefined)
    assert.match(uploadIntent.targetPath, new RegExp(`/edit-references/${created.body.data.detail.reference.id}/reference-media/`))
    assert.doesNotMatch(uploadIntent.targetPath, /\/projects\//)
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

    const payload = JSON.stringify(status.body.data)
    for (const forbidden of [root, checksumSha256, finalized.storageObjectRecord.objectPath, 'signedUrl', 'leaseToken']) {
      assert.equal(payload.includes(forbidden), false, `route payload leaked ${forbidden}`)
    }

    console.log(JSON.stringify({
      status: 'passed',
      authenticatedPostStatus: started.status,
      durableGetStatus: status.status,
      idempotentReplay: true,
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

async function startRuntime(env: ReturnType<typeof runtimeEnv>) {
  const server = createReeditProApiApp(env).listen(0, '127.0.0.1')
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
