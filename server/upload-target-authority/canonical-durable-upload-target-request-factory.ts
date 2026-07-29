import type { RuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  assertCanonicalDurableUploadTargetStatePort,
  assertCanonicalUploadTargetCredentialEscrow,
  createCanonicalDurableUploadTargetStatePort,
  createCanonicalUploadTargetCredentialEscrow,
  type CanonicalDurableUploadIntentRecord,
  type CanonicalDurableUploadTargetTransactionAdapter,
  type CanonicalUploadTargetCredentialEscrow,
} from './canonical-durable-upload-target-authority'
import {
  createCanonicalDurableUploadTargetLocalHttpClient,
} from './canonical-durable-upload-target-local-supabase-http-rpc-client'
import {
  createCanonicalDurableUploadTargetLocalPostgresAdapter,
  createCanonicalDurableUploadTargetLocalPostgresCapability,
} from './canonical-durable-upload-target-state-rpc-adapter'
import {
  createLocalCanonicalUploadTargetCredentialKeyWrapCapability,
} from './canonical-upload-target-credential-envelope'
import {
  createCanonicalUploadTargetCredentialEscrowLocalHttpClient,
} from './canonical-upload-target-credential-escrow-local-supabase-http-rpc-client'
import {
  createCanonicalUploadTargetCredentialEscrowLocalPostgresAdapter,
  createCanonicalUploadTargetCredentialEscrowLocalPostgresCapability,
} from './canonical-upload-target-credential-escrow-rpc-adapter'

export const CANONICAL_DURABLE_UPLOAD_TARGET_REQUEST_FACTORY_VERSION =
  'canonical-durable-upload-target-request-factory-v1' as const

const CANONICAL_LOCAL_ENDPOINT = 'http://127.0.0.1:57431'

export interface CanonicalDurableUploadTargetAuthenticatedRequestAuthority {
  readonly ownerUserId: string
  readonly authenticatedAccessToken: string
  readonly isMockUser: false
}

export interface CanonicalDurableUploadTargetRequestAuthorityPair {
  readonly statePort: CanonicalDurableUploadTargetTransactionAdapter
  readonly credentialEscrow: CanonicalUploadTargetCredentialEscrow
}

export interface CanonicalDurableUploadTargetRequestAuthorityFactory {
  readonly schemaVersion:
    typeof CANONICAL_DURABLE_UPLOAD_TARGET_REQUEST_FACTORY_VERSION
  readonly authorityClass: 'pre_media_upload_intent_and_temporary_target'
  readonly sourceAuthority:
    'canonical_v3_loopback_postgres_encrypted_upload_target'
  readonly requestScopedAuthenticatedUserAuthority: true
  readonly authenticatedActorDerivedServerSide: true
  readonly browserSuppliedAuthorityAccepted: false
  readonly serviceRoleCredentialAccepted: false
  readonly authenticatedAccessTokenPersistedOrProjected: false
  readonly plaintextUploadCredentialPersistedInCanonicalDatabase: false
  readonly localKeyMaterialProjected: false
  readonly runtimeAuthorityReuseAcrossUsersAllowed: false
  readonly loopbackOnly: true
  readonly restartRecoveryVerified: true
  readonly multiReplicaRecoveryVerified: false
  readonly liveGcsSessionIssuanceVerified: false
  readonly liveCloudKmsVerified: false
  readonly productionAuthority: false
  createForAuthenticatedRequest(input: {
    readonly env: RuntimeEnv
    readonly authority:
      CanonicalDurableUploadTargetAuthenticatedRequestAuthority
  }): CanonicalDurableUploadTargetRequestAuthorityPair
}

const factoryBrands = new WeakSet<object>()
const requestPairBrands = new WeakSet<object>()

/**
 * Creates a loopback-only, request-scoped bridge to the canonical V3 local
 * upload-target RPCs. The authenticated user JWT is captured only by the
 * returned request pair. The process-wide factory keeps only server-owned
 * loopback credentials and the local proof key used to recover encrypted
 * temporary targets after an API restart.
 */
