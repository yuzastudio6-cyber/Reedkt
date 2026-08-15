import assert from 'node:assert/strict'

import {
  boundedAudioCleanupModelAdapterToolNames,
  boundedAudioMusicAdapterToolNames,
  boundedInternalAdapterToolNames,
  boundedModelFoundationAdapterToolNames,
  boundedRenderPackagingAdapterToolNames,
  boundedVisualMotionModelAdapterToolNames,
  boundedVisualMotionVisionAdapterToolNames,
  createProfessionalSkillPlan,
  listProfessionalSkillDefinitions,
  listProfessionalSkillFamilies,
  listProfessionalSkillHiddenAdapterNames,
  resolveApprovedSnapshotInternalTestAdapterToolNames,
  summarizeProfessionalBackendPreparation,
  validateProfessionalSkillBackendIntent,
} from '../../src/lib/professional-skills'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import { hideInternalToolNamesInCopy } from '../../src/lib/tool-display-labels'
import { sampleClips } from '../../src/lib/mock-planner/default-data'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import type { PlannerInput } from '../../src/types/reeditpro'
import { createApprovedEditExecutionPackage } from '../edit-architecture/approved-edit-execution-package'
import {
  NON_E2E_TOOL_CAPABILITY_IDS,
  PRODUCTION_TOOL_IDS,
  listProfessionalToolAdapterContracts,
} from '../tool-registry'

const plannerInput: PlannerInput = {
  projectName: 'Skill planner smoke',
  targetPlatform: 'tiktok_reels_shorts',
  aspectRatio: '9:16',
  frameTemplateType: 'vertical_talking_head_lower_panel',
  editingCategory: 'education_explainer',
  workflowType: 'education_explainer',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'premium',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions: 'Clean the voice audio, add readable captions, use a simple chart when helpful, and keep the edit premium but not cluttered.',
  creditPreference: 'balanced',
  clips: [
    {
      id: 'clip-skill-smoke-1',
      uploadedOrder: 1,
      fileName: 'skill-smoke-source.mp4',
      duration: '0:42',
      detectedType: 'talking_head',
      sourceOrderLocked: true,
    },
  ],
}

const definitions = listProfessionalSkillDefinitions()
const families = listProfessionalSkillFamilies()
const hiddenAdapterNames = listProfessionalSkillHiddenAdapterNames()
const adapterContracts = listProfessionalToolAdapterContracts()
const productionToolIds = new Set<string>(PRODUCTION_TOOL_IDS)
const requestedAdapterNames = new Set(adapterContracts.flatMap((contract) => [
  contract.requestedToolName,
  contract.canonicalToolId,
]))
const plan = createProfessionalSkillPlan({ plannerInput })
const selectedIds = new Set(plan.selectedSkills.map((skill) => skill.skillId))
const backendIntentIds = new Set(plan.backendIntents.map((intent) => intent.intentId))
const preparationSummaries = summarizeProfessionalBackendPreparation(plan.backendIntents)
const promptEvidenceSkills = plan.selectedSkills.filter((skill) =>
  skill.selectionEvidence.some((evidence) => evidence.source === 'user_prompt')
)
const userVisibleCopy = [
  plan.userFacingSummary,
  ...plan.userFacingActivities,
  ...plan.activityGroups.flatMap((group) => [group.label, group.userFacingSummary]),
  ...plan.selectedSkills.flatMap((skill) => [
    skill.reason,
    ...skill.selectionEvidence.flatMap((evidence) => [evidence.label, evidence.summary]),
  ]),
  ...preparationSummaries.flatMap((summary) => [summary.label, summary.summary]),
].join('\n').toLowerCase()
const definitionIds = definitions.map((definition) => definition.id)
const duplicateDefinitionIds = definitionIds.filter((id, index) => definitionIds.indexOf(id) !== index)
const readyAudioMusicAdapterToolNames = boundedAudioMusicAdapterToolNames
const readyAudioCleanupModelAdapterToolNames = boundedAudioCleanupModelAdapterToolNames
const readyVisualMotionModelAdapterToolNames = boundedVisualMotionModelAdapterToolNames
const readyVisualMotionVisionAdapterToolNames = boundedVisualMotionVisionAdapterToolNames

assert.ok(definitions.length >= 100, 'Professional skill registry must cover the 100+ professional skill vocabulary.')
assert.ok(families.length >= 12, 'Professional skill registry must expose broad professional skill families.')
assert.deepEqual(duplicateDefinitionIds, [], 'Professional skill definitions must have unique IDs.')
assert.ok(hiddenAdapterNames.length >= 35, 'Skill registry must map to the backend adapter/tool ecosystem.')
assert.equal(readyAudioMusicAdapterToolNames.length, 16, 'The ready audio/music adapter group must contain the 16 approved music/audio tools including RNNoise.')
assert.equal(readyAudioCleanupModelAdapterToolNames.length, 1, 'The model-gated audio cleanup group must preserve DeepFilterNet as a separate owner-evidence adapter.')
assert.equal(readyVisualMotionVisionAdapterToolNames.length, 15, 'The ready visual/motion/vision adapter group must contain the 15 canonical private E2E visual tools.')
assert.equal(readyVisualMotionModelAdapterToolNames.length, 15, 'Runner foundations and non-E2E candidates must not inflate the 15-tool visual execution pack.')
assert.deepEqual(
  boundedRenderPackagingAdapterToolNames,
  [
    'mkvtoolnix_container_validation',
    'gpac_mp4box_packaging_validation',
  ],
  'The render/packaging adapter group must contain only the two canonical private E2E validation tools.',
)

