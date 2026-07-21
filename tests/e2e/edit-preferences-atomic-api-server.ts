import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { createReeditProApiApp } from '../../server/app'
import { loadRuntimeEnv } from '../../server/config/env'
import { ApiError } from '../../server/errors/api-error'
import {
  EDIT_REFERENCE_EXACT_EDIT_APPLY_RUNTIME_PORT_VERSION,
  type EditReferenceExactEditApplyRuntimePort,
} from '../../server/services/edit-reference-exact-edit-apply-runtime-port'
import {
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION,
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RECEIPT_VERSION,
  type EditReferenceProductionExactEditApplyApiReceipt,
  type EditReferenceProductionExactEditPreferenceValues,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'

type ExactEditState = {
  values: EditReferenceProductionExactEditPreferenceValues
  recordRevision: number
  preferenceRevision: number
  planningInputRevision: number
}

const defaultValues: EditReferenceProductionExactEditPreferenceValues = {
  editLevel: 'pro',
  workflowType: 'custom_let_ai_decide',
  cleanupPreference: 'balanced_cleanup',
  visualPreference: 'balanced_visual_mix',
  moodStyle: 'clean',
  creditPreference: 'balanced',
  targetPlatform: 'custom',
}
const states = new Map<string, ExactEditState>()
const committedByIdempotencyHash = new Map<string, {
  requestDigestSha256: string
  receipt: EditReferenceProductionExactEditApplyApiReceipt
}>()

const runtimePort: EditReferenceExactEditApplyRuntimePort = Object.freeze({
  schemaVersion: EDIT_REFERENCE_EXACT_EDIT_APPLY_RUNTIME_PORT_VERSION,
  persistenceContractVersion: 'edit-reference-production-persistence-contract-v6',
  authorityClass: 'canonical_exact_edit_preferences_and_reference_apply',
  runtimeClass: 'controlled_local_contract',
  evidenceClass: 'isolated_local_rls_proof_unreleased',
  sourceAuthority: 'canonical_v3_local_supabase_rls',
  canonicalAuthorityReadRpcVerified: true,
  canonicalAtomicApplyRpcVerified: true,
  twoUserTwoWorkspaceRlsVerified: true,
  authenticatedActorForwardedServerSide: true,
  noLegacyPreferenceOrApplicationFallback: true,
  browserMutationAuthorityAccepted: false,
  providerOrWorkerExecutionStarted: false,
  customerPriceCalculated: false,
  customerCreditsMutated: false,
  serviceFeeIncluded: false,
  sameReleaseReadinessEvidenceVerified: false,
  productionAuthority: false,

  async readAuthority({ scope }) {
    if (scope.selectedApplicationId !== null) {
      throw new ApiError(
        'JOB_DEPENDENCY_NOT_READY',
        'This focused browser fixture proves generic preference Apply only.',
        503,
      )
    }
    const key = stateKey(scope.workspaceId, scope.projectId, scope.editSessionId)
    const state = states.get(key) ?? {
      values: structuredClone(defaultValues),
      recordRevision: 0,
      preferenceRevision: 0,
      planningInputRevision: 0,
    }
    states.set(key, state)
    const readAt = new Date().toISOString()
    return {
      schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION,
      sourceAuthority: 'canonical_exact_edit_preference_repository',
      runtimeSource: 'verified_live',
      authorityReadReceiptId: `atomic-ui-read-${sha256(`${key}\n${readAt}`).slice(0, 40)}`,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      recordRevision: state.recordRevision,
      preferenceRevision: state.preferenceRevision,
      planningInputRevision: state.planningInputRevision,
      preferenceFingerprintSha256: sha256(state.values),
      values: structuredClone(state.values),
      lifecyclePhase: 'planning',
      locked: false,
      currentApplicationState: 'not_selected',
      currentApplicationId: null,
      outputFrameAuthority: null,
      selectedApplicationAuthority: null,
      readAt,
      browserMutationAuthorityGranted: false,
      productionReleaseReadinessEvaluatedSeparately: true,
    }
  },

  async apply({ request }) {
    const existing = committedByIdempotencyHash.get(request.idempotencyKeyHashSha256)
    if (existing) {
      if (existing.requestDigestSha256 !== request.requestDigestSha256) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'This Apply key is already bound to another exact-edit operation.',
          409,
        )
      }
      return structuredClone(existing.receipt)
    }

    const key = stateKey(request.workspaceId, request.projectId, request.editSessionId)
    const state = states.get(key)
    if (
      !state
      || state.recordRevision !== request.expectedPreferenceRecordRevision
      || state.preferenceRevision !== request.expectedPreferenceRevision
      || state.planningInputRevision !== request.expectedPlanningInputRevision
      || sha256(state.values) !== request.expectedPreferenceFingerprintSha256
    ) {
      throw new ApiError('VERSION_CONFLICT', 'The exact-edit preference authority changed.', 409)
    }

    const committedAt = new Date().toISOString()
    const nextState: ExactEditState = {
      values: { ...state.values, ...request.preferencePatch },
      recordRevision: state.recordRevision + 1,
      preferenceRevision: state.preferenceRevision
        + (request.changedPreferenceFields.length > 0 ? 1 : 0),
      planningInputRevision: state.planningInputRevision + 1,
    }
    const receiptWithoutDigest = {
      schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RECEIPT_VERSION,
      sourceAuthority: 'canonical_exact_edit_apply_rpc' as const,
      canonicalReceiptValidatedServerSide: true as const,
      transactionId: `atomic-ui-transaction-${request.requestDigestSha256.slice(0, 40)}`,
      changedPreferenceFields: request.changedPreferenceFields,
      referenceMutation: request.referenceLifecycleRequest?.mutation ?? null,
      committedPreferenceRecordRevision: nextState.recordRevision,
      committedPreferenceRevision: nextState.preferenceRevision,
      committedPlanningInputRevision: nextState.planningInputRevision,
      sourcePreparationDisposition: request.sourcePreparationDisposition,
      outputFrameDisposition: request.outputFrameDisposition,
      freshPlanAndEstimateRequired: true as const,
      approvedSnapshotPreserved: true as const,
      historicalPrivatePreviewPreserved: true as const,
      committedAt,
      productionReleaseReadinessEvaluatedSeparately: true as const,
      customerPriceCalculated: false as const,
      customerCreditsMutated: false as const,
      serviceFeeIncluded: false as const,
      providerOrWorkerExecutionStarted: false as const,
    }
    const receipt: EditReferenceProductionExactEditApplyApiReceipt = {
      ...receiptWithoutDigest,
      transactionReceiptDigestSha256: sha256(receiptWithoutDigest),
    }
    states.set(key, nextState)
    committedByIdempotencyHash.set(request.idempotencyKeyHashSha256, {
      requestDigestSha256: request.requestDigestSha256,
      receipt,
    })
    return structuredClone(receipt)
  },
})

const env = loadRuntimeEnv({
  ...process.env,
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: process.env.LOCAL_STORAGE_ROOT
    ?? resolve('test-results/current-edit-preferences-atomic-storage'),
  PROVIDER_EXECUTION_ENABLED: 'false',
  WORKER_RUNTIME_MODE: 'mock',
})
const server = createReeditProApiApp(env, {
  editReferenceExactEditApplyRuntimePort: runtimePort,
}).listen(env.apiPort, '127.0.0.1', () => {
  console.log(JSON.stringify({ event: 'atomic_preferences_test_api_listening', port: env.apiPort }))
})

let closing = false
function close(signal: NodeJS.Signals) {
  if (closing) return
  closing = true
  server.close((error) => {
    if (error) process.exitCode = 1
  })
  console.log(JSON.stringify({ event: 'atomic_preferences_test_api_closing', signal }))
}
process.once('SIGINT', () => close('SIGINT'))
process.once('SIGTERM', () => close('SIGTERM'))

function stateKey(workspaceId: string, projectId: string, editSessionId: string): string {
  return `${workspaceId}\n${projectId}\n${editSessionId}`
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
