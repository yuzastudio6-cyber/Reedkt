import type {
  CanonicalExactEditPlanningAuthorityRead,
  CanonicalExactEditPlanningEvidenceRequest,
} from '../../src/types/canonical-exact-edit-planning-authority'
import {
  CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_VERSION,
  CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_REQUEST_VERSION,
} from '../../src/types/canonical-exact-edit-planning-authority'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import type { ServiceContext } from '../types'
import {
  canonicalExactEditPlanningAuthorityReadSchema,
  canonicalExactEditPlanningEvidenceRequestSchema,
} from '../validation/canonical-exact-edit-planning-authority-schemas'
import { ApiError } from '../errors/api-error'
import type {
  EditReferenceLocalSupabaseRpcAdapter,
} from '../edit-references/edit-reference-local-supabase-rpc-adapter'
import {
  exactEditPreferenceFingerprint,
  MAX_EXACT_EDIT_PREFERENCE_AUDIT_EVENTS,
  MAX_EXACT_EDIT_PREFERENCE_IDEMPOTENCY_RECORDS,
  mutatePrivateExactEditPreferenceRecord,
  readPrivateExactEditPreferenceRecord,
  type ExactEditPreferenceLifecycleState,
  type ExactEditPreferenceStoreScope,
  type PrivateExactEditPreferenceRecord,
} from './private-exact-edit-preference-store'
import { sha256AuthorityValue } from './private-edit-authority-store'
import {
  resolveCanonicalExactEditPreferenceLifecycleLock,
} from './exact-edit-preference-service'

export const PLANNING_EXACT_EDIT_PREFERENCE_AUTHORITY_PORT_VERSION =
  'planning-exact-edit-preference-authority-port-v1' as const

export interface PlanningExactEditPreferenceAuthorityScope {
  readonly localStorageRoot: string
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
}

export type PlanningExactEditPreferenceAuthoritySource =
  | 'canonical_exact_edit_preference_repository'
  | 'private_exact_edit_preference_compatibility'

export type PlanningExactEditPreferenceAuthorityEvidenceClass =
  | 'canonical_backend_verified_runtime'
  | 'canonical_contract_fixture_unreleased'
  | 'private_internal_compatibility'

export interface PlanningExactEditPreferenceAuthorityResolution {
  readonly schemaVersion: typeof PLANNING_EXACT_EDIT_PREFERENCE_AUTHORITY_PORT_VERSION
  readonly sourceAuthority: PlanningExactEditPreferenceAuthoritySource
  readonly evidenceClass: PlanningExactEditPreferenceAuthorityEvidenceClass
  readonly tenantIsolationVerified: boolean
  readonly rlsPolicyVersion: string | null
  readonly noLegacyExactPreferenceStoreRead: boolean
  readonly noFallbackAfterAuthorityRead: true
  readonly browserMutationAuthorityAccepted: false
  readonly productionAuthority: boolean
  readonly authority: CanonicalExactEditPlanningAuthorityRead
  readonly authorityReceiptHash: string
}

export interface PlanningExactEditPreferenceAuthorityPort {
  readExactPreferenceState(
    scope: PlanningExactEditPreferenceAuthorityScope,
  ): Promise<PlanningExactEditPreferenceAuthorityResolution>
  recordVerifiedPlanningEvidence(input: {
    readonly scope: PlanningExactEditPreferenceAuthorityScope
    readonly request: CanonicalExactEditPlanningEvidenceRequest
  }): Promise<PlanningExactEditPreferenceAuthorityResolution>
}

/**
 * Adapts only the isolated loopback canonical V3 RPC proof. The result is
 * intentionally unreleased and cannot satisfy hosted production selection.
 */