for (const family of families) {
  assert.ok(
    definitions.some((definition) => definition.family === family),
    `Professional skill family ${family} must have at least one definition.`,
  )
}

for (const hiddenName of hiddenAdapterNames) {
  assert.ok(
    productionToolIds.has(hiddenName) || requestedAdapterNames.has(hiddenName),
    `Hidden adapter/tool name ${hiddenName} must resolve to a backend adapter contract or production tool profile.`,
  )
}

for (const visualModelAdapterToolName of readyVisualMotionModelAdapterToolNames) {
  assert.ok(
    productionToolIds.has(visualModelAdapterToolName) || requestedAdapterNames.has(visualModelAdapterToolName),
    `Ready visual/model adapter ${visualModelAdapterToolName} must resolve to a backend adapter contract or production tool profile.`,
  )
}

for (const definition of definitions) {
  const visibleDefinitionCopy = [
    definition.userFacingName,
    definition.userFacingActivity,
  ].join('\n').toLowerCase()

  for (const hiddenName of definition.hiddenAdapterToolNames) {
    assert.equal(
      visibleDefinitionCopy.includes(hiddenName.toLowerCase()),
      false,
      `Definition ${definition.id} must not expose hidden adapter name ${hiddenName} in user-facing copy.`,
    )
  }
}

assert.equal(plan.promptFirstPlanning, true, 'Skill planning must support prompt-first planning.')
assert.equal(plan.editBriefOptional, true, 'Edit Brief must remain optional.')
assert.equal(plan.status, 'ready_for_plan', 'Prompt plus uploaded source must be enough for a plan-ready skill plan.')
assert.equal(plan.blockers.length, 0, 'Prompt-first plan should not block only because the Edit Brief is absent.')
assert.ok(plan.warnings.some((warning) => /No Edit Brief/i.test(warning)), 'Absent brief should be recorded as optional guidance, not a blocker.')
assert.ok(selectedIds.has('audio.clean_voice'), 'Audio cleanup prompt should select voice cleanup.')
assert.ok(selectedIds.has('audio.loudness_delivery_check'), 'Audio cleanup prompt should select loudness checks.')
assert.ok(selectedIds.has('captions.clean_readable_captions'), 'Caption prompt should select readable captions.')
assert.ok(selectedIds.has('graphics.chart_or_data_visual'), 'Chart prompt should select data visual planning.')
assert.ok(selectedIds.has('qa.private_review_readiness'), 'Every plan should carry private review QA readiness.')
assert.equal(plan.noUserVisibleToolNames, true, 'Skill plan must guarantee user-facing copy hides package names.')
assert.ok(plan.activityGroups.length >= 4, 'Skill plan should group selected activities into user-facing edit areas.')
assert.ok(promptEvidenceSkills.length >= 3, 'Prompt-selected skills must preserve a user-request evidence trail.')
assert.ok(
  promptEvidenceSkills.every((skill) => skill.selectionEvidence.some((evidence) =>
    evidence.label === 'User request' &&
    /matched the user/i.test(evidence.summary)
  )),
  'Prompt evidence must explain why the skill was selected without exposing raw adapter names.',
)
assert.ok(plan.activityGroups.some((group) => group.label === 'Audio cleanup'), 'Prompt-selected audio cleanup should appear as a grouped edit area.')
assert.ok(plan.activityGroups.some((group) => group.label === 'Captions'), 'Prompt-selected captions should appear as a grouped edit area.')
assert.ok(plan.activityGroups.some((group) => group.label === 'Charts and diagrams'), 'Prompt-selected chart work should appear as a grouped edit area.')
assert.ok(
  backendIntentIds.has('intent.compile_prompt_direction.kimi_primary_edit_agent'),
  'Professional skill planning must carry the canonical Kimi K3 primary edit-agent intent.',
)
assert.ok(
  backendIntentIds.has('intent.compile_prompt_direction.terra_first_fallback'),
  'Professional skill planning must carry the canonical GPT-5.6 Terra first-fallback intent.',
)
assert.ok(
  backendIntentIds.has('intent.compile_prompt_direction.deepseek_final_fallback'),
  'Professional skill planning must carry the canonical DeepSeek V4 Pro final-fallback intent.',
)
assert.ok(
  backendIntentIds.has('source.review_sequence_and_structure.visual_intelligence'),
  'Professional skill planning must carry provider-neutral Visual Intelligence for source review.',
)
assert.equal(
  plan.backendIntents.every((intent) => validateProfessionalSkillBackendIntent(intent).ok),
  true,
  'Every selected backend intent must validate against canonical provider gateway/model-role contracts.',
)
assert.equal(plan.modelRoleTrace.ok, true, 'Professional skill plan must validate the canonical model-role trace.')
assert.equal(plan.modelRoleTrace.blocked, false, 'Canonical model-role trace must not block a valid prompt-first plan.')
assert.equal(plan.modelRoleTrace.source, 'reeditpro_model_role_contract', 'Model-role trace must identify the shared contract source.')
assert.ok(
  plan.modelRoleTrace.roles.some((role) =>
    role.modelRoleId === 'kimi_k3_main_edit_agent' &&
    role.canonicalProviderModel === 'kimi-k3' &&
    role.requestedUses.includes('edit_planning') &&
    role.editPlanningAllowed &&
    role.userReasoningAllowed &&
    role.toolCodeAllowed &&
    role.reasoningRouteRole === 'primary'
  ),
  'Kimi K3 must remain the primary edit-planning, user-reasoning, creativity, and coding role.',
)
assert.ok(plan.modelRoleTrace.roles.some((role) =>
  role.modelRoleId === 'gpt_5_6_terra_fallback_edit_agent' &&
  role.canonicalProviderModel === 'gpt-5.6-terra' &&
  role.reasoningRouteRole === 'fallback' &&
  role.reasoningRoutePriority === 2 &&
  role.toolCodeAllowed
))
assert.ok(plan.modelRoleTrace.roles.some((role) =>
  role.modelRoleId === 'deepseek_v4_tool_code_agent' &&
  role.canonicalProviderModel === 'deepseek-v4-pro' &&
  role.reasoningRouteRole === 'fallback' &&
  role.reasoningRoutePriority === 3 &&
  role.userReasoningAllowed &&
  role.toolCodeAllowed
))
assert.ok(
  plan.modelRoleTrace.roles.some((role) =>
    role.modelRoleId === 'visual_intelligence_gemini_pro_high' &&
    role.canonicalProviderModel === 'gemini-3.1-pro-preview' &&
    role.requestedUses.includes('visual_understanding') &&
    role.visualUnderstandingAllowed &&
    !role.editPlanningAllowed &&
    !role.userReasoningAllowed
  ),
  'Visual Intelligence must remain visual-understanding only.',
)
assert.equal(
  validateProfessionalSkillBackendIntent({
    intentId: 'regression.qwen25vl_not_planner',
    intentKind: 'model_role',
    userFacingActivity: 'inspect visible source context',
    executionBoundary: 'metadata_only',
    providerRoute: 'qwen2_5_vl_7b_instruct_provider_boundary',
    providerModel: 'Qwen2.5-VL-7B-Instruct',
    modelRoleId: 'qwen2_5_vl_visual_understanding',
    requestedModelUse: 'edit_planning',
    hiddenAdapterToolNames: [],
    requiredApprovalGates: ['backend_provider_gate_required'],
  }).ok,
  false,
  'Qwen2.5-VL must not validate as the main edit planner.',
)
assert.equal(
  validateProfessionalSkillBackendIntent({
    intentId: 'regression.deepseek_not_user_reasoning',
    intentKind: 'model_role',
    userFacingActivity: 'prepare implementation notes',
    executionBoundary: 'backend_approved_after_snapshot',
    providerRoute: 'deepseek_v4_pro_tool_code_boundary',
    providerModel: 'DeepSeek V4 Pro',
    modelRoleId: 'deepseek_v4_tool_code_agent',
    requestedModelUse: 'user_reasoning',
    hiddenAdapterToolNames: [],
    requiredApprovalGates: ['backend_provider_gate_required'],
  }).ok,
  true,
  'DeepSeek V4 Pro may validate for reasoning only through its fallback-only model-role boundary.',
)
assert.equal(
  /kimi|qwen|deepseek|mirelo|mmaudio|provider boundary/i.test(userVisibleCopy),
  false,
  'User-facing skill copy must not expose provider/model implementation names.',
)
assert.equal(
  /\bbackend\b|provider boundary/i.test(userVisibleCopy),
  false,
  'Guided user-facing skill copy must describe private preparation without backend/provider implementation wording.',
)
assert.equal(
  /librosa|pydub|audioflux|d3|echarts|vega/i.test(JSON.stringify(plan.activityGroups)),
  false,
  'Skill activity groups must not expose adapter or package names.',
)

