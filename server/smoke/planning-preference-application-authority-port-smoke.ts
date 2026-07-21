import assert from 'node:assert/strict'
import { rm } from 'node:fs/promises'

import { loadRuntimeEnv } from '../config/env'
import {
  EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_PORT_ADAPTER_VERSION,
  createUnreleasedEditReferenceProductionPlanningAuthorityPort,
} from '../services/edit-reference-production-planning-authority-port-adapter'
import {
  EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION,
  type EditReferenceProductionPlanningAuthorityReader,
} from '../edit-references/edit-reference-production-planning-authority'
import {
  assertPlanningPreferenceApplicationExpectation,
  PLANNING_PREFERENCE_APPLICATION_AUTHORITY_PORT_VERSION,
  PLANNING_PREFERENCE_INSTRUCTION_PRIORITY,
  planningPreferenceApplicationExpectationFromResolution,
  readPlanningPreferenceApplicationAuthority,
  validatePlanningPreferenceApplicationAuthorityResolution,
  type PlanningPreferenceApplicationAuthorityPort,
  type PlanningPreferenceApplicationAuthorityResolution,
  type PlanningPreferenceApplicationBinding,
} from '../services/planning-preference-application-authority-port'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import { getServiceContext } from '../routes/route-helpers'
import type { RuntimeRequest, ServiceContext } from '../types'

const localStorageRoot =
  '/tmp/reeditpro-planning-preference-application-authority-port-smoke'
await rm(localStorageRoot, { force: true, recursive: true })

const scope = {
  localStorageRoot,
  ownerUserId: 'user-planning-preference-port',
  workspaceId: 'workspace-planning-preference-port',
  projectId: 'project-planning-preference-port',
  editSessionId: 'edit-planning-preference-port',
}
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})

const appliedBinding: PlanningPreferenceApplicationBinding = {
  status: 'applied',
  applicationId: 'application-canonical-preference-1',
  applicationVersion: 4,
  preferenceId: 'edit-reference-canonical-1',
  dnaVersionId: 'preference-dna-canonical-3',
  dnaVersion: 3,
  applicationHash: sha256AuthorityValue('canonical-planning-context-1'),
  plannerContext: {
    compact: true,
    audience: 'planner',
    preferenceId: 'edit-reference-canonical-1',
    preferenceName: 'Clean documentary storytelling',
    preferenceDNAId: 'preference-dna-canonical-3',
    preferenceDNAVersion: 3,
    runtimeState: 'verified_live',
    qaStatus: 'passed',
    confidence: 0.94,
    relevantRules: {
      pacing: ['Protect complete thoughts and let evidence breathe.'],
      audio: ['Keep dialogue intelligible above music and sound design.'],
    },
    doNotCopyRules: ['Do not copy reference-specific footage, identity, or text.'],
    nonTransferableElements: ['Reference creator identity and branded layout.'],
    qaWarnings: [],
    instructionPriority: [...PLANNING_PREFERENCE_INSTRUCTION_PRIORITY],
  },
}
const clearedBinding: PlanningPreferenceApplicationBinding = {
  status: 'cleared',
  applicationId: 'application-canonical-preference-1',
  applicationVersion: 5,
  applicationHash: sha256AuthorityValue('canonical-remove-receipt-1'),
}
const notSelectedBinding: PlanningPreferenceApplicationBinding = {
  status: 'not_selected',
  applicationVersion: 0,
  applicationHash: sha256AuthorityValue('canonical-never-selected-1'),
}