export function createCanonicalV3LocalPlanningExactEditPreferenceAuthorityPort(
  adapter: EditReferenceLocalSupabaseRpcAdapter,
): PlanningExactEditPreferenceAuthorityPort {
  if (
    adapter.schemaVersion !== 'edit-reference-local-supabase-rpc-adapter-v1'
    || adapter.source !== 'canonical_v3_local_supabase_rpc'
    || adapter.loopbackOnly !== true
    || adapter.remoteDatabaseMutationAllowed !== false
    || adapter.productionAuthority !== false
    || typeof adapter.readExactEditPlanningAuthority !== 'function'
    || typeof adapter.recordExactEditPlanningEvidence !== 'function'
  ) throw authorityUnavailable('canonical_v3_local_planning_adapter_invalid')

  const project = (
    authority: CanonicalExactEditPlanningAuthorityRead,
  ): PlanningExactEditPreferenceAuthorityResolution => createResolution({
    sourceAuthority: 'canonical_exact_edit_preference_repository',
    evidenceClass: 'canonical_contract_fixture_unreleased',
    tenantIsolationVerified: true,
    rlsPolicyVersion: 'canonical-v3-local-rls-v1',
    noLegacyExactPreferenceStoreRead: true,
    productionAuthority: false,
    authority,
  })

  const port: PlanningExactEditPreferenceAuthorityPort = {
    readExactPreferenceState: async (scope) => project(
      await adapter.readExactEditPlanningAuthority({
        actorUserId: scope.ownerUserId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        editSessionId: scope.editSessionId,
      }),
    ),
    recordVerifiedPlanningEvidence: async ({ scope, request }) => {
      assertRequestScope(scope, request)
      return project(await adapter.recordExactEditPlanningEvidence(request))
    },
  }
  return Object.freeze(port)
}

export async function readPlanningExactEditPreferenceAuthority(input: {
  readonly context: ServiceContext
  readonly scope: PlanningExactEditPreferenceAuthorityScope
}): Promise<PlanningExactEditPreferenceAuthorityResolution> {
  const port = selectPort(input.context)
  const resolution = validatePlanningExactEditPreferenceAuthorityResolution(
    await port.readExactPreferenceState(input.scope),
  )
  assertRuntimeQualification(input.context, resolution)
  return resolution
}

export async function recordPlanningExactEditPreferenceEvidence(input: {
  readonly context: ServiceContext
  readonly scope: PlanningExactEditPreferenceAuthorityScope
  readonly request: CanonicalExactEditPlanningEvidenceRequest
}): Promise<PlanningExactEditPreferenceAuthorityResolution> {
  const request = canonicalExactEditPlanningEvidenceRequestSchema.parse(input.request)
  assertRequestScope(input.scope, request)
  const port = selectPort(input.context)
  const resolution = validatePlanningExactEditPreferenceAuthorityResolution(
    await port.recordVerifiedPlanningEvidence({ scope: input.scope, request }),
  )
  assertRuntimeQualification(input.context, resolution)
  return resolution
}

export function validatePlanningExactEditPreferenceAuthorityResolution(
  value: PlanningExactEditPreferenceAuthorityResolution,
): PlanningExactEditPreferenceAuthorityResolution {
  const authority = canonicalExactEditPlanningAuthorityReadSchema.parse(value.authority)
  const { authorityReceiptHash, ...payload } = value
  const canonical = value.sourceAuthority === 'canonical_exact_edit_preference_repository'
  const canonicalEvidence = value.evidenceClass === 'canonical_backend_verified_runtime'
    || value.evidenceClass === 'canonical_contract_fixture_unreleased'
  const canonicalAuthority = authority.sourceAuthority ===
    'canonical_exact_edit_preference_repository'
    && authority.runtimeSource === 'verified_live'
  const compatibilityAuthority = authority.sourceAuthority ===
    'private_exact_edit_preference_compatibility'
    && authority.runtimeSource === 'private_internal'
  if (
    value.schemaVersion !== PLANNING_EXACT_EDIT_PREFERENCE_AUTHORITY_PORT_VERSION
    || canonical !== canonicalEvidence
    || canonical !== canonicalAuthority
    || !canonical && !compatibilityAuthority
    || value.noFallbackAfterAuthorityRead !== true
    || value.browserMutationAuthorityAccepted !== false
    || value.noLegacyExactPreferenceStoreRead !== canonical
    || value.tenantIsolationVerified !== canonical
    || (canonical ? value.rlsPolicyVersion === null : value.rlsPolicyVersion !== null)
    || value.productionAuthority !== (
      canonical && value.evidenceClass === 'canonical_backend_verified_runtime'
    )
    || authority.preferenceFingerprintSha256 !== sha256AuthorityValue(authority.values)
    || authority.baseline.preferenceFingerprintSha256
      !== sha256AuthorityValue(authority.baseline.values)
    || (canonical && authority.sourcePreparation.status === 'ready'
      && authority.sourcePreparation.sourceCandidateHashSha256 === null)
    || !/^[a-f0-9]{64}$/.test(authorityReceiptHash)
    || authorityReceiptHash !== sha256AuthorityValue(payload)
  ) throw authorityUnavailable('exact_edit_planning_authority_evidence_invalid')
  return { ...value, authority }
}

