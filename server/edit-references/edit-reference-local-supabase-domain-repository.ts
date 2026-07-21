import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  EDIT_REFERENCE_DOMAIN_AGGREGATE_READ_CONTRACT_VERSION,
  EDIT_REFERENCE_DOMAIN_AGGREGATE_READ_RPC,
  EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
  EDIT_REFERENCE_DOMAIN_COMMAND_RPC,
  assertEditReferenceDomainCommand,
  editReferenceDomainCommandRequestHash,
  editReferenceDomainCommandWorkspaceId,
} from './edit-reference-domain-command-contract'
import type { EditReferenceProductionRpcClient } from './edit-reference-production-rpc-adapter'
import type {
  EditReferenceAggregate,
  EditReferenceAuditEvent,
  EditReferenceIdempotencyReceipt,
  EditReferenceMutationInput,
  EditReferenceMutationResult,
  EditReferenceRepository,
  EditReferenceRepositoryScope,
} from './edit-reference-repository'
import {
  validateEditReferenceRepositoryAggregate,
  validateEditReferenceRepositoryAuditEvents,
  validateEditReferenceRepositoryReplay,
} from './private-edit-reference-repository'

export const EDIT_REFERENCE_LOCAL_SUPABASE_DOMAIN_REPOSITORY_VERSION =
  'edit-reference-local-supabase-domain-repository-v1' as const

export const EDIT_REFERENCE_LOCAL_SUPABASE_DOMAIN_CAPABILITY_VERSION =
  'edit-reference-local-supabase-domain-capability-v1' as const

export interface EditReferenceLocalSupabaseDomainCapability {
  readonly schemaVersion: typeof EDIT_REFERENCE_LOCAL_SUPABASE_DOMAIN_CAPABILITY_VERSION
  readonly purpose: 'canonical_v3_local_domain_repository_verification_only'
  readonly endpointOrigin: string
  readonly loopbackOnly: true
  readonly remoteDatabaseMutationAllowed: false
  readonly productionAuthority: false
  readonly capabilityDigestSha256: string
}

interface EditReferenceDomainReadResponse {
  readonly aggregate: unknown
  readonly auditEvents: unknown
}

interface EditReferenceDomainMutationResponse extends EditReferenceDomainReadResponse {
  readonly receipt: unknown
  readonly replayed: unknown
}

const capabilityBrands = new WeakSet<object>()
const capabilityClients = new WeakMap<object, EditReferenceProductionRpcClient>()
const repositoryBrands = new WeakSet<object>()
const SHA256_PATTERN = /^[a-f0-9]{64}$/

