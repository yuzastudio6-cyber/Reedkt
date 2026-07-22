import {
  createCanonicalDistributedPrePlanStudyLocalHttpClient,
  type CanonicalDistributedPrePlanStudyLocalHttpClient,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-local-supabase-http-rpc-client'
import {
  registerCanonicalPrePlanStudySource,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-source-registration'
import {
  createCanonicalDistributedPrePlanStudyReadProjectionPort,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-read-projection'
import {
  createCanonicalDistributedPrePlanStudyLocalPostgresAdapter,
  createCanonicalDistributedPrePlanStudyLocalPostgresCapability,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-rpc-adapter'
import {
  createCanonicalDistributedPrePlanStudyStatePort,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-port'
import type { EditReferenceRepositoryScope } from '../edit-references/edit-reference-repository'
import { ApiError } from '../errors/api-error'
import {
  createEditReferenceCanonicalV3LocalLongFormRuntimePort,
} from './edit-reference-canonical-v3-local-long-form-runtime-port'
import {
  createEditReferenceLongFormStudyRuntimePortFactory,
  type EditReferenceLongFormStudyRuntimePort,
  type EditReferenceLongFormStudyRuntimePortFactory,
} from './edit-reference-production-long-form-runtime-port'

export const EDIT_REFERENCE_CANONICAL_V3_LOCAL_LONG_FORM_RUNTIME_FACTORY_VERSION =
  'edit-reference-canonical-v3-local-long-form-runtime-factory-v1' as const

const CANONICAL_LOCAL_ENDPOINT = 'http://127.0.0.1:57431'

/**
 * Local-reset-only request factory. Static loopback credentials remain in this
 * server closure, while the verified user JWT enters only the per-request port
 * returned from createForAuthenticatedRequest. No user token is cached on the
 * process-wide factory or exposed through its descriptor.
 */
export function createEditReferenceCanonicalV3LocalLongFormRuntimePortFactory(
  input: {
    readonly endpointOrigin: string
    readonly anonKey: string
    readonly localInternalSigningSecret: string
  },
): EditReferenceLongFormStudyRuntimePortFactory {
  if (input.endpointOrigin !== CANONICAL_LOCAL_ENDPOINT) {
    throw unavailable('canonical_v3_local_factory_origin_not_loopback')
  }
  if (!isOpaqueCredential(input.anonKey)) {
    throw unavailable('canonical_v3_local_factory_anon_key_invalid')
  }
  if (!isSigningSecret(input.localInternalSigningSecret)) {
    throw unavailable('canonical_v3_local_factory_signing_secret_invalid')
  }
  const anonKey = input.anonKey
  const localInternalSigningSecret = input.localInternalSigningSecret

  return createEditReferenceLongFormStudyRuntimePortFactory({
    sourceAuthority: 'canonical_v3_loopback_postgres_pre_plan_study',
    evidenceClass: 'canonical_contract_fixture_unreleased',
    productionAuthority: false,
    createForAuthenticatedRequest({ env, authority }) {
      if (!isCanonicalLocalRuntime(env)) {
        throw unavailable('canonical_v3_local_factory_runtime_not_local')
      }
      const client = createCanonicalDistributedPrePlanStudyLocalHttpClient({
        endpointOrigin: CANONICAL_LOCAL_ENDPOINT,
        anonKey,
        authenticatedAccessToken: authority.authenticatedAccessToken,
        localInternalSigningSecret,
      })
      const capability = createCanonicalDistributedPrePlanStudyLocalPostgresCapability({
        client,
        endpointOrigin: CANONICAL_LOCAL_ENDPOINT,
      })
      const statePort = createCanonicalDistributedPrePlanStudyStatePort(
        createCanonicalDistributedPrePlanStudyLocalPostgresAdapter({
          client,
          capability,
        }),
      )
      const readProjectionPort = createCanonicalDistributedPrePlanStudyReadProjectionPort({
        client,
        capability,
      })
      return bindRuntimePortToAuthenticatedOwner(
        createEditReferenceCanonicalV3LocalLongFormRuntimePort({
          statePort,
          readProjectionPort,
        }),
        authority.ownerUserId,
        client,
      )
    },
  })
}

export function assertEditReferenceCanonicalV3LocalLongFormRuntimeFactoryIsNotProduction(
  factory: EditReferenceLongFormStudyRuntimePortFactory,
): never {
  void factory
  throw unavailable('canonical_v3_local_factory_cannot_be_promoted')
}

function bindRuntimePortToAuthenticatedOwner(
  port: EditReferenceLongFormStudyRuntimePort,
  ownerUserId: string,
  sourceRegistrationClient: CanonicalDistributedPrePlanStudyLocalHttpClient,
): EditReferenceLongFormStudyRuntimePort {
  const assertOwner = (scope: EditReferenceRepositoryScope): void => {
    if (scope.ownerUserId !== ownerUserId) {
      throw unavailable('request_scoped_runtime_owner_changed')
    }
  }
  return Object.freeze({
    ...port,
    async create(input: Parameters<EditReferenceLongFormStudyRuntimePort['create']>[0]) {
      assertOwner(input.scope)
      if (!input.sourceBinding) {
        throw unavailable('canonical_v3_local_source_registration_binding_missing')
      }
      await registerCanonicalPrePlanStudySource({
        client: sourceRegistrationClient,
        ownerUserId,
        plan: input.plan,
        sourceBinding: input.sourceBinding,
      })
      return port.create(input)
    },
    read(input: Parameters<EditReferenceLongFormStudyRuntimePort['read']>[0]) {
      assertOwner(input.scope)
      return port.read(input)
    },
    applyControlCommand(
      input: Parameters<EditReferenceLongFormStudyRuntimePort['applyControlCommand']>[0],
    ) {
      assertOwner(input.scope)
      return port.applyControlCommand(input)
    },
    readWorkOutput(
      input: Parameters<EditReferenceLongFormStudyRuntimePort['readWorkOutput']>[0],
    ) {
      assertOwner(input.scope)
      return port.readWorkOutput(input)
    },
    readSemanticWindowCheckpoint(
      input: Parameters<
        EditReferenceLongFormStudyRuntimePort['readSemanticWindowCheckpoint']
      >[0],
    ) {
      assertOwner(input.scope)
      return port.readSemanticWindowCheckpoint(input)
    },
    schedule(input: Parameters<EditReferenceLongFormStudyRuntimePort['schedule']>[0]) {
      assertOwner(input.scope)
      return port.schedule(input)
    },
  })
}

function isCanonicalLocalRuntime(
  env: Parameters<
    EditReferenceLongFormStudyRuntimePortFactory['createForAuthenticatedRequest']
  >[0]['env'],
): boolean {
  return env.nodeEnv !== 'production'
    && (env.mode === 'local' || env.mode === 'mock')
    && env.storageMode === 'local'
    && (env.workerRuntimeMode === 'local' || env.workerRuntimeMode === 'mock')
}

function isOpaqueCredential(value: string): boolean {
  return typeof value === 'string' && value.length >= 20 && value.length <= 4_096
}

function isSigningSecret(value: string): boolean {
  return typeof value === 'string' && value.length >= 32 && value.length <= 4_096
}

function unavailable(reason: string): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    'The canonical local Edit Reference study runtime is unavailable or unsafe.',
    503,
    {
      reason,
      endpointClass: 'canonical_loopback_only',
      requestScopedAuthenticatedUserAuthority: true,
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}
