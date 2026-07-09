import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  createProjectBackendLocal,
} from '../../src/lib/project-backend-local'
import {
  createProjectEditSessionBackendLocalFromNewEditForm,
} from '../../src/lib/project-edit-session-backend-local'
import {
  createDefaultNewEditSessionFormState,
} from '../../src/lib/project-edit-session-create-flow-ui-adapter'
import {
  createProjectEditBriefBackendLocalConfig,
  readProjectEditBriefBackendLocal,
  saveProjectEditBriefBackendLocal,
} from '../../src/lib/project-edit-brief-backend-local'

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
  LOCAL_STORAGE_ROOT: '.reeditpro-local-storage-edit-brief-save-smoke',
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
  const config = createProjectEditBriefBackendLocalConfig({
    VITE_REEDITPRO_API_BASE_URL: apiBaseUrl,
    VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID: 'mock-workspace',
  })
  assert.equal(config.available, true)
  assert.equal(config.mode, 'backend_local_edit_brief')

  const project = await createProjectBackendLocal({
    apiBaseUrl,
    name: 'Brief save smoke project',
    workspaceId: 'mock-workspace',
    getAccessToken: async () => undefined,
  })
  const editSession = await createProjectEditSessionBackendLocalFromNewEditForm({
    apiBaseUrl,
    form: {
      ...createDefaultNewEditSessionFormState(),
      aspectRatio: '16:9',
      name: 'Brief save smoke edit',
      platformTarget: 'youtube_standard',
    },
    projectId: project.project.id,
    workspaceId: 'mock-workspace',
    getAccessToken: async () => undefined,
  })
  assert.ok(editSession.session)

  const saved = await saveProjectEditBriefBackendLocal({
    apiBaseUrl,
    briefText: 'Clean pacing, readable captions, and preserve the source meaning.',
    editSessionId: editSession.session.id,
    projectId: project.project.id,
    workspaceId: 'mock-workspace',
    getAccessToken: async () => undefined,
  })

  assert.equal(saved.editBrief.briefText, 'Clean pacing, readable captions, and preserve the source meaning.')
  assert.equal(saved.readback.id, saved.editBrief.id)
  assert.equal(saved.readback.editSessionId, editSession.session.id)
  assert.equal(saved.readback.projectId, project.project.id)
  assert.equal(saved.readback.backendLocalBriefStored, true)
  assert.equal(saved.readback.readbackVerified, true)
  assert.equal(saved.readback.providerCallMade, false)
  assert.equal(saved.readback.workerJobCreated, false)
  assert.equal(saved.readback.renderJobCreated, false)
  assert.equal(saved.readback.creditReservedOrSpent, false)
  assert.equal(saved.readback.supabaseWriteMade, false)
  assert.equal(saved.readback.gcsWriteMade, false)
  assert.equal(saved.readback.productReady, false)

  const reread = await readProjectEditBriefBackendLocal({
    apiBaseUrl,
    editSessionId: editSession.session.id,
    projectId: project.project.id,
    workspaceId: 'mock-workspace',
    getAccessToken: async () => undefined,
  })
  assert.equal(reread.editBrief.id, saved.editBrief.id)
  assert.equal(reread.editBrief.briefText, saved.editBrief.briefText)

  const appSource = source('server/app.ts')
  assert.match(appSource, /createProjectEditBriefLocalRoutes/)

  const routeSource = source('server/routes/project-edit-brief-local-routes.ts')
  assert.match(routeSource, /local-brief/)
  assert.match(routeSource, /requireIdempotency/)

  const serviceSource = source('server/services/project-edit-brief-local-service.ts')
  assert.match(serviceSource, /backendLocalBriefStored/)
  assert.match(serviceSource, /providerCallMade: false/)
  assert.match(serviceSource, /productReady: false/)
  assert.doesNotMatch(serviceSource, /service_role|signedUrl|Stripe|production ready:\s*true/i)

  const workspaceSource = source('src/components/projects/brief/ProjectEditBriefWorkspace.tsx')
  assert.match(workspaceSource, /saveProjectEditBriefBackendLocal/)
  assert.match(workspaceSource, /backendSavedBrief/)
  assert.match(workspaceSource, /project-edit-brief-save-status/)

  const clientSource = source('src/lib/project-edit-brief-backend-local.ts')
  assert.match(clientSource, /local-brief/)
  assert.match(clientSource, /readback did not match/)
  assert.doesNotMatch(clientSource, /service_role|signedUrl|Stripe|production ready:\s*true/i)

  console.log(JSON.stringify({
    ok: true,
    smoke: 'project-edit-brief-backend-local-route',
    projectId: project.project.id,
    editSessionId: editSession.session.id,
    briefId: saved.editBrief.id,
    readbackVerified: reread.editBrief.id === saved.editBrief.id,
    productReady: saved.readback.productReady,
  }, null, 2))
} finally {
  server.close()
  await once(server, 'close')
}
