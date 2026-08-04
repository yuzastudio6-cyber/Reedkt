import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { LocalInternalProjectHandoff } from '../../src/lib/local-project-handoff'

type ResponseMode = 'ready' | 'access_denied' | 'invalid_owner' | 'incomplete' | 'unavailable'

const scope = {
  authMode: 'local_test' as const,
  userId: 'dashboard-recovery-user',
  workspaceId: 'dashboard-recovery-workspace',
}
const now = '2026-07-10T12:00:00.000Z'
const handoff: LocalInternalProjectHandoff = {
  id: 'dashboard-recovery-edit',
  workspaceId: scope.workspaceId,
  projectId: 'dashboard-recovery-project',
  editSessionId: 'dashboard-recovery-edit',
  projectName: 'Dashboard recovery project',
  editName: 'Recovered named edit',
  category: 'storytelling',
  editorPath: '/projects/dashboard-recovery-project/edits/dashboard-recovery-edit',
  stage: 'created',
  sourceFileCount: 0,
  createdAt: now,
  updatedAt: now,
  persistence: 'browser_local_internal_testing',
}

process.env.VITE_REEDITPRO_API_MODE = 'mock'
delete process.env.VITE_REEDITPRO_API_BASE_URL

const {
  listLocalInternalProjectHandoffsFromBackendResult,
} = await import('../../src/lib/internal-edit-state-backend-sync')

const notConfigured = await listLocalInternalProjectHandoffsFromBackendResult(scope)
assert.equal(notConfigured.status, 'not_configured')

let responseMode: ResponseMode = 'ready'
const server = createServer((request, response) => {
  assert.equal(
    request.url,
    `/v1/internal-edit-states?workspaceId=${encodeURIComponent(scope.workspaceId)}`,
    'Dashboard recovery must request the exact signed-in workspace.',
  )
  response.setHeader('content-type', 'application/json')

  if (responseMode === 'access_denied') {
    response.statusCode = 403
    response.end(JSON.stringify({
      ok: false,
      error: { code: 'WORKSPACE_ACCESS_DENIED', message: 'Workspace access denied.' },
      warnings: [],
      mockOnly: false,
    }))
    return
  }

  if (responseMode === 'unavailable') {
    response.statusCode = 503
    response.end(JSON.stringify({
      ok: false,
      error: { code: 'http_transport_failed', message: 'Temporary recovery failure.' },
      warnings: [],
      mockOnly: false,
    }))
    return
  }

  if (responseMode === 'incomplete') {
    response.end(JSON.stringify({ ok: true, data: {}, warnings: [], mockOnly: false }))
    return
  }

  const userId = responseMode === 'invalid_owner' ? 'another-user' : scope.userId
  response.end(JSON.stringify({
    ok: true,
    data: {
      internalEditStates: [{
        userId,
        workspaceId: scope.workspaceId,
        projectId: handoff.projectId,
        editSessionId: handoff.editSessionId,
        handoff,
        updatedAt: handoff.updatedAt,
      }],
    },
    warnings: [],
    mockOnly: false,
  }))
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object', 'Dashboard recovery smoke server should expose a TCP address.')

process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${address.port}`

try {
  responseMode = 'ready'
  const ready = await listLocalInternalProjectHandoffsFromBackendResult(scope)
  assert.equal(ready.status, 'ready')
  assert.deepEqual(ready.status === 'ready' ? ready.handoffs : [], [handoff])

  responseMode = 'access_denied'
  const denied = await listLocalInternalProjectHandoffsFromBackendResult(scope)
  assert.equal(denied.status, 'access_denied')

  responseMode = 'invalid_owner'
  const invalidOwner = await listLocalInternalProjectHandoffsFromBackendResult(scope)
  assert.equal(invalidOwner.status, 'invalid_response')

  responseMode = 'incomplete'
  const incomplete = await listLocalInternalProjectHandoffsFromBackendResult(scope)
  assert.equal(incomplete.status, 'invalid_response')

  responseMode = 'unavailable'
  const unavailable = await listLocalInternalProjectHandoffsFromBackendResult(scope)
  assert.equal(unavailable.status, 'unavailable')
  assert.equal(unavailable.status === 'unavailable' ? unavailable.retryable : false, true)
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}

console.log('Dashboard edit recovery result smoke passed.')
