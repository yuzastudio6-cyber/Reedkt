import assert from 'node:assert/strict'

import {
  boundedAudioMusicAdapterToolNames,
  boundedAudioCleanupModelAdapterToolNames,
  boundedDataVisualAdapterToolNames,
  boundedInternalAdapterToolNames,
  boundedMapBrowserColorSceneAdapterToolNames,
  boundedModelFoundationAdapterToolNames,
  boundedMotionAdapterToolNames,
  boundedRenderPackagingAdapterToolNames,
  boundedSpeechModelAdapterToolNames,
  boundedVisionModelAdapterToolNames,
  listProfessionalSkillDefinitions,
  listProfessionalSkillHiddenAdapterNames,
} from '../../src/lib/professional-skills'
import {
  buildProfessionalToolArchitectureProgramMap,
  listProfessionalToolAdapterNames,
  normalizeRequestedToolName,
  resolveProfessionalToolProgramEntry,
  type ProfessionalToolProgramGroupId,
} from '../tool-registry'

const map = buildProfessionalToolArchitectureProgramMap()

assert.equal(map.summary.productionRegistryToolCount, 72, 'Production registry count must stay explicit.')
assert.equal(map.summary.launchCoreRegistryToolCount, 24, 'Launch-core registry count must stay explicit.')
assert.equal(
  map.summary.boundedInternalAdapterContractCount,
  boundedInternalAdapterToolNames.length,
  'Bounded adapter contract count must match the approved internal adapter group.',
)
assert.equal(
  map.summary.boundedInternalAdapterContractCount,
  50,
  'The current bounded internal adapter pack must stay visible as 50+ tools, not collapse to one readiness gap.',
)
assert.equal(
  map.summary.professionalSkillCount,
  listProfessionalSkillDefinitions().length,
  'Professional skill count must come from the skill registry.',
)
assert.ok(
  map.summary.professionalSkillCount >= 100,
  'The skill layer must preserve the broad 100+ professional skill surface.',
)
assert.equal(
  map.summary.hiddenSkillAdapterNameCount,
  listProfessionalSkillHiddenAdapterNames().length,
  'Hidden adapter count must come from the skill registry.',
)
assert.equal(
  map.summary.skillArchitectureIntegratedToolNameCount,
  55,
  'The skill architecture-integrated tool surface must stay visible as 55 names.',
)
assert.equal(
  map.summary.boundedBackendAdapterWiredCount,
  50,
  'The bounded backend adapter-wired count must stay visible as 50 contracts.',
)
assert.equal(
  map.summary.ownerLaneSourceTruthAcceptedToolCount,
  13,
  'Owner-lane launch-core and support tools must be accepted as source truth instead of re-approved by this lane.',
)
assert.equal(
  map.summary.launchCoreRegistryOnlyWiredCount,
  9,
  'Launch-core owner-lane tools must be separated from bounded adapters.',
)
assert.equal(
  map.summary.ownerLaneRegistrySupportAcceptedToolCount,
  4,
  'Owner-lane support registry tools must be accepted as source truth instead of sitting in this lane backlog.',
)
assert.equal(
  map.summary.skillReferenceOnlyToolNameCount,
  0,
  'Skill reference-only tools must be separated from bounded adapters.',
)
assert.equal(
  map.summary.registryNamedOnlyToolCount,
  9,
  'Only genuinely unresolved registry named-only tools must remain separated from skill/adapter/owner-lane integrated tools.',
)
assert.equal(
  map.summary.promotionBacklogItemCount,
  9,
  'Only genuinely ambiguous registry-named tools should remain in the promotion backlog.',
)
assert.equal(
  map.summary.registryNamedOnlyModelManifestLaneCount,
  4,
  'Registry-only model/checkpoint lanes must stay explicit.',
)
assert.equal(
  map.summary.registryNamedOnlyScopeDecisionCount,
  0,
  'Owner-lane support tools must not remain as this lane scope-decision backlog.',
)
assert.equal(
  map.summary.registryNamedOnlyEvaluationHoldCount,
  5,
  'Registry-only evaluation/not-selected lanes must stay explicit.',
)
assert.equal(
  map.summary.sourceTruthStatusCounts.bounded_adapter_source_truth_ready,
  42,
  'Bounded adapter source-truth-ready tools must stay explicit.',
)
assert.equal(
  map.summary.sourceTruthStatusCounts.bounded_adapter_manifest_evidence_required,
  8,
  'Model-backed bounded adapters must keep manifest-evidence status visible.',
)
assert.equal(
  map.summary.sourceTruthStatusCounts.owner_lane_source_truth_accepted,
  13,
  'Owner-lane accepted source-truth status must stay explicit.',
)
assert.equal(
  map.summary.sourceTruthStatusCounts.skill_reference_contract_required,
  0,
  'Skill-reference-only contract-required status must stay at zero.',
)
assert.equal(
  map.summary.sourceTruthStatusCounts.registry_only_model_manifest_required,
  4,
  'Registry-only model/checkpoint status must stay explicit.',
)
assert.equal(
  map.summary.sourceTruthStatusCounts.registry_only_scope_decision_required,
  0,
  'Owner-lane support tools must not remain as registry-only scope-decision status.',
)
assert.equal(
  map.summary.sourceTruthStatusCounts.registry_only_evaluation_hold,
  5,
  'Registry-only evaluation-hold status must stay explicit.',
)
assert.ok(
  map.summary.hiddenSkillAdapterNameCount >= 53,
  'The architecture map must preserve the broad user/tool program surface instead of reporting only Track B 16.',
)
assert.equal(map.summary.productReadyToolCount, 0, 'Program map must not mark tools product-ready by default.')
assert.equal(map.summary.frontendExecutableToolCount, 0, 'Program map must not allow frontend execution.')
assert.deepEqual(
  listProfessionalToolAdapterNames(),
  [...boundedInternalAdapterToolNames],
  'Adapter contract names must match the approved bounded internal adapter group.',
)

