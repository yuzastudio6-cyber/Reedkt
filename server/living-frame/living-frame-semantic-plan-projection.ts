import type {
  LivingFrameCapabilityKey,
  LivingFrameClosedGateCode,
  LivingFrameComponentPlan,
  LivingFrameContinuityKind,
  LivingFrameContinuityPackRef,
  LivingFrameProfessionalSkillComponent,
  LivingFrameProfessionalSkillComponentDraft,
  LivingFrameQaCode,
  LivingFrameScenePlan,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_PLANNING_ONLY_AUTHORITY_BOUNDARY,
  createLivingFrameProfessionalSkillComponent,
  deriveLivingFrameEstimateInputs,
  validateLivingFrameProfessionalSkillComponent,
} from '../../src/lib/living-frame/living-frame-contract'
import type {
  LivingFrameSemanticSceneProposalBinding,
} from '../../src/lib/living-frame/living-frame-semantic-scene-proposal-contract'
import {
  validateLivingFrameSemanticSceneProposalBinding,
} from '../../src/lib/living-frame/living-frame-semantic-scene-proposal-contract'
import type {
  LivingFrameSemanticSceneProposal,
} from '../../src/types/living-frame-semantic-reasoning-request'
import type {
  LivingFrameSemanticPlanProjection,
  LivingFrameSemanticPlanProjectionAuthorityBoundary,
  LivingFrameSemanticPlanProjectionBlocker,
  LivingFrameSemanticPlanProjectionDraft,
  LivingFrameSemanticPlanProjectionState,
} from '../../src/types/living-frame-semantic-plan-projection'
import {
  LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_BLOCKERS,
  LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_CLASS,
  LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_VERSION,
} from '../../src/types/living-frame-semantic-plan-projection'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const SHA256 = /^[a-f0-9]{64}$/

const REQUIRED_COMPONENT_GATES:
  readonly LivingFrameClosedGateCode[] = [
    'canonical_planner_integration_required',
    'canonical_timing_revalidation_required',
    'canonical_estimate_required',
    'canonical_approval_required',
    'approved_snapshot_required',
    'controlled_illustration_qualification_required',
    'provider_route_review_required',
    'worker_schema_admission_required',
    'artifact_qa_required',
    'private_remotion_review_required',
  ]

