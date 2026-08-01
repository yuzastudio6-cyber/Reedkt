import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  LIVING_FRAME_REPRESENTATIVE_CASE_SOURCE_ADMISSION_VERSION,
  type LivingFrameRepresentativeCaseSourceAdmission,
  type LivingFrameRepresentativeCaseSourceAdmissionDraft,
  type LivingFrameRepresentativeCaseSourceAssignment,
  type LivingFrameRepresentativeCaseSourceUse,
} from '../../src/types/living-frame-representative-case-source-admission'
import type {
  LivingFrameOwnerScopeAmendment,
} from '../../src/types/living-frame-owner-scope-amendment'
import type {
  LivingFrameRepresentativeAssetRole,
  LivingFrameRepresentativeVisualFixtureManifest,
} from '../../src/types/living-frame-representative-visual-fixture'
import type {
  LivingFrameRepresentativeMediaSourceCandidate,
  LivingFrameRepresentativeMediaSourceCandidateId,
  LivingFrameRepresentativeMediaSourceCandidateSet,
} from '../../src/types/living-frame-representative-media-source-candidates'
import type {
  LivingFrameRepresentativePrivateSourceBinding,
} from '../../src/types/living-frame-representative-private-source-binding'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameOwnerScopeAmendment,
} from './living-frame-owner-scope-amendment'
import {
  verifyLivingFrameRepresentativeVisualFixtureManifest,
} from './living-frame-representative-visual-fixture'
import {
  verifyLivingFrameRepresentativeMediaSourceCandidateSet,
} from './living-frame-representative-media-source-candidates'
import {
  type CompileLivingFrameRepresentativePrivateSourceBindingInput,
  verifyLivingFrameRepresentativePrivateSourceBinding,
} from './living-frame-representative-private-source-binding'

export interface LivingFrameRepresentativeCasePrivateBindingInput {
  readonly binding: LivingFrameRepresentativePrivateSourceBinding
  readonly compileInput:
    CompileLivingFrameRepresentativePrivateSourceBindingInput
}

export interface CompileLivingFrameRepresentativeCaseSourceAdmissionInput {
  readonly ownerScopeAmendment: LivingFrameOwnerScopeAmendment
  readonly representativeVisualFixture:
    LivingFrameRepresentativeVisualFixtureManifest
  readonly sourceCandidateSet:
    LivingFrameRepresentativeMediaSourceCandidateSet
  readonly caseId:
    LivingFrameRepresentativeCaseSourceAdmission['caseId']
  readonly privateBindings:
    readonly LivingFrameRepresentativeCasePrivateBindingInput[]
}

