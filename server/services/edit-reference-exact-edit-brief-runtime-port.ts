import type { RuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import type { EditReferenceLongFormStudyAuthenticatedRequestAuthority } from './edit-reference-production-long-form-runtime-port'

export const EDIT_REFERENCE_EXACT_EDIT_BRIEF_RUNTIME_PORT_VERSION =
  'edit-reference-exact-edit-brief-runtime-port-v1' as const
export const EDIT_REFERENCE_EXACT_EDIT_BRIEF_RUNTIME_FACTORY_VERSION =
  'edit-reference-exact-edit-brief-runtime-factory-v1' as const

export interface EditReferenceExactEditBriefAuthorityRecord {
  readonly id: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly briefText: string
  readonly sourceStorageObjectRecordId: string
  readonly sourceMediaAssetId: string
  readonly revisionNumber: number
  readonly savedByUserId: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly contentDigestSha256: string
  readonly persistenceAuthority: 'canonical_v3_local_supabase_rls'
  readonly runtimeSource: 'verified_live'
  readonly readbackVerified: true
  readonly providerCallMade: false
  readonly workerJobCreated: false
  readonly renderJobCreated: false
  readonly creditReservedOrSpent: false
  readonly supabaseWriteMade: true
  readonly gcsWriteMade: false
  readonly remoteMutationMade: false
  readonly productReady: false
  readonly mockOnly: false
}

export interface EditReferenceExactEditBriefRuntimePort {
  readonly schemaVersion: typeof EDIT_REFERENCE_EXACT_EDIT_BRIEF_RUNTIME_PORT_VERSION
  readonly authorityClass: 'canonical_exact_edit_brief'
  readonly sourceAuthority: 'canonical_v3_local_supabase_rls'
  readonly evidenceClass: 'isolated_local_rls_proof_unreleased'
  readonly requestScopedAuthenticatedUserAuthority: true
  readonly browserSuppliedAuthorityAccepted: false
  readonly remoteMutationAllowed: false
  readonly productionAuthority: false

  save(input: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly briefText: string
    readonly sourceStorageObjectRecordId: string
    readonly sourceMediaAssetId: string
    readonly idempotencyKey: string
  }): Promise<{
    readonly record: EditReferenceExactEditBriefAuthorityRecord
    readonly disposition: 'inserted' | 'idempotent_replay'
  }>

  read(input: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  }): Promise<EditReferenceExactEditBriefAuthorityRecord | undefined>
}

export interface EditReferenceExactEditBriefRuntimePortFactory {
  readonly schemaVersion:
    typeof EDIT_REFERENCE_EXACT_EDIT_BRIEF_RUNTIME_FACTORY_VERSION
  readonly authorityClass: 'canonical_exact_edit_brief'
  readonly sourceAuthority: 'canonical_v3_local_supabase_rls'
  readonly evidenceClass: 'isolated_local_rls_proof_unreleased'
  readonly requestScopedAuthenticatedUserAuthority: true
  readonly browserSuppliedAuthorityAccepted: false
  readonly serviceRoleCredentialAccepted: false
  readonly runtimePortReuseAcrossRequestsAllowed: false
  readonly remoteMutationAllowed: false
  readonly productionAuthority: false
  createForAuthenticatedRequest(input: {
    readonly env: RuntimeEnv
    readonly authority: EditReferenceLongFormStudyAuthenticatedRequestAuthority
  }): EditReferenceExactEditBriefRuntimePort
}

export function createEditReferenceExactEditBriefRuntimePortFactory(input: {
  readonly createForAuthenticatedRequest:
    EditReferenceExactEditBriefRuntimePortFactory['createForAuthenticatedRequest']
}): EditReferenceExactEditBriefRuntimePortFactory {
  return Object.freeze({
    schemaVersion: EDIT_REFERENCE_EXACT_EDIT_BRIEF_RUNTIME_FACTORY_VERSION,
    authorityClass: 'canonical_exact_edit_brief' as const,
    sourceAuthority: 'canonical_v3_local_supabase_rls' as const,
    evidenceClass: 'isolated_local_rls_proof_unreleased' as const,
    requestScopedAuthenticatedUserAuthority: true as const,
    browserSuppliedAuthorityAccepted: false as const,
    serviceRoleCredentialAccepted: false as const,
    runtimePortReuseAcrossRequestsAllowed: false as const,
    remoteMutationAllowed: false as const,
    productionAuthority: false as const,
    createForAuthenticatedRequest: input.createForAuthenticatedRequest,
  })
}

export function resolveEditReferenceExactEditBriefRuntimePort(input: {
  readonly env: RuntimeEnv
  readonly auth?: {
    readonly userId: string
    readonly accessToken?: string
    readonly isMockUser: boolean
  }
  readonly factory?: EditReferenceExactEditBriefRuntimePortFactory
}): EditReferenceExactEditBriefRuntimePort | undefined {
  if (!input.factory) return undefined
  if (
    !input.auth
    || input.auth.isMockUser
    || !input.auth.accessToken
    || input.factory.schemaVersion
      !== EDIT_REFERENCE_EXACT_EDIT_BRIEF_RUNTIME_FACTORY_VERSION
    || input.factory.authorityClass !== 'canonical_exact_edit_brief'
    || input.factory.sourceAuthority !== 'canonical_v3_local_supabase_rls'
    || input.factory.evidenceClass !== 'isolated_local_rls_proof_unreleased'
    || input.factory.requestScopedAuthenticatedUserAuthority !== true
    || input.factory.browserSuppliedAuthorityAccepted !== false
    || input.factory.serviceRoleCredentialAccepted !== false
    || input.factory.runtimePortReuseAcrossRequestsAllowed !== false
    || input.factory.remoteMutationAllowed !== false
    || input.factory.productionAuthority !== false
  ) throw unavailable('exact_edit_brief_runtime_factory_invalid')

  const port = input.factory.createForAuthenticatedRequest({
    env: input.env,
    authority: {
      ownerUserId: input.auth.userId,
      authenticatedAccessToken: input.auth.accessToken,
      isMockUser: false,
    },
  })
  if (
    port.schemaVersion !== EDIT_REFERENCE_EXACT_EDIT_BRIEF_RUNTIME_PORT_VERSION
    || port.authorityClass !== 'canonical_exact_edit_brief'
    || port.sourceAuthority !== 'canonical_v3_local_supabase_rls'
    || port.evidenceClass !== 'isolated_local_rls_proof_unreleased'
    || port.requestScopedAuthenticatedUserAuthority !== true
    || port.browserSuppliedAuthorityAccepted !== false
    || port.remoteMutationAllowed !== false
    || port.productionAuthority !== false
  ) throw unavailable('exact_edit_brief_runtime_port_invalid')
  return port
}

function unavailable(reason: string): ApiError {
  return new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The exact Edit Brief persistence authority is unavailable or unsafe.',
    503,
    {
      reason,
      requiredGate: 'canonical_exact_edit_brief',
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}