for (const hiddenName of plan.hiddenAdapterToolNames) {
  assert.equal(
    userVisibleCopy.includes(hiddenName.toLowerCase()),
    false,
    `User-facing skill copy must not expose adapter name ${hiddenName}.`,
  )
}

const scrubbedInternalPlanningCopy = hideInternalToolNamesInCopy(boundedInternalAdapterToolNames.join(' ')).toLowerCase()
for (const internalName of [
  ...boundedInternalAdapterToolNames,
  'mkvtoolnix',
  'gpac',
  'mp4box',
  'gstreamer',
]) {
  assert.equal(
    scrubbedInternalPlanningCopy.includes(internalName.toLowerCase()),
    false,
    `Shared user-facing copy scrubber must hide internal tool/package name ${internalName}.`,
  )
}

const maskPlan = createProfessionalSkillPlan({
  plannerInput: {
    ...plannerInput,
    customInstructions: 'Remove the background behind the subject and make the text feel layered behind the person.',
  },
})
const maskIds = new Set(maskPlan.selectedSkills.map((skill) => skill.skillId))

assert.ok(maskIds.has('mask.foreground_and_background'), 'Background-removal requests should select foreground treatment planning.')
assert.ok(maskIds.has('mask.depth_aware_overlay_policy'), 'Depth-aware text requests should select depth-aware overlay planning.')
assert.equal(maskPlan.status, 'needs_review', 'Model-backed mask skills must remain gated before execution.')
assert.ok(
  maskPlan.blockers.some((blocker) => /model\/checkpoint approval/i.test(blocker)),
  'Model-backed skill plan must explain the model/checkpoint approval gate.',
)

