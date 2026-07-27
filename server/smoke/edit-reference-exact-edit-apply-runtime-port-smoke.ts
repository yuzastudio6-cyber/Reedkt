import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createEditReferenceProductionOutputFrameAuthority } from '../edit-references/edit-reference-production-output-frame-authority'
import type {
  EditReferenceProductionExactEditApplyRequest,
} from '../edit-references/edit-reference-production-exact-edit-apply-boundary'
import {
  EDIT_REFERENCE_EXACT_EDIT_APPLY_RUNTIME_PORT_VERSION,
  assertEditReferenceExactEditApplyRuntimePortIsNotProduction,
  createEditReferencePrivateWorkspaceExactEditApplyRuntimePort,
  resolveEditReferenceExactEditApplyRuntimePort,
  type EditReferenceExactEditApplyRuntimePort,
} from '../services/edit-reference-exact-edit-apply-runtime-port'
import {
  applyExactEditPreferencesAndReference,
  createExactEditPreferenceApplyIdempotencyKey,
  createExactEditPreferenceApplyOperation,
  readExactEditPreferenceApplyAuthority,
} from '../../src/lib/exact-edit-preference-apply-client'
import {
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION,
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RECEIPT_VERSION,
  EDIT_REFERENCE_PRODUCTION_PREPARED_APPLICATION_AUTHORITY_VERSION,
  type EditReferenceProductionExactEditApplyApiReceipt,
  type EditReferenceProductionExactEditApplyAuthorityRead,
  type EditReferenceProductionExactEditPreferenceValues,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import type { ProjectPersistenceScope } from '../../src/lib/project-persistence-scope'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-exact-edit-apply-runtime-'))
const actorUserId = 'mock-user-runtime'
const workspaceId = 'workspace-exact-edit-apply'
const projectId = 'project-exact-edit-apply'
const editSessionId = 'edit-exact-edit-apply'
const applicationId = 'application-exact-edit-apply'
const readAt = '2026-07-21T14:00:00.000Z'
const scope: ProjectPersistenceScope = {
  authMode: 'local_test',
  userId: actorUserId,
  workspaceId,
}

try {
  const authority = createAuthority()
  const port = createControlledPort(authority)
  assert.doesNotThrow(() => assertEditReferenceExactEditApplyRuntimePortIsNotProduction(port))
  const runtime = await startRuntime(root, port)
  const priorRuntimeEnv = snapshotFrontendRuntimeEnv()
  process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
  process.env.VITE_REEDITPRO_API_BASE_URL = runtime.baseUrl
  process.env.VITE_REEDITPRO_API_TRANSPORT = 'direct'
  delete process.env.VITE_REEDITPRO_E2E
  delete process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN

  try {
    const read = await readExactEditPreferenceApplyAuthority({
      scope,
      projectId,
      editSessionId,
      selectedApplicationId: applicationId,
    })
    assert.equal(read.ok, true, JSON.stringify(read))
    if (!read.ok) throw new Error('exact_edit_apply_authority_read_failed')
    assert.equal(read.authority.browserMutationAuthorityGranted, false)
    assert.equal(read.authority.selectedApplicationAuthority?.applicationId, applicationId)

    const values: EditReferenceProductionExactEditPreferenceValues = {
      ...read.authority.values,
      visualPreference: 'more_graphic_design',
    }
    const operation = createExactEditPreferenceApplyOperation({
      authority: read.authority,
      values,
      referenceMutation: 'apply',
    })
    const idempotencyKey = createExactEditPreferenceApplyIdempotencyKey()
    const committed = await applyExactEditPreferencesAndReference({
      scope,
      projectId,
      editSessionId,
      operation,
      idempotencyKey,
    })
    assert.equal(committed.ok, true, JSON.stringify(committed))
    if (!committed.ok) throw new Error('exact_edit_apply_failed')
    assert.deepEqual(committed.receipt.changedPreferenceFields, ['visualPreference'])
    assert.equal(committed.receipt.referenceMutation, 'apply')
    assert.equal(committed.receipt.committedPlanningInputRevision, 1)
    assert.equal(committed.customerPriceCalculated, false)
    assert.equal(committed.customerCreditsMutated, false)
    assert.equal(committed.providerOrWorkerExecutionStarted, false)

    // Simulate a committed database response being lost: the browser retries
    // the unchanged operation and key, and receives the same transaction.
    const replay = await applyExactEditPreferencesAndReference({
      scope,
      projectId,
      editSessionId,
      operation,
      idempotencyKey,
    })
    assert.equal(replay.ok, true, JSON.stringify(replay))
    if (!replay.ok) throw new Error('exact_edit_apply_replay_failed')
    assert.deepEqual(replay.receipt, committed.receipt)
    assert.equal(replay.operationDigestSha256, committed.operationDigestSha256)
    assert.equal(portState(port).committedTransactionCount, 1)
    assert.equal(portState(port).applyInvocationCount, 2)

    const changedOperation = createExactEditPreferenceApplyOperation({
      authority: read.authority,
      values: { ...values, moodStyle: 'cinematic' },
      referenceMutation: 'apply',
    })
    const conflict = await applyExactEditPreferencesAndReference({
      scope,
      projectId,
      editSessionId,
      operation: changedOperation,
      idempotencyKey,
    })
    assert.equal(conflict.ok, false)
    if (conflict.ok) throw new Error('changed_exact_edit_apply_replay_was_accepted')
    assert.equal(conflict.status, 'stale')
    assert.equal(conflict.errorCode, 'IDEMPOTENCY_CONFLICT')
    assert.equal(portState(port).committedTransactionCount, 1)

    const wrongPath = await fetch(
      `${runtime.baseUrl}/v1/projects/${projectId}/edit-sessions/wrong-edit/edit-preferences/apply`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': 'wrong-route-exact-edit-apply',
        },
        body: JSON.stringify(operation),
      },
    )
    const wrongPathBody = await wrongPath.json() as { error?: { code?: string } }
    assert.equal(wrongPath.status, 403)
    assert.equal(wrongPathBody.error?.code, 'EDIT_REFERENCE_PERSISTENCE_BLOCKED')
    assert.equal(portState(port).committedTransactionCount, 1)
  } finally {
    restoreFrontendRuntimeEnv(priorRuntimeEnv)
    await runtime.close()
  }

  const privateStorageRoot = join(root, 'private-workspace')
  const privatePort =
    createEditReferencePrivateWorkspaceExactEditApplyRuntimePort({
      localStorageRoot: privateStorageRoot,
    })
  assert.doesNotThrow(() => (
    assertEditReferenceExactEditApplyRuntimePortIsNotProduction(privatePort)
  ))
  const privateRuntime = await startRuntime(privateStorageRoot, privatePort)
  const priorPrivateRuntimeEnv = snapshotFrontendRuntimeEnv()
  process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
  process.env.VITE_REEDITPRO_API_BASE_URL = privateRuntime.baseUrl
  process.env.VITE_REEDITPRO_API_TRANSPORT = 'direct'
  delete process.env.VITE_REEDITPRO_E2E
  delete process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN

  let privateOperation: ReturnType<typeof createExactEditPreferenceApplyOperation>
  let privateIdempotencyKey = ''
  let privateReceipt: EditReferenceProductionExactEditApplyApiReceipt
  try {
    const privateRead = await readExactEditPreferenceApplyAuthority({
      scope,
      projectId,
      editSessionId,
      selectedApplicationId: null,
    })
    assert.equal(privateRead.ok, true, JSON.stringify(privateRead))
    if (!privateRead.ok) throw new Error('private_exact_edit_authority_read_failed')
    assert.equal(
      privateRead.authority.sourceAuthority,
      'private_exact_edit_preference_store',
    )
    assert.equal(privateRead.authority.runtimeSource, 'verified_local')
    assert.equal(privateRead.authority.selectedApplicationAuthority, null)
    privateOperation = createExactEditPreferenceApplyOperation({
      authority: privateRead.authority,
      values: {
        ...privateRead.authority.values,
        visualPreference: 'more_graphic_design',
      },
      referenceMutation: null,
    })
    privateIdempotencyKey = createExactEditPreferenceApplyIdempotencyKey()
    const privateCommit = await applyExactEditPreferencesAndReference({
      scope,
      projectId,
      editSessionId,
      operation: privateOperation,
      idempotencyKey: privateIdempotencyKey,
    })
    assert.equal(privateCommit.ok, true, JSON.stringify(privateCommit))
    if (!privateCommit.ok) throw new Error('private_exact_edit_apply_failed')
    assert.equal(
      privateCommit.receipt.sourceAuthority,
      'private_exact_edit_apply_transaction',
    )
    assert.deepEqual(
      privateCommit.receipt.changedPreferenceFields,
      ['visualPreference'],
    )
    privateReceipt = privateCommit.receipt

    const selectedApplicationRead =
      await readExactEditPreferenceApplyAuthority({
        scope,
        projectId,
        editSessionId,
        selectedApplicationId: applicationId,
      })
    assert.equal(selectedApplicationRead.ok, false)
    if (selectedApplicationRead.ok) {
      throw new Error('private_reference_application_authority_was_accepted')
    }
    assert.equal(selectedApplicationRead.status, 'unavailable')

    await assert.rejects(
      () => privatePort.readAuthority({
        actor: {
          actorUserId: 'other-private-user',
          authenticatedAccessToken: null,
          mockActor: true,
        },
        scope: {
          actorUserId,
          workspaceId,
          projectId,
          editSessionId,
          selectedApplicationId: null,
        },
      }),
      (error: unknown) => error instanceof ApiError
        && error.code === 'WORKSPACE_ACCESS_DENIED',
    )
  } finally {
    restoreFrontendRuntimeEnv(priorPrivateRuntimeEnv)
    await privateRuntime.close()
  }

  const restartedPrivatePort =
    createEditReferencePrivateWorkspaceExactEditApplyRuntimePort({
      localStorageRoot: privateStorageRoot,
    })
  const restartedPrivateRuntime = await startRuntime(
    privateStorageRoot,
    restartedPrivatePort,
  )
  const priorRestartedRuntimeEnv = snapshotFrontendRuntimeEnv()
  process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
  process.env.VITE_REEDITPRO_API_BASE_URL = restartedPrivateRuntime.baseUrl
  process.env.VITE_REEDITPRO_API_TRANSPORT = 'direct'
  delete process.env.VITE_REEDITPRO_E2E
  delete process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN
  try {
    const recovered = await readExactEditPreferenceApplyAuthority({
      scope,
      projectId,
      editSessionId,
      selectedApplicationId: null,
    })
    assert.equal(recovered.ok, true, JSON.stringify(recovered))
    if (!recovered.ok) throw new Error('private_exact_edit_restart_read_failed')
    assert.equal(recovered.authority.values.visualPreference, 'more_graphic_design')
    assert.equal(recovered.authority.preferenceRevision, 1)

    const replay = await applyExactEditPreferencesAndReference({
      scope,
      projectId,
      editSessionId,
      operation: privateOperation!,
      idempotencyKey: privateIdempotencyKey,
    })
    assert.equal(replay.ok, true, JSON.stringify(replay))
    if (!replay.ok) throw new Error('private_exact_edit_restart_replay_failed')
    assert.deepEqual(replay.receipt, privateReceipt!)

    const changedReplay = await applyExactEditPreferencesAndReference({
      scope,
      projectId,
      editSessionId,
      operation: createExactEditPreferenceApplyOperation({
        authority: privateOperation!.authority,
        values: {
          ...privateOperation!.authority.values,
          moodStyle: 'cinematic',
        },
        referenceMutation: null,
      }),
      idempotencyKey: privateIdempotencyKey,
    })
    assert.equal(changedReplay.ok, false)
    if (changedReplay.ok) {
      throw new Error('private_exact_edit_changed_restart_replay_was_accepted')
    }
    assert.equal(changedReplay.errorCode, 'IDEMPOTENCY_CONFLICT')
  } finally {
    restoreFrontendRuntimeEnv(priorRestartedRuntimeEnv)
    await restartedPrivateRuntime.close()
  }

  const forgedPrivatePort = {
    ...privatePort,
  } as EditReferenceExactEditApplyRuntimePort
  assert.throws(
    () => resolveEditReferenceExactEditApplyRuntimePort({
      env: loadRuntimeEnv({
        NODE_ENV: 'test',
        E2E_RUNTIME_MODE: 'local',
        API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
        STORAGE_MODE: 'local',
        LOCAL_STORAGE_ROOT: privateStorageRoot,
      }),
      port: forgedPrivatePort,
    }),
    (error: unknown) => error instanceof ApiError
      && (error.details as { reason?: string } | undefined)?.reason
        === 'local_exact_edit_apply_runtime_claimed_production',
  )

  let forgedReadCalled = false
  let forgedApplyCalled = false
  const forgedProductionPort: EditReferenceExactEditApplyRuntimePort = {
    ...port,
    runtimeClass: 'canonical_backend_verified_runtime',
    evidenceClass: 'canonical_same_release_live_runtime',
    sourceAuthority: 'canonical_edit_reference_production_repository',
    canonicalAuthorityReadRpcVerified: true,
    canonicalAtomicApplyRpcVerified: true,
    twoUserTwoWorkspaceRlsVerified: true,
    privateSingleHostAtomicPreferenceApplyVerified: false,
    referenceMutationSupported: true,
    sameReleaseReadinessEvidenceVerified: true,
    productionAuthority: true,
    async readAuthority() {
      forgedReadCalled = true
      return authority
    },
    async apply() {
      forgedApplyCalled = true
      throw new Error('forged_port_must_not_run')
    },
  }
  const hostedEnv = {
    ...loadRuntimeEnv({
      NODE_ENV: 'production',
      E2E_RUNTIME_MODE: 'cloud_run',
      STORAGE_MODE: 'gcs_disabled',
      API_ALLOWED_CORS_ORIGINS: 'https://internal.example.invalid',
    }),
    nodeEnv: 'production',
    mode: 'cloud_run' as const,
  }
  assert.throws(
    () => resolveEditReferenceExactEditApplyRuntimePort({
      env: hostedEnv,
      port: forgedProductionPort,
    }),
    (error: unknown) => error instanceof ApiError
      && (error.details as { reason?: string } | undefined)?.reason
        === 'canonical_exact_edit_apply_runtime_not_release_qualified',
  )
  assert.equal(forgedReadCalled, false)
  assert.equal(forgedApplyCalled, false)

  console.log(JSON.stringify({
    status: 'passed',
    mountedAuthorityRoute:
      '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/apply-authority',
    mountedApplyRoute:
      '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/apply',
    genericPreferencesAndReferenceCommittedAtomically: true,
    lostResponseReplayReturnedSameReceipt: true,
    changedReplayRejected: true,
    privateWorkspacePreferenceApplyCommitted: true,
    privateWorkspaceRestartReplayReturnedSameReceipt: true,
    privateWorkspaceReferenceMutationRemainsFailClosed: true,
    callerShapedPrivateWorkspacePortRejected: true,
    privateWorkspaceAuthoritySource: 'private_exact_edit_preference_store',
    routeScopeReboundServerSide: true,
    callerAssertedProductionPortRejectedBeforeMutation: true,
    providerOrWorkerExecutionStarted: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    productionReady: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

type ControlledPort = EditReferenceExactEditApplyRuntimePort & {
  readonly __state: {
    applyInvocationCount: number
    committedTransactionCount: number
  }
}

function createControlledPort(
  authority: EditReferenceProductionExactEditApplyAuthorityRead,
): ControlledPort {
  const requests = new Map<string, {
    digest: string
    receipt: EditReferenceProductionExactEditApplyApiReceipt
  }>()
  const state = { applyInvocationCount: 0, committedTransactionCount: 0 }
  const port: ControlledPort = {
    schemaVersion: EDIT_REFERENCE_EXACT_EDIT_APPLY_RUNTIME_PORT_VERSION,
    persistenceContractVersion: 'edit-reference-production-persistence-contract-v6',
    authorityClass: 'canonical_exact_edit_preferences_and_reference_apply',
    runtimeClass: 'controlled_local_contract',
    evidenceClass: 'isolated_local_rls_proof_unreleased',
    sourceAuthority: 'canonical_v3_local_supabase_rls',
    canonicalAuthorityReadRpcVerified: true,
    canonicalAtomicApplyRpcVerified: true,
    twoUserTwoWorkspaceRlsVerified: true,
    privateSingleHostAtomicPreferenceApplyVerified: false,
    referenceMutationSupported: true,
    authenticatedActorForwardedServerSide: true,
    noLegacyPreferenceOrApplicationFallback: true,
    browserMutationAuthorityAccepted: false,
    providerOrWorkerExecutionStarted: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    sameReleaseReadinessEvidenceVerified: false,
    productionAuthority: false,
    async readAuthority({ actor, scope: requestScope }) {
      assert.equal(actor.actorUserId, actorUserId)
      assert.equal(requestScope.workspaceId, workspaceId)
      assert.equal(requestScope.projectId, projectId)
      assert.equal(requestScope.editSessionId, editSessionId)
      assert.equal(requestScope.selectedApplicationId, applicationId)
      return structuredClone(authority)
    },
    async apply({ actor, request }) {
      assert.equal(actor.actorUserId, actorUserId)
      state.applyInvocationCount += 1
      const existing = requests.get(request.idempotencyKeyHashSha256)
      if (existing) {
        if (existing.digest !== request.requestDigestSha256) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'This Apply key is already bound to another exact-edit operation.',
            409,
          )
        }
        return structuredClone(existing.receipt)
      }
      const receipt = createReceipt(request)
      requests.set(request.idempotencyKeyHashSha256, {
        digest: request.requestDigestSha256,
        receipt,
      })
      state.committedTransactionCount += 1
      return structuredClone(receipt)
    },
    __state: state,
  }
  return Object.freeze(port)
}

function portState(port: EditReferenceExactEditApplyRuntimePort) {
  return (port as ControlledPort).__state
}

function createAuthority(): EditReferenceProductionExactEditApplyAuthorityRead {
  const values: EditReferenceProductionExactEditPreferenceValues = {
    editLevel: 'pro',
    workflowType: 'testimonial_case_study',
    cleanupPreference: 'documentary_faithful',
    visualPreference: 'balanced_visual_mix',
    moodStyle: 'educational',
    creditPreference: 'balanced',
    targetPlatform: 'youtube',
  }
  const outputFrameAuthority = createEditReferenceProductionOutputFrameAuthority({
    repositoryAuthority: 'supabase_rls_transactional',
    workspaceId,
    projectId,
    editSessionId,
    exactEditPreferenceRecordRevision: 0,
    planningInputRevision: 0,
    confirmationId: 'frame-exact-edit-apply',
    aspectRatio: '16:9',
    confirmedAt: '2026-07-21T13:59:00.000Z',
  })
  const authority: EditReferenceProductionExactEditApplyAuthorityRead = {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION,
    sourceAuthority: 'canonical_exact_edit_preference_repository',
    runtimeSource: 'verified_live',
    authorityReadReceiptId: 'authority-read-exact-edit-apply',
    workspaceId,
    projectId,
    editSessionId,
    recordRevision: 0,
    preferenceRevision: 0,
    planningInputRevision: 0,
    preferenceFingerprintSha256: sha256(values),
    values,
    lifecyclePhase: 'planning',
    locked: false,
    currentApplicationState: 'not_selected',
    currentApplicationId: null,
    outputFrameAuthority,
    selectedApplicationAuthority: {
      schemaVersion: EDIT_REFERENCE_PRODUCTION_PREPARED_APPLICATION_AUTHORITY_VERSION,
      sourceAuthority: 'canonical_preference_application_repository',
      runtimeSource: 'verified_live',
      authorityReadReceiptId: 'application-authority-read-exact-edit-apply',
      workspaceId,
      projectId,
      editSessionId,
      editReferenceId: 'reference-exact-edit-apply',
      studySessionId: 'study-exact-edit-apply',
      dnaVersionId: 'dna-exact-edit-apply',
      dnaQaResultId: 'dna-qa-exact-edit-apply',
      applicationId,
      applicationVersionNumber: 1,
      applicationContentDigestSha256: 'a'.repeat(64),
      applicationContextHashSha256: 'b'.repeat(64),
      targetUnderstandingPackageDigestSha256: 'c'.repeat(64),
      expectedReferenceRevision: 1,
      status: 'prepared',
      connectionState: 'not_connected',
    },
    readAt,
    browserMutationAuthorityGranted: false,
    productionReleaseReadinessEvaluatedSeparately: true,
  }
  return Object.freeze(authority)
}

function createReceipt(
  request: EditReferenceProductionExactEditApplyRequest,
): EditReferenceProductionExactEditApplyApiReceipt {
  const withoutDigest = {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RECEIPT_VERSION,
    sourceAuthority: 'canonical_exact_edit_apply_rpc' as const,
    canonicalReceiptValidatedServerSide: true as const,
    transactionId: `transaction-${request.requestDigestSha256.slice(0, 40)}`,
    changedPreferenceFields: request.changedPreferenceFields,
    referenceMutation: request.referenceLifecycleRequest?.mutation ?? null,
    committedPreferenceRecordRevision: request.expectedPreferenceRecordRevision + 1,
    committedPreferenceRevision: request.expectedPreferenceRevision
      + (request.changedPreferenceFields.length > 0 ? 1 : 0),
    committedPlanningInputRevision: request.expectedPlanningInputRevision + 1,
    sourcePreparationDisposition: request.sourcePreparationDisposition,
    outputFrameDisposition: request.outputFrameDisposition,
    freshPlanAndEstimateRequired: true as const,
    approvedSnapshotPreserved: true as const,
    historicalPrivatePreviewPreserved: true as const,
    committedAt: request.requestedAt,
    productionReleaseReadinessEvaluatedSeparately: true as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
    providerOrWorkerExecutionStarted: false as const,
  }
  return Object.freeze({
    ...withoutDigest,
    transactionReceiptDigestSha256: sha256(withoutDigest),
  })
}

async function startRuntime(
  rootPath: string,
  port: EditReferenceExactEditApplyRuntimePort,
) {
  const env = loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: rootPath,
    WORKER_RUNTIME_MODE: 'mock',
  })
  const server = createReeditProApiApp(env, {
    editReferenceExactEditApplyRuntimePort: port,
  }).listen(0, '127.0.0.1')
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  return {
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
    }),
  }
}

function snapshotFrontendRuntimeEnv() {
  return {
    mode: process.env.VITE_REEDITPRO_API_MODE,
    baseUrl: process.env.VITE_REEDITPRO_API_BASE_URL,
    transport: process.env.VITE_REEDITPRO_API_TRANSPORT,
    e2e: process.env.VITE_REEDITPRO_E2E,
    token: process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN,
  }
}

function restoreFrontendRuntimeEnv(snapshot: ReturnType<typeof snapshotFrontendRuntimeEnv>) {
  restoreEnv('VITE_REEDITPRO_API_MODE', snapshot.mode)
  restoreEnv('VITE_REEDITPRO_API_BASE_URL', snapshot.baseUrl)
  restoreEnv('VITE_REEDITPRO_API_TRANSPORT', snapshot.transport)
  restoreEnv('VITE_REEDITPRO_E2E', snapshot.e2e)
  restoreEnv('VITE_REEDITPRO_E2E_AUTH_TOKEN', snapshot.token)
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

function sha256(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  const serialized = JSON.stringify(value)
  if (serialized === undefined) throw new Error('non_canonical_value')
  return serialized
}
