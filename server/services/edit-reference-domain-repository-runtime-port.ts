import type { ServiceContext } from '../types'
import { ApiError } from '../errors/api-error'
import { DisabledSupabaseEditReferenceRepository } from '../edit-references/disabled-supabase-edit-reference-repository'
import {
  type EditReferenceRepository,
} from '../edit-references/edit-reference-repository'
import { assertEditReferenceLocalSupabaseDomainRepository } from '../edit-references/edit-reference-local-supabase-domain-repository'
import { PrivateEditReferenceRepository } from '../edit-references/private-edit-reference-repository'

export const EDIT_REFERENCE_DOMAIN_REPOSITORY_RUNTIME_PORT_VERSION =
  'edit-reference-domain-repository-runtime-port-v1' as const

export type EditReferenceDomainRepositorySourceAuthority =
  | 'backend_local_private_repository'
  | 'canonical_v3_local_repository'
  | 'canonical_edit_reference_v6_repository'
  | 'unavailable'

export type EditReferenceDomainRepositoryEvidenceClass =
  | 'backend_local_private_only'
  | 'canonical_v3_local_only'
  | 'canonical_backend_verified_runtime'
  | 'blocked_missing_canonical_repository'

export interface EditReferenceDomainRepositoryRuntimePort {
  readonly schemaVersion: typeof EDIT_REFERENCE_DOMAIN_REPOSITORY_RUNTIME_PORT_VERSION
  readonly authorityClass: 'canonical_edit_reference_domain_repository'
  readonly sourceAuthority: EditReferenceDomainRepositorySourceAuthority
  readonly evidenceClass: EditReferenceDomainRepositoryEvidenceClass
  readonly repository: EditReferenceRepository
  readonly productionAuthority: boolean
  readonly browserSelectable: false
  readonly privateFallbackAllowedInHostedRuntime: false
  readonly databaseTransactionAdapterVerified: boolean
  readonly authenticatedTenantRlsVerified: boolean
  readonly durableIdempotencyAndCasVerified: boolean
  readonly crossDeviceReadbackVerified: boolean
  readonly sameReleaseEvidenceVerified: boolean
}

export interface ResolveEditReferenceDomainRepositoryRuntimePortInput {
  readonly context: ServiceContext
  readonly runtimePort?: EditReferenceDomainRepositoryRuntimePort
  readonly localRepository?: EditReferenceRepository
}

const qualifiedProductionRepositoryPorts = new WeakSet<EditReferenceDomainRepositoryRuntimePort>()
const qualifiedLocalCanonicalRepositoryPorts = new WeakSet<EditReferenceDomainRepositoryRuntimePort>()

export function resolveEditReferenceDomainRepositoryRuntimePort(
  input: ResolveEditReferenceDomainRepositoryRuntimePortInput,
): EditReferenceDomainRepositoryRuntimePort {
  if (input.runtimePort && input.localRepository) {
    throw invalidRepositoryRuntime('runtime_port_and_local_repository_mixed')
  }

  if (
    input.runtimePort
    && qualifiedLocalCanonicalRepositoryPorts.has(input.runtimePort)
    && isExplicitCanonicalV3LocalRepositoryRuntime(input.context)
  ) {
    assertPortShape(input.runtimePort)
    assertQualifiedLocalCanonicalRepositoryPort(input.runtimePort)
    return input.runtimePort
  }

  if (isExplicitBackendLocalRepositoryRuntime(input.context)) {
    if (!input.runtimePort) {
      return createBackendLocalEditReferenceDomainRepositoryRuntimePort({
        repository: input.localRepository,
      })
    }
    assertPortShape(input.runtimePort)
    if (
      input.runtimePort.sourceAuthority !== 'backend_local_private_repository'
      || input.runtimePort.evidenceClass !== 'backend_local_private_only'
      || input.runtimePort.repository.persistence !== 'backend_local_private'
      || input.runtimePort.productionAuthority
      || input.runtimePort.databaseTransactionAdapterVerified
      || input.runtimePort.authenticatedTenantRlsVerified
      || input.runtimePort.durableIdempotencyAndCasVerified
      || input.runtimePort.crossDeviceReadbackVerified
      || input.runtimePort.sameReleaseEvidenceVerified
      || qualifiedProductionRepositoryPorts.has(input.runtimePort)
    ) throw invalidRepositoryRuntime('local_domain_repository_port_authority_invalid')
    return input.runtimePort
  }

  if (input.localRepository) {
    throw invalidRepositoryRuntime('hosted_runtime_cannot_mount_local_domain_repository')
  }
  if (!input.runtimePort) return createBlockedEditReferenceDomainRepositoryRuntimePort()

  assertPortShape(input.runtimePort)
  assertQualifiedProductionRepositoryPort(input.runtimePort)
  return input.runtimePort
}