const AUTHORITY_BOUNDARY:
  LivingFrameSemanticPlanProjectionAuthorityBoundary = Object.freeze({
    controlledPlanShapeProjectionOnly: true,
    liveEvidenceAuthority: false,
    reasoningRunAuthority: false,
    reasoningResultAuthority: false,
    selectedSceneAuthority: false,
    canonicalComponentPlanAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    customerCommercialAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    artifactQaAuthority: false,
    renderAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameSemanticPlanProjectionInput {
  readonly deferredComponent: LivingFrameProfessionalSkillComponent
  readonly semanticProposalBinding: LivingFrameSemanticSceneProposalBinding
}

export async function compileLivingFrameSemanticPlanProjection(
  input: CompileLivingFrameSemanticPlanProjectionInput,
): Promise<LivingFrameSemanticPlanProjection> {
  const deferredValidation =
    await validateLivingFrameProfessionalSkillComponent(
      input.deferredComponent,
    )
  if (!deferredValidation.ok) {
    throw invalid('Living Frame deferred component is invalid.')
  }
  assertDeferredComponent(deferredValidation.component)
  const proposalValidation =
    await validateLivingFrameSemanticSceneProposalBinding(
      input.semanticProposalBinding,
    )
  if (!proposalValidation.ok) {
    throw invalid('Living Frame semantic proposal binding is invalid.')
  }
  const semanticProposalBinding = proposalValidation.binding
  const projectedComponent = await projectProfessionalSkillComponent(
    deferredValidation.component,
    semanticProposalBinding,
  )
  const blockingReasonCodes = projectionBlockers(
    semanticProposalBinding,
  )
  const draft: LivingFrameSemanticPlanProjectionDraft = {
    contractVersion: LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_VERSION,
    projectionClass: LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_CLASS,
    projectionState: projectionState(semanticProposalBinding),
    sourceBindings: {
      deferredLivingFrameComponentDigestSha256:
        deferredValidation.component.contractDigestSha256,
      semanticProposalBindingDigestSha256:
        semanticProposalBinding.contractDigestSha256,
      semanticRequestDigestSha256:
        semanticProposalBinding.requestContractDigestSha256,
      semanticResultDigestSha256:
        semanticProposalBinding.proposalResultDigestSha256,
      visualContinuityPackDigestSha256:
        semanticProposalBinding.continuityPackDigestSha256,
    },
    projectedComponent,
    blockingReasonCodes,
    authorityBoundary: AUTHORITY_BOUNDARY,
    existingProfessionalSkillPlanRemainsAuthority: true,
    sharedSpeechRouteAndReasoningAuthoritiesStillRequired: true,
    containsSelectedSceneOrRuntimeAuthority: false,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false,
    containsProviderToolWorkQueueCostOrCommercialRoute: false,
    containsExecutableCodeOrCommands: false,
    subjectSpecificRouting: false,
    promotionAllowed: false,
  }
  return {
    ...draft,
    projectionDigestSha256: sha256AuthorityValue(draft),
  }
}

export async function verifyLivingFrameSemanticPlanProjection(
  value: unknown,
): Promise<boolean> {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'projectionClass',
      'projectionState',
      'sourceBindings',
      'projectedComponent',
      'blockingReasonCodes',
      'authorityBoundary',
      'existingProfessionalSkillPlanRemainsAuthority',
      'sharedSpeechRouteAndReasoningAuthoritiesStillRequired',
      'containsSelectedSceneOrRuntimeAuthority',
      'containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials',
      'containsProviderToolWorkQueueCostOrCommercialRoute',
      'containsExecutableCodeOrCommands',
      'subjectSpecificRouting',
      'promotionAllowed',
      'projectionDigestSha256',
    ])) return false
    const projection =
      value as unknown as LivingFrameSemanticPlanProjection
    const { projectionDigestSha256, ...draft } = projection
    if (
      projectionDigestSha256 !== sha256AuthorityValue(draft)
      || projection.contractVersion
        !== LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_VERSION
      || projection.projectionClass
        !== LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_CLASS
      || !validateSourceBindings(projection.sourceBindings)
      || !validateBlockingReasons(projection.blockingReasonCodes)
      || !validateAuthorityBoundary(projection.authorityBoundary)
      || projection.existingProfessionalSkillPlanRemainsAuthority !== true
      || projection.sharedSpeechRouteAndReasoningAuthoritiesStillRequired
        !== true
      || projection.containsSelectedSceneOrRuntimeAuthority !== false
      || projection
        .containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials
        !== false
      || projection.containsProviderToolWorkQueueCostOrCommercialRoute
        !== false
      || projection.containsExecutableCodeOrCommands !== false
      || projection.subjectSpecificRouting !== false
      || projection.promotionAllowed !== false
    ) return false
    const componentValidation =
      await validateLivingFrameProfessionalSkillComponent(
        projection.projectedComponent,
      )
    return componentValidation.ok
      && projection.sourceBindings
        .deferredLivingFrameComponentDigestSha256
        !== projection.projectedComponent.contractDigestSha256
      && stateMatchesComponent(projection)
  } catch {
    return false
  }
}

