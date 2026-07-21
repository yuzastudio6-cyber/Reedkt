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

const evidenceStudy = await service.runEvidenceStudy(studyId, {
  workspaceId,
  expectedStudyRevision: 2,
}, `evidence-study-domain-${runId}`)
assert.equal(evidenceStudy.replayed, false)
assert.equal(evidenceStudy.data.detail.study.revision, 3)
assert.equal(evidenceStudy.data.detail.study.status, 'evidence_ready')
assert.equal(evidenceStudy.data.detail.study.evidenceStatus, 'evidence_ready')
assert.ok(evidenceStudy.data.detail.evidence.length > appended.data.detail.evidence.length)
assert.ok(evidenceStudy.data.detail.skillRuns.length > 0)
assert.ok(evidenceStudy.data.detail.skillRuns.every((record) => (
  record.providerCallMade === false
  && record.modelCallMade === false
  && record.fileBytesRead === false
  && record.mediaProcessingStarted === false
  && record.workerJobCreated === false
)))

await assert.rejects(
  service.runEvidenceStudy(studyId, {
    workspaceId,
    expectedStudyRevision: 3,
    retryBlockedSkills: true,
  }, `evidence-study-retry-domain-${runId}`),
  (error: unknown) => error instanceof ApiError
    && error.code === 'EDIT_REFERENCE_PERSISTENCE_BLOCKED'
    && (error.details as { requiredGate?: string } | undefined)?.requiredGate
      === 'canonical_pre_plan_study_result_commit_adapter',
)
const afterBlockedRetry = await service.getStudy(workspaceId, studyId)
assert.equal(afterBlockedRetry.data.study.revision, 3)

const synthesized = await service.synthesizePreferenceDNA(studyId, {
  workspaceId,
  expectedStudyRevision: 3,
}, `dna-domain-${runId}`)
assert.equal(synthesized.replayed, false)
assert.equal(synthesized.data.detail.study.revision, 4)
assert.equal(synthesized.data.detail.study.status, 'dna_ready')
assert.equal(synthesized.data.detail.dnaVersions.length, 1)
const dnaVersion = synthesized.data.detail.dnaVersions[0]
assert.ok(dnaVersion)
assert.equal(dnaVersion.status, 'review_required')
assert.equal(dnaVersion.qaStatus, 'not_run')

const qaReviewed = await service.runPreferenceDNAQA(studyId, dnaVersion.id, {
  workspaceId,
  expectedStudyRevision: 4,
  expectedDNAContentDigest: dnaVersion.contentDigest,
}, `dna-qa-domain-${runId}`)
assert.equal(qaReviewed.replayed, false)
assert.equal(qaReviewed.data.detail.study.revision, 5)
assert.equal(qaReviewed.data.detail.dnaQaResults.length, 1)
const qaResult = qaReviewed.data.detail.dnaQaResults[0]
const reviewedDnaVersion = qaReviewed.data.detail.dnaVersions[0]
assert.ok(qaResult)
assert.ok(reviewedDnaVersion)
assert.notEqual(qaResult.status, 'blocked')
assert.equal(reviewedDnaVersion.qaResultId, qaResult.id)
assert.equal(reviewedDnaVersion.qaStatus, qaResult.status)

const approved = await service.approvePreferenceDNA(studyId, dnaVersion.id, {
  workspaceId,
  expectedStudyRevision: 5,
  expectedDNAContentDigest: dnaVersion.contentDigest,
  qaResultId: qaResult.id,
  acknowledgeAdaptNotCopy: true,
  acknowledgeQAReview: true,
}, `dna-approve-domain-${runId}`)
assert.equal(approved.replayed, false)
assert.equal(approved.data.detail.study.revision, 6)
assert.equal(approved.data.detail.study.status, 'approved')
assert.equal(approved.data.detail.dnaVersions[0]?.status, 'approved')
assert.equal(approved.data.detail.dnaVersions[0]?.approval?.qaResultId, qaResult.id)
assert.equal(approved.data.detail.applications.length, 0)

const committedIdentity = {
  evidenceIds: approved.data.detail.evidence.map((record) => record.id),
  skillRunIds: approved.data.detail.skillRuns.map((record) => record.id),
  dnaIds: approved.data.detail.dnaVersions.map((record) => record.id),
  qaIds: approved.data.detail.dnaQaResults.map((record) => record.id),
}
const evidenceStudyReplay = await service.runEvidenceStudy(studyId, {
  workspaceId,
  expectedStudyRevision: 2,
}, `evidence-study-domain-${runId}`)
assert.equal(evidenceStudyReplay.replayed, true)
assert.deepEqual({
  evidenceIds: evidenceStudyReplay.data.detail.evidence.map((record) => record.id),
  skillRunIds: evidenceStudyReplay.data.detail.skillRuns.map((record) => record.id),
  dnaIds: evidenceStudyReplay.data.detail.dnaVersions.map((record) => record.id),
  qaIds: evidenceStudyReplay.data.detail.dnaQaResults.map((record) => record.id),
}, committedIdentity)

