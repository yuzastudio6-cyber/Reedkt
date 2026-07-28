import assert from 'node:assert/strict'
import { rm } from 'node:fs/promises'

import {
  CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_VERSION,
  CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_REQUEST_VERSION,
  type CanonicalExactEditPlanningAuthorityRead,
} from '../../src/types/canonical-exact-edit-planning-authority'
import { loadRuntimeEnv } from '../config/env'
import type {
  EditReferenceLocalSupabaseRpcAdapter,
} from '../edit-references/edit-reference-local-supabase-rpc-adapter'
import { getServiceContext } from '../routes/route-helpers'
import {
  PLANNING_EXACT_EDIT_PREFERENCE_AUTHORITY_PORT_VERSION,
  createCanonicalV3LocalPlanningExactEditPreferenceAuthorityPort,
  readPlanningExactEditPreferenceAuthority,
  recordPlanningExactEditPreferenceEvidence,
  validatePlanningExactEditPreferenceAuthorityResolution,
  type PlanningExactEditPreferenceAuthorityPort,
  type PlanningExactEditPreferenceAuthorityResolution,
} from '../services/planning-exact-edit-preference-authority-port'
import { createPrivateExactEditPreferenceRecord } from '../services/exact-edit-preference-service'
import {
  mutatePrivateExactEditPreferenceRecord,
  readPrivateExactEditPreferenceRecord,
} from '../services/private-exact-edit-preference-store'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import type { RuntimeRequest, ServiceContext } from '../types'

const localStorageRoot =
  '/tmp/reeditpro-planning-exact-edit-preference-authority-port-smoke'
await rm(localStorageRoot, { force: true, recursive: true })

const scope = {
  localStorageRoot,
  ownerUserId: 'user-planning-exact-preference-port',
  workspaceId: 'workspace-planning-exact-preference-port',
  projectId: 'project-planning-exact-preference-port',
  editSessionId: 'edit-planning-exact-preference-port',
}
const localEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
const values = {
  editLevel: 'pro' as const,
  workflowType: 'testimonial_case_study' as const,
  cleanupPreference: 'balanced_cleanup' as const,
  visualPreference: 'balanced_visual_mix' as const,
  moodStyle: 'clean' as const,
  creditPreference: 'balanced' as const,
  targetPlatform: 'youtube' as const,
}
const baselineFingerprint = sha256AuthorityValue(values)
const baseline = {
  preferenceSnapshotId: 'canonical-exact-edit-baseline-1',
  values,
  preferenceFingerprintSha256: baselineFingerprint,
  capturedAt: '2026-07-21T12:00:00.000Z',
  persistenceSource: 'authenticated_private_internal_backend' as const,
  provenance: 'saved_edit_preferences' as const,
}
const frame = {
  status: 'confirmed' as const,
  confirmationId: 'canonical-exact-edit-frame-1',
  aspectRatio: '16:9' as const,
  confirmedAt: '2026-07-21T12:01:00.000Z',
  authorityDigestSha256: sha256AuthorityValue('canonical-exact-edit-frame-1'),
}
let authority: CanonicalExactEditPlanningAuthorityRead = makeAuthority({
  sourcePreparation: {
    status: 'not_ready',
    sourceCandidateHashSha256: null,
    evidenceHashSha256: null,
    confirmedAt: null,
  },
})
let readCount = 0
let evidenceCount = 0
const adapter = {
  schemaVersion: 'edit-reference-local-supabase-rpc-adapter-v1',
  source: 'canonical_v3_local_supabase_rpc',
  endpointOrigin: 'http://127.0.0.1:57431',
  loopbackOnly: true,
  remoteDatabaseMutationAllowed: false,
  productionAuthority: false,
  async readExactEditPlanningAuthority(readScope: {
    actorUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
  }) {
    readCount += 1
    assert.deepEqual(readScope, {
      actorUserId: scope.ownerUserId,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
    })
    return structuredClone(authority)
  },
  async recordExactEditPlanningEvidence(request: {
    sourceCandidateHashSha256: string
    sourcePreparationEvidenceHashSha256: string
  }) {
    evidenceCount += 1
    authority = makeAuthority({
      recordRevision: 8,
      sourcePreparation: {
        status: 'ready',
        sourceCandidateHashSha256: request.sourceCandidateHashSha256,
        evidenceHashSha256: request.sourcePreparationEvidenceHashSha256,
        confirmedAt: '2026-07-21T12:03:00.000Z',
      },
    })
    return structuredClone(authority)
  },
} as unknown as EditReferenceLocalSupabaseRpcAdapter

