import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  assertEditReferenceCanonicalV3LocalLongFormRuntimeFactoryIsNotProduction,
  createEditReferenceCanonicalV3LocalLongFormRuntimePortFactory,
} from '../services/edit-reference-canonical-v3-local-long-form-runtime-port-factory'
import {
  EDIT_REFERENCE_LONG_FORM_RUNTIME_PORT_FACTORY_VERSION,
  createEditReferenceLongFormStudyRuntimePortFactory,
  resolveEditReferenceLongFormStudyRuntimePort,
  type EditReferenceLongFormStudyRuntimePort,
  type EditReferenceLongFormStudyRuntimePortFactory,
} from '../services/edit-reference-production-long-form-runtime-port'

const env = loadRuntimeEnv({
  ...process.env,
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  PROVIDER_EXECUTION_ENABLED: 'false',
  WORKER_RUNTIME_MODE: 'mock',
})
const observedAuthorities: Array<{ ownerUserId: string; tokenDigest: string }> = []
const factory = createEditReferenceLongFormStudyRuntimePortFactory({
  sourceAuthority: 'canonical_v3_loopback_postgres_pre_plan_study',
  evidenceClass: 'canonical_contract_fixture_unreleased',
  productionAuthority: false,
  createForAuthenticatedRequest({ authority }) {
    observedAuthorities.push({
      ownerUserId: authority.ownerUserId,
      tokenDigest: digest(authority.authenticatedAccessToken),
    })
    return createSourceOnlyCanonicalLocalRuntimePort()
  },
})
assert.equal(factory.schemaVersion, EDIT_REFERENCE_LONG_FORM_RUNTIME_PORT_FACTORY_VERSION)
assert.equal(factory.requestScopedAuthenticatedUserAuthority, true)
assert.equal(factory.authenticatedActorDerivedServerSide, true)
assert.equal(factory.browserSuppliedAuthorityAccepted, false)
assert.equal(factory.serviceRoleCredentialAccepted, false)
assert.equal(factory.authenticatedAccessTokenPersistedOrProjected, false)
assert.equal(factory.runtimePortReuseAcrossRequestsAllowed, false)

const tokenA = fakeJwt('owner-a')
const tokenB = fakeJwt('owner-b')
const resolvedA = resolve(factory, 'owner-a', tokenA)
const resolvedB = resolve(factory, 'owner-b', tokenB)
assert.notEqual(resolvedA, resolvedB)
assert.deepEqual(observedAuthorities, [
  { ownerUserId: 'owner-a', tokenDigest: digest(tokenA) },
  { ownerUserId: 'owner-b', tokenDigest: digest(tokenB) },
])
const serializedFactory = JSON.stringify(factory)
assert.equal(serializedFactory.includes(tokenA), false)
assert.equal(serializedFactory.includes(tokenB), false)
assert.equal(serializedFactory.includes('Bearer '), false)

expectReason(
  () => resolveEditReferenceLongFormStudyRuntimePort({
    env,
    runtimePortFactory: { ...factory } as EditReferenceLongFormStudyRuntimePortFactory,
    authenticatedRequest: {
      userId: 'owner-a',
      accessToken: tokenA,
      isMockUser: false,
    },
  }),
  'long_form_runtime_port_factory_not_process_branded',
)
expectReason(
  () => resolveEditReferenceLongFormStudyRuntimePort({
    env,
    runtimePortFactory: factory,
  }),
  'request_scoped_authenticated_user_authority_required',
)
expectReason(
  () => resolveEditReferenceLongFormStudyRuntimePort({
    env,
    runtimePortFactory: factory,
    authenticatedRequest: {
      userId: 'mock-user-runtime',
      isMockUser: true,
    },
  }),
  'request_scoped_authenticated_user_authority_required',
)
expectReason(
  () => resolveEditReferenceLongFormStudyRuntimePort({
    env,
    runtimePortFactory: factory,
    authenticatedRequest: {
      userId: 'owner-a',
      accessToken: 'not-a-jwt',
      isMockUser: false,
    },
  }),
  'request_scoped_authenticated_user_authority_required',
)
expectReason(
  () => resolveEditReferenceLongFormStudyRuntimePort({
    env,
    runtimePort: createSourceOnlyCanonicalLocalRuntimePort(),
    runtimePortFactory: factory,
    authenticatedRequest: {
      userId: 'owner-a',
      accessToken: tokenA,
      isMockUser: false,
    },
  }),
  'multiple_long_form_runtime_authorities_configured',
)

