import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type { CanonicalPlanComponentsInput } from '../validation/edit-planning-authority-schemas'
import {
  planningInputAuthorityExpectationSchema,
  resolvedPlanningInputAuthorityBindingSchema,
  type PlanningInputAuthorityExpectation,
  type ResolvedPlanningInputAuthorityBinding,
} from '../validation/planning-input-authority-binding-schemas'
import { buildEditBriefAuthorityPublicationBinding } from './edit-brief-authority-service'
import {
  readPrivateEditBriefAuthorityAggregate,
  type EditBriefAuthorityScope,
  type PrivateEditBriefAuthorityAggregate,
} from './private-edit-brief-authority-store'
import {
  assertPlanningPreferenceApplicationExpectation,
  PLANNING_PREFERENCE_INSTRUCTION_PRIORITY,
  planningPreferenceApplicationExpectationFromResolution,
  readPlanningPreferenceApplicationAuthority,
  type PlanningPreferenceApplicationAuthorityResolution,
} from './planning-preference-application-authority-port'
import {
  readPlanningExactEditPreferenceAuthority,
  type PlanningExactEditPreferenceAuthorityResolution,
} from './planning-exact-edit-preference-authority-port'
import type {
  CanonicalExactEditPlanningAuthorityRead,
} from '../../src/types/canonical-exact-edit-planning-authority'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'
import {
  resolveCanonicalExactEditPreferenceInstruction,
} from './canonical-exact-edit-preference-instruction'

export interface PlanningInputAuthorityScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
}

export async function resolvePlanningInputAuthorityBinding(input: {
  context: ServiceContext
  scope: PlanningInputAuthorityScope
  expectation: PlanningInputAuthorityExpectation
  components: CanonicalPlanComponentsInput
}): Promise<ResolvedPlanningInputAuthorityBinding> {
  const expectation = planningInputAuthorityExpectationSchema.parse(input.expectation)
  const exactPreferenceAuthority = await readPlanningExactEditPreferenceAuthority({
    context: input.context,
    scope: input.scope,
  })
  const preferenceApplicationAuthority = await readPlanningPreferenceApplicationAuthority({
    context: input.context,
    scope: input.scope,
  })
  assertCanonicalPlanningRevisionSynchronization(
    exactPreferenceAuthority,
    preferenceApplicationAuthority,
  )
  const exactEditPreference = resolveExactEditPreferenceBinding(
    exactPreferenceAuthority.authority,
    expectation,
    input.components,
  )
  const preferenceApplication = assertPlanningPreferenceApplicationExpectation({
    resolution: preferenceApplicationAuthority,
    expectation: expectation.preferenceApplication,
  })
  const editBriefAggregate = await readPrivateEditBriefAuthorityAggregate(editBriefScope(input.scope))
  const editBrief = resolveEditBriefBinding(
    editBriefAggregate,
    input.scope,
    expectation.editBrief,
    input.components,
    preferenceApplication,
  )
  const bindingWithoutHash = {
    schemaVersion: 'canonical-planning-input-authority-binding-v1' as const,
    workspaceId: input.scope.workspaceId,
    projectId: input.scope.projectId,
    editSessionId: input.scope.editSessionId,
    exactEditPreference,
    preferenceApplication,
    editBrief,
    instructionPriority: [...PLANNING_PREFERENCE_INSTRUCTION_PRIORITY],
    noRuntimeSideEffects: true as const,
  }
  return resolvedPlanningInputAuthorityBindingSchema.parse({
    ...bindingWithoutHash,
    bindingHash: sha256AuthorityValue(bindingWithoutHash),
  })
}

export async function revalidatePlanningInputAuthorityBinding(input: {
  context: ServiceContext
  scope: PlanningInputAuthorityScope
  persistedBinding: ResolvedPlanningInputAuthorityBinding
  components: CanonicalPlanComponentsInput
}): Promise<ResolvedPlanningInputAuthorityBinding> {
  const persisted = resolvedPlanningInputAuthorityBindingSchema.parse(input.persistedBinding)
  const current = await resolvePlanningInputAuthorityBinding({
    context: input.context,
    scope: input.scope,
    expectation: planningInputAuthorityExpectationFromResolvedBinding(persisted),
    components: input.components,
  })
  if (current.bindingHash !== persisted.bindingHash || stableAuthorityStringify(current) !== stableAuthorityStringify(persisted)) {
    throw stalePlanningAuthority('Preference or Edit Brief authority changed after canonical plan publication.')
  }
  return current
}

