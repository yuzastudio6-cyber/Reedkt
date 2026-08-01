import assert from 'node:assert/strict'

import {
  LIVING_FRAME_CAPABILITY_KEYS,
  LIVING_FRAME_MINI_SKILL_KEYS,
  LIVING_FRAME_MODES,
  LIVING_FRAME_NARRATIVE_PURPOSE_CODES,
  LIVING_FRAME_VISUAL_VERBS,
  type LivingFrameCapabilityKey,
  type LivingFrameMiniSkillKey,
  type LivingFrameMode,
  type LivingFrameNarrativePurposeCode,
  type LivingFrameVisualVerb,
} from '../../src/types/living-frame'
import {
  CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_IDS,
} from '../../src/types/living-frame-controlled-illustration-estimate-basis'
import {
  CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_ITEM_OPERATION,
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION,
} from '../../src/types/living-frame-canonical-work-graph-projection'

interface SubjectNeutralScenario {
  readonly scenarioId: string
  readonly decision: 'use' | 'non_use'
  readonly mode: LivingFrameMode | null
  readonly narrativePurpose:
    LivingFrameNarrativePurposeCode | null
  readonly visualVerb: LivingFrameVisualVerb | null
  readonly miniSkills:
    readonly LivingFrameMiniSkillKey[]
  readonly capabilities:
    readonly LivingFrameCapabilityKey[]
  readonly focalPrimaryCount: 0 | 1
  readonly exactTruthRequiresDeterministicRoute: boolean
  readonly controlledIllustrationCandidate: boolean
  readonly fallbackLadder: readonly string[]
}

const scenarios: readonly SubjectNeutralScenario[] = [
  {
    scenarioId: 'cellular-process-diagram',
    decision: 'use',
    mode: 'living_diagram',
    narrativePurpose: 'show_cause_and_effect',
    visualVerb: 'transform',
    miniSkills: [
      'editorial_motion',
      'state_change_motion',
      'semantic_scale',
      'sound_choreography',
    ],
    capabilities: [
      'deterministic_vector_drawing',
      'exact_data_graphics',
      'deterministic_scene_composition',
    ],
    focalPrimaryCount: 1,
    exactTruthRequiresDeterministicRoute: true,
    controlledIllustrationCandidate: false,
    fallbackLadder: [
      'full_living_frame',
      'full_illustrated_scene',
      'static_card',
      'captions_only',
      'no_extra_visual',
    ],
  },
  {
    scenarioId: 'ownership-network-explainer',
    decision: 'use',
    mode: 'living_diagram',
    narrativePurpose: 'explain_relationship',
    visualVerb: 'connect',
    miniSkills: [
      'editorial_motion',
      'path_motion',
      'semantic_scale',
      'living_frame_restraint_qa',
    ],
    capabilities: [
      'deterministic_vector_drawing',
      'exact_data_graphics',
      'visual_semantic_qa',
    ],
    focalPrimaryCount: 1,
    exactTruthRequiresDeterministicRoute: true,
    controlledIllustrationCandidate: false,
    fallbackLadder: [
      'full_living_frame',
      'safe_space_overlay',
      'side_by_side',
      'static_card',
      'no_extra_visual',
    ],
  },
  {
    scenarioId: 'archival-chronology-evidence',
    decision: 'use',
    mode: 'living_archive',
    narrativePurpose: 'organize_archive_evidence',
    visualVerb: 'reveal',
    miniSkills: [
      'component_decomposition',
      'path_motion',
      'camera_choreography',
      'visual_continuity_direction',
    ],
    capabilities: [
      'image_upscale_or_prepare',
      'foreground_component_extraction',
      'deterministic_scene_composition',
      'visual_semantic_qa',
    ],
    focalPrimaryCount: 1,
    exactTruthRequiresDeterministicRoute: false,
    controlledIllustrationCandidate: false,
    fallbackLadder: [
      'full_living_frame',
      'full_illustrated_scene',
      'static_card',
      'captions_only',
      'no_extra_visual',
    ],
  },
  {
    scenarioId: 'product-mechanism-cutaway',
    decision: 'use',
    mode: 'living_still',
    narrativePurpose: 'explain_mechanical_operation',
    visualVerb: 'rotate',
    miniSkills: [
      'component_decomposition',
      'component_rigging',
      'mechanical_part_motion',
      'camera_choreography',
    ],
    capabilities: [
      'still_image_generation_or_edit',
      'foreground_component_extraction',
      'alpha_edge_refinement',
      'deterministic_scene_composition',
    ],
    focalPrimaryCount: 1,
    exactTruthRequiresDeterministicRoute: false,
    controlledIllustrationCandidate: true,
    fallbackLadder: [
      'full_living_frame',
      'full_illustrated_scene',
      'static_card',
      'captions_only',
      'no_extra_visual',
    ],
  },
  {
    scenarioId: 'speaker-dependency-model',
    decision: 'use',
    mode: 'living_a_roll',
    narrativePurpose: 'explain_relationship',
    visualVerb: 'converge',
    miniSkills: [
      'focus_handoff',
      'attention_restoration',
      'visual_orbit',
      'living_frame_restraint_qa',
    ],
    capabilities: [
      'temporal_subject_masking',
      'deterministic_vector_drawing',
      'deterministic_scene_composition',
    ],
    focalPrimaryCount: 1,
    exactTruthRequiresDeterministicRoute: false,
    controlledIllustrationCandidate: false,
    fallbackLadder: [
      'full_living_frame',
      'safe_space_overlay',
      'lower_visual_stage',
      'side_by_side',
      'no_extra_visual',
    ],
  },
  {
    scenarioId: 'regional-growth-hybrid-expansion',
    decision: 'use',
    mode: 'hybrid_expansion',
    narrativePurpose: 'show_cause_and_effect',
    visualVerb: 'expand',
    miniSkills: [
      'camera_choreography',
      'semantic_scale',
      'editorial_motion',
      'attention_restoration',
    ],
    capabilities: [
      'exact_map_rendering',
      'exact_data_graphics',
      'deterministic_scene_composition',
    ],
    focalPrimaryCount: 1,
    exactTruthRequiresDeterministicRoute: true,
    controlledIllustrationCandidate: false,
    fallbackLadder: [
      'full_living_frame',
      'full_illustrated_scene',
      'side_by_side',
      'static_card',
      'no_extra_visual',
    ],
  },
  {
    scenarioId: 'emotionally-sensitive-personal-account',
    decision: 'non_use',
    mode: null,
    narrativePurpose: 'protect_emotional_delivery',
    visualVerb: 'hold',
    miniSkills: [],
    capabilities: [],
    focalPrimaryCount: 0,
    exactTruthRequiresDeterministicRoute: false,
    controlledIllustrationCandidate: false,
    fallbackLadder: ['no_extra_visual'],
  },
]