const reusedPort = createSourceOnlyCanonicalLocalRuntimePort()
const reusingFactory = createEditReferenceLongFormStudyRuntimePortFactory({
  sourceAuthority: 'canonical_v3_loopback_postgres_pre_plan_study',
  evidenceClass: 'canonical_contract_fixture_unreleased',
  productionAuthority: false,
  createForAuthenticatedRequest: () => reusedPort,
})
resolve(reusingFactory, 'owner-a', tokenA)
expectReason(
  () => resolve(reusingFactory, 'owner-a', tokenA),
  'request_scoped_runtime_port_reused_across_requests',
)

const mismatchedFactory = createEditReferenceLongFormStudyRuntimePortFactory({
  sourceAuthority: 'canonical_v3_loopback_postgres_pre_plan_study',
  evidenceClass: 'canonical_contract_fixture_unreleased',
  productionAuthority: false,
  createForAuthenticatedRequest: () => ({
    ...createSourceOnlyCanonicalLocalRuntimePort(),
    sourceAuthority: 'unavailable',
  }),
})
expectReason(
  () => resolve(mismatchedFactory, 'owner-a', tokenA),
  'request_scoped_runtime_port_factory_result_changed_authority',
)

assert.throws(
  () => createEditReferenceCanonicalV3LocalLongFormRuntimePortFactory({
    endpointOrigin: 'https://example.test',
    anonKey: 'a'.repeat(32),
    localInternalSigningSecret: 'b'.repeat(32),
  }),
  (error) => reason(error) === 'canonical_v3_local_factory_origin_not_loopback',
)
const localFactory = createEditReferenceCanonicalV3LocalLongFormRuntimePortFactory({
  endpointOrigin: 'http://127.0.0.1:57431',
  anonKey: 'a'.repeat(32),
  localInternalSigningSecret: 'b'.repeat(32),
})
assert.equal(JSON.stringify(localFactory).includes('b'.repeat(32)), false)
assert.throws(
  () => assertEditReferenceCanonicalV3LocalLongFormRuntimeFactoryIsNotProduction(
    localFactory,
  ),
  (error) => reason(error) === 'canonical_v3_local_factory_cannot_be_promoted',
)

console.log(JSON.stringify({
  schemaVersion: EDIT_REFERENCE_LONG_FORM_RUNTIME_PORT_FACTORY_VERSION,
  checks: [
    'process_branded_factory_required',
    'verified_user_jwt_required',
    'mock_user_rejected',
    'one_new_runtime_port_per_resolution',
    'mixed_static_and_factory_authority_rejected',
    'factory_result_authority_change_rejected',
    'loopback_only_local_factory',
    'user_token_not_projected_by_factory',
    'local_factory_cannot_self_promote',
  ],
  productionReady: false,
  remoteMutationAttempted: false,
}, null, 2))

function resolve(
  runtimePortFactory: EditReferenceLongFormStudyRuntimePortFactory,
  userId: string,
  accessToken: string,
): EditReferenceLongFormStudyRuntimePort {
  return resolveEditReferenceLongFormStudyRuntimePort({
    env,
    runtimePortFactory,
    authenticatedRequest: {
      userId,
      accessToken,
      isMockUser: false,
    },
  })
}

function createSourceOnlyCanonicalLocalRuntimePort():
  EditReferenceLongFormStudyRuntimePort {
  return Object.freeze({
    schemaVersion: 'edit-reference-production-long-form-runtime-port-v1',
    persistenceContractVersion: 'edit-reference-production-persistence-contract-v6',
    authorityClass: 'pre_plan_edit_reference_long_form_study',
    sourceAuthority: 'canonical_v3_loopback_postgres_pre_plan_study',
    evidenceClass: 'canonical_contract_fixture_unreleased',
    productionAuthority: false,
    approvedEditAuthorityFabricated: false,
    approvedEditPlanSnapshotRequired: false,
    approvedEditCreditReservationRequired: false,
    browserClaimAllowed: false,
    browserSessionRequiredForCompletion: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    canonicalWorkerSpineRequired: true,
    createsSecondProductionQueueOrRepository: false,
    databaseTransactionAdapterVerified: true,
    multiReplicaLeaseRecoveryVerified: false,
    authenticatedWorkerDispatchVerified: false,
    livePrivateObjectReadVerified: false,
    async create() { throw new Error('not_exercised') },
    async read() { return undefined },
    async applyControlCommand() { throw new Error('not_exercised') },
    async readWorkOutput() { return undefined },
    async readSemanticWindowCheckpoint() { return undefined },
    schedule() { throw new Error('not_exercised') },
  })
}

function expectReason(action: () => unknown, expectedReason: string): void {
  assert.throws(action, (error) => reason(error) === expectedReason)
}

function reason(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) return undefined
  return typeof error.details === 'object' && error.details
    ? String((error.details as Record<string, unknown>).reason ?? '')
    : undefined
}

function fakeJwt(subject: string): string {
  return `header.${Buffer.from(JSON.stringify({ sub: subject })).toString('base64url')}.signature-value`
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
