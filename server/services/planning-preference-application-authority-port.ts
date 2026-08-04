import type { ServiceContext } from '../types'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import type {
  PlanningInputAuthorityExpectation,
  ResolvedPlanningInputAuthorityBinding,
} from '../validation/planning-input-authority-binding-schemas'
import { resolvedPlanningInputAuthorityBindingSchema } from '../validation/planning-input-authority-binding-schemas'
import { ApiError } from '../errors/api-error'
import {
  preferenceIntelligenceHash,
  readPrivatePreferenceIntelligenceAggregate,
  type PreferenceDnaApplicationRecord,
  type PreferenceIntelligenceScope,
  type PrivatePreferenceIntelligenceAggregate,
} from './private-preference-intelligence-store'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

export const PLANNING_PREFERENCE_APPLICATION_AUTHORITY_PORT_VERSION =
  'planning-preference-application-authority-port-v1' as const

export const PLANNING_PREFERENCE_INSTRUCTION_PRIORITY = [
  'safety_legal_and_do_not_copy',
  'latest_explicit_user_instruction',
  'confirmed_edit_brief_marker',
  'approved_project_override',
  'selected_preference_dna',
  'general_defaults',
  'deterministic_fallback',
] as const

export interface PlanningPreferenceApplicationAuthorityScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
}

export type PlanningPreferenceApplicationBinding =
  ResolvedPlanningInputAuthorityBinding['preferenceApplication']

export type PlanningPreferenceApplicationAuthoritySource =
  | 'canonical_edit_reference_production_repository'
  | 'private_preference_intelligence_compatibility'

export type PlanningPreferenceApplicationAuthorityEvidenceClass =
  | 'canonical_backend_verified_runtime'
  | 'canonical_contract_fixture_unreleased'
  | 'private_internal_compatibility'

export type PlanningPreferenceApplicationCanonicalLineage =
  | {
      state: 'not_selected'
    }
  | {
      state: 'cleared'
      applicationId: string
      applicationVersion: number
      applicationHash: string
      lifecycleTransactionId: string
      lifecycleReceiptDigestSha256: string
      committedPlanningInputRevision: number
    }
  | {
      state: 'connected'
      applicationId: string
      applicationVersion: number
      applicationHash: string
      lifecycleTransactionId: string
      lifecycleReceiptDigestSha256: string
      planningContextDigestSha256: string
      adapterDigestSha256: string
    }

export interface PlanningPreferenceApplicationAuthorityResolution {
  schemaVersion: typeof PLANNING_PREFERENCE_APPLICATION_AUTHORITY_PORT_VERSION
  sourceAuthority: PlanningPreferenceApplicationAuthoritySource
  evidenceClass: PlanningPreferenceApplicationAuthorityEvidenceClass
  currentState: 'not_selected' | 'connected' | 'cleared'
  readRevision: number
  accessCheckReceiptId: string
  rlsPolicyVersion: string | null
  tenantIsolationVerified: boolean
  noLegacyPreferenceIntelligenceStoreRead: boolean
  noFallbackAfterAuthorityRead: true
  browserSuppliedPlannerContextTrusted: false
  rawReferenceMediaIncluded: false
  rawProviderPayloadIncluded: false
  productionAuthority: boolean
  canonicalLineage?: PlanningPreferenceApplicationCanonicalLineage
  preferenceApplication: PlanningPreferenceApplicationBinding
  authorityReceiptHash: string
}

