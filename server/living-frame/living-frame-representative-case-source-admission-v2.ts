import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  LIVING_FRAME_REPRESENTATIVE_CASE_SOURCE_ADMISSION_V2_VERSION,
  type LivingFrameRepresentativeCaseSourceAdmissionV2,
  type LivingFrameRepresentativeCaseSourceAdmissionV2Draft,
  type LivingFrameRepresentativeCaseSourceAssignmentV2,
  type LivingFrameRepresentativeCaseSourceUseV2,
} from '../../src/types/living-frame-representative-case-source-admission-v2'
import type {
  LivingFrameOwnerScopeAmendment,
} from '../../src/types/living-frame-owner-scope-amendment'
import type {
  LivingFrameRepresentativeMediaSourceCandidateSet,
} from '../../src/types/living-frame-representative-media-source-candidates'
import type {
  LivingFrameRepresentativePrivateSourceBindingV2,
} from '../../src/types/living-frame-representative-private-source-binding-v2'
import type {
  LivingFrameRepresentativeSourceProvenanceAudit,
} from '../../src/types/living-frame-representative-source-provenance-audit'
import type {
  LivingFrameRepresentativeSemanticSourceRouting,
} from '../../src/types/living-frame-representative-semantic-source-routing'
import type {
  LivingFrameRepresentativeAssetRole,
  LivingFrameRepresentativeVisualFixtureManifest,
} from '../../src/types/living-frame-representative-visual-fixture'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameOwnerScopeAmendment,
} from './living-frame-owner-scope-amendment'
import {
  verifyLivingFrameRepresentativeMediaSourceCandidateSet,
} from './living-frame-representative-media-source-candidates'
import {
  type CompileLivingFrameRepresentativePrivateSourceBindingV2Input,
  verifyLivingFrameRepresentativePrivateSourceBindingV2,
} from './living-frame-representative-private-source-binding-v2'
import {
  verifyLivingFrameRepresentativeSemanticSourceRouting,
} from './living-frame-representative-semantic-source-routing'
import {
  verifyLivingFrameRepresentativeSourceProvenanceAudit,
} from './living-frame-representative-source-provenance-audit'
import {
  verifyLivingFrameRepresentativeVisualFixtureManifest,
} from './living-frame-representative-visual-fixture'

export interface LivingFrameRepresentativeCasePrivateBindingV2Input {
  readonly binding: LivingFrameRepresentativePrivateSourceBindingV2
  readonly compileInput:
    CompileLivingFrameRepresentativePrivateSourceBindingV2Input
}

export interface CompileLivingFrameRepresentativeCaseSourceAdmissionV2Input {
  readonly ownerScopeAmendment: LivingFrameOwnerScopeAmendment
  readonly representativeVisualFixture:
    LivingFrameRepresentativeVisualFixtureManifest
  readonly sourceCandidateSet:
    LivingFrameRepresentativeMediaSourceCandidateSet
  readonly provenanceAudit: LivingFrameRepresentativeSourceProvenanceAudit
  readonly semanticRouting: LivingFrameRepresentativeSemanticSourceRouting
  readonly caseId:
    LivingFrameRepresentativeCaseSourceAdmissionV2['caseId']
  readonly privateBindings:
    readonly LivingFrameRepresentativeCasePrivateBindingV2Input[]
}