const appliedResolution = canonicalResolution('connected', appliedBinding)
let canonicalReadCount = 0
const appliedPort: PlanningPreferenceApplicationAuthorityPort = {
  async readExactApplicationState(readScope) {
    canonicalReadCount += 1
    assert.deepEqual(readScope, scope)
    return appliedResolution
  },
}
const appliedContext = contextWith(appliedPort)
const httpContext = getServiceContext({
  runtime: {
    env,
    clients: appliedContext.clients,
    planningPreferenceApplicationAuthorityPort: appliedPort,
  },
  context: {
    requestId: 'planning-preference-http-context',
    auth: appliedContext.auth,
  },
} as RuntimeRequest)
assert.equal(
  httpContext.planningPreferenceApplicationAuthorityPort,
  appliedPort,
  'The server-only authority port must survive HTTP runtime context projection.',
)
const appliedRead = await readPlanningPreferenceApplicationAuthority({
  context: appliedContext,
  scope,
})
assert.equal(canonicalReadCount, 1)
assert.equal(appliedRead.currentState, 'connected')
assert.equal(appliedRead.preferenceApplication.status, 'applied')
assert.equal(appliedRead.noLegacyPreferenceIntelligenceStoreRead, true)
assert.equal(appliedRead.noFallbackAfterAuthorityRead, true)
assert.equal(appliedRead.tenantIsolationVerified, true)
assert.equal(appliedRead.browserSuppliedPlannerContextTrusted, false)
assert.equal(appliedRead.productionAuthority, false)
assert.deepEqual(
  assertPlanningPreferenceApplicationExpectation({
    resolution: appliedRead,
    expectation:
      planningPreferenceApplicationExpectationFromResolution(appliedRead),
  }),
  appliedBinding,
)

assert.throws(
  () => assertPlanningPreferenceApplicationExpectation({
    resolution: appliedRead,
    expectation: {
      ...planningPreferenceApplicationExpectationFromResolution(appliedRead),
      applicationVersion: 99,
    } as ReturnType<
      typeof planningPreferenceApplicationExpectationFromResolution
    >,
  }),
  (error: unknown) => hasErrorCode(error, 'IDEMPOTENCY_CONFLICT'),
)

assert.throws(
  () => validatePlanningPreferenceApplicationAuthorityResolution({
    ...appliedResolution,
    readRevision: appliedResolution.readRevision + 1,
  }),
  (error: unknown) => hasErrorCode(error, 'JOB_DEPENDENCY_NOT_READY'),
)

const mismatchedPlannerBinding: PlanningPreferenceApplicationBinding = {
  ...appliedBinding,
  plannerContext: {
    ...appliedBinding.plannerContext,
    preferenceId: 'edit-reference-wrong-planner-context',
  },
}
assert.throws(
  () => validatePlanningPreferenceApplicationAuthorityResolution(
    canonicalResolution('connected', mismatchedPlannerBinding),
  ),
  (error: unknown) => hasErrorCode(error, 'JOB_DEPENDENCY_NOT_READY'),
)

assert.throws(
  () => validatePlanningPreferenceApplicationAuthorityResolution(
    rehashResolution({
      ...appliedResolution,
      tenantIsolationVerified: false,
    }),
  ),
  (error: unknown) => hasErrorCode(error, 'JOB_DEPENDENCY_NOT_READY'),
)

const clearedResolution = canonicalResolution('cleared', clearedBinding)
let clearedReadCount = 0
const clearedRead = await readPlanningPreferenceApplicationAuthority({
  context: contextWith({
    async readExactApplicationState() {
      clearedReadCount += 1
      return clearedResolution
    },
  }),
  scope,
})
assert.equal(clearedReadCount, 1)
assert.equal(clearedRead.currentState, 'cleared')
assert.deepEqual(
  planningPreferenceApplicationExpectationFromResolution(clearedRead),
  {
    status: 'cleared',
    applicationId: clearedBinding.status === 'cleared'
      ? clearedBinding.applicationId
      : '',
    applicationVersion: clearedBinding.status === 'cleared'
      ? clearedBinding.applicationVersion
      : 0,
    applicationHash: clearedBinding.applicationHash,
  },
)
assert.equal(clearedRead.canonicalLineage?.state, 'cleared')
if (clearedRead.canonicalLineage?.state !== 'cleared') {
  throw new Error('Cleared canonical lineage disappeared.')
}
assert.equal(
  clearedRead.canonicalLineage.lifecycleReceiptDigestSha256,
  clearedBinding.applicationHash,
)
assert.equal(clearedRead.canonicalLineage.committedPlanningInputRevision, 11)