function selectPort(context: ServiceContext): PlanningExactEditPreferenceAuthorityPort {
  if (context.planningExactEditPreferenceAuthorityPort) {
    return context.planningExactEditPreferenceAuthorityPort
  }
  if (!isExplicitLocalInternalTestRuntime(context.env)) {
    throw authorityUnavailable('canonical_exact_edit_planning_authority_missing')
  }
  return createPrivateCompatibilityPort()
}

function createPrivateCompatibilityPort(): PlanningExactEditPreferenceAuthorityPort {
  return {
    async readExactPreferenceState(scope) {
      const record = await requirePrivateRecord(scope)
      const lifecycle = await resolveCanonicalExactEditPreferenceLifecycleLock(
        privateScope(scope),
      )
      return compatibilityResolution(record, lifecycle)
    },
    async recordVerifiedPlanningEvidence({ scope, request }) {
      assertRequestScope(scope, request)
      const record = await requirePrivateRecord(scope)
      assertExpectedAuthority(record, request)
      const updated = await recordPrivateCompatibilityPlanningEvidence({
        scope,
        request,
      })
      const lifecycle = await resolveCanonicalExactEditPreferenceLifecycleLock(
        privateScope(scope),
      )
      return compatibilityResolution(updated, lifecycle)
    },
  }
}

async function recordPrivateCompatibilityPlanningEvidence(input: {
  readonly scope: PlanningExactEditPreferenceAuthorityScope
  readonly request: CanonicalExactEditPlanningEvidenceRequest
}): Promise<PrivateExactEditPreferenceRecord> {
  const requestHash = sha256AuthorityValue(input.request)
  const idempotencyKey = `canonical-planning-evidence:${requestHash}`

  return mutatePrivateExactEditPreferenceRecord({
    scope: privateScope(input.scope),
    mutation: async (current) => {
      const record = current
      if (!record) throw authorityUnavailable('private_exact_edit_preference_missing')
      assertExpectedAuthority(record, input.request)

      const replay = record.idempotencyRecords.find((entry) =>
        entry.operation === 'record_planning_evidence'
        && entry.idempotencyKey === idempotencyKey)
      if (replay) {
        if (replay.requestHash !== requestHash) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'Canonical private planning evidence replay changed.',
            409,
          )
        }
        return { changed: false, result: record }
      }
      const canonicalLifecycle =
        await resolveCanonicalExactEditPreferenceLifecycleLock(privateScope(input.scope))
      if (
        canonicalLifecycle.locked
        || canonicalLifecycle.phase !== 'planning'
        || record.lifecycle.locked
        || record.lifecycle.phase !== 'planning'
      ) {
        throw new ApiError(
          'PLAN_NOT_APPROVED',
          'Approved or active exact-edit planning evidence is immutable. A Chat-led revision may reuse only the exact previously recorded request.',
          409,
          {
            lifecyclePhase: canonicalLifecycle.phase,
            requiredFlow: 'chat_led_revision_replanning_and_new_approval',
            requiredGate: 'locked_exact_planning_evidence_reuse_only',
          },
        )
      }
      if (
        record.auditEvents.length >= MAX_EXACT_EDIT_PREFERENCE_AUDIT_EVENTS
        || record.idempotencyRecords.length
          >= MAX_EXACT_EDIT_PREFERENCE_IDEMPOTENCY_RECORDS
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CAPACITY_EXCEEDED',
          'Private exact-edit preference persistence reached its safe capacity.',
          503,
        )
      }

      const committedAt = new Date().toISOString()
      const nextRecordRevision = record.recordRevision + 1
      const nextRecord: PrivateExactEditPreferenceRecord = {
        ...record,
        recordRevision: nextRecordRevision,
        planning: {
          ...record.planning,
          sourcePreparation: {
            status: 'ready',
            evidenceHash: input.request.sourcePreparationEvidenceHashSha256,
            updatedAt: committedAt,
          },
          frameConfirmation: {
            status: 'confirmed',
            aspectRatio: input.request.confirmedAspectRatio,
            confirmationId: `canonical-frame-${sha256AuthorityValue({
              workspaceId: input.scope.workspaceId,
              projectId: input.scope.projectId,
              editSessionId: input.scope.editSessionId,
              aspectRatio: input.request.confirmedAspectRatio,
            })}`,
            updatedAt: committedAt,
          },
        },
        auditEvents: [...record.auditEvents, {
          id: `exact_edit_preference_audit_${requestHash.slice(0, 48)}`,
          eventType: 'planning_evidence_recorded',
          actorType: 'internal_service',
          actorUserId: input.scope.ownerUserId,
          recordRevision: nextRecordRevision,
          preferenceRevision: record.preferenceRevision,
          changedInputs: [],
          createdAt: committedAt,
        }],
        idempotencyRecords: [...record.idempotencyRecords, {
          operation: 'record_planning_evidence',
          idempotencyKey,
          requestHash,
          committedRecordRevision: nextRecordRevision,
          completedAt: committedAt,
        }],
        updatedAt: committedAt,
      }
      return { changed: true, record: nextRecord, result: nextRecord }
    },
  })
}