const renderPlan = createProfessionalSkillPlan({
  plannerInput: {
    ...plannerInput,
    customInstructions: 'Package a private review MP4 and check the review download before sharing.',
  },
})
const renderIds = new Set(renderPlan.selectedSkills.map((skill) => skill.skillId))

assert.ok(renderIds.has('render.private_review_packaging'), 'Private review requests should select review packaging planning.')
assert.ok(renderIds.has('render.review_download_preflight'), 'Review download requests should select private download preflight planning.')
assert.equal(renderPlan.status, 'needs_review', 'Private review packaging must wait for approved snapshot and private manifest.')
assert.ok(
  renderPlan.blockers.some((blocker) => /approved plan snapshot/i.test(blocker)),
  'Private review packaging must explain approved snapshot gating.',
)

const approvedSkillPlannerInput: PlannerInput = {
  ...plannerInput,
  projectName: 'Approved skill handoff smoke',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  clips: sampleClips,
  sourceSequenceMode: 'multi_clip_story_order',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
  customInstructions: [
    'Clean the voice audio.',
    'Reduce background noise.',
    'Add readable captions.',
    'Use a simple chart only if it helps the explanation.',
  ].join(' '),
}
const approvedSkillPlan = createMockEditPlan(approvedSkillPlannerInput)
assert.ok(approvedSkillPlan.professionalSkillPlan, 'Mock edit plans should carry a professional skill plan.')
const approvedSkillSnapshot = createApprovedPlanSnapshot({
  approvedBy: 'skill-smoke-user',
  editSessionId: 'skill-smoke-edit-session',
  plan: approvedSkillPlan,
  projectId: 'project-skill-smoke',
})

assert.deepEqual(
  approvedSkillSnapshot.professionalSkillPlan?.selectedSkills.map((skill) => skill.skillId),
  approvedSkillPlan.professionalSkillPlan?.selectedSkills.map((skill) => skill.skillId),
  'Approved snapshots must freeze the professional skill plan selected at approval time.',
)
assert.deepEqual(
  approvedSkillSnapshot.professionalSkillPlan?.selectedSkills.map((skill) => skill.selectionEvidence.map((evidence) => evidence.source)),
  approvedSkillPlan.professionalSkillPlan?.selectedSkills.map((skill) => skill.selectionEvidence.map((evidence) => evidence.source)),
  'Approved snapshots must freeze why each professional skill was selected.',
)
assert.deepEqual(
  approvedSkillSnapshot.professionalSkillPlan?.activityGroups.map((group) => group.id),
  approvedSkillPlan.professionalSkillPlan?.activityGroups.map((group) => group.id),
  'Approved snapshots must freeze the grouped professional skill activity areas selected at approval time.',
)

const approvedSnapshotScopedAdapterToolNames = resolveApprovedSnapshotInternalTestAdapterToolNames(approvedSkillSnapshot)
assert.ok(
  approvedSnapshotScopedAdapterToolNames.includes('pydub'),
  'Editor private-review scope should include audio adapters selected by the approved professional skill plan.',
)
assert.ok(
  approvedSnapshotScopedAdapterToolNames.includes('d3'),
  'Editor private-review scope should include data-visual adapters selected by the approved professional skill plan.',
)
assert.equal(
  approvedSnapshotScopedAdapterToolNames.includes('librosa') || approvedSnapshotScopedAdapterToolNames.includes('audioflux'),
  false,
  'Editor private-review scope should not include unselected broad music/audio analysis adapters from generic tool-strategy catalog metadata.',
)
for (const packagingAdapterToolName of [
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]) {
  assert.ok(
    approvedSnapshotScopedAdapterToolNames.includes(packagingAdapterToolName),
    `Editor private-review scope should always include hidden packaging adapter ${packagingAdapterToolName}.`,
  )
}

const modelBackedSkillPlannerInput: PlannerInput = {
  ...approvedSkillPlannerInput,
  projectName: 'Model backed skill handoff smoke',
  editLevel: 'premium',
  customInstructions: [
    'Remove the background behind the subject.',
    'Keep the layered text behind the person.',
    'Enhance the blurry footage and upscale the low-quality source moments.',
  ].join(' '),
}
const modelBackedSkillPlan = createMockEditPlan(modelBackedSkillPlannerInput)
const modelBackedSkillSnapshot = createApprovedPlanSnapshot({
  approvedBy: 'skill-smoke-user',
  editSessionId: 'model-backed-skill-smoke-edit-session',
  plan: modelBackedSkillPlan,
  projectId: 'project-model-backed-skill-smoke',
})
const modelBackedScopedAdapterToolNames = resolveApprovedSnapshotInternalTestAdapterToolNames(modelBackedSkillSnapshot)
const modelBackedUserVisibleCopy = [
  modelBackedSkillPlan.professionalSkillPlan?.userFacingSummary,
  ...(modelBackedSkillPlan.professionalSkillPlan?.userFacingActivities ?? []),
  ...(modelBackedSkillPlan.professionalSkillPlan?.activityGroups ?? []).flatMap((group) => [
    group.label,
    group.userFacingSummary,
  ]),
].join('\n').toLowerCase()