export function createCanonicalDurableUploadTargetLocalRequestAuthorityFactory(
  input: {
    readonly endpointOrigin: string
    readonly anonKey: string
    readonly localInternalSigningSecret: string
    readonly localCredentialKeyVersionId: string
    readonly localCredentialKeyMaterial: Uint8Array
  },
): CanonicalDurableUploadTargetRequestAuthorityFactory {
  if (input.endpointOrigin !== CANONICAL_LOCAL_ENDPOINT) {
    throw unavailable('request_factory_origin_not_canonical_loopback')
  }
  if (!isOpaqueCredential(input.anonKey)) {
    throw unavailable('request_factory_anon_key_invalid')
  }
  if (!isSigningSecret(input.localInternalSigningSecret)) {
    throw unavailable('request_factory_internal_signing_secret_invalid')
  }
  if (!isSafeIdentity(input.localCredentialKeyVersionId)) {
    throw unavailable('request_factory_key_version_invalid')
  }
  if (
    !(input.localCredentialKeyMaterial instanceof Uint8Array)
    || input.localCredentialKeyMaterial.byteLength !== 32
  ) {
    throw unavailable('request_factory_key_material_invalid')
  }

  const anonKey = input.anonKey
  const localInternalSigningSecret = input.localInternalSigningSecret
  const keyMaterial = Uint8Array.from(input.localCredentialKeyMaterial)
  const keyWrapCapability =
    createLocalCanonicalUploadTargetCredentialKeyWrapCapability({
      keyVersionId: input.localCredentialKeyVersionId,
      keyMaterial,
    })
  keyMaterial.fill(0)

  const factory: CanonicalDurableUploadTargetRequestAuthorityFactory =
    Object.freeze({
      schemaVersion: CANONICAL_DURABLE_UPLOAD_TARGET_REQUEST_FACTORY_VERSION,
      authorityClass:
        'pre_media_upload_intent_and_temporary_target' as const,
      sourceAuthority:
        'canonical_v3_loopback_postgres_encrypted_upload_target' as const,
      requestScopedAuthenticatedUserAuthority: true as const,
      authenticatedActorDerivedServerSide: true as const,
      browserSuppliedAuthorityAccepted: false as const,
      serviceRoleCredentialAccepted: false as const,
      authenticatedAccessTokenPersistedOrProjected: false as const,
      plaintextUploadCredentialPersistedInCanonicalDatabase: false as const,
      localKeyMaterialProjected: false as const,
      runtimeAuthorityReuseAcrossUsersAllowed: false as const,
      loopbackOnly: true as const,
      restartRecoveryVerified: true as const,
      multiReplicaRecoveryVerified: false as const,
      liveGcsSessionIssuanceVerified: false as const,
      liveCloudKmsVerified: false as const,
      productionAuthority: false as const,
      createForAuthenticatedRequest(
        { env, authority }: Parameters<
          CanonicalDurableUploadTargetRequestAuthorityFactory[
            'createForAuthenticatedRequest'
          ]
        >[0],
      ) {
        if (!isCanonicalLocalRuntime(env)) {
          throw unavailable('request_factory_runtime_not_canonical_local')
        }
        if (
          authority.isMockUser !== false
          || !isSafeIdentity(authority.ownerUserId)
          || !isAuthenticatedJwt(authority.authenticatedAccessToken)
        ) {
          throw unavailable('request_factory_authenticated_actor_invalid')
        }

        const stateClient =
          createCanonicalDurableUploadTargetLocalHttpClient({
            endpointOrigin: CANONICAL_LOCAL_ENDPOINT,
            anonKey,
            authenticatedAccessToken: authority.authenticatedAccessToken,
            localInternalSigningSecret,
          })
        const stateCapability =
          createCanonicalDurableUploadTargetLocalPostgresCapability({
            client: stateClient,
            endpointOrigin: CANONICAL_LOCAL_ENDPOINT,
          })
        const statePort = createCanonicalDurableUploadTargetStatePort(
          createCanonicalDurableUploadTargetLocalPostgresAdapter({
            client: stateClient,
            capability: stateCapability,
          }),
        )

        const escrowClient =
          createCanonicalUploadTargetCredentialEscrowLocalHttpClient({
            endpointOrigin: CANONICAL_LOCAL_ENDPOINT,
            anonKey,
            authenticatedAccessToken: authority.authenticatedAccessToken,
            localInternalSigningSecret,
          })
        const escrowCapability =
          createCanonicalUploadTargetCredentialEscrowLocalPostgresCapability({
            client: escrowClient,
            endpointOrigin: CANONICAL_LOCAL_ENDPOINT,
          })
        const credentialEscrow =
          createCanonicalUploadTargetCredentialEscrowLocalPostgresAdapter({
            client: escrowClient,
            capability: escrowCapability,
            keyWrapCapability,
          })

        const requestScope: RequestOwnerScope = {
          ownerUserId: authority.ownerUserId,
          allowedIntentIds: new Set<string>(),
          allowedAttemptBindings: new Set<string>(),
        }
        const pair = Object.freeze({
          statePort: bindStatePortToOwner(statePort, requestScope),
          credentialEscrow: bindEscrowToResolvedAttempts(
            credentialEscrow,
            requestScope,
          ),
        })
        requestPairBrands.add(pair)
        return pair
      },
    })
  factoryBrands.add(factory)
  return factory
}

