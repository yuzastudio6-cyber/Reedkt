import type {
  LivingFrameSemanticReasoningRequest,
  LivingFrameSemanticSceneProposalResult,
} from '../../types/living-frame-semantic-reasoning-request'
import type {
  LivingFrameVisualContinuityPack,
  LivingFrameVisualContinuityPackDraft,
} from '../../types/living-frame-visual-continuity'
import {
  createLivingFrameSemanticReasoningRequestFixtures,
} from './living-frame-semantic-reasoning-request-fixtures'
import {
  createLivingFrameVisualContinuityPack,
} from './living-frame-visual-continuity-contract'
import {
  createLivingFrameVisualContinuityFixtureDrafts,
} from './living-frame-visual-continuity-fixtures'
import {
  type CreateLivingFrameSemanticSceneProposalBindingInput,
  type LivingFrameSemanticSceneProposalBinding,
  type LivingFrameSemanticSceneProposalIssueCode,
  createLivingFrameSemanticSceneProposalBinding,
} from './living-frame-semantic-scene-proposal-contract'

export interface LivingFrameSemanticSceneProposalFixtureInputs {
  readonly musashi: CreateLivingFrameSemanticSceneProposalBindingInput
  readonly helicopter: CreateLivingFrameSemanticSceneProposalBindingInput
  readonly hormuz: CreateLivingFrameSemanticSceneProposalBindingInput
  readonly emotionalNonUse:
    CreateLivingFrameSemanticSceneProposalBindingInput
}

export interface LivingFrameSemanticSceneProposalFixtureSet {
  readonly musashi: LivingFrameSemanticSceneProposalBinding
  readonly helicopter: LivingFrameSemanticSceneProposalBinding
  readonly hormuz: LivingFrameSemanticSceneProposalBinding
  readonly emotionalNonUse: LivingFrameSemanticSceneProposalBinding
}

export interface LivingFrameSemanticSceneProposalAdversarialFixture {
  readonly fixtureId: string
  readonly operation: 'create' | 'validate'
  readonly expectedIssueCode: LivingFrameSemanticSceneProposalIssueCode
  readonly payload: unknown
}

export async function createLivingFrameSemanticSceneProposalFixtureInputs():
Promise<LivingFrameSemanticSceneProposalFixtureInputs> {
  const requests = await createLivingFrameSemanticReasoningRequestFixtures()
  const continuityDrafts =
    createLivingFrameVisualContinuityFixtureDrafts()
  const [musashiPack, helicopterPack, hormuzPack] = await Promise.all([
    createAlignedContinuityPack(continuityDrafts.musashi, requests.musashi),
    createAlignedContinuityPack(
      continuityDrafts.helicopter,
      requests.helicopter,
    ),
    createAlignedContinuityPack(continuityDrafts.hormuz, requests.hormuz),
  ])
  return {
    musashi: {
      request: requests.musashi,
      result: musashiResult(),
      continuityPack: musashiPack,
    },
    helicopter: {
      request: requests.helicopter,
      result: helicopterResult(),
      continuityPack: helicopterPack,
    },
    hormuz: {
      request: requests.hormuz,
      result: hormuzResult(),
      continuityPack: hormuzPack,
    },
    emotionalNonUse: {
      request: requests.emotionalNonUse,
      result: emotionalNonUseResult(),
      continuityPack: null,
    },
  }
}

export async function createLivingFrameSemanticSceneProposalFixtures():
Promise<LivingFrameSemanticSceneProposalFixtureSet> {
  const inputs = await createLivingFrameSemanticSceneProposalFixtureInputs()
  const [musashi, helicopter, hormuz, emotionalNonUse] = await Promise.all([
    createLivingFrameSemanticSceneProposalBinding(inputs.musashi),
    createLivingFrameSemanticSceneProposalBinding(inputs.helicopter),
    createLivingFrameSemanticSceneProposalBinding(inputs.hormuz),
    createLivingFrameSemanticSceneProposalBinding(inputs.emotionalNonUse),
  ])
  return { musashi, helicopter, hormuz, emotionalNonUse }
}

