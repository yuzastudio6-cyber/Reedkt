import type {
  LivingFrameSelectedSceneAdmission,
  LivingFrameSelectedSceneAdmissionAuthorityBoundary,
  LivingFrameSelectedSceneAdmissionBlocker,
  LivingFrameSelectedSceneAdmissionDraft,
  LivingFrameSelectedSceneAdmissionState,
  LivingFrameSelectedSceneAuthorityExpectation,
  LivingFrameSelectedSceneAuthorityKind,
  LivingFrameSelectedSceneCandidateRef,
  LivingFrameSelectedSceneCanonicalScope,
} from '../../src/types/living-frame-selected-scene-admission'
import {
  LIVING_FRAME_SELECTED_SCENE_ADMISSION_BLOCKERS,
  LIVING_FRAME_SELECTED_SCENE_ADMISSION_CLASS,
  LIVING_FRAME_SELECTED_SCENE_ADMISSION_VERSION,
  LIVING_FRAME_SELECTED_SCENE_AUTHORITY_KINDS,
} from '../../src/types/living-frame-selected-scene-admission'
import type {
  LivingFrameSemanticPlanProjection,
} from '../../src/types/living-frame-semantic-plan-projection'
import {
  verifyLivingFrameSemanticPlanProjection,
} from './living-frame-semantic-plan-projection'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256 = /^[a-f0-9]{64}$/
const MAX_CANDIDATE_SCENES = 128

const ALWAYS_OPEN_GATES = [
  'canonical_plan_owner_selection_required',
  'canonical_estimate_required',
  'canonical_approval_required',
  'approved_snapshot_required',
] as const satisfies readonly LivingFrameSelectedSceneAdmissionBlocker[]

const AUTHORITY_BLOCKER = {
  canonical_planning_handoff:
    'canonical_planning_handoff_required',
  planning_evidence:
    'planning_evidence_required',
  source_speech_evidence:
    'source_speech_evidence_required',
  route_data_assurance:
    'route_data_assurance_required',
  released_reasoning_result:
    'released_reasoning_result_required',
  visual_continuity_pack:
    'visual_continuity_pack_required',
  confirmed_output_frame:
    'confirmed_output_frame_required',
  current_master_timing:
    'current_master_timing_required',
} as const satisfies Record<
  LivingFrameSelectedSceneAuthorityKind,
  LivingFrameSelectedSceneAdmissionBlocker
>