for (const expectedModelAdapter of ['rembg', 'kornia']) {
  assert.ok(
    modelBackedScopedAdapterToolNames.includes(expectedModelAdapter),
    `Model-backed prompt should carry selected visual adapter ${expectedModelAdapter}.`,
  )
}
for (const nonE2EToolCapabilityId of NON_E2E_TOOL_CAPABILITY_IDS) {
  assert.equal(
    approvedSnapshotScopedAdapterToolNames.includes(nonE2EToolCapabilityId) ||
      modelBackedScopedAdapterToolNames.includes(nonE2EToolCapabilityId),
    false,
    `Non-E2E capability ${nonE2EToolCapabilityId} must not enter approved snapshot tool scope.`,
  )
}
for (const expectedFoundationAdapter of boundedModelFoundationAdapterToolNames as readonly string[]) {
  assert.ok(
    modelBackedScopedAdapterToolNames.includes(expectedFoundationAdapter),
    `Model-backed visual adapters should pull in runtime foundation ${expectedFoundationAdapter}.`,
  )
  assert.equal(
    modelBackedUserVisibleCopy.includes(expectedFoundationAdapter.toLowerCase()),
    false,
    `Model-backed user-facing copy must not expose foundation package name ${expectedFoundationAdapter}.`,
  )
}

const approvedSkillExecutionPackage = createApprovedEditExecutionPackage({
  workspaceId: 'workspace-skill-smoke',
  approvedSnapshot: approvedSkillSnapshot,
  creditReservationId: 'credit-reservation-skill-smoke',
})