export async function createLivingFrameSemanticSceneProposalAdversarialFixtures(
  inputs?: LivingFrameSemanticSceneProposalFixtureInputs,
  bindings?: LivingFrameSemanticSceneProposalFixtureSet,
): Promise<readonly LivingFrameSemanticSceneProposalAdversarialFixture[]> {
  inputs = inputs ?? await createLivingFrameSemanticSceneProposalFixtureInputs()
  bindings = bindings ?? await createBindings(inputs)
  const helicopterPack = bindings.helicopter.continuityPack
  if (!helicopterPack) {
    throw new TypeError(
      'The controlled helicopter fixture requires a continuity pack.',
    )
  }
  const {
    contractDigestSha256: omittedHelicopterPackDigest,
    ...helicopterPackDraft
  } = helicopterPack
  void omittedHelicopterPackDigest
  const wrongScopePack = await createLivingFrameVisualContinuityPack({
    ...helicopterPackDraft,
    canonicalBindings: {
      ...helicopterPackDraft.canonicalBindings,
      workspaceId: 'workspace.other',
    },
  })
  return [
    createAdversarial(
      'wrong_request_digest',
      'validate',
      'request_digest_mismatch',
      bindings.helicopter,
      (root) => {
        root.requestContractDigestSha256 = digest('0')
      },
    ),
    createAdversarial(
      'wrong_result_digest',
      'validate',
      'proposal_result_digest_mismatch',
      bindings.helicopter,
      (root) => {
        root.proposalResultDigestSha256 = digest('1')
      },
    ),
    createAdversarial(
      'wrong_continuity_digest',
      'validate',
      'continuity_pack_digest_mismatch',
      bindings.helicopter,
      (root) => {
        root.continuityPackDigestSha256 = digest('2')
      },
    ),
    createAdversarial(
      'wrong_continuity_scope',
      'create',
      'continuity_scope_mismatch',
      {
        ...inputs.helicopter,
        continuityPack: wrongScopePack,
      },
      () => undefined,
    ),
    createAdversarial(
      'missing_continuity_claims_no_blocker',
      'validate',
      'authority_boundary_invalid',
      {
        ...bindings.helicopter,
        continuityPack: null,
        continuityPackDigestSha256: null,
        blockingReasonCodes: [
          'shared_route_data_assurance_required',
        ],
      },
      () => undefined,
    ),
    createAdversarial(
      'duplicate_decision_key',
      'create',
      'duplicate_id',
      inputs.helicopter,
      (root) => {
        const result = objectField(root, 'result')
        const decisions = arrayField(result, 'decisions')
        decisions.push(cloneJson(decisions[0]))
      },
    ),
    createAdversarial(
      'duplicate_component_key',
      'create',
      'duplicate_id',
      inputs.helicopter,
      (root) => {
        const scene = firstScene(root)
        arrayField(scene, 'components').push(
          cloneJson(arrayField(scene, 'components')[0]),
        )
      },
    ),
    createAdversarial(
      'noncontiguous_component_order',
      'create',
      'semantic_order_invalid',
      inputs.musashi,
      (root) => {
        objectField(arrayField(firstScene(root), 'components')[1]).order = 8
      },
    ),
    createAdversarial(
      'dangling_evidence',
      'create',
      'dangling_request_evidence_reference',
      inputs.helicopter,
      (root) => {
        objectField(
          arrayField(
            objectField(root, 'result'),
            'decisions',
          )[0],
        ).evidenceCitations = [{ evidenceRefId: 'evidence.missing' }]
      },
    ),
    createAdversarial(
      'dangling_segment',
      'create',
      'dangling_segment_reference',
      inputs.helicopter,
      (root) => {
        firstScene(root).segmentContextIds = ['segment.missing']
      },
    ),
    createAdversarial(
      'dangling_component',
      'create',
      'dangling_component_reference',
      inputs.helicopter,
      (root) => {
        objectField(
          arrayField(firstScene(root), 'miniSkillProposals')[0],
        ).linkedComponentKeys = ['component.missing']
      },
    ),
    createAdversarial(
      'dangling_timing',
      'create',
      'dangling_timing_reference',
      inputs.helicopter,
      (root) => {
        objectField(
          arrayField(firstScene(root), 'miniSkillProposals')[0],
        ).linkedTimingConstraintKeys = ['timing.missing']
      },
    ),
    createAdversarial(
      'component_cycle',
      'create',
      'cyclic_component_graph',
      inputs.musashi,
      (root) => {
        const scene = firstScene(root)
        scene.componentDependencies = [{
          componentKey: 'component.musashi',
          dependsOnComponentKey: 'component.sword',
          kind: 'depends_on',
        }, {
          componentKey: 'component.sword',
          dependsOnComponentKey: 'component.musashi',
          kind: 'depends_on',
        }]
      },
    ),
    createAdversarial(
      'activation_cycle',
      'create',
      'cyclic_activation_graph',
      inputs.hormuz,
      (root) => {
        const activations = arrayField(firstScene(root), 'miniSkillProposals')
        objectField(activations[0]).dependsOnActivationKeys = [
          objectField(activations[1]).activationKey,
        ]
        objectField(activations[1]).dependsOnActivationKeys = [
          objectField(activations[0]).activationKey,
        ]
      },
    ),
    createAdversarial(
      'activation_dependency_conflict',
      'create',
      'activation_dependency_conflict',
      inputs.hormuz,
      (root) => {
        const activations = arrayField(firstScene(root), 'miniSkillProposals')
        const dependency = objectField(activations[1]).activationKey
        objectField(activations[0]).dependsOnActivationKeys = [dependency]
        objectField(activations[0]).conflictsWithActivationKeys = [dependency]
      },
    ),
    createAdversarial(
      'two_focal_primary_components',
      'create',
      'focal_primary_invalid',
      inputs.musashi,
      (root) => {
        objectField(
          arrayField(firstScene(root), 'components')[0],
        ).focalRole = 'primary'
      },
    ),
    createAdversarial(
      'missing_attention_restore',
      'create',
      'attention_restoration_required',
      inputs.hormuz,
      (root) => {
        const scene = firstScene(root)
        scene.attentionConstraints =
          arrayField(scene, 'attentionConstraints').slice(0, 2)
      },
    ),
    createAdversarial(
      'symbolic_map_scale',
      'create',
      'semantic_scale_truth_invalid',
      inputs.hormuz,
      (root) => {
        const scale = objectField(
          arrayField(firstScene(root), 'semanticScaleConstraints')[0],
        )
        scale.mode = 'editorial_symbolic'
        scale.factualGuard = 'symbolic_treatment_must_be_disclosed'
      },
    ),
    createAdversarial(
      'invalid_alpha_pair',
      'create',
      'alpha_expectation_invalid',
      inputs.helicopter,
      (root) => {
        objectField(
          arrayField(firstScene(root), 'components')[0],
        ).alphaSourceExpectation = 'opaque_plate'
      },
    ),
    createAdversarial(
      'musashi_verified_identity_promotion',
      'create',
      'continuity_pack_invalid',
      inputs.musashi,
      (root) => {
        objectField(
          arrayField(
            objectField(root, 'continuityPack'),
            'characterSheets',
          )[0],
        ).verifiedLikenessClaimed = true
      },
    ),
    createAdversarial(
      'hormuz_exact_geography_promotion',
      'create',
      'continuity_pack_invalid',
      inputs.hormuz,
      (root) => {
        objectField(
          arrayField(
            objectField(root, 'continuityPack'),
            'environmentSheets',
          )[0],
        ).exactGeographyVerified = true
      },
    ),
    createAdversarial(
      'checkerboard_alpha_claim',
      'create',
      'continuity_pack_invalid',
      inputs.helicopter,
      (root) => {
        objectField(
          objectField(root, 'continuityPack'),
          'alphaEdgeRules',
        ).checkerboardIsTransparency = true
      },
    ),
    createAdversarial(
      'fallback_escalation',
      'create',
      'fallback_ladder_invalid',
      inputs.helicopter,
      (root) => {
        firstScene(root).fallbackLadder = [
          'static_card',
          'full_living_frame',
          'no_extra_visual',
        ]
      },
    ),
    createAdversarial(
      'non_use_with_scene',
      'create',
      'overall_decision_invalid',
      inputs.emotionalNonUse,
      (root) => {
        const result = objectField(root, 'result')
        result.overallDecision = 'deliberate_non_use'
        result.sceneProposals =
          cloneJson(objectField(inputs.helicopter, 'result').sceneProposals)
      },
    ),
    createAdversarial(
      'forged_selected_scene_authority',
      'create',
      'proposal_schema_invalid',
      inputs.helicopter,
      (root) => {
        objectField(root, 'result').selectedSceneAuthority = true
      },
    ),
    createAdversarial(
      'forged_binding_runtime_authority',
      'validate',
      'proposal_schema_invalid',
      bindings.helicopter,
      (root) => {
        objectField(root, 'authorityBoundary').runtimeAuthority = true
      },
    ),
    createAdversarial(
      'raw_transcript_injection',
      'create',
      'forbidden_key',
      inputs.helicopter,
      (root) => {
        objectField(root, 'result').rawTranscript = 'Untrusted speech text.'
      },
    ),
    createAdversarial(
      'unsafe_url_injection',
      'create',
      'unsafe_text',
      inputs.helicopter,
      (root) => {
        objectField(
          arrayField(
            objectField(root, 'result'),
            'decisions',
          )[0],
        ).derivedSummary = 'Fetch https://invalid.example'
      },
    ),
  ]
}