async function projectProfessionalSkillComponent(
  deferredComponent: LivingFrameProfessionalSkillComponent,
  binding: LivingFrameSemanticSceneProposalBinding,
): Promise<LivingFrameProfessionalSkillComponent> {
  const result = binding.normalizedResult
  const continuityPackRefs = createContinuityRefs(binding)
  const continuityRefByKind = new Map(
    continuityPackRefs.map((entry) => [entry.kind, entry.continuityRefId]),
  )
  const scenes = result.overallDecision === 'candidates_proposed'
    ? result.sceneProposals.map((scene) => projectScene({
        scene,
        deferredComponent,
        binding,
        continuityRefByKind,
      }))
    : []
  const capabilityRequirements = compileCapabilityRequirements(scenes)
  const qaExpectationCodes = uniqueSorted(
    scenes.flatMap((scene) => scene.qaExpectationCodes),
  ) as LivingFrameQaCode[]
  const componentGates = compileComponentGates(scenes)
  const decision = result.overallDecision === 'deliberate_non_use'
    ? result.decisions.find((entry) =>
        entry.decisionKind === 'deliberate_non_use')
    : result.decisions.find((entry) =>
        entry.decisionKind === 'blocked')
  const draft: LivingFrameProfessionalSkillComponentDraft = {
    contractVersion: deferredComponent.contractVersion,
    contractSource: deferredComponent.contractSource,
    status: result.overallDecision === 'deliberate_non_use'
      ? 'planning_only'
      : 'blocked',
    runtimeReadiness: deferredComponent.runtimeReadiness,
    authorityBoundary: LIVING_FRAME_PLANNING_ONLY_AUTHORITY_BOUNDARY,
    inputBindings: projectInputBindings({
      deferredComponent,
      binding,
      scenes,
    }),
    decisionSummary: result.overallDecision === 'deliberate_non_use'
      ? {
          decision: 'non_use',
          reasonCode: decision?.reasonCode ?? 'motion_would_distract',
          summary: decision?.derivedSummary
            ?? 'Living Frame is deliberately not used for this edit beat.',
          selectedMode: null,
          rejectedConcepts: [],
        }
      : {
          decision: 'blocked',
          reasonCode: result.overallDecision === 'blocked'
            ? (decision?.reasonCode ?? 'source_truth_uncertain')
            : 'capability_qualification_required',
          summary: result.overallDecision === 'blocked'
            ? (decision?.derivedSummary
              ?? 'The semantic result remains blocked.')
            : 'Semantic candidates are projected into the professional-skill shape but remain blocked from canonical selection.',
          selectedMode: null,
          rejectedConcepts: result.decisions
            .filter((entry) => entry.decisionKind === 'rejected_candidate')
            .map((entry) => ({
              conceptId: entry.semanticDecisionKey,
              reasonCode: entry.reasonCode,
              reasonSummary: entry.derivedSummary,
            })),
        },
    scenePlans: scenes,
    continuityPackRefs,
    capabilityRequirements,
    estimateInputs: deriveLivingFrameEstimateInputs({
      scenePlans: scenes,
      continuityReferenceCount: continuityPackRefs.length,
      topLevelQaExpectationCount: qaExpectationCodes.length,
      motionComplexity: motionComplexity(scenes),
      cameraComplexity: cameraComplexity(scenes),
      controlledIllustrationComplexity:
        illustrationComplexity(scenes),
      generatedVideoExpectation: scenes.some((scene) =>
        scene.components.some((component) =>
          component.capabilityKeys.includes(
            'bounded_video_asset_generation',
          )))
        ? 'future_capability_review_required'
        : 'not_required',
    }),
    qaExpectationCodes,
    closedGateCodes: componentGates,
  }
  return createLivingFrameProfessionalSkillComponent(draft)
}