export function compileLivingFrameRepresentativeCaseSourceAdmissionV2(
  input: CompileLivingFrameRepresentativeCaseSourceAdmissionV2Input,
): LivingFrameRepresentativeCaseSourceAdmissionV2 {
  const normalized = assertInput(input)
  const caseOrder = LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.indexOf(
    normalized.caseId,
  )
  const visualCase = normalized.representativeVisualFixture.cases[caseOrder]!
  const route = normalized.semanticRouting.routes[caseOrder]!
  const firstBinding = normalized.privateBindings[0]!.binding
  const assignments = normalized.privateBindings.map(
    ({ binding }, order): LivingFrameRepresentativeCaseSourceAssignmentV2 =>
      deepFreeze({
        sourceCandidateId: binding.sourceCandidateId,
        order,
        sourceUse: sourceUse(normalized.caseId, binding.sourceCandidateId),
        privateSourceBindingVersion: binding.contractVersion,
        privateSourceBindingDigestSha256: binding.bindingDigestSha256,
        selectionKind: binding.selection.selectionKind,
        sourceRouteDigestSha256: binding.sourceRouteDigestSha256,
        sourceProbeOrSnapshotDigestSha256:
          sourceProbeOrSnapshotDigest(binding),
        approvedWorkRefDigestSha256:
          binding.canonicalBindings.approvedWorkRef.digestSha256,
        assetManifestEntryRefDigestSha256:
          binding.canonicalBindings.assetManifestEntryRef.digestSha256,
        exactBindingCanonicalRereadRequired: true,
      }),
  )
  const sourceDerivedAssetRolesCovered = coveredAssetRoles(
    route.effectiveSourceCandidateIds,
    visualCase.requiredAssetRoles,
  )
  const draft: LivingFrameRepresentativeCaseSourceAdmissionV2Draft = {
    contractVersion:
      LIVING_FRAME_REPRESENTATIVE_CASE_SOURCE_ADMISSION_V2_VERSION,
    admissionClass:
      'byte_free_non_executable_semantic_route_exact_probe_case_source_admission_candidate',
    state:
      'v2_source_binding_contract_complete_actual_canonical_reread_pending',
    supersedesRuntimeUseOfContractVersion:
      'living-frame-representative-case-source-admission-v1',
    legacyV1AdmissionMayDriveRepresentativeRender: false,
    caseId: normalized.caseId,
    caseOrder,
    activeScope: visualCase.activeScope,
    semanticTopic: route.semanticTopic,
    semanticRoutingVersion: normalized.semanticRouting.contractVersion,
    semanticRoutingDigestSha256:
      normalized.semanticRouting.routingDigestSha256,
    sourceRouteDigestSha256: route.sourceRouteDigestSha256,
    provenanceAuditVersion: normalized.provenanceAudit.contractVersion,
    provenanceAuditDigestSha256:
      normalized.provenanceAudit.auditDigestSha256,
    representativeVisualFixtureVersion:
      normalized.representativeVisualFixture.contractVersion,
    representativeVisualFixtureDigestSha256:
      normalized.representativeVisualFixture.manifestDigestSha256,
    representativeVisualCaseDigestSha256: visualCase.caseDigestSha256,
    requiredSourceCandidateIds: [...route.effectiveSourceCandidateIds],
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
    exactSemanticRequiredCandidateSetBound: true,
    everyVideoSourceUsesExactProbeAndRationalFrameMapping: true,
    everyStillSourceUsesExactProbeBeforeCrop: true,
    everyDataSourceUsesExactSnapshotRowsAndCitations: true,
    missingExtraReorderedOrDuplicateSourceBindingAccepted: false,
    crossCaseOrSemanticTopicSourceBindingAccepted: false,
    crossSnapshotSceneTimingOrFrameBindingAccepted: false,
    duplicateWorkOrManifestEntryAccepted: false,
    sourceToCanonicalAssetRoleReconciliationPending: true,
    canonicalConsumptionPending: true,
    sourceBytesPathsUrlsRawTranscriptOrChatSerialized: false,
    createsSourceProbeSnapshotTimingWorkAssetRendererQaOrReviewOwner: false,
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

export function verifyLivingFrameRepresentativeCaseSourceAdmissionV2(
  value: unknown,
  input: CompileLivingFrameRepresentativeCaseSourceAdmissionV2Input,
): value is LivingFrameRepresentativeCaseSourceAdmissionV2 {
  try {
    return stableAuthorityStringify(value) === stableAuthorityStringify(
      compileLivingFrameRepresentativeCaseSourceAdmissionV2(input),
    )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameRepresentativeCaseSourceAdmissionV2Input,
): CompileLivingFrameRepresentativeCaseSourceAdmissionV2Input {
  if (
    !exactKeys(input, [
      'ownerScopeAmendment', 'representativeVisualFixture',
      'sourceCandidateSet', 'provenanceAudit', 'semanticRouting', 'caseId',
      'privateBindings',
    ])
    || !verifyLivingFrameOwnerScopeAmendment(input.ownerScopeAmendment)
    || !verifyLivingFrameRepresentativeVisualFixtureManifest(
      input.representativeVisualFixture,
      input.ownerScopeAmendment,
    )
    || !verifyLivingFrameRepresentativeMediaSourceCandidateSet(
      input.sourceCandidateSet,
    )
    || !verifyLivingFrameRepresentativeSourceProvenanceAudit(
      input.provenanceAudit,
    )
    || !verifyLivingFrameRepresentativeSemanticSourceRouting(
      input.semanticRouting,
      input.sourceCandidateSet,
      input.provenanceAudit,
    )
  ) throw new Error('Invalid Living Frame v2 case source authority.')
  const caseOrder = LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.indexOf(
    input.caseId,
  )
  if (caseOrder < 0) throw new Error('Unknown Living Frame active case.')
  const route = input.semanticRouting.routes[caseOrder]!
  const requiredIds = route.effectiveSourceCandidateIds
  const observedIds = input.privateBindings.map(
    ({ binding }) => binding.sourceCandidateId,
  )
  if (
    route.caseId !== input.caseId
    || route.order !== caseOrder
    || route.existingV1AdmissionMayDriveRepresentativeRender
    || !route.canonicalV2CandidateSetAndAdmissionRequired
    || input.privateBindings.length < 1
    || observedIds.length !== requiredIds.length
    || new Set(observedIds).size !== observedIds.length
    || observedIds.some((id, order) => id !== requiredIds[order])
    || input.privateBindings.some(({ binding, compileInput }) =>
      binding.caseId !== input.caseId
      || binding.semanticTopic !== route.semanticTopic
      || binding.sourceRouteDigestSha256 !== route.sourceRouteDigestSha256
      || binding.sourceCandidateId !== compileInput.sourceCandidateId
      || compileInput.caseId !== input.caseId
      || compileInput.sourceCandidateSet.candidateSetDigestSha256
        !== input.sourceCandidateSet.candidateSetDigestSha256
      || compileInput.provenanceAudit.auditDigestSha256
        !== input.provenanceAudit.auditDigestSha256
      || compileInput.semanticRouting.routingDigestSha256
        !== input.semanticRouting.routingDigestSha256
      || !verifyLivingFrameRepresentativePrivateSourceBindingV2(
        binding,
        compileInput,
      ))
  ) throw new Error('Living Frame v2 case source binding set is not exact.')

  const first = input.privateBindings[0]!.binding
  const commonLineage = canonicalCommonLineage(first)
  const approvedWorkRefs = new Set<string>()
  const assetManifestEntryRefs = new Set<string>()
  for (const { binding } of input.privateBindings) {
    if (
      binding.workspaceId !== first.workspaceId
      || binding.projectId !== first.projectId
      || binding.semanticRoutingDigestSha256
        !== input.semanticRouting.routingDigestSha256
      || binding.provenanceAuditDigestSha256
        !== input.provenanceAudit.auditDigestSha256
      || stableAuthorityStringify(canonicalCommonLineage(binding))
        !== stableAuthorityStringify(commonLineage)
      || approvedWorkRefs.has(
        binding.canonicalBindings.approvedWorkRef.digestSha256,
      )
      || assetManifestEntryRefs.has(
        binding.canonicalBindings.assetManifestEntryRef.digestSha256,
      )
    ) throw new Error('Living Frame v2 source canonical lineage conflicts.')
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
  binding: LivingFrameRepresentativePrivateSourceBindingV2,
) {
  return {
    approvedSnapshotRef: binding.canonicalBindings.approvedSnapshotRef,
    selectedSceneRef: binding.canonicalBindings.selectedSceneRef,
    masterTimingRef: binding.canonicalBindings.masterTimingRef,
    confirmedFrameRef: binding.canonicalBindings.confirmedFrameRef,
  }
}

function sourceProbeOrSnapshotDigest(
  binding: LivingFrameRepresentativePrivateSourceBindingV2,
): string {
  if (binding.selection.selectionKind === 'structured_data_rows_v2') {
    return binding.selection.sourceSnapshotRef.digestSha256
  }
  return binding.selection.sourceProbeEvidence.probeEvidenceRef.digestSha256
}

function sourceUse(
  caseId: LivingFrameRepresentativeCaseSourceAdmissionV2['caseId'],
  sourceCandidateId:
    LivingFrameRepresentativeCaseSourceAssignmentV2['sourceCandidateId'],
): LivingFrameRepresentativeCaseSourceUseV2 {
  if (caseId === 'remotion_qa_and_private_review_case') {
    return 'final_review_source_lineage'
  }
  switch (sourceCandidateId) {
    case 'nasa_earth_day_expert_interview_public_domain_candidate':
      return 'primary_a_roll'
    case 'nasa_earth_day_cut_broll_public_domain_candidate':
      return 'topic_matched_supporting_broll'
    case 'nasa_strait_of_hormuz_satellite_public_domain_candidate':
      return 'geographic_or_supporting_still'
    case 'historical_strait_of_hormuz_map_public_domain_candidate':
      return 'archival_or_map_evidence'
    case 'scientific_method_diagram_public_domain_candidate':
      return 'diagram_source'
    case 'eia_world_oil_chokepoint_data_official_source_candidate':
      return 'data_claim_source'
    case 'local_astronomer_static_illustration_candidate':
      return 'static_illustration'
    case 'local_locomotive_non_character_still_candidate':
      return 'non_character_still'
  }
}

function coveredAssetRoles(
  sourceIds:
    readonly LivingFrameRepresentativeCaseSourceAssignmentV2['sourceCandidateId'][],
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
  nasa_earth_day_cut_broll_public_domain_candidate: [
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
  LivingFrameRepresentativeCaseSourceAssignmentV2['sourceCandidateId'],
  readonly LivingFrameRepresentativeAssetRole[]
>

function exactKeys(value: object, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