async function createBindings(
  inputs: LivingFrameSemanticSceneProposalFixtureInputs,
): Promise<LivingFrameSemanticSceneProposalFixtureSet> {
  const [musashi, helicopter, hormuz, emotionalNonUse] = await Promise.all([
    createLivingFrameSemanticSceneProposalBinding(inputs.musashi),
    createLivingFrameSemanticSceneProposalBinding(inputs.helicopter),
    createLivingFrameSemanticSceneProposalBinding(inputs.hormuz),
    createLivingFrameSemanticSceneProposalBinding(inputs.emotionalNonUse),
  ])
  return { musashi, helicopter, hormuz, emotionalNonUse }
}

async function createAlignedContinuityPack(
  draft: LivingFrameVisualContinuityPackDraft,
  request: LivingFrameSemanticReasoningRequest,
): Promise<LivingFrameVisualContinuityPack> {
  return createLivingFrameVisualContinuityPack({
    ...draft,
    workflowContext: request.workflowContext,
    canonicalBindings: {
      ...draft.canonicalBindings,
      workspaceId: request.canonicalBindings.workspaceId,
      projectId: request.canonicalBindings.projectId,
      editSessionId: request.canonicalBindings.editSessionId,
      handoffId: request.canonicalBindings.handoffId,
      planningEvidenceBindingDigestSha256:
        request.canonicalBindings.visualEvidenceBindingDigestSha256,
    },
  })
}