const modes = new Set(LIVING_FRAME_MODES)
const purposes =
  new Set(LIVING_FRAME_NARRATIVE_PURPOSE_CODES)
const verbs = new Set(LIVING_FRAME_VISUAL_VERBS)
const miniSkills = new Set(LIVING_FRAME_MINI_SKILL_KEYS)
const capabilities =
  new Set(LIVING_FRAME_CAPABILITY_KEYS)

for (const scenario of scenarios) {
  assert.doesNotMatch(
    scenario.scenarioId,
    /musashi|helicopter|hormuz/i,
  )
  assert.ok(
    scenario.mode === null || modes.has(scenario.mode),
  )
  assert.ok(
    scenario.narrativePurpose === null
    || purposes.has(scenario.narrativePurpose),
  )
  assert.ok(
    scenario.visualVerb === null
    || verbs.has(scenario.visualVerb),
  )
  assert.ok(
    scenario.miniSkills.every((skill) =>
      miniSkills.has(skill)),
  )
  assert.ok(
    scenario.capabilities.every((capability) =>
      capabilities.has(capability)),
  )
  assert.equal(
    scenario.fallbackLadder.at(-1),
    'no_extra_visual',
  )
  if (scenario.decision === 'non_use') {
    assert.equal(scenario.mode, null)
    assert.equal(scenario.miniSkills.length, 0)
    assert.equal(scenario.capabilities.length, 0)
    assert.equal(scenario.focalPrimaryCount, 0)
  } else {
    assert.ok(scenario.mode)
    assert.equal(scenario.focalPrimaryCount, 1)
    assert.ok(scenario.miniSkills.length > 0)
    assert.ok(scenario.capabilities.length > 0)
  }
  if (scenario.exactTruthRequiresDeterministicRoute) {
    assert.ok(
      scenario.capabilities.includes(
        'exact_map_rendering',
      )
      || scenario.capabilities.includes(
        'exact_data_graphics',
      ),
    )
    assert.equal(
      scenario.capabilities.includes(
        'bounded_video_asset_generation',
      ),
      false,
    )
  }
}

assert.deepEqual(
  [...new Set(
    scenarios.flatMap((scenario) =>
      scenario.mode ? [scenario.mode] : []),
  )].sort(),
  [...LIVING_FRAME_MODES].sort(),
)

assert.deepEqual(
  CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_IDS,
  [
    'comfyui_execution_host',
    'comfyui_controlnet_aux_preprocessing',
    'controlnet_conditioning',
    'ipadapter_reference_conditioning',
    'peft_lora_adapter_loading',
    'auraface_identity_measurement',
  ],
)
const sharedGpuCapabilities =
  CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_IDS
    .filter((capability) =>
      capability !== 'auraface_identity_measurement')
assert.equal(sharedGpuCapabilities.length, 5)
assert.equal(
  CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_IDS
    .at(-1),
  'auraface_identity_measurement',
)

const genericRuntimeIdentifiers = [
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_ITEM_OPERATION,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION,
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION,
  CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY,
]
for (const identity of genericRuntimeIdentifiers) {
  assert.doesNotMatch(
    identity,
    /musashi|helicopter|hormuz|science|finance|product/i,
  )
}

assert.equal(
  scenarios.filter((scenario) =>
    scenario.controlledIllustrationCandidate).length,
  1,
)
assert.equal(
  scenarios.filter((scenario) =>
    scenario.decision === 'non_use').length,
  1,
)

console.log(JSON.stringify({
  suite:
    'living-frame-subject-neutral-capability-matrix',
  representedModes: LIVING_FRAME_MODES,
  representativeUseCases:
    scenarios.filter((scenario) =>
      scenario.decision === 'use').length,
  deliberateNonUseCases: 1,
  exactTruthDeterministicCases:
    scenarios.filter((scenario) =>
      scenario.exactTruthRequiresDeterministicRoute)
      .length,
  sharedGpuCapabilityCount:
    sharedGpuCapabilities.length,
  separateConditionalCpuCapability:
    'auraface_identity_measurement',
  sixCapabilityIdsCreateSixToolCharges: false,
  subjectSpecificRuntimeIdentifiers: false,
}, null, 2))