export function assertCanonicalDurableUploadTargetRequestAuthorityFactory(
  value: unknown,
): asserts value is CanonicalDurableUploadTargetRequestAuthorityFactory {
  if (!value || typeof value !== 'object' || !factoryBrands.has(value)) {
    throw unavailable('request_factory_not_process_branded')
  }
  const factory = value as CanonicalDurableUploadTargetRequestAuthorityFactory
  if (
    factory.schemaVersion
      !== CANONICAL_DURABLE_UPLOAD_TARGET_REQUEST_FACTORY_VERSION
    || factory.authorityClass
      !== 'pre_media_upload_intent_and_temporary_target'
    || factory.sourceAuthority
      !== 'canonical_v3_loopback_postgres_encrypted_upload_target'
    || factory.requestScopedAuthenticatedUserAuthority !== true
    || factory.authenticatedActorDerivedServerSide !== true
    || factory.browserSuppliedAuthorityAccepted !== false
    || factory.serviceRoleCredentialAccepted !== false
    || factory.authenticatedAccessTokenPersistedOrProjected !== false
    || factory.plaintextUploadCredentialPersistedInCanonicalDatabase !== false
    || factory.localKeyMaterialProjected !== false
    || factory.runtimeAuthorityReuseAcrossUsersAllowed !== false
    || factory.loopbackOnly !== true
    || factory.restartRecoveryVerified !== true
    || factory.multiReplicaRecoveryVerified !== false
    || factory.liveGcsSessionIssuanceVerified !== false
    || factory.liveCloudKmsVerified !== false
    || factory.productionAuthority !== false
    || typeof factory.createForAuthenticatedRequest !== 'function'
  ) {
    throw unavailable('request_factory_contract_invalid')
  }
}

export function assertCanonicalDurableUploadTargetRequestAuthorityPair(
  value: unknown,
): asserts value is CanonicalDurableUploadTargetRequestAuthorityPair {
  if (!value || typeof value !== 'object' || !requestPairBrands.has(value)) {
    throw unavailable('request_authority_pair_not_process_branded')
  }
  const pair = value as CanonicalDurableUploadTargetRequestAuthorityPair
  assertCanonicalDurableUploadTargetStatePort(pair.statePort)
  assertCanonicalUploadTargetCredentialEscrow(pair.credentialEscrow, false)
}

interface RequestOwnerScope {
  readonly ownerUserId: string
  readonly allowedIntentIds: Set<string>
  readonly allowedAttemptBindings: Set<string>
}

