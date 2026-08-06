import { createHash } from 'node:crypto'
import type {
  EditReferenceProductionExactEditApplyAuthorityRead,
  EditReferenceProductionExactEditApplyApiReceipt,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import type {
  CanonicalExactEditPlanningAuthorityRead,
  CanonicalExactEditPlanningEvidenceRequest,
} from '../../src/types/canonical-exact-edit-planning-authority'
import { ApiError } from '../errors/api-error'
import type {
  EditReferenceProductionApplicationLifecycleReceipt,
  EditReferenceProductionApplicationLifecycleRequest,
} from './edit-reference-production-application-lifecycle'
import { EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION } from './edit-reference-production-persistence-contract'
import {
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_RPC,
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC,
  validateEditReferenceProductionExactEditApplyAuthorityRead,
  validateEditReferenceProductionExactEditApplyAuthorityReadScope,
  validateEditReferenceProductionExactEditApplyReceipt,
  validateEditReferenceProductionExactEditApplyRequest,
  type EditReferenceProductionExactEditApplyAuthorityReadScope,
  type EditReferenceProductionExactEditApplyRequest,
} from './edit-reference-production-exact-edit-apply-boundary'
import type {
  EditReferenceProductionPlanningAuthorityReader,
} from './edit-reference-production-planning-authority'
import {
  CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_CONTRACT,
  CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_RPC,
  CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_RPC,
  validateCanonicalExactEditPlanningAuthorityRead,
  validateCanonicalExactEditPlanningAuthorityReadScope,
  validateCanonicalExactEditPlanningEvidenceRequest,
  type CanonicalExactEditPlanningAuthorityReadScope,
} from './canonical-exact-edit-planning-authority-boundary'
import {
  createEditReferenceProductionRpcContractFixtureAdapter,
  createEditReferenceProductionRpcContractFixtureCapability,
  type EditReferenceProductionRpcClient,
} from './edit-reference-production-rpc-adapter'

export const EDIT_REFERENCE_LOCAL_SUPABASE_RPC_ADAPTER_VERSION =
  'edit-reference-local-supabase-rpc-adapter-v1' as const

export const EDIT_REFERENCE_LOCAL_SUPABASE_RPC_CAPABILITY_VERSION =
  'edit-reference-local-supabase-rpc-capability-v1' as const

export interface EditReferenceLocalSupabaseRpcCapability {
  readonly schemaVersion: typeof EDIT_REFERENCE_LOCAL_SUPABASE_RPC_CAPABILITY_VERSION
  readonly purpose: 'canonical_v3_local_contract_verification_only'
  readonly endpointOrigin: string
  readonly persistenceContractVersion: typeof EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
  readonly loopbackOnly: true
  readonly remoteDatabaseMutationAllowed: false
  readonly productionAuthority: false
  readonly capabilityDigestSha256: string
}

export interface EditReferenceLocalSupabaseRpcAdapter {
  readonly schemaVersion: typeof EDIT_REFERENCE_LOCAL_SUPABASE_RPC_ADAPTER_VERSION
  readonly source: 'canonical_v3_local_supabase_rpc'
  readonly endpointOrigin: string
  readonly planningAuthorityReader: EditReferenceProductionPlanningAuthorityReader
  mutateApplicationLifecycle(
    request: EditReferenceProductionApplicationLifecycleRequest,
  ): Promise<EditReferenceProductionApplicationLifecycleReceipt>
  applyExactEditPreferencesAndReference(
    request: EditReferenceProductionExactEditApplyRequest,
  ): Promise<EditReferenceProductionExactEditApplyApiReceipt>
  readExactEditApplyAuthority(
    scope: EditReferenceProductionExactEditApplyAuthorityReadScope,
  ): Promise<EditReferenceProductionExactEditApplyAuthorityRead>
  readExactEditPlanningAuthority(
    scope: CanonicalExactEditPlanningAuthorityReadScope,
  ): Promise<CanonicalExactEditPlanningAuthorityRead>
  recordExactEditPlanningEvidence(
    request: CanonicalExactEditPlanningEvidenceRequest,
  ): Promise<CanonicalExactEditPlanningAuthorityRead>
  readonly loopbackOnly: true
  readonly remoteDatabaseMutationAllowed: false
  readonly productionAuthority: false
}

const capabilityBrands = new WeakSet<object>()
const capabilityClients = new WeakMap<object, EditReferenceProductionRpcClient>()

export function createEditReferenceLocalSupabaseRpcCapability(input: {
  readonly client: EditReferenceProductionRpcClient
  readonly endpointOrigin: string
}): EditReferenceLocalSupabaseRpcCapability {
  if (!input.client || typeof input.client.rpc !== 'function') invalid('local_rpc_client_invalid')
  const endpointOrigin = assertLoopbackOrigin(input.endpointOrigin)
  const unsigned = {
    schemaVersion: EDIT_REFERENCE_LOCAL_SUPABASE_RPC_CAPABILITY_VERSION,
    purpose: 'canonical_v3_local_contract_verification_only' as const,
    endpointOrigin,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    loopbackOnly: true as const,
    remoteDatabaseMutationAllowed: false as const,
    productionAuthority: false as const,
  }
  const capability = Object.freeze({
    ...unsigned,
    capabilityDigestSha256: sha256(unsigned),
  })
  capabilityBrands.add(capability)
  capabilityClients.set(capability, input.client)
  return capability
}

/**
 * Adapts only a loopback canonical V3 RPC client through the already-reviewed
 * V6 request/receipt validators. It cannot be promoted or used as production
 * database authority.
 */
export function createEditReferenceLocalSupabaseRpcAdapter(input: {
  readonly client: EditReferenceProductionRpcClient
  readonly capability: EditReferenceLocalSupabaseRpcCapability
}): EditReferenceLocalSupabaseRpcAdapter {
  validateCapability(input.capability, input.client)
  const fixtureCapability = createEditReferenceProductionRpcContractFixtureCapability(input.client)
  const validatedDelegate = createEditReferenceProductionRpcContractFixtureAdapter({
    client: input.client,
    capability: fixtureCapability,
  })
  return Object.freeze({
    schemaVersion: EDIT_REFERENCE_LOCAL_SUPABASE_RPC_ADAPTER_VERSION,
    source: 'canonical_v3_local_supabase_rpc' as const,
    endpointOrigin: input.capability.endpointOrigin,
    planningAuthorityReader: validatedDelegate.planningAuthorityReader,
    mutateApplicationLifecycle: (
      request: EditReferenceProductionApplicationLifecycleRequest,
    ) => validatedDelegate.mutateApplicationLifecycle(request),
    applyExactEditPreferencesAndReference: (
      request: EditReferenceProductionExactEditApplyRequest,
    ) => invokeExactEditApply(input.client, request),
    readExactEditApplyAuthority: (
      scope: EditReferenceProductionExactEditApplyAuthorityReadScope,
    ) => invokeExactEditApplyAuthorityRead(input.client, scope),
    readExactEditPlanningAuthority: (
      scope: CanonicalExactEditPlanningAuthorityReadScope,
    ) => invokeExactEditPlanningAuthorityRead(input.client, scope),
    recordExactEditPlanningEvidence: (
      request: CanonicalExactEditPlanningEvidenceRequest,
    ) => invokeExactEditPlanningEvidence(input.client, request),
    loopbackOnly: true as const,
    remoteDatabaseMutationAllowed: false as const,
    productionAuthority: false as const,
  })
}

async function invokeExactEditPlanningAuthorityRead(
  client: EditReferenceProductionRpcClient,
  scope: CanonicalExactEditPlanningAuthorityReadScope,
): Promise<CanonicalExactEditPlanningAuthorityRead> {
  validateCanonicalExactEditPlanningAuthorityReadScope(scope)
  const authority = await invokePlanningAuthorityRpc(
    client,
    CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_RPC,
    {
      p_read_version: CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_CONTRACT,
      p_scope: scope,
    },
    'local_exact_edit_planning_authority_read_rpc_failed',
  )
  validateCanonicalExactEditPlanningAuthorityRead(authority)
  if (
    authority.workspaceId !== scope.workspaceId
    || authority.projectId !== scope.projectId
    || authority.editSessionId !== scope.editSessionId
  ) invalid('local_exact_edit_planning_authority_read_scope_mismatch')
  return structuredClone(authority)
}

async function invokeExactEditPlanningEvidence(
  client: EditReferenceProductionRpcClient,
  request: CanonicalExactEditPlanningEvidenceRequest,
): Promise<CanonicalExactEditPlanningAuthorityRead> {
  validateCanonicalExactEditPlanningEvidenceRequest(request)
  const authority = await invokePlanningAuthorityRpc(
    client,
    CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_RPC,
    { p_request: request },
    'local_exact_edit_planning_evidence_rpc_failed',
  )
  validateCanonicalExactEditPlanningAuthorityRead(authority)
  if (
    authority.workspaceId !== request.workspaceId
    || authority.projectId !== request.projectId
    || authority.editSessionId !== request.editSessionId
    || authority.preferenceRevision !== request.expectedPreferenceRevision
    || authority.planningInputRevision !== request.expectedPlanningInputRevision
    || authority.preferenceFingerprintSha256
      !== request.expectedPreferenceFingerprintSha256
    || authority.baseline.preferenceSnapshotId
      !== request.expectedBaselinePreferenceSnapshotId
    || authority.sourcePreparation.status !== 'ready'
    || authority.sourcePreparation.sourceCandidateHashSha256
      !== request.sourceCandidateHashSha256
    || authority.sourcePreparation.evidenceHashSha256
      !== request.sourcePreparationEvidenceHashSha256
    || authority.frameConfirmation.status !== 'confirmed'
    || authority.frameConfirmation.aspectRatio !== request.confirmedAspectRatio
  ) invalid('local_exact_edit_planning_evidence_scope_mismatch')
  return structuredClone(authority)
}

async function invokePlanningAuthorityRpc(
  client: EditReferenceProductionRpcClient,
  functionName: string,
  args: Record<string, unknown>,
  failureReason: string,
): Promise<CanonicalExactEditPlanningAuthorityRead> {
  let result: Awaited<ReturnType<EditReferenceProductionRpcClient['rpc']>>
  try {
    result = await client.rpc(functionName, args)
  } catch {
    invalid(failureReason)
  }
  if (!result || typeof result !== 'object' || result.error) invalid(failureReason)
  if (!Array.isArray(result.data) || result.data.length !== 1) {
    invalid(`${failureReason}_response_shape_invalid`)
  }
  return result.data[0] as CanonicalExactEditPlanningAuthorityRead
}

async function invokeExactEditApplyAuthorityRead(
  client: EditReferenceProductionRpcClient,
  scope: EditReferenceProductionExactEditApplyAuthorityReadScope,
): Promise<EditReferenceProductionExactEditApplyAuthorityRead> {
  validateEditReferenceProductionExactEditApplyAuthorityReadScope(scope)
  let result: Awaited<ReturnType<EditReferenceProductionRpcClient['rpc']>>
  try {
    result = await client.rpc(
      EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_RPC,
      {
        p_contract_version: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
        p_read_version:
          'edit-reference-production-exact-edit-apply-authority-read-v1',
        p_scope: scope,
      },
    )
  } catch {
    invalid('local_exact_edit_apply_authority_read_rpc_failed')
  }
  if (!result || typeof result !== 'object' || result.error) {
    invalid('local_exact_edit_apply_authority_read_rpc_failed')
  }
  if (!Array.isArray(result.data) || result.data.length !== 1) {
    invalid('local_exact_edit_apply_authority_read_response_shape_invalid')
  }
  const authority = result.data[0] as EditReferenceProductionExactEditApplyAuthorityRead
  validateEditReferenceProductionExactEditApplyAuthorityRead(authority)
  if (
    authority.workspaceId !== scope.workspaceId
    || authority.projectId !== scope.projectId
    || authority.editSessionId !== scope.editSessionId
    || authority.selectedApplicationAuthority?.applicationId
      !== (scope.selectedApplicationId ?? undefined)
  ) invalid('local_exact_edit_apply_authority_read_scope_mismatch')
  return structuredClone(authority)
}

async function invokeExactEditApply(
  client: EditReferenceProductionRpcClient,
  request: EditReferenceProductionExactEditApplyRequest,
): Promise<EditReferenceProductionExactEditApplyApiReceipt> {
  validateEditReferenceProductionExactEditApplyRequest(request)
  let result: Awaited<ReturnType<EditReferenceProductionRpcClient['rpc']>>
  try {
    result = await client.rpc(EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC, {
      p_contract_version: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
      p_request: request,
    })
  } catch {
    invalid('local_exact_edit_apply_rpc_failed')
  }
  if (!result || typeof result !== 'object' || result.error) {
    invalid('local_exact_edit_apply_rpc_failed')
  }
  if (!Array.isArray(result.data) || result.data.length !== 1) {
    invalid('local_exact_edit_apply_rpc_response_shape_invalid')
  }
  const receipt = result.data[0] as EditReferenceProductionExactEditApplyApiReceipt
  validateEditReferenceProductionExactEditApplyReceipt({ request, receipt })
  return structuredClone(receipt)
}

export function assertEditReferenceLocalSupabaseRpcAdapterIsNotProduction(
  adapter: EditReferenceLocalSupabaseRpcAdapter,
): never {
  void adapter
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The canonical V3 local RPC adapter cannot authorize remote or production persistence.',
    503,
    {
      requiredGate: 'reviewed_live_edit_reference_rpc_adapter_activation',
      localResetAndRlsEvidenceOnly: true,
      remoteMutationAttempted: false,
    },
  )
}

