import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  resolveCanonicalProviderLifecyclePolicy,
} from '../edit-architecture/canonical-provider-lifecycle-policy'
import {
  CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
} from '../edit-architecture/canonical-provider-work-authority'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { asyncRoute, getServiceContext, sendOk } from '../routes/route-helpers'
import {
  canonicalProviderAttemptRuntimeLocatorSchema,
  createCanonicalProviderAttemptRuntimeLocator,
  createControlledCanonicalProviderAttemptRuntimeRecordPort,
  type CanonicalProviderAttemptNonExecutionEvidence,
} from '../services/canonical-provider-attempt-runtime-record-port'
import {
  CANONICAL_PROVIDER_ATTEMPT_RUNTIME_CONSUMER_VERSION,
  readCanonicalProviderAttemptForAuthorizedServerConsumer,
} from '../services/canonical-provider-attempt-runtime-consumer-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const at = (offsetMs: number): string => new Date(
  Date.parse('2026-07-22T18:00:00.000Z') + offsetMs,
).toISOString()
const digest = (value: unknown): string => sha256AuthorityValue(value)
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  WORKER_RUNTIME_MODE: 'mock',
  PROVIDER_EXECUTION_ENABLED: 'false',
})
const locator = createCanonicalProviderAttemptRuntimeLocator({
  ownerUserId: 'mock-user-runtime',
  workspaceId: 'workspace-provider-consumer',
  projectId: 'project-provider-consumer',
  editSessionId: 'edit-provider-consumer',
  approvedPlanSnapshotId: 'snapshot-provider-consumer',
  approvedPlanSnapshotHash: digest('snapshot-provider-consumer'),
  packageRecordId: 'package-provider-consumer',
  packageHash: digest('package-provider-consumer'),
  workGraphHash: digest('work-graph-provider-consumer'),
  approvedWorkItemId: 'work-item-provider-consumer',
  approvedWorkItemHash: digest('work-item-provider-consumer'),
  queueDefinitionHash: digest('queue-definition-provider-consumer'),
  queueJobId: 'queue-job-provider-consumer',
  queueJobDefinitionHash: digest('queue-job-definition-provider-consumer'),
  authorizationHash: digest('authorization-provider-consumer'),
  dispatchAttemptId: 'dispatch-attempt-provider-consumer',
  operationId: CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
  sourceRequestId: 'source-request-provider-consumer',
  expectedOutputSetDigest: digest('output-set-provider-consumer'),
})
const lifecycleEvidence = createNeverSubmittedEvidence(locator.locatorDigest)
let exactReadCount = 0
let releaseIdentityReadCount = 0
const sourcePort = createControlledCanonicalProviderAttemptRuntimeRecordPort({
  async readExactAttempt(exactLocator) {
    exactReadCount += 1
    assert.deepEqual(exactLocator, locator)
    return {
      state: 'never_submitted',
      lifecycleEvidence,
    }
  },
  async readCurrentReleaseIdentity() {
    releaseIdentityReadCount += 1
    throw new Error('A never-submitted attempt must not read release identity.')
  },
})

const app = createReeditProApiApp(env, {
  canonicalProviderAttemptRuntimeRecordSourcePort: sourcePort,
})
app.get(
  '/__canonical-provider-attempt-runtime-consumer-smoke',
  requireAuth,
  asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const record = await readCanonicalProviderAttemptForAuthorizedServerConsumer({
      context,
      consumerClass: 'edit_reference_supported_downstream_provider_work',
      authorizedScope: {
        workspaceId: locator.workspaceId,
        projectId: locator.projectId,
        editSessionId: locator.editSessionId,
      },
      locator,
      projectedAt: at(5_000),
    })
    sendOk(response, {
      record,
      separateAuthorities: {
        mediaProviderAttemptRuntimePresent:
          Boolean(context.canonicalProviderAttemptRuntimeRecordSourcePort),
        studyChatReasoningRuntimePresent:
          Boolean(context.editReferenceStudyChatRuntimePort),
        longFormReasoningRuntimePresent:
          Boolean(
            context.editReferenceLongFormStudyRuntimePort
              ?? context.editReferenceLongFormStudyRuntimePortFactory,
          ),
      },
    })
  }),
)

