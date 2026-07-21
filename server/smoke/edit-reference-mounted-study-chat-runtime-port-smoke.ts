import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createBlockedEditReferenceStudyChatReasoningResult } from '../edit-references/edit-reference-study-chat-reasoning-contract'
import {
  EDIT_REFERENCE_REASONING_ROUTE_IDS,
  REEDITPRO_SHARED_REASONING_ROUTE_CONTRACT_VERSION,
} from '../edit-references/edit-reference-reasoning-route-authorization'
import type { EditReferenceStudyChatReasoningAttemptRecord } from '../edit-references/edit-reference-study-chat-reasoning-attempt-contract'
import {
  EDIT_REFERENCE_STUDY_CHAT_RUNTIME_PORT_VERSION,
  appendMountedEditReferenceStudyChatMessage,
  type EditReferenceStudyChatRuntimePort,
  type EditReferenceStudyChatRuntimePortInput,
} from '../services/edit-reference-study-chat-runtime-port'
import { editReferenceScopeHash } from '../edit-references/private-edit-reference-repository'
import type {
  EditReferenceApiSuccess,
  EditReferenceDetailData,
  EditReferenceMessageData,
} from '../../src/types/edit-reference'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-mounted-study-chat-'))
const workspaceId = 'workspace-mounted-study-chat'
const ownerUserId = 'mock-user-runtime'

try {
  const port = controlledBlockedRuntimePort()
  const runtime = await startRuntime(root, port)
  let referenceId = ''
  let studyId = ''
  try {
    const created = await request<EditReferenceDetailData>(runtime.baseUrl, '/v1/edit-references', {
      method: 'POST',
      key: 'mounted-chat-create',
      body: {
        workspaceId,
        name: 'Evidence-led documentary preference',
        initialGoals: ['story_and_pacing', 'visual_language'],
      },
    })
    referenceId = created.body.data.detail.reference.id
    studyId = created.body.data.detail.study.id
    const messageBody = {
      workspaceId,
      expectedStudyRevision: created.body.data.detail.study.revision,
      clientMessageId: 'mounted-chat-message-1',
      content: 'Keep the pacing restrained and let evidence remain readable before each cut.',
    }
    const message = await request<EditReferenceMessageData>(
      runtime.baseUrl,
      `/v1/edit-reference-studies/${studyId}/messages`,
      { method: 'POST', key: 'mounted-chat-message-request', body: messageBody },
    )
    assert.equal(message.status, 201)
    assert.equal(message.replayed, 'false')
    assert.equal(message.body.data.appendedMessageIds.length, 1)
    assert.equal(message.body.data.detail.evidence.length, 1)
    assert.equal(message.body.data.detail.evidence[0]?.summary, messageBody.content)
    assert.equal(message.body.data.detail.evidence[0]?.sourceType, 'manual_user_evidence')
    assert.equal(message.body.data.detail.studyChatReasoning.length, 1)
    assert.deepEqual(
      pickPublicStatus(message.body.data.detail.studyChatReasoning[0]),
      {
        state: 'failed',
        retryAvailable: true,
        providerCallMayHaveOccurred: false,
      },
    )
    assert.match(message.body.data.detail.studyChatReasoning[0]?.statusText ?? '', /direction is saved/i)
    assert.equal(message.body.data.detail.safety.providerCallMade, false)
    assert.equal(message.body.data.detail.safety.modelCallMade, false)
    assert.equal(message.body.data.detail.messages.filter((record) => record.clientMessageId === messageBody.clientMessageId).length, 1)

    const replay = await request<EditReferenceMessageData>(
      runtime.baseUrl,
      `/v1/edit-reference-studies/${studyId}/messages`,
      { method: 'POST', key: 'mounted-chat-message-request', body: messageBody },
    )
    assert.equal(replay.replayed, 'true')
    assert.deepEqual(replay.body, message.body)

    const conflict = await requestError(
      runtime.baseUrl,
      `/v1/edit-reference-studies/${studyId}/messages`,
      {
        method: 'POST',
        key: 'mounted-chat-message-request',
        body: { ...messageBody, content: 'Changed content must not reuse the same client identity.' },
      },
    )
    assert.equal(conflict.status, 409)
    assert.equal(conflict.body.error.code, 'IDEMPOTENCY_CONFLICT')
  } finally {
    await runtime.close()
  }

  const restarted = await startRuntime(root)
  try {
    const detail = await request<EditReferenceDetailData>(
      restarted.baseUrl,
      `/v1/edit-references/${referenceId}?workspaceId=${workspaceId}`,
    )
    assert.equal(detail.body.data.detail.study.id, studyId)
    assert.equal(detail.body.data.detail.studyChatReasoning.length, 1)
    assert.equal(detail.body.data.detail.studyChatReasoning[0]?.state, 'failed')
    assert.equal(detail.body.data.detail.evidence.length, 1)
  } finally {
    await restarted.close()
  }

  const aggregatePath = join(
    root,
    'edit-reference-private',
    'scopes',
    editReferenceScopeHash(ownerUserId, workspaceId),
    'aggregate.json',
  )
  const aggregateText = await readFile(aggregatePath, 'utf8')
  assert.doesNotMatch(aggregateText, /rawProviderPayload|signedUrl|apiKey|serviceRoleKey|accessToken/i)
  assert.match(aggregateText, /model_routing_unavailable/)

  const hostedEnv = {
    ...loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      LOCAL_STORAGE_ROOT: root,
    }),
    nodeEnv: 'production',
    mode: 'cloud_run' as const,
  }
  let authorityCalled = false
  const unavailableAuthority = new Proxy({}, {
    get() {
      authorityCalled = true
      throw new Error('hosted selector must fail before authority access')
    },
  }) as EditReferenceStudyChatRuntimePortInput['authority']
  await assert.rejects(
    appendMountedEditReferenceStudyChatMessage({
      env: hostedEnv,
      authority: unavailableAuthority,
      studyId: 'study-hosted-block',
      request: {
        workspaceId,
        expectedStudyRevision: 1,
        clientMessageId: 'hosted-block-message',
        content: 'This message must not mutate without the canonical hosted runtime.',
      },
      idempotencyKey: 'hosted-block-request',
    }),
    (error: unknown) => error instanceof Error && /not mounted/i.test(error.message),
  )
  assert.equal(authorityCalled, false)
  await assert.rejects(
    appendMountedEditReferenceStudyChatMessage({
      env: hostedEnv,
      port,
      authority: unavailableAuthority,
      studyId: 'study-hosted-controlled-block',
      request: {
        workspaceId,
        expectedStudyRevision: 1,
        clientMessageId: 'hosted-controlled-block-message',
        content: 'A controlled fixture must never self-promote in hosted mode.',
      },
      idempotencyKey: 'hosted-controlled-block-request',
    }),
    (error: unknown) => error instanceof Error && /source-verified canonical backend runtime/i.test(error.message),
  )
  assert.equal(authorityCalled, false)

  console.log(JSON.stringify({
    status: 'passed',
    mountedRoute: '/v1/edit-reference-studies/:studyId/messages',
    savedDirectionSurvivedBlockedReasoning: true,
    idempotentReplay: true,
    restartSafe: true,
    hostedAbsentPortFailsBeforeMutation: true,
    controlledPortCannotSelfPromote: true,
    providerCallMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    productionReady: false,
  }))
} finally {
  await rm(root, { recursive: true, force: true })
}

