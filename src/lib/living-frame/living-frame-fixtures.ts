import type {
  LivingFrameAttentionEvent,
  LivingFrameCapabilityRequirement,
  LivingFrameClosedGateCode,
  LivingFrameComponentPlan,
  LivingFrameContinuityPackRef,
  LivingFrameEstimateInputs,
  LivingFrameExpectationRef,
  LivingFrameInputBindings,
  LivingFrameProfessionalSkillComponent,
  LivingFrameProfessionalSkillComponentDraft,
  LivingFrameQaCode,
  LivingFrameScenePlan,
  LivingFrameSemanticTimingRequest,
  LivingFrameSkillActivation,
} from '../../types/living-frame'
import {
  LIVING_FRAME_CONTRACT_SOURCE,
  LIVING_FRAME_CONTRACT_VERSION,
  LIVING_FRAME_RUNTIME_READINESS,
} from '../../types/living-frame'
import {
  createLivingFrameProfessionalSkillComponent,
  deriveLivingFrameEstimateInputs,
  LIVING_FRAME_PLANNING_ONLY_AUTHORITY_BOUNDARY,
} from './living-frame-contract'

const REQUIRED_CLOSED_GATES: readonly LivingFrameClosedGateCode[] = [
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

const BASE_QA_EXPECTATIONS: readonly LivingFrameQaCode[] = [
  'narrative_relevance_expected',
  'one_focal_primary_expected',
  'visual_density_restraint_expected',
  'caption_safe_region_expected',
  'face_safe_region_expected',
  'gesture_safe_region_expected',
  'semantic_timing_binding_required',
  'narration_protection_required',
  'generated_video_restraint_required',
]

export interface LivingFrameFixtureSet {
  readonly musashiDecisiveStrike: LivingFrameProfessionalSkillComponent
  readonly helicopterSelectiveMotion: LivingFrameProfessionalSkillComponent
  readonly hormuzLivingARoll: LivingFrameProfessionalSkillComponent
  readonly emotionalMonologueNonUse: LivingFrameProfessionalSkillComponent
}

export interface LivingFrameAdversarialFixture {
  readonly fixtureId: string
  readonly expectedIssueCode:
    | 'schema_rejected'
    | 'forbidden_key'
    | 'unsafe_text'
    | 'duplicate_id'
    | 'duplicate_order'
    | 'cyclic_dependency'
    | 'collision_unresolved'
    | 'identity_safety_gate_missing'
    | 'factual_distortion'
    | 'alpha_expectation_invalid'
    | 'semantic_order_invalid'
    | 'fallback_order_invalid'
  readonly payload: unknown
}

export function createLivingFrameFixtureDrafts(): {
  readonly musashiDecisiveStrike: LivingFrameProfessionalSkillComponentDraft
  readonly helicopterSelectiveMotion: LivingFrameProfessionalSkillComponentDraft
  readonly hormuzLivingARoll: LivingFrameProfessionalSkillComponentDraft
  readonly emotionalMonologueNonUse: LivingFrameProfessionalSkillComponentDraft
} {
  return {
    musashiDecisiveStrike: createMusashiDraft(),
    helicopterSelectiveMotion: createHelicopterDraft(),
    hormuzLivingARoll: createHormuzDraft(),
    emotionalMonologueNonUse: createEmotionalNonUseDraft(),
  }
}

export async function createLivingFrameContractFixtures(): Promise<LivingFrameFixtureSet> {
  const drafts = createLivingFrameFixtureDrafts()
  const [
    musashiDecisiveStrike,
    helicopterSelectiveMotion,
    hormuzLivingARoll,
    emotionalMonologueNonUse,
  ] = await Promise.all([
    createLivingFrameProfessionalSkillComponent(drafts.musashiDecisiveStrike),
    createLivingFrameProfessionalSkillComponent(drafts.helicopterSelectiveMotion),
    createLivingFrameProfessionalSkillComponent(drafts.hormuzLivingARoll),
    createLivingFrameProfessionalSkillComponent(drafts.emotionalMonologueNonUse),
  ])
  return {
    musashiDecisiveStrike,
    helicopterSelectiveMotion,
    hormuzLivingARoll,
    emotionalMonologueNonUse,
  }
}

export function createLivingFrameAdversarialFixtures(
  drafts = createLivingFrameFixtureDrafts(),
): readonly LivingFrameAdversarialFixture[] {
  return [
    adversarial('unconfirmed_frame', 'schema_rejected', drafts.hormuzLivingARoll, (root) => {
      objectField(objectField(root, 'inputBindings'), 'outputFrame').confirmationStatus =
        'confirmation_required'
    }),
    adversarial('stale_timing', 'schema_rejected', drafts.hormuzLivingARoll, (root) => {
      objectField(objectField(root, 'inputBindings'), 'masterTiming').bindingStatus =
        'expected_stale'
    }),
    adversarial('duplicate_component', 'duplicate_id', drafts.musashiDecisiveStrike, (root) => {
      const components = firstSceneComponents(root)
      components.push(cloneJson(components[0]))
      objectField(components.at(-1)).order = components.length - 1
    }),
    adversarial('duplicate_component_order', 'duplicate_order', drafts.musashiDecisiveStrike, (root) => {
      const components = firstSceneComponents(root)
      objectField(components[1]).order = objectField(components[0]).order
    }),
    adversarial('cyclic_component_graph', 'cyclic_dependency', drafts.musashiDecisiveStrike, (root) => {
      const dependencies = arrayField(firstScene(root), 'componentDependencies')
      dependencies.push({
        componentId: 'musashi.background',
        dependsOnComponentId: 'musashi.ink-trail',
        kind: 'depends_on',
      })
    }),
    adversarial('caption_face_gesture_collision', 'collision_unresolved', drafts.hormuzLivingARoll, (root) => {
      objectField(firstScene(root), 'regionSafety').face = 'blocked_collision'
    }),
    adversarial('identity_without_governance', 'identity_safety_gate_missing', drafts.musashiDecisiveStrike, (root) => {
      const component = objectField(firstSceneComponents(root)[1])
      arrayField(component, 'capabilityKeys').push('identity_conditioned_illustration')
      arrayField(root, 'capabilityRequirements').push({
        capabilityKey: 'identity_conditioned_illustration',
        role: 'supporting',
        linkedSceneIds: ['scene.musashi-strike'],
        qualificationStatus: 'abstract_capability_expectation_only',
      })
    }),
    adversarial('exact_map_editorial_distortion', 'factual_distortion', drafts.hormuzLivingARoll, (root) => {
      const scaleRequests = arrayField(firstScene(root), 'semanticScaleRequests')
      objectField(scaleRequests[0]).mode = 'editorial_symbolic'
      objectField(scaleRequests[0]).factualGuard = 'symbolic_treatment_must_be_disclosed'
    }),
    adversarial('invalid_alpha_claim', 'alpha_expectation_invalid', drafts.musashiDecisiveStrike, (root) => {
      const component = objectField(firstSceneComponents(root)[1])
      component.alphaSourceExpectation = 'opaque_plate'
      component.alphaQaExpectation = 'not_applicable'
    }),
    adversarial('checkerboard_as_alpha', 'schema_rejected', drafts.musashiDecisiveStrike, (root) => {
      objectField(firstSceneComponents(root)[1]).alphaSourceExpectation =
        'checkerboard_pattern'
    }),
    adversarial('raw_instruction_leakage', 'forbidden_key', drafts.musashiDecisiveStrike, (root) => {
      root.rawTranscript = 'sensitive transcript fixture'
    }),
    adversarial('secret_payload_injection', 'forbidden_key', drafts.musashiDecisiveStrike, (root) => {
      root.apiKey = 'controlled-sensitive-value'
    }),
    adversarial('secret_like_summary', 'unsafe_text', drafts.musashiDecisiveStrike, (root) => {
      objectField(root, 'decisionSummary').summary =
        'api_key=controlled-sensitive-value'
    }),
    adversarial('executable_payload', 'forbidden_key', drafts.musashiDecisiveStrike, (root) => {
      root.command = 'execute an unapproved process'
    }),
    adversarial('provider_route_injection', 'forbidden_key', drafts.musashiDecisiveStrike, (root) => {
      root.providerId = 'caller-selected-provider'
    }),
    adversarial('work_queue_injection', 'forbidden_key', drafts.musashiDecisiveStrike, (root) => {
      root.workItem = { jobId: 'caller-job', queueId: 'caller-queue' }
    }),
    adversarial('approval_cost_injection', 'forbidden_key', drafts.musashiDecisiveStrike, (root) => {
      root.approvalId = 'forged-approval'
      root.credits = 1
    }),
    adversarial('exact_sound_mix_injection', 'forbidden_key', drafts.musashiDecisiveStrike, (root) => {
      objectField(arrayField(firstScene(root), 'soundRequests')[0]).gainDb = -4
    }),
    adversarial('fallback_order_conflict', 'fallback_order_invalid', drafts.hormuzLivingARoll, (root) => {
      const fallback = arrayField(firstScene(root), 'fallbackLadder')
      ;[fallback[0], fallback[1]] = [fallback[1], fallback[0]]
    }),
    adversarial('attention_sequence_conflict', 'semantic_order_invalid', drafts.hormuzLivingARoll, (root) => {
      const attentionSequence = arrayField(firstScene(root), 'attentionSequence')
      const handoffOrder = objectField(attentionSequence[1]).order
      objectField(attentionSequence[1]).order = objectField(attentionSequence[2]).order
      objectField(attentionSequence[2]).order = handoffOrder
    }),
    adversarial('forged_all_green_packet', 'schema_rejected', drafts.hormuzLivingARoll, (root) => {
      root.status = 'production_ready'
      const authority = objectField(root, 'authorityBoundary')
      authority.executable = true
      authority.runtimeAuthority = true
      authority.approvalAuthority = true
      authority.providerAuthority = true
      authority.toolRouteAuthority = true
      authority.queueAuthority = true
      authority.costAuthority = true
      objectField(objectField(root, 'inputBindings'), 'videoUnderstanding').evidenceClass =
        'future_worker_verified_evidence'
      root.qaResults = { allGreen: true, verified: true, live: true }
    }),
  ]
}

function createMusashiDraft(): LivingFrameProfessionalSkillComponentDraft {
  const sceneId = 'scene.musashi-strike'
  const timing = createTimingRequests('musashi')
  const continuityPackRefs: readonly LivingFrameContinuityPackRef[] = [
    continuity('continuity.musashi-style', 'style_bible', '1'),
    continuity('continuity.musashi-character', 'character_identity_sheet', '2'),
    continuity('continuity.musashi-scene', 'scene_design_sheet', '3'),
    continuity('continuity.musashi-motion', 'motion_language_sheet', '4'),
    continuity('continuity.musashi-sound', 'sound_language_sheet', '5'),
    continuity('continuity.musashi-alpha', 'alpha_edge_rules', '6'),
  ]
  const components: readonly LivingFrameComponentPlan[] = [
    opaqueComponent({
      componentId: 'musashi.background',
      order: 0,
      role: 'opaque_background_plate',
      focalRole: 'static_anchor',
      summary: 'A restrained illustrated dueling ground anchors the composition.',
      provenanceExpectation: 'generated_illustration_expectation',
      capabilityKeys: ['still_image_generation_or_edit'],
      continuityRefIds: ['continuity.musashi-style', 'continuity.musashi-scene'],
    }),
    stillAlphaComponent({
      componentId: 'musashi.body',
      order: 1,
      role: 'primary_subject',
      focalRole: 'primary',
      summary: 'The approved canonical illustrative interpretation of Musashi holds the main pose.',
      parentComponentId: null,
      anchorComponentId: 'musashi.background',
      depthBand: 'subject_plane',
      provenanceExpectation: 'generated_illustration_expectation',
      capabilityKeys: [
        'still_image_generation_or_edit',
        'reference_conditioned_illustration',
        'structure_conditioned_illustration',
        'foreground_component_extraction',
        'alpha_edge_refinement',
      ],
      continuityRefIds: [
        'continuity.musashi-style',
        'continuity.musashi-character',
        'continuity.musashi-alpha',
      ],
    }),
    stillAlphaComponent({
      componentId: 'musashi.sword',
      order: 2,
      role: 'mechanical_component',
      focalRole: 'secondary',
      summary: 'The sword separates at the hand pivot for one decisive controlled strike.',
      parentComponentId: 'musashi.body',
      anchorComponentId: 'musashi.body',
      depthBand: 'in_front_of_subject',
      provenanceExpectation: 'generated_illustration_expectation',
      capabilityKeys: ['foreground_component_extraction', 'alpha_edge_refinement'],
      continuityRefIds: [
        'continuity.musashi-character',
        'continuity.musashi-motion',
        'continuity.musashi-alpha',
      ],
    }),
    stillAlphaComponent({
      componentId: 'musashi.opponent',
      order: 3,
      role: 'primary_subject',
      focalRole: 'secondary',
      summary: 'The opponent remains still until the planned delayed reaction.',
      parentComponentId: null,
      anchorComponentId: 'musashi.background',
      depthBand: 'subject_plane',
      provenanceExpectation: 'generated_illustration_expectation',
      capabilityKeys: [
        'still_image_generation_or_edit',
        'foreground_component_extraction',
        'alpha_edge_refinement',
      ],
      continuityRefIds: [
        'continuity.musashi-style',
        'continuity.musashi-scene',
        'continuity.musashi-alpha',
      ],
    }),
    proceduralComponent({
      componentId: 'musashi.ink-trail',
      order: 4,
      role: 'editorial_graphic',
      focalRole: 'secondary',
      summary: 'A transparent ink stroke reveals the direction and speed of the strike.',
      parentComponentId: null,
      anchorComponentId: 'musashi.sword',
      depthBand: 'foreground',
      capabilityKeys: ['deterministic_vector_drawing'],
      continuityRefIds: ['continuity.musashi-style', 'continuity.musashi-motion'],
    }),
    proceduralComponent({
      componentId: 'musashi.dust',
      order: 5,
      role: 'environmental_effect',
      focalRole: 'ambient',
      summary: 'Sparse dust follows the strike and settles after the delayed reaction.',
      parentComponentId: null,
      anchorComponentId: 'musashi.background',
      depthBand: 'foreground',
      capabilityKeys: ['deterministic_particle_effects'],
      continuityRefIds: ['continuity.musashi-motion'],
    }),
  ]
  const scene: LivingFrameScenePlan = {
    sceneId,
    order: 0,
    segmentExpectationId: 'segment.musashi-strike',
    mode: 'living_still',
    decision: 'use_full',
    sourceTruthMode: 'canonical_illustrative_interpretation',
    narrativePurposeCode: 'demonstrate_decisive_action',
    visualVerb: 'separate',
    importance: 'hero',
    summary: 'A held illustrated confrontation resolves through limited, precisely staged motion.',
    focalPrimaryComponentId: 'musashi.body',
    components,
    componentDependencies: [
      dependency('musashi.sword', 'musashi.body', 'anchored_to'),
      dependency('musashi.ink-trail', 'musashi.sword', 'depends_on'),
      dependency('musashi.dust', 'musashi.background', 'anchored_to'),
    ],
    skillActivations: [
      activation(
        'activation.musashi-illustration',
        0,
        'animation_aware_illustration',
        ['musashi.body', 'musashi.sword', 'musashi.opponent'],
        [timing[0].timingRequestId],
        [],
      ),
      activation(
        'activation.musashi-decomposition',
        1,
        'component_decomposition',
        ['musashi.body', 'musashi.sword', 'musashi.opponent'],
        [timing[1].timingRequestId],
        ['activation.musashi-illustration'],
      ),
      activation(
        'activation.musashi-rigging',
        2,
        'component_rigging',
        ['musashi.body', 'musashi.sword', 'musashi.opponent'],
        [timing[1].timingRequestId],
        ['activation.musashi-decomposition'],
      ),
      activation(
        'activation.musashi-strike',
        3,
        'mechanical_part_motion',
        ['musashi.sword'],
        [timing[2].timingRequestId],
        ['activation.musashi-rigging'],
      ),
      activation(
        'activation.musashi-secondary-motion',
        4,
        'deformation_motion',
        ['musashi.body', 'musashi.opponent'],
        [timing[2].timingRequestId, timing[3].timingRequestId],
        ['activation.musashi-strike'],
      ),
      activation(
        'activation.musashi-camera',
        5,
        'camera_choreography',
        ['musashi.body'],
        [timing[0].timingRequestId, timing[3].timingRequestId],
        [],
      ),
      activation(
        'activation.musashi-sound',
        6,
        'sound_choreography',
        ['musashi.sword', 'musashi.dust'],
        [timing[2].timingRequestId],
        ['activation.musashi-strike'],
      ),
      activation(
        'activation.musashi-restraint',
        7,
        'living_frame_restraint_qa',
        ['musashi.body'],
        [timing[4].timingRequestId],
        [],
      ),
    ],
    semanticTimingRequests: timing,
    attentionSequence: [
      attention('attention.musashi-prepare', 0, 'prepare', 'environment'),
      attention('attention.musashi-hold', 1, 'hold', 'visual'),
      attention('attention.musashi-restore', 2, 'restore', 'shared'),
    ],
    semanticScaleRequests: [{
      semanticScaleRequestId: 'scale.musashi-approach',
      componentId: 'musashi.body',
      mode: 'perspective',
      meaning: 'importance',
      factualGuard: 'perspective_only',
      summary: 'A restrained camera approach increases presence without implying literal size.',
    }],
    soundRequests: [
      sound('sound.musashi-cloth', 0, 'musashi.body', 'movement_support', 'ambient'),
      sound('sound.musashi-blade', 1, 'musashi.sword', 'movement_support', 'primary_visual'),
      sound('sound.musashi-dust', 2, 'musashi.dust', 'environmental_presence', 'ambient'),
    ],
    regionSafety: safeRegions(),
    fallbackLadder: [
      'full_living_frame',
      'full_illustrated_scene',
      'static_card',
      'captions_only',
      'no_extra_visual',
    ],
    continuityRefIds: continuityPackRefs.map((reference) => reference.continuityRefId),
    qaExpectationCodes: [
      ...BASE_QA_EXPECTATIONS,
      'continuity_comparison_required',
      'component_separability_required',
      'alpha_multi_background_qa_required',
      'pivot_physics_qa_required',
      'documentary_integrity_required',
    ],
    closedGateCodes: REQUIRED_CLOSED_GATES,
  }
  return selectedDraft({
    selectedMode: 'living_still',
    reasonCode: 'selective_motion_improves_comprehension',
    summary: 'Limited illustration motion communicates the decisive strike without generated video.',
    rejectedConcepts: [
      {
        conceptId: 'concept.musashi-generated-video',
        reasonCode: 'simpler_treatment_preferred',
        reasonSummary: 'A reusable component scene offers more timing and continuity control.',
      },
    ],
    inputBindings: inputBindings('musashi', ['segment.musashi-strike'], false),
    scenePlans: [scene],
    continuityPackRefs,
    motionComplexity: 'high',
    cameraComplexity: 'medium',
    controlledIllustrationComplexity: 'high',
  })
}

function createHelicopterDraft(): LivingFrameProfessionalSkillComponentDraft {
  const sceneId = 'scene.helicopter-motion'
  const timing = createTimingRequests('helicopter')
  const continuityPackRefs: readonly LivingFrameContinuityPackRef[] = [
    continuity('continuity.helicopter-style', 'style_bible', 'a'),
    continuity('continuity.helicopter-object', 'object_identity_sheet', 'b'),
    continuity('continuity.helicopter-environment', 'environment_identity_sheet', 'c'),
    continuity('continuity.helicopter-motion', 'motion_language_sheet', 'd'),
    continuity('continuity.helicopter-sound', 'sound_language_sheet', 'e'),
    continuity('continuity.helicopter-alpha', 'alpha_edge_rules', 'f'),
  ]
  const components: readonly LivingFrameComponentPlan[] = [
    opaqueComponent({
      componentId: 'helicopter.background',
      order: 0,
      role: 'opaque_background_plate',
      focalRole: 'static_anchor',
      summary: 'A controlled terrain plate supports shallow multiplane camera motion.',
      provenanceExpectation: 'approved_source_asset_expectation',
      capabilityKeys: ['image_upscale_or_prepare'],
      continuityRefIds: [
        'continuity.helicopter-style',
        'continuity.helicopter-environment',
      ],
    }),
    stillAlphaComponent({
      componentId: 'helicopter.body',
      order: 1,
      role: 'primary_subject',
      focalRole: 'primary',
      summary: 'The helicopter body remains visually stable with restrained vibration.',
      parentComponentId: null,
      anchorComponentId: 'helicopter.background',
      depthBand: 'subject_plane',
      provenanceExpectation: 'approved_source_asset_expectation',
      capabilityKeys: [
        'foreground_component_extraction',
        'alpha_edge_refinement',
        'image_upscale_or_prepare',
      ],
      continuityRefIds: [
        'continuity.helicopter-object',
        'continuity.helicopter-alpha',
      ],
    }),
    stillAlphaComponent({
      componentId: 'helicopter.main-rotor',
      order: 2,
      role: 'mechanical_component',
      focalRole: 'secondary',
      summary: 'The main rotor rotates around its approved pivot with expected motion blur.',
      parentComponentId: 'helicopter.body',
      anchorComponentId: 'helicopter.body',
      depthBand: 'in_front_of_subject',
      provenanceExpectation: 'approved_source_asset_expectation',
      capabilityKeys: ['foreground_component_extraction', 'alpha_edge_refinement'],
      continuityRefIds: [
        'continuity.helicopter-object',
        'continuity.helicopter-motion',
        'continuity.helicopter-alpha',
      ],
    }),
    stillAlphaComponent({
      componentId: 'helicopter.tail-rotor',
      order: 3,
      role: 'mechanical_component',
      focalRole: 'secondary',
      summary: 'The tail rotor uses a separate pivot and subordinate motion treatment.',
      parentComponentId: 'helicopter.body',
      anchorComponentId: 'helicopter.body',
      depthBand: 'subject_plane',
      provenanceExpectation: 'approved_source_asset_expectation',
      capabilityKeys: ['foreground_component_extraction', 'alpha_edge_refinement'],
      continuityRefIds: [
        'continuity.helicopter-object',
        'continuity.helicopter-motion',
        'continuity.helicopter-alpha',
      ],
    }),
    proceduralComponent({
      componentId: 'helicopter.downwash',
      order: 4,
      role: 'environmental_effect',
      focalRole: 'secondary',
      summary: 'Procedural dust responds to rotor downwash without an obvious loop.',
      parentComponentId: null,
      anchorComponentId: 'helicopter.body',
      depthBand: 'foreground',
      capabilityKeys: ['deterministic_particle_effects'],
      continuityRefIds: [
        'continuity.helicopter-environment',
        'continuity.helicopter-motion',
      ],
    }),
  ]
  const scene: LivingFrameScenePlan = {
    sceneId,
    order: 0,
    segmentExpectationId: 'segment.helicopter-motion',
    mode: 'living_still',
    decision: 'use_full',
    sourceTruthMode: 'controlled_source_expectation',
    narrativePurposeCode: 'explain_mechanical_operation',
    visualVerb: 'rotate',
    importance: 'important',
    summary: 'A still helicopter becomes operational through selective mechanical and environmental motion.',
    focalPrimaryComponentId: 'helicopter.body',
    components,
    componentDependencies: [
      dependency('helicopter.main-rotor', 'helicopter.body', 'anchored_to'),
      dependency('helicopter.tail-rotor', 'helicopter.body', 'anchored_to'),
      dependency('helicopter.downwash', 'helicopter.main-rotor', 'depends_on'),
    ],
    skillActivations: [
      activation(
        'activation.helicopter-decomposition',
        0,
        'component_decomposition',
        ['helicopter.body', 'helicopter.main-rotor', 'helicopter.tail-rotor'],
        [timing[0].timingRequestId],
        [],
      ),
      activation(
        'activation.helicopter-rigging',
        1,
        'component_rigging',
        ['helicopter.body', 'helicopter.main-rotor', 'helicopter.tail-rotor'],
        [timing[1].timingRequestId],
        ['activation.helicopter-decomposition'],
      ),
      activation(
        'activation.helicopter-mechanical',
        2,
        'mechanical_part_motion',
        ['helicopter.main-rotor', 'helicopter.tail-rotor'],
        [timing[2].timingRequestId],
        ['activation.helicopter-rigging'],
      ),
      activation(
        'activation.helicopter-environment',
        3,
        'environmental_motion',
        ['helicopter.downwash'],
        [timing[2].timingRequestId, timing[3].timingRequestId],
        ['activation.helicopter-mechanical'],
      ),
      activation(
        'activation.helicopter-camera',
        4,
        'camera_choreography',
        ['helicopter.body'],
        [timing[0].timingRequestId, timing[4].timingRequestId],
        [],
      ),
      activation(
        'activation.helicopter-sound',
        5,
        'sound_choreography',
        ['helicopter.main-rotor', 'helicopter.downwash'],
        [timing[2].timingRequestId],
        ['activation.helicopter-mechanical'],
      ),
    ],
    semanticTimingRequests: timing,
    attentionSequence: [
      attention('attention.helicopter-prepare', 0, 'prepare', 'environment'),
      attention('attention.helicopter-hold', 1, 'hold', 'visual'),
      attention('attention.helicopter-restore', 2, 'restore', 'shared'),
    ],
    semanticScaleRequests: [{
      semanticScaleRequestId: 'scale.helicopter-approach',
      componentId: 'helicopter.body',
      mode: 'perspective',
      meaning: 'distance',
      factualGuard: 'perspective_only',
      summary: 'Perspective scale suggests a controlled approach without changing physical proportions.',
    }],
    soundRequests: [
      sound(
        'sound.helicopter-rotor',
        0,
        'helicopter.main-rotor',
        'mechanical_presence',
        'supporting',
      ),
      sound(
        'sound.helicopter-downwash',
        1,
        'helicopter.downwash',
        'environmental_presence',
        'ambient',
      ),
    ],
    regionSafety: safeRegions(),
    fallbackLadder: [
      'full_living_frame',
      'full_illustrated_scene',
      'static_card',
      'captions_only',
      'no_extra_visual',
    ],
    continuityRefIds: continuityPackRefs.map((reference) => reference.continuityRefId),
    qaExpectationCodes: [
      ...BASE_QA_EXPECTATIONS,
      'continuity_comparison_required',
      'component_separability_required',
      'alpha_multi_background_qa_required',
      'pivot_physics_qa_required',
    ],
    closedGateCodes: REQUIRED_CLOSED_GATES,
  }
  return selectedDraft({
    selectedMode: 'living_still',
    reasonCode: 'selective_motion_improves_comprehension',
    summary: 'Mechanical motion and downwash make the still asset legible and cinematic.',
    rejectedConcepts: [{
      conceptId: 'concept.helicopter-generated-video',
      reasonCode: 'simpler_treatment_preferred',
      reasonSummary: 'Deterministic pivots and particles provide stronger control and reuse.',
    }],
    inputBindings: inputBindings('helicopter', ['segment.helicopter-motion'], false),
    scenePlans: [scene],
    continuityPackRefs,
    motionComplexity: 'medium',
    cameraComplexity: 'low',
    controlledIllustrationComplexity: 'low',
  })
}

function createHormuzDraft(): LivingFrameProfessionalSkillComponentDraft {
  const sceneId = 'scene.hormuz-a-roll'
  const timing = createTimingRequests('hormuz')
  const continuityPackRefs: readonly LivingFrameContinuityPackRef[] = [
    continuity('continuity.hormuz-style', 'style_bible', '7'),
    continuity('continuity.hormuz-scene', 'scene_design_sheet', '8'),
    continuity('continuity.hormuz-motion', 'motion_language_sheet', '9'),
    continuity('continuity.hormuz-sound', 'sound_language_sheet', '0'),
    continuity('continuity.hormuz-alpha', 'alpha_edge_rules', '1'),
  ]
  const components: readonly LivingFrameComponentPlan[] = [
    opaqueComponent({
      componentId: 'hormuz.a-roll',
      order: 0,
      role: 'source_a_roll',
      focalRole: 'static_anchor',
      summary: 'The speaker remains the physical storytelling environment.',
      provenanceExpectation: 'source_a_roll_expectation',
      capabilityKeys: ['visual_semantic_qa'],
      continuityRefIds: ['continuity.hormuz-scene'],
    }),
    proceduralComponent({
      componentId: 'hormuz.map',
      order: 1,
      role: 'exact_map_component',
      focalRole: 'primary',
      summary: 'Exact coastline and strait geometry are requested beside the speaker.',
      parentComponentId: null,
      anchorComponentId: 'hormuz.a-roll',
      depthBand: 'behind_subject',
      capabilityKeys: ['exact_map_rendering', 'deterministic_vector_drawing'],
      continuityRefIds: ['continuity.hormuz-style', 'continuity.hormuz-scene'],
      provenanceExpectation: 'exact_map_data_expectation',
    }),
    proceduralComponent({
      componentId: 'hormuz.routes',
      order: 2,
      role: 'editorial_graphic',
      focalRole: 'secondary',
      summary: 'Shipping routes converge through the exact geographic chokepoint.',
      parentComponentId: null,
      anchorComponentId: 'hormuz.map',
      depthBand: 'behind_subject',
      capabilityKeys: ['deterministic_vector_drawing', 'exact_data_graphics'],
      continuityRefIds: ['continuity.hormuz-style', 'continuity.hormuz-motion'],
    }),
    stillAlphaComponent({
      componentId: 'hormuz.tankers',
      order: 3,
      role: 'editorial_graphic',
      focalRole: 'secondary',
      summary: 'Isolated tanker silhouettes travel along the controlled route geometry.',
      parentComponentId: null,
      anchorComponentId: 'hormuz.routes',
      depthBand: 'behind_subject',
      provenanceExpectation: 'deterministic_draw_expectation',
      capabilityKeys: [
        'deterministic_vector_drawing',
        'foreground_component_extraction',
        'alpha_edge_refinement',
      ],
      continuityRefIds: ['continuity.hormuz-style', 'continuity.hormuz-alpha'],
    }),
    temporalMaskComponent({
      componentId: 'hormuz.subject-mask',
      order: 4,
      role: 'foreground_occluder',
      focalRole: 'none',
      summary: 'A future verified temporal subject mask is required for behind-speaker depth.',
      parentComponentId: null,
      anchorComponentId: 'hormuz.a-roll',
      depthBand: 'subject_plane',
      capabilityKeys: ['temporal_subject_masking', 'alpha_edge_refinement'],
      continuityRefIds: ['continuity.hormuz-alpha'],
    }),
  ]
  const scene: LivingFrameScenePlan = {
    sceneId,
    order: 0,
    segmentExpectationId: 'segment.hormuz-explainer',
    mode: 'living_a_roll',
    decision: 'use_full',
    sourceTruthMode: 'exact_geography_verification_required',
    narrativePurposeCode: 'establish_geography',
    visualVerb: 'converge',
    importance: 'hero',
    summary: 'Exact geography, routes, and depth-aware compositing explain the chokepoint in A-roll.',
    focalPrimaryComponentId: 'hormuz.map',
    components,
    componentDependencies: [
      dependency('hormuz.map', 'hormuz.a-roll', 'anchored_to'),
      dependency('hormuz.routes', 'hormuz.map', 'depends_on'),
      dependency('hormuz.tankers', 'hormuz.routes', 'depends_on'),
      dependency('hormuz.subject-mask', 'hormuz.a-roll', 'depends_on'),
    ],
    skillActivations: [
      activation(
        'activation.hormuz-map',
        0,
        'editorial_motion',
        ['hormuz.map', 'hormuz.routes'],
        [timing[0].timingRequestId, timing[1].timingRequestId],
        [],
      ),
      activation(
        'activation.hormuz-orbit',
        1,
        'visual_orbit',
        ['hormuz.tankers', 'hormuz.subject-mask'],
        [timing[2].timingRequestId],
        ['activation.hormuz-map'],
      ),
      activation(
        'activation.hormuz-focus',
        2,
        'focus_handoff',
        ['hormuz.map'],
        [timing[1].timingRequestId, timing[2].timingRequestId],
        ['activation.hormuz-map'],
      ),
      activation(
        'activation.hormuz-scale',
        3,
        'semantic_scale',
        ['hormuz.routes', 'hormuz.tankers'],
        [timing[2].timingRequestId],
        ['activation.hormuz-map'],
      ),
      activation(
        'activation.hormuz-sound',
        4,
        'sound_choreography',
        ['hormuz.routes', 'hormuz.tankers'],
        [timing[2].timingRequestId],
        [],
      ),
      activation(
        'activation.hormuz-restore',
        5,
        'attention_restoration',
        ['hormuz.a-roll'],
        [timing[4].timingRequestId],
        ['activation.hormuz-focus'],
      ),
      activation(
        'activation.hormuz-alpha-qa',
        6,
        'alpha_edge_qa',
        ['hormuz.subject-mask', 'hormuz.tankers'],
        [timing[4].timingRequestId],
        [],
      ),
    ],
    semanticTimingRequests: timing,
    attentionSequence: [
      attention('attention.hormuz-prepare', 0, 'prepare', 'speaker'),
      attention('attention.hormuz-handoff', 1, 'handoff', 'visual'),
      attention('attention.hormuz-hold', 2, 'hold', 'visual'),
      attention('attention.hormuz-restore', 3, 'restore', 'speaker'),
    ],
    semanticScaleRequests: [{
      semanticScaleRequestId: 'scale.hormuz-map-truth',
      componentId: 'hormuz.map',
      mode: 'literal_physical',
      meaning: 'distance',
      factualGuard: 'literal_relationship_must_be_preserved',
      summary: 'Geographic scale remains literal while emphasis uses labels and motion.',
    }],
    soundRequests: [
      sound('sound.hormuz-route', 0, 'hormuz.routes', 'movement_support', 'ambient'),
      sound('sound.hormuz-handoff', 1, 'hormuz.map', 'attention_handoff', 'supporting'),
    ],
    regionSafety: safeRegions(),
    fallbackLadder: [
      'full_living_frame',
      'simplified_depth_composition',
      'safe_space_overlay',
      'lower_visual_stage',
      'side_by_side',
      'full_illustrated_scene',
      'static_card',
      'captions_only',
      'no_extra_visual',
    ],
    continuityRefIds: continuityPackRefs.map((reference) => reference.continuityRefId),
    qaExpectationCodes: [
      ...BASE_QA_EXPECTATIONS,
      'alpha_multi_background_qa_required',
      'temporal_mask_stability_required',
      'attention_restoration_required',
      'semantic_scale_truth_required',
      'documentary_integrity_required',
      'exact_geography_verification_required',
    ],
    closedGateCodes: [
      ...REQUIRED_CLOSED_GATES,
      'documentary_fact_verification_required',
      'temporal_mask_benchmark_required',
    ],
  }
  return selectedDraft({
    selectedMode: 'living_a_roll',
    reasonCode: 'explanation_benefits_from_in_frame_visualization',
    summary: 'The geography materializes around the speaker while exact map truth remains downstream-gated.',
    rejectedConcepts: [{
      conceptId: 'concept.hormuz-random-b-roll',
      reasonCode: 'exact_diagram_is_clearer_than_b_roll',
      reasonSummary: 'A controlled map and route model explains the relationship more clearly.',
    }],
    inputBindings: inputBindings('hormuz', ['segment.hormuz-explainer'], true),
    scenePlans: [scene],
    continuityPackRefs,
    motionComplexity: 'high',
    cameraComplexity: 'medium',
    controlledIllustrationComplexity: 'medium',
    extraClosedGates: [
      'documentary_fact_verification_required',
      'temporal_mask_benchmark_required',
    ],
  })
}

function createEmotionalNonUseDraft(): LivingFrameProfessionalSkillComponentDraft {
  const input = inputBindings('monologue', ['segment.emotional-monologue'], false)
  const zeroEstimate: LivingFrameEstimateInputs = {
    sceneCount: 0,
    componentCount: 0,
    generatedStillCount: 0,
    deterministicDrawCount: 0,
    stillAlphaCount: 0,
    temporalMaskCount: 0,
    semanticTimingRequestCount: 0,
    soundRequestCount: 0,
    qaExpectationCount: 0,
    continuityReferenceCount: 0,
    motionComplexity: 'none',
    cameraComplexity: 'none',
    controlledIllustrationComplexity: 'none',
    generatedVideoExpectation: 'not_required',
    pricingAuthorityProvided: false,
  }
  return {
    contractVersion: LIVING_FRAME_CONTRACT_VERSION,
    contractSource: LIVING_FRAME_CONTRACT_SOURCE,
    status: 'rejected',
    runtimeReadiness: LIVING_FRAME_RUNTIME_READINESS,
    authorityBoundary: LIVING_FRAME_PLANNING_ONLY_AUTHORITY_BOUNDARY,
    inputBindings: input,
    decisionSummary: {
      decision: 'non_use',
      reasonCode: 'emotional_face_priority',
      summary: 'The speaker remains visually primary because added motion would weaken the emotional delivery.',
      selectedMode: null,
      rejectedConcepts: [{
        conceptId: 'concept.monologue-living-frame',
        reasonCode: 'motion_would_distract',
        reasonSummary: 'Stillness is the correct professional treatment for this segment.',
      }],
    },
    scenePlans: [],
    continuityPackRefs: [],
    capabilityRequirements: [],
    estimateInputs: zeroEstimate,
    qaExpectationCodes: [],
    closedGateCodes: REQUIRED_CLOSED_GATES,
  }
}

interface SelectedDraftInput {
  readonly selectedMode: 'living_a_roll' | 'living_still' | 'living_archive' | 'living_diagram' | 'hybrid_expansion'
  readonly reasonCode:
    | 'explanation_benefits_from_in_frame_visualization'
    | 'selective_motion_improves_comprehension'
  readonly summary: string
  readonly rejectedConcepts: LivingFrameProfessionalSkillComponentDraft['decisionSummary']['rejectedConcepts']
  readonly inputBindings: LivingFrameInputBindings
  readonly scenePlans: readonly LivingFrameScenePlan[]
  readonly continuityPackRefs: readonly LivingFrameContinuityPackRef[]
  readonly motionComplexity: 'low' | 'medium' | 'high'
  readonly cameraComplexity: 'low' | 'medium' | 'high'
  readonly controlledIllustrationComplexity: 'low' | 'medium' | 'high'
  readonly extraClosedGates?: readonly LivingFrameClosedGateCode[]
}

function selectedDraft(input: SelectedDraftInput): LivingFrameProfessionalSkillComponentDraft {
  const qaExpectationCodes = [...BASE_QA_EXPECTATIONS]
  const closedGateCodes = [
    ...REQUIRED_CLOSED_GATES,
    ...(input.extraClosedGates ?? []),
  ]
  const capabilityRequirements = deriveCapabilityRequirements(input.scenePlans)
  const estimateInputs = deriveLivingFrameEstimateInputs({
    scenePlans: input.scenePlans,
    continuityReferenceCount: input.continuityPackRefs.length,
    topLevelQaExpectationCount: qaExpectationCodes.length,
    motionComplexity: input.motionComplexity,
    cameraComplexity: input.cameraComplexity,
    controlledIllustrationComplexity: input.controlledIllustrationComplexity,
    generatedVideoExpectation: 'not_required',
  })
  return {
    contractVersion: LIVING_FRAME_CONTRACT_VERSION,
    contractSource: LIVING_FRAME_CONTRACT_SOURCE,
    status: 'planning_only',
    runtimeReadiness: LIVING_FRAME_RUNTIME_READINESS,
    authorityBoundary: LIVING_FRAME_PLANNING_ONLY_AUTHORITY_BOUNDARY,
    inputBindings: input.inputBindings,
    decisionSummary: {
      decision: 'selected',
      reasonCode: input.reasonCode,
      summary: input.summary,
      selectedMode: input.selectedMode,
      rejectedConcepts: input.rejectedConcepts,
    },
    scenePlans: input.scenePlans,
    continuityPackRefs: input.continuityPackRefs,
    capabilityRequirements,
    estimateInputs,
    qaExpectationCodes,
    closedGateCodes,
  }
}

function deriveCapabilityRequirements(
  scenes: readonly LivingFrameScenePlan[],
): readonly LivingFrameCapabilityRequirement[] {
  const sceneIdsByCapability = new Map<string, Set<string>>()
  for (const scene of scenes) {
    for (const component of scene.components) {
      for (const capabilityKey of component.capabilityKeys) {
        const sceneIds = sceneIdsByCapability.get(capabilityKey) ?? new Set<string>()
        sceneIds.add(scene.sceneId)
        sceneIdsByCapability.set(capabilityKey, sceneIds)
      }
    }
  }
  return [...sceneIdsByCapability.entries()].map(([capabilityKey, sceneIds]) => ({
    capabilityKey: capabilityKey as LivingFrameCapabilityRequirement['capabilityKey'],
    role: capabilityKey === 'visual_semantic_qa' ? 'supporting' : 'required',
    linkedSceneIds: [...sceneIds],
    qualificationStatus: 'abstract_capability_expectation_only',
  }))
}

function inputBindings(
  prefix: string,
  segmentIds: readonly string[],
  includeFactSafety: boolean,
): LivingFrameInputBindings {
  const outputFrame = {
    ...expectation(`${prefix}.output-frame`, 'f', 'future_worker_evidence_required'),
    confirmationStatus: 'expected_confirmed',
    expectedWidth: 1920,
    expectedHeight: 1080,
    expectedAspectRatioNumerator: 16,
    expectedAspectRatioDenominator: 9,
    liveAuthorityVerified: false,
  } as const
  const masterTiming = {
    ...expectation(`${prefix}.master-timing`, 'e', 'future_worker_evidence_required'),
    bindingStatus: 'expected_current',
    exactFrameAuthorityProvided: false,
    liveAuthorityVerified: false,
  } as const
  return {
    compiledIntent: expectation(`${prefix}.compiled-intent`, '1'),
    sourceSequence: expectation(`${prefix}.source-sequence`, '2'),
    videoUnderstanding: expectation(
      `${prefix}.video-understanding`,
      '3',
      'mock_planning_evidence',
    ),
    adaptiveStrategy: expectation(`${prefix}.adaptive-strategy`, '4'),
    outputFrame,
    masterTiming,
    safeZoneRefs: [expectation(`${prefix}.safe-zones`, '5', 'future_worker_evidence_required')],
    faceProtectionRefs: [
      expectation(`${prefix}.face-protection`, '6', 'future_worker_evidence_required'),
    ],
    gestureProtectionRefs: [
      expectation(`${prefix}.gesture-protection`, '7', 'future_worker_evidence_required'),
    ],
    factSafetyRefs: includeFactSafety
      ? [expectation(`${prefix}.fact-safety`, '8', 'future_worker_evidence_required')]
      : [],
    characterSafetyRefs: [
      expectation(`${prefix}.character-safety`, '9', 'future_worker_evidence_required'),
    ],
    segmentExpectations: segmentIds.map((segmentExpectationId, order) => ({
      segmentExpectationId,
      order,
      sourceSegmentRef: expectation(`${prefix}.source-segment-${order}`, String(order)),
      outputFrameExpectationRefId: outputFrame.expectationRefId,
      masterTimingExpectationRefId: masterTiming.expectationRefId,
    })),
  }
}

function expectation(
  expectationRefId: string,
  digestCharacter: string,
  evidenceClass: LivingFrameExpectationRef['evidenceClass'] = 'controlled_unverified_evidence',
): LivingFrameExpectationRef {
  return {
    expectationRefId,
    expectedDigestSha256: digest(digestCharacter),
    evidenceClass,
  }
}

function continuity(
  continuityRefId: string,
  kind: LivingFrameContinuityPackRef['kind'],
  digestCharacter: string,
): LivingFrameContinuityPackRef {
  return {
    continuityRefId,
    kind,
    version: 1,
    expectedDigestSha256: digest(digestCharacter),
    evidenceClass: 'controlled_unverified_evidence',
    liveAuthorityVerified: false,
  }
}

function opaqueComponent(
  input: Pick<
    LivingFrameComponentPlan,
    | 'componentId'
    | 'order'
    | 'role'
    | 'focalRole'
    | 'summary'
    | 'provenanceExpectation'
    | 'capabilityKeys'
    | 'continuityRefIds'
  >,
): LivingFrameComponentPlan {
  return {
    ...input,
    parentComponentId: null,
    anchorComponentId: null,
    depthBand: 'background',
    transparencyExpectation: 'opaque_plate',
    alphaSourceExpectation: 'opaque_plate',
    alphaQaExpectation: 'not_applicable',
    rectangularBackgroundRejectionRequired: false,
    evidenceClass: 'controlled_unverified_evidence',
    qaExpectationCodes: ['narrative_relevance_expected'],
  }
}

function stillAlphaComponent(
  input: Pick<
    LivingFrameComponentPlan,
    | 'componentId'
    | 'order'
    | 'role'
    | 'focalRole'
    | 'summary'
    | 'parentComponentId'
    | 'anchorComponentId'
    | 'depthBand'
    | 'provenanceExpectation'
    | 'capabilityKeys'
    | 'continuityRefIds'
  >,
): LivingFrameComponentPlan {
  return {
    ...input,
    transparencyExpectation: 'still_alpha_required',
    alphaSourceExpectation: 'postprocessed_still_mask_requires_qa',
    alphaQaExpectation: 'future_alpha_qa_required',
    rectangularBackgroundRejectionRequired: true,
    evidenceClass: 'controlled_unverified_evidence',
    qaExpectationCodes: [
      'component_separability_required',
      'alpha_multi_background_qa_required',
    ],
  }
}

function temporalMaskComponent(
  input: Pick<
    LivingFrameComponentPlan,
    | 'componentId'
    | 'order'
    | 'role'
    | 'focalRole'
    | 'summary'
    | 'parentComponentId'
    | 'anchorComponentId'
    | 'depthBand'
    | 'capabilityKeys'
    | 'continuityRefIds'
  >,
): LivingFrameComponentPlan {
  return {
    ...input,
    transparencyExpectation: 'temporal_mask_required',
    alphaSourceExpectation: 'temporal_mask_sequence_requires_qa',
    alphaQaExpectation: 'temporal_mask_qa_required',
    rectangularBackgroundRejectionRequired: true,
    provenanceExpectation: 'source_a_roll_expectation',
    evidenceClass: 'future_worker_evidence_required',
    qaExpectationCodes: [
      'temporal_mask_stability_required',
      'alpha_multi_background_qa_required',
    ],
  }
}

function proceduralComponent(
  input: Pick<
    LivingFrameComponentPlan,
    | 'componentId'
    | 'order'
    | 'role'
    | 'focalRole'
    | 'summary'
    | 'parentComponentId'
    | 'anchorComponentId'
    | 'depthBand'
    | 'capabilityKeys'
    | 'continuityRefIds'
  > & {
    readonly provenanceExpectation?: LivingFrameComponentPlan['provenanceExpectation']
  },
): LivingFrameComponentPlan {
  return {
    ...input,
    transparencyExpectation: 'procedural_alpha',
    alphaSourceExpectation: 'procedural_alpha_requires_qa',
    alphaQaExpectation: 'procedural_alpha_validation_required',
    rectangularBackgroundRejectionRequired: true,
    provenanceExpectation: input.provenanceExpectation ?? 'deterministic_draw_expectation',
    evidenceClass: 'controlled_unverified_evidence',
    qaExpectationCodes: ['alpha_multi_background_qa_required'],
  }
}

function dependency(
  componentId: string,
  dependsOnComponentId: string,
  kind: 'depends_on' | 'anchored_to' | 'occluded_by',
) {
  return { componentId, dependsOnComponentId, kind } as const
}

function activation(
  activationId: string,
  order: number,
  miniSkillKey: LivingFrameSkillActivation['miniSkillKey'],
  linkedComponentIds: readonly string[],
  linkedTimingRequestIds: readonly string[],
  dependsOnActivationIds: readonly string[],
): LivingFrameSkillActivation {
  return {
    activationId,
    order,
    miniSkillKey,
    role: miniSkillKey.endsWith('_qa') ? 'qa' : 'required',
    decision: miniSkillKey === 'living_frame_restraint_qa' ? 'use_subtle' : 'use_full',
    intensity: miniSkillKey === 'mechanical_part_motion' ? 'hero' : 'standard',
    reasonCode: 'selective_motion_improves_comprehension',
    reasonSummary: 'The activation contributes a bounded part of the scene attention journey.',
    linkedComponentIds,
    linkedTimingRequestIds,
    dependsOnActivationIds,
    conflictsWithActivationIds: [],
    qaExpectationCodes: ['narrative_relevance_expected'],
  }
}

function createTimingRequests(prefix: string): readonly LivingFrameSemanticTimingRequest[] {
  const phases = [
    ['prepare', 'spoken_meaning_begins'],
    ['activate', 'visual_introduction_requested'],
    ['demonstrate', 'primary_motion_requested'],
    ['resolve', 'visual_resolution_requested'],
    ['settle', 'attention_return_requested'],
  ] as const
  return phases.map(([phase, cueCode], order) => ({
    timingRequestId: `timing.${prefix}-${phase}`,
    order,
    phase,
    cueCode,
    summary: `The ${phase} phase requests semantic alignment from canonical timing.`,
    exactFramesProvided: false,
  }))
}

function attention(
  attentionEventId: string,
  order: number,
  eventType: LivingFrameAttentionEvent['eventType'],
  target: LivingFrameAttentionEvent['target'],
): LivingFrameAttentionEvent {
  return {
    attentionEventId,
    order,
    eventType,
    target,
    methods: eventType === 'handoff'
      ? ['focus_depth_expectation', 'motion_emphasis_expectation']
      : ['local_contrast_expectation'],
    summary: 'The attention event is a semantic request for downstream timing and composition.',
    exactFramesProvided: false,
  }
}

function sound(
  soundRequestId: string,
  order: number,
  linkedComponentId: string | null,
  purpose: LivingFrameProfessionalSkillComponentDraft['scenePlans'][number]['soundRequests'][number]['purpose'],
  priority: LivingFrameProfessionalSkillComponentDraft['scenePlans'][number]['soundRequests'][number]['priority'],
) {
  return {
    soundRequestId,
    order,
    linkedComponentId,
    purpose,
    priority,
    narrationProtection: 'strict',
    duckingExpectation: 'downstream_soundsync_required',
    summary: 'The cue remains subordinate to narration and requires downstream SoundSync timing.',
    exactCuePlacementProvided: false,
    exactMixProvided: false,
  } as const
}

function safeRegions() {
  return {
    captions: 'requires_downstream_verification',
    face: 'requires_downstream_verification',
    gestures: 'requires_downstream_verification',
  } as const
}

function digest(character: string): string {
  const safeCharacter = /^[a-f0-9]$/.test(character) ? character : '0'
  return safeCharacter.repeat(64)
}

function adversarial(
  fixtureId: string,
  expectedIssueCode: LivingFrameAdversarialFixture['expectedIssueCode'],
  source: LivingFrameProfessionalSkillComponentDraft,
  mutate: (root: Record<string, unknown>) => void,
): LivingFrameAdversarialFixture {
  const payload = cloneJson(source)
  const root = objectField(payload)
  mutate(root)
  return { fixtureId, expectedIssueCode, payload }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function objectField(value: unknown, key?: string): Record<string, unknown> {
  const candidate = key === undefined
    ? value
    : (value as Record<string, unknown>)[key]
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    throw new Error('Controlled Living Frame fixture object is malformed.')
  }
  return candidate as Record<string, unknown>
}

function arrayField(value: unknown, key: string): unknown[] {
  const candidate = objectField(value)[key]
  if (!Array.isArray(candidate)) {
    throw new Error('Controlled Living Frame fixture array is malformed.')
  }
  return candidate
}

function firstScene(root: Record<string, unknown>): Record<string, unknown> {
  return objectField(arrayField(root, 'scenePlans')[0])
}

function firstSceneComponents(root: Record<string, unknown>): unknown[] {
  return arrayField(firstScene(root), 'components')
}