function projectInputBindings(input: {
  readonly deferredComponent: LivingFrameProfessionalSkillComponent
  readonly binding: LivingFrameSemanticSceneProposalBinding
  readonly scenes: readonly LivingFrameScenePlan[]
}): LivingFrameProfessionalSkillComponentDraft['inputBindings'] {
  const bindings = structuredClone(
    input.deferredComponent.inputBindings,
  )
  const requiresFactSafety = input.scenes.some((scene) => [
    'exact_geography_verification_required',
    'exact_data_verification_required',
    'documentary_source_verification_required',
  ].includes(scene.sourceTruthMode))
  const requiresCharacterSafety = input.scenes.some((scene) =>
    scene.sourceTruthMode === 'canonical_illustrative_interpretation'
    || scene.components.some((component) =>
      component.capabilityKeys.includes(
        'identity_conditioned_illustration',
      )))
  const evidenceDigest =
    input.binding.request.canonicalBindings
      .visualEvidenceBindingDigestSha256
  const factSafetyRefs =
    requiresFactSafety && bindings.factSafetyRefs.length === 0
      ? [{
      expectationRefId: 'living-frame.fact-safety.projection',
      expectedDigestSha256: evidenceDigest,
      evidenceClass: 'controlled_unverified_evidence' as const,
    }]
      : bindings.factSafetyRefs
  const characterSafetyRefs =
    requiresCharacterSafety && bindings.characterSafetyRefs.length === 0
      ? [{
      expectationRefId: 'living-frame.character-safety.projection',
      expectedDigestSha256: evidenceDigest,
      evidenceClass: 'controlled_unverified_evidence' as const,
    }]
      : bindings.characterSafetyRefs
  return {
    ...bindings,
    factSafetyRefs,
    characterSafetyRefs,
  }
}

function projectScene(input: {
  readonly scene: LivingFrameSemanticSceneProposal
  readonly deferredComponent: LivingFrameProfessionalSkillComponent
  readonly binding: LivingFrameSemanticSceneProposalBinding
  readonly continuityRefByKind: ReadonlyMap<
    LivingFrameContinuityKind,
    string
  >
}): LivingFrameScenePlan {
  const segmentContexts =
    input.binding.request.semanticPayload.segmentContexts
      .filter((entry) =>
        input.scene.segmentContextIds.includes(entry.segmentContextId))
      .sort((left, right) => left.order - right.order)
  if (segmentContexts.length !== 1) {
    throw invalid(
      'Living Frame v1 scene projection requires exactly one source segment context.',
    )
  }
  const segmentExpectation =
    input.deferredComponent.inputBindings.segmentExpectations.find(
      (entry) => entry.order === segmentContexts[0]!.order,
    )
  if (!segmentExpectation) {
    throw invalid(
      'Living Frame scene cannot bind its segment to the deferred component.',
    )
  }
  const continuityRefIds = input.scene.continuityExpectationKinds
    .map((kind) => input.continuityRefByKind.get(kind))
    .filter((entry): entry is string => Boolean(entry))
  if (
    continuityRefIds.length
    !== input.scene.continuityExpectationKinds.length
  ) throw invalid(
    'Living Frame scene continuity expectations are incomplete.',
  )
  const sceneQa = uniqueSorted(
    input.scene.qaExpectationCodes,
  ) as LivingFrameQaCode[]
  return {
    sceneId: input.scene.sceneProposalKey,
    order: input.scene.order,
    segmentExpectationId: segmentExpectation.segmentExpectationId,
    mode: input.scene.mode,
    decision: 'defer',
    sourceTruthMode: input.scene.sourceTruthMode,
    narrativePurposeCode: input.scene.narrativePurposeCode,
    visualVerb: input.scene.visualVerb,
    importance: input.scene.importance,
    summary: input.scene.derivedSummary,
    focalPrimaryComponentId:
      input.scene.focalPrimaryComponentKey,
    components: input.scene.components.map((component) =>
      projectComponent(component, sceneQa, continuityRefIds)),
    componentDependencies: input.scene.componentDependencies.map(
      (dependency) => ({
        componentId: dependency.componentKey,
        dependsOnComponentId: dependency.dependsOnComponentKey,
        kind: dependency.kind,
      }),
    ),
    skillActivations: input.scene.miniSkillProposals.map(
      (activation) => ({
        activationId: activation.activationKey,
        order: activation.order,
        miniSkillKey: activation.miniSkillKey,
        role: activation.role,
        decision: activation.decision,
        intensity: activation.intensity,
        reasonCode: activation.reasonCode,
        reasonSummary: activation.derivedSummary,
        linkedComponentIds: [...activation.linkedComponentKeys],
        linkedTimingRequestIds: [
          ...activation.linkedTimingConstraintKeys,
        ],
        dependsOnActivationIds: [
          ...activation.dependsOnActivationKeys,
        ],
        conflictsWithActivationIds: [
          ...activation.conflictsWithActivationKeys,
        ],
        qaExpectationCodes: sceneQa,
      }),
    ),
    semanticTimingRequests: projectTimingRequests(input.scene),
    attentionSequence:
      input.scene.attentionConstraints.map((event) => ({
        attentionEventId: event.attentionConstraintKey,
        order: event.order,
        eventType: event.eventType,
        target: event.target,
        methods: [...event.methods],
        summary: event.derivedSummary,
        exactFramesProvided: false,
      })),
    semanticScaleRequests:
      input.scene.semanticScaleConstraints.map((request) => ({
        semanticScaleRequestId: request.scaleConstraintKey,
        componentId: request.componentKey,
        mode: request.mode,
        meaning: request.meaning,
        factualGuard: request.factualGuard,
        summary: request.derivedSummary,
      })),
    soundRequests: input.scene.soundConstraints.map((request) => ({
      soundRequestId: request.soundConstraintKey,
      order: request.order,
      linkedComponentId: request.linkedComponentKey,
      purpose: request.purpose,
      priority: request.priority,
      narrationProtection: request.narrationProtection,
      duckingExpectation: request.duckingExpectation,
      summary: request.derivedSummary,
      exactCuePlacementProvided: false,
      exactMixProvided: false,
    })),
    regionSafety: { ...input.scene.regionSafety },
    fallbackLadder: [...input.scene.fallbackLadder],
    continuityRefIds,
    qaExpectationCodes: sceneQa,
    closedGateCodes: compileSceneGates(input.scene),
  }
}

