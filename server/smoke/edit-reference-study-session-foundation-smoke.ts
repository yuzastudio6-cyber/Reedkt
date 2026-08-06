import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { editReferenceScopeHash } from '../edit-references/private-edit-reference-repository'
import type {
  EditReferenceApiSuccess,
  EditReferenceDetailData,
  EditReferenceListData,
  EditReferenceMessageData,
  PreferenceStudyData,
  PreferenceStudyMessageListData,
} from '../../src/types/edit-reference'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-edit-reference-gate1-'))
const ownerUserId = 'mock-user-runtime'
const workspaceA = 'workspace-edit-reference-a'
const workspaceB = 'workspace-edit-reference-b'

try {
  const runtime = await startRuntime(root, 'local')
  try {
    const emptyList = await request<EditReferenceListData>(runtime.baseUrl, `/v1/edit-references?workspaceId=${workspaceA}`)
    assert.equal(emptyList.status, 200)
    assert.deepEqual(emptyList.body.data.references, [])
    assert.equal(emptyList.body.data.productionPersistence, 'blocked_by_migration_baseline')
    await assert.rejects(stat(scopeDirectory(root, ownerUserId, workspaceA)), { code: 'ENOENT' })

    const createPayload = {
      workspaceId: workspaceA,
      name: 'Restrained investigative documentary',
      description: 'Preserve evidence-first pacing without copying a publisher identity.',
      initialGoals: ['visual_language', 'story_and_pacing', 'graphics'],
    }
    const created = await request<EditReferenceDetailData>(runtime.baseUrl, '/v1/edit-references', {
      method: 'POST',
      key: 'create-reference-001',
      body: createPayload,
    })
    assert.equal(created.status, 201)
    assert.equal(created.replayed, 'false')
    assert.equal(created.body.data.detail.reference.runtimeSource, 'backend_local_private')
    assert.equal(created.body.data.detail.study.status, 'collecting_evidence')
    assert.equal(created.body.data.detail.messages.length, 2)
    assert.equal(created.body.data.detail.nextAction, 'answer_setup_questions')
    assert.deepEqual(Object.values(created.body.data.detail.safety), Array(Object.keys(created.body.data.detail.safety).length).fill(false))
    assert.equal(created.body.data.detail.dnaVersions.length, 0)
    assert.equal(created.body.data.detail.dnaQaResults.length, 0)

    const createReplay = await request<EditReferenceDetailData>(runtime.baseUrl, '/v1/edit-references', {
      method: 'POST',
      key: 'create-reference-001',
      body: createPayload,
    })
    assert.equal(createReplay.status, 201)
    assert.equal(createReplay.replayed, 'true')
    assert.deepEqual(createReplay.body, created.body, 'idempotent replay must return the exact committed JSON body')

    const createConflict = await requestError(runtime.baseUrl, '/v1/edit-references', {
      method: 'POST',
      key: 'create-reference-001',
      body: { ...createPayload, name: 'Changed request' },
    })
    assert.equal(createConflict.status, 409)
    assert.equal(createConflict.code, 'IDEMPOTENCY_CONFLICT')

    const reference = created.body.data.detail.reference
    const study = created.body.data.detail.study
    const messagePayload = {
      workspaceId: workspaceA,
      expectedStudyRevision: study.revision,
      clientMessageId: 'client-message-001',
      content: 'Use restrained maps and evidence cards. Do not copy logos, exact layouts, fonts, or publisher identity.',
    }
    const message = await request<EditReferenceMessageData>(runtime.baseUrl, `/v1/edit-reference-studies/${study.id}/messages`, {
      method: 'POST',
      key: 'append-message-001',
      body: messagePayload,
    })
    assert.equal(message.status, 201)
    assert.equal(message.body.data.appendedMessageIds.length, 2)
    assert.equal(message.body.data.detail.messages.length, 4)
    assert.equal(message.body.data.detail.nextAction, 'run_evidence_study')
    assert.equal(message.body.data.detail.evidence.length, 1)
    assert.equal(message.body.data.detail.evidence[0]?.sourceType, 'manual_user_evidence')
    assert.equal(message.body.data.detail.evidence[0]?.summary, messagePayload.content)
    assert.equal(message.body.data.detail.evidence[0]?.transferability, 'transferable')
    assert.match(message.body.data.detail.messages.at(-1)?.content ?? '', /saved that direction/i)

    const messageReplay = await request<EditReferenceMessageData>(runtime.baseUrl, `/v1/edit-reference-studies/${study.id}/messages`, {
      method: 'POST',
      key: 'append-message-001',
      body: messagePayload,
    })
    assert.equal(messageReplay.replayed, 'true')
    assert.deepEqual(messageReplay.body, message.body, 'message replay must preserve the exact committed response snapshot')

    const duplicateClientMessage = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${study.id}/messages`, {
      method: 'POST',
      key: 'append-message-duplicate-client-id',
      body: { ...messagePayload, expectedStudyRevision: message.body.data.detail.study.revision },
    })
    assert.equal(duplicateClientMessage.status, 409)
    assert.equal(duplicateClientMessage.code, 'IDEMPOTENCY_CONFLICT')

    const staleMessage = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${study.id}/messages`, {
      method: 'POST',
      key: 'append-message-stale',
      body: { ...messagePayload, clientMessageId: 'client-message-002' },
    })
    assert.equal(staleMessage.status, 409)
    assert.equal(staleMessage.code, 'VERSION_CONFLICT')

    const studyRead = await request<PreferenceStudyData>(runtime.baseUrl, `/v1/edit-reference-studies/${study.id}?workspaceId=${workspaceA}`)
    assert.equal(studyRead.body.data.study.id, study.id)
    assert.equal(studyRead.body.data.messages.length, 4)
    const messageList = await request<PreferenceStudyMessageListData>(runtime.baseUrl, `/v1/edit-reference-studies/${study.id}/messages?workspaceId=${workspaceA}`)
    assert.equal(messageList.body.data.messages.length, 4)

    const secondStudy = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-references/${reference.id}/studies`, {
      method: 'POST',
      key: 'create-study-002',
      body: { workspaceId: workspaceA, expectedReferenceRevision: reference.revision, title: 'Clarification pass' },
    })
    assert.equal(secondStudy.status, 201)
    assert.equal(secondStudy.body.data.detail.study.title, 'Clarification pass')
    assert.notEqual(secondStudy.body.data.detail.study.id, study.id)

    const updatedStudy = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${secondStudy.body.data.detail.study.id}`, {
      method: 'PATCH',
      key: 'update-study-002',
      body: {
        workspaceId: workspaceA,
        expectedStudyRevision: secondStudy.body.data.detail.study.revision,
        title: 'Clarification pass — user review',
        status: 'needs_clarification',
      },
    })
    assert.equal(updatedStudy.body.data.detail.study.status, 'needs_clarification')
    assert.equal(updatedStudy.body.data.detail.study.title, 'Clarification pass — user review')

    const invalidTransition = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${secondStudy.body.data.detail.study.id}`, {
      method: 'PATCH',
      key: 'update-study-invalid-transition',
      body: {
        workspaceId: workspaceA,
        expectedStudyRevision: updatedStudy.body.data.detail.study.revision,
        status: 'dna_ready',
      },
    })
    assert.equal(invalidTransition.status, 409)
    assert.equal(invalidTransition.code, 'VALIDATION_FAILED')

    const tenantIsolation = await requestError(runtime.baseUrl, `/v1/edit-references/${reference.id}?workspaceId=${workspaceB}`)
    assert.equal(tenantIsolation.status, 404)
    assert.equal(tenantIsolation.code, 'EDIT_REFERENCE_NOT_FOUND')

    const aggregatePath = join(scopeDirectory(root, ownerUserId, workspaceA), 'aggregate.json')
    const aggregateStat = await stat(aggregatePath)
    assert.equal(aggregateStat.mode & 0o777, 0o600)
    const scopeStat = await stat(scopeDirectory(root, ownerUserId, workspaceA))
    assert.equal(scopeStat.mode & 0o777, 0o700)
    const storedText = await readFile(aggregatePath, 'utf8')
    assert.match(storedText, /"checksumSha256"/)
    assert.doesNotMatch(storedText, /"(?:rawProviderPayload|rawFrames|signedUrl|apiKey|serviceRoleKey|accessToken)"\s*:/i)
    assert.equal(aggregatePath.includes(ownerUserId), false)
    assert.equal(aggregatePath.includes(workspaceA), false)
  } finally {
    await runtime.close()
  }

  const restarted = await startRuntime(root, 'local')
  try {
    const reloaded = await request<EditReferenceListData>(restarted.baseUrl, `/v1/edit-references?workspaceId=${workspaceA}`)
    assert.equal(reloaded.body.data.references.length, 1)
    assert.equal(reloaded.body.data.references[0]?.messageCount, 2)
    const referenceId = reloaded.body.data.references[0]?.reference.id
    assert(referenceId)
    const detail = await request<EditReferenceDetailData>(restarted.baseUrl, `/v1/edit-references/${referenceId}?workspaceId=${workspaceA}`)
    assert.equal(detail.body.data.detail.messages.length, 2, 'current study messages must survive a backend restart')
    const aggregateText = await readFile(join(scopeDirectory(root, ownerUserId, workspaceA), 'aggregate.json'), 'utf8')
    assert.match(aggregateText, /client-message-001/, 'the original study conversation must remain durable after a new study becomes current')
  } finally {
    await restarted.close()
  }

  const cloudRuntime = await startRuntime(root, 'cloud_run')
  try {
    const blocked = await requestError(cloudRuntime.baseUrl, `/v1/edit-references?workspaceId=${workspaceA}`)
    assert.equal(blocked.status, 401)
    assert.equal(blocked.code, 'AUTH_REQUIRED')
  } finally {
    await cloudRuntime.close()
  }

  console.log('edit_reference_study_session_foundation_passed')
} finally {
  await rm(root, { recursive: true, force: true })
}

async function startRuntime(localStorageRoot: string, mode: 'local' | 'cloud_run') {
  const env = loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: mode,
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    PROVIDER_EXECUTION_ENABLED: 'false',
    WORKER_RUNTIME_MODE: 'mock',
  })
  const server = createReeditProApiApp(env).listen(0, '127.0.0.1')
  await new Promise<void>((resolvePromise, reject) => {
    server.once('listening', resolvePromise)
    server.once('error', reject)
  })
  const port = (server.address() as AddressInfo).port
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolvePromise, reject) => server.close((error) => error ? reject(error) : resolvePromise())),
  }
}

async function request<T>(baseUrl: string, path: string, options?: {
  method: 'POST' | 'PATCH'
  key: string
  body: unknown
}): Promise<{ status: number; replayed: string | null; body: EditReferenceApiSuccess<T> }> {
  const response = await fetch(`${baseUrl}${path}`, options ? {
    method: options.method,
    headers: { 'content-type': 'application/json', 'idempotency-key': options.key },
    body: JSON.stringify(options.body),
  } : undefined)
  const body = await response.json() as EditReferenceApiSuccess<T>
  assert.equal(body.ok, true, JSON.stringify(body))
  return { status: response.status, replayed: response.headers.get('idempotency-replayed'), body }
}

async function requestError(baseUrl: string, path: string, options?: {
  method: 'POST' | 'PATCH'
  key: string
  body: unknown
}): Promise<{ status: number; code: string }> {
  const response = await fetch(`${baseUrl}${path}`, options ? {
    method: options.method,
    headers: { 'content-type': 'application/json', 'idempotency-key': options.key },
    body: JSON.stringify(options.body),
  } : undefined)
  const body = await response.json() as { error: { code: string } }
  return { status: response.status, code: body.error.code }
}

function scopeDirectory(localStorageRoot: string, userId: string, workspaceId: string): string {
  return join(localStorageRoot, 'edit-reference-private', 'scopes', editReferenceScopeHash(userId, workspaceId))
}