function helicopterResult(): LivingFrameSemanticSceneProposalResult {
  return candidateResult({
    decisionKey: 'decision.helicopter.operation',
    decisionReason: 'selective_motion_improves_comprehension',
    decisionSummary:
      'Selective deterministic motion can explain rotor operation without generated video.',
    evidenceRefId: 'evidence.helicopter.visual',
    scene: {
      sceneProposalKey: 'scene.helicopter.proposal',
      order: 0,
      semanticDecisionKey: 'decision.helicopter.operation',
      segmentContextIds: ['segment.helicopter'],
      mode: 'living_still',
      sourceTruthMode: 'fictional_or_stylized',
      narrativePurposeCode: 'explain_mechanical_operation',
      visualVerb: 'rotate',
      importance: 'important',
      derivedSummary:
        'Anchor the helicopter body while the rotor carries one focal-primary mechanical action.',
      focalPrimaryComponentKey: 'component.helicopter.rotor',
      components: [{
        componentKey: 'component.helicopter.rotor',
        order: 0,
        role: 'mechanical_component',
        focalRole: 'primary',
        derivedSummary:
          'The isolated main rotor is the only focal-primary motion.',
        parentComponentKey: null,
        anchorComponentKey: null,
        depthBand: 'subject_plane',
        transparencyExpectation: 'still_alpha_required',
        alphaSourceExpectation:
          'postprocessed_still_mask_requires_qa',
        provenanceExpectation: 'approved_source_asset_expectation',
        capabilityKeys: [
          'foreground_component_extraction',
          'deterministic_scene_composition',
        ],
        evidenceCitations: [{
          evidenceRefId: 'evidence.helicopter.visual',
        }],
      }],
      componentDependencies: [],
      miniSkillProposals: [{
        activationKey: 'activation.helicopter.rotor',
        order: 0,
        miniSkillKey: 'mechanical_part_motion',
        role: 'required',
        decision: 'use_full',
        intensity: 'standard',
        reasonCode: 'selective_motion_improves_comprehension',
        derivedSummary:
          'Rotate around the planned pivot with physically plausible easing.',
        linkedComponentKeys: ['component.helicopter.rotor'],
        linkedTimingConstraintKeys: ['timing.helicopter.activate'],
        dependsOnActivationKeys: [],
        conflictsWithActivationKeys: [],
      }],
      semanticTimingConstraints: [{
        timingConstraintKey: 'timing.helicopter.activate',
        order: 0,
        phase: 'activate',
        cueCode: 'primary_motion_requested',
        derivedSummary:
          'Begin rotor motion when the mechanical operation becomes relevant.',
        exactFramesProvided: false,
      }],
      attentionConstraints: [{
        attentionConstraintKey: 'attention.helicopter.hold',
        order: 0,
        eventType: 'hold',
        target: 'visual',
        methods: ['motion_emphasis_expectation'],
        derivedSummary:
          'Hold attention on the rotor while the operation is explained.',
        exactFramesProvided: false,
      }],
      semanticScaleConstraints: [],
      soundConstraints: [{
        soundConstraintKey: 'sound.helicopter.rotor',
        order: 0,
        linkedComponentKey: 'component.helicopter.rotor',
        purpose: 'mechanical_presence',
        priority: 'supporting',
        narrationProtection: 'strict',
        duckingExpectation: 'downstream_soundsync_required',
        derivedSummary:
          'Request a restrained rotor bed only through downstream SoundSync.',
        exactCuePlacementProvided: false,
        exactMixProvided: false,
      }],
      regionSafety: downstreamRegionSafety(),
      fallbackLadder: [
        'full_living_frame',
        'simplified_depth_composition',
        'static_card',
        'no_extra_visual',
      ],
      continuityExpectationKinds: [
        'style_bible',
        'object_identity_sheet',
        'environment_identity_sheet',
        'scene_design_sheet',
        'motion_language_sheet',
        'sound_language_sheet',
        'alpha_edge_rules',
        'continuity_ledger',
      ],
      qaExpectationCodes: [
        'one_focal_primary_expected',
        'alpha_multi_background_qa_required',
        'pivot_physics_qa_required',
        'semantic_timing_binding_required',
        'narration_protection_required',
        'generated_video_restraint_required',
      ],
    },
  })
}

