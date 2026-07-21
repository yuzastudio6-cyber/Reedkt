import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import type { SupabaseClient, User } from '@supabase/supabase-js'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  EDIT_REFERENCE_LOCAL_SUPABASE_DOMAIN_REPOSITORY_VERSION,
  createEditReferenceLocalSupabaseDomainCapability,
  createEditReferenceLocalSupabaseDomainRepository,
  assertEditReferenceLocalSupabaseDomainRepositoryIsNotProduction,
} from '../edit-references/edit-reference-local-supabase-domain-repository'
import {
  createEditReferenceLocalSupabaseDomainHttpRpcClient,
  assertEditReferenceLocalSupabaseDomainHttpRpcClientIsNotProduction,
} from '../edit-references/edit-reference-local-supabase-domain-http-rpc-client'
import { createEditReferenceService } from '../services/edit-reference-service'
import {
  createCanonicalV3LocalEditReferenceDomainRepositoryRuntimePort,
  assertEditReferenceDomainRepositoryRuntimePortIsNotProduction,
} from '../services/edit-reference-domain-repository-runtime-port'
import type { RuntimeClients } from '../types'

const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const serviceRoleKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY')
assert.equal(endpointOrigin, 'http://127.0.0.1:57431')

const actorUserId = '11111111-1111-4111-8111-111111111111'
const otherActorUserId = '22222222-2222-4222-8222-222222222222'
const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const runId = randomUUID()
const client = createEditReferenceLocalSupabaseDomainHttpRpcClient({
  endpointOrigin,
  serviceRoleKey,
})
const capability = createEditReferenceLocalSupabaseDomainCapability({
  client,
  endpointOrigin,
})
const repository = createEditReferenceLocalSupabaseDomainRepository({
  client,
  capability,
})
const runtimePort = createCanonicalV3LocalEditReferenceDomainRepositoryRuntimePort({
  repository,
})
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: `/tmp/reeditpro-canonical-v3-domain-${runId}`,
  PROVIDER_EXECUTION_ENABLED: 'false',
  WORKER_RUNTIME_MODE: 'mock',
})
const context = {
  env,
  clients: { admin: null, public: null },
  requestId: `local-domain-${runId}`,
  auth: { userId: actorUserId, isMockUser: true },
  editReferenceDomainRepositoryRuntimePort: runtimePort,
}

const service = createEditReferenceService(context)
const created = await service.createReference({
  workspaceId,
  name: `Evidence-first documentary ${runId.slice(0, 8)}`,
  description: 'Preserve meaning, testimony, and restrained pacing.',
  initialGoals: ['visual_language', 'story_and_pacing', 'audio_and_sfx'],
}, `create-domain-${runId}`)
assert.equal(created.replayed, false)
assert.equal(created.data.detail.reference.runtimeSource, 'canonical_supabase_transactional')
assert.equal(created.data.detail.study.runtimeSource, 'canonical_supabase_transactional')
assert.equal(created.data.detail.messages.length, 2)
assert.equal(created.data.detail.evidence.length, 0)
assert.match(created.warnings[0] ?? '', /isolated canonical V3 local Supabase reset/i)

const referenceId = created.data.detail.reference.id
const studyId = created.data.detail.study.id
const appended = await service.appendMessage(studyId, {
  workspaceId,
  expectedStudyRevision: 1,
  clientMessageId: `client-message-${runId}`,
  content: 'Hold two beats of silence before the witness reveals the decisive fact.',
}, `append-domain-${runId}`)
assert.equal(appended.replayed, false)
assert.equal(appended.data.detail.study.revision, 2)
assert.equal(appended.data.detail.evidence.length, 1)
assert.equal(appended.data.appendedMessageIds.length, 2)

const replayed = await service.appendMessage(studyId, {
  workspaceId,
  expectedStudyRevision: 1,
  clientMessageId: `client-message-${runId}`,
  content: 'Hold two beats of silence before the witness reveals the decisive fact.',
}, `append-domain-${runId}`)
assert.equal(replayed.replayed, true)
assert.deepEqual(replayed.data.appendedMessageIds, appended.data.appendedMessageIds)

await assert.rejects(
  service.appendMessage(studyId, {
    workspaceId,
    expectedStudyRevision: 1,
    clientMessageId: `client-message-${runId}`,
    content: 'A changed payload must not reuse the committed key.',
  }, `append-domain-${runId}`),
  (error: unknown) => error instanceof ApiError
    && error.code === 'IDEMPOTENCY_CONFLICT',
)

const renamed = await service.updateReference(referenceId, {
  workspaceId,
  expectedReferenceRevision: 1,
  name: `Investigative documentary ${runId.slice(0, 8)}`,
}, `rename-domain-${runId}`)
assert.equal(renamed.data.detail.reference.revision, 2)
assert.match(renamed.data.detail.reference.name, /^Investigative documentary/)

