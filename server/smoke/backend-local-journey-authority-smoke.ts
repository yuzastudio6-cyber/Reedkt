import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createProjectEditBriefLocalService } from '../services/project-edit-brief-local-service'
import { createProjectEditPlanService } from '../services/project-edit-plan-service'
import { createProjectEditSessionService } from '../services/project-edit-session-service'
import type { ServiceContext } from '../types'
import {
  buildProjectEditPlanApprovalModel,
  createProjectEditPlanBriefLineage,
} from '../../src/lib/project-edit-plan-approval'
import type { ProjectSourceVideoBackendUploadResult } from '../../src/types/project-source-video'

const workspaceId = 'backend-local-authority-workspace'
const projectId = 'backend-local-authority-project'
const editSessionId = 'backend-local-authority-edit'

const env = loadRuntimeEnv({
  ...process.env,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  E2E_RUNTIME_MODE: 'mock',
  LOCAL_STORAGE_ROOT: '.reeditpro-local-storage-backend-local-authority-smoke',
  NODE_ENV: 'test',
  STORAGE_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
})

function context(userId: string): ServiceContext {
  return {
    env,
    clients: { admin: null, public: null },
    requestId: `backend-local-authority-${userId}`,
    auth: {
      userId,
      email: `${userId}@reeditpro.local`,
      isMockUser: true,
    },
  }
}

async function expectApiError(
  operation: () => Promise<unknown>,
  code: ApiError['code'],
): Promise<void> {
  await assert.rejects(operation, (error: unknown) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.code, code)
    return true
  })
}

const source: ProjectSourceVideoBackendUploadResult = {
  status: 'uploaded',
  uploadIntentId: 'backend-local-authority-upload-intent',
  storageObjectRecordId: 'backend-local-authority-storage-object',
  mediaAssetId: 'backend-local-authority-media-asset',
  bucketName: 'source-media',
  objectPath: 'private/backend-local-authority/source.mp4',
  fileName: 'source.mp4',
  mimeType: 'video/mp4',
  sizeBytes: 1024,
  checksumSha256: 'a'.repeat(64),
  uploadedAt: '2026-07-12T00:00:00.000Z',
  backendLocalUploadMade: true,
  browserFileBytesSent: true,
  fileBytesReadByBackend: true,
  storageWriteMade: true,
  supabaseWriteMade: false,
  gcsWriteMade: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  providerCallMade: false,
  renderJobCreated: false,
  exportJobCreated: false,
  creditReservedOrSpent: false,
  productReady: false,
  warnings: [],
}

const approvedPlan = buildProjectEditPlanApprovalModel({
  approved: true,
  backendUploadResult: source,
  briefSaved: true,
  briefText: 'Keep the source truthful, clean, and professionally paced.',
  editSessionId,
  outputAspectRatio: '16:9',
  outputFrameConfirmed: true,
  outputFrameConfirmationSource: 'new_edit_create_form',
  outputPlatformTarget: 'youtube_standard',
  projectId,
  sourceAspectRatio: '16:9',
  sourceDurationSeconds: 60,
  sourceFileName: source.fileName,
})
assert.equal(approvedPlan.approved, true)

const localPlanInput = {
  workspaceId,
  projectId,
  editSessionId,
  planId: approvedPlan.planId,
  title: approvedPlan.title,
  summary: approvedPlan.summary,
  steps: approvedPlan.steps,
  operationManifest: approvedPlan.operationManifest,
  directionSource: approvedPlan.directionSource,
  skillPlan: approvedPlan.skillPlan,
  creditEstimate: approvedPlan.creditEstimate,
  briefLineage: createProjectEditPlanBriefLineage({
    briefId: 'backend-local-authority-brief',
    briefText: approvedPlan.summary,
    revisionNumber: 1,
  }),
  source: {
    storageObjectRecordId: source.storageObjectRecordId,
    mediaAssetId: source.mediaAssetId,
    bucketName: source.bucketName,
    objectPath: source.objectPath,
    fileName: source.fileName,
    mimeType: source.mimeType,
    sizeBytes: source.sizeBytes,
    checksumSha256: source.checksumSha256,
  },
}

const ownerContext = context('backend-local-owner')
const otherContext = context('backend-local-other-user')

const ownerSessionService = createProjectEditSessionService(ownerContext)
const createdSession = await ownerSessionService.createProjectEditSession({
  workspaceId,
  projectId,
  idempotencyKey: 'backend-local-session-create',
  name: 'Owner-scoped backend-local edit',
  aspectRatio: '16:9',
  platformTarget: 'youtube_standard',
  selectedEditLevel: 'premium',
})
assert.equal(createdSession.editSession.ownerUserId, 'backend-local-owner')
await expectApiError(
  () => createProjectEditSessionService(otherContext).getProjectEditSession(createdSession.editSession.id, workspaceId),
  'PROJECT_NOT_FOUND',
)

const ownerBriefService = createProjectEditBriefLocalService(ownerContext)
const savedBrief = await ownerBriefService.saveProjectEditBrief({
  workspaceId,
  projectId,
  editSessionId,
  idempotencyKey: 'backend-local-brief-save',
  briefText: 'Owner-scoped edit brief.',
})
assert.equal(savedBrief.editBrief.savedByUserId, 'backend-local-owner')
await expectApiError(
  () => createProjectEditBriefLocalService(otherContext).getProjectEditBriefForSession({
    workspaceId,
    projectId,
    editSessionId,
  }),
  'PROJECT_NOT_FOUND',
)