function musashiResult(): LivingFrameSemanticSceneProposalResult {
  return candidateResult({
    decisionKey: 'decision.musashi.strike',
    decisionReason: 'selective_motion_improves_comprehension',
    decisionSummary:
      'A canonical illustrated interpretation can carry one decisive limited-animation strike.',
    evidenceRefId: 'evidence.musashi.visual',
    scene: {
      sceneProposalKey: 'scene.musashi.proposal',
      order: 0,
      semanticDecisionKey: 'decision.musashi.strike',
      segmentContextIds: ['segment.musashi'],
      mode: 'living_still',
      sourceTruthMode: 'canonical_illustrative_interpretation',
      narrativePurposeCode: 'demonstrate_decisive_action',
      visualVerb: 'separate',
      importance: 'hero',
      derivedSummary:
        'Hold the illustrated confrontation, then use one restrained sword action and secondary ink response.',
      focalPrimaryComponentKey: 'component.sword',
      components: [{
        componentKey: 'component.musashi',
        order: 0,
        role: 'primary_subject',
        focalRole: 'static_anchor',
        derivedSummary:
          'The canonical illustrative body remains the stable scene anchor.',
        parentComponentKey: null,
        anchorComponentKey: null,
        depthBand: 'subject_plane',
        transparencyExpectation: 'still_alpha_required',
        alphaSourceExpectation:
          'postprocessed_still_mask_requires_qa',
        provenanceExpectation: 'generated_illustration_expectation',
        capabilityKeys: [
          'still_image_generation_or_edit',
          'foreground_component_extraction',
        ],
        evidenceCitations: [{
          evidenceRefId: 'evidence.musashi.visual',
        }],
      }, {
        componentKey: 'component.sword',
        order: 1,
        role: 'mechanical_component',
        focalRole: 'primary',
        derivedSummary:
          'The separate sword performs the only focal-primary action.',
        parentComponentKey: 'component.musashi',
        anchorComponentKey: 'component.musashi',
        depthBand: 'in_front_of_subject',
        transparencyExpectation: 'still_alpha_required',
        alphaSourceExpectation:
          'postprocessed_still_mask_requires_qa',
        provenanceExpectation: 'generated_illustration_expectation',
        capabilityKeys: [
          'foreground_component_extraction',
          'deterministic_scene_composition',
        ],
        evidenceCitations: [{
          evidenceRefId: 'evidence.musashi.visual',
        }],
      }, {
        componentKey: 'component.ink',
        order: 2,
        role: 'editorial_graphic',
        focalRole: 'ambient',
        derivedSummary:
          'A procedural ink trail follows the sword without becoming evidence.',
        parentComponentKey: null,
        anchorComponentKey: 'component.sword',
        depthBand: 'foreground',
        transparencyExpectation: 'procedural_alpha',
        alphaSourceExpectation: 'procedural_alpha_requires_qa',
        provenanceExpectation: 'deterministic_draw_expectation',
        capabilityKeys: [
          'deterministic_vector_drawing',
        ],
        evidenceCitations: [{
          evidenceRefId: 'evidence.musashi.visual',
        }],
      }, {
        componentKey: 'component.dust',
        order: 3,
        role: 'environmental_effect',
        focalRole: 'ambient',
        derivedSummary:
          'Sparse procedural dust follows the strike and settles without becoming evidence.',
        parentComponentKey: null,
        anchorComponentKey: 'component.musashi',
        depthBand: 'foreground',
        transparencyExpectation: 'procedural_alpha',
        alphaSourceExpectation: 'procedural_alpha_requires_qa',
        provenanceExpectation: 'deterministic_draw_expectation',
        capabilityKeys: [
          'deterministic_particle_effects',
        ],
        evidenceCitations: [{
          evidenceRefId: 'evidence.musashi.visual',
        }],
      }],
      componentDependencies: [{
        componentKey: 'component.sword',
        dependsOnComponentKey: 'component.musashi',
        kind: 'anchored_to',
      }, {
        componentKey: 'component.ink',
        dependsOnComponentKey: 'component.sword',
        kind: 'depends_on',
      }, {
        componentKey: 'component.dust',
        dependsOnComponentKey: 'component.sword',
        kind: 'depends_on',
      }],
      miniSkillProposals: [{
        activationKey: 'activation.musashi.sword',
        order: 0,
        miniSkillKey: 'mechanical_part_motion',
        role: 'required',
        decision: 'use_subtle',
        intensity: 'hero',
        reasonCode: 'selective_motion_improves_comprehension',
        derivedSummary:
          'Use one short sword action followed by restrained secondary motion.',
        linkedComponentKeys: ['component.sword'],
        linkedTimingConstraintKeys: ['timing.musashi.activate'],
        dependsOnActivationKeys: [],
        conflictsWithActivationKeys: [],
      }, {
        activationKey: 'activation.musashi.ink',
        order: 1,
        miniSkillKey: 'editorial_motion',
        role: 'supporting',
        decision: 'use_subtle',
        intensity: 'subtle',
        reasonCode: 'selective_motion_improves_comprehension',
        derivedSummary:
          'Reveal a restrained procedural ink trail after the sword action.',
        linkedComponentKeys: ['component.ink'],
        linkedTimingConstraintKeys: ['timing.musashi.demonstrate'],
        dependsOnActivationKeys: ['activation.musashi.sword'],
        conflictsWithActivationKeys: [],
      }, {
        activationKey: 'activation.musashi.environment',
        order: 2,
        miniSkillKey: 'environmental_motion',
        role: 'supporting',
        decision: 'use_subtle',
        intensity: 'subtle',
        reasonCode: 'selective_motion_improves_comprehension',
        derivedSummary:
          'Use sparse foreground dust as a restrained secondary response to the strike.',
        linkedComponentKeys: ['component.dust'],
        linkedTimingConstraintKeys: ['timing.musashi.demonstrate'],
        dependsOnActivationKeys: ['activation.musashi.sword'],
        conflictsWithActivationKeys: [],
      }],
      semanticTimingConstraints: [{
        timingConstraintKey: 'timing.musashi.activate',
        order: 0,
        phase: 'activate',
        cueCode: 'primary_motion_requested',
        derivedSummary:
          'Request the decisive movement only after the held confrontation.',
        exactFramesProvided: false,
      }, {
        timingConstraintKey: 'timing.musashi.demonstrate',
        order: 1,
        phase: 'demonstrate',
        cueCode: 'meaning_comprehension_hold_requested',
        derivedSummary:
          'Hold the aftermath long enough for the decisive action to register.',
        exactFramesProvided: false,
      }],
      attentionConstraints: [{
        attentionConstraintKey: 'attention.musashi.hold',
        order: 0,
        eventType: 'hold',
        target: 'visual',
        methods: [
          'camera_push_expectation',
          'motion_emphasis_expectation',
        ],
        derivedSummary:
          'Use motion and a restrained camera push to hold the illustrated action.',
        exactFramesProvided: false,
      }],
      semanticScaleConstraints: [],
      soundConstraints: [{
        soundConstraintKey: 'sound.musashi.strike',
        order: 0,
        linkedComponentKey: 'component.sword',
        purpose: 'movement_support',
        priority: 'primary_visual',
        narrationProtection: 'strict',
        duckingExpectation: 'downstream_soundsync_required',
        derivedSummary:
          'Request one restrained blade cue without covering narration.',
        exactCuePlacementProvided: false,
        exactMixProvided: false,
      }],
      regionSafety: downstreamRegionSafety(),
      fallbackLadder: [
        'full_living_frame',
        'full_illustrated_scene',
        'static_card',
        'no_extra_visual',
      ],
      continuityExpectationKinds: [
        'style_bible',
        'character_identity_sheet',
        'object_identity_sheet',
        'environment_identity_sheet',
        'scene_design_sheet',
        'motion_language_sheet',
        'sound_language_sheet',
        'alpha_edge_rules',
        'continuity_ledger',
      ],
      qaExpectationCodes: [
        'one_focal_primary_expected',
        'continuity_comparison_required',
        'component_separability_required',
        'alpha_multi_background_qa_required',
        'semantic_timing_binding_required',
        'narration_protection_required',
        'documentary_integrity_required',
        'generated_video_restraint_required',
      ],
    },
  })
}

