import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_AGGREGATE_CLASS,
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_AGGREGATE_VERSION,
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
  type LivingFrameActiveNonIllustrationAggregate,
  type LivingFrameActiveNonIllustrationAggregateCase,
  type LivingFrameActiveNonIllustrationAggregateDraft,
  type LivingFrameActiveNonIllustrationCaseId,
  type LivingFrameActiveNonIllustrationEvidencePacketRef,
  type LivingFrameActiveNonIllustrationEvidenceState,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameActiveNonIllustrationScope,
  LivingFrameOwnerScopeAmendment,
} from '../../src/types/living-frame-owner-scope-amendment'
import type {
  LivingFrameNonIllustrationReadinessAudit,
} from '../../src/types/living-frame-non-illustration-readiness-audit'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameNonIllustrationReadinessAudit,
} from './living-frame-non-illustration-readiness-audit'
import {
  verifyLivingFrameOwnerScopeAmendment,
} from './living-frame-owner-scope-amendment'

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const EVIDENCE_PACKET_VERSION =
  'living-frame-active-scope-evidence-packet-v1' as const

interface CaseDefinition {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly activeScope: LivingFrameActiveNonIllustrationScope
  readonly evidencePacketId: string
  readonly evidenceState:
    LivingFrameActiveNonIllustrationEvidenceState
  readonly requiredDependencyIds: readonly string[]
}

const CASE_DEFINITIONS = [
  caseDefinition(
    'living_a_roll_compositing_case',
    'living_a_roll_compositing',
    'runtime_fixture_and_canonical_evidence_pending',
    [
      'living-frame-professional-skill-component-v1',
      'living-frame-selected-scene-admission-v1',
      'canonical-living-frame-timing-binding-v1',
      'living-frame-temporal-mask-work-admission-candidate-v1',
    ],
  ),
  caseDefinition(
    'static_illustration_without_animation_case',
    'static_illustration_without_character_animation',
    'source_contract_bound_canonical_reread_pending',
    [
      'living-frame-owner-scope-amendment-v1',
      'living-frame-non-character-professional-review-v1',
    ],
  ),
  caseDefinition(
    'living_still_non_character_case',
    'living_still_non_character_selective_motion',
    'recorded_fixture_requires_ai_reinspection',
    [
      'canonical-living-frame-motion-spec-v3',
      'living-frame-five-mode-private-render-internal-test',
      'living-frame-non-character-professional-review-v1',
    ],
  ),
  caseDefinition(
    'living_archive_case',
    'living_archive',
    'source_contract_bound_canonical_reread_pending',
    [
      'living-frame-non-character-content-lineage-v1',
      'documentary-fact-safety-plan',
    ],
  ),
  caseDefinition(
    'living_diagram_case',
    'living_diagram',
    'source_contract_bound_canonical_reread_pending',
    [
      'living-frame-non-character-content-lineage-v1',
      'data-viz-plan',
    ],
  ),
  caseDefinition(
    'hybrid_expansion_non_character_case',
    'hybrid_expansion_non_character',
    'source_contract_bound_canonical_reread_pending',
    [
      'living-frame-non-character-content-lineage-v1',
      'canonical-living-frame-timing-binding-v1',
      'canonical-living-frame-motion-spec-v3',
    ],
  ),
  caseDefinition(
    'maps_routes_and_data_graphics_case',
    'maps_routes_and_data_graphics',
    'source_contract_bound_canonical_reread_pending',
    [
      'living-frame-non-character-content-lineage-v1',
      'map-animation-plan',
      'data-viz-plan',
    ],
  ),
  caseDefinition(
    'attention_focus_and_semantic_scale_case',
    'attention_focus_and_semantic_scale',
    'source_contract_bound_canonical_reread_pending',
    [
      'living-frame-attention-soundsync-integration-v1',
      'canonical-living-frame-motion-spec-v3',
      'living-frame-semantic-sound-timing-reconciliation-v1',
    ],
  ),
  caseDefinition(
    'camera_depth_occlusion_and_masks_case',
    'camera_depth_occlusion_and_masks',
    'runtime_fixture_and_canonical_evidence_pending',
    [
      'canonical-living-frame-motion-spec-v3',
      'depth-aware-overlay-plan',
      'living-frame-temporal-mask-work-admission-candidate-v1',
    ],
  ),
  caseDefinition(
    'environmental_editorial_and_rigid_support_case',
    'environmental_editorial_and_rigid_support_motion',
    'recorded_fixture_requires_ai_reinspection',
    [
      'canonical-living-frame-motion-spec-v3',
      'living-frame-selected-scene-environmental-particle-scene-qa-internal-test-v1',
      'living-frame-selected-scene-environmental-particle-private-review-internal-test-v1',
    ],
  ),
  caseDefinition(
    'sound_story_timing_and_caption_case',
    'sound_story_timing_and_caption_coordination',
    'source_contract_bound_canonical_reread_pending',
    [
      'living-frame-attention-soundsync-integration-v1',
      'living-frame-semantic-sound-timing-reconciliation-v1',
      'caption-direction-living-frame-adapter-v1',
      'caption-motion-handoff-plan-v1',
    ],
  ),
  caseDefinition(
    'remotion_qa_and_private_review_case',
    'remotion_composition_qa_and_private_review',
    'recorded_fixture_requires_ai_reinspection',
    [
      'living-frame-remotion-binding-v1',
      'living-frame-postrender-visual-inspection-request-v1',
      'living-frame-non-character-professional-review-v1',
      'canonical-private-review-assembly-v1',
    ],
  ),
] as const satisfies readonly CaseDefinition[]