export interface PlanningPreferenceApplicationAuthorityPort {
  readExactApplicationState(
    scope: PlanningPreferenceApplicationAuthorityScope,
  ): Promise<PlanningPreferenceApplicationAuthorityResolution>
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const privateCompatibilityPort: PlanningPreferenceApplicationAuthorityPort = {
  async readExactApplicationState(scope) {
    return readPrivatePreferenceApplicationCompatibilityAuthority(scope)
  },
}

/**
 * Selects exactly one PreferenceApplication authority for this planning read.
 *
 * A caller-injected canonical Edit Reference port wins exclusively. The
 * private compatibility adapter is used only when no port was injected and
 * only in non-production local/internal runtime. There is never a secondary
 * read or fallback after the selected authority returns `cleared`.
 */
export async function readPlanningPreferenceApplicationAuthority(input: {
  context: ServiceContext
  scope: PlanningPreferenceApplicationAuthorityScope
}): Promise<PlanningPreferenceApplicationAuthorityResolution> {
  if (
    !input.context.planningPreferenceApplicationAuthorityPort &&
    !isExplicitLocalInternalTestRuntime(input.context.env)
  ) {
    throw canonicalPlanningAuthorityRequired()
  }
  const selectedPort = input.context.planningPreferenceApplicationAuthorityPort ??
    privateCompatibilityPort
  const resolution = validatePlanningPreferenceApplicationAuthorityResolution(
    await selectedPort.readExactApplicationState(input.scope),
  )
  if (
    resolution.sourceAuthority ===
      'private_preference_intelligence_compatibility' &&
    !isExplicitLocalInternalTestRuntime(input.context.env)
  ) {
    throw canonicalPlanningAuthorityRequired()
  }
  if (
    input.context.env.nodeEnv === 'production' && (
      resolution.sourceAuthority !==
        'canonical_edit_reference_production_repository' ||
      resolution.evidenceClass !== 'canonical_backend_verified_runtime' ||
      !resolution.noLegacyPreferenceIntelligenceStoreRead ||
      !resolution.productionAuthority
    )
  ) {
    throw canonicalPlanningAuthorityRequired(resolution)
  }
  return resolution
}

export function validatePlanningPreferenceApplicationAuthorityResolution(
  value: PlanningPreferenceApplicationAuthorityResolution,
): PlanningPreferenceApplicationAuthorityResolution {
  const preferenceApplication =
    resolvedPlanningInputAuthorityBindingSchema.shape.preferenceApplication.parse(
      value.preferenceApplication,
    )
  const { authorityReceiptHash, ...payload } = value
  const canonical = value.sourceAuthority ===
    'canonical_edit_reference_production_repository'
  const stateMatches =
    (value.currentState === 'not_selected' &&
      preferenceApplication.status === 'not_selected') ||
    (value.currentState === 'connected' &&
      preferenceApplication.status === 'applied') ||
    (value.currentState === 'cleared' &&
      preferenceApplication.status === 'cleared')
  const canonicalEvidence = value.evidenceClass ===
    'canonical_backend_verified_runtime' ||
    value.evidenceClass === 'canonical_contract_fixture_unreleased'
  const canonicalTenantEvidence = canonical
    ? value.tenantIsolationVerified === true &&
      typeof value.rlsPolicyVersion === 'string' &&
      SAFE_ID.test(value.rlsPolicyVersion)
    : value.tenantIsolationVerified === false &&
      value.rlsPolicyVersion === null
  const canonicalAppliedBindingValid = !canonical ||
    preferenceApplication.status !== 'applied' || (
      preferenceApplication.plannerContext.runtimeState === 'verified_live' &&
      preferenceApplication.plannerContext.qaStatus === 'passed' &&
      preferenceApplication.plannerContext.audience === 'planner' &&
      preferenceApplication.plannerContext.preferenceId ===
        preferenceApplication.preferenceId &&
      preferenceApplication.plannerContext.preferenceDNAId ===
        preferenceApplication.dnaVersionId &&
      preferenceApplication.plannerContext.preferenceDNAVersion ===
        preferenceApplication.dnaVersion &&
      stableAuthorityStringify(
        preferenceApplication.plannerContext.instructionPriority,
      ) === stableAuthorityStringify(
        PLANNING_PREFERENCE_INSTRUCTION_PRIORITY,
      )
    )
  const canonicalLineageValid = canonical
    ? validateCanonicalLineage(value, preferenceApplication)
    : value.canonicalLineage === undefined
  if (
    value.schemaVersion !==
      PLANNING_PREFERENCE_APPLICATION_AUTHORITY_PORT_VERSION ||
    !stateMatches ||
    !Number.isInteger(value.readRevision) ||
    value.readRevision < 0 ||
    !SAFE_ID.test(value.accessCheckReceiptId) ||
    !SHA256.test(authorityReceiptHash) ||
    authorityReceiptHash !== sha256AuthorityValue(payload) ||
    value.noFallbackAfterAuthorityRead !== true ||
    canonical !== canonicalEvidence ||
    !canonicalTenantEvidence ||
    !canonicalLineageValid ||
    !canonicalAppliedBindingValid ||
    (canonical && !value.noLegacyPreferenceIntelligenceStoreRead) ||
    (!canonical && value.noLegacyPreferenceIntelligenceStoreRead) ||
    value.productionAuthority !==
      (canonical && value.evidenceClass ===
        'canonical_backend_verified_runtime') ||
    value.browserSuppliedPlannerContextTrusted !== false ||
    value.rawReferenceMediaIncluded !== false ||
    value.rawProviderPayloadIncluded !== false
  ) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'PreferenceApplication planning authority evidence is invalid.',
      503,
      { requiredGate: 'one_canonical_preference_application_planning_authority' },
    )
  }
  return {
    ...value,
    preferenceApplication,
  }
}