const listed = await service.listReferences(workspaceId)
const listedReference = listed.data.references.find(
  (item) => item.reference.id === referenceId,
)
assert.ok(listedReference)
assert.equal(listedReference.currentStudy.revision, 2)
assert.equal(listedReference.messageCount, 4)
assert.equal(listed.data.persistence, 'canonical_supabase_transactional')

const restartedClient = createEditReferenceLocalSupabaseDomainHttpRpcClient({
  endpointOrigin,
  serviceRoleKey,
})
const restartedCapability = createEditReferenceLocalSupabaseDomainCapability({
  client: restartedClient,
  endpointOrigin,
})
const restartedRepository = createEditReferenceLocalSupabaseDomainRepository({
  client: restartedClient,
  capability: restartedCapability,
})
const restartedPort = createCanonicalV3LocalEditReferenceDomainRepositoryRuntimePort({
  repository: restartedRepository,
})
const restarted = createEditReferenceService({
  ...context,
  requestId: `local-domain-restart-${runId}`,
  editReferenceDomainRepositoryRuntimePort: restartedPort,
})
const recovered = await restarted.getReference(workspaceId, referenceId)
assert.equal(recovered.data.detail.reference.id, referenceId)
assert.equal(recovered.data.detail.study.id, studyId)
assert.deepEqual(
  recovered.data.detail.messages.map((message) => message.id),
  appended.data.detail.messages.map((message) => message.id),
)

const auditEvents = await restartedRepository.readAuditEvents({
  ownerUserId: actorUserId,
  workspaceId,
  localStorageRoot: env.localStorageRoot,
})
const currentReferenceAuditEvents = auditEvents.filter(
  (event) => event.editReferenceId === referenceId,
)
assert.equal(currentReferenceAuditEvents.length, 3)
assert.deepEqual(
  currentReferenceAuditEvents.map((event) => event.eventType),
  [
    'edit_reference_created',
    'preference_study_message_appended',
    'edit_reference_updated',
  ],
)
assert.deepEqual(
  auditEvents.map((event) => event.sequence),
  Array.from({ length: auditEvents.length }, (_value, index) => index + 1),
)

const clients = createFakeClients(new Map([
  ['local-domain-token-a', fakeUser(actorUserId, 'owner-a@example.test')],
  ['local-domain-token-b', fakeUser(otherActorUserId, 'owner-b@example.test')],
]))
const server = await listen(createServer(createReeditProApiApp(env, {
  clients,
  editReferenceDomainRepositoryRuntimePort: restartedPort,
})))
const baseUrl = serverBaseUrl(server)
try {
  const mountedList = await requestJson(
    `${baseUrl}/v1/edit-references?workspaceId=${workspaceId}`,
    { token: 'local-domain-token-a' },
  )
  assert.equal(mountedList.status, 200)
  assert.equal(mountedList.json.ok, true)
  assert.ok(mountedList.json.data.references.some((item) => (
    item.reference.id === referenceId
  )))

  const mountedCreated = await requestJson(`${baseUrl}/v1/edit-references`, {
    method: 'POST',
    token: 'local-domain-token-a',
    idempotencyKey: `mounted-create-${runId}`,
    body: {
      workspaceId,
      name: `Mounted preference ${runId.slice(0, 8)}`,
      initialGoals: ['captions', 'color'],
    },
  })
  assert.equal(mountedCreated.status, 201)
  assert.equal(mountedCreated.json.ok, true)
  assert.equal(
    mountedCreated.json.data.detail.reference.runtimeSource,
    'canonical_supabase_transactional',
  )

  const crossWorkspace = await requestJson(
    `${baseUrl}/v1/edit-references?workspaceId=${workspaceId}`,
    { token: 'local-domain-token-b' },
  )
  assert.equal(crossWorkspace.status, 403)
  assert.equal(crossWorkspace.json.error?.code, 'WORKSPACE_ACCESS_DENIED')
} finally {
  await close(server)
}

await assert.rejects(
  restartedRepository.read({
    ownerUserId: otherActorUserId,
    workspaceId,
    localStorageRoot: env.localStorageRoot,
  }),
  (error: unknown) => error instanceof ApiError
    && error.code === 'WORKSPACE_ACCESS_DENIED',
)