const canonicalPort =
  createCanonicalV3LocalPlanningExactEditPreferenceAuthorityPort(adapter)
const localContext = contextWith(canonicalPort, localEnv)
const projectedContext = getServiceContext({
  runtime: {
    env: localEnv,
    clients: localContext.clients,
    planningExactEditPreferenceAuthorityPort: canonicalPort,
  },
  context: {
    requestId: 'planning-exact-preference-http-context',
    auth: localContext.auth,
  },
} as RuntimeRequest)
assert.equal(projectedContext.planningExactEditPreferenceAuthorityPort, canonicalPort)

const firstRead = await readPlanningExactEditPreferenceAuthority({
  context: localContext,
  scope,
})
assert.equal(readCount, 1)
assert.equal(firstRead.sourceAuthority, 'canonical_exact_edit_preference_repository')
assert.equal(firstRead.evidenceClass, 'canonical_contract_fixture_unreleased')
assert.equal(firstRead.noLegacyExactPreferenceStoreRead, true)
assert.equal(firstRead.noFallbackAfterAuthorityRead, true)
assert.equal(firstRead.productionAuthority, false)
assert.equal(firstRead.authority.sourcePreparation.status, 'not_ready')

const evidenceRequest = {
  schemaVersion: CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_REQUEST_VERSION,
  actorUserId: scope.ownerUserId,
  workspaceId: scope.workspaceId,
  projectId: scope.projectId,
  editSessionId: scope.editSessionId,
  expectedPreferenceRevision: authority.preferenceRevision,
  expectedPlanningInputRevision: authority.planningInputRevision,
  expectedPreferenceFingerprintSha256: authority.preferenceFingerprintSha256,
  expectedBaselinePreferenceSnapshotId: authority.baseline.preferenceSnapshotId,
  sourceCandidateHashSha256: sha256AuthorityValue('source-candidate-1'),
  sourcePreparationEvidenceHashSha256: sha256AuthorityValue('source-evidence-1'),
  confirmedAspectRatio: '16:9' as const,
}
const recorded = await recordPlanningExactEditPreferenceEvidence({
  context: localContext,
  scope,
  request: evidenceRequest,
})
assert.equal(evidenceCount, 1)
assert.equal(recorded.authority.recordRevision, 8)
assert.equal(recorded.authority.sourcePreparation.status, 'ready')
if (recorded.authority.sourcePreparation.status !== 'ready') {
  throw new Error('Canonical source evidence was not retained.')
}
assert.equal(
  recorded.authority.sourcePreparation.sourceCandidateHashSha256,
  evidenceRequest.sourceCandidateHashSha256,
)

const compatibilityScope = {
  ...scope,
  workspaceId: 'workspace-private-planning-exact-preference-port',
  projectId: 'project-private-planning-exact-preference-port',
  editSessionId: 'edit-private-planning-exact-preference-port',
}
const compatibilityTimestamp = '2026-07-21T12:10:00.000Z'
await mutatePrivateExactEditPreferenceRecord({
  scope: compatibilityScope,
  mutation: (current) => {
    assert.equal(current, undefined)
    const record = createPrivateExactEditPreferenceRecord({
      scope: compatibilityScope,
      baseline: {
        preferenceSnapshotId: baseline.preferenceSnapshotId,
        values: baseline.values,
        capturedAt: baseline.capturedAt,
        persistenceSource: baseline.persistenceSource,
        provenance: baseline.provenance,
      },
      timestamp: compatibilityTimestamp,
      idempotencyKey: 'private-planning-exact-preference-bootstrap-v1',
      requestHash: sha256AuthorityValue('private-planning-exact-preference-bootstrap-v1'),
    })
    return { changed: true, record, result: undefined }
  },
})
const compatibilityContext = contextWith(undefined, localEnv)
const compatibilityBefore = await readPlanningExactEditPreferenceAuthority({
  context: compatibilityContext,
  scope: compatibilityScope,
})
assert.equal(
  compatibilityBefore.sourceAuthority,
  'private_exact_edit_preference_compatibility',
)
assert.equal(compatibilityBefore.evidenceClass, 'private_internal_compatibility')
assert.equal(compatibilityBefore.productionAuthority, false)
assert.equal(compatibilityBefore.authority.sourcePreparation.status, 'not_ready')