function requireGroup(groupId: ProfessionalToolProgramGroupId, expectedCount: number) {
  const group = map.groups.find((item) => item.groupId === groupId)
  assert.ok(group, `Missing program group ${groupId}.`)
  assert.equal(group.entryCount, expectedCount, `${groupId} must preserve its exact group count.`)
  assert.equal(group.productReadyCount, 0, `${groupId} must not mark product readiness.`)
  assert.equal(group.frontendExecutionAllowedCount, 0, `${groupId} must remain backend/planning only.`)
  assert.ok(/backend|registry|Skills|source|execution/i.test(group.boundary), `${groupId} must describe an execution boundary.`)
  return group
}

requireGroup('bounded_visual_data_motion_adapters', boundedDataVisualAdapterToolNames.length + boundedMotionAdapterToolNames.length)
requireGroup('bounded_ai_vision_model_adapters', boundedModelFoundationAdapterToolNames.length + boundedVisionModelAdapterToolNames.length)
requireGroup('bounded_speech_model_adapters', boundedSpeechModelAdapterToolNames.length)
requireGroup('bounded_music_audio_adapters', boundedAudioMusicAdapterToolNames.length + boundedAudioCleanupModelAdapterToolNames.length)
requireGroup('bounded_map_browser_color_scene_adapters', boundedMapBrowserColorSceneAdapterToolNames.length)
requireGroup('bounded_render_packaging_adapters', boundedRenderPackagingAdapterToolNames.length)
requireGroup('launch_core_registry_foundation', 24)
requireGroup('owner_lane_registry_support', 4)
requireGroup('skill_hidden_adapter_surface', listProfessionalSkillHiddenAdapterNames().length)