const ownerPlanService = createProjectEditPlanService(ownerContext)
const storedPlan = await ownerPlanService.createApprovedLocalEditPlan(localPlanInput)
assert.equal(storedPlan.localEditPlan.approvedByUserId, 'backend-local-owner')
assert.equal(storedPlan.authorityBoundary.classification, 'legacy_local_preview_only')
assert.equal(storedPlan.authorityBoundary.executionAllowed, false)
assert.equal(storedPlan.authorityBoundary.canonicalPlanningHandoffRequired, true)
assert.equal(storedPlan.authorityBoundary.intentionalBlanketBlocksAllowed, false)
assert.ok(storedPlan.authorityBoundary.allowedForwardProgressScopes.includes('canonical_planning_handoff_preparation'))

const exactReplay = await ownerPlanService.createApprovedLocalEditPlan(localPlanInput)
assert.equal(exactReplay.localEditPlan.id, storedPlan.localEditPlan.id)
await expectApiError(
  () => ownerPlanService.createApprovedLocalEditPlan({ ...localPlanInput, title: 'Changed content' }),
  'IDEMPOTENCY_CONFLICT',
)
await expectApiError(
  () => createProjectEditPlanService(otherContext).getApprovedLocalEditPlan(approvedPlan.planId, workspaceId),
  'PLAN_NOT_APPROVED',
)

const localApp = createReeditProApiApp(env)
const localServer = createServer(localApp)
localServer.listen(0, '127.0.0.1')
await once(localServer, 'listening')
const localAddress = localServer.address()
assert.ok(localAddress && typeof localAddress === 'object')
const localBaseUrl = `http://127.0.0.1:${localAddress.port}`

try {
  const sessionResponse = await fetch(
    `${localBaseUrl}/v1/projects/${projectId}/edit-sessions`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'backend-local-route-session-create',
      },
      body: JSON.stringify({
        workspaceId,
        name: 'Route-mounted backend-local edit',
        aspectRatio: '16:9',
        platformTarget: 'youtube_standard',
        selectedEditLevel: 'premium',
      }),
    },
  )
  assert.equal(sessionResponse.status, 201)
  const sessionEnvelope = await sessionResponse.json() as {
    data?: { editSession?: { id?: string } }
  }
  const routeEditSessionId = sessionEnvelope.data?.editSession?.id
  assert.ok(routeEditSessionId)

  const briefResponse = await fetch(
    `${localBaseUrl}/v1/projects/${projectId}/edit-sessions/${routeEditSessionId}/local-brief`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'backend-local-route-brief-save',
      },
      body: JSON.stringify({
        workspaceId,
        briefText: 'Route-mounted owner-scoped edit brief.',
      }),
    },
  )
  assert.equal(briefResponse.status, 201)
  const briefEnvelope = await briefResponse.json() as {
    data?: { editBrief?: { editSessionId?: string } }
  }
  assert.equal(briefEnvelope.data?.editBrief?.editSessionId, routeEditSessionId)

  const response = await fetch(
    `${localBaseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}/local-edit-plans`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'backend-local-route-plan-create',
      },
      body: JSON.stringify(localPlanInput),
    },
  )
  assert.equal(response.status, 201)
  const envelope = await response.json() as {
    data?: {
      localEditPlan?: { editPlanId?: string }
      authorityBoundary?: { classification?: string; executionAllowed?: boolean }
    }
  }
  assert.equal(envelope.data?.localEditPlan?.editPlanId, approvedPlan.planId)
  assert.equal(envelope.data?.authorityBoundary?.classification, 'legacy_local_preview_only')
  assert.equal(envelope.data?.authorityBoundary?.executionAllowed, false)
} finally {
  localServer.close()
  await once(localServer, 'close')
}

const nonLocalEnv = loadRuntimeEnv({
  ...process.env,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  E2E_RUNTIME_MODE: 'mock',
  LOCAL_STORAGE_ROOT: '.reeditpro-local-storage-backend-local-authority-smoke-disabled',
  NODE_ENV: 'test',
  STORAGE_MODE: 'local',
  WORKER_RUNTIME_MODE: 'disabled',
})
const nonLocalServer = createServer(createReeditProApiApp(nonLocalEnv))
nonLocalServer.listen(0, '127.0.0.1')
await once(nonLocalServer, 'listening')
const nonLocalAddress = nonLocalServer.address()
assert.ok(nonLocalAddress && typeof nonLocalAddress === 'object')

try {
  const response = await fetch(
    `http://127.0.0.1:${nonLocalAddress.port}/v1/projects/${projectId}/edit-sessions`,
    { method: 'GET' },
  )
  assert.equal(response.status, 404)
} finally {
  nonLocalServer.close()
  await once(nonLocalServer, 'close')
}

console.log(JSON.stringify({
  ok: true,
  smoke: 'backend-local-journey-authority',
  localRoutesMountedOnlyInExplicitInternalRuntime: true,
  ownerScopedSession: true,
  ownerScopedBrief: true,
  ownerScopedPlan: true,
  changedPlanReplayRejected: true,
  legacyExecutionAuthority: false,
  canonicalPlanningHandoffRequired: true,
}, null, 2))