function projectTimingRequests(
  scene: LivingFrameSemanticSceneProposal,
): LivingFrameScenePlan['semanticTimingRequests'] {
  const provided = new Map(
    scene.semanticTimingConstraints.map((request) => [
      request.phase,
      request,
    ]),
  )
  const phases = [
    {
      phase: 'prepare',
      cueCode: 'spoken_meaning_begins',
      summary: 'Prepare the scene without pre-empting the spoken meaning.',
    },
    {
      phase: 'activate',
      cueCode: 'visual_introduction_requested',
      summary: 'Introduce the primary visual at the semantic activation.',
    },
    {
      phase: 'demonstrate',
      cueCode: 'primary_motion_requested',
      summary: 'Demonstrate the visual relationship while it carries meaning.',
    },
    {
      phase: 'resolve',
      cueCode: 'visual_resolution_requested',
      summary: 'Resolve the visual argument without an arbitrary cutoff.',
    },
    {
      phase: 'settle',
      cueCode: 'attention_return_requested',
      summary: 'Settle the scene and return attention safely.',
    },
  ] as const
  return phases.map((fallback, order) => {
    const request = provided.get(fallback.phase)
    return {
      timingRequestId:
        request?.timingConstraintKey
        ?? `${scene.sceneProposalKey}.timing.${fallback.phase}`,
      order,
      phase: fallback.phase,
      cueCode: request?.cueCode ?? fallback.cueCode,
      summary: request?.derivedSummary ?? fallback.summary,
      exactFramesProvided: false,
    }
  })
}