const server = await listen(createServer(app))
const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
try {
  const response = await fetch(
    `${origin}/__canonical-provider-attempt-runtime-consumer-smoke?operationId=provider.kimi.reasoning.v1`,
  )
  const body = await response.json() as {
    data?: {
      record?: {
        recordKind?: string
        attemptOutcome?: string
        consumerProjection?: {
          rawCredentialIncluded?: boolean
          providerUrlIncluded?: boolean
          customerCommercialAuthorityIncluded?: boolean
        }
      }
      separateAuthorities?: Record<string, boolean>
    }
  }
  assert.equal(response.status, 200)
  assert.equal(body.data?.record?.recordKind, 'provider_non_execution')
  assert.equal(body.data?.record?.attemptOutcome, 'never_submitted')
  assert.deepEqual(body.data?.record?.consumerProjection && {
    rawCredentialIncluded:
      body.data.record.consumerProjection.rawCredentialIncluded,
    providerUrlIncluded:
      body.data.record.consumerProjection.providerUrlIncluded,
    customerCommercialAuthorityIncluded:
      body.data.record.consumerProjection.customerCommercialAuthorityIncluded,
  }, {
    rawCredentialIncluded: false,
    providerUrlIncluded: false,
    customerCommercialAuthorityIncluded: false,
  })
  assert.deepEqual(body.data?.separateAuthorities, {
    mediaProviderAttemptRuntimePresent: true,
    studyChatReasoningRuntimePresent: false,
    longFormReasoningRuntimePresent: false,
  })
  assert.equal(exactReadCount, 1)
  assert.equal(releaseIdentityReadCount, 0)

  const motionRead = await readCanonicalProviderAttemptForAuthorizedServerConsumer({
    context: {
      env,
      auth: { userId: locator.ownerUserId, isMockUser: true },
      canonicalProviderAttemptRuntimeRecordSourcePort: sourcePort,
    },
    consumerClass: 'motion_studio_audio_provider_work',
    authorizedScope: {
      workspaceId: locator.workspaceId,
      projectId: locator.projectId,
      editSessionId: locator.editSessionId,
    },
    locator,
    projectedAt: at(5_000),
  })
  assert.equal(motionRead.recordKind, 'provider_non_execution')
  assert.equal(exactReadCount, 2)

  await assert.rejects(
    readCanonicalProviderAttemptForAuthorizedServerConsumer({
      context: {
        env,
        auth: { userId: 'different-user', isMockUser: true },
        canonicalProviderAttemptRuntimeRecordSourcePort: sourcePort,
      },
      consumerClass: 'motion_studio_audio_provider_work',
      authorizedScope: {
        workspaceId: locator.workspaceId,
        projectId: locator.projectId,
        editSessionId: locator.editSessionId,
      },
      locator,
      projectedAt: at(5_000),
    }),
    isApiError('WORKSPACE_ACCESS_DENIED', 'provider_attempt_consumer_actor_mismatch'),
  )
  assert.equal(exactReadCount, 2)

  await assert.rejects(
    readCanonicalProviderAttemptForAuthorizedServerConsumer({
      context: {
        env,
        auth: { userId: locator.ownerUserId, isMockUser: true },
        canonicalProviderAttemptRuntimeRecordSourcePort: sourcePort,
      },
      consumerClass: 'motion_studio_audio_provider_work',
      authorizedScope: {
        workspaceId: 'different-workspace',
        projectId: locator.projectId,
        editSessionId: locator.editSessionId,
      },
      locator,
      projectedAt: at(5_000),
    }),
    isApiError('WORKSPACE_ACCESS_DENIED', 'provider_attempt_consumer_scope_mismatch'),
  )
  assert.equal(exactReadCount, 2)

  await assert.rejects(
    readCanonicalProviderAttemptForAuthorizedServerConsumer({
      context: {
        env,
        auth: { userId: locator.ownerUserId, isMockUser: true },
        canonicalProviderAttemptRuntimeRecordSourcePort: sourcePort,
      },
      consumerClass: 'motion_studio_visual_calibration_provider_work',
      authorizedScope: {
        workspaceId: locator.workspaceId,
        projectId: locator.projectId,
        editSessionId: locator.editSessionId,
      },
      locator,
      projectedAt: at(5_000),
    }),
    isApiError(
      'TOOL_NOT_READY',
      'canonical_provider_attempt_consumer_operation_not_admitted',
    ),
  )
  assert.equal(exactReadCount, 2)

  await assert.rejects(
    readCanonicalProviderAttemptForAuthorizedServerConsumer({
      context: {
        env,
        auth: { userId: locator.ownerUserId, isMockUser: true },
      },
      consumerClass: 'motion_studio_audio_provider_work',
      authorizedScope: {
        workspaceId: locator.workspaceId,
        projectId: locator.projectId,
        editSessionId: locator.editSessionId,
      },
      locator,
      projectedAt: at(5_000),
    }),
    isApiGateError(
      'TOOL_NOT_READY',
      'canonical_provider_attempt_runtime_record_port_missing',
    ),
  )
  assert.equal(exactReadCount, 2)

  const hostedEnv = {
    ...env,
    nodeEnv: 'production',
    mode: 'cloud_run' as const,
  }
  await assert.rejects(
    readCanonicalProviderAttemptForAuthorizedServerConsumer({
      context: {
        env: hostedEnv,
        auth: { userId: locator.ownerUserId, isMockUser: false },
        canonicalProviderAttemptRuntimeRecordSourcePort: sourcePort,
      },
      consumerClass: 'motion_studio_audio_provider_work',
      authorizedScope: {
        workspaceId: locator.workspaceId,
        projectId: locator.projectId,
        editSessionId: locator.editSessionId,
      },
      locator,
      projectedAt: at(5_000),
    }),
    isApiGateError(
      'TOOL_NOT_READY',
      'canonical_provider_attempt_runtime_record_port_unqualified',
    ),
  )
  assert.equal(exactReadCount, 2)

  for (const unsupportedOperationId of [
    'provider.kimi.generate_reasoning_attempt.v1',
    'provider.qwen.generate_reasoning_attempt.v1',
    'provider.deepseek.generate_reasoning_attempt.v1',
    'provider.qwen25vl.analyze_private_video.v1',
  ]) {
    const unsignedLocator = { ...locator } as Record<string, unknown>
    delete unsignedLocator.locatorDigest
    const forged = {
      ...unsignedLocator,
      operationId: unsupportedOperationId,
    }
    assert.equal(canonicalProviderAttemptRuntimeLocatorSchema.safeParse({
      ...forged,
      locatorDigest: digest(forged),
    }).success, false)

    await assert.rejects(
      readCanonicalProviderAttemptForAuthorizedServerConsumer({
        context: {
          env,
          auth: { userId: locator.ownerUserId, isMockUser: true },
          canonicalProviderAttemptRuntimeRecordSourcePort: sourcePort,
        },
        consumerClass: 'edit_reference_supported_downstream_provider_work',
        authorizedScope: {
          workspaceId: locator.workspaceId,
          projectId: locator.projectId,
          editSessionId: locator.editSessionId,
        },
        locator: forged as unknown as typeof locator,
        projectedAt: at(5_000),
      }),
      isApiError(
        'TOOL_NOT_READY',
        'canonical_provider_attempt_consumer_operation_not_admitted',
      ),
    )
  }
  assert.equal(exactReadCount, 2)

  const serialized = JSON.stringify(body)
  for (const forbidden of [
    'Bearer ',
    'sk-',
    'https://',
    'http://',
    '/tmp/',
    '/Users/',
    '/Volumes/',
    'raw-provider-payload',
    'secret-value',
  ]) assert.equal(serialized.toLowerCase().includes(forbidden.toLowerCase()), false)

  console.log(JSON.stringify({
    ok: true,
    consumerVersion: CANONICAL_PROVIDER_ATTEMPT_RUNTIME_CONSUMER_VERSION,
    appRuntimePropagationVerified: true,
    serviceContextPropagationVerified: true,
    editReferenceSupportedDownstreamReadVerified: true,
    motionStudioAudioReadVerified: true,
    studyChatReasoningAuthoritySubstituted: false,
    longFormReasoningAuthoritySubstituted: false,
    unsupportedReasoningAndVisualSpecialistOperationCount: 4,
    wrongTenantRejectedBeforeSourceRead: true,
    consumerOperationMismatchRejectedBeforeSourceRead: true,
    controlledPortRejectedInHostedRuntime: true,
    browserSelectedOperationAccepted: false,
    providerRequestCount: 0,
    secretPayloadReadCount: 0,
    remoteMutationCount: 0,
    productionReady: false,
  }, null, 2))
} finally {
  await close(server)
}

