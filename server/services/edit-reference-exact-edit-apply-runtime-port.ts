import { isAbsolute } from 'node:path'
import type { RuntimeEnv } from '../config/env'
import {
  EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
} from '../edit-references/edit-reference-production-persistence-contract'
import {
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION,
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RECEIPT_VERSION,
  type EditReferenceProductionExactEditApplyAuthorityRead,
  type EditReferenceProductionExactEditApplyApiReceipt,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import {
  validateEditReferenceProductionExactEditApplyAuthorityReadScope,
  validateEditReferenceProductionExactEditApplyReceipt,
  validateEditReferenceProductionExactEditApplyRequest,
  type EditReferenceProductionExactEditApplyAuthorityReadScope,
  type EditReferenceProductionExactEditApplyRequest,
} from '../edit-references/edit-reference-production-exact-edit-apply-boundary'
import {
  exactEditPreferenceFieldKeys,
  exactEditPreferenceValuesSchema,
  type ExactEditPreferenceValues,
} from '../validation/exact-edit-preference-schemas'
import {
  deriveExactEditPreferenceOverrideKeys,
  exactEditPreferenceFingerprint,
  MAX_EXACT_EDIT_PREFERENCE_AUDIT_EVENTS,
  MAX_EXACT_EDIT_PREFERENCE_IDEMPOTENCY_RECORDS,
  mutatePrivateExactEditPreferenceRecord,
  type ExactEditPreferenceStoreScope,
  type PrivateExactEditPreferenceRecord,
} from './private-exact-edit-preference-store'
import {
  applyExactEditPlanningInvalidation,
  createPrivateExactEditPreferenceRecord,
  deriveExactEditPlanningInvalidation,
} from './exact-edit-preference-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'
import { ApiError } from '../errors/api-error'
import type {
  EditReferenceLocalSupabaseRpcAdapter,
} from '../edit-references/edit-reference-local-supabase-rpc-adapter'
import {
  createEditReferenceLocalSupabaseRpcAdapter,
  createEditReferenceLocalSupabaseRpcCapability,
} from '../edit-references/edit-reference-local-supabase-rpc-adapter'
import {
  createEditReferenceLocalSupabaseHttpRpcClient,
} from '../edit-references/edit-reference-local-supabase-http-rpc-client'

export const EDIT_REFERENCE_EXACT_EDIT_APPLY_RUNTIME_PORT_VERSION =
  'edit-reference-exact-edit-apply-runtime-port-v1' as const

export interface EditReferenceExactEditApplyRuntimeActor {
  readonly actorUserId: string
  readonly authenticatedAccessToken: string | null
  readonly mockActor: boolean
}

export interface EditReferenceExactEditApplyRuntimePort {
  readonly schemaVersion: typeof EDIT_REFERENCE_EXACT_EDIT_APPLY_RUNTIME_PORT_VERSION
  readonly persistenceContractVersion: typeof EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
  readonly authorityClass:
    | 'canonical_exact_edit_preferences_and_reference_apply'
    | 'private_workspace_exact_edit_preferences'
  readonly runtimeClass:
    | 'controlled_local_contract'
    | 'canonical_backend_verified_runtime'
  readonly evidenceClass:
    | 'isolated_local_rls_proof_unreleased'
    | 'loopback_single_host_private_test'
    | 'canonical_same_release_live_runtime'
  readonly sourceAuthority:
    | 'canonical_v3_local_supabase_rls'
    | 'private_exact_edit_preference_store'
    | 'canonical_edit_reference_production_repository'
  readonly canonicalAuthorityReadRpcVerified: boolean
  readonly canonicalAtomicApplyRpcVerified: boolean
  readonly twoUserTwoWorkspaceRlsVerified: boolean
  readonly privateSingleHostAtomicPreferenceApplyVerified: boolean
  readonly referenceMutationSupported: boolean
  readonly authenticatedActorForwardedServerSide: true
  readonly noLegacyPreferenceOrApplicationFallback: true
  readonly browserMutationAuthorityAccepted: false
  readonly providerOrWorkerExecutionStarted: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly sameReleaseReadinessEvidenceVerified: boolean
  readonly productionAuthority: boolean
  readAuthority(input: {
    readonly actor: EditReferenceExactEditApplyRuntimeActor
    readonly scope: EditReferenceProductionExactEditApplyAuthorityReadScope
  }): Promise<EditReferenceProductionExactEditApplyAuthorityRead>
  apply(input: {
    readonly actor: EditReferenceExactEditApplyRuntimeActor
    readonly request: EditReferenceProductionExactEditApplyRequest
  }): Promise<EditReferenceProductionExactEditApplyApiReceipt>
}

const qualifiedProductionPorts = new WeakSet<EditReferenceExactEditApplyRuntimePort>()
const privateWorkspacePorts = new WeakSet<EditReferenceExactEditApplyRuntimePort>()

const PRIVATE_WORKSPACE_DEFAULT_EXACT_EDIT_PREFERENCES: ExactEditPreferenceValues = {
  editLevel: 'pro',
  workflowType: 'custom_let_ai_decide',
  cleanupPreference: 'balanced_cleanup',
  visualPreference: 'balanced_visual_mix',
  moodStyle: 'clean',
  creditPreference: 'balanced',
  targetPlatform: 'custom',
}

/**
 * Mounts the reviewed loopback-only V3 adapter behind the same runtime port
 * used by the HTTP service. The returned port is intentionally local and can
 * never satisfy hosted/production selection.
 */
export function createEditReferenceExactEditApplyLocalRuntimePort(
  adapter: EditReferenceLocalSupabaseRpcAdapter,
): EditReferenceExactEditApplyRuntimePort {
  if (
    adapter.schemaVersion !== 'edit-reference-local-supabase-rpc-adapter-v1'
    || adapter.source !== 'canonical_v3_local_supabase_rpc'
    || adapter.loopbackOnly !== true
    || adapter.remoteDatabaseMutationAllowed !== false
    || adapter.productionAuthority !== false
  ) throw unavailable('local_exact_edit_apply_adapter_invalid')
  const port: EditReferenceExactEditApplyRuntimePort = {
    schemaVersion: EDIT_REFERENCE_EXACT_EDIT_APPLY_RUNTIME_PORT_VERSION,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    authorityClass: 'canonical_exact_edit_preferences_and_reference_apply' as const,
    runtimeClass: 'controlled_local_contract' as const,
    evidenceClass: 'isolated_local_rls_proof_unreleased' as const,
    sourceAuthority: 'canonical_v3_local_supabase_rls' as const,
    canonicalAuthorityReadRpcVerified: true,
    canonicalAtomicApplyRpcVerified: true,
    twoUserTwoWorkspaceRlsVerified: true,
    privateSingleHostAtomicPreferenceApplyVerified: false,
    referenceMutationSupported: true,
    authenticatedActorForwardedServerSide: true as const,
    noLegacyPreferenceOrApplicationFallback: true as const,
    browserMutationAuthorityAccepted: false as const,
    providerOrWorkerExecutionStarted: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
    sameReleaseReadinessEvidenceVerified: false,
    productionAuthority: false,
    readAuthority: ({ scope }) => adapter.readExactEditApplyAuthority(scope),
    apply: ({ request }) => adapter.applyExactEditPreferencesAndReference(request),
  }
  return Object.freeze(port)
}

/**
 * Process-wide descriptor with request-scoped authenticated transport. The
 * browser token reaches the server service first, is authorized there, and is
 * captured only by the short-lived loopback RPC client created for that one
 * method call. No user's credential or adapter is reused across requests.
 */
export function createEditReferenceCanonicalV3LocalExactEditApplyRuntimePort(
  input: {
    readonly endpointOrigin: string
    readonly anonKey: string
  },
): EditReferenceExactEditApplyRuntimePort {
  if (
    input.endpointOrigin !== 'http://127.0.0.1:57431'
    || typeof input.anonKey !== 'string'
    || input.anonKey.length < 20
    || input.anonKey.length > 4_096
  ) throw unavailable('canonical_v3_local_exact_edit_apply_config_invalid')
  const endpointOrigin = input.endpointOrigin
  const anonKey = input.anonKey

  const adapterFor = (
    actor: EditReferenceExactEditApplyRuntimeActor,
  ): EditReferenceLocalSupabaseRpcAdapter => {
    if (
      actor.mockActor
      || !actor.authenticatedAccessToken
      || actor.authenticatedAccessToken.split('.').length !== 3
    ) throw unavailable('canonical_v3_local_exact_edit_apply_actor_invalid')
    const client = createEditReferenceLocalSupabaseHttpRpcClient({
      endpointOrigin,
      anonKey,
      authenticatedAccessToken: actor.authenticatedAccessToken,
    })
    const capability = createEditReferenceLocalSupabaseRpcCapability({
      client,
      endpointOrigin,
    })
    return createEditReferenceLocalSupabaseRpcAdapter({ client, capability })
  }

  return Object.freeze({
    schemaVersion: EDIT_REFERENCE_EXACT_EDIT_APPLY_RUNTIME_PORT_VERSION,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    authorityClass: 'canonical_exact_edit_preferences_and_reference_apply' as const,
    runtimeClass: 'controlled_local_contract' as const,
    evidenceClass: 'isolated_local_rls_proof_unreleased' as const,
    sourceAuthority: 'canonical_v3_local_supabase_rls' as const,
    canonicalAuthorityReadRpcVerified: true,
    canonicalAtomicApplyRpcVerified: true,
    twoUserTwoWorkspaceRlsVerified: true,
    privateSingleHostAtomicPreferenceApplyVerified: false,
    referenceMutationSupported: true,
    authenticatedActorForwardedServerSide: true as const,
    noLegacyPreferenceOrApplicationFallback: true as const,
    browserMutationAuthorityAccepted: false as const,
    providerOrWorkerExecutionStarted: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
    sameReleaseReadinessEvidenceVerified: false,
    productionAuthority: false,
    readAuthority: ({ actor, scope }: {
      readonly actor: EditReferenceExactEditApplyRuntimeActor
      readonly scope: EditReferenceProductionExactEditApplyAuthorityReadScope
    }) => (
      adapterFor(actor).readExactEditApplyAuthority(scope)
    ),
    apply: ({ actor, request }: {
      readonly actor: EditReferenceExactEditApplyRuntimeActor
      readonly request: EditReferenceProductionExactEditApplyRequest
    }) => (
      adapterFor(actor).applyExactEditPreferencesAndReference(request)
    ),
  })
}

/**
 * Mounts the loopback-only private workspace persistence authority. This port
 * supports exact preference changes only; Edit Reference selection/removal
 * remains unavailable until its own private transaction authority is mounted.
 * It accepts either the explicit local mock identity or a bearer identity that
 * the server already authenticated and authorized for the workspace. The
 * process brand and explicit local metadata prevent a caller-shaped port from
 * being selected in hosted or production runtimes.
 */
export function createEditReferencePrivateWorkspaceExactEditApplyRuntimePort(
  input: {
    readonly localStorageRoot: string
  },
): EditReferenceExactEditApplyRuntimePort {
  if (
    typeof input.localStorageRoot !== 'string'
    || !isAbsolute(input.localStorageRoot)
  ) throw unavailable('private_workspace_exact_edit_apply_storage_root_invalid')
  const localStorageRoot = input.localStorageRoot
  const port: EditReferenceExactEditApplyRuntimePort = {
    schemaVersion: EDIT_REFERENCE_EXACT_EDIT_APPLY_RUNTIME_PORT_VERSION,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    authorityClass: 'private_workspace_exact_edit_preferences' as const,
    runtimeClass: 'controlled_local_contract' as const,
    evidenceClass: 'loopback_single_host_private_test' as const,
    sourceAuthority: 'private_exact_edit_preference_store' as const,
    canonicalAuthorityReadRpcVerified: false,
    canonicalAtomicApplyRpcVerified: false,
    twoUserTwoWorkspaceRlsVerified: false,
    privateSingleHostAtomicPreferenceApplyVerified: true,
    referenceMutationSupported: false,
    authenticatedActorForwardedServerSide: true as const,
    noLegacyPreferenceOrApplicationFallback: true as const,
    browserMutationAuthorityAccepted: false as const,
    providerOrWorkerExecutionStarted: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
    sameReleaseReadinessEvidenceVerified: false,
    productionAuthority: false,
    readAuthority: ({ actor, scope }) => readPrivateWorkspaceAuthority({
      actor,
      scope,
      localStorageRoot,
    }),
    apply: ({ actor, request }) => applyPrivateWorkspacePreferences({
      actor,
      request,
      localStorageRoot,
    }),
  }
  Object.freeze(port)
  privateWorkspacePorts.add(port)
  return port
}

export function resolveEditReferenceExactEditApplyRuntimePort(input: {
  readonly env: RuntimeEnv
  readonly port?: EditReferenceExactEditApplyRuntimePort
}): EditReferenceExactEditApplyRuntimePort {
  const local = isExplicitLocalRuntime(input.env)
  if (!input.port) throw unavailable('canonical_exact_edit_apply_runtime_missing')
  assertPortShape(input.port)

  if (local) {
    if (privateWorkspacePorts.has(input.port)) {
      if (
        input.port.authorityClass !== 'private_workspace_exact_edit_preferences'
        || input.port.runtimeClass !== 'controlled_local_contract'
        || input.port.evidenceClass !== 'loopback_single_host_private_test'
        || input.port.sourceAuthority !== 'private_exact_edit_preference_store'
        || input.port.canonicalAuthorityReadRpcVerified
        || input.port.canonicalAtomicApplyRpcVerified
        || input.port.twoUserTwoWorkspaceRlsVerified
        || !input.port.privateSingleHostAtomicPreferenceApplyVerified
        || input.port.referenceMutationSupported
        || input.port.productionAuthority
        || input.port.sameReleaseReadinessEvidenceVerified
        || qualifiedProductionPorts.has(input.port)
      ) throw unavailable('private_workspace_exact_edit_apply_runtime_claim_invalid')
      return input.port
    }
    if (
      input.port.authorityClass
        !== 'canonical_exact_edit_preferences_and_reference_apply'
      || input.port.runtimeClass !== 'controlled_local_contract'
      || input.port.evidenceClass !== 'isolated_local_rls_proof_unreleased'
      || input.port.sourceAuthority !== 'canonical_v3_local_supabase_rls'
      || !input.port.canonicalAuthorityReadRpcVerified
      || !input.port.canonicalAtomicApplyRpcVerified
      || !input.port.twoUserTwoWorkspaceRlsVerified
      || input.port.privateSingleHostAtomicPreferenceApplyVerified
      || !input.port.referenceMutationSupported
      || input.port.productionAuthority
      || input.port.sameReleaseReadinessEvidenceVerified
      || qualifiedProductionPorts.has(input.port)
    ) throw unavailable('local_exact_edit_apply_runtime_claimed_production')
    return input.port
  }

  if (
    input.port.authorityClass
      !== 'canonical_exact_edit_preferences_and_reference_apply'
    || input.port.runtimeClass !== 'canonical_backend_verified_runtime'
    || input.port.evidenceClass !== 'canonical_same_release_live_runtime'
    || input.port.sourceAuthority !== 'canonical_edit_reference_production_repository'
    || !input.port.canonicalAuthorityReadRpcVerified
    || !input.port.canonicalAtomicApplyRpcVerified
    || !input.port.twoUserTwoWorkspaceRlsVerified
    || input.port.privateSingleHostAtomicPreferenceApplyVerified
    || !input.port.referenceMutationSupported
    || !input.port.sameReleaseReadinessEvidenceVerified
    || !input.port.productionAuthority
    || !qualifiedProductionPorts.has(input.port)
  ) throw unavailable('canonical_exact_edit_apply_runtime_not_release_qualified')
  return input.port
}

export function assertEditReferenceExactEditApplyRuntimePortIsNotProduction(
  port: EditReferenceExactEditApplyRuntimePort,
): void {
  assertPortShape(port)
  if (
    port.productionAuthority
    || port.runtimeClass === 'canonical_backend_verified_runtime'
    || port.evidenceClass === 'canonical_same_release_live_runtime'
    || qualifiedProductionPorts.has(port)
  ) throw unavailable('exact_edit_apply_runtime_unexpectedly_production')
}

function assertPortShape(port: EditReferenceExactEditApplyRuntimePort): void {
  if (
    port.schemaVersion !== EDIT_REFERENCE_EXACT_EDIT_APPLY_RUNTIME_PORT_VERSION
    || port.persistenceContractVersion
      !== EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
    || ![
      'canonical_exact_edit_preferences_and_reference_apply',
      'private_workspace_exact_edit_preferences',
    ].includes(port.authorityClass)
    || typeof port.canonicalAuthorityReadRpcVerified !== 'boolean'
    || typeof port.canonicalAtomicApplyRpcVerified !== 'boolean'
    || typeof port.twoUserTwoWorkspaceRlsVerified !== 'boolean'
    || typeof port.privateSingleHostAtomicPreferenceApplyVerified !== 'boolean'
    || typeof port.referenceMutationSupported !== 'boolean'
    || port.authenticatedActorForwardedServerSide !== true
    || port.noLegacyPreferenceOrApplicationFallback !== true
    || port.browserMutationAuthorityAccepted !== false
    || port.providerOrWorkerExecutionStarted !== false
    || port.customerPriceCalculated !== false
    || port.customerCreditsMutated !== false
    || port.serviceFeeIncluded !== false
    || typeof port.sameReleaseReadinessEvidenceVerified !== 'boolean'
    || typeof port.productionAuthority !== 'boolean'
    || typeof port.readAuthority !== 'function'
    || typeof port.apply !== 'function'
  ) throw unavailable('canonical_exact_edit_apply_runtime_shape_invalid')
}

async function readPrivateWorkspaceAuthority(input: {
  readonly actor: EditReferenceExactEditApplyRuntimeActor
  readonly scope: EditReferenceProductionExactEditApplyAuthorityReadScope
  readonly localStorageRoot: string
}): Promise<EditReferenceProductionExactEditApplyAuthorityRead> {
  assertPrivateWorkspaceActor(input.actor, input.scope.actorUserId)
  validateEditReferenceProductionExactEditApplyAuthorityReadScope(input.scope)
  if (input.scope.selectedApplicationId !== null) {
    throw unavailable('private_workspace_reference_application_authority_unavailable')
  }
  const record = await ensurePrivateWorkspaceExactEditRecord({
    localStorageRoot: input.localStorageRoot,
    ownerUserId: input.actor.actorUserId,
    workspaceId: input.scope.workspaceId,
    projectId: input.scope.projectId,
    editSessionId: input.scope.editSessionId,
  })
  const readAt = new Date().toISOString()
  return {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION,
    sourceAuthority: 'private_exact_edit_preference_store',
    runtimeSource: 'verified_local',
    authorityReadReceiptId: `private-exact-edit-read-${sha256AuthorityValue({
      ownerUserId: record.ownerUserId,
      workspaceId: record.workspaceId,
      projectId: record.projectId,
      editSessionId: record.editSessionId,
      recordRevision: record.recordRevision,
      readAt,
    }).slice(0, 48)}`,
    workspaceId: record.workspaceId,
    projectId: record.projectId,
    editSessionId: record.editSessionId,
    recordRevision: record.recordRevision,
    preferenceRevision: record.preferenceRevision,
    planningInputRevision: record.planning.planningInputRevision,
    preferenceFingerprintSha256: exactEditPreferenceFingerprint(record.values),
    values: structuredClone(record.values),
    lifecyclePhase: record.lifecycle.phase,
    locked: record.lifecycle.locked,
    currentApplicationState: 'not_selected',
    currentApplicationId: null,
    outputFrameAuthority: null,
    selectedApplicationAuthority: null,
    readAt,
    browserMutationAuthorityGranted: false,
    productionReleaseReadinessEvaluatedSeparately: true,
  }
}

async function applyPrivateWorkspacePreferences(input: {
  readonly actor: EditReferenceExactEditApplyRuntimeActor
  readonly request: EditReferenceProductionExactEditApplyRequest
  readonly localStorageRoot: string
}): Promise<EditReferenceProductionExactEditApplyApiReceipt> {
  // Authentication and actor binding intentionally precede every replay read.
  assertPrivateWorkspaceActor(input.actor, input.request.actorUserId)
  validateEditReferenceProductionExactEditApplyRequest(input.request)
  if (input.request.referenceLifecycleRequest !== null) {
    throw unavailable('private_workspace_reference_mutation_authority_unavailable')
  }

  const scope: ExactEditPreferenceStoreScope = {
    localStorageRoot: input.localStorageRoot,
    ownerUserId: input.actor.actorUserId,
    workspaceId: input.request.workspaceId,
    projectId: input.request.projectId,
    editSessionId: input.request.editSessionId,
  }
  return mutatePrivateExactEditPreferenceRecord({
    scope,
    mutation: (current) => {
      if (!current) {
        throw new ApiError(
          'VERSION_CONFLICT',
          'The private exact-edit preference authority no longer exists.',
          409,
        )
      }
      const replay = current.idempotencyRecords.find((entry) => (
        entry.operation === 'apply_preferences'
        && entry.idempotencyKey === input.request.idempotencyKeyHashSha256
      ))
      if (replay) {
        if (replay.requestHash !== input.request.requestDigestSha256) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'This Apply key is already bound to another exact-edit operation.',
            409,
          )
        }
        const receipt = replay.responseSnapshot as
          | EditReferenceProductionExactEditApplyApiReceipt
          | undefined
        if (!receipt) {
          throw new ApiError(
            'IDEMPOTENCY_REPLAY_UNAVAILABLE',
            'The original private exact-edit Apply receipt is unavailable.',
            503,
          )
        }
        validateEditReferenceProductionExactEditApplyReceipt({
          request: input.request,
          receipt,
        })
        if (receipt.sourceAuthority !== 'private_exact_edit_apply_transaction') {
          throw new ApiError(
            'VALIDATION_FAILED',
            'The private exact-edit Apply replay source is invalid.',
            409,
          )
        }
        return { changed: false, result: structuredClone(receipt) }
      }

      if (current.lifecycle.locked || current.lifecycle.phase !== 'planning') {
        throw new ApiError(
          'PLAN_NOT_APPROVED',
          'Approved or active edit preferences are immutable. Use the Chat-led revision flow.',
          409,
        )
      }
      if (
        current.recordRevision !== input.request.expectedPreferenceRecordRevision
        || current.preferenceRevision !== input.request.expectedPreferenceRevision
        || current.planning.planningInputRevision
          !== input.request.expectedPlanningInputRevision
        || exactEditPreferenceFingerprint(current.values)
          !== input.request.expectedPreferenceFingerprintSha256
      ) {
        throw new ApiError(
          'VERSION_CONFLICT',
          'The exact-edit preference authority changed before Apply.',
          409,
        )
      }

      const nextValues = exactEditPreferenceValuesSchema.parse({
        ...current.values,
        ...input.request.preferencePatch,
      })
      const changedFields = exactEditPreferenceFieldKeys.filter(
        (field) => current.values[field] !== nextValues[field],
      )
      if (
        JSON.stringify(changedFields)
          !== JSON.stringify(input.request.changedPreferenceFields)
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'The private exact-edit Apply change set is inconsistent.',
          409,
        )
      }
      if (
        current.auditEvents.length >= MAX_EXACT_EDIT_PREFERENCE_AUDIT_EVENTS
        || current.idempotencyRecords.length
          >= MAX_EXACT_EDIT_PREFERENCE_IDEMPOTENCY_RECORDS
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CAPACITY_EXCEEDED',
          'Private exact-edit preference persistence reached its safe capacity.',
          503,
        )
      }

      const committedAt = new Date().toISOString()
      const invalidation = deriveExactEditPlanningInvalidation(
        current.planning,
        'preference_change',
        changedFields,
        committedAt,
      )
      const nextRecordRevision = current.recordRevision + 1
      const nextPreferenceRevision = current.preferenceRevision + 1
      const receiptWithoutDigest = {
        schemaVersion: EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RECEIPT_VERSION,
        sourceAuthority: 'private_exact_edit_apply_transaction' as const,
        canonicalReceiptValidatedServerSide: true as const,
        transactionId:
          `private-exact-edit-transaction-${input.request.requestDigestSha256.slice(0, 48)}`,
        changedPreferenceFields: input.request.changedPreferenceFields,
        referenceMutation: null,
        committedPreferenceRecordRevision: nextRecordRevision,
        committedPreferenceRevision: nextPreferenceRevision,
        committedPlanningInputRevision:
          current.planning.planningInputRevision + 1,
        sourcePreparationDisposition:
          input.request.sourcePreparationDisposition,
        outputFrameDisposition: input.request.outputFrameDisposition,
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
        transactionReceiptDigestSha256:
          sha256AuthorityValue(receiptWithoutDigest),
      }
      validateEditReferenceProductionExactEditApplyReceipt({
        request: input.request,
        receipt,
      })
      const nextRecord: PrivateExactEditPreferenceRecord = {
        ...current,
        values: nextValues,
        overrideKeys: deriveExactEditPreferenceOverrideKeys(
          current.baseline.values,
          nextValues,
        ),
        recordRevision: nextRecordRevision,
        preferenceRevision: nextPreferenceRevision,
        preferenceUpdatedAt: committedAt,
        planning: applyExactEditPlanningInvalidation(
          current.planning,
          invalidation,
          nextValues,
        ),
        auditEvents: [...current.auditEvents, {
          id: `exact_edit_preference_audit_${input.request.requestDigestSha256.slice(0, 48)}`,
          eventType: 'exact_edit_preferences_changed',
          actorType: 'user',
          actorUserId: input.actor.actorUserId,
          recordRevision: nextRecordRevision,
          preferenceRevision: nextPreferenceRevision,
          changedInputs: changedFields,
          invalidation,
          createdAt: committedAt,
        }],
        idempotencyRecords: [...current.idempotencyRecords, {
          operation: 'apply_preferences',
          idempotencyKey: input.request.idempotencyKeyHashSha256,
          requestHash: input.request.requestDigestSha256,
          responseSnapshot: structuredClone(receipt),
          committedRecordRevision: nextRecordRevision,
          completedAt: committedAt,
        }],
        updatedAt: committedAt,
      }
      return {
        changed: true,
        record: nextRecord,
        result: structuredClone(receipt),
      }
    },
  })
}

