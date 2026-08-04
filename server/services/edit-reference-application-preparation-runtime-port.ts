import type { RuntimeEnv } from '../config/env'
import type {
  EditReferenceApplicationPreparationIntent,
  EditReferenceApplicationPreparationReceipt,
} from '../../src/types/edit-reference-production-application-preparation-api'
import { EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION } from '../edit-references/edit-reference-production-persistence-contract'
import { ApiError } from '../errors/api-error'

export const EDIT_REFERENCE_APPLICATION_PREPARATION_RUNTIME_PORT_VERSION =
  'edit-reference-application-preparation-runtime-port-v1' as const

export interface EditReferenceApplicationPreparationRuntimeActor {
  readonly actorUserId: string
  readonly authenticatedAccessToken: string | null
  readonly mockActor: boolean
  readonly localStorageRoot: string
}

export interface EditReferenceApplicationPreparationRuntimePort {
  readonly schemaVersion: typeof EDIT_REFERENCE_APPLICATION_PREPARATION_RUNTIME_PORT_VERSION
  readonly persistenceContractVersion: typeof EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
  readonly authorityClass: 'canonical_preference_application_preparation'
  readonly runtimeClass: 'controlled_local_contract' | 'canonical_backend_verified_runtime'
  readonly evidenceClass: 'isolated_local_contract_unreleased' | 'canonical_same_release_live_runtime'
    | 'isolated_local_supabase_rls_verified'
  readonly sourceAuthority:
    | 'controlled_local_reference_study_repository'
    | 'canonical_v3_local_supabase_rls'
    | 'canonical_edit_reference_production_repository'
  readonly tenantIsolationVerified: boolean
  readonly canonicalReferenceDnaQaAndTargetStudyReadVerified: boolean
  readonly durableIdempotentPreparationVerified: boolean
  readonly canonicalPreparedApplicationWriteVerified: boolean
  readonly browserApplicationRecordAccepted: false
  readonly noLegacyApplicationMutationFallback: true
  readonly applicationLifecycleMutationMade: false
  readonly providerOrWorkerExecutionStarted: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly sameReleaseReadinessEvidenceVerified: boolean
  readonly productionAuthority: boolean
  prepare(input: {
    readonly actor: EditReferenceApplicationPreparationRuntimeActor
    readonly projectId: string
    readonly editSessionId: string
    readonly intent: EditReferenceApplicationPreparationIntent
    readonly idempotencyKeyHashSha256: string
    readonly preparationRequestDigestSha256: string
  }): Promise<EditReferenceApplicationPreparationReceipt>
}

const qualifiedProductionPorts = new WeakSet<EditReferenceApplicationPreparationRuntimePort>()

export function resolveEditReferenceApplicationPreparationRuntimePort(input: {
  readonly env: RuntimeEnv
  readonly port?: EditReferenceApplicationPreparationRuntimePort
}): EditReferenceApplicationPreparationRuntimePort {
  if (!input.port) throw unavailable('canonical_application_preparation_runtime_missing')
  validatePortShape(input.port)
  if (isExplicitLocalRuntime(input.env)) {
    const controlledContract =
      input.port.runtimeClass === 'controlled_local_contract'
      && input.port.evidenceClass === 'isolated_local_contract_unreleased'
      && input.port.sourceAuthority === 'controlled_local_reference_study_repository'
      && !input.port.tenantIsolationVerified
      && !input.port.durableIdempotentPreparationVerified
      && !input.port.canonicalPreparedApplicationWriteVerified
    const canonicalLocalDatabase =
      input.port.runtimeClass === 'controlled_local_contract'
      && input.port.evidenceClass === 'isolated_local_supabase_rls_verified'
      && input.port.sourceAuthority === 'canonical_v3_local_supabase_rls'
      && input.port.tenantIsolationVerified
      && input.port.canonicalReferenceDnaQaAndTargetStudyReadVerified
      && input.port.durableIdempotentPreparationVerified
      && input.port.canonicalPreparedApplicationWriteVerified
    if (
      (!controlledContract && !canonicalLocalDatabase)
      || input.port.productionAuthority
      || input.port.sameReleaseReadinessEvidenceVerified
      || qualifiedProductionPorts.has(input.port)
    ) throw unavailable('local_application_preparation_runtime_claimed_production')
    return input.port
  }
  if (
    input.port.runtimeClass !== 'canonical_backend_verified_runtime'
    || input.port.evidenceClass !== 'canonical_same_release_live_runtime'
    || input.port.sourceAuthority !== 'canonical_edit_reference_production_repository'
    || !input.port.tenantIsolationVerified
    || !input.port.canonicalReferenceDnaQaAndTargetStudyReadVerified
    || !input.port.durableIdempotentPreparationVerified
    || !input.port.canonicalPreparedApplicationWriteVerified
    || !input.port.sameReleaseReadinessEvidenceVerified
    || !input.port.productionAuthority
    || !qualifiedProductionPorts.has(input.port)
  ) throw unavailable('canonical_application_preparation_runtime_not_release_qualified')
  return input.port
}

export function assertEditReferenceApplicationPreparationRuntimePortIsNotProduction(
  port: EditReferenceApplicationPreparationRuntimePort,
): void {
  validatePortShape(port)
  if (
    port.productionAuthority
    || port.runtimeClass === 'canonical_backend_verified_runtime'
    || port.evidenceClass === 'canonical_same_release_live_runtime'
    || qualifiedProductionPorts.has(port)
  ) throw unavailable('application_preparation_runtime_unexpectedly_production')
}

function validatePortShape(port: EditReferenceApplicationPreparationRuntimePort): void {
  if (
    port.schemaVersion !== EDIT_REFERENCE_APPLICATION_PREPARATION_RUNTIME_PORT_VERSION
    || port.persistenceContractVersion !== EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
    || port.authorityClass !== 'canonical_preference_application_preparation'
    || typeof port.tenantIsolationVerified !== 'boolean'
    || typeof port.canonicalReferenceDnaQaAndTargetStudyReadVerified !== 'boolean'
    || typeof port.durableIdempotentPreparationVerified !== 'boolean'
    || typeof port.canonicalPreparedApplicationWriteVerified !== 'boolean'
    || port.browserApplicationRecordAccepted !== false
    || port.noLegacyApplicationMutationFallback !== true
    || port.applicationLifecycleMutationMade !== false
    || port.providerOrWorkerExecutionStarted !== false
    || port.customerPriceCalculated !== false
    || port.customerCreditsMutated !== false
    || port.serviceFeeIncluded !== false
    || typeof port.sameReleaseReadinessEvidenceVerified !== 'boolean'
    || typeof port.productionAuthority !== 'boolean'
    || typeof port.prepare !== 'function'
  ) throw unavailable('canonical_application_preparation_runtime_shape_invalid')
}

function isExplicitLocalRuntime(env: RuntimeEnv): boolean {
  return env.nodeEnv !== 'production'
    && (env.mode === 'local' || env.mode === 'mock')
    && env.storageMode === 'local'
}

function unavailable(reason: string): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    'Edit Reference guidance cannot be prepared until the canonical application authority is available.',
    503,
    {
      reason,
      requiredGates: [
        'canonical_reference_dna_qa_target_study_read',
        'durable_idempotent_application_preparation',
        'canonical_prepared_application_write',
        'same_release_server_runtime',
      ],
      browserApplicationRecordAccepted: false,
      localFallbackAllowedInHostedRuntime: false,
      productionReady: false,
    },
  )
}
