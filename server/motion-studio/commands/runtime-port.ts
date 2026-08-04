import { ApiError } from '../../errors/api-error'
import type { ServiceContext } from '../../types'
import type { MotionStudioCommandRepository } from './types'

export const MOTION_STUDIO_COMMAND_REPOSITORY_RUNTIME_PORT_VERSION =
  'motion-studio-command-repository-runtime-port-v1' as const

export interface MotionStudioCommandRepositoryRuntimePort {
  readonly schemaVersion:
    typeof MOTION_STUDIO_COMMAND_REPOSITORY_RUNTIME_PORT_VERSION
  readonly authorityClass: 'motion_studio_command_repository'
  readonly sourceAuthority:
    | 'backend_local_private_repository'
    | 'canonical_motion_studio_repository'
  readonly evidenceClass:
    | 'backend_local_private_only'
    | 'canonical_backend_verified_runtime'
  readonly productionAuthority: boolean
  readonly browserSelectable: false
  readonly durableSingleHostPersistenceVerified: boolean
  readonly authenticatedTenantBindingVerified: boolean
  readonly durableIdempotencyAndCasVerified: boolean
  readonly crossDeviceReadbackVerified: boolean
  readonly sameReleaseEvidenceVerified: boolean
  createRepository(context: ServiceContext): MotionStudioCommandRepository
}

const qualifiedPrivateLocalPorts =
  new WeakSet<MotionStudioCommandRepositoryRuntimePort>()
const qualifiedProductionPorts =
  new WeakSet<MotionStudioCommandRepositoryRuntimePort>()

export function createPrivateLocalMotionStudioCommandRepositoryRuntimePort(
  createRepository: (
    context: ServiceContext,
  ) => MotionStudioCommandRepository,
): MotionStudioCommandRepositoryRuntimePort {
  const port: MotionStudioCommandRepositoryRuntimePort = Object.freeze({
    schemaVersion: MOTION_STUDIO_COMMAND_REPOSITORY_RUNTIME_PORT_VERSION,
    authorityClass: 'motion_studio_command_repository',
    sourceAuthority: 'backend_local_private_repository',
    evidenceClass: 'backend_local_private_only',
    productionAuthority: false,
    browserSelectable: false,
    durableSingleHostPersistenceVerified: true,
    authenticatedTenantBindingVerified: true,
    durableIdempotencyAndCasVerified: true,
    crossDeviceReadbackVerified: false,
    sameReleaseEvidenceVerified: false,
    createRepository,
  })
  qualifiedPrivateLocalPorts.add(port)
  assertPortShape(port)
  return port
}

export function resolveMotionStudioCommandRepositoryRuntimePort(
  context: ServiceContext,
): MotionStudioCommandRepository | undefined {
  const port = context.motionStudioCommandRepositoryRuntimePort
  if (!port) return undefined
  assertPortShape(port)

  if (isExplicitPrivateLocalRuntime(context)) {
    if (
      !qualifiedPrivateLocalPorts.has(port)
      || qualifiedProductionPorts.has(port)
      || port.sourceAuthority !== 'backend_local_private_repository'
      || port.evidenceClass !== 'backend_local_private_only'
      || port.productionAuthority
      || !port.durableSingleHostPersistenceVerified
      || !port.authenticatedTenantBindingVerified
      || !port.durableIdempotencyAndCasVerified
      || port.crossDeviceReadbackVerified
      || port.sameReleaseEvidenceVerified
    ) {
      throw invalidRuntime('private_local_motion_repository_unqualified')
    }
    return port.createRepository(context)
  }

  if (
    !qualifiedProductionPorts.has(port)
    || port.sourceAuthority !== 'canonical_motion_studio_repository'
    || port.evidenceClass !== 'canonical_backend_verified_runtime'
    || !port.productionAuthority
    || !port.durableSingleHostPersistenceVerified
    || !port.authenticatedTenantBindingVerified
    || !port.durableIdempotencyAndCasVerified
    || !port.crossDeviceReadbackVerified
    || !port.sameReleaseEvidenceVerified
  ) {
    throw invalidRuntime('canonical_motion_repository_not_release_qualified')
  }
  return port.createRepository(context)
}

export function assertMotionStudioCommandRepositoryRuntimePortIsNotProduction(
  port: MotionStudioCommandRepositoryRuntimePort,
): void {
  assertPortShape(port)
  if (
    port.productionAuthority
    || port.evidenceClass === 'canonical_backend_verified_runtime'
    || port.sourceAuthority === 'canonical_motion_studio_repository'
    || qualifiedProductionPorts.has(port)
  ) {
    throw invalidRuntime('motion_repository_unexpectedly_production_qualified')
  }
}

function assertPortShape(
  port: MotionStudioCommandRepositoryRuntimePort,
): void {
  if (
    port.schemaVersion
      !== MOTION_STUDIO_COMMAND_REPOSITORY_RUNTIME_PORT_VERSION
    || port.authorityClass !== 'motion_studio_command_repository'
    || typeof port.productionAuthority !== 'boolean'
    || port.browserSelectable !== false
    || typeof port.durableSingleHostPersistenceVerified !== 'boolean'
    || typeof port.authenticatedTenantBindingVerified !== 'boolean'
    || typeof port.durableIdempotencyAndCasVerified !== 'boolean'
    || typeof port.crossDeviceReadbackVerified !== 'boolean'
    || typeof port.sameReleaseEvidenceVerified !== 'boolean'
    || typeof port.createRepository !== 'function'
  ) throw invalidRuntime('motion_repository_runtime_port_shape_invalid')
}

function isExplicitPrivateLocalRuntime(context: ServiceContext): boolean {
  return context.env.nodeEnv !== 'production'
    && (context.env.mode === 'local' || context.env.mode === 'mock')
    && context.env.storageMode === 'local'
    && context.env.workerRuntimeMode === 'mock'
}

function invalidRuntime(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Motion Studio command persistence is unavailable in this runtime.',
    503,
    {
      reason,
      productionReady: false,
    },
  )
}
