import type { RuntimeEnv } from '../config/env'
import {
  EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
} from '../edit-references/edit-reference-production-persistence-contract'
import type {
  EditReferenceProductionExactEditApplyAuthorityRead,
  EditReferenceProductionExactEditApplyApiReceipt,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import type {
  EditReferenceProductionExactEditApplyAuthorityReadScope,
  EditReferenceProductionExactEditApplyRequest,
} from '../edit-references/edit-reference-production-exact-edit-apply-boundary'
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
  readonly authorityClass: 'canonical_exact_edit_preferences_and_reference_apply'
  readonly runtimeClass:
    | 'controlled_local_contract'
    | 'canonical_backend_verified_runtime'
  readonly evidenceClass:
    | 'isolated_local_rls_proof_unreleased'
    | 'canonical_same_release_live_runtime'
  readonly sourceAuthority:
    | 'canonical_v3_local_supabase_rls'
    | 'canonical_edit_reference_production_repository'
  readonly canonicalAuthorityReadRpcVerified: boolean
  readonly canonicalAtomicApplyRpcVerified: boolean
  readonly twoUserTwoWorkspaceRlsVerified: boolean
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

export function resolveEditReferenceExactEditApplyRuntimePort(input: {
  readonly env: RuntimeEnv
  readonly port?: EditReferenceExactEditApplyRuntimePort
}): EditReferenceExactEditApplyRuntimePort {
  const local = isExplicitLocalRuntime(input.env)
  if (!input.port) throw unavailable('canonical_exact_edit_apply_runtime_missing')
  assertPortShape(input.port)

  if (local) {
    if (
      input.port.runtimeClass !== 'controlled_local_contract'
      || input.port.evidenceClass !== 'isolated_local_rls_proof_unreleased'
      || input.port.sourceAuthority !== 'canonical_v3_local_supabase_rls'
      || input.port.productionAuthority
      || input.port.sameReleaseReadinessEvidenceVerified
      || qualifiedProductionPorts.has(input.port)
    ) throw unavailable('local_exact_edit_apply_runtime_claimed_production')
    return input.port
  }

  if (
    input.port.runtimeClass !== 'canonical_backend_verified_runtime'
    || input.port.evidenceClass !== 'canonical_same_release_live_runtime'
    || input.port.sourceAuthority !== 'canonical_edit_reference_production_repository'
    || !input.port.canonicalAuthorityReadRpcVerified
    || !input.port.canonicalAtomicApplyRpcVerified
    || !input.port.twoUserTwoWorkspaceRlsVerified
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
    || port.authorityClass !== 'canonical_exact_edit_preferences_and_reference_apply'
    || typeof port.canonicalAuthorityReadRpcVerified !== 'boolean'
    || typeof port.canonicalAtomicApplyRpcVerified !== 'boolean'
    || typeof port.twoUserTwoWorkspaceRlsVerified !== 'boolean'
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