function projectComponent(
  component: LivingFrameSemanticSceneProposal['components'][number],
  sceneQa: readonly LivingFrameQaCode[],
  continuityRefIds: readonly string[],
): LivingFrameComponentPlan {
  const alpha = alphaExpectations(
    component.transparencyExpectation,
    component.alphaSourceExpectation,
  )
  const qa = new Set<LivingFrameQaCode>()
  for (const code of sceneQa) {
    if ([
      'continuity_comparison_required',
      'component_separability_required',
      'alpha_multi_background_qa_required',
      'temporal_mask_stability_required',
      'pivot_physics_qa_required',
      'documentary_integrity_required',
      'exact_geography_verification_required',
      'exact_data_verification_required',
    ].includes(code)) qa.add(code)
  }
  return {
    componentId: component.componentKey,
    order: component.order,
    role: component.role,
    focalRole: component.focalRole,
    summary: component.derivedSummary,
    parentComponentId: component.parentComponentKey,
    anchorComponentId: component.anchorComponentKey,
    depthBand: component.depthBand,
    transparencyExpectation: component.transparencyExpectation,
    alphaSourceExpectation: component.alphaSourceExpectation,
    alphaQaExpectation: alpha.alphaQaExpectation,
    rectangularBackgroundRejectionRequired:
      alpha.rectangularBackgroundRejectionRequired,
    provenanceExpectation: component.provenanceExpectation,
    evidenceClass: 'controlled_unverified_evidence',
    capabilityKeys: [...component.capabilityKeys],
    continuityRefIds: [...continuityRefIds],
    qaExpectationCodes: [...qa].sort(),
  }
}

function alphaExpectations(
  transparency:
    LivingFrameComponentPlan['transparencyExpectation'],
  alphaSource: LivingFrameComponentPlan['alphaSourceExpectation'],
): Pick<
  LivingFrameComponentPlan,
  'alphaQaExpectation' | 'rectangularBackgroundRejectionRequired'
> {
  const expected = {
    opaque_plate: {
      alphaSource: 'opaque_plate',
      alphaQaExpectation: 'not_applicable',
      rectangularBackgroundRejectionRequired: false,
    },
    native_alpha_preferred: {
      alphaSource: 'native_alpha_claim_requires_qa',
      alphaQaExpectation: 'future_alpha_qa_required',
      rectangularBackgroundRejectionRequired: true,
    },
    still_alpha_required: {
      alphaSource: 'postprocessed_still_mask_requires_qa',
      alphaQaExpectation: 'future_alpha_qa_required',
      rectangularBackgroundRejectionRequired: true,
    },
    temporal_mask_required: {
      alphaSource: 'temporal_mask_sequence_requires_qa',
      alphaQaExpectation: 'temporal_mask_qa_required',
      rectangularBackgroundRejectionRequired: true,
    },
    procedural_alpha: {
      alphaSource: 'procedural_alpha_requires_qa',
      alphaQaExpectation: 'procedural_alpha_validation_required',
      rectangularBackgroundRejectionRequired: true,
    },
    additive_effect: {
      alphaSource: 'additive_blend_requires_qa',
      alphaQaExpectation: 'procedural_alpha_validation_required',
      rectangularBackgroundRejectionRequired: true,
    },
  } as const
  const value = expected[transparency]
  if (value.alphaSource !== alphaSource) {
    throw invalid('Living Frame alpha expectations are inconsistent.')
  }
  return {
    alphaQaExpectation: value.alphaQaExpectation,
    rectangularBackgroundRejectionRequired:
      value.rectangularBackgroundRejectionRequired,
  }
}

function createContinuityRefs(
  binding: LivingFrameSemanticSceneProposalBinding,
): LivingFrameContinuityPackRef[] {
  const kinds = uniqueSorted(
    binding.normalizedResult.sceneProposals.flatMap(
      (scene) => scene.continuityExpectationKinds,
    ),
  ) as LivingFrameContinuityKind[]
  if (kinds.length === 0) return []
  if (!binding.continuityPackDigestSha256) {
    throw invalid(
      'Living Frame continuity requirements lack a continuity pack.',
    )
  }
  return kinds.map((kind) => ({
    continuityRefId: `continuity.${kind}`,
    kind,
    version: 1,
    expectedDigestSha256: binding.continuityPackDigestSha256!,
    evidenceClass: 'controlled_unverified_evidence',
    liveAuthorityVerified: false,
  }))
}

