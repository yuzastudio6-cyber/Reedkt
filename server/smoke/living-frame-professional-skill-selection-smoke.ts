import assert from 'node:assert/strict'

import {
  LIVING_FRAME_PROFESSIONAL_SKILL_ID,
  resolveLivingFrameSelectionPolicy,
} from '../../src/lib/living-frame'
import {
  createProfessionalSkillPlan,
  getProfessionalSkillDefinition,
  listProfessionalSkillDefinitions,
} from '../../src/lib/professional-skills'
import type { PlannerInput } from '../../src/types/reeditpro'

const basePlannerInput: PlannerInput = {
  projectName: 'Living Frame parent selection smoke',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  frameTemplateType: 'horizontal_wide_frame',
  editingCategory: 'education_explainer',
  workflowType: 'education_explainer',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'premium',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions: 'Keep the edit clear and professional.',
  creditPreference: 'balanced',
  clips: [
    {
      id: 'clip-living-frame-selection-smoke-1',
      uploadedOrder: 1,
      fileName: 'living-frame-selective-motion-source.mp4',
      duration: '0:42',
      detectedType: 'talking_head_living_frame_candidate',
      sourceOrderLocked: true,
    },
  ],
}

function planFor(
  customInstructions: string,
  overrides: Partial<PlannerInput> = {},
) {
  return createProfessionalSkillPlan({
    plannerInput: {
      ...basePlannerInput,
      ...overrides,
      customInstructions,
    },
  })
}

function livingFrameSelectionFor(customInstructions: string) {
  return planFor(customInstructions).selectedSkills.find(
    (skill) => skill.skillId === LIVING_FRAME_PROFESSIONAL_SKILL_ID,
  )
}

const directPlan = planFor(
  'Use Living Frame storytelling for the central explanation, but keep it restrained.',
)
const directSelection = livingFrameSelectionFor(
  'Use Living Frame storytelling for the central explanation, but keep it restrained.',
)
assert.ok(directSelection, 'An explicit Living Frame editing request must select the parent skill.')
assert.ok(
  directSelection.selectionSources.includes('user_prompt'),
  'Explicit Living Frame selection must retain admitted user-intent evidence.',
)

assert.ok(
  livingFrameSelectionFor(
    'Animate this still photograph with selective movement in the robe and sword.',
  ),
  'An explicit animation-aware still request must select Living Frame.',
)
assert.ok(
  livingFrameSelectionFor(
    'Build an in-frame explanation with map elements behind the speaker.',
  ),
  'An explicit spatial in-frame explanation must select Living Frame.',
)

assert.equal(
  resolveLivingFrameSelectionPolicy({
    explicitEditBriefDirectives: 'Use limited animation for the approved still illustration.',
  }).selectionSource,
  'edit_brief',
  'The policy may admit explicit Edit Brief direction without inspecting unrelated context.',
)
assert.equal(
  resolveLivingFrameSelectionPolicy({
    explicitEditCueDirectives: 'Place the map beside the narrator for this explanation.',
  }).selectionSource,
  'edit_cue',
  'The policy may admit explicit edit-cue direction without inspecting unrelated context.',
)

assert.equal(
  livingFrameSelectionFor('Use smooth animation and kinetic typography.'),
  undefined,
  'Generic animation must not select Living Frame.',
)
assert.equal(
  livingFrameSelectionFor('Make this education explainer clear and concise.'),
  undefined,
  'An inferred explainer category must not select Living Frame by itself.',
)
assert.equal(
  livingFrameSelectionFor(
    'Preserve the intimate emotional monologue and keep the face as the focus.',
  ),
  undefined,
  'An emotional monologue without explicit Living Frame intent must not select it.',
)
assert.equal(
  livingFrameSelectionFor(
    'Use the reliving frameworks chapter as written and keep the edit clean.',
  ),
  undefined,
  'Incidental substrings must not select Living Frame.',
)
assert.equal(
  livingFrameSelectionFor('Keep this source-led edit clean.'),
  undefined,
  'Living Frame words in source metadata or filenames must never select the skill.',
)

for (const restrainedIntent of [
  'Use Living Frame, but no animation.',
  'Do not use Living Frame in this edit.',
  'No motion; static only.',
  'Talking head only with no extra visuals.',
  'Keep visuals minimal even if an in-frame explainer could be added.',
]) {
  assert.equal(
    livingFrameSelectionFor(restrainedIntent),
    undefined,
    `Explicit restraint must suppress Living Frame: ${restrainedIntent}`,
  )
}