assert.throws(
  () => validatePlanningPreferenceApplicationAuthorityResolution(
    canonicalResolution('cleared', clearedBinding, {
      clearedPlanningInputRevision: 0,
    }),
  ),
  (error: unknown) => hasErrorCode(error, 'JOB_DEPENDENCY_NOT_READY'),
)

const notSelectedResolution = canonicalResolution(
  'not_selected',
  notSelectedBinding,
)
assert.equal(
  (await readPlanningPreferenceApplicationAuthority({
    context: contextWith({
      async readExactApplicationState() {
        return notSelectedResolution
      },
    }),
    scope,
  })).preferenceApplication.status,
  'not_selected',
)

const canonicalFailure = new Error('canonical reader unavailable')
let failedCanonicalReadCount = 0
await assert.rejects(
  () => readPlanningPreferenceApplicationAuthority({
    context: contextWith({
      async readExactApplicationState() {
        failedCanonicalReadCount += 1
        throw canonicalFailure
      },
    }),
    scope,
  }),
  (error: unknown) => error === canonicalFailure,
)
assert.equal(
  failedCanonicalReadCount,
  1,
  'A canonical error must not trigger a private compatibility fallback.',
)

const localCompatibility = await readPlanningPreferenceApplicationAuthority({
  context: contextWith(),
  scope,
})
assert.equal(
  localCompatibility.sourceAuthority,
  'private_preference_intelligence_compatibility',
)
assert.equal(localCompatibility.evidenceClass, 'private_internal_compatibility')
assert.equal(localCompatibility.currentState, 'not_selected')
assert.equal(localCompatibility.noLegacyPreferenceIntelligenceStoreRead, false)
assert.equal(localCompatibility.productionAuthority, false)

const productionContext: ServiceContext = {
  ...contextWith(),
  env: { ...env, nodeEnv: 'production' },
}

const cloudContext: ServiceContext = {
  ...contextWith(),
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'cloud_run',
    WORKER_RUNTIME_MODE: 'cloud_run',
    STORAGE_MODE: 'gcs_disabled',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  }),
}
await assert.rejects(
  () => readPlanningPreferenceApplicationAuthority({
    context: cloudContext,
    scope,
  }),
  (error: unknown) => hasRequiredGate(
    error,
    'server_only_application_and_planning_read_rpc_adapters_verified',
  ),
)
await assert.rejects(
  () => readPlanningPreferenceApplicationAuthority({
    context: productionContext,
    scope,
  }),
  (error: unknown) => hasRequiredGate(
    error,
    'server_only_application_and_planning_read_rpc_adapters_verified',
  ),
)

await assert.rejects(
  () => readPlanningPreferenceApplicationAuthority({
    context: {
      ...productionContext,
      planningPreferenceApplicationAuthorityPort: {
        async readExactApplicationState() {
          return notSelectedResolution
        },
      },
    },
    scope,
  }),
  (error: unknown) => hasRequiredGate(
    error,
    'server_only_application_and_planning_read_rpc_adapters_verified',
  ),
)

const verifiedProductionResolution = canonicalResolution(
  'not_selected',
  notSelectedBinding,
  { evidenceClass: 'canonical_backend_verified_runtime' },
)
const verifiedProductionRead = await readPlanningPreferenceApplicationAuthority({
  context: {
    ...productionContext,
    planningPreferenceApplicationAuthorityPort: {
      async readExactApplicationState() {
        return verifiedProductionResolution
      },
    },
  },
  scope,
})
assert.equal(verifiedProductionRead.productionAuthority, true)