function hormuzResult(): LivingFrameSemanticSceneProposalResult {
  return candidateResult({
    decisionKey: 'decision.hormuz.chokepoint',
    decisionReason: 'explanation_benefits_from_in_frame_visualization',
    decisionSummary:
      'An exact map relationship can develop around the protected source speaker.',
    evidenceRefId: 'evidence.hormuz.visual',
    scene: {
      sceneProposalKey: 'scene.hormuz.proposal',
      order: 0,
      semanticDecisionKey: 'decision.hormuz.chokepoint',
      segmentContextIds: ['segment.hormuz'],
      mode: 'living_a_roll',
      sourceTruthMode: 'exact_geography_verification_required',
      narrativePurposeCode: 'establish_geography',
      visualVerb: 'converge',
      importance: 'important',
      derivedSummary:
        'Build exact coastline and route relationships around the source speaker while preserving face, gesture, and captions.',
      focalPrimaryComponentKey: 'component.hormuz.map',
      components: [{
        componentKey: 'component.hormuz.speaker',
        order: 0,
        role: 'source_a_roll',
        focalRole: 'static_anchor',
        derivedSummary:
          'The source speaker remains protected and is never regenerated.',
        parentComponentKey: null,
        anchorComponentKey: null,
        depthBand: 'subject_plane',
        transparencyExpectation: 'temporal_mask_required',
        alphaSourceExpectation:
          'temporal_mask_sequence_requires_qa',
        provenanceExpectation: 'source_a_roll_expectation',
        capabilityKeys: [
          'temporal_subject_masking',
          'alpha_edge_refinement',
        ],
        evidenceCitations: [{
          evidenceRefId: 'evidence.hormuz.visual',
        }],
      }, {
        componentKey: 'component.hormuz.map',
        order: 1,
        role: 'exact_map_component',
        focalRole: 'primary',
        derivedSummary:
          'Exact deterministic coastline and route geometry carries the explanation.',
        parentComponentKey: null,
        anchorComponentKey: 'component.hormuz.speaker',
        depthBand: 'behind_subject',
        transparencyExpectation: 'procedural_alpha',
        alphaSourceExpectation: 'procedural_alpha_requires_qa',
        provenanceExpectation: 'exact_map_data_expectation',
        capabilityKeys: [
          'exact_map_rendering',
          'deterministic_scene_composition',
        ],
        evidenceCitations: [{
          evidenceRefId: 'evidence.hormuz.visual',
        }],
      }, {
        componentKey: 'component.hormuz.route',
        order: 2,
        role: 'editorial_graphic',
        focalRole: 'secondary',
        derivedSummary:
          'A deterministic route line converges through the verified chokepoint.',
        parentComponentKey: null,
        anchorComponentKey: 'component.hormuz.map',
        depthBand: 'behind_subject',
        transparencyExpectation: 'procedural_alpha',
        alphaSourceExpectation: 'procedural_alpha_requires_qa',
        provenanceExpectation: 'deterministic_draw_expectation',
        capabilityKeys: [
          'deterministic_vector_drawing',
          'exact_map_rendering',
        ],
        evidenceCitations: [{
          evidenceRefId: 'evidence.hormuz.visual',
        }],
      }],
      componentDependencies: [{
        componentKey: 'component.hormuz.map',
        dependsOnComponentKey: 'component.hormuz.speaker',
        kind: 'occluded_by',
      }, {
        componentKey: 'component.hormuz.route',
        dependsOnComponentKey: 'component.hormuz.map',
        kind: 'anchored_to',
      }],
      miniSkillProposals: [{
        activationKey: 'activation.hormuz.focus',
        order: 0,
        miniSkillKey: 'focus_handoff',
        role: 'supporting',
        decision: 'use_subtle',
        intensity: 'subtle',
        reasonCode: 'explanation_benefits_from_in_frame_visualization',
        derivedSummary:
          'Request a smooth attention handoff without claiming exact focus frames.',
        linkedComponentKeys: ['component.hormuz.map'],
        linkedTimingConstraintKeys: ['timing.hormuz.activate'],
        dependsOnActivationKeys: [],
        conflictsWithActivationKeys: [],
      }, {
        activationKey: 'activation.hormuz.restore',
        order: 1,
        miniSkillKey: 'attention_restoration',
        role: 'required',
        decision: 'use_full',
        intensity: 'subtle',
        reasonCode: 'explanation_benefits_from_in_frame_visualization',
        derivedSummary:
          'Return attention to the protected source speaker after comprehension.',
        linkedComponentKeys: ['component.hormuz.speaker'],
        linkedTimingConstraintKeys: ['timing.hormuz.resolve'],
        dependsOnActivationKeys: ['activation.hormuz.focus'],
        conflictsWithActivationKeys: [],
      }],
      semanticTimingConstraints: [{
        timingConstraintKey: 'timing.hormuz.activate',
        order: 0,
        phase: 'activate',
        cueCode: 'visual_introduction_requested',
        derivedSummary:
          'Introduce the map only when the geographic relationship begins.',
        exactFramesProvided: false,
      }, {
        timingConstraintKey: 'timing.hormuz.resolve',
        order: 1,
        phase: 'resolve',
        cueCode: 'attention_return_requested',
        derivedSummary:
          'Resolve the route explanation before attention returns to the speaker.',
        exactFramesProvided: false,
      }],
      attentionConstraints: [{
        attentionConstraintKey: 'attention.hormuz.handoff',
        order: 0,
        eventType: 'handoff',
        target: 'visual',
        methods: [
          'focus_depth_expectation',
          'motion_emphasis_expectation',
        ],
        derivedSummary:
          'Transfer attention gently from the speaker to the exact map relationship.',
        exactFramesProvided: false,
      }, {
        attentionConstraintKey: 'attention.hormuz.hold',
        order: 1,
        eventType: 'hold',
        target: 'visual',
        methods: ['motion_emphasis_expectation'],
        derivedSummary:
          'Hold the map relationship only for comprehension.',
        exactFramesProvided: false,
      }, {
        attentionConstraintKey: 'attention.hormuz.restore',
        order: 2,
        eventType: 'restore',
        target: 'speaker',
        methods: [
          'focus_depth_expectation',
          'local_contrast_expectation',
        ],
        derivedSummary:
          'Restore the source speaker as the focal anchor.',
        exactFramesProvided: false,
      }],
      semanticScaleConstraints: [{
        scaleConstraintKey: 'scale.hormuz.map',
        componentKey: 'component.hormuz.map',
        mode: 'literal_physical',
        meaning: 'distance',
        factualGuard: 'literal_relationship_must_be_preserved',
        derivedSummary:
          'Preserve the literal geographic relationship rather than editorially distorting the map.',
      }],
      soundConstraints: [{
        soundConstraintKey: 'sound.hormuz.handoff',
        order: 0,
        linkedComponentKey: 'component.hormuz.map',
        purpose: 'attention_handoff',
        priority: 'ambient',
        narrationProtection: 'strict',
        duckingExpectation: 'downstream_soundsync_required',
        derivedSummary:
          'Request only a restrained attention cue under strict narration protection.',
        exactCuePlacementProvided: false,
        exactMixProvided: false,
      }],
      regionSafety: downstreamRegionSafety(),
      fallbackLadder: [
        'full_living_frame',
        'simplified_depth_composition',
        'safe_space_overlay',
        'side_by_side',
        'static_card',
        'no_extra_visual',
      ],
      continuityExpectationKinds: [
        'style_bible',
        'character_identity_sheet',
        'object_identity_sheet',
        'environment_identity_sheet',
        'scene_design_sheet',
        'motion_language_sheet',
        'sound_language_sheet',
        'alpha_edge_rules',
        'continuity_ledger',
      ],
      qaExpectationCodes: [
        'one_focal_primary_expected',
        'caption_safe_region_expected',
        'face_safe_region_expected',
        'gesture_safe_region_expected',
        'continuity_comparison_required',
        'alpha_multi_background_qa_required',
        'temporal_mask_stability_required',
        'semantic_timing_binding_required',
        'attention_restoration_required',
        'semantic_scale_truth_required',
        'narration_protection_required',
        'documentary_integrity_required',
        'exact_geography_verification_required',
      ],
    },
  })
}

