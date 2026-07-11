import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { createEditReferenceApiClient } from '../../src/lib/edit-reference-api-client'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-edit-reference-client-'))
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  API_PORT: '8787',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: root,
  PROVIDER_EXECUTION_ENABLED: 'false',
  WORKER_RUNTIME_MODE: 'mock',
})
const server = createReeditProApiApp(env).listen(0, '127.0.0.1')

try {
  await new Promise<void>((resolvePromise, reject) => {
    server.once('listening', resolvePromise)
    server.once('error', reject)
  })
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const client = createEditReferenceApiClient(baseUrl)
  const workspaceId = 'workspace-api-client-smoke'
  assert.equal(client.available, true)

  const empty = await client.list(workspaceId)
  assert(empty.ok)
  assert.deepEqual(empty.data.references, [])

  const created = await client.create({
    workspaceId,
    name: 'Browser client reference',
    description: 'A browser-safe contract smoke.',
    initialGoals: ['captions', 'graphics'],
  }, 'client-create-001')
  assert(created.ok)
  const referenceId = created.data.detail.reference.id
  const studyId = created.data.detail.study.id

  const loaded = await client.get(workspaceId, referenceId)
  assert(loaded.ok)
  assert.equal(loaded.data.detail.reference.id, referenceId)
  const study = await client.getStudy(workspaceId, studyId)
  assert(study.ok)
  assert.equal(study.data.messages.length, 2)
  const messageList = await client.listStudyMessages(workspaceId, studyId)
  assert(messageList.ok)
  assert.equal(messageList.data.messages.length, 2)

  const appended = await client.appendMessage(studyId, {
    workspaceId,
    expectedStudyRevision: created.data.detail.study.revision,
    clientMessageId: 'browser-client-message-001',
    content: 'Keep captions readable and never copy reference-specific type treatments.',
  }, 'client-message-001')
  assert(appended.ok)
  assert.equal(appended.data.appendedMessageIds.length, 2)
  assert.equal(appended.data.detail.messages.length, 4)

  const unavailable = createEditReferenceApiClient('')
  assert.equal(unavailable.available, false)
  const unavailableList = await unavailable.list(workspaceId)
  assert.equal(unavailableList.ok, false)
  if (!unavailableList.ok) assert.equal(unavailableList.code, 'EDIT_REFERENCE_BACKEND_UNAVAILABLE')

  console.log('edit_reference_api_client_passed')
} finally {
  await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()))
  await rm(root, { recursive: true, force: true })
}