function compatibilityResolution(
  record: PrivateExactEditPreferenceRecord,
  lifecycle: ExactEditPreferenceLifecycleState,
): PlanningExactEditPreferenceAuthorityResolution {
  const authority = compatibilityAuthority(record, lifecycle)
  return createResolution({
    sourceAuthority: 'private_exact_edit_preference_compatibility',
    evidenceClass: 'private_internal_compatibility',
    tenantIsolationVerified: false,
    rlsPolicyVersion: null,
    noLegacyExactPreferenceStoreRead: false,
    productionAuthority: false,
    authority,
  })
}

function compatibilityAuthority(
  record: PrivateExactEditPreferenceRecord,
  lifecycle: ExactEditPreferenceLifecycleState,
): CanonicalExactEditPlanningAuthorityRead {
  const sourcePreparation = record.planning.sourcePreparation.status === 'ready'
    ? {
        status: 'ready' as const,
        sourceCandidateHashSha256: null,
        evidenceHashSha256: record.planning.sourcePreparation.evidenceHash,
        confirmedAt: record.planning.sourcePreparation.updatedAt,
      }
    : {
        status: record.planning.sourcePreparation.status === 'requires_repreparation'
          ? 'requires_repreparation' as const
          : 'not_ready' as const,
        sourceCandidateHashSha256: null,
        evidenceHashSha256: null,
        confirmedAt: null,
      }
  const frame = record.planning.frameConfirmation
  const frameConfirmation = frame.status === 'confirmed'
    ? {
        status: 'confirmed' as const,
        confirmationId: frame.confirmationId,
        aspectRatio: frame.aspectRatio,
        confirmedAt: frame.updatedAt,
        authorityDigestSha256: sha256AuthorityValue({
          workspaceId: record.workspaceId,
          projectId: record.projectId,
          editSessionId: record.editSessionId,
          recordRevision: record.recordRevision,
          planningInputRevision: record.planning.planningInputRevision,
          confirmationId: frame.confirmationId,
          aspectRatio: frame.aspectRatio,
          confirmedAt: frame.updatedAt,
        }),
      }
    : {
        status: 'not_confirmed' as const,
        confirmationId: null,
        aspectRatio: null,
        confirmedAt: null,
        authorityDigestSha256: null,
      }
  return canonicalExactEditPlanningAuthorityReadSchema.parse({
    schemaVersion: CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_VERSION,
    sourceAuthority: 'private_exact_edit_preference_compatibility',
    runtimeSource: 'private_internal',
    authorityReadReceiptId: `private-exact-edit-read-${sha256AuthorityValue({
      workspaceId: record.workspaceId,
      projectId: record.projectId,
      editSessionId: record.editSessionId,
      recordRevision: record.recordRevision,
    }).slice(0, 48)}`,
    workspaceId: record.workspaceId,
    projectId: record.projectId,
    editSessionId: record.editSessionId,
    recordRevision: record.recordRevision,
    preferenceRevision: record.preferenceRevision,
    planningInputRevision: record.planning.planningInputRevision,
    preferenceFingerprintSha256: exactEditPreferenceFingerprint(record.values),
    values: structuredClone(record.values),
    baseline: {
      preferenceSnapshotId: record.baseline.preferenceSnapshotId,
      values: structuredClone(record.baseline.values),
      preferenceFingerprintSha256: exactEditPreferenceFingerprint(record.baseline.values),
      capturedAt: record.baseline.capturedAt,
      persistenceSource: record.baseline.persistenceSource,
      provenance: record.baseline.provenance,
    },
    sourcePreparation,
    frameConfirmation,
    lifecyclePhase: lifecycle.phase,
    locked: lifecycle.locked,
    currentApplicationState: 'not_selected',
    currentApplicationId: null,
    readAt: new Date().toISOString(),
    browserMutationAuthorityGranted: false,
    productionReleaseReadinessEvaluatedSeparately: true,
  })
}