const requiredUserNamedTools = [
  ...boundedDataVisualAdapterToolNames,
  ...boundedMotionAdapterToolNames,
  ...boundedModelFoundationAdapterToolNames,
  ...boundedVisionModelAdapterToolNames,
  ...boundedSpeechModelAdapterToolNames,
  ...boundedAudioMusicAdapterToolNames,
  ...boundedAudioCleanupModelAdapterToolNames,
  ...boundedMapBrowserColorSceneAdapterToolNames,
  ...boundedRenderPackagingAdapterToolNames,
]

for (const toolName of requiredUserNamedTools) {
  const entry = resolveProfessionalToolProgramEntry(toolName)
  assert.ok(entry, `Missing architecture map entry for ${toolName}.`)
  assert.equal(entry.sourceTruthAuthority, 'bounded_adapter_contract', `${toolName} must use bounded adapter contract source truth.`)
  assert.equal(entry.frontendExecutionAllowed, false, `${toolName} must not execute in the frontend.`)
  assert.equal(entry.productReady, false, `${toolName} must not be product-ready by adapter mapping alone.`)
  assert.ok(entry.requiresApprovedSnapshot, `${toolName} must require an approved snapshot.`)
  assert.ok(entry.groupIds.length > 0, `${toolName} must belong to a visible architecture group.`)
}

const aliasExpectations = new Map([
  ['three', 'three_js'],
  ['pixi_js', 'pixijs'],
  ['babylonjs', 'babylon_js'],
  ['lottie_web', 'lottie'],
])

for (const [requestedName, canonicalToolId] of aliasExpectations) {
  const entry = resolveProfessionalToolProgramEntry(requestedName)
  assert.equal(entry?.canonicalToolId, canonicalToolId, `${requestedName} must resolve to ${canonicalToolId}.`)
}

for (const modelTool of ['sam2', 'birefnet', 'rembg', 'transparent_background', 'real_esrgan', 'faster_whisper', 'whisper_cpp', 'deepfilternet']) {
  const entry = resolveProfessionalToolProgramEntry(modelTool)
  assert.equal(entry?.stage, 'model_backed_adapter_ready_requires_owner_manifest_evidence', `${modelTool} must keep owner manifest evidence gates.`)
  assert.equal(entry?.sourceTruthStatus, 'bounded_adapter_manifest_evidence_required', `${modelTool} must expose manifest evidence as its source-truth status.`)
  assert.equal(entry?.nextGate, 'approved_runtime_gate_with_model_manifest_evidence', `${modelTool} must point to the runtime manifest evidence gate.`)
  assert.equal(entry?.requiresModelWeightApproval, true, `${modelTool} must require model/checkpoint approval.`)
}

for (const foundationTool of boundedModelFoundationAdapterToolNames) {
  const entry = resolveProfessionalToolProgramEntry(foundationTool)
  assert.equal(entry?.stage, 'readiness_check_only', `${foundationTool} must remain readiness-check only.`)
  assert.equal(
    entry?.implementationTier,
    'skill_architecture_and_bounded_adapter_wired',
    `${foundationTool} must still be part of the bounded adapter pack even though it is readiness-only.`,
  )
}

for (const hiddenName of ['ffmpeg', 'ffprobe', 'libass', 'opencv']) {
  assert.ok(
    map.summary.hiddenSkillAdapterNamesWithoutBoundedContracts
      .map(normalizeRequestedToolName)
      .includes(normalizeRequestedToolName(hiddenName)),
    `${hiddenName} should remain tracked as a hidden skill adapter outside the bounded adapter pack.`,
  )
}