if (!sameStrings(
  CASE_DEFINITIONS.map((definition) => definition.caseId),
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
)) throw new Error('Living Frame active aggregate case order drift.')

const AUTHORITY_BOUNDARY = Object.freeze({
  sourceManifestOnly: true as const,
  approvedSnapshotAuthority: false as const,
  selectedSceneAuthority: false as const,
  masterTimingAuthority: false as const,
  soundSyncAuthority: false as const,
  captionAuthority: false as const,
  mapOrDataVizAuthority: false as const,
  documentaryFactAuthority: false as const,
  layoutDepthOrMaskAuthority: false as const,
  workGraphAuthority: false as const,
  assetManifestAuthority: false as const,
  rendererAuthority: false as const,
  providerAuthority: false as const,
  dispatchAuthority: false as const,
  runtimeAuthority: false as const,
  artifactAuthority: false as const,
  qaApprovalAuthority: false as const,
  privateReviewAuthority: false as const,
  costAuthority: false as const,
  billingAuthority: false as const,
  publicDeliveryAuthority: false as const,
  productionAuthority: false as const,
})

export interface CompileLivingFrameActiveNonIllustrationAggregateInput {
  readonly ownerScopeAmendment: LivingFrameOwnerScopeAmendment
  readonly readinessAudit: LivingFrameNonIllustrationReadinessAudit
  readonly evidencePackets:
    readonly LivingFrameActiveNonIllustrationEvidencePacketRef[]
}

export function compileLivingFrameActiveNonIllustrationAggregate(
  input: CompileLivingFrameActiveNonIllustrationAggregateInput,
): LivingFrameActiveNonIllustrationAggregate {
  assertInput(input)
  const cases = CASE_DEFINITIONS.map((definition, order) =>
    compileCase(definition, input.evidencePackets[order]!, order))
  const blockingRequirementIds = input.readinessAudit.requirements
    .filter((requirement) =>
      requirement.blocksActivePrivateInternalReadiness)
    .map((requirement) => requirement.requirementId)
  const draft: LivingFrameActiveNonIllustrationAggregateDraft = {
    contractVersion:
      LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_AGGREGATE_VERSION,
    aggregateClass:
      LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_AGGREGATE_CLASS,
    aggregateState:
      'active_scope_manifest_complete_runtime_and_canonical_evidence_pending',
    ownerScopeAmendmentVersion:
      input.ownerScopeAmendment.contractVersion,
    ownerScopeAmendmentDigestSha256:
      input.ownerScopeAmendment.amendmentDigestSha256,
    readinessAuditVersion:
      input.readinessAudit.contractVersion,
    readinessAuditDigestSha256:
      input.readinessAudit.auditDigestSha256,
    cases,
    activeCaseCount: 12,
    activeScopeCount: 12,
    activeScopeSetDigestSha256:
      sha256AuthorityValue(input.ownerScopeAmendment.activeScope),
    pausedScopesRejected:
      structuredClone(input.ownerScopeAmendment.pausedScope),
    pausedScopeCount: 7,
    pausedScopeSetDigestSha256:
      sha256AuthorityValue(input.ownerScopeAmendment.pausedScope),
    activeBlockingRequirementCount:
      input.readinessAudit.metrics.activeBlockingRequirementCount,
    activeBlockingRequirementSetDigestSha256:
      sha256AuthorityValue(blockingRequirementIds),
    historicalAggregateImported: false,
    historicalAggregateCaseCountUsed: false,
    historicalCharacterOrRiggingEvidenceAccepted: false,
    ownerScopeAmendmentPreserved: true,
    activePrivateInternalReady: false,
    aggregateRuntimeReady: false,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
      false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    assetCreated: false,
    canonicalQaApproved: false,
    privateReviewApproved: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    aggregateDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameActiveNonIllustrationAggregate(
  value: unknown,
  input: CompileLivingFrameActiveNonIllustrationAggregateInput,
): value is LivingFrameActiveNonIllustrationAggregate {
  if (
    !isRecord(value)
    || typeof value.aggregateDigestSha256 !== 'string'
    || !SHA256.test(value.aggregateDigestSha256)
  ) return false
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameActiveNonIllustrationAggregate(input),
      )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameActiveNonIllustrationAggregateInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'ownerScopeAmendment',
      'readinessAudit',
      'evidencePackets',
    ])
    || !verifyLivingFrameOwnerScopeAmendment(
      input.ownerScopeAmendment,
    )
    || !verifyLivingFrameNonIllustrationReadinessAudit(
      input.readinessAudit,
      { ownerScopeAmendment: input.ownerScopeAmendment },
    )
    || input.readinessAudit.activePrivateInternalReady
    || input.readinessAudit.sourceBindings
      .historicalAggregateCaseCountMayDefineActiveCompletion
    || input.readinessAudit.metrics.activeBlockingRequirementCount < 1
    || !sameStrings(
      input.ownerScopeAmendment.activeScope,
      CASE_DEFINITIONS.map((definition) => definition.activeScope),
    )
    || !Array.isArray(input.evidencePackets)
    || input.evidencePackets.length !== CASE_DEFINITIONS.length
    || new Set(input.evidencePackets.map((packet) =>
      packet.packetDigestSha256)).size !== input.evidencePackets.length
  ) throw new Error('Invalid Living Frame active aggregate input.')
  input.evidencePackets.forEach((packet, order) =>
    assertEvidencePacket(packet, CASE_DEFINITIONS[order]!))
}