const compatibilityEvidenceRequest = {
  ...evidenceRequest,
  workspaceId: compatibilityScope.workspaceId,
  projectId: compatibilityScope.projectId,
  editSessionId: compatibilityScope.editSessionId,
  expectedPreferenceRevision: compatibilityBefore.authority.preferenceRevision,
  expectedPlanningInputRevision:
    compatibilityBefore.authority.planningInputRevision,
  expectedPreferenceFingerprintSha256:
    compatibilityBefore.authority.preferenceFingerprintSha256,
  expectedBaselinePreferenceSnapshotId:
    compatibilityBefore.authority.baseline.preferenceSnapshotId,
}
const compatibilityRecorded = await recordPlanningExactEditPreferenceEvidence({
  context: compatibilityContext,
  scope: compatibilityScope,
  request: compatibilityEvidenceRequest,
})
assert.equal(compatibilityRecorded.authority.recordRevision, 1)
assert.equal(compatibilityRecorded.authority.sourcePreparation.status, 'ready')
if (compatibilityRecorded.authority.sourcePreparation.status !== 'ready') {
  throw new Error('Private compatibility source evidence was not retained.')
}
assert.equal(
  compatibilityRecorded.authority.sourcePreparation.sourceCandidateHashSha256,
  null,
)
assert.equal(
  compatibilityRecorded.authority.sourcePreparation.evidenceHashSha256,
  compatibilityEvidenceRequest.sourcePreparationEvidenceHashSha256,
)
assert.equal(compatibilityRecorded.authority.frameConfirmation.status, 'confirmed')

const compatibilityReplay = await recordPlanningExactEditPreferenceEvidence({
  context: compatibilityContext,
  scope: compatibilityScope,
  request: compatibilityEvidenceRequest,
})
assert.equal(compatibilityReplay.authority.recordRevision, 1)

const changedCandidateRecorded = await recordPlanningExactEditPreferenceEvidence({
  context: compatibilityContext,
  scope: compatibilityScope,
  request: {
    ...compatibilityEvidenceRequest,
    sourceCandidateHashSha256: sha256AuthorityValue('source-candidate-2'),
  },
})
assert.equal(changedCandidateRecorded.authority.recordRevision, 2)
const persistedCompatibilityRecord = await readPrivateExactEditPreferenceRecord(
  compatibilityScope,
)
assert.equal(persistedCompatibilityRecord?.recordRevision, 2)
assert.equal(
  persistedCompatibilityRecord?.auditEvents.filter(
    (event) => event.eventType === 'planning_evidence_recorded',
  ).length,
  2,
)

await assert.rejects(
  () => recordPlanningExactEditPreferenceEvidence({
    context: compatibilityContext,
    scope: compatibilityScope,
    request: {
      ...compatibilityEvidenceRequest,
      expectedPreferenceFingerprintSha256: sha256AuthorityValue('stale-preferences'),
    },
  }),
  (error: unknown) => hasCode(error, 'IDEMPOTENCY_CONFLICT'),
)

await assert.rejects(
  () => readPlanningExactEditPreferenceAuthority({
    context: contextWith({
      async readExactPreferenceState() {
        throw new Error('canonical authority unavailable')
      },
      async recordVerifiedPlanningEvidence() {
        throw new Error('canonical authority unavailable')
      },
    }, localEnv),
    scope,
  }),
  /canonical authority unavailable/,
  'An injected canonical failure must not fall through to the private store.',
)

assert.throws(
  () => validatePlanningExactEditPreferenceAuthorityResolution({
    ...recorded,
    authorityReceiptHash: 'f'.repeat(64),
  }),
  (error: unknown) => hasCode(error, 'JOB_DEPENDENCY_NOT_READY'),
)

const productionEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  WORKER_RUNTIME_MODE: 'cloud_run',
  STORAGE_MODE: 'gcs_disabled',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
})
await assert.rejects(
  () => readPlanningExactEditPreferenceAuthority({
    context: contextWith(canonicalPort, productionEnv),
    scope,
  }),
  (error: unknown) => hasCode(error, 'JOB_DEPENDENCY_NOT_READY'),
  'An unreleased local canonical adapter must not qualify production.',
)