for (const launchCoreOnlyName of ['ffmpeg', 'ffprobe', 'hyperframe', 'libass', 'opencv', 'opentimelineio', 'remotion', 'sharp', 'signalsmith_stretch']) {
  const entry = resolveProfessionalToolProgramEntry(launchCoreOnlyName)
  assert.equal(
    entry?.implementationTier,
    'owner_lane_source_truth_accepted_runtime_gated',
    `${launchCoreOnlyName} must be accepted owner-lane source truth, not re-approved by this adapter lane.`,
  )
  assert.equal(
    entry?.stage,
    'launch_core_registry_owner_source_accepted',
    `${launchCoreOnlyName} must preserve owner-lane accepted source-truth status.`,
  )
  assert.equal(
    entry?.sourceTruthStatus,
    'owner_lane_source_truth_accepted',
    `${launchCoreOnlyName} must expose accepted owner-lane source-truth status.`,
  )
  assert.equal(
    entry?.sourceTruthAuthority,
    'owner_lane_launch_core',
    `${launchCoreOnlyName} must preserve owner-lane source-truth authority.`,
  )
  assert.equal(
    entry?.nextGate,
    'owner_lane_runtime_gate',
    `${launchCoreOnlyName} must route future work through the owner-lane runtime gate.`,
  )
  assert.ok(
    entry?.blockers.some((blocker) => /accepted as owner-lane/i.test(blocker)),
    `${launchCoreOnlyName} must explain that owner-lane source truth is accepted.`,
  )
}

for (const ownerLaneSupportName of ['pyav', 'duckdb', 'polars', 'vapoursynth']) {
  const entry = resolveProfessionalToolProgramEntry(ownerLaneSupportName)
  assert.equal(
    entry?.implementationTier,
    'owner_lane_source_truth_accepted_runtime_gated',
    `${ownerLaneSupportName} must be accepted owner-lane source truth, not re-approved by this adapter lane.`,
  )
  assert.equal(
    entry?.stage,
    'owner_lane_registry_support_source_accepted',
    `${ownerLaneSupportName} must preserve owner-lane support source-truth status.`,
  )
  assert.equal(
    entry?.sourceTruthStatus,
    'owner_lane_source_truth_accepted',
    `${ownerLaneSupportName} must expose accepted owner-lane source-truth status.`,
  )
  assert.equal(
    entry?.sourceTruthAuthority,
    'owner_lane_registry_support',
    `${ownerLaneSupportName} must preserve owner-lane support source-truth authority.`,
  )
  assert.equal(
    entry?.nextGate,
    'owner_lane_runtime_gate',
    `${ownerLaneSupportName} must route future work through the owner-lane runtime gate.`,
  )
  assert.ok(
    entry?.blockers.some((blocker) => /accepted as owner-lane/i.test(blocker)),
    `${ownerLaneSupportName} must explain that owner-lane source truth is accepted.`,
  )
  assert.equal(
    map.promotionBacklog.some((item) => item.requestedToolName === ownerLaneSupportName),
    false,
    `${ownerLaneSupportName} must not be treated as this lane's unresolved promotion backlog.`,
  )
}

const registryNamedOnlyExpectations = new Map([
  ['paddleocr', ['registry_only_model_manifest_required', 'exact_model_weight_owner_manifest_review']],
  ['mediapipe', ['registry_only_model_manifest_required', 'exact_model_weight_owner_manifest_review']],
  ['demucs', ['registry_only_model_manifest_required', 'exact_model_weight_owner_manifest_review']],
  ['film', ['registry_only_model_manifest_required', 'exact_model_weight_owner_manifest_review']],
  ['soundtouch', ['registry_only_evaluation_hold', 'owner_scope_decision_keep_or_remove']],
  ['rubber_band', ['registry_only_evaluation_hold', 'owner_scope_decision_keep_or_remove']],
  ['essentia', ['registry_only_evaluation_hold', 'owner_scope_decision_keep_or_remove']],
  ['cesium_js', ['registry_only_evaluation_hold', 'owner_scope_decision_keep_or_remove']],
  ['revideo', ['registry_only_evaluation_hold', 'owner_scope_decision_keep_or_remove']],
] as const)

for (const [registryNamedOnlyName, [sourceTruthStatus, nextGate]] of registryNamedOnlyExpectations) {
  const entry = resolveProfessionalToolProgramEntry(registryNamedOnlyName)
  assert.equal(
    entry?.implementationTier,
    'registry_named_only_not_skill_or_adapter_wired',
    `${registryNamedOnlyName} must be classified as registry named-only, not architecture implemented.`,
  )
  assert.equal(entry?.sourceTruthAuthority, 'production_registry_name_only', `${registryNamedOnlyName} must be production-registry-only source truth.`)
  assert.equal(entry?.sourceTruthStatus, sourceTruthStatus, `${registryNamedOnlyName} must expose the right source-truth status.`)
  assert.equal(entry?.nextGate, nextGate, `${registryNamedOnlyName} must expose the right next gate.`)
}