export async function buildCurrentPlanningInputAuthorityExpectation(
  input: {
    context: ServiceContext
    scope: PlanningInputAuthorityScope
  },
): Promise<PlanningInputAuthorityExpectation> {
  const { context, scope } = input
  const exactPreferenceAuthority = await readPlanningExactEditPreferenceAuthority({
    context,
    scope,
  })
  const preferenceApplicationAuthority =
    await readPlanningPreferenceApplicationAuthority({ context, scope })
  assertCanonicalPlanningRevisionSynchronization(
    exactPreferenceAuthority,
    preferenceApplicationAuthority,
  )
  const preferenceApplication = planningPreferenceApplicationExpectationFromResolution(
    preferenceApplicationAuthority,
  )
  const editBriefAggregate = await readPrivateEditBriefAuthorityAggregate(editBriefScope(scope))
  const editBrief: PlanningInputAuthorityExpectation['editBrief'] = editBriefAggregate
    ? (() => {
        const publicationBinding = buildEditBriefAuthorityPublicationBinding(editBriefAggregate)
        return {
          status: 'bound' as const,
          aggregateRevision: publicationBinding.aggregateRevision,
          deterministicHash: publicationBinding.deterministicHash,
        }
      })()
    : { status: 'not_used' }
  return planningInputAuthorityExpectationSchema.parse({
    exactEditPreference: {
      recordRevision: exactPreferenceAuthority.authority.recordRevision,
      preferenceRevision: exactPreferenceAuthority.authority.preferenceRevision,
      planningInputRevision:
        exactPreferenceAuthority.authority.planningInputRevision,
      preferenceFingerprintSha256:
        exactPreferenceAuthority.authority.preferenceFingerprintSha256,
      sourcePreparationEvidenceHash:
        exactPreferenceAuthority.authority.sourcePreparation.status === 'ready'
          ? exactPreferenceAuthority.authority.sourcePreparation.evidenceHashSha256
          : missingPlanningEvidence('source preparation'),
      sourceCandidateHash:
        exactPreferenceAuthority.authority.sourcePreparation.status === 'ready'
          ? exactPreferenceAuthority.authority.sourcePreparation.sourceCandidateHashSha256
          : null,
      frameConfirmationId:
        exactPreferenceAuthority.authority.frameConfirmation.status === 'confirmed'
          ? exactPreferenceAuthority.authority.frameConfirmation.confirmationId
          : missingPlanningEvidence('output frame'),
    },
    preferenceApplication,
    editBrief,
  })
}

function resolveExactEditPreferenceBinding(
  authority: CanonicalExactEditPlanningAuthorityRead,
  expectation: PlanningInputAuthorityExpectation,
  components: CanonicalPlanComponentsInput,
) {
  const expected = expectation.exactEditPreference
  if (
    authority.recordRevision !== expected.recordRevision ||
    authority.preferenceRevision !== expected.preferenceRevision ||
    authority.planningInputRevision !== expected.planningInputRevision ||
    authority.preferenceFingerprintSha256 !== expected.preferenceFingerprintSha256 ||
    authority.sourcePreparation.status !== 'ready' ||
    authority.sourcePreparation.evidenceHashSha256
      !== expected.sourcePreparationEvidenceHash ||
    authority.sourcePreparation.sourceCandidateHashSha256
      !== expected.sourceCandidateHash ||
    authority.frameConfirmation.status !== 'confirmed' ||
    authority.frameConfirmation.confirmationId !== expected.frameConfirmationId
  ) throw stalePlanningAuthority('Exact-edit preferences changed after the planner loaded them.')
  if (authority.sourcePreparation.status !== 'ready') {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Confirmed source-preparation evidence is required before canonical plan publication.', 409)
  }
  if (authority.frameConfirmation.status !== 'confirmed') {
    throw new ApiError('PLAN_NOT_APPROVED', 'Confirmed output-frame evidence is required before canonical plan publication.', 409)
  }
  const preferenceInstruction =
    resolveCanonicalExactEditPreferenceInstruction({ authority, components })
  if (
    components.confirmedSettings.aspectRatio !== authority.frameConfirmation.aspectRatio ||
    components.confirmedSettings.preferenceSnapshotId
      !== authority.baseline.preferenceSnapshotId ||
    components.confirmedSettings.preferenceRevision !== authority.preferenceRevision ||
    components.confirmedSettings.preferencePlanningInputRevision
      !== authority.planningInputRevision ||
    components.confirmedSettings.preferenceFingerprintSha256
      !== authority.preferenceFingerprintSha256
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical confirmed settings do not match the exact server-owned edit preference authority.',
      409,
    )
  }
  return {
    recordRevision: authority.recordRevision,
    preferenceRevision: authority.preferenceRevision,
    planningInputRevision: authority.planningInputRevision,
    preferenceFingerprintSha256: authority.preferenceFingerprintSha256,
    values: structuredClone(authority.values),
    effectiveValues: preferenceInstruction.effectiveValues,
    instructionSource: preferenceInstruction.source,
    explicitChatOverrideKeys: preferenceInstruction.overrideKeys,
    explicitChatOverrides: preferenceInstruction.overrides,
    instructionHash: preferenceInstruction.instructionHash,
    baseline: {
      preferenceSnapshotId: authority.baseline.preferenceSnapshotId,
      persistenceSource: authority.baseline.persistenceSource,
      provenance: authority.baseline.provenance,
    },
    sourcePreparationEvidenceHash: authority.sourcePreparation.evidenceHashSha256,
    sourceCandidateHash: authority.sourcePreparation.sourceCandidateHashSha256,
    frameConfirmationId: authority.frameConfirmation.confirmationId,
    confirmedAspectRatio: authority.frameConfirmation.aspectRatio,
    lifecyclePhase: authority.lifecyclePhase,
    locked: authority.locked,
  }
}