function controlledBlockedRuntimePort(): EditReferenceStudyChatRuntimePort {
  return {
    schemaVersion: EDIT_REFERENCE_STUDY_CHAT_RUNTIME_PORT_VERSION,
    authorityClass: 'canonical_edit_reference_study_chat_reasoning',
    runtimeClass: 'controlled_private_fixture',
    sourceAuthority: 'canonical_edit_reference_repository',
    publicRouteAvailable: true,
    canonicalAttemptAuthority: true,
    canonicalProviderLifecycleAuthority: true,
    canonicalInternalCostAuthority: true,
    reasoningRouteContractVersion: REEDITPRO_SHARED_REASONING_ROUTE_CONTRACT_VERSION,
    reasoningRouteOrder: EDIT_REFERENCE_REASONING_ROUTE_IDS,
    qwenVisualSpecialistSubstituted: false,
    providerCallOutsideRepositoryTransaction: true,
    savedUserDirectionSurvivesProviderFailure: true,
    noSecondMessageOrEvidenceStore: true,
    noBrowserProviderAuthority: true,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    productionAuthority: false,
    async appendMessage(input) {
      const messageDigest = sha256(input.request.clientMessageId)
      const existing = (await input.authority.listStudyChatReasoningAttempts(
        input.request.workspaceId,
        input.studyId,
      )).data.find((attempt) => attempt.clientMessageDigestSha256 === messageDigest)
      if (existing) {
        if (existing.userMessageContentDigestSha256 !== sha256(input.request.content)) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'The Study Chat client message was already reserved with different content.',
            409,
          )
        }
        return currentMessageResult(input, existing, true)
      }

      const study = (await input.authority.getStudy(input.request.workspaceId, input.studyId)).data
      const prepared = await input.authority.prepareStudyChatReasoning(input.request.workspaceId, {
        editReferenceId: study.reference.id,
        studySessionId: study.study.id,
        expectedStudyRevision: input.request.expectedStudyRevision,
        clientMessageId: input.request.clientMessageId,
        userMessage: input.request.content,
        executionScope: 'controlled_test',
        approvedUsageEstimateId: null,
        internalCostBudgetId: null,
        immutableRateCardSnapshotId: null,
        maximumAuthorizedInternalCostMicros: null,
      })
      const reserved = await input.authority.reserveStudyChatReasoningAttempt({
        request: prepared.request,
        clientMessageId: input.request.clientMessageId,
        userMessage: input.request.content,
        ...(input.request.findingCorrectionEvidenceId
          ? { findingCorrectionEvidenceId: input.request.findingCorrectionEvidenceId }
          : {}),
      }, phaseKey(input.idempotencyKey, 'reserve'))
      const started = await input.authority.startStudyChatReasoningAttempt(reserved.data.attempt.id, {
        workspaceId: input.request.workspaceId,
        expectedAttemptRevision: reserved.data.attempt.revision,
        executionCommandId: phaseKey(input.idempotencyKey, 'execution-command'),
      }, phaseKey(input.idempotencyKey, 'start'))
      if (started.data.providerCallAuthorized) {
        const blocked = createBlockedEditReferenceStudyChatReasoningResult({
          request: prepared.request,
          blockerCode: 'model_routing_unavailable',
          blockerMessage: 'The reasoning route is unavailable, but your direction was saved safely.',
          retryAvailable: true,
          retryReason: 'Retry after the canonical Kimi-primary reasoning route is restored.',
        })
        await input.authority.settleStudyChatReasoningAttempt(started.data.attempt.id, {
          workspaceId: input.request.workspaceId,
          expectedAttemptRevision: started.data.attempt.revision,
          result: blocked,
        }, phaseKey(input.idempotencyKey, 'settle'))
      }
      const terminal = (await input.authority.getStudyChatReasoningAttempt(
        input.request.workspaceId,
        started.data.attempt.id,
      )).data
      return currentMessageResult(input, terminal, false)
    },
  }
}