let productionReaderCount = 0
const productionReader: EditReferenceProductionPlanningAuthorityReader = {
  async readExactApplicationState(readScope) {
    productionReaderCount += 1
    assert.deepEqual(readScope, {
      actorUserId: scope.ownerUserId,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
    })
    return {
      schemaVersion: EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION,
      repositoryAuthority: 'supabase_rls_transactional',
      currentState: 'not_selected',
      stateRecordCount: 0,
      tenantIsolation: {
        authenticatedUserVerified: true,
        workspaceMembershipVerified: true,
        workspaceProjectCompositeBindingVerified: true,
        projectEditSessionCompositeBindingVerified: true,
        rlsPolicyVersion: 'edit-reference-rls-policy-v2',
        accessCheckReceiptId: 'edit-reference-access-check-port-adapter-1',
      },
      readRevision: 23,
      readAt: '2026-07-20T22:00:00.000Z',
    }
  },
}
const unreleasedProductionPort =
  createUnreleasedEditReferenceProductionPlanningAuthorityPort({
    reader: productionReader,
  })
const unreleasedProductionRead = await readPlanningPreferenceApplicationAuthority({
  context: contextWith(unreleasedProductionPort),
  scope,
})
assert.equal(productionReaderCount, 1)
assert.equal(
  unreleasedProductionRead.sourceAuthority,
  'canonical_edit_reference_production_repository',
)
assert.equal(
  unreleasedProductionRead.evidenceClass,
  'canonical_contract_fixture_unreleased',
)
assert.equal(unreleasedProductionRead.currentState, 'not_selected')
assert.equal(unreleasedProductionRead.noLegacyPreferenceIntelligenceStoreRead, true)
assert.equal(unreleasedProductionRead.noFallbackAfterAuthorityRead, true)
assert.equal(unreleasedProductionRead.productionAuthority, false)
assert.equal(unreleasedProductionRead.canonicalLineage?.state, 'not_selected')

await assert.rejects(
  () => readPlanningPreferenceApplicationAuthority({
    context: {
      ...productionContext,
      planningPreferenceApplicationAuthorityPort: unreleasedProductionPort,
    },
    scope,
  }),
  (error: unknown) => hasRequiredGate(
    error,
    'server_only_application_and_planning_read_rpc_adapters_verified',
  ),
)
assert.equal(productionReaderCount, 2)

const injectedReaderFailure = new Error('canonical production reader failed')
let injectedReaderFailureCount = 0
await assert.rejects(
  () => readPlanningPreferenceApplicationAuthority({
    context: contextWith(
      createUnreleasedEditReferenceProductionPlanningAuthorityPort({
        reader: {
          async readExactApplicationState() {
            injectedReaderFailureCount += 1
            throw injectedReaderFailure
          },
        },
      }),
    ),
    scope,
  }),
  (error: unknown) => error === injectedReaderFailure,
)
assert.equal(injectedReaderFailureCount, 1)

await rm(localStorageRoot, { force: true, recursive: true })

console.log(JSON.stringify({
  status: 'passed',
  authorityPortVersion:
    PLANNING_PREFERENCE_APPLICATION_AUTHORITY_PORT_VERSION,
  canonicalStatesProven: ['not_selected', 'connected', 'cleared'],
  exactlyOneAuthorityReadPerResolution: true,
  noFallbackAfterCanonicalClearOrError: true,
  serverOnlyHttpContextPropagationProven: true,
  productionRequiresCanonicalVerifiedRuntime: true,
  hostedRuntimeRejectsLocalCompatibility: true,
  localCompatibilityNonPromotable: true,
  editReferenceProductionPortAdapterVersion:
    EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_PORT_ADAPTER_VERSION,
  editReferenceProductionReaderProjectedWithoutLegacyFallback: true,
  editReferenceProductionReaderEvidenceClass:
    'canonical_contract_fixture_unreleased',
  liveRpcAdapterMounted: false,
  remoteMutationAttempted: false,
  productionReady: false,
}, null, 2))