function resolveEditBriefBinding(
  aggregate: PrivateEditBriefAuthorityAggregate | undefined,
  scope: PlanningInputAuthorityScope,
  expectation: PlanningInputAuthorityExpectation['editBrief'],
  components: CanonicalPlanComponentsInput,
  preferenceApplication: ResolvedPlanningInputAuthorityBinding['preferenceApplication'],
) {
  if (!aggregate) {
    if (expectation.status !== 'not_used') throw stalePlanningAuthority('Expected Edit Brief authority does not exist.')
    return {
      status: 'not_used' as const,
      deterministicHash: sha256AuthorityValue({
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        editSessionId: scope.editSessionId,
        status: 'not_used',
      }),
    }
  }
  if (expectation.status !== 'bound') {
    throw stalePlanningAuthority('An existing Edit Brief/Marker workspace cannot be silently excluded from planning.')
  }
  const publicationBinding = buildEditBriefAuthorityPublicationBinding(aggregate)
  if (
    publicationBinding.aggregateRevision !== expectation.aggregateRevision ||
    publicationBinding.deterministicHash !== expectation.deterministicHash
  ) throw stalePlanningAuthority('Edit Brief authority changed after the planner loaded it.')
  if (publicationBinding.hasApprovalBlockers) {
    throw new ApiError('PLAN_NOT_APPROVED', 'Edit Brief markers, frame confirmation, QA, or conflicts still block canonical publication.', 409, {
      qaStatus: publicationBinding.qaStatus,
      activeMarkerCount: publicationBinding.activeMarkerCount,
      confirmedMarkerCount: publicationBinding.confirmedMarkerCount,
      openConflictCount: publicationBinding.openConflictCount,
    })
  }
  assertEditBriefFrameMatchesCanonical(aggregate, components)
  const planHint = [...aggregate.planHintPackages].reverse().find((candidate) =>
    candidate.authorityInputHash === publicationBinding.authorityInputHash &&
    candidate.readiness === 'ready_for_planning'
  )
  if (!planHint) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'A current ready-for-planning Edit Brief hint package is required.', 409)
  }
  if (
    publicationBinding.planHintPackageId !== planHint.id ||
    publicationBinding.planHintFingerprint !== planHint.planHintFingerprint ||
    publicationBinding.planHintReadiness !== 'ready_for_planning' ||
    publicationBinding.planInputQaStatus !== 'passed' ||
    !publicationBinding.planHintsAreCurrent ||
    publicationBinding.preferenceFingerprint !== planHint.preferenceBinding.fingerprint ||
    (preferenceApplication.status === 'applied' && (
      publicationBinding.preferenceId !== preferenceApplication.preferenceId ||
      publicationBinding.preferenceDNAId !== preferenceApplication.dnaVersionId ||
      publicationBinding.preferenceDNAVersion !== preferenceApplication.dnaVersion
    )) ||
    (preferenceApplication.status !== 'applied' && publicationBinding.preferenceId !== undefined)
  ) {
    throw new ApiError('PLAN_NOT_APPROVED', 'Edit Brief Plan Hint or selected Preference binding is stale.', 409)
  }
  const confirmedMarkerHints = planHint.confirmedMarkerHints.map((hint) => ({ ...structuredClone(hint) }))
  const resolvedWithoutHash = {
    status: 'bound' as const,
    publicationBinding,
    exportSettings: structuredClone(aggregate.exportSettings!) as unknown as Record<string, unknown>,
    confirmedMarkerHints: confirmedMarkerHints as unknown as Array<Record<string, unknown>>,
    planHintPackageId: planHint.id,
    planHintAuthorityInputHash: planHint.authorityInputHash,
  }
  return {
    ...resolvedWithoutHash,
    deterministicHash: sha256AuthorityValue(resolvedWithoutHash),
  }
}