export function assertPlanningPreferenceApplicationExpectation(input: {
  resolution: PlanningPreferenceApplicationAuthorityResolution
  expectation: PlanningInputAuthorityExpectation['preferenceApplication']
}): PlanningPreferenceApplicationBinding {
  const resolution = validatePlanningPreferenceApplicationAuthorityResolution(
    input.resolution,
  )
  const application = resolution.preferenceApplication
  const expectation = input.expectation
  const matches = application.status === 'not_selected'
    ? expectation.status === 'not_selected' &&
      expectation.applicationVersion === 0
    : application.status === 'cleared'
      ? expectation.status === 'cleared' &&
        expectation.applicationId === application.applicationId &&
        expectation.applicationVersion === application.applicationVersion &&
        expectation.applicationHash === application.applicationHash
      : expectation.status === 'applied' &&
        expectation.applicationId === application.applicationId &&
        expectation.applicationVersion === application.applicationVersion &&
        expectation.preferenceId === application.preferenceId &&
        expectation.dnaVersionId === application.dnaVersionId &&
        expectation.dnaVersion === application.dnaVersion &&
        expectation.applicationHash === application.applicationHash
  if (!matches) {
    throw stalePlanningAuthority(
      'PreferenceApplication authority changed after the planner loaded it.',
    )
  }
  return structuredClone(application)
}

export function planningPreferenceApplicationExpectationFromResolution(
  resolution: PlanningPreferenceApplicationAuthorityResolution,
): PlanningInputAuthorityExpectation['preferenceApplication'] {
  const application = validatePlanningPreferenceApplicationAuthorityResolution(
    resolution,
  ).preferenceApplication
  if (application.status === 'not_selected') {
    return { status: 'not_selected', applicationVersion: 0 }
  }
  if (application.status === 'cleared') {
    return {
      status: 'cleared',
      applicationId: application.applicationId,
      applicationVersion: application.applicationVersion,
      applicationHash: application.applicationHash,
    }
  }
  return {
    status: 'applied',
    applicationId: application.applicationId,
    applicationVersion: application.applicationVersion,
    preferenceId: application.preferenceId,
    dnaVersionId: application.dnaVersionId,
    dnaVersion: application.dnaVersion,
    applicationHash: application.applicationHash,
  }
}