function requireBacklog(toolName: string, expectedNextGate: string) {
  const item = map.promotionBacklog.find((backlogItem) => backlogItem.requestedToolName === toolName)
  assert.ok(item, `Missing promotion backlog item for ${toolName}.`)
  assert.equal(item.recommendedNextGate, expectedNextGate, `${toolName} must have the right next gate.`)
  assert.ok(item.requiredEvidence.length > 0, `${toolName} must list required evidence before promotion.`)
  assert.ok(item.notes.length > 0, `${toolName} must explain why it is not implemented yet.`)
  return item
}

requireBacklog('paddleocr', 'exact_model_weight_owner_manifest_review')
requireBacklog('mediapipe', 'exact_model_weight_owner_manifest_review')
requireBacklog('demucs', 'exact_model_weight_owner_manifest_review')
requireBacklog('film', 'exact_model_weight_owner_manifest_review')
requireBacklog('soundtouch', 'owner_scope_decision_keep_or_remove')
requireBacklog('rubber_band', 'owner_scope_decision_keep_or_remove')
requireBacklog('essentia', 'owner_scope_decision_keep_or_remove')
requireBacklog('cesium_js', 'owner_scope_decision_keep_or_remove')
requireBacklog('revideo', 'owner_scope_decision_keep_or_remove')

for (const ownerLaneToolName of ['ffmpeg', 'ffprobe', 'hyperframe', 'libass', 'opencv', 'opentimelineio', 'remotion', 'sharp', 'signalsmith_stretch']) {
  assert.equal(
    map.promotionBacklog.some((item) => item.requestedToolName === ownerLaneToolName),
    false,
    `${ownerLaneToolName} must not be treated as this lane's unresolved promotion backlog.`,
  )
}

for (const ownerLaneSupportName of ['pyav', 'duckdb', 'polars', 'vapoursynth']) {
  assert.equal(
    map.promotionBacklog.some((item) => item.requestedToolName === ownerLaneSupportName),
    false,
    `${ownerLaneSupportName} must not be treated as this lane's unresolved promotion backlog.`,
  )
}

for (const promotedName of ['deck_gl', 'deepfilternet', 'faster_whisper', 'maplibre', 'opencolorio', 'openimageio', 'playwright', 'pyscenedetect', 'rnnoise', 'turf', 'whisper_cpp']) {
  const entry = resolveProfessionalToolProgramEntry(promotedName)
  assert.equal(
    entry?.implementationTier,
    'skill_architecture_and_bounded_adapter_wired',
    `${promotedName} must now be classified as adapter-wired from owner/source-truth lanes.`,
  )
  assert.equal(entry?.sourceTruthAuthority, 'bounded_adapter_contract', `${promotedName} must expose bounded adapter source-truth authority.`)
}

assert.ok(
  map.entries.some((entry) => entry.requestedToolName === 'signalsmith_stretch' && entry.groupIds.includes('launch_core_registry_foundation')),
  'Signalsmith Stretch must remain visible as launch-core registry foundation work, not as the whole remaining tool scope.',
)

for (const entry of map.entries) {
  assert.equal(entry.frontendExecutionAllowed, false, `${entry.requestedToolName} must keep frontend execution blocked.`)
  assert.equal(entry.productReady, false, `${entry.requestedToolName} must not claim product readiness from mapping.`)
  assert.ok(!entry.userFacingActivity || !entry.userFacingActivity.toLowerCase().includes(normalizeRequestedToolName(entry.requestedToolName)), `${entry.requestedToolName} should use activity copy rather than raw tool ID.`)
}