function assertEditBriefFrameMatchesCanonical(
  aggregate: PrivateEditBriefAuthorityAggregate,
  components: CanonicalPlanComponentsInput,
): void {
  const settings = aggregate.exportSettings
  if (!settings || settings.confirmationStatus !== 'confirmed' || settings.frameRate !== components.confirmedSettings.outputFrame.fps) {
    throw new ApiError('PLAN_NOT_APPROVED', 'Edit Brief frame authority does not match canonical timing.', 409)
  }
  if (settings.aspectRatio === 'custom') {
    if (
      settings.customWidth !== components.confirmedSettings.outputFrame.width ||
      settings.customHeight !== components.confirmedSettings.outputFrame.height
    ) throw new ApiError('PLAN_NOT_APPROVED', 'Custom Edit Brief output dimensions changed after confirmation.', 409)
  } else if (settings.aspectRatio !== components.confirmedSettings.aspectRatio) {
    throw new ApiError('PLAN_NOT_APPROVED', 'Edit Brief aspect ratio does not match canonical confirmed settings.', 409)
  }
}

export function planningInputAuthorityExpectationFromResolvedBinding(
  binding: ResolvedPlanningInputAuthorityBinding,
): PlanningInputAuthorityExpectation {
  const application = binding.preferenceApplication
  const preferenceApplication: PlanningInputAuthorityExpectation['preferenceApplication'] = application.status === 'not_selected'
    ? { status: 'not_selected', applicationVersion: 0 }
    : application.status === 'cleared'
      ? {
          status: 'cleared',
          applicationId: application.applicationId,
          applicationVersion: application.applicationVersion,
          applicationHash: application.applicationHash,
        }
      : {
          status: 'applied',
          applicationId: application.applicationId,
          applicationVersion: application.applicationVersion,
          preferenceId: application.preferenceId,
          dnaVersionId: application.dnaVersionId,
          dnaVersion: application.dnaVersion,
          applicationHash: application.applicationHash,
        }
  return {
    exactEditPreference: {
      recordRevision: binding.exactEditPreference.recordRevision,
      preferenceRevision: binding.exactEditPreference.preferenceRevision,
      planningInputRevision: binding.exactEditPreference.planningInputRevision,
      preferenceFingerprintSha256: binding.exactEditPreference.preferenceFingerprintSha256,
      sourcePreparationEvidenceHash:
        binding.exactEditPreference.sourcePreparationEvidenceHash,
      sourceCandidateHash: binding.exactEditPreference.sourceCandidateHash,
      frameConfirmationId: binding.exactEditPreference.frameConfirmationId,
    },
    preferenceApplication,
    editBrief: binding.editBrief.status === 'not_used'
      ? { status: 'not_used' }
      : {
          status: 'bound',
          aggregateRevision: binding.editBrief.publicationBinding.aggregateRevision,
          deterministicHash: binding.editBrief.publicationBinding.deterministicHash,
        },
  }
}

function assertCanonicalPlanningRevisionSynchronization(
  exactPreference: PlanningExactEditPreferenceAuthorityResolution,
  preferenceApplication: PlanningPreferenceApplicationAuthorityResolution,
): void {
  const bothCanonical = exactPreference.sourceAuthority
    === 'canonical_exact_edit_preference_repository'
    && preferenceApplication.sourceAuthority
      === 'canonical_edit_reference_production_repository'
  if (
    bothCanonical
    && preferenceApplication.readRevision
      !== exactPreference.authority.planningInputRevision
  ) {
    throw stalePlanningAuthority(
      'Exact-edit preferences and the selected Preference application were read from different planning revisions.',
    )
  }
}

function editBriefScope(scope: PlanningInputAuthorityScope): EditBriefAuthorityScope {
  return { ...scope }
}

function stalePlanningAuthority(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredFlow: 'replan_reestimate_and_present_new_canonical_plan',
  })
}

function missingPlanningEvidence(kind: string): never {
  throw new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    `Confirmed ${kind} evidence is required before canonical planning.`,
    409,
  )
}