async function ensurePrivateWorkspaceExactEditRecord(
  scope: ExactEditPreferenceStoreScope,
): Promise<PrivateExactEditPreferenceRecord> {
  return mutatePrivateExactEditPreferenceRecord({
    scope,
    mutation: (current) => {
      if (current) return { changed: false, result: current }
      const timestamp = new Date().toISOString()
      const record = createPrivateExactEditPreferenceRecord({
        scope,
        baseline: {
          values: PRIVATE_WORKSPACE_DEFAULT_EXACT_EDIT_PREFERENCES,
          preferenceSnapshotId: 'private-workspace-server-default-exact-edit-preferences-v1',
          capturedAt: timestamp,
          persistenceSource: 'server_defaults',
          provenance: 'server_default_preferences',
        },
        timestamp,
        idempotencyKey: 'private-workspace-exact-edit-bootstrap-v1',
        requestHash: sha256AuthorityValue({
          schemaVersion: 'private-workspace-exact-edit-bootstrap-v1',
          ownerUserId: scope.ownerUserId,
          workspaceId: scope.workspaceId,
          projectId: scope.projectId,
          editSessionId: scope.editSessionId,
        }),
      })
      return { changed: true, record, result: record }
    },
  })
}

function assertPrivateWorkspaceActor(
  actor: EditReferenceExactEditApplyRuntimeActor,
  expectedActorUserId: string,
): void {
  const localMockActor =
    actor.mockActor
    && actor.authenticatedAccessToken === null
  const authenticatedLocalActor =
    !actor.mockActor
    && typeof actor.authenticatedAccessToken === 'string'
    && actor.authenticatedAccessToken.length > 0
  if (
    actor.actorUserId !== expectedActorUserId
    || (!localMockActor && !authenticatedLocalActor)
  ) {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'The private exact-edit runtime actor is not authorized for this scope.',
      403,
    )
  }
}

function isExplicitLocalRuntime(env: RuntimeEnv): boolean {
  return env.nodeEnv !== 'production'
    && (env.mode === 'local' || env.mode === 'mock')
    && env.storageMode === 'local'
}

function unavailable(reason: string): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    'Current Edit Preferences cannot be applied until the canonical transactional runtime is available.',
    503,
    {
      reason,
      persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
      requiredGates: [
        'canonical_exact_edit_authority_read_rpc',
        'canonical_atomic_exact_edit_apply_rpc',
        'two_user_two_workspace_rls',
        'same_release_server_runtime',
      ],
      localFallbackAllowedInHostedRuntime: false,
      callerAssertionsCanPromoteProduction: false,
      productionReady: false,
    },
  )
}