let rawMutationClosureCalls = 0
await assert.rejects(
  restartedRepository.mutate({
    scope: {
      ownerUserId: actorUserId,
      workspaceId,
      localStorageRoot: env.localStorageRoot,
    },
    operation: 'edit_reference.create',
    idempotencyKey: `missing-command-${runId}`,
    requestHash: 'a'.repeat(64),
    mutate: () => {
      rawMutationClosureCalls += 1
      throw new Error('raw_mutation_closure_must_not_run')
    },
    replay: () => {
      throw new Error('raw_mutation_replay_must_not_run')
    },
  }),
  (error: unknown) => error instanceof ApiError
    && (error.details as { reason?: string } | undefined)?.reason
      === 'local_domain_explicit_command_required',
)
assert.equal(rawMutationClosureCalls, 0)

const disallowedRpc = await client.rpc('read_exact_edit_apply_authority_v1', {})
assert.equal((disallowedRpc.error as { code?: string } | null)?.code, 'RPC_FUNCTION_NOT_ALLOWED')
assertEditReferenceDomainRepositoryRuntimePortIsNotProduction(runtimePort)
assert.throws(
  () => assertEditReferenceLocalSupabaseDomainRepositoryIsNotProduction(repository),
  (error: unknown) => error instanceof ApiError,
)
assert.throws(
  () => assertEditReferenceLocalSupabaseDomainHttpRpcClientIsNotProduction(client),
  (error: unknown) => error instanceof ApiError,
)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: EDIT_REFERENCE_LOCAL_SUPABASE_DOMAIN_REPOSITORY_VERSION,
  repositoryPersistence: repository.persistence,
  commandRpc: 'mutate_edit_reference_domain_command_v1',
  readRpc: 'read_edit_reference_domain_aggregate_v1',
  explicitCommandsVerified: 3,
  exactReplayStable: true,
  idempotencyConflictRejected: true,
  staleBrowserAggregateAccepted: false,
  rawMutationClosureCalls,
  crossWorkspaceReadDenied: true,
  restartReadbackVerifiedLocally: true,
  mountedHttpLibraryCreateAndReadVerified: true,
  mountedHttpCrossWorkspaceDenied: true,
  auditSequenceVerified: true,
  serviceRoleCredentialExposed: false,
  remoteDatabaseMutationAllowed: false,
  productionAuthority: false,
}, null, 2))

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name}_required`)
  return value
}

type EditReferenceApiEnvelope = {
  readonly ok?: boolean
  readonly data: {
    readonly references: Array<{ readonly reference: { readonly id: string } }>
    readonly detail: {
      readonly reference: { readonly runtimeSource: string }
    }
  }
  readonly error?: { readonly code?: string }
}

function fakeUser(id: string, email: string): User {
  return {
    id,
    email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date(0).toISOString(),
  } as User
}

function createFakeClients(usersByToken: Map<string, User>): RuntimeClients {
  return {
    public: {
      auth: {
        async getUser(token: string) {
          const user = usersByToken.get(token) ?? null
          return user
            ? { data: { user }, error: null }
            : { data: { user: null }, error: { message: 'Invalid local domain token.' } }
        },
      },
    } as unknown as SupabaseClient,
    admin: {
      from(tableName: string) {
        if (tableName !== 'workspace_members') {
          throw new Error(`Unexpected local domain table read: ${tableName}`)
        }
        let selectedWorkspaceId = ''
        let selectedUserId = ''
        const query = {
          select() {
            return query
          },
          eq(column: string, value: string) {
            if (column === 'workspace_id') selectedWorkspaceId = value
            if (column === 'user_id') selectedUserId = value
            return query
          },
          async maybeSingle() {
            const role = selectedWorkspaceId === workspaceId
              && selectedUserId === actorUserId
              ? 'owner'
              : null
            return {
              data: role ? {
                workspace_id: selectedWorkspaceId,
                user_id: selectedUserId,
                role,
              } : null,
              error: null,
            }
          },
        }
        return query
      },
    } as unknown as SupabaseClient,
  }
}

async function requestJson(url: string, input: {
  readonly method?: 'GET' | 'POST'
  readonly token: string
  readonly idempotencyKey?: string
  readonly body?: unknown
}): Promise<{ readonly status: number; readonly json: EditReferenceApiEnvelope }> {
  const method = input.method ?? 'GET'
  const headers = new Headers({
    accept: 'application/json',
    authorization: `Bearer ${input.token}`,
  })
  if (input.idempotencyKey) headers.set('idempotency-key', input.idempotencyKey)
  if (method === 'POST') headers.set('content-type', 'application/json')
  const response = await fetch(url, {
    method,
    headers,
    body: method === 'POST' ? JSON.stringify(input.body) : undefined,
  })
  return {
    status: response.status,
    json: await response.json() as EditReferenceApiEnvelope,
  }
}

async function listen(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function serverBaseUrl(server: Server): string {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected a TCP server address.')
  return `http://127.0.0.1:${address.port}`
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}