function compileCapabilityRequirements(
  scenes: readonly LivingFrameScenePlan[],
): LivingFrameProfessionalSkillComponentDraft[
  'capabilityRequirements'
] {
  const linkedScenes = new Map<LivingFrameCapabilityKey, Set<string>>()
  for (const scene of scenes) {
    for (const component of scene.components) {
      for (const capability of component.capabilityKeys) {
        const sceneIds = linkedScenes.get(capability) ?? new Set<string>()
        sceneIds.add(scene.sceneId)
        linkedScenes.set(capability, sceneIds)
      }
    }
  }
  return [...linkedScenes.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([capabilityKey, sceneIds]) => ({
      capabilityKey,
      role: 'required',
      linkedSceneIds: [...sceneIds].sort(),
      qualificationStatus: 'abstract_capability_expectation_only',
    }))
}

function compileComponentGates(
  scenes: readonly LivingFrameScenePlan[],
): LivingFrameClosedGateCode[] {
  return uniqueSorted([
    ...REQUIRED_COMPONENT_GATES,
    ...scenes.flatMap((scene) => scene.closedGateCodes),
  ]) as LivingFrameClosedGateCode[]
}

function compileSceneGates(
  scene: LivingFrameSemanticSceneProposal,
): LivingFrameClosedGateCode[] {
  const gates = new Set(REQUIRED_COMPONENT_GATES)
  if ([
    'exact_geography_verification_required',
    'exact_data_verification_required',
    'documentary_source_verification_required',
  ].includes(scene.sourceTruthMode)) {
    gates.add('documentary_fact_verification_required')
  }
  if (
    scene.sourceTruthMode === 'canonical_illustrative_interpretation'
    || scene.components.some((component) =>
      component.capabilityKeys.includes(
        'identity_conditioned_illustration',
      ))
  ) gates.add('identity_safety_review_required')
  if (scene.components.some((component) =>
    component.transparencyExpectation === 'temporal_mask_required'
  )) gates.add('temporal_mask_benchmark_required')
  return [...gates].sort()
}

function motionComplexity(
  scenes: readonly LivingFrameScenePlan[],
): 'none' | 'low' | 'medium' | 'high' {
  const count = scenes.reduce(
    (total, scene) => total + scene.skillActivations.filter(
      (activation) => activation.decision !== 'do_not_use',
    ).length,
    0,
  )
  return count === 0 ? 'none' : count <= 2 ? 'low' : count <= 6
    ? 'medium' : 'high'
}

function cameraComplexity(
  scenes: readonly LivingFrameScenePlan[],
): 'none' | 'low' | 'medium' | 'high' {
  const count = scenes.reduce(
    (total, scene) => total + scene.skillActivations.filter(
      (activation) =>
        activation.miniSkillKey === 'camera_choreography'
        && activation.decision !== 'do_not_use',
    ).length,
    0,
  )
  return count === 0 ? 'none' : count === 1 ? 'low' : count <= 3
    ? 'medium' : 'high'
}

function illustrationComplexity(
  scenes: readonly LivingFrameScenePlan[],
): 'none' | 'low' | 'medium' | 'high' {
  const count = scenes.reduce(
    (total, scene) => total + scene.components.filter((component) =>
      component.capabilityKeys.some((capability) => [
        'still_image_generation_or_edit',
        'reference_conditioned_illustration',
        'structure_conditioned_illustration',
        'identity_conditioned_illustration',
        'low_rank_adapter_training_or_loading',
      ].includes(capability))).length,
    0,
  )
  return count === 0 ? 'none' : count === 1 ? 'low' : count <= 3
    ? 'medium' : 'high'
}

function projectionBlockers(
  binding: LivingFrameSemanticSceneProposalBinding,
): LivingFrameSemanticPlanProjectionBlocker[] {
  return uniqueSorted([
    ...binding.blockingReasonCodes,
    'released_reasoning_lifecycle_required',
    'canonical_selected_scene_admission_required',
  ]) as LivingFrameSemanticPlanProjectionBlocker[]
}

function projectionState(
  binding: LivingFrameSemanticSceneProposalBinding,
): LivingFrameSemanticPlanProjectionState {
  if (binding.normalizedResult.overallDecision === 'deliberate_non_use') {
    return 'deliberate_non_use_projection'
  }
  if (binding.normalizedResult.overallDecision === 'blocked') {
    return 'blocked_semantic_result_projection'
  }
  return 'blocked_candidate_projection'
}