function validateCapability(
  capability: EditReferenceLocalSupabaseRpcCapability,
  client: EditReferenceProductionRpcClient,
): void {
  const { capabilityDigestSha256, ...unsigned } = capability
  if (
    !capabilityBrands.has(capability)
    || capabilityClients.get(capability) !== client
    || capability.schemaVersion !== EDIT_REFERENCE_LOCAL_SUPABASE_RPC_CAPABILITY_VERSION
    || capability.purpose !== 'canonical_v3_local_contract_verification_only'
    || capability.endpointOrigin !== assertLoopbackOrigin(capability.endpointOrigin)
    || capability.persistenceContractVersion !== EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
    || capability.loopbackOnly !== true
    || capability.remoteDatabaseMutationAllowed !== false
    || capability.productionAuthority !== false
    || capabilityDigestSha256 !== sha256(unsigned)
  ) invalid('local_rpc_capability_invalid')
}

function assertLoopbackOrigin(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    invalid('local_rpc_endpoint_invalid')
  }
  if (
    url.protocol !== 'http:'
    || !['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
    || url.port !== '57431'
    || url.username
    || url.password
    || url.pathname !== '/'
    || url.search
    || url.hash
  ) invalid('local_rpc_endpoint_not_canonical_loopback')
  return url.origin
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
  if (serialized === undefined) invalid('local_rpc_non_canonical_value')
  return serialized
}

function invalid(reason: string): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The canonical V3 local RPC adapter is unavailable or unsafe.',
    503,
    { reason, remoteMutationAttempted: false },
  )
}