const productionResolution = resolution({
  authority,
  evidenceClass: 'canonical_backend_verified_runtime',
  productionAuthority: true,
})
const productionRead = await readPlanningExactEditPreferenceAuthority({
  context: contextWith({
    async readExactPreferenceState() {
      return productionResolution
    },
    async recordVerifiedPlanningEvidence() {
      return productionResolution
    },
  }, productionEnv),
  scope,
})
assert.equal(productionRead.productionAuthority, true)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: PLANNING_EXACT_EDIT_PREFERENCE_AUTHORITY_PORT_VERSION,
  canonicalReadCount: readCount,
  canonicalEvidenceCommitCount: evidenceCount,
  canonicalNoFallbackVerified: true,
  privateCompatibilityEvidenceWriteVerified: true,
  privateCompatibilityReplayVerified: true,
  privateCompatibilityChangedCandidateNotMisclassifiedAsReplay: true,
  unreleasedCanonicalNonPromotable: true,
  productionQualificationFailClosed: true,
  browserMutationAuthorityAccepted: false,
  customerPricingOrCreditsMutated: false,
  providerOrWorkerExecutionStarted: false,
}, null, 2))

await rm(localStorageRoot, { force: true, recursive: true })

function makeAuthority(input: {
  recordRevision?: number
  sourcePreparation: CanonicalExactEditPlanningAuthorityRead['sourcePreparation']
}): CanonicalExactEditPlanningAuthorityRead {
  return {
    schemaVersion: CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_VERSION,
    sourceAuthority: 'canonical_exact_edit_preference_repository',
    runtimeSource: 'verified_live',
    authorityReadReceiptId: `canonical-exact-edit-read-${input.recordRevision ?? 7}`,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    recordRevision: input.recordRevision ?? 7,
    preferenceRevision: 3,
    planningInputRevision: 5,
    preferenceFingerprintSha256: baselineFingerprint,
    values,
    baseline,
    sourcePreparation: input.sourcePreparation,
    frameConfirmation: frame,
    lifecyclePhase: 'planning',
    locked: false,
    currentApplicationState: 'not_selected',
    currentApplicationId: null,
    readAt: '2026-07-21T12:02:00.000Z',
    browserMutationAuthorityGranted: false,
    productionReleaseReadinessEvaluatedSeparately: true,
  } as CanonicalExactEditPlanningAuthorityRead
}

function resolution(input: {
  authority: CanonicalExactEditPlanningAuthorityRead
  evidenceClass: PlanningExactEditPreferenceAuthorityResolution['evidenceClass']
  productionAuthority: boolean
}): PlanningExactEditPreferenceAuthorityResolution {
  const unsigned = {
    schemaVersion: PLANNING_EXACT_EDIT_PREFERENCE_AUTHORITY_PORT_VERSION,
    sourceAuthority: 'canonical_exact_edit_preference_repository' as const,
    evidenceClass: input.evidenceClass,
    tenantIsolationVerified: true,
    rlsPolicyVersion: 'canonical-v3-local-rls-v1',
    noLegacyExactPreferenceStoreRead: true,
    noFallbackAfterAuthorityRead: true as const,
    browserMutationAuthorityAccepted: false as const,
    productionAuthority: input.productionAuthority,
    authority: input.authority,
  }
  return {
    ...unsigned,
    authorityReceiptHash: sha256AuthorityValue(unsigned),
  }
}

function contextWith(
  port: PlanningExactEditPreferenceAuthorityPort | undefined,
  env: ReturnType<typeof loadRuntimeEnv>,
): ServiceContext {
  return {
    env,
    clients: { admin: null, public: null },
    requestId: 'planning-exact-edit-preference-port-smoke',
    auth: {
      userId: scope.ownerUserId,
      accessToken: 'planning-exact-edit-preference-test-token',
      isMockUser: true,
    },
    ...(port ? { planningExactEditPreferenceAuthorityPort: port } : {}),
  }
}

function hasCode(error: unknown, code: string): boolean {
  return Boolean(
    error
    && typeof error === 'object'
    && 'code' in error
    && (error as { code?: string }).code === code,
  )
}
