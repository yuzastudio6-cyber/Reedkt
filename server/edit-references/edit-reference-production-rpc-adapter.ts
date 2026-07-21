import { createHash } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import {
  EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC,
  validateEditReferenceProductionApplicationLifecycleReceipt,
  validateEditReferenceProductionApplicationLifecycleRequest,
  type EditReferenceProductionApplicationLifecycleReceipt,
  type EditReferenceProductionApplicationLifecycleRequest,
} from './edit-reference-production-application-lifecycle'
import {
  EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
  editReferenceProductionPersistenceContract,
} from './edit-reference-production-persistence-contract'
import {
  EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION,
  validateEditReferenceProductionPlanningAuthorityReadResult,
  type EditReferenceProductionPlanningAuthorityReadResult,
  type EditReferenceProductionPlanningAuthorityReader,
  type EditReferenceProductionPlanningAuthorityScope,
} from './edit-reference-production-planning-authority'

export const EDIT_REFERENCE_PRODUCTION_RPC_ADAPTER_VERSION =
  'edit-reference-production-rpc-adapter-v1' as const

export const EDIT_REFERENCE_PRODUCTION_RPC_CONTRACT_FIXTURE_CAPABILITY_VERSION =
  'edit-reference-production-rpc-contract-fixture-capability-v1' as const

export const EDIT_REFERENCE_PRODUCTION_RPC_REGISTRY = Object.freeze({
  schemaVersion: 'edit-reference-production-rpc-registry-v1' as const,
  targetDatabase: 'postgres_via_server_only_supabase_rpc' as const,
  functions: {
    mutateApplicationLifecycle: EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC,
    readExactApplicationState:
      editReferenceProductionPersistenceContract.planningAuthorityRead.name,
  },
  oneRpcCallPerOperation: true as const,
  responseShape: 'single_row_array' as const,
  automaticTransportRetryAllowed: false as const,
  callerSelectedRpcFunctionAllowed: false as const,
  rawSqlAccepted: false as const,
  browserOrFrontendClientAllowed: false as const,
  serviceRoleCredentialAcceptedAsMethodInput: false as const,
})

export interface EditReferenceProductionRpcClientResult {
  readonly data: unknown
  readonly error: unknown
}

export interface EditReferenceProductionRpcClient {
  rpc(
    functionName: string,
    parameters: Readonly<Record<string, unknown>>,
  ): PromiseLike<EditReferenceProductionRpcClientResult>
}

export interface EditReferenceProductionRpcContractFixtureCapability {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_RPC_CONTRACT_FIXTURE_CAPABILITY_VERSION
  readonly purpose: 'injected_rpc_contract_fixture_only'
  readonly persistenceContractVersion: typeof EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
  readonly liveSupabaseOrPostgresCallAllowed: false
  readonly remoteDatabaseMutationAllowed: false
  readonly productionAuthority: false
  readonly capabilityDigestSha256: string
}

export interface EditReferenceProductionRpcContractFixtureAdapter {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_RPC_ADAPTER_VERSION
  readonly source: 'injected_rpc_contract_fixture'
  readonly planningAuthorityReader: EditReferenceProductionPlanningAuthorityReader
  mutateApplicationLifecycle(
    request: EditReferenceProductionApplicationLifecycleRequest,
  ): Promise<EditReferenceProductionApplicationLifecycleReceipt>
  readonly liveSupabaseOrPostgresCallAllowed: false
  readonly remoteDatabaseMutationAllowed: false
  readonly productionAuthority: false
}

const capabilityBrands = new WeakSet<object>()
const capabilityClients = new WeakMap<object, EditReferenceProductionRpcClient>()
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/

export function createEditReferenceProductionRpcContractFixtureCapability(
  client: EditReferenceProductionRpcClient,
): EditReferenceProductionRpcContractFixtureCapability {
  if (!client || typeof client.rpc !== 'function') invalid('rpc_fixture_client_invalid')
  const payload = {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_RPC_CONTRACT_FIXTURE_CAPABILITY_VERSION,
    purpose: 'injected_rpc_contract_fixture_only' as const,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    liveSupabaseOrPostgresCallAllowed: false as const,
    remoteDatabaseMutationAllowed: false as const,
    productionAuthority: false as const,
  }
  const capability = Object.freeze({
    ...payload,
    capabilityDigestSha256: sha256(payload),
  })
  capabilityBrands.add(capability)
  capabilityClients.set(capability, client)
  return capability
}

/**
 * Builds only a process-branded contract-fixture adapter. There is
 * intentionally no production factory while the canonical migration chain,
 * reviewed RPCs, live RLS, and same-source deployment evidence are missing.
 */
export function createEditReferenceProductionRpcContractFixtureAdapter(input: {
  readonly client: EditReferenceProductionRpcClient
  readonly capability: EditReferenceProductionRpcContractFixtureCapability
}): EditReferenceProductionRpcContractFixtureAdapter {
  validateCapability(input.capability, input.client)
  const planningAuthorityReader: EditReferenceProductionPlanningAuthorityReader = {
    readExactApplicationState: (scope) => invokeReadState(input.client, scope),
  }
  return Object.freeze({
    schemaVersion: EDIT_REFERENCE_PRODUCTION_RPC_ADAPTER_VERSION,
    source: 'injected_rpc_contract_fixture' as const,
    planningAuthorityReader,
    mutateApplicationLifecycle: (
      request: EditReferenceProductionApplicationLifecycleRequest,
    ) => invokeLifecycleMutation(input.client, request),
    liveSupabaseOrPostgresCallAllowed: false as const,
    remoteDatabaseMutationAllowed: false as const,
    productionAuthority: false as const,
  })
}