function createNeverSubmittedEvidence(
  locatorDigest: string,
): CanonicalProviderAttemptNonExecutionEvidence {
  const policy = resolveCanonicalProviderLifecyclePolicy(
    CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
  )
  const payload = {
    schemaVersion: 'canonical-provider-attempt-non-execution-evidence-v1' as const,
    sourceAuthority: 'canonical_provider_attempt_lifecycle_repository' as const,
    attemptState: 'never_submitted' as const,
    locatorDigest,
    queueDefinitionHash: digest('queue-definition-provider-consumer'),
    queueEntryHash: null,
    queueState: null,
    queueAttemptId: null,
    leaseId: null,
    leaseHash: null,
    dispatchGrantId: null,
    dispatchGrantHash: null,
    dispatchAttemptId: null,
    providerRouteId: policy.providerRouteId,
    providerModelId: policy.providerModelId,
    providerRequestStarted: false,
    providerRequestCount: 0 as const,
    providerAttemptCostEvidenceHash: null,
    workerResourceEvidenceHash: null,
    failedOrUnknownAttemptCostRetained: true as const,
    cancellationReceiptDigest: null,
    canonicalCheckbackPermitDigest: null,
    fallbackAllowed: false as const,
    rerunAllowed: false as const,
    recordedAt: at(1_000),
  }
  return {
    ...payload,
    evidenceDigest: digest(payload),
  }
}

function isApiError(code: string, reason: string) {
  return (error: unknown): boolean => error instanceof ApiError
    && error.code === code
    && (error.details as { reason?: string } | undefined)?.reason === reason
}

function isApiGateError(code: string, requiredGate: string) {
  return (error: unknown): boolean => error instanceof ApiError
    && error.code === code
    && (error.details as { requiredGate?: string } | undefined)?.requiredGate
      === requiredGate
}

async function listen(server: Server): Promise<Server> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  return server
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}