assert.ok(
  approvedSkillExecutionPackage.resolvedAdapterToolCount >= 4,
  'Approved execution package should derive adapter candidates from the frozen professional skill plan.',
)
assert.ok(
  approvedSkillExecutionPackage.requestedAdapterToolNames.includes('pydub'),
  'Audio cleanup skill selections should hand off known audio adapter candidates.',
)
assert.ok(
  approvedSkillExecutionPackage.requestedAdapterToolNames.includes('d3'),
  'Data visual skill selections should hand off known visual adapter candidates.',
)
assert.ok(
  approvedSkillExecutionPackage.professionalSkillTrace?.backendIntentCount,
  'Approved execution package should preserve backend intent traces from the frozen professional skill plan.',
)
assert.ok(
  (approvedSkillExecutionPackage.professionalSkillTrace?.selectionEvidence.length ?? 0) > 0,
  'Approved execution package should preserve the professional skill selection evidence trace.',
)
assert.ok(
  approvedSkillExecutionPackage.professionalSkillTrace?.selectionEvidence.some((evidence) =>
    evidence.sources.includes('user_prompt') &&
    evidence.summaries.some((summary) => /matched the user's edit request/i.test(summary))
  ),
  'Execution package skill trace should explain prompt-selected edit activities.',
)
assert.ok(
  approvedSkillExecutionPackage.professionalSkillTrace?.backendIntents.some((intent) =>
    intent.providerRoute === 'kimi_k3_provider_boundary' &&
    intent.modelRoleId === 'kimi_k3_main_edit_agent' &&
    intent.requestedModelUse === 'edit_planning'
  ),
  'Approved execution package should preserve the Kimi K3 primary edit-agent backend intent.',
)
assert.ok(
  approvedSkillExecutionPackage.professionalSkillTrace?.backendIntents.some((intent) =>
    intent.providerRoute === 'vertex_gemini_pro_visual_intelligence_boundary' &&
    intent.modelRoleId === 'visual_intelligence_gemini_pro_high' &&
    intent.requestedModelUse === 'visual_understanding'
  ),
  'Approved execution package should preserve the Visual Intelligence backend intent.',
)
assert.equal(
  approvedSkillExecutionPackage.professionalSkillTrace?.modelRoleTrace.ok,
  true,
  'Approved execution package should freeze a valid model-role trace from the approved skill plan.',
)
assert.ok(
  approvedSkillExecutionPackage.professionalSkillTrace?.modelRoleTrace.roles.some((role) =>
    role.modelRoleId === 'kimi_k3_main_edit_agent' &&
    role.canonicalProviderModel === 'kimi-k3' &&
    role.requestedUses.includes('edit_planning') &&
    role.userReasoningAllowed &&
    role.editPlanningAllowed &&
    role.toolCodeAllowed
  ),
  'Approved execution package should preserve the Kimi K3 primary edit-agent role boundary.',
)
assert.ok(
  approvedSkillExecutionPackage.professionalSkillTrace?.modelRoleTrace.roles.some((role) =>
    role.modelRoleId === 'visual_intelligence_gemini_pro_high' &&
    role.canonicalProviderModel === 'gemini-3.1-pro-preview' &&
    role.requestedUses.includes('visual_understanding') &&
    !role.userReasoningAllowed &&
    !role.editPlanningAllowed &&
    role.visualUnderstandingAllowed
  ),
  'Approved execution package should preserve the Visual Intelligence role boundary.',
)
assert.ok(
  approvedSkillExecutionPackage.professionalSkillTrace?.backendIntents.some((intent) =>
    intent.intentKind === 'adapter_tool_bundle' &&
    intent.hiddenAdapterToolCount > 0 &&
    intent.requiredApprovalGates.includes('backend_worker_only')
  ),
  'Approved execution package should preserve backend-gated adapter bundle intents.',
)
for (const packagingAdapterToolName of boundedRenderPackagingAdapterToolNames) {
  assert.ok(
    approvedSkillExecutionPackage.requestedAdapterToolNames.includes(packagingAdapterToolName),
    `Approved execution package should include hidden private-review packaging adapter ${packagingAdapterToolName}.`,
  )
}
assert.equal(
  approvedSkillExecutionPackage.liveExecutionReady,
  false,
  'Skill-derived adapter handoff must not enable live execution by itself.',
)
assert.equal(
  approvedSkillExecutionPackage.boundedAdapterExecutionReady,
  false,
  'Skill-derived adapter handoff must keep bounded execution blocked until package/source-truth gates pass.',
)
assert.equal(
  approvedSkillExecutionPackage.boundedAdapterReadyToolCount,
  0,
  'Skill-derived adapter handoff must not mark any bounded adapters ready without server source-truth evidence.',
)
assert.ok(
  approvedSkillExecutionPackage.boundedAdapterBlockedToolCount > 0,
  'Skill-derived adapter handoff should summarize remaining bounded adapter blockers at the package level.',
)
assert.ok(
  approvedSkillExecutionPackage.boundedAdapterBlockers.some((blocker) => /package\/runtime readiness/i.test(blocker)),
  'Package-level bounded adapter blockers should explain package/runtime readiness requirements.',
)
assert.ok(
  approvedSkillExecutionPackage.backendHandoffSummary.includes('Bounded adapter gate ready: 0; blocked:'),
  'Backend handoff summary should expose bounded adapter readiness counts.',
)
assert.equal(
  approvedSkillExecutionPackage.boundedAdapterExecutionGate?.frontendExecutionAllowed,
  false,
  'Skill-derived adapter handoff must preserve frontend execution prohibition.',
)
assert.equal(
  /librosa|pydub|d3|qwen|deepseek|mirelo|mmaudio/i.test(JSON.stringify(approvedSkillExecutionPackage.professionalSkillTrace?.selectionEvidence ?? [])),
  false,
  'Execution package selection evidence must stay user-facing and hide adapter/model names.',
)

const broadAudioMusicSkillPlannerInput: PlannerInput = {
  ...approvedSkillPlannerInput,
  projectName: 'Broad audio music skill routing smoke',
  customInstructions: [
    'Clean the voice audio and reduce background noise, room tone, hiss, and hum.',
    'Check clipping, peaking, loudness, sample rate, resample, and audio format safety.',
    'Duck music under voice, add story-based sound effects, and keep speech clear.',
    'Plan beat grid, beat sync, energy curve, MIDI song structure, chord, melody, and music timing where relevant.',
  ].join(' '),
}
const broadAudioMusicPlan = createMockEditPlan(broadAudioMusicSkillPlannerInput)
const broadAudioMusicSnapshot = createApprovedPlanSnapshot({
  approvedBy: 'skill-smoke-user',
  editSessionId: 'broad-audio-music-skill-smoke-edit-session',
  plan: broadAudioMusicPlan,
  projectId: 'project-broad-audio-music-skill-smoke',
})
const broadAudioMusicScopedAdapterToolNames = resolveApprovedSnapshotInternalTestAdapterToolNames(broadAudioMusicSnapshot)
const broadAudioMusicExecutionPackage = createApprovedEditExecutionPackage({
  workspaceId: 'workspace-broad-audio-music-skill-smoke',
  approvedSnapshot: broadAudioMusicSnapshot,
  creditReservationId: 'credit-reservation-broad-audio-music-skill-smoke',
})
const broadAudioMusicBackendIntents = broadAudioMusicPlan.professionalSkillPlan?.backendIntents ?? []
const broadAudioMusicUserVisibleCopy = [
  broadAudioMusicPlan.professionalSkillPlan?.userFacingSummary,
  ...(broadAudioMusicPlan.professionalSkillPlan?.userFacingActivities ?? []),
  ...(broadAudioMusicPlan.professionalSkillPlan?.activityGroups ?? []).flatMap((group) => [
    group.label,
    group.userFacingSummary,
  ]),
].join('\n').toLowerCase()

for (const audioMusicAdapterToolName of readyAudioMusicAdapterToolNames) {
  assert.ok(
    broadAudioMusicScopedAdapterToolNames.includes(audioMusicAdapterToolName),
    `Broad audio/music edit direction should carry hidden adapter ${audioMusicAdapterToolName} into the approved snapshot handoff.`,
  )
  assert.ok(
    broadAudioMusicExecutionPackage.requestedAdapterToolNames.includes(audioMusicAdapterToolName),
    `Broad audio/music edit direction should carry hidden adapter ${audioMusicAdapterToolName} into the execution package handoff.`,
  )
  assert.equal(
    broadAudioMusicUserVisibleCopy.includes(audioMusicAdapterToolName.toLowerCase()),
    false,
    `Broad audio/music user-facing copy must not expose package name ${audioMusicAdapterToolName}.`,
  )
}
assert.ok(
  broadAudioMusicPlan.professionalSkillPlan?.activityGroups.some((group) => group.label === 'Audio cleanup'),
  'Broad audio/music planning should show audio cleanup as a user-facing edit area.',
)
assert.ok(
  broadAudioMusicPlan.professionalSkillPlan?.activityGroups.some((group) => group.label === 'Music and sound'),
  'Broad audio/music planning should show music and sound as a user-facing edit area.',
)
assert.ok(
  broadAudioMusicBackendIntents.some((intent) =>
    intent.providerRoute === 'mirelo_sfx_v1_5' &&
    intent.generationType === 'sfx_asset' &&
    intent.outputAssetType === 'generated_audio'
  ),
  'Story-based sound planning must carry the canonical Mirelo generated-audio provider intent.',
)
assert.ok(
  broadAudioMusicBackendIntents.some((intent) =>
    intent.providerRoute === 'mmaudio_v2' &&
    intent.generationType === 'sfx_asset' &&
    intent.outputAssetType === 'generated_audio'
  ),
  'Story-based sound planning must carry the canonical MMAudio generated-audio fallback provider intent.',
)
assert.equal(
  broadAudioMusicBackendIntents.every((intent) => validateProfessionalSkillBackendIntent(intent).ok),
  true,
  'Broad audio/music backend intents must validate against provider gateway contracts.',
)
assert.equal(
  /mirelo|mmaudio|librosa|pydub|audioflux/i.test(broadAudioMusicUserVisibleCopy),
  false,
  'Broad audio/music user-facing copy must hide provider and adapter names.',
)
assert.ok(
  broadAudioMusicExecutionPackage.professionalSkillTrace?.backendIntents.some((intent) =>
    intent.providerRoute === 'mirelo_sfx_v1_5' &&
    intent.generationType === 'sfx_asset' &&
    intent.outputAssetType === 'generated_audio'
  ),
  'Approved execution package should preserve the Mirelo generated-audio backend intent.',
)
assert.ok(
  broadAudioMusicExecutionPackage.professionalSkillTrace?.backendIntents.some((intent) =>
    intent.providerRoute === 'mmaudio_v2' &&
    intent.generationType === 'sfx_asset' &&
    intent.outputAssetType === 'generated_audio'
  ),
  'Approved execution package should preserve the MMAudio generated-audio backend intent.',
)
assert.equal(
  broadAudioMusicExecutionPackage.userFacingSummary.toLowerCase().includes('mirelo') ||
    broadAudioMusicExecutionPackage.userFacingSummary.toLowerCase().includes('mmaudio'),
  false,
  'Execution package user-facing summary must not expose audio provider names.',
)
assert.equal(
  broadAudioMusicExecutionPackage.liveExecutionReady,
  false,
  'Broad audio/music skill handoff must not enable live execution by itself.',
)
assert.equal(
  broadAudioMusicExecutionPackage.boundedAdapterExecutionGate?.frontendExecutionAllowed,
  false,
  'Broad audio/music skill handoff must preserve backend-only adapter execution.',
)

const broadVisualMotionSkillPlannerInput: PlannerInput = {
  ...approvedSkillPlannerInput,
  projectName: 'Broad visual motion skill routing smoke',
  editLevel: 'premium',
  customInstructions: [
    'Add precise charts, graphs, data timelines, framework diagrams, and graph diagram visuals only when they help.',
    'Use exact text cards, callout labels, overlays, vector layers, lottie motion, kinetic animation, and 2D motion graphics.',
    'Plan a controlled 3D product mockup scene if it is worth the complexity.',
    'Remove the background behind the subject, create a cutout mask, keep text behind the person, and refine mask edges.',
    'Enhance blurry low-quality source moments, upscale safely, and keep cinematic color consistency.',
  ].join(' '),
}
const broadVisualMotionPlan = createMockEditPlan(broadVisualMotionSkillPlannerInput)
const broadVisualMotionHiddenAdapterToolNames = new Set([
  ...(broadVisualMotionPlan.professionalSkillPlan?.hiddenAdapterToolNames ?? []),
  ...(broadVisualMotionPlan.professionalSkillPlan?.selectedSkills ?? []).flatMap((skill) => skill.hiddenAdapterToolNames),
])
const broadVisualMotionUserVisibleCopy = [
  broadVisualMotionPlan.professionalSkillPlan?.userFacingSummary,
  ...(broadVisualMotionPlan.professionalSkillPlan?.userFacingActivities ?? []),
  ...(broadVisualMotionPlan.professionalSkillPlan?.activityGroups ?? []).flatMap((group) => [
    group.label,
    group.userFacingSummary,
  ]),
].join('\n').toLowerCase()

for (const visualMotionAdapterToolName of readyVisualMotionVisionAdapterToolNames) {
  assert.ok(
    broadVisualMotionHiddenAdapterToolNames.has(visualMotionAdapterToolName),
    `Broad visual/motion edit direction should select hidden adapter ${visualMotionAdapterToolName} before approval.`,
  )
  assert.equal(
    broadVisualMotionUserVisibleCopy.includes(visualMotionAdapterToolName.toLowerCase()),
    false,
    `Broad visual/motion user-facing copy must not expose package name ${visualMotionAdapterToolName}.`,
  )
}
for (const visualMotionArea of ['Charts and diagrams', 'Motion design', 'Masking and enhancement', 'Color and image']) {
  assert.ok(
    broadVisualMotionPlan.professionalSkillPlan?.activityGroups.some((group) => group.label === visualMotionArea),
    `Broad visual/motion planning should show ${visualMotionArea} as a user-facing edit area.`,
  )
}
assert.equal(
  broadVisualMotionPlan.professionalSkillPlan?.status,
  'needs_review',
  'Model-backed visual planning must stay needs-review until model/checkpoint gates pass.',
)
assert.ok(
  broadVisualMotionPlan.professionalSkillPlan?.blockers.some((blocker) => /model\/checkpoint approval/i.test(blocker)),
  'Broad visual/motion planning must preserve model/checkpoint approval blockers.',
)
const broadVisualMotionSnapshot = createApprovedPlanSnapshot({
  approvedBy: 'skill-smoke-user',
  editSessionId: 'broad-visual-motion-skill-smoke-edit-session',
  plan: broadVisualMotionPlan,
  projectId: 'project-broad-visual-motion-skill-smoke',
})
assert.ok(
  broadVisualMotionSnapshot.professionalSkillPlan?.blockers.some((blocker) =>
    /model\/checkpoint approval/i.test(blocker)
  ),
  'The immutable snapshot may freeze complex visual intent, but it must preserve the model/checkpoint blocker for the later execution gate.',
)

const packagingSkillPlannerInput: PlannerInput = {
  ...approvedSkillPlannerInput,
  projectName: 'Private review packaging skill routing smoke',
  customInstructions: 'Package a private review MP4, validate container packaging, and check the private review download before sharing.',
}
const packagingPlan = createMockEditPlan(packagingSkillPlannerInput)
const packagingSnapshot = createApprovedPlanSnapshot({
  approvedBy: 'skill-smoke-user',
  editSessionId: 'packaging-skill-smoke-edit-session',
  plan: packagingPlan,
  projectId: 'project-packaging-skill-smoke',
})
const packagingScopedAdapterToolNames = resolveApprovedSnapshotInternalTestAdapterToolNames(packagingSnapshot)
for (const packagingAdapterToolName of boundedRenderPackagingAdapterToolNames) {
  assert.ok(
    packagingScopedAdapterToolNames.includes(packagingAdapterToolName),
    `Private review packaging should carry hidden packaging adapter ${packagingAdapterToolName}.`,
  )
}

const rendererBriefSkillPlan = createProfessionalSkillPlan({
  plannerInput: {
    ...approvedSkillPlannerInput,
    projectName: 'Renderer backend intent smoke',
    customInstructions: 'Prepare a renderer brief and Remotion motion brief after approval.',
  },
})
assert.ok(
  rendererBriefSkillPlan.backendIntents.some((intent) =>
    intent.providerRoute === 'kimi_k3_provider_boundary' &&
    intent.modelRoleId === 'kimi_k3_main_edit_agent' &&
    intent.requestedModelUse === 'remotion_draft'
  ),
  'Renderer-brief planning must carry Kimi K3 as its primary backend-gated coding/Remotion route.',
)
assert.ok(
  rendererBriefSkillPlan.backendIntents.some((intent) =>
    intent.providerRoute === 'deepseek_v4_pro_tool_code_boundary' &&
    intent.modelRoleId === 'deepseek_v4_tool_code_agent' &&
    intent.requestedModelUse === 'remotion_draft'
  ),
  'Renderer-brief planning must preserve DeepSeek as the final backend-gated Remotion fallback.',
)
assert.equal(
  rendererBriefSkillPlan.backendIntents.every((intent) => validateProfessionalSkillBackendIntent(intent).ok),
  true,
  'Renderer backend intents must validate against provider gateway model-role contracts.',
)
assert.equal(
  rendererBriefSkillPlan.backendIntents.some((intent) =>
    intent.modelRoleId === 'deepseek_v4_tool_code_agent' &&
    intent.requestedModelUse === 'user_reasoning'
  ),
  false,
  'DeepSeek backend intents must never request user reasoning.',
)

console.log(JSON.stringify({
  ok: true,
  definitionCount: definitions.length,
  familyCount: families.length,
  hiddenAdapterNameCount: hiddenAdapterNames.length,
  adapterContractCount: adapterContracts.length,
  selectedSkillCount: plan.selectedSkillCount,
  selectedFamilies: plan.selectedFamilies,
  backendIntentCount: plan.backendIntents.length,
  approvedSnapshotSkillCount: approvedSkillSnapshot.professionalSkillPlan?.selectedSkillCount,
  approvedSnapshotScopedAdapterToolCount: approvedSnapshotScopedAdapterToolNames.length,
  modelBackedScopedAdapterToolCount: modelBackedScopedAdapterToolNames.length,
  skillDerivedAdapterCount: approvedSkillExecutionPackage.resolvedAdapterToolCount,
  broadAudioMusicScopedAdapterToolCount: broadAudioMusicScopedAdapterToolNames.length,
  broadAudioMusicRequestedAdapterToolCount: broadAudioMusicExecutionPackage.requestedAdapterToolNames.length,
  broadAudioMusicBackendIntentCount: broadAudioMusicBackendIntents.length,
  broadVisualMotionHiddenAdapterToolCount: broadVisualMotionHiddenAdapterToolNames.size,
  packagingScopedAdapterToolCount: packagingScopedAdapterToolNames.length,
  rendererBriefBackendIntentCount: rendererBriefSkillPlan.backendIntents.length,
  boundedAdapterReadyToolCount: approvedSkillExecutionPackage.boundedAdapterReadyToolCount,
  boundedAdapterBlockedToolCount: approvedSkillExecutionPackage.boundedAdapterBlockedToolCount,
  status: plan.status,
  editBriefOptional: plan.editBriefOptional,
  hiddenAdapterToolCount: plan.hiddenAdapterToolNames.length,
}, null, 2))