async function currentMessageResult(
  input: EditReferenceStudyChatRuntimePortInput,
  attempt: EditReferenceStudyChatReasoningAttemptRecord,
  replayed: boolean,
) {
  const current = await input.authority.getReference(input.request.workspaceId, attempt.editReferenceId)
  return {
    data: {
      ...current.data,
      appendedMessageIds: [attempt.userMessageId, ...(attempt.assistantMessageId ? [attempt.assistantMessageId] : [])],
    },
    warnings: current.warnings,
    replayed,
  }
}

function pickPublicStatus(value: EditReferenceMessageData['detail']['studyChatReasoning'][number] | undefined) {
  assert(value)
  return {
    state: value.state,
    retryAvailable: value.retryAvailable,
    providerCallMayHaveOccurred: value.providerCallMayHaveOccurred,
  }
}

function phaseKey(base: string, phase: string): string {
  return `study-chat-${phase}-${sha256(`${base}:${phase}`)}`
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

async function startRuntime(rootPath: string, port?: EditReferenceStudyChatRuntimePort) {
  const env = loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: rootPath,
    PROVIDER_EXECUTION_ENABLED: 'false',
    WORKER_RUNTIME_MODE: 'mock',
  })
  const server = createReeditProApiApp(env, {
    ...(port ? { editReferenceStudyChatRuntimePort: port } : {}),
  }).listen(0, '127.0.0.1')
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  const portNumber = (server.address() as AddressInfo).port
  return {
    baseUrl: `http://127.0.0.1:${portNumber}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  }
}

async function request<T>(baseUrl: string, path: string, options?: {
  method: 'POST'
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

async function requestError(baseUrl: string, path: string, options: {
  method: 'POST'
  key: string
  body: unknown
}): Promise<{ status: number; body: { error: { code: string; message?: string } } }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers: { 'content-type': 'application/json', 'idempotency-key': options.key },
    body: JSON.stringify(options.body),
  })
  const body = await response.json() as { error: { code: string; message?: string } }
  assert.equal(typeof body.error?.code, 'string', JSON.stringify(body))
  return { status: response.status, body }
}