const AUTHORITY_BOUNDARY:
  LivingFrameSelectedSceneAdmissionAuthorityBoundary = Object.freeze({
    admissionCandidateOnly: true,
    selectedSceneAuthority: false,
    professionalSkillPlanMutationAuthority: false,
    planningHandoffMutationAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    customerCommercialAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    artifactQaAuthority: false,
    rendererAuthority: false,
    remotionExecutionAuthority: false,
    privateReviewAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameSelectedSceneAdmissionInput {
  readonly canonicalScope: LivingFrameSelectedSceneCanonicalScope
  readonly semanticPlanProjection: LivingFrameSemanticPlanProjection
  readonly authorityExpectations:
    readonly LivingFrameSelectedSceneAuthorityExpectation[]
}

export async function compileLivingFrameSelectedSceneAdmission(
  input: CompileLivingFrameSelectedSceneAdmissionInput,
): Promise<LivingFrameSelectedSceneAdmission> {
  assertCanonicalScope(input.canonicalScope)
  if (
    !(await verifyLivingFrameSemanticPlanProjection(
      input.semanticPlanProjection,
    ))
  ) {
    throw invalid('Living Frame semantic plan projection is invalid.')
  }
  const projection = input.semanticPlanProjection
  const authorityExpectations = normalizeAuthorityExpectations(
    input.authorityExpectations,
  )
  assertExpectationLineage(projection, authorityExpectations)
  const candidateScenes = compileCandidateScenes(projection)
  const deliberateNonUse =
    projection.projectionState === 'deliberate_non_use_projection'
  const blockerCodes = compileBlockers(
    projection,
    authorityExpectations,
  )
  const admissionState = compileAdmissionState({
    projection,
    blockerCodes,
  })
  const metrics = {
    candidateSceneCount: candidateScenes.length,
    currentAuthorityExpectationCount:
      authorityExpectations.filter(
        (expectation) =>
          expectation.expectationState === 'controlled_current_match',
      ).length,
    unresolvedAuthorityExpectationCount:
      authorityExpectations.filter(
        (expectation) =>
          isRequiredAuthority(
            expectation.authorityKind,
            projection,
          )
          && expectation.expectationState !== 'controlled_current_match',
      ).length,
    blockerCount: blockerCodes.length,
  }
  const draft: LivingFrameSelectedSceneAdmissionDraft = {
    contractVersion: LIVING_FRAME_SELECTED_SCENE_ADMISSION_VERSION,
    admissionClass: LIVING_FRAME_SELECTED_SCENE_ADMISSION_CLASS,
    admissionState,
    canonicalScope: { ...input.canonicalScope },
    sourceBindings: {
      deferredLivingFrameComponentDigestSha256:
        projection.sourceBindings
          .deferredLivingFrameComponentDigestSha256,
      semanticPlanProjectionDigestSha256:
        projection.projectionDigestSha256,
      semanticProposalBindingDigestSha256:
        projection.sourceBindings.semanticProposalBindingDigestSha256,
      semanticRequestDigestSha256:
        projection.sourceBindings.semanticRequestDigestSha256,
      semanticResultDigestSha256:
        projection.sourceBindings.semanticResultDigestSha256,
      visualContinuityPackDigestSha256:
        projection.sourceBindings.visualContinuityPackDigestSha256,
      outputFrameExpectationDigestSha256:
        projection.projectedComponent.inputBindings.outputFrame
          .expectedDigestSha256,
      masterTimingExpectationDigestSha256:
        projection.projectedComponent.inputBindings.masterTiming
          .expectedDigestSha256,
    },
    authorityExpectations,
    candidateScenes,
    deliberateNonUse,
    blockerCodes,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    existingProfessionalSkillPlanRemainsAuthority: true,
    existingCanonicalPlanningHandoffRemainsAuthority: true,
    canonicalPlanOwnerMustSelectOrReject: true,
    containsSelectedScene: false,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false,
    containsProviderToolWorkQueueCostOrCommercialRoute: false,
    containsExecutableCodeOrCommands: false,
    subjectSpecificRouting: false,
    promotionAllowed: false,
  }
  return {
    ...draft,
    admissionDigestSha256: sha256AuthorityValue(draft),
  }
}

export async function verifyLivingFrameSelectedSceneAdmission(input: {
  readonly admission: unknown
  readonly semanticPlanProjection: LivingFrameSemanticPlanProjection
}): Promise<boolean> {
  try {
    if (
      !isRecord(input.admission)
      || !hasExactKeys(input.admission, [
        'contractVersion',
        'admissionClass',
        'admissionState',
        'canonicalScope',
        'sourceBindings',
        'authorityExpectations',
        'candidateScenes',
        'deliberateNonUse',
        'blockerCodes',
        'metrics',
        'authorityBoundary',
        'existingProfessionalSkillPlanRemainsAuthority',
        'existingCanonicalPlanningHandoffRemainsAuthority',
        'canonicalPlanOwnerMustSelectOrReject',
        'containsSelectedScene',
        'containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials',
        'containsProviderToolWorkQueueCostOrCommercialRoute',
        'containsExecutableCodeOrCommands',
        'subjectSpecificRouting',
        'promotionAllowed',
        'admissionDigestSha256',
      ])
    ) return false
    const admission =
      input.admission as unknown as LivingFrameSelectedSceneAdmission
    const { admissionDigestSha256, ...draft } = admission
    if (
      admission.contractVersion !==
        LIVING_FRAME_SELECTED_SCENE_ADMISSION_VERSION
      || admission.admissionClass !==
        LIVING_FRAME_SELECTED_SCENE_ADMISSION_CLASS
      || !SHA256.test(String(admissionDigestSha256))
      || admissionDigestSha256 !== sha256AuthorityValue(draft)
      || !validateAuthorityBoundary(admission.authorityBoundary)
      || admission.existingProfessionalSkillPlanRemainsAuthority !== true
      || admission.existingCanonicalPlanningHandoffRemainsAuthority
        !== true
      || admission.canonicalPlanOwnerMustSelectOrReject !== true
      || admission.containsSelectedScene !== false
      || admission
        .containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials
        !== false
      || admission.containsProviderToolWorkQueueCostOrCommercialRoute
        !== false
      || admission.containsExecutableCodeOrCommands !== false
      || admission.subjectSpecificRouting !== false
      || admission.promotionAllowed !== false
    ) return false
    const expected = await compileLivingFrameSelectedSceneAdmission({
      canonicalScope: admission.canonicalScope,
      semanticPlanProjection: input.semanticPlanProjection,
      authorityExpectations: admission.authorityExpectations,
    })
    return stableAuthorityStringify(admission)
      === stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function compileCandidateScenes(
  projection: LivingFrameSemanticPlanProjection,
): readonly LivingFrameSelectedSceneCandidateRef[] {
  if (
    projection.projectionState !== 'blocked_candidate_projection'
  ) return []
  const scenes = projection.projectedComponent.scenePlans
  if (
    scenes.length === 0
    || scenes.length > MAX_CANDIDATE_SCENES
    || scenes.some((scene) => scene.decision !== 'defer')
  ) {
    throw invalid(
      'Living Frame candidate projection must contain only deferred scenes.',
    )
  }
  return scenes.map((scene) => ({
    sceneId: scene.sceneId,
    order: scene.order,
    segmentExpectationId: scene.segmentExpectationId,
    mode: scene.mode,
    scenePlanDigestSha256: sha256AuthorityValue(scene),
    sourceDecision: 'defer' as const,
  }))
}

function compileBlockers(
  projection: LivingFrameSemanticPlanProjection,
  expectations: readonly LivingFrameSelectedSceneAuthorityExpectation[],
): readonly LivingFrameSelectedSceneAdmissionBlocker[] {
  const blockers = new Set<LivingFrameSelectedSceneAdmissionBlocker>(
    ALWAYS_OPEN_GATES,
  )
  for (const expectation of expectations) {
    if (
      isRequiredAuthority(expectation.authorityKind, projection)
      && expectation.expectationState !== 'controlled_current_match'
    ) {
      blockers.add(AUTHORITY_BLOCKER[expectation.authorityKind])
    }
  }
  if (
    projection.projectionState === 'blocked_semantic_result_projection'
  ) {
    blockers.add('released_reasoning_result_required')
  }
  return [...blockers].sort((left, right) =>
    LIVING_FRAME_SELECTED_SCENE_ADMISSION_BLOCKERS.indexOf(left)
    - LIVING_FRAME_SELECTED_SCENE_ADMISSION_BLOCKERS.indexOf(right))
}

function compileAdmissionState(input: {
  readonly projection: LivingFrameSemanticPlanProjection
  readonly blockerCodes:
    readonly LivingFrameSelectedSceneAdmissionBlocker[]
}): LivingFrameSelectedSceneAdmissionState {
  const upstreamBlockerCount = input.blockerCodes.filter(
    (code) => !ALWAYS_OPEN_GATES.includes(
      code as (typeof ALWAYS_OPEN_GATES)[number],
    ),
  ).length
  if (upstreamBlockerCount > 0) {
    return 'blocked_by_upstream_authority_expectation'
  }
  if (
    input.projection.projectionState ===
      'deliberate_non_use_projection'
  ) return 'deliberate_non_use_preserved'
  return input.projection.projectionState === 'blocked_candidate_projection'
    ? 'candidate_ready_for_canonical_owner_decision'
    : 'blocked_by_upstream_authority_expectation'
}

function normalizeAuthorityExpectations(
  values: readonly LivingFrameSelectedSceneAuthorityExpectation[],
): readonly LivingFrameSelectedSceneAuthorityExpectation[] {
  if (!Array.isArray(values)) {
    throw invalid('Living Frame authority expectations are invalid.')
  }
  const byKind = new Map<
    LivingFrameSelectedSceneAuthorityKind,
    LivingFrameSelectedSceneAuthorityExpectation
  >()
  for (const value of values) {
    if (!isRecord(value) || !hasExactKeys(value, [
      'authorityKind',
      'expectationState',
      'authorityDigestSha256',
    ])) {
      throw invalid('Living Frame authority expectation is invalid.')
    }
    const authorityKind = value.authorityKind
    const expectationState = value.expectationState
    const authorityDigestSha256 = value.authorityDigestSha256
    if (
      typeof authorityKind !== 'string'
      || !LIVING_FRAME_SELECTED_SCENE_AUTHORITY_KINDS.includes(
        authorityKind as LivingFrameSelectedSceneAuthorityKind,
      )
      || byKind.has(
        authorityKind as LivingFrameSelectedSceneAuthorityKind,
      )
      || ![
        'controlled_current_match',
        'missing',
        'stale_or_mismatched',
      ].includes(String(expectationState))
      || (
        expectationState === 'missing'
          ? authorityDigestSha256 !== null
          : (
              typeof authorityDigestSha256 !== 'string'
              || !SHA256.test(authorityDigestSha256)
            )
      )
    ) {
      throw invalid('Living Frame authority expectation is invalid.')
    }
    byKind.set(
      authorityKind as LivingFrameSelectedSceneAuthorityKind,
      {
        authorityKind:
          authorityKind as LivingFrameSelectedSceneAuthorityKind,
        expectationState:
          expectationState as
            LivingFrameSelectedSceneAuthorityExpectation[
              'expectationState'
            ],
        authorityDigestSha256:
          authorityDigestSha256 as string | null,
      },
    )
  }
  if (byKind.size !== LIVING_FRAME_SELECTED_SCENE_AUTHORITY_KINDS.length) {
    throw invalid(
      'Living Frame authority expectation set is incomplete.',
    )
  }
  return LIVING_FRAME_SELECTED_SCENE_AUTHORITY_KINDS.map((kind) =>
    byKind.get(kind) as LivingFrameSelectedSceneAuthorityExpectation)
}

function assertExpectationLineage(
  projection: LivingFrameSemanticPlanProjection,
  expectations: readonly LivingFrameSelectedSceneAuthorityExpectation[],
): void {
  const byKind = new Map(
    expectations.map((expectation) => [
      expectation.authorityKind,
      expectation,
    ]),
  )
  assertMatchingControlledDigest(
    byKind.get('confirmed_output_frame'),
    projection.projectedComponent.inputBindings.outputFrame
      .expectedDigestSha256,
  )
  assertMatchingControlledDigest(
    byKind.get('current_master_timing'),
    projection.projectedComponent.inputBindings.masterTiming
      .expectedDigestSha256,
  )
  const continuityDigest =
    projection.sourceBindings.visualContinuityPackDigestSha256
  const continuity = byKind.get('visual_continuity_pack')
  if (
    continuityDigest === null
    && continuity?.expectationState === 'controlled_current_match'
  ) {
    throw invalid(
      'Living Frame continuity expectation cannot match an absent pack.',
    )
  }
  if (continuityDigest !== null) {
    assertMatchingControlledDigest(continuity, continuityDigest)
  }
}

function assertMatchingControlledDigest(
  expectation:
    LivingFrameSelectedSceneAuthorityExpectation | undefined,
  expectedDigestSha256: string,
): void {
  if (
    expectation?.expectationState === 'controlled_current_match'
    && expectation.authorityDigestSha256 !== expectedDigestSha256
  ) {
    throw invalid(
      'Living Frame current authority digest does not match its source.',
    )
  }
}

function isRequiredAuthority(
  kind: LivingFrameSelectedSceneAuthorityKind,
  projection: LivingFrameSemanticPlanProjection,
): boolean {
  return kind !== 'visual_continuity_pack'
    || projection.sourceBindings.visualContinuityPackDigestSha256
      !== null
}

function assertCanonicalScope(
  value: LivingFrameSelectedSceneCanonicalScope,
): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'workspaceId',
      'projectId',
      'editSessionId',
      'handoffId',
    ])
    || Object.values(value).some(
      (entry) => typeof entry !== 'string' || !SAFE_ID.test(entry),
    )
  ) {
    throw invalid('Living Frame canonical scope is invalid.')
  }
}

function validateAuthorityBoundary(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, [
    'admissionCandidateOnly',
    'selectedSceneAuthority',
    'professionalSkillPlanMutationAuthority',
    'planningHandoffMutationAuthority',
    'masterTimingAuthority',
    'exactFrameAuthority',
    'soundSyncAuthority',
    'estimateAuthority',
    'customerCommercialAuthority',
    'approvalAuthority',
    'snapshotAuthority',
    'workGraphAuthority',
    'queueAuthority',
    'assetManifestAuthority',
    'providerAuthority',
    'toolRouteAuthority',
    'artifactQaAuthority',
    'rendererAuthority',
    'remotionExecutionAuthority',
    'privateReviewAuthority',
    'runtimeAuthority',
    'productionAuthority',
  ])) return false
  return Object.entries(value).every(([key, entry]) =>
    key === 'admissionCandidateOnly' ? entry === true : entry === false)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join('|')
    === [...keys].sort().join('|')
}

function invalid(message: string): Error {
  return new Error(message)
}
