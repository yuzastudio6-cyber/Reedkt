import type { RuntimeEnv } from '../config/env'
import type { TargetVideoUnderstandingPackage } from '../../src/types/edit-reference-target-video-understanding'
import { ApiError } from '../errors/api-error'
import type {
  TargetVideoUnderstandingBinding,
  TargetVideoUnderstandingPersistenceResult,
} from '../edit-references/private-target-video-understanding-repository'
import type { EditReferenceRepositoryScope } from '../edit-references/edit-reference-repository'
import type { EditReferenceLongFormStudyAuthenticatedRequestAuthority } from './edit-reference-production-long-form-runtime-port'

export const EDIT_REFERENCE_TARGET_UNDERSTANDING_PACKAGE_RUNTIME_PORT_VERSION =
  'edit-reference-target-understanding-package-runtime-port-v1' as const
export const EDIT_REFERENCE_TARGET_UNDERSTANDING_PACKAGE_RUNTIME_FACTORY_VERSION =
  'edit-reference-target-understanding-package-runtime-factory-v1' as const

export type EditReferenceTargetUnderstandingPackagePersistence =
  | 'backend_local_private_versioned'
  | 'canonical_v3_local_supabase_rls'

export interface EditReferenceTargetUnderstandingPackagePersistenceResult
  extends Omit<TargetVideoUnderstandingPersistenceResult, 'persistence'> {
  readonly persistence: EditReferenceTargetUnderstandingPackagePersistence
}

export interface EditReferenceTargetUnderstandingPackageRepository {
  readonly persistence: EditReferenceTargetUnderstandingPackagePersistence
  save(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly package: TargetVideoUnderstandingPackage
  }): Promise<EditReferenceTargetUnderstandingPackagePersistenceResult>
  readLatest(input: {
    readonly scope: EditReferenceRepositoryScope
    readonly binding: TargetVideoUnderstandingBinding
  }): Promise<TargetVideoUnderstandingPackage | undefined>
}

export interface EditReferenceTargetUnderstandingPackageRuntimePort
  extends EditReferenceTargetUnderstandingPackageRepository {
  readonly schemaVersion:
    typeof EDIT_REFERENCE_TARGET_UNDERSTANDING_PACKAGE_RUNTIME_PORT_VERSION
  readonly authorityClass: 'canonical_target_understanding_package'
  readonly sourceAuthority: 'canonical_v3_local_supabase_rls'
  readonly evidenceClass: 'isolated_local_rls_proof_unreleased'
  readonly requestScopedAuthenticatedUserAuthority: true
  readonly browserSuppliedAuthorityAccepted: false
  readonly rawMediaAccepted: false
  readonly remoteMutationAllowed: false
  readonly productionAuthority: false
  readonly persistence: 'canonical_v3_local_supabase_rls'
}

export interface EditReferenceTargetUnderstandingPackageRuntimePortFactory {
  readonly schemaVersion:
    typeof EDIT_REFERENCE_TARGET_UNDERSTANDING_PACKAGE_RUNTIME_FACTORY_VERSION
  readonly authorityClass: 'canonical_target_understanding_package'
  readonly sourceAuthority: 'canonical_v3_local_supabase_rls'
  readonly evidenceClass: 'isolated_local_rls_proof_unreleased'
  readonly requestScopedAuthenticatedUserAuthority: true
  readonly browserSuppliedAuthorityAccepted: false
  readonly serviceRoleCredentialAccepted: false
  readonly runtimePortReuseAcrossRequestsAllowed: false
  readonly rawMediaAccepted: false
  readonly remoteMutationAllowed: false
  readonly productionAuthority: false
  createForAuthenticatedRequest(input: {
    readonly env: RuntimeEnv
    readonly authority: EditReferenceLongFormStudyAuthenticatedRequestAuthority
  }): EditReferenceTargetUnderstandingPackageRuntimePort
}