function bindStatePortToOwner(
  sourcePort: CanonicalDurableUploadTargetTransactionAdapter,
  scope: RequestOwnerScope,
): CanonicalDurableUploadTargetTransactionAdapter {
  assertCanonicalDurableUploadTargetStatePort(sourcePort)
  const remember = (record: CanonicalDurableUploadIntentRecord): void => {
    if (record.ownerUserId !== scope.ownerUserId) {
      throw unavailable('request_scoped_state_owner_changed')
    }
    scope.allowedIntentIds.add(record.uploadIntentId)
    if (record.issuance.attemptId) {
      scope.allowedAttemptBindings.add(
        attemptBinding(record.uploadIntentId, record.issuance.attemptId),
      )
    }
  }
  const assertIntent = (uploadIntentId: string): void => {
    if (!scope.allowedIntentIds.has(uploadIntentId)) {
      throw unavailable('request_scoped_state_intent_not_resolved')
    }
  }
  const assertAttempt = (uploadIntentId: string, attemptId: string): void => {
    if (
      !scope.allowedAttemptBindings.has(
        attemptBinding(uploadIntentId, attemptId),
      )
    ) {
      throw unavailable('request_scoped_state_attempt_not_claimed')
    }
  }

  return createCanonicalDurableUploadTargetStatePort({
    descriptor: sourcePort.descriptor,
    async resolveIntent(input) {
      if (input.candidate.ownerUserId !== scope.ownerUserId) {
        throw unavailable('request_scoped_resolve_owner_changed')
      }
      const result = await sourcePort.resolveIntent(input)
      remember(result.intent)
      return result
    },
    async claimTarget(input) {
      assertIntent(input.uploadIntentId)
      const result = await sourcePort.claimTarget(input)
      remember(result.intent)
      assertAttempt(input.uploadIntentId, input.attemptId)
      return result
    },
    async commitTarget(input) {
      assertIntent(input.uploadIntentId)
      assertAttempt(input.uploadIntentId, input.attemptId)
      const result = await sourcePort.commitTarget(input)
      remember(result.intent)
      return result
    },
    async markTargetUnknown(input) {
      assertIntent(input.uploadIntentId)
      assertAttempt(input.uploadIntentId, input.attemptId)
      const result = await sourcePort.markTargetUnknown(input)
      remember(result.intent)
      return result
    },
    async readIntent(input) {
      if (input.ownerUserId !== scope.ownerUserId) {
        throw unavailable('request_scoped_read_owner_changed')
      }
      const result = await sourcePort.readIntent(input)
      if (result) remember(result)
      return result
    },
  })
}

function bindEscrowToResolvedAttempts(
  sourceEscrow: CanonicalUploadTargetCredentialEscrow,
  scope: RequestOwnerScope,
): CanonicalUploadTargetCredentialEscrow {
  assertCanonicalUploadTargetCredentialEscrow(sourceEscrow, false)
  const assertIdentity = (input: {
    readonly recordId: string
    readonly uploadIntentId: string
    readonly attemptId: string
  }): void => {
    if (
      input.recordId !== `upload_target_escrow_${input.attemptId}`
      || !isSafeIdentity(input.uploadIntentId)
      || !isSafeIdentity(input.attemptId)
      || !scope.allowedIntentIds.has(input.uploadIntentId)
      || !scope.allowedAttemptBindings.has(
        attemptBinding(input.uploadIntentId, input.attemptId),
      )
    ) {
      throw unavailable('request_scoped_escrow_identity_invalid')
    }
  }
  return createCanonicalUploadTargetCredentialEscrow({
    descriptor: sourceEscrow.descriptor,
    async put(input) {
      assertIdentity(input)
      return sourceEscrow.put(input)
    },
    async read(input) {
      assertIdentity(input)
      return sourceEscrow.read(input)
    },
    async delete(input) {
      assertIdentity(input)
      return sourceEscrow.delete(input)
    },
  })
}

function attemptBinding(uploadIntentId: string, attemptId: string): string {
  return `${uploadIntentId}\u0000${attemptId}`
}

function isCanonicalLocalRuntime(env: RuntimeEnv): boolean {
  return env.nodeEnv !== 'production'
    && env.mode === 'local'
    && env.storageMode === 'local'
    && env.allowInternalTestExecutionWithSupabase
    && !env.allowMockWithoutSupabase
    && !env.mockOnly
    && env.hasSupabaseAdmin
    && env.hasSupabasePublic
    && env.supabaseUrl === CANONICAL_LOCAL_ENDPOINT
}

function isSafeIdentity(value: string): boolean {
  return typeof value === 'string'
    && value.length >= 1
    && value.length <= 240
    && /^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u.test(value)
    && !value.includes('..')
}

function isOpaqueCredential(value: string): boolean {
  return typeof value === 'string' && value.length >= 20 && value.length <= 4_096
}

function isSigningSecret(value: string): boolean {
  return typeof value === 'string' && value.length >= 32 && value.length <= 4_096
}

function isAuthenticatedJwt(value: string): boolean {
  return isOpaqueCredential(value)
    && value.split('.').length === 3
    && /^[A-Za-z0-9._-]+$/u.test(value)
}

function unavailable(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The request-scoped durable upload-target authority is unavailable or unsafe.',
    503,
    {
      reason,
      endpointClass: 'canonical_loopback_only',
      authenticatedRequestAuthorityRequired: true,
      temporaryCredentialReplayCacheAllowed: false,
      remoteMutationAttempted: false,
      productionAuthority: false,
    },
  )
}