export function createEditReferenceLocalSupabaseDomainCapability(input: {
  readonly client: EditReferenceProductionRpcClient
  readonly endpointOrigin: string
}): EditReferenceLocalSupabaseDomainCapability {
  if (!input.client || typeof input.client.rpc !== 'function') invalid('local_domain_rpc_client_invalid')
  const endpointOrigin = assertLoopbackOrigin(input.endpointOrigin)
  const unsigned = {
    schemaVersion: EDIT_REFERENCE_LOCAL_SUPABASE_DOMAIN_CAPABILITY_VERSION,
    purpose: 'canonical_v3_local_domain_repository_verification_only' as const,
    endpointOrigin,
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
 * Local-reset proof adapter for the explicit command RPC. It never sends an
 * aggregate replacement and cannot be promoted into hosted authority.
 */
export function createEditReferenceLocalSupabaseDomainRepository(input: {
  readonly client: EditReferenceProductionRpcClient
  readonly capability: EditReferenceLocalSupabaseDomainCapability
}): EditReferenceRepository {
  validateCapability(input.capability, input.client)
  const repository: EditReferenceRepository = Object.freeze({
    persistence: 'canonical_supabase_transactional' as const,
    read: (scope: EditReferenceRepositoryScope) => readAggregate(input.client, scope),
    readAuditEvents: async (scope: EditReferenceRepositoryScope) => {
      const read = await invokeRead(input.client, scope)
      if (!read) return []
      return validateReadResponse(read, scope).auditEvents
    },
    mutate: (mutation: EditReferenceMutationInput) => mutateDomain(
      input.client,
      mutation,
    ),
  })
  repositoryBrands.add(repository)
  return repository
}

export function assertEditReferenceLocalSupabaseDomainRepository(
  repository: EditReferenceRepository,
): void {
  if (
    !repositoryBrands.has(repository)
    || repository.persistence !== 'canonical_supabase_transactional'
  ) invalid('local_domain_repository_brand_invalid')
}

export function assertEditReferenceLocalSupabaseDomainRepositoryIsNotProduction(
  repository: EditReferenceRepository,
): never {
  assertEditReferenceLocalSupabaseDomainRepository(repository)
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The canonical V3 local Edit Reference repository cannot authorize production persistence.',
    503,
    {
      requiredGate: 'reviewed_live_edit_reference_domain_repository_activation',
      localOnly: true,
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}

async function readAggregate(
  client: EditReferenceProductionRpcClient,
  scope: EditReferenceRepositoryScope,
): Promise<EditReferenceAggregate | undefined> {
  const read = await invokeRead(client, scope)
  return read ? validateReadResponse(read, scope).aggregate : undefined
}

async function invokeRead(
  client: EditReferenceProductionRpcClient,
  scope: EditReferenceRepositoryScope,
): Promise<EditReferenceDomainReadResponse | undefined> {
  validateScope(scope)
  const result = await invokeExactlyOnce(client, EDIT_REFERENCE_DOMAIN_AGGREGATE_READ_RPC, {
    p_read_version: EDIT_REFERENCE_DOMAIN_AGGREGATE_READ_CONTRACT_VERSION,
    p_scope: {
      actorUserId: scope.ownerUserId,
      workspaceId: scope.workspaceId,
    },
  })
  if (!Array.isArray(result.data) || result.data.length > 1) {
    invalid('local_domain_read_response_cardinality_invalid')
  }
  if (result.data.length === 0) return undefined
  const response = result.data[0]
  if (!isExactRecord(response, ['aggregate', 'auditEvents'])) {
    invalid('local_domain_read_response_shape_invalid')
  }
  return response as unknown as EditReferenceDomainReadResponse
}

function validateReadResponse(
  response: EditReferenceDomainReadResponse,
  scope: EditReferenceRepositoryScope,
): {
  aggregate: EditReferenceAggregate
  auditEvents: EditReferenceAuditEvent[]
} {
  const aggregate = validateEditReferenceRepositoryAggregate(response.aggregate, scope)
  const auditEvents = validateEditReferenceRepositoryAuditEvents(response.auditEvents)
  if (
    auditEvents.length !== aggregate.auditState.eventCount
    || auditEvents.at(-1)?.sequence !== aggregate.auditState.lastSequence
  ) invalid('local_domain_audit_projection_mismatch')
  return { aggregate, auditEvents }
}

async function mutateDomain(
  client: EditReferenceProductionRpcClient,
  input: EditReferenceMutationInput,
): Promise<EditReferenceMutationResult> {
  validateScope(input.scope)
  if (!input.command) invalid('local_domain_explicit_command_required')
  assertEditReferenceDomainCommand(input.command)
  if (
    input.operation !== input.command.operation
    || editReferenceDomainCommandWorkspaceId(input.command) !== input.scope.workspaceId
    || editReferenceDomainCommandRequestHash(input.command) !== input.requestHash
    || !SHA256_PATTERN.test(input.requestHash)
  ) invalid('local_domain_command_binding_invalid')
  if (
    typeof input.idempotencyKey !== 'string'
    || input.idempotencyKey.length < 8
    || input.idempotencyKey.length > 512
  ) invalid('local_domain_idempotency_key_invalid')

  const idempotencyKeyHashSha256 = sha256(input.idempotencyKey)
  const result = await invokeExactlyOnce(client, EDIT_REFERENCE_DOMAIN_COMMAND_RPC, {
    p_contract_version: EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
    p_actor_user_id: input.scope.ownerUserId,
    p_command: input.command,
    p_idempotency_key_hash_sha256: idempotencyKeyHashSha256,
    p_request_hash_sha256: input.requestHash,
  })
  if (!Array.isArray(result.data) || result.data.length !== 1) {
    invalid('local_domain_mutation_response_cardinality_invalid')
  }
  const response = result.data[0]
  if (!isExactRecord(response, ['aggregate', 'auditEvents', 'receipt', 'replayed'])) {
    invalid('local_domain_mutation_response_shape_invalid')
  }
  const typedResponse = response as unknown as EditReferenceDomainMutationResponse
  if (typeof typedResponse.replayed !== 'boolean') {
    invalid('local_domain_mutation_replay_state_invalid')
  }
  const { aggregate, auditEvents } = validateReadResponse(typedResponse, input.scope)
  void auditEvents
  const receipt = structuredClone(typedResponse.receipt) as EditReferenceIdempotencyReceipt
  if (
    receipt.operation !== input.operation
    || receipt.idempotencyKeyHashSha256 !== idempotencyKeyHashSha256
    || receipt.requestHashSha256 !== input.requestHash
    || receipt.committedRevision > aggregate.revision
  ) invalid('local_domain_mutation_receipt_binding_invalid')

  const data = input.replay({ aggregate, receipt })
  validateEditReferenceRepositoryReplay(data, receipt)
  return {
    data: structuredClone(data),
    replayed: typedResponse.replayed,
  }
}

async function invokeExactlyOnce(
  client: EditReferenceProductionRpcClient,
  functionName: string,
  parameters: Readonly<Record<string, unknown>>,
): Promise<{ readonly data: unknown; readonly error: unknown }> {
  let result: Awaited<ReturnType<EditReferenceProductionRpcClient['rpc']>>
  try {
    result = await client.rpc(functionName, parameters)
  } catch {
    invalid('local_domain_rpc_failed')
  }
  if (result && typeof result === 'object' && result.error) {
    throwMappedRpcError(result.error)
  }
  if (!result || typeof result !== 'object') {
    invalid('local_domain_rpc_failed')
  }
  return result
}

function throwMappedRpcError(error: unknown): never {
  const code = error && typeof error === 'object'
    ? (error as { code?: unknown }).code
    : undefined
  if (code === '42501') {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'The authenticated user cannot access this Edit Reference workspace.',
      403,
      { localOnly: true, remoteMutationAttempted: false, productionReady: false },
    )
  }
  if (code === '40001') {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The Edit Reference changed before this command was committed. Reload and try again.',
      409,
      { localOnly: true, remoteMutationAttempted: false, productionReady: false },
    )
  }
  if (code === '23505') {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'This Edit Reference command key was already used for different input.',
      409,
      { localOnly: true, remoteMutationAttempted: false, productionReady: false },
    )
  }
  if (code === 'P0002') {
    throw new ApiError(
      'EDIT_REFERENCE_NOT_FOUND',
      'The requested Edit Reference record was not found.',
      404,
      { localOnly: true, remoteMutationAttempted: false, productionReady: false },
    )
  }
  invalid('local_domain_rpc_failed')
}