export function assertEditReferenceProductionRpcAdapterIsNotProduction(
  adapter: EditReferenceProductionRpcContractFixtureAdapter,
): never {
  void adapter
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The Edit Reference RPC contract fixture cannot authorize production persistence.',
    503,
    {
      requiredGate: 'reviewed_live_edit_reference_rpc_adapter_activation',
      migrationBaseline: 'blocked_by_parallel_foundations',
      remoteMutationAttempted: false,
    },
  )
}

async function invokeLifecycleMutation(
  client: EditReferenceProductionRpcClient,
  request: EditReferenceProductionApplicationLifecycleRequest,
): Promise<EditReferenceProductionApplicationLifecycleReceipt> {
  validateEditReferenceProductionApplicationLifecycleRequest(request)
  const result = await invokeExactlyOnce(
    client,
    EDIT_REFERENCE_PRODUCTION_RPC_REGISTRY.functions.mutateApplicationLifecycle,
    {
      p_contract_version: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
      p_request: request,
    },
  )
  const receipt = normalizeSingleRow(result.data) as EditReferenceProductionApplicationLifecycleReceipt
  validateEditReferenceProductionApplicationLifecycleReceipt({ request, receipt })
  return structuredClone(receipt)
}

async function invokeReadState(
  client: EditReferenceProductionRpcClient,
  scope: EditReferenceProductionPlanningAuthorityScope,
): Promise<EditReferenceProductionPlanningAuthorityReadResult> {
  validateScope(scope)
  const result = await invokeExactlyOnce(
    client,
    EDIT_REFERENCE_PRODUCTION_RPC_REGISTRY.functions.readExactApplicationState,
    {
      p_contract_version: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
      p_read_version: EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION,
      p_scope: scope,
    },
  )
  const read = normalizeSingleRow(result.data) as EditReferenceProductionPlanningAuthorityReadResult
  validateEditReferenceProductionPlanningAuthorityReadResult(read)
  return structuredClone(read)
}

async function invokeExactlyOnce(
  client: EditReferenceProductionRpcClient,
  functionName: string,
  parameters: Readonly<Record<string, unknown>>,
): Promise<EditReferenceProductionRpcClientResult> {
  let result: EditReferenceProductionRpcClientResult
  try {
    result = await client.rpc(functionName, parameters)
  } catch (error) {
    throw sanitizedRpcError(functionName, error)
  }
  if (!result || typeof result !== 'object' || result.error) {
    throw sanitizedRpcError(functionName, result?.error)
  }
  return result
}

function normalizeSingleRow(data: unknown): unknown {
  if (!Array.isArray(data)) invalid('rpc_response_shape_invalid')
  if (data.length !== 1) invalid('rpc_response_cardinality_invalid')
  return data[0]
}

function validateCapability(
  capability: EditReferenceProductionRpcContractFixtureCapability,
  client: EditReferenceProductionRpcClient,
): void {
  if (
    !capabilityBrands.has(capability)
    || capabilityClients.get(capability) !== client
  ) invalid('rpc_fixture_capability_invalid')
  const { capabilityDigestSha256, ...payload } = capability
  if (
    capability.schemaVersion !== EDIT_REFERENCE_PRODUCTION_RPC_CONTRACT_FIXTURE_CAPABILITY_VERSION
    || capability.purpose !== 'injected_rpc_contract_fixture_only'
    || capability.persistenceContractVersion !== EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION
    || capability.liveSupabaseOrPostgresCallAllowed !== false
    || capability.remoteDatabaseMutationAllowed !== false
    || capability.productionAuthority !== false
    || !SHA256_PATTERN.test(capabilityDigestSha256)
    || capabilityDigestSha256 !== sha256(payload)
  ) invalid('rpc_fixture_capability_integrity_invalid')
}

function validateScope(scope: EditReferenceProductionPlanningAuthorityScope): void {
  for (const value of [scope.actorUserId, scope.workspaceId, scope.projectId, scope.editSessionId]) {
    if (!ID_PATTERN.test(value)) invalid('rpc_read_scope_invalid')
  }
}

function sanitizedRpcError(functionName: string, error: unknown): ApiError {
  const record = error && typeof error === 'object'
    ? error as Record<string, unknown>
    : undefined
  return new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The Edit Reference database transaction did not return validated atomic evidence.',
    503,
    {
      rpcFunctionId: functionName,
      errorEvidenceDigestSha256: sha256({
        schemaVersion: 'edit-reference-production-rpc-error-evidence-v1',
        functionName,
        code: safeScalar(record?.code),
        status: safeScalar(record?.status),
        kind: error === null ? 'null' : typeof error,
      }),
      automaticRetryStarted: false,
      remoteMutationAttempted: false,
    },
  )
}

function safeScalar(value: unknown): string | number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return /^[A-Za-z0-9_.:-]{1,80}$/.test(trimmed) ? trimmed : null
}

function sha256(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((entry) => stableJson(entry)).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  const serialized = JSON.stringify(value)
  if (serialized === undefined) invalid('rpc_non_canonical_value')
  return serialized
}

function invalid(reason: string): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The Edit Reference production RPC boundary is unavailable or unsafe.',
    503,
    {
      reason,
      migrationBaseline: 'blocked_by_parallel_foundations',
      remoteMutationAttempted: false,
    },
  )
}
