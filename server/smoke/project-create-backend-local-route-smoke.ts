import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  createProjectBackendLocal,
  createProjectBackendLocalConfig,
  listProjectsBackendLocal,
  readProjectBackendLocal,
} from '../../src/lib/project-backend-local'

function source(path: string): string {
  return readFileSync(path, 'utf8')
}

function localUrl(port: number, path = ''): string {
  return `http://127.0.0.1:${port}${path}`
}

const app = createReeditProApiApp(loadRuntimeEnv({
  ...process.env,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  E2E_RUNTIME_MODE: 'mock',
  LOCAL_STORAGE_ROOT: '.reeditpro-local-storage-project-create-smoke',
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
  const config = createProjectBackendLocalConfig({
    VITE_REEDITPRO_API_BASE_URL: apiBaseUrl,
    VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID: 'mock-workspace',
  })
  assert.equal(config.available, true)
  assert.equal(config.mode, 'backend_local_project')

  const created = await createProjectBackendLocal({
    apiBaseUrl,
    name: 'Smoke-created clean project',
    workspaceId: 'mock-workspace',
    getAccessToken: async () => undefined,
  })
  assert.equal(created.project.name, 'Smoke-created clean project')
  assert.equal(created.readback.id, created.project.id)
  assert.equal(created.readback.name, created.project.name)
  assert.equal(created.readback.mockOnly, true)
  assert.equal(created.readback.providerCallMade, false)
  assert.equal(created.readback.workerJobCreated, false)
  assert.equal(created.readback.renderJobCreated, false)
  assert.equal(created.readback.creditReservedOrSpent, false)
  assert.equal(created.readback.supabaseWriteMade, false)
  assert.equal(created.readback.gcsWriteMade, false)
  assert.equal(created.readback.productReady, false)

  const reread = await readProjectBackendLocal({
    apiBaseUrl,
    projectId: created.project.id,
    getAccessToken: async () => undefined,
  })
  assert.equal(reread.project.id, created.project.id)
  assert.equal(reread.project.name, created.project.name)

  const listed = await listProjectsBackendLocal({
    apiBaseUrl,
    workspaceId: 'mock-workspace',
    getAccessToken: async () => undefined,
  })
  assert.ok(listed.projects.some((project) => project.id === created.project.id))

  const createPage = source('src/pages/CreateProjectPage.tsx')
  assert.match(createPage, /createProjectBackendLocal/)
  assert.match(createPage, /project-create-status/)
  assert.match(createPage, /newEdit=1/)
  assert.doesNotMatch(createPage, /MOCK_PROJECT_HOME_PROJECT_ID|projectHomeWithNewEdit/)

  const projectHomePage = source('src/pages/ProjectHomePage.tsx')
  assert.match(projectHomePage, /readProjectBackendLocal/)
  assert.match(projectHomePage, /projectTitleReadback/)

  const projectsPage = source('src/pages/ProjectsPage.tsx')
  assert.match(projectsPage, /listProjectsBackendLocal/)
  assert.match(projectsPage, /projects-empty-state/)
  assert.match(projectsPage, /projectCardFromBackendLocal/)
  assert.match(projectsPage, /No sample project is shown as a real workspace/)
  assert.doesNotMatch(projectsPage, /import\s+\{\s*projects\s*\}\s+from\s+'..\/data\/mockData'|Open sample project|MOCK_PROJECT_HOME_PROJECT_ID|currentProjectPath/)

  const projectClient = source('src/lib/project-backend-local.ts')
  assert.match(projectClient, /\/v1\/projects/)
  assert.match(projectClient, /workspaceId=/)
  assert.match(projectClient, /readback did not match/)
  assert.doesNotMatch(projectClient, /service_role|signedUrl|Stripe|production ready:\s*true/i)

  const projectService = source('server/services/project-service.ts')
  assert.match(projectService, /mockProjects/)
  assert.match(projectService, /listProjects/)
  assert.match(projectService, /providerCallMade: false/)
  assert.match(projectService, /productReady: false/)

  console.log(JSON.stringify({
    ok: true,
    smoke: 'project-create-backend-local-route',
    projectId: created.project.id,
    projectName: created.project.name,
    readbackVerified: reread.project.id === created.project.id,
    listReadbackVerified: listed.projects.some((project) => project.id === created.project.id),
    productReady: created.readback.productReady,
  }, null, 2))
} finally {
  server.close()
  await once(server, 'close')
}