export function createEditReferenceTargetUnderstandingPackageRuntimePortFactory(
  input: {
    readonly createForAuthenticatedRequest:
      EditReferenceTargetUnderstandingPackageRuntimePortFactory['createForAuthenticatedRequest']
  },
): EditReferenceTargetUnderstandingPackageRuntimePortFactory {
  return Object.freeze({
    schemaVersion:
      EDIT_REFERENCE_TARGET_UNDERSTANDING_PACKAGE_RUNTIME_FACTORY_VERSION,
    authorityClass: 'canonical_target_understanding_package' as const,
    sourceAuthority: 'canonical_v3_local_supabase_rls' as const,
    evidenceClass: 'isolated_local_rls_proof_unreleased' as const,
    requestScopedAuthenticatedUserAuthority: true as const,
    browserSuppliedAuthorityAccepted: false as const,
    serviceRoleCredentialAccepted: false as const,
    runtimePortReuseAcrossRequestsAllowed: false as const,
    rawMediaAccepted: false as const,
    remoteMutationAllowed: false as const,
    productionAuthority: false as const,
    createForAuthenticatedRequest: input.createForAuthenticatedRequest,
  })
}

export function resolveEditReferenceTargetUnderstandingPackageRepository(
  input: {
    readonly env: RuntimeEnv
    readonly auth?: {
      readonly userId: string
      readonly accessToken?: string
      readonly isMockUser: boolean
    }
    readonly factory?: EditReferenceTargetUnderstandingPackageRuntimePortFactory
    readonly localRepository: EditReferenceTargetUnderstandingPackageRepository
  },
): EditReferenceTargetUnderstandingPackageRepository {
  if (!input.factory) {
    if (!isProtectedLocalRuntime(input.env)) {
      throw unavailable('canonical_target_package_factory_missing')
    }
    if (input.localRepository.persistence !== 'backend_local_private_versioned') {
      throw unavailable('local_target_package_repository_authority_changed')
    }
    return input.localRepository
  }
  if (
    !input.auth
    || input.auth.isMockUser
    || !input.auth.accessToken
    || input.factory.schemaVersion
      !== EDIT_REFERENCE_TARGET_UNDERSTANDING_PACKAGE_RUNTIME_FACTORY_VERSION
    || input.factory.authorityClass !== 'canonical_target_understanding_package'
    || input.factory.sourceAuthority !== 'canonical_v3_local_supabase_rls'
    || input.factory.evidenceClass !== 'isolated_local_rls_proof_unreleased'
    || input.factory.requestScopedAuthenticatedUserAuthority !== true
    || input.factory.browserSuppliedAuthorityAccepted !== false
    || input.factory.serviceRoleCredentialAccepted !== false
    || input.factory.runtimePortReuseAcrossRequestsAllowed !== false
    || input.factory.rawMediaAccepted !== false
    || input.factory.remoteMutationAllowed !== false
    || input.factory.productionAuthority !== false
    || !isProtectedLocalRuntime(input.env)
  ) throw unavailable('canonical_target_package_factory_invalid')

  const port = input.factory.createForAuthenticatedRequest({
    env: input.env,
    authority: {
      ownerUserId: input.auth.userId,
      authenticatedAccessToken: input.auth.accessToken,
      isMockUser: false,
    },
  })
  if (
    port.schemaVersion
      !== EDIT_REFERENCE_TARGET_UNDERSTANDING_PACKAGE_RUNTIME_PORT_VERSION
    || port.authorityClass !== 'canonical_target_understanding_package'
    || port.sourceAuthority !== 'canonical_v3_local_supabase_rls'
    || port.evidenceClass !== 'isolated_local_rls_proof_unreleased'
    || port.requestScopedAuthenticatedUserAuthority !== true
    || port.browserSuppliedAuthorityAccepted !== false
    || port.rawMediaAccepted !== false
    || port.remoteMutationAllowed !== false
    || port.productionAuthority !== false
    || port.persistence !== 'canonical_v3_local_supabase_rls'
  ) throw unavailable('canonical_target_package_runtime_port_invalid')
  return port
}

function isProtectedLocalRuntime(env: RuntimeEnv): boolean {
  return env.nodeEnv !== 'production'
    && (env.mode === 'local' || env.mode === 'mock')
    && env.storageMode === 'local'
}

function unavailable(reason: string): ApiError {
  return new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'Target-video understanding persistence is unavailable or unsafe.',
    503,
    {
      reason,
      requiredGate: 'canonical_target_understanding_package_persistence',
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}