function createResolution(input: Omit<
  PlanningExactEditPreferenceAuthorityResolution,
  'schemaVersion' | 'noFallbackAfterAuthorityRead'
    | 'browserMutationAuthorityAccepted' | 'authorityReceiptHash'
>): PlanningExactEditPreferenceAuthorityResolution {
  const payload = {
    schemaVersion: PLANNING_EXACT_EDIT_PREFERENCE_AUTHORITY_PORT_VERSION,
    ...input,
    noFallbackAfterAuthorityRead: true as const,
    browserMutationAuthorityAccepted: false as const,
  }
  return validatePlanningExactEditPreferenceAuthorityResolution({
    ...payload,
    authorityReceiptHash: sha256AuthorityValue(payload),
  })
}

async function requirePrivateRecord(
  scope: PlanningExactEditPreferenceAuthorityScope,
): Promise<PrivateExactEditPreferenceRecord> {
  const record = await readPrivateExactEditPreferenceRecord(privateScope(scope))
  if (!record) throw authorityUnavailable('private_exact_edit_preference_missing')
  return record
}

function privateScope(
  scope: PlanningExactEditPreferenceAuthorityScope,
): ExactEditPreferenceStoreScope {
  return { ...scope }
}

function assertExpectedAuthority(
  record: PrivateExactEditPreferenceRecord,
  request: CanonicalExactEditPlanningEvidenceRequest,
): void {
  if (
    record.preferenceRevision !== request.expectedPreferenceRevision
    || record.planning.planningInputRevision !== request.expectedPlanningInputRevision
    || exactEditPreferenceFingerprint(record.values)
      !== request.expectedPreferenceFingerprintSha256
    || record.baseline.preferenceSnapshotId
      !== request.expectedBaselinePreferenceSnapshotId
  ) throw staleAuthority('Exact-edit preferences changed before planning evidence was recorded.')
}

function assertRequestScope(
  scope: PlanningExactEditPreferenceAuthorityScope,
  request: CanonicalExactEditPlanningEvidenceRequest,
): void {
  const parsed = canonicalExactEditPlanningEvidenceRequestSchema.parse(request)
  if (
    parsed.schemaVersion !== CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_REQUEST_VERSION
    || parsed.actorUserId !== scope.ownerUserId
    || parsed.workspaceId !== scope.workspaceId
    || parsed.projectId !== scope.projectId
    || parsed.editSessionId !== scope.editSessionId
  ) throw staleAuthority('Planning evidence scope changed before it reached canonical authority.')
}

function assertRuntimeQualification(
  context: ServiceContext,
  resolution: PlanningExactEditPreferenceAuthorityResolution,
): void {
  if (isExplicitLocalInternalTestRuntime(context.env)) return
  if (
    resolution.sourceAuthority !== 'canonical_exact_edit_preference_repository'
    || resolution.evidenceClass !== 'canonical_backend_verified_runtime'
    || !resolution.noLegacyExactPreferenceStoreRead
    || !resolution.productionAuthority
  ) throw authorityUnavailable('canonical_exact_edit_planning_authority_not_release_qualified')
}

function staleAuthority(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredFlow: 'refresh_replan_reestimate_and_present_new_canonical_plan',
  })
}

function authorityUnavailable(reason: string): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    'Canonical exact-edit preference planning authority is unavailable.',
    503,
    {
      reason,
      requiredGate: 'one_canonical_exact_edit_preference_planning_authority',
      productionReady: false,
    },
  )
}