function contextWith(
  port?: PlanningPreferenceApplicationAuthorityPort,
): ServiceContext {
  return {
    env,
    clients: { admin: null, public: null },
    requestId: 'planning-preference-application-authority-port-smoke',
    auth: { userId: scope.ownerUserId, isMockUser: true },
    ...(port ? { planningPreferenceApplicationAuthorityPort: port } : {}),
  }
}

function canonicalResolution(
  state: PlanningPreferenceApplicationAuthorityResolution['currentState'],
  preferenceApplication: PlanningPreferenceApplicationBinding,
  overrides: {
    evidenceClass?: 'canonical_contract_fixture_unreleased' |
      'canonical_backend_verified_runtime'
    clearedPlanningInputRevision?: number
  } = {},
): PlanningPreferenceApplicationAuthorityResolution {
  const canonicalLineage = state === 'not_selected'
    ? { state: 'not_selected' as const }
    : state === 'cleared' && preferenceApplication.status === 'cleared'
      ? {
          state: 'cleared' as const,
          applicationId: preferenceApplication.applicationId,
          applicationVersion: preferenceApplication.applicationVersion,
          applicationHash: preferenceApplication.applicationHash,
          lifecycleTransactionId: 'edit-reference-lifecycle-tx-remove-1',
          lifecycleReceiptDigestSha256: preferenceApplication.applicationHash,
          committedPlanningInputRevision:
            overrides.clearedPlanningInputRevision ?? 11,
        }
      : state === 'connected' && preferenceApplication.status === 'applied'
        ? {
            state: 'connected' as const,
            applicationId: preferenceApplication.applicationId,
            applicationVersion: preferenceApplication.applicationVersion,
            applicationHash: preferenceApplication.applicationHash,
            lifecycleTransactionId: 'edit-reference-lifecycle-tx-apply-1',
            lifecycleReceiptDigestSha256:
              sha256AuthorityValue('canonical-apply-receipt-1'),
            planningContextDigestSha256: preferenceApplication.applicationHash,
            adapterDigestSha256:
              sha256AuthorityValue('canonical-planner-adapter-1'),
          }
        : (() => {
            throw new Error('Canonical fixture state and binding disagree.')
          })()
  const evidenceClass = overrides.evidenceClass ??
    'canonical_contract_fixture_unreleased'
  const payload = {
    schemaVersion: PLANNING_PREFERENCE_APPLICATION_AUTHORITY_PORT_VERSION,
    sourceAuthority:
      'canonical_edit_reference_production_repository' as const,
    evidenceClass,
    currentState: state,
    readRevision: 17,
    accessCheckReceiptId: 'edit-reference-access-check-receipt-17',
    rlsPolicyVersion: 'edit-reference-rls-policy-v2',
    tenantIsolationVerified: true,
    noLegacyPreferenceIntelligenceStoreRead: true,
    noFallbackAfterAuthorityRead: true as const,
    browserSuppliedPlannerContextTrusted: false as const,
    rawReferenceMediaIncluded: false as const,
    rawProviderPayloadIncluded: false as const,
    productionAuthority:
      evidenceClass === 'canonical_backend_verified_runtime',
    canonicalLineage,
    preferenceApplication,
  }
  return {
    ...payload,
    authorityReceiptHash: sha256AuthorityValue(payload),
  }
}

function hasErrorCode(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === 'object' &&
    'code' in error && (error as { code?: unknown }).code === code)
}

function rehashResolution(
  resolution: PlanningPreferenceApplicationAuthorityResolution,
): PlanningPreferenceApplicationAuthorityResolution {
  const { authorityReceiptHash: _authorityReceiptHash, ...payload } = resolution
  void _authorityReceiptHash
  return {
    ...resolution,
    authorityReceiptHash: sha256AuthorityValue(payload),
  }
}

function hasRequiredGate(error: unknown, gate: string): boolean {
  if (!error || typeof error !== 'object' || !('details' in error)) return false
  const details = (error as { details?: unknown }).details
  return Boolean(details && typeof details === 'object' &&
    'requiredGate' in details &&
    (details as { requiredGate?: unknown }).requiredGate === gate)
}
