import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  createProjectEditSessionBackendLocalConfig,
  createProjectEditSessionBackendLocalFromNewEditForm,
  listProjectEditSessionsBackendLocal,
  recordProjectEditSessionLifecycleCheckpointBackendLocal,
  readProjectEditSessionBackendLocal,
  type ProjectEditSessionBackendLocalRecord,
} from '../../src/lib/project-edit-session-backend-local'
import { createDefaultNewEditSessionFormState } from '../../src/lib/project-edit-session-create-flow-ui-adapter'

function source(path: string): string {
  return readFileSync(path, 'utf8')
}

function localUrl(port: number): string {
  return `http://127.0.0.1:${port}`
}

const app = createReeditProApiApp(loadRuntimeEnv({
  ...process.env,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  E2E_RUNTIME_MODE: 'mock',
  LOCAL_STORAGE_ROOT: '.reeditpro-local-storage-edit-session-create-smoke',
  NODE_ENV: 'test',
  STORAGE_MODE: 'local',
}))
const server = createServer(app)
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
assert.ok(address && typeof address === 'object')
const apiBaseUrl = localUrl(address.port)

try {
  const config = createProjectEditSessionBackendLocalConfig({
    VITE_REEDITPRO_API_BASE_URL: apiBaseUrl,
    VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID: 'mock-workspace',
  })
  assert.equal(config.available, true)
  assert.equal(config.mode, 'backend_local_edit_session')

  const form = {
    ...createDefaultNewEditSessionFormState(),
    name: 'Smoke-created backend-local edit',
    aspectRatio: '16:9' as const,
    platformTarget: 'youtube_standard' as const,
    selectedEditLevel: 'premium' as const,
  }
  const created = await createProjectEditSessionBackendLocalFromNewEditForm({
    apiBaseUrl,
    form,
    projectId: 'project_backend_local_smoke',
    workspaceId: 'mock-workspace',
    getAccessToken: async () => undefined,
  })

  assert.equal(created.ok, true)
  assert.ok(created.session)
  const session = created.session as ProjectEditSessionBackendLocalRecord
  assert.equal(session.name, 'Smoke-created backend-local edit')
  assert.equal(session.projectId, 'project_backend_local_smoke')
  assert.equal(session.workspaceId, 'mock-workspace')
  assert.equal(session.aspectRatio, '16:9')
  assert.equal(session.platformTarget, 'youtube_standard')
  assert.equal(session.selectedEditLevel, 'premium')
  assert.equal(session.mockOnly, true)
  assert.equal(session.backendLocalSessionStored, true)
  assert.equal(session.providerCallMade, false)
  assert.equal(session.workerJobCreated, false)
  assert.equal(session.renderJobCreated, false)
  assert.equal(session.creditReservedOrSpent, false)
  assert.equal(session.supabaseWriteMade, false)
  assert.equal(session.gcsWriteMade, false)
  assert.equal(session.productReady, false)
  assert.equal(created.backendLocalSessionCreated, true)
  assert.equal(created.openRoute, `/projects/project_backend_local_smoke/edits/${session.id}/brief`)

  const readback = await readProjectEditSessionBackendLocal({
    apiBaseUrl,
    editSessionId: session.id,
    workspaceId: 'mock-workspace',
    getAccessToken: async () => undefined,
  })
  assert.equal(readback.editSession.id, session.id)
  assert.equal(readback.editSession.readbackVerified, true)

  const listReadback = await listProjectEditSessionsBackendLocal({
    apiBaseUrl,
    projectId: 'project_backend_local_smoke',
    workspaceId: 'mock-workspace',
    getAccessToken: async () => undefined,
  })
  assert.equal(listReadback.editSessions.some((listedSession) => listedSession.id === session.id), true)
  assert.equal(listReadback.editSessions.every((listedSession) => listedSession.projectId === 'project_backend_local_smoke'), true)
  assert.equal(listReadback.editSessions.every((listedSession) => listedSession.workspaceId === 'mock-workspace'), true)

  const checkpoint = await recordProjectEditSessionLifecycleCheckpointBackendLocal({
    apiBaseUrl,
    editSessionId: session.id,
    workspaceId: 'mock-workspace',
    checkpointKind: 'source_uploaded',
    status: 'setup_ready',
    sourceMediaAssetId: 'media_asset_backend_local_smoke',
    metadata: {
      uploadIntentId: 'upload_intent_backend_local_smoke',
      storageObjectRecordId: 'storage_object_backend_local_smoke',
      mediaAssetId: 'media_asset_backend_local_smoke',
      bucketName: 'source',
      objectPath: 'mock-workspace/project_backend_local_smoke/source/backend-local-smoke.mp4',
      fileName: 'backend-local-smoke.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 128,
      checksumSha256: '0'.repeat(64),
      uploadedAt: new Date(0).toISOString(),
      productReady: false,
    },
    getAccessToken: async () => undefined,
  })
  assert.equal(checkpoint.editSession.id, session.id)
  assert.equal(checkpoint.editSession.status, 'setup_ready')
  assert.equal(checkpoint.editSession.sourceMediaAssetIds.includes('media_asset_backend_local_smoke'), true)
  assert.equal(checkpoint.editSession.productReady, false)

  const lifecycleReadback = await readProjectEditSessionBackendLocal({
    apiBaseUrl,
    editSessionId: session.id,
    workspaceId: 'mock-workspace',
    getAccessToken: async () => undefined,
  })
  assert.equal(lifecycleReadback.editSession.status, 'setup_ready')
  assert.equal(lifecycleReadback.editSession.sourceMediaAssetIds.includes('media_asset_backend_local_smoke'), true)
  assert.ok(lifecycleReadback.editSession.metadata?.backendLocalSourceUpload)
  assert.ok(lifecycleReadback.editSession.metadata?.latestBackendLocalCheckpoint)

  const lifecycleListReadback = await listProjectEditSessionsBackendLocal({
    apiBaseUrl,
    projectId: 'project_backend_local_smoke',
    workspaceId: 'mock-workspace',
    getAccessToken: async () => undefined,
  })
  const listedUpdatedSession = lifecycleListReadback.editSessions.find((listedSession) => listedSession.id === session.id)
  assert.equal(listedUpdatedSession?.status, 'setup_ready')
  assert.equal(listedUpdatedSession?.sourceMediaAssetIds.includes('media_asset_backend_local_smoke'), true)

  const appSource = source('server/app.ts')
  assert.match(appSource, /createProjectEditSessionRoutes/)

  const routeSource = source('server/routes/project-edit-session-routes.ts')
  assert.match(routeSource, /\/v1\/projects\/:projectId\/edit-sessions/)
  assert.match(routeSource, /\/v1\/edit-sessions\/:editSessionId\/lifecycle-checkpoints/)
  assert.match(routeSource, /listProjectEditSessions/)
  assert.match(routeSource, /projectEditSessionLifecycleCheckpointSchema/)
  assert.match(routeSource, /requireIdempotency/)

  const serviceSource = source('server/services/project-edit-session-service.ts')
  assert.match(serviceSource, /listProjectEditSessions/)
  assert.match(serviceSource, /recordProjectEditSessionLifecycleCheckpoint/)
  assert.match(serviceSource, /latestBackendLocalCheckpoint/)
  assert.match(serviceSource, /backendLocalCheckpointResetPolicy/)
  assert.match(serviceSource, /backendLocalSourceUpload/)
  assert.match(serviceSource, /backendLocalPreviewReview/)
  assert.match(serviceSource, /backendLocalFinalExport/)
  assert.match(serviceSource, /clearMetadataKeys/)
  assert.match(serviceSource, /backendLocalSessionStored/)
  assert.match(serviceSource, /providerCallMade: false/)
  assert.match(serviceSource, /productReady: false/)
  assert.doesNotMatch(serviceSource, /service_role|signedUrl|Stripe|production ready:\s*true/i)

  const panelSource = source('src/components/projects/NewEditSessionCreatePanel.tsx')
  assert.match(panelSource, /createProjectEditSessionBackendLocalFromNewEditForm/)
  assert.match(panelSource, /backendLocalConfig/)

  const projectHomePage = source('src/pages/ProjectHomePage.tsx')
  assert.match(projectHomePage, /createProjectEditSessionBackendLocalConfig/)
  assert.match(projectHomePage, /listProjectEditSessionsBackendLocal/)
  assert.match(projectHomePage, /backendEditSessions/)
  assert.match(projectHomePage, /createProjectEditSessionHomeCardViewModelFromRecord/)
  assert.match(projectHomePage, /createProjectEditSessionHomeDetailViewModelFromRecord/)
  assert.match(projectHomePage, /backendLocalSessionCreated/)
  assert.match(projectHomePage, /\/brief/)

  const projectHomeAdapterSource = source('src/lib/project-edit-session-project-home-ui-adapter.ts')
  assert.match(projectHomeAdapterSource, /createProjectEditSessionHomeCardViewModelFromRecord/)
  assert.match(projectHomeAdapterSource, /createProjectEditSessionHomeDetailViewModelFromRecord/)
  assert.match(projectHomeAdapterSource, /latestBackendLocalCheckpoint/)
  assert.match(projectHomeAdapterSource, /backendLocalCheckpointStage/)

  const editBriefWorkspaceSource = source('src/components/projects/brief/ProjectEditBriefWorkspace.tsx')
  assert.match(editBriefWorkspaceSource, /recordProjectEditSessionLifecycleCheckpointBackendLocal/)
  assert.match(editBriefWorkspaceSource, /readProjectEditBriefBackendLocal/)
  assert.match(editBriefWorkspaceSource, /restoreBackendUploadResult/)
  assert.match(editBriefWorkspaceSource, /restorePreviewResult/)
  assert.match(editBriefWorkspaceSource, /restorePreviewReviewResult/)
  assert.match(editBriefWorkspaceSource, /createRestoredApprovedLocalPlan/)
  assert.match(editBriefWorkspaceSource, /source_uploaded/)
  assert.match(editBriefWorkspaceSource, /brief_saved/)
  assert.match(editBriefWorkspaceSource, /plan_approved/)
  assert.match(editBriefWorkspaceSource, /preview_ready/)
  assert.match(editBriefWorkspaceSource, /preview_reviewed/)

  const editorPage = source('src/pages/EditorPage.tsx')
  assert.match(editorPage, /readProjectEditSessionBackendLocal/)
  assert.match(editorPage, /backendLocalEditSession/)
  assert.match(editorPage, /createProjectEditSessionChatHeaderModelFromRecord/)
  assert.match(editorPage, /Backend-local edit readback verified/)

  const clientSource = source('src/lib/project-edit-session-backend-local.ts')
  assert.match(clientSource, /\/v1\/edit-sessions/)
  assert.match(clientSource, /listProjectEditSessionsBackendLocal/)
  assert.match(clientSource, /recordProjectEditSessionLifecycleCheckpointBackendLocal/)
  assert.match(clientSource, /lifecycle-checkpoints/)
  assert.match(clientSource, /readback did not match/)
  assert.doesNotMatch(clientSource, /service_role|signedUrl|Stripe|production ready:\s*true/i)

  console.log(JSON.stringify({
    ok: true,
    smoke: 'project-edit-session-backend-local-route',
    editSessionId: session.id,
    projectId: session.projectId,
    listReadbackVerified: true,
    lifecycleCheckpointReadbackVerified: true,
    lifecycleStatus: lifecycleReadback.editSession.status,
    openRoute: created.openRoute,
    productReady: session.productReady,
  }, null, 2))
} finally {
  server.close()
  await once(server, 'close')
}