function validateCanonicalLineage(
  resolution: PlanningPreferenceApplicationAuthorityResolution,
  application: PlanningPreferenceApplicationBinding,
): boolean {
  const lineage = resolution.canonicalLineage
  if (!lineage || lineage.state !== resolution.currentState) return false
  if (lineage.state === 'not_selected') {
    return application.status === 'not_selected'
  }
  if (lineage.state === 'cleared') {
    return application.status === 'cleared' &&
      SAFE_ID.test(lineage.applicationId) &&
      SAFE_ID.test(lineage.lifecycleTransactionId) &&
      Number.isInteger(lineage.applicationVersion) &&
      lineage.applicationVersion > 0 &&
      Number.isInteger(lineage.committedPlanningInputRevision) &&
      lineage.committedPlanningInputRevision > 0 &&
      SHA256.test(lineage.applicationHash) &&
      SHA256.test(lineage.lifecycleReceiptDigestSha256) &&
      lineage.applicationId === application.applicationId &&
      lineage.applicationVersion === application.applicationVersion &&
      lineage.applicationHash === application.applicationHash &&
      lineage.lifecycleReceiptDigestSha256 === application.applicationHash
  }
  return application.status === 'applied' &&
    SAFE_ID.test(lineage.applicationId) &&
    SAFE_ID.test(lineage.lifecycleTransactionId) &&
    Number.isInteger(lineage.applicationVersion) &&
    lineage.applicationVersion > 0 &&
    SHA256.test(lineage.applicationHash) &&
    SHA256.test(lineage.lifecycleReceiptDigestSha256) &&
    SHA256.test(lineage.planningContextDigestSha256) &&
    SHA256.test(lineage.adapterDigestSha256) &&
    lineage.applicationId === application.applicationId &&
    lineage.applicationVersion === application.applicationVersion &&
    lineage.applicationHash === application.applicationHash &&
    lineage.planningContextDigestSha256 === application.applicationHash
}

async function readPrivatePreferenceApplicationCompatibilityAuthority(
  scope: PlanningPreferenceApplicationAuthorityScope,
): Promise<PlanningPreferenceApplicationAuthorityResolution> {
  const aggregate = await readPrivatePreferenceIntelligenceAggregate(
    preferenceScope(scope),
  )
  const applications = aggregate?.applications.filter((candidate) =>
    candidate.projectId === scope.projectId &&
    candidate.editSessionId === scope.editSessionId) ?? []
  if (applications.length > 1) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Private compatibility authority returned multiple PreferenceApplications.',
      503,
      { requiredGate: 'zero_or_one_connected_application_verified' },
    )
  }
  const application = applications[0]
  const preferenceApplication = resolvePrivateCompatibilityBinding(
    aggregate,
    scope,
    application,
  )
  const currentState = preferenceApplication.status === 'applied'
    ? 'connected' as const
    : preferenceApplication.status
  const readRevision = aggregate?.revision ?? 0
  const accessCheckReceiptId = `private_pref_compat_${sha256AuthorityValue({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    readRevision,
    currentState,
    preferenceApplication,
  }).slice(0, 40)}`
  const payload = {
    schemaVersion: PLANNING_PREFERENCE_APPLICATION_AUTHORITY_PORT_VERSION,
    sourceAuthority:
      'private_preference_intelligence_compatibility' as const,
    evidenceClass: 'private_internal_compatibility' as const,
    currentState,
    readRevision,
    accessCheckReceiptId,
    rlsPolicyVersion: null,
    tenantIsolationVerified: false,
    noLegacyPreferenceIntelligenceStoreRead: false,
    noFallbackAfterAuthorityRead: true as const,
    browserSuppliedPlannerContextTrusted: false as const,
    rawReferenceMediaIncluded: false as const,
    rawProviderPayloadIncluded: false as const,
    productionAuthority: false,
    preferenceApplication,
  }
  return validatePlanningPreferenceApplicationAuthorityResolution({
    ...payload,
    authorityReceiptHash: sha256AuthorityValue(payload),
  })
}