function emotionalNonUseResult():
LivingFrameSemanticSceneProposalResult {
  return {
    schemaVersion: 'living-frame-semantic-scene-proposal-result-v1',
    resultClass: 'living_frame_semantic_scene_proposal_content_only',
    overallDecision: 'deliberate_non_use',
    decisions: [{
      semanticDecisionKey: 'decision.emotional.non_use',
      order: 0,
      decisionKind: 'deliberate_non_use',
      reasonCode: 'emotional_face_priority',
      derivedSummary:
        'Keep the emotionally important source face as the sole focal priority.',
      evidenceCitations: [{
        evidenceRefId: 'evidence.emotional.visual',
      }],
      sceneProposalKeys: [],
    }],
    sceneProposals: [],
    ...falseResultAuthorities(),
  }
}

function candidateResult(input: {
  readonly decisionKey: string
  readonly decisionReason:
    LivingFrameSemanticSceneProposalResult['decisions'][number]['reasonCode']
  readonly decisionSummary: string
  readonly evidenceRefId: string
  readonly scene: LivingFrameSemanticSceneProposalResult[
    'sceneProposals'
  ][number]
}): LivingFrameSemanticSceneProposalResult {
  return {
    schemaVersion: 'living-frame-semantic-scene-proposal-result-v1',
    resultClass: 'living_frame_semantic_scene_proposal_content_only',
    overallDecision: 'candidates_proposed',
    decisions: [{
      semanticDecisionKey: input.decisionKey,
      order: 0,
      decisionKind: 'semantic_candidate',
      reasonCode: input.decisionReason,
      derivedSummary: input.decisionSummary,
      evidenceCitations: [{ evidenceRefId: input.evidenceRefId }],
      sceneProposalKeys: [input.scene.sceneProposalKey],
    }],
    sceneProposals: [input.scene],
    ...falseResultAuthorities(),
  }
}