export function createCanonicalV3LocalEditReferenceDomainRepositoryRuntimePort(input: {
  readonly repository: EditReferenceRepository
}): EditReferenceDomainRepositoryRuntimePort {
  assertEditReferenceLocalSupabaseDomainRepository(input.repository)
  const port: EditReferenceDomainRepositoryRuntimePort = Object.freeze({
    schemaVersion: EDIT_REFERENCE_DOMAIN_REPOSITORY_RUNTIME_PORT_VERSION,
    authorityClass: 'canonical_edit_reference_domain_repository',
    sourceAuthority: 'canonical_v3_local_repository',
    evidenceClass: 'canonical_v3_local_only',
    repository: input.repository,
    productionAuthority: false,
    browserSelectable: false,
    privateFallbackAllowedInHostedRuntime: false,
    databaseTransactionAdapterVerified: true,
    authenticatedTenantRlsVerified: true,
    durableIdempotencyAndCasVerified: true,
    crossDeviceReadbackVerified: true,
    sameReleaseEvidenceVerified: false,
  })
  qualifiedLocalCanonicalRepositoryPorts.add(port)
  assertPortShape(port)
  return port
}

export function createBackendLocalEditReferenceDomainRepositoryRuntimePort(input: {
  readonly repository?: EditReferenceRepository
} = {}): EditReferenceDomainRepositoryRuntimePort {
  const repository = input.repository ?? new PrivateEditReferenceRepository()
  if (repository.persistence !== 'backend_local_private') {
    throw invalidRepositoryRuntime('local_domain_repository_persistence_invalid')
  }
  const port: EditReferenceDomainRepositoryRuntimePort = {
    schemaVersion: EDIT_REFERENCE_DOMAIN_REPOSITORY_RUNTIME_PORT_VERSION,
    authorityClass: 'canonical_edit_reference_domain_repository',
    sourceAuthority: 'backend_local_private_repository',
    evidenceClass: 'backend_local_private_only',
    repository,
    productionAuthority: false,
    browserSelectable: false,
    privateFallbackAllowedInHostedRuntime: false,
    databaseTransactionAdapterVerified: false,
    authenticatedTenantRlsVerified: false,
    durableIdempotencyAndCasVerified: false,
    crossDeviceReadbackVerified: false,
    sameReleaseEvidenceVerified: false,
  }
  assertPortShape(port)
  return Object.freeze(port)
}

export function editReferenceDomainRepositoryRuntimeWarnings(
  port: EditReferenceDomainRepositoryRuntimePort,
): string[] {
  assertPortShape(port)
  const executionBoundary =
    'No generation, render, customer-credit mutation, deployment, or public delivery ran. Any private provider/model or local media execution is reported per skill run with exact provenance and internal-cost evidence.'
  if (port.sourceAuthority === 'backend_local_private_repository') {
    return [
      'Stored in the private backend-local Edit Reference repository. Production Supabase persistence remains blocked.',
      executionBoundary,
    ]
  }
  if (port.sourceAuthority === 'canonical_v3_local_repository') {
    return [
      'Verified against the isolated canonical V3 local Supabase reset. Remote and production persistence remain blocked.',
      executionBoundary,
    ]
  }
  if (port.sourceAuthority === 'canonical_edit_reference_v6_repository') {
    return [executionBoundary]
  }
  return [
    'Canonical Edit Reference persistence is unavailable. No private fallback is allowed in hosted runtime.',
    executionBoundary,
  ]
}

export function assertEditReferenceDomainRepositoryRuntimePortIsNotProduction(
  port: EditReferenceDomainRepositoryRuntimePort,
): void {
  assertPortShape(port)
  if (
    port.productionAuthority
    || port.evidenceClass === 'canonical_backend_verified_runtime'
    || port.sourceAuthority === 'canonical_edit_reference_v6_repository'
    || qualifiedProductionRepositoryPorts.has(port)
  ) throw invalidRepositoryRuntime('domain_repository_port_unexpectedly_has_production_authority')
}