function assertEvidencePacket(
  packet: LivingFrameActiveNonIllustrationEvidencePacketRef,
  definition: CaseDefinition,
): void {
  if (
    !isRecord(packet)
    || !hasExactKeys(packet, [
      'packetId',
      'packetVersion',
      'packetDigestSha256',
      'canonicalRereadRequired',
      'runtimeEvidenceIncluded',
      'pausedEvidenceIncluded',
    ])
    || packet.packetId !== definition.evidencePacketId
    || packet.packetVersion !== EVIDENCE_PACKET_VERSION
    || !SHA256.test(packet.packetDigestSha256)
    || packet.canonicalRereadRequired !== true
    || packet.runtimeEvidenceIncluded !== false
    || packet.pausedEvidenceIncluded !== false
  ) throw new Error('Invalid Living Frame active aggregate evidence packet.')
}

function compileCase(
  definition: CaseDefinition,
  evidencePacket: LivingFrameActiveNonIllustrationEvidencePacketRef,
  order: number,
): LivingFrameActiveNonIllustrationAggregateCase {
  const withoutDigest = {
    caseId: definition.caseId,
    order,
    activeScope: definition.activeScope,
    evidenceState: definition.evidenceState,
    evidencePacket: structuredClone(evidencePacket),
    requiredDependencyIds:
      structuredClone(definition.requiredDependencyIds),
    requiredDependencySetDigestSha256:
      sha256AuthorityValue(definition.requiredDependencyIds),
    canonicalOwnersPreserved: true as const,
    historicalAggregateEvidenceAccepted: false as const,
    pausedEvidenceMaySatisfyCase: false as const,
    canonicalRereadRequired: true as const,
    runtimeExecutionClaimed: false as const,
    deterministicQaRequired: true as const,
    postrenderAiVisualInspectionRequired: true as const,
    completeTimeCoverageRequired: true as const,
    separateVerifiedAudioEvidenceRequired: true as const,
    headQaRecommendationRequired: true as const,
    nPlusOneRepairAndReinspectionRequiredOnFailure: true as const,
    canonicalPrivateReviewRequired: true as const,
  }
  return deepFreeze({
    ...withoutDigest,
    caseDigestSha256: sha256AuthorityValue(withoutDigest),
  })
}

function caseDefinition(
  caseId: LivingFrameActiveNonIllustrationCaseId,
  activeScope: LivingFrameActiveNonIllustrationScope,
  evidenceState: LivingFrameActiveNonIllustrationEvidenceState,
  requiredDependencyIds: readonly string[],
): CaseDefinition {
  if (
    requiredDependencyIds.length < 1
    || new Set(requiredDependencyIds).size
      !== requiredDependencyIds.length
    || requiredDependencyIds.some((entry) => !SAFE_ID.test(entry))
  ) throw new Error('Invalid Living Frame active aggregate case definition.')
  return {
    caseId,
    activeScope,
    evidencePacketId: `living-frame.active-scope.${caseId}.v1`,
    evidenceState,
    requiredDependencyIds,
  }
}

function sameStrings(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return actual.length === expected.length
    && actual.every((entry, order) => entry === expected[order])
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const actualKeys = Object.keys(value).sort()
  const sortedExpectedKeys = [...expectedKeys].sort()
  return actualKeys.length === sortedExpectedKeys.length
    && actualKeys.every(
      (key, order) => key === sortedExpectedKeys[order],
    )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (
    const child of Object.values(
      value as Record<string, unknown>,
    )
  ) deepFreeze(child)
  return value
}

export {
  EVIDENCE_PACKET_VERSION as LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_PACKET_VERSION,
}