function falseResultAuthorities() {
  return {
    selectedSceneAuthority: false,
    exactFrameAuthority: false,
    exactSoundCueAuthority: false,
    estimateAuthority: false,
    approvalAuthority: false,
    providerOrToolSelectionAuthority: false,
    workOrRuntimeAuthority: false,
  } as const
}

function downstreamRegionSafety() {
  return {
    captions: 'requires_downstream_verification',
    face: 'requires_downstream_verification',
    gestures: 'requires_downstream_verification',
  } as const
}

function createAdversarial(
  fixtureId: string,
  operation: 'create' | 'validate',
  expectedIssueCode: LivingFrameSemanticSceneProposalIssueCode,
  base: unknown,
  mutate: (root: Record<string, unknown>) => void,
): LivingFrameSemanticSceneProposalAdversarialFixture {
  const payload = cloneJson(base)
  const root = objectField(payload)
  mutate(root)
  return { fixtureId, operation, expectedIssueCode, payload }
}

function firstScene(root: Record<string, unknown>): Record<string, unknown> {
  return objectField(
    arrayField(objectField(root, 'result'), 'sceneProposals')[0],
  )
}

function objectField(
  value: unknown,
  key?: string,
): Record<string, unknown> {
  const target = key === undefined
    ? value
    : (value as Record<string, unknown>)[key]
  if (!target || typeof target !== 'object' || Array.isArray(target)) {
    throw new TypeError('Expected controlled fixture object.')
  }
  return target as Record<string, unknown>
}

function arrayField(
  value: Record<string, unknown>,
  key: string,
): unknown[] {
  const target = value[key]
  if (!Array.isArray(target)) {
    throw new TypeError('Expected controlled fixture array.')
  }
  return target
}

function cloneJson<T>(value: T): DeepMutable<T> {
  return JSON.parse(JSON.stringify(value)) as DeepMutable<T>
}

type DeepMutable<T> =
  T extends readonly (infer Item)[]
    ? DeepMutable<Item>[]
    : T extends object
      ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
      : T

function digest(character: string): string {
  return character.repeat(64)
}