function resolvePrivateCompatibilityBinding(
  aggregate: PrivatePreferenceIntelligenceAggregate | undefined,
  scope: PlanningPreferenceApplicationAuthorityScope,
  application: PreferenceDnaApplicationRecord | undefined,
): PlanningPreferenceApplicationBinding {
  if (!application) {
    return {
      status: 'not_selected',
      applicationVersion: 0,
      applicationHash: preferenceIntelligenceHash({
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        editSessionId: scope.editSessionId,
        status: 'not_selected',
        applicationVersion: 0,
      }),
    }
  }
  const applicationHash = preferenceIntelligenceHash(application)
  if (application.status === 'cleared') {
    return {
      status: 'cleared',
      applicationId: application.id,
      applicationVersion: application.applicationVersion,
      applicationHash,
    }
  }
  assertApprovedApplicationLineage(aggregate!, application)
  const dna = aggregate!.dnaVersions.find((candidate) =>
    candidate.id === application.selectedPreferenceDNAId)!
  return {
    status: 'applied',
    applicationId: application.id,
    applicationVersion: application.applicationVersion,
    preferenceId: application.selectedEditPreferenceId!,
    dnaVersionId: dna.id,
    dnaVersion: dna.version,
    applicationHash,
    plannerContext: {
      ...structuredClone(application.preferenceSummaryForPlanner!),
      instructionPriority: [
        ...application.preferenceSummaryForPlanner!.instructionPriority,
      ],
    },
  }
}

function assertApprovedApplicationLineage(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  application: PreferenceDnaApplicationRecord,
): void {
  const preference = aggregate.preferences.find((candidate) =>
    candidate.id === application.selectedEditPreferenceId)
  const dna = aggregate.dnaVersions.find((candidate) =>
    candidate.id === application.selectedPreferenceDNAId)
  const approval = aggregate.approvals.find((candidate) =>
    candidate.dnaVersionId === dna?.id)
  const qa = aggregate.qaResults.find((candidate) =>
    candidate.id === approval?.qaResultId)
  if (
    application.status !== 'applied' ||
    !preference || preference.status !== 'active' ||
    preference.currentApprovedDnaVersionId !== dna?.id ||
    !dna || dna.status !== 'approved' || !dna.approvedForApplication ||
    !approval || approval.preferenceId !== preference.id ||
    !qa || !qa.approvedForApplication ||
    !application.preferenceSummaryForPlanner ||
    application.preferenceSummaryForPlanner.preferenceDNAId !== dna.id ||
    application.preferenceSummaryForPlanner.preferenceDNAVersion !== dna.version ||
    stableAuthorityStringify(application.doNotCopyRules) !==
      stableAuthorityStringify(dna.doNotCopyRules) ||
    stableAuthorityStringify(
      application.preferenceSummaryForPlanner.instructionPriority,
    ) !== stableAuthorityStringify(PLANNING_PREFERENCE_INSTRUCTION_PRIORITY)
  ) {
    throw new ApiError(
      'PLAN_NOT_APPROVED',
      'Applied Preference DNA lacks complete approved QA/application lineage.',
      409,
    )
  }
}

function preferenceScope(
  scope: PlanningPreferenceApplicationAuthorityScope,
): PreferenceIntelligenceScope {
  return {
    localStorageRoot: scope.localStorageRoot,
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
  }
}

function stalePlanningAuthority(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredFlow: 'replan_reestimate_and_present_new_canonical_plan',
  })
}

function canonicalPlanningAuthorityRequired(
  resolution?: PlanningPreferenceApplicationAuthorityResolution,
): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    'Canonical Edit Reference planning authority is required outside protected local/internal testing.',
    503,
    {
      requiredGate:
        'server_only_application_and_planning_read_rpc_adapters_verified',
      sourceAuthority: resolution?.sourceAuthority ?? null,
      evidenceClass: resolution?.evidenceClass ?? null,
      remoteMutationAttempted: false,
    },
  )
}