const correctedDirection = await service.appendMessage(studyId, {
  workspaceId,
  expectedStudyRevision: 6,
  clientMessageId: `client-correction-${runId}`,
  content: 'Revise the preference: captions should be quieter and appear only when speech clarity needs support.',
}, `append-correction-domain-${runId}`)
assert.equal(correctedDirection.replayed, false)
assert.equal(correctedDirection.data.detail.study.revision, 7)
assert.equal(correctedDirection.data.detail.study.status, 'ready_to_study')
assert.equal(correctedDirection.data.detail.dnaVersions[0]?.status, 'superseded')
assert.equal(correctedDirection.data.detail.reference.dnaStatus, 'not_generated')

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
assert.equal(listedReference.currentStudy.revision, 7)
assert.equal(listedReference.messageCount, 10)
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
  correctedDirection.data.detail.messages.map((message) => message.id),
)

const auditEvents = await restartedRepository.readAuditEvents({
  ownerUserId: actorUserId,
  workspaceId,
  localStorageRoot: env.localStorageRoot,
})
const currentReferenceAuditEvents = auditEvents.filter(
  (event) => event.editReferenceId === referenceId,
)
assert.equal(currentReferenceAuditEvents.length, 8)
assert.deepEqual(
  currentReferenceAuditEvents.map((event) => event.eventType),
  [
    'edit_reference_created',
    'preference_study_message_appended',
    'preference_evidence_study_completed',
    'preference_dna_version_created',
    'preference_dna_qa_completed',
    'preference_dna_version_approved',
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
  const mountedReferenceId = mountedCreated.json.data.detail.reference.id
  const mountedStudyId = mountedCreated.json.data.detail.study.id

  const mountedDirection = await requestJson(
    `${baseUrl}/v1/edit-reference-studies/${mountedStudyId}/messages`,
    {
      method: 'POST',
      token: 'local-domain-token-a',
      idempotencyKey: `mounted-direction-${runId}`,
      body: {
        workspaceId,
        expectedStudyRevision: 1,
        clientMessageId: `mounted-direction-message-${runId}`,
        content: 'Keep the pacing measured, protect testimony, and use restrained captions.',
      },
    },
  )
  assert.equal(mountedDirection.status, 201)
  assert.equal(mountedDirection.json.data.detail.study.revision, 2)

  const mountedEvidenceStudy = await requestJson(
    `${baseUrl}/v1/edit-reference-studies/${mountedStudyId}/evidence-study`,
    {
      method: 'POST',
      token: 'local-domain-token-a',
      idempotencyKey: `mounted-evidence-study-${runId}`,
      body: { workspaceId, expectedStudyRevision: 2 },
    },
  )
  assert.equal(mountedEvidenceStudy.status, 201)
  assert.equal(mountedEvidenceStudy.json.data.detail.study.status, 'evidence_ready')
  assert.equal(mountedEvidenceStudy.json.data.detail.study.revision, 3)

  const mountedDna = await requestJson(
    `${baseUrl}/v1/edit-reference-studies/${mountedStudyId}/preference-dna`,
    {
      method: 'POST',
      token: 'local-domain-token-a',
      idempotencyKey: `mounted-dna-${runId}`,
      body: { workspaceId, expectedStudyRevision: 3 },
    },
  )
  assert.equal(mountedDna.status, 201)
  assert.equal(mountedDna.json.data.detail.study.status, 'dna_ready')
  const mountedDnaVersion = mountedDna.json.data.detail.dnaVersions[0]
  assert.ok(mountedDnaVersion)

  const mountedQa = await requestJson(
    `${baseUrl}/v1/edit-reference-studies/${mountedStudyId}/preference-dna/${mountedDnaVersion.id}/qa`,
    {
      method: 'POST',
      token: 'local-domain-token-a',
      idempotencyKey: `mounted-dna-qa-${runId}`,
      body: {
        workspaceId,
        expectedStudyRevision: 4,
        expectedDNAContentDigest: mountedDnaVersion.contentDigest,
      },
    },
  )
  assert.equal(mountedQa.status, 201)
  const mountedQaResult = mountedQa.json.data.detail.dnaQaResults[0]
  assert.ok(mountedQaResult)
  assert.notEqual(mountedQaResult.status, 'blocked')

  const mountedApproved = await requestJson(
    `${baseUrl}/v1/edit-reference-studies/${mountedStudyId}/preference-dna/${mountedDnaVersion.id}/approve`,
    {
      method: 'POST',
      token: 'local-domain-token-a',
      idempotencyKey: `mounted-dna-approve-${runId}`,
      body: {
        workspaceId,
        expectedStudyRevision: 5,
        expectedDNAContentDigest: mountedDnaVersion.contentDigest,
        qaResultId: mountedQaResult.id,
        acknowledgeAdaptNotCopy: true,
        acknowledgeQAReview: true,
      },
    },
  )
  assert.equal(mountedApproved.status, 201)
  assert.equal(mountedApproved.json.data.detail.study.status, 'approved')
  assert.equal(mountedApproved.json.data.detail.dnaVersions[0]?.status, 'approved')
  assert.equal(mountedApproved.json.data.detail.reference.id, mountedReferenceId)

  const mountedEvidenceReplay = await requestJson(
    `${baseUrl}/v1/edit-reference-studies/${mountedStudyId}/evidence-study`,
    {
      method: 'POST',
      token: 'local-domain-token-a',
      idempotencyKey: `mounted-evidence-study-${runId}`,
      body: { workspaceId, expectedStudyRevision: 2 },
    },
  )
  assert.equal(mountedEvidenceReplay.status, 201)
  assert.equal(mountedEvidenceReplay.idempotencyReplayed, true)
  assert.equal(mountedEvidenceReplay.json.data.detail.study.revision, 6)
  assert.deepEqual(
    mountedEvidenceReplay.json.data.detail.dnaVersions,
    mountedApproved.json.data.detail.dnaVersions,
  )

  const mountedCorrection = await requestJson(
    `${baseUrl}/v1/edit-reference-studies/${mountedStudyId}/messages`,
    {
      method: 'POST',
      token: 'local-domain-token-a',
      idempotencyKey: `mounted-correction-${runId}`,
      body: {
        workspaceId,
        expectedStudyRevision: 6,
        clientMessageId: `mounted-correction-message-${runId}`,
        content: 'Revise this preference so captions stay quiet and secondary to testimony.',
      },
    },
  )
  assert.equal(mountedCorrection.status, 201)
  assert.equal(mountedCorrection.json.data.detail.study.revision, 7)
  assert.equal(mountedCorrection.json.data.detail.dnaVersions[0]?.status, 'superseded')

  const crossWorkspace = await requestJson(
    `${baseUrl}/v1/edit-references?workspaceId=${workspaceId}`,
    { token: 'local-domain-token-b' },
  )
  assert.equal(crossWorkspace.status, 403)
  assert.equal(crossWorkspace.json.error?.code, 'WORKSPACE_ACCESS_DENIED')

  const crossWorkspaceMutation = await requestJson(
    `${baseUrl}/v1/edit-reference-studies/${mountedStudyId}/evidence-study`,
    {
      method: 'POST',
      token: 'local-domain-token-b',
      idempotencyKey: `mounted-cross-workspace-${runId}`,
      body: { workspaceId, expectedStudyRevision: 7 },
    },
  )
  assert.equal(crossWorkspaceMutation.status, 403)
  assert.equal(crossWorkspaceMutation.json.error?.code, 'WORKSPACE_ACCESS_DENIED')
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
  commandRpc: 'mutate_edit_reference_domain_command_v2',
  readRpc: 'read_edit_reference_domain_aggregate_v2',
  idempotencyLookupRpc: 'read_edit_reference_domain_idempotency_v1',
  explicitCommandsVerified: 10,
  libraryToApprovalLifecycleVerified: true,
  exactReplayStable: true,
  idempotencyConflictRejected: true,
  staleBrowserAggregateAccepted: false,
  rawMutationClosureCalls,
  crossWorkspaceReadDenied: true,
  restartReadbackVerifiedLocally: true,
  mountedHttpLibraryCreateAndReadVerified: true,
  mountedHttpLibraryToApprovalLifecycleVerified: true,
  mountedHttpCommittedResponseReplayVerified: true,
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
      readonly reference: {
        readonly id: string
        readonly runtimeSource: string
      }
      readonly study: {
        readonly id: string
        readonly revision: number
        readonly status: string
      }
      readonly dnaVersions: Array<{
        readonly id: string
        readonly contentDigest: string
        readonly status: string
      }>
      readonly dnaQaResults: Array<{
        readonly id: string
        readonly status: string
      }>
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
}): Promise<{
  readonly status: number
  readonly idempotencyReplayed: boolean
  readonly json: EditReferenceApiEnvelope
}> {
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
    idempotencyReplayed: response.headers.get('idempotency-replayed') === 'true',
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