function validateCapability(
  capability: EditReferenceLocalSupabaseDomainCapability,
  client: EditReferenceProductionRpcClient,
): void {
  if (
    !capabilityBrands.has(capability)
    || capabilityClients.get(capability) !== client
  ) invalid('local_domain_capability_brand_invalid')
  const { capabilityDigestSha256, ...unsigned } = capability
  if (
    capability.schemaVersion !== EDIT_REFERENCE_LOCAL_SUPABASE_DOMAIN_CAPABILITY_VERSION
    || capability.purpose !== 'canonical_v3_local_domain_repository_verification_only'
    || capability.loopbackOnly !== true
    || capability.remoteDatabaseMutationAllowed !== false
    || capability.productionAuthority !== false
    || capability.endpointOrigin !== assertLoopbackOrigin(capability.endpointOrigin)
    || capabilityDigestSha256 !== sha256(unsigned)
  ) invalid('local_domain_capability_integrity_invalid')
}

function validateScope(scope: EditReferenceRepositoryScope): void {
  if (
    !isStableId(scope.ownerUserId)
    || !isStableId(scope.workspaceId)
    || typeof scope.localStorageRoot !== 'string'
  ) invalid('local_domain_scope_invalid')
}

function assertLoopbackOrigin(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return invalid('local_domain_endpoint_invalid')
  }
  if (
    url.protocol !== 'http:'
    || !['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
    || url.username
    || url.password
    || url.pathname !== '/'
    || url.search
    || url.hash
  ) invalid('local_domain_endpoint_not_loopback')
  return url.origin
}

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 240
}

function isExactRecord(
  value: unknown,
  expectedKeys: readonly string[],
): value is Record<string, unknown> {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && JSON.stringify(Object.keys(value as Record<string, unknown>).sort())
      === JSON.stringify([...expectedKeys].sort())
}

function sha256(value: unknown): string {
  const source = typeof value === 'string' ? value : stableStringify(value)
  return createHash('sha256').update(source).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
}

function invalid(reason: string): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The canonical V3 local Edit Reference domain transaction could not be verified.',
    503,
    {
      reason,
      localOnly: true,
      browserSuppliedAggregateAccepted: false,
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}