const restrainedDecision = resolveLivingFrameSelectionPolicy({
  explicitUserIntent: 'Use Living Frame, but no animation.',
})
assert.deepEqual(
  restrainedDecision,
  {
    selected: false,
    reasonCode: 'explicit_motion_restraint',
    selectionSource: null,
    explicitRestraintApplied: true,
    planningOnly: true,
    componentPayloadCreated: false,
    runtimeAuthorityGranted: false,
  },
  'The non-use decision must retain only a closed safe reason code and literal non-authority state.',
)

const definition = getProfessionalSkillDefinition(
  LIVING_FRAME_PROFESSIONAL_SKILL_ID,
)
assert.ok(definition, 'The canonical professional-skill registry must contain one Living Frame parent.')
assert.equal(
  definition.family,
  'motion_design',
  'Living Frame must reuse the existing motion-design family.',
)
assert.deepEqual(
  definition.executionModes,
  ['plan_only'],
  'Living Frame parent admission must remain plan-only.',
)
assert.deepEqual(
  definition.hiddenAdapterToolNames,
  [],
  'Living Frame parent admission must not select or expose tools.',
)
assert.deepEqual(
  definition.backendIntents ?? [],
  [],
  'Living Frame parent admission must not create provider or backend intents.',
)
assert.deepEqual(
  definition.optionalInputs,
  ['edit_brief', 'edit_cues'],
  'Living Frame parent admission must not advertise source-video or inferred-context selection inputs.',
)
assert.deepEqual(
  directSelection.backendIntents,
  [],
  'The selected parent must not carry any provider, model, or adapter route.',
)
assert.deepEqual(
  directSelection.hiddenAdapterToolNames,
  [],
  'The selected parent must not carry hidden tool identities.',
)
assert.equal(
  Object.prototype.hasOwnProperty.call(directPlan, 'livingFrame'),
  false,
  'Slice 2A must not add a Living Frame component payload to ProfessionalSkillPlan.',
)

for (const forbiddenAuthorityKey of [
  'component',
  'componentPayload',
  'estimate',
  'timing',
  'approval',
  'snapshot',
  'workItems',
  'queue',
  'jobs',
  'qaPlan',
  'runtime',
  'providerRoute',
  'toolRoute',
]) {
  assert.equal(
    Object.prototype.hasOwnProperty.call(directSelection, forbiddenAuthorityKey),
    false,
    `The parent selection must not carry ${forbiddenAuthorityKey} authority.`,
  )
}

const productCopy = JSON.stringify({
  definition,
  userFacingSummary: directPlan.userFacingSummary,
  userFacingActivities: directPlan.userFacingActivities,
  activityGroups: directPlan.activityGroups,
  selectedSkill: directSelection,
}).toLowerCase()
for (const candidateName of [
  'comfyui',
  'comfyui_controlnet_aux',
  'controlnet',
  'ip-adapter',
  'ip_adapter',
  'pulid',
  'peft',
  'lora',
]) {
  assert.equal(
    productCopy.includes(candidateName),
    false,
    `Evaluation-only controlled-illustration candidate ${candidateName} must stay out of product planning copy.`,
  )
}

const livingFrameDefinitions = listProfessionalSkillDefinitions().filter(
  (candidate) => candidate.id === LIVING_FRAME_PROFESSIONAL_SKILL_ID,
)
assert.equal(
  livingFrameDefinitions.length,
  1,
  'Slice 2A must admit exactly one Living Frame parent definition.',
)

console.log(JSON.stringify({
  directSelectionReason: directSelection.reason,
  livingFrameDefinitionCount: livingFrameDefinitions.length,
  parentExecutionMode: definition.executionModes,
  parentBackendIntentCount: directSelection.backendIntents.length,
  parentHiddenAdapterCount: directSelection.hiddenAdapterToolNames.length,
  restraintReasonCode: restrainedDecision.reasonCode,
  componentPayloadCreated: restrainedDecision.componentPayloadCreated,
  runtimeAuthorityGranted: restrainedDecision.runtimeAuthorityGranted,
}, null, 2))