function assertDeferredComponent(
  component: LivingFrameProfessionalSkillComponent,
): void {
  if (
    component.status !== 'deferred'
    || component.decisionSummary.decision !== 'deferred'
    || component.decisionSummary.selectedMode !== null
    || component.scenePlans.length !== 0
    || component.capabilityRequirements.length !== 0
    || component.continuityPackRefs.length !== 0
    || component.authorityBoundary.planningOnly !== true
    || Object.entries(component.authorityBoundary).some(([key, value]) =>
      key === 'planningOnly' ? value !== true : value !== false)
  ) throw invalid(
    'Living Frame semantic projection requires the canonical deferred component.',
  )
}

function validateSourceBindings(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'deferredLivingFrameComponentDigestSha256',
      'semanticProposalBindingDigestSha256',
      'semanticRequestDigestSha256',
      'semanticResultDigestSha256',
      'visualContinuityPackDigestSha256',
    ])
    && [
      value.deferredLivingFrameComponentDigestSha256,
      value.semanticProposalBindingDigestSha256,
      value.semanticRequestDigestSha256,
      value.semanticResultDigestSha256,
    ].every((entry) => typeof entry === 'string' && SHA256.test(entry))
    && (
      value.visualContinuityPackDigestSha256 === null
      || (
        typeof value.visualContinuityPackDigestSha256 === 'string'
        && SHA256.test(value.visualContinuityPackDigestSha256)
      )
    )
}

function validateBlockingReasons(value: unknown): boolean {
  const allowed = new Set<string>(
    LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_BLOCKERS,
  )
  return Array.isArray(value)
    && value.length >= 2
    && value.length <= LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_BLOCKERS.length
    && new Set(value).size === value.length
    && value.every((entry, index) =>
      typeof entry === 'string'
      && allowed.has(entry)
      && (
        index === 0
        || String(value[index - 1]).localeCompare(entry) < 0
      ))
    && value.includes('released_reasoning_lifecycle_required')
    && value.includes('canonical_selected_scene_admission_required')
}

function validateAuthorityBoundary(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'controlledPlanShapeProjectionOnly',
      'liveEvidenceAuthority',
      'reasoningRunAuthority',
      'reasoningResultAuthority',
      'selectedSceneAuthority',
      'canonicalComponentPlanAuthority',
      'masterTimingAuthority',
      'exactFrameAuthority',
      'soundSyncAuthority',
      'estimateAuthority',
      'customerCommercialAuthority',
      'approvalAuthority',
      'snapshotAuthority',
      'providerAuthority',
      'toolRouteAuthority',
      'workGraphAuthority',
      'queueAuthority',
      'assetManifestAuthority',
      'artifactQaAuthority',
      'renderAuthority',
      'runtimePromotionAuthority',
      'productionAuthority',
    ])
    && value.controlledPlanShapeProjectionOnly === true
    && Object.entries(value).every(([key, entry]) =>
      key === 'controlledPlanShapeProjectionOnly'
        ? entry === true
        : entry === false)
}

function stateMatchesComponent(
  projection: LivingFrameSemanticPlanProjection,
): boolean {
  const component = projection.projectedComponent
  if (component.decisionSummary.decision === 'selected') return false
  if (projection.projectionState === 'blocked_candidate_projection') {
    return component.status === 'blocked'
      && component.decisionSummary.decision === 'blocked'
      && component.scenePlans.length > 0
      && component.scenePlans.every((scene) => scene.decision === 'defer')
  }
  if (projection.projectionState === 'deliberate_non_use_projection') {
    return component.decisionSummary.decision === 'non_use'
      && component.scenePlans.length === 0
      && component.capabilityRequirements.length === 0
      && component.continuityPackRefs.length === 0
  }
  return component.status === 'blocked'
    && component.decisionSummary.decision === 'blocked'
    && component.scenePlans.length === 0
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right))
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