function createBlockedEditReferenceDomainRepositoryRuntimePort(): EditReferenceDomainRepositoryRuntimePort {
  const port: EditReferenceDomainRepositoryRuntimePort = {
    schemaVersion: EDIT_REFERENCE_DOMAIN_REPOSITORY_RUNTIME_PORT_VERSION,
    authorityClass: 'canonical_edit_reference_domain_repository',
    sourceAuthority: 'unavailable',
    evidenceClass: 'blocked_missing_canonical_repository',
    repository: new DisabledSupabaseEditReferenceRepository(),
    productionAuthority: false,
    browserSelectable: false,
    privateFallbackAllowedInHostedRuntime: false,
    databaseTransactionAdapterVerified: false,
    authenticatedTenantRlsVerified: false,
    durableIdempotencyAndCasVerified: false,
    crossDeviceReadbackVerified: false,
    sameReleaseEvidenceVerified: false,
  }
  assertPortShape(port)
  return Object.freeze(port)
}

function assertQualifiedProductionRepositoryPort(
  port: EditReferenceDomainRepositoryRuntimePort,
): void {
  if (
    port.sourceAuthority !== 'canonical_edit_reference_v6_repository'
    || port.evidenceClass !== 'canonical_backend_verified_runtime'
    || port.repository.persistence !== 'canonical_supabase_transactional'
    || !port.productionAuthority
    || !port.databaseTransactionAdapterVerified
    || !port.authenticatedTenantRlsVerified
    || !port.durableIdempotencyAndCasVerified
    || !port.crossDeviceReadbackVerified
    || !port.sameReleaseEvidenceVerified
    || !qualifiedProductionRepositoryPorts.has(port)
  ) throw invalidRepositoryRuntime('canonical_domain_repository_not_release_qualified')
}

function assertQualifiedLocalCanonicalRepositoryPort(
  port: EditReferenceDomainRepositoryRuntimePort,
): void {
  if (
    port.sourceAuthority !== 'canonical_v3_local_repository'
    || port.evidenceClass !== 'canonical_v3_local_only'
    || port.repository.persistence !== 'canonical_supabase_transactional'
    || port.productionAuthority
    || !port.databaseTransactionAdapterVerified
    || !port.authenticatedTenantRlsVerified
    || !port.durableIdempotencyAndCasVerified
    || !port.crossDeviceReadbackVerified
    || port.sameReleaseEvidenceVerified
    || qualifiedProductionRepositoryPorts.has(port)
    || !qualifiedLocalCanonicalRepositoryPorts.has(port)
  ) throw invalidRepositoryRuntime('local_canonical_domain_repository_port_authority_invalid')
  assertEditReferenceLocalSupabaseDomainRepository(port.repository)
}

function assertPortShape(port: EditReferenceDomainRepositoryRuntimePort): void {
  if (
    port.schemaVersion !== EDIT_REFERENCE_DOMAIN_REPOSITORY_RUNTIME_PORT_VERSION
    || port.authorityClass !== 'canonical_edit_reference_domain_repository'
    || !port.repository
    || typeof port.repository.read !== 'function'
    || typeof port.repository.readAuditEvents !== 'function'
    || typeof port.repository.mutate !== 'function'
    || !['backend_local_private', 'canonical_supabase_transactional', 'supabase_blocked']
      .includes(port.repository.persistence)
    || typeof port.productionAuthority !== 'boolean'
    || port.browserSelectable !== false
    || port.privateFallbackAllowedInHostedRuntime !== false
    || typeof port.databaseTransactionAdapterVerified !== 'boolean'
    || typeof port.authenticatedTenantRlsVerified !== 'boolean'
    || typeof port.durableIdempotencyAndCasVerified !== 'boolean'
    || typeof port.crossDeviceReadbackVerified !== 'boolean'
    || typeof port.sameReleaseEvidenceVerified !== 'boolean'
  ) throw invalidRepositoryRuntime('domain_repository_runtime_port_shape_invalid')
}

function isExplicitBackendLocalRepositoryRuntime(context: ServiceContext): boolean {
  return context.auth?.isMockUser === true
    && context.env.allowMockWithoutSupabase
    && context.env.nodeEnv !== 'production'
    && (context.env.mode === 'local' || context.env.mode === 'mock')
    && context.env.storageMode === 'local'
}

function isExplicitCanonicalV3LocalRepositoryRuntime(context: ServiceContext): boolean {
  return context.env.allowMockWithoutSupabase
    && context.env.nodeEnv !== 'production'
    && (context.env.mode === 'local' || context.env.mode === 'mock')
    && context.env.storageMode === 'local'
}

function invalidRepositoryRuntime(reason: string): ApiError {
  return new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The canonical Edit Reference repository authority is unavailable or unsafe.',
    503,
    {
      reason,
      requiredGate: 'canonical_persistence',
      localFallbackAllowedInHostedRuntime: false,
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}