export function compileLivingFrameRepresentativeCaseSourceAdmission(
  input: CompileLivingFrameRepresentativeCaseSourceAdmissionInput,
): LivingFrameRepresentativeCaseSourceAdmission {
  const normalized = assertInput(input)
  const caseOrder = LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.indexOf(
    normalized.caseId,
  )
  const visualCase = normalized.representativeVisualFixture.cases[caseOrder]!
  const caseSourceBinding = normalized.sourceCandidateSet.caseBindings[caseOrder]!
  const firstBinding = normalized.privateBindings[0]!.binding
  const assignments = normalized.privateBindings.map(
    ({ binding }, order): LivingFrameRepresentativeCaseSourceAssignment => {
      const sourceCandidate = normalized.sourceCandidateSet.sources.find(
        (candidate) => candidate.sourceCandidateId
          === binding.sourceCandidateId,
      )!
      return deepFreeze({
        sourceCandidateId: binding.sourceCandidateId,
        order,
        sourceUse: sourceUse(normalized.caseId, sourceCandidate),
        privateSourceBindingVersion: binding.contractVersion,
        privateSourceBindingDigestSha256: binding.bindingDigestSha256,
        selectionKind: binding.selection.selectionKind,
        approvedWorkRefDigestSha256:
          binding.canonicalBindings.approvedWorkRef.digestSha256,
        assetManifestEntryRefDigestSha256:
          binding.canonicalBindings.assetManifestEntryRef.digestSha256,
        exactBindingCanonicalRereadRequired: true,
      })
    },
  )
  const sourceDerivedAssetRolesCovered = coveredAssetRoles(
    caseSourceBinding.requiredSourceCandidateIds,
    visualCase.requiredAssetRoles,
  )
  const draft: LivingFrameRepresentativeCaseSourceAdmissionDraft = {
    contractVersion:
      LIVING_FRAME_REPRESENTATIVE_CASE_SOURCE_ADMISSION_VERSION,
    admissionClass:
      'byte_free_non_executable_exact_case_source_binding_admission_candidate',
    state:
      'source_binding_contract_complete_actual_canonical_reread_pending',
    caseId: normalized.caseId,
    caseOrder,
    activeScope: visualCase.activeScope,
    sourceCandidateSetVersion:
      normalized.sourceCandidateSet.contractVersion,
    sourceCandidateSetDigestSha256:
      normalized.sourceCandidateSet.candidateSetDigestSha256,
    representativeVisualFixtureVersion:
      normalized.representativeVisualFixture.contractVersion,
    representativeVisualFixtureDigestSha256:
      normalized.representativeVisualFixture.manifestDigestSha256,
    representativeVisualCaseDigestSha256: visualCase.caseDigestSha256,
    requiredSourceCandidateIds: [
      ...caseSourceBinding.requiredSourceCandidateIds,
    ],
    assignments,
    requiredAssetRoles: [...visualCase.requiredAssetRoles],
    sourceDerivedAssetRolesCovered,
    nonSourceDependencyRoles: visualCase.requiredAssetRoles.filter(
      (role) => !sourceDerivedAssetRolesCovered.includes(role),
    ),
    commonCanonicalLineage: {
      workspaceId: firstBinding.workspaceId,
      projectId: firstBinding.projectId,
      approvedSnapshotRef: structuredClone(
        firstBinding.canonicalBindings.approvedSnapshotRef,
      ),
      selectedSceneRef: structuredClone(
        firstBinding.canonicalBindings.selectedSceneRef,
      ),
      masterTimingRef: structuredClone(
        firstBinding.canonicalBindings.masterTimingRef,
      ),
      confirmedFrameRef: structuredClone(
        firstBinding.canonicalBindings.confirmedFrameRef,
      ),
    },
    exactRequiredCandidateSetBound: true,
    missingOrExtraSourceBindingAccepted: false,
    crossCaseSourceBindingAccepted: false,
    crossSnapshotSceneTimingOrFrameBindingAccepted: false,
    duplicateWorkOrManifestEntryAccepted: false,
    sourceToCanonicalAssetRoleReconciliationPending: true,
    canonicalConsumptionPending: true,
    sourceBytesPathsUrlsRawTranscriptOrChatSerialized: false,
    createsSourceSnapshotTimingWorkAssetRendererQaOrReviewOwner: false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    assetCreated: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    assignmentSetDigestSha256: sha256AuthorityValue(assignments),
    admissionDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameRepresentativeCaseSourceAdmission(
  value: unknown,
  input: CompileLivingFrameRepresentativeCaseSourceAdmissionInput,
): value is LivingFrameRepresentativeCaseSourceAdmission {
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameRepresentativeCaseSourceAdmission(input),
      )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameRepresentativeCaseSourceAdmissionInput,
): CompileLivingFrameRepresentativeCaseSourceAdmissionInput {
  if (!verifyLivingFrameOwnerScopeAmendment(input.ownerScopeAmendment)) {
    throw new Error('Invalid Living Frame owner scope amendment.')
  }
  if (!verifyLivingFrameRepresentativeVisualFixtureManifest(
    input.representativeVisualFixture,
    input.ownerScopeAmendment,
  )) throw new Error('Invalid Living Frame representative visual fixture.')
  if (!verifyLivingFrameRepresentativeMediaSourceCandidateSet(
    input.sourceCandidateSet,
  )) throw new Error('Invalid Living Frame representative source set.')
  const caseOrder = LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.indexOf(
    input.caseId,
  )
  if (caseOrder < 0) throw new Error('Unknown Living Frame active case.')
  const caseBinding = input.sourceCandidateSet.caseBindings[caseOrder]!
  const requiredIds = caseBinding.requiredSourceCandidateIds
  const observedIds = input.privateBindings.map(
    ({ binding }) => binding.sourceCandidateId,
  )
  if (
    input.privateBindings.length < 1
    || observedIds.length !== requiredIds.length
    || new Set(observedIds).size !== observedIds.length
    || observedIds.some((id, order) => id !== requiredIds[order])
    || input.privateBindings.some(({ binding, compileInput }) =>
      binding.sourceCandidateId !== compileInput.sourceCandidateId
      || compileInput.sourceCandidateSet.candidateSetDigestSha256
        !== input.sourceCandidateSet.candidateSetDigestSha256
      || !verifyLivingFrameRepresentativePrivateSourceBinding(
        binding,
        compileInput,
      ))
  ) throw new Error('Living Frame case source binding set is not exact.')

  const first = input.privateBindings[0]!.binding
  const commonLineage = canonicalCommonLineage(first)
  const approvedWorkRefs = new Set<string>()
  const assetManifestEntryRefs = new Set<string>()
  for (const { binding } of input.privateBindings) {
    if (
      binding.workspaceId !== first.workspaceId
      || binding.projectId !== first.projectId
      || binding.sourceCandidateSetDigestSha256
        !== input.sourceCandidateSet.candidateSetDigestSha256
      || stableAuthorityStringify(canonicalCommonLineage(binding))
        !== stableAuthorityStringify(commonLineage)
      || approvedWorkRefs.has(
        binding.canonicalBindings.approvedWorkRef.digestSha256,
      )
      || assetManifestEntryRefs.has(
        binding.canonicalBindings.assetManifestEntryRef.digestSha256,
      )
    ) throw new Error('Living Frame case source canonical lineage conflicts.')
    approvedWorkRefs.add(
      binding.canonicalBindings.approvedWorkRef.digestSha256,
    )
    assetManifestEntryRefs.add(
      binding.canonicalBindings.assetManifestEntryRef.digestSha256,
    )
  }
  return input
}

function canonicalCommonLineage(
  binding: LivingFrameRepresentativePrivateSourceBinding,
) {
  return {
    approvedSnapshotRef: binding.canonicalBindings.approvedSnapshotRef,
    selectedSceneRef: binding.canonicalBindings.selectedSceneRef,
    masterTimingRef: binding.canonicalBindings.masterTimingRef,
    confirmedFrameRef: binding.canonicalBindings.confirmedFrameRef,
  }
}

function sourceUse(
  caseId: LivingFrameRepresentativeCaseSourceAdmission['caseId'],
  candidate: LivingFrameRepresentativeMediaSourceCandidate,
): LivingFrameRepresentativeCaseSourceUse {
  if (caseId === 'remotion_qa_and_private_review_case') {
    return 'final_review_source_lineage'
  }
  switch (candidate.sourceKind) {
    case 'external_public_domain_talking_head_video':
      return 'primary_a_roll'
    case 'external_public_domain_satellite_image':
      return 'geographic_or_supporting_still'
    case 'external_public_domain_historical_map':
      return 'archival_or_map_evidence'
    case 'external_public_domain_diagram':
      return 'diagram_source'
    case 'external_official_fact_data_requires_current_reread':
      return 'data_claim_source'
    case 'committed_generated_static_illustration_internal_fixture':
      return 'static_illustration'
    case 'committed_generated_non_character_still_internal_fixture':
      return 'non_character_still'
  }
}

function coveredAssetRoles(
  sourceIds: readonly LivingFrameRepresentativeMediaSourceCandidateId[],
  requiredRoles: readonly LivingFrameRepresentativeAssetRole[],
): readonly LivingFrameRepresentativeAssetRole[] {
  const covered = new Set<LivingFrameRepresentativeAssetRole>()
  for (const sourceId of sourceIds) {
    for (const role of SOURCE_ASSET_ROLE_COVERAGE[sourceId]) {
      if (requiredRoles.includes(role)) covered.add(role)
    }
  }
  return requiredRoles.filter((role) => covered.has(role))
}

const SOURCE_ASSET_ROLE_COVERAGE = {
  nasa_earth_day_expert_interview_public_domain_candidate: [
    'approved_source_video',
  ],
  nasa_strait_of_hormuz_satellite_public_domain_candidate: [
    'approved_non_character_still',
    'approved_map_source',
  ],
  historical_strait_of_hormuz_map_public_domain_candidate: [
    'approved_archive_source',
    'approved_document_source',
    'approved_map_source',
  ],
  scientific_method_diagram_public_domain_candidate: [
    'approved_diagram_source',
    'approved_document_source',
  ],
  eia_world_oil_chokepoint_data_official_source_candidate: [
    'approved_data_source',
  ],
  local_astronomer_static_illustration_candidate: [
    'approved_static_illustration',
  ],
  local_locomotive_non_character_still_candidate: [
    'approved_non_character_still',
  ],
} as const satisfies Record<
  LivingFrameRepresentativeMediaSourceCandidateId,
  readonly LivingFrameRepresentativeAssetRole[]
>

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
