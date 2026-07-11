import assert from 'node:assert/strict'

import {
  approvedSnapshotInternalTestAdapterToolNames,
  boundedAudioCleanupModelAdapterToolNames,
  boundedAudioMusicAdapterToolNames,
  boundedDataVisualAdapterToolNames,
  boundedMapBrowserColorSceneAdapterToolNames,
  boundedModelFoundationAdapterToolNames,
  boundedRenderPackagingAdapterToolNames,
  boundedSpeechModelAdapterToolNames,
  boundedVisualMotionAdapterToolNames,
} from '../../src/lib/professional-skills'
import {
  PRODUCTION_TOOL_IDS,
  createProfessionalToolAdapterOrchestrationPlan,
  createProfessionalToolAdapterPlan,
  evaluateProfessionalToolAdapterProductReadiness,
  listProfessionalToolAdapterContracts,
  listProfessionalToolAdapterNames,
  resolveProfessionalToolAdapterContract,
  summarizeProfessionalToolAdapterContracts,
  type ProductionToolId,
} from '../tool-registry'

const requestedToolNames = approvedSnapshotInternalTestAdapterToolNames

const contracts = listProfessionalToolAdapterContracts()
const summary = summarizeProfessionalToolAdapterContracts()
const adapterNames = listProfessionalToolAdapterNames()

assert.equal(contracts.length, requestedToolNames.length, 'Every newly ready requested tool must have one adapter contract.')
assert.equal(summary.totalContracts, requestedToolNames.length, 'Summary must count every requested adapter contract.')
assert.equal(summary.productReadyContracts, 0, 'Adapter wiring must not mark tools product-ready.')
assert.deepEqual(
  adapterNames,
  [...requestedToolNames],
  'Adapter name list must match the approved snapshot adapter resolver used by the editor.',
)

const expectedCanonical = new Map<string, ProductionToolId>([
  ['three', 'three_js'],
  ['pixi_js', 'pixijs'],
  ['lottie_web', 'lottie'],
  ['babylonjs', 'babylon_js'],
])

for (const name of requestedToolNames) {
  const contract = resolveProfessionalToolAdapterContract(name)
  assert.ok(contract, `Missing adapter contract for ${name}.`)
  assert.ok(PRODUCTION_TOOL_IDS.includes(contract.canonicalToolId), `${name} resolves to an unknown production tool.`)
  assert.equal(contract.frontendExecutionAllowed, false, `${name} must not execute from the frontend.`)
  assert.equal(contract.requiresApprovedSnapshot, true, `${name} must require approved snapshots.`)
  assert.equal(contract.productReady, false, `${name} must default to not product-ready without source-truth evidence.`)
  assert.ok(contract.productReadiness.blockers.length > 0, `${name} must expose missing product-readiness evidence.`)
  assert.ok(contract.qaGates.length > 0, `${name} must declare QA gates.`)
  assert.ok(contract.userFacingActivity.length > 0, `${name} needs user-facing activity copy.`)
  assert.ok(!contract.userFacingActivity.toLowerCase().includes(name.replace(/_/g, ' ')), `${name} user copy should describe the edit activity, not the library name.`)

  const expected = expectedCanonical.get(name)
  if (expected) {
    assert.equal(contract.canonicalToolId, expected, `${name} must resolve to canonical production ID ${expected}.`)
  }
}

for (const modelBackedName of ['sam2', 'birefnet', 'rembg', 'transparent_background', 'real_esrgan', 'faster_whisper', 'whisper_cpp', 'deepfilternet']) {
  const contract = resolveProfessionalToolAdapterContract(modelBackedName)
  assert.ok(contract?.requiresModelWeightApproval, `${modelBackedName} must keep model-weight approval gates.`)
  assert.ok(contract?.modes.includes('blocked_until_model_weight_ready'), `${modelBackedName} must expose model-weight blocker mode.`)
  assert.equal(contract?.productReady, false, `${modelBackedName} must not be product-ready from adapter wiring alone.`)
}

const completeProductReadinessEvidence = {
  approvedPlanSnapshotContractReady: true,
  packageRuntimeReady: true,
  privateArtifactPolicyReady: true,
  qaGatePolicyReady: true,
  backendWorkerRunnerReady: true,
  costGateReady: true,
  modelWeightApprovalReady: true,
  profilePromotionApproved: true,
  productionDeploymentReady: true,
}

const visualContract = resolveProfessionalToolAdapterContract('d3')
assert.ok(visualContract, 'd3 must resolve for product-readiness evidence smoke.')
const visualProductReadiness = evaluateProfessionalToolAdapterProductReadiness(
  visualContract,
  completeProductReadinessEvidence,
)
assert.equal(
  visualProductReadiness.productReady,
  true,
  'Non-model adapter contracts must be able to become product-ready when all evidence gates pass.',
)
assert.equal(
  visualContract.frontendExecutionAllowed,
  false,
  'Product readiness must not change the hard frontend execution boundary.',
)

const modelContract = resolveProfessionalToolAdapterContract('sam2')
assert.ok(modelContract, 'sam2 must resolve for model-weight product-readiness smoke.')
const missingModelWeightReadiness = evaluateProfessionalToolAdapterProductReadiness(modelContract, {
  ...completeProductReadinessEvidence,
  modelWeightApprovalReady: false,
})
assert.equal(
  missingModelWeightReadiness.productReady,
  false,
  'Model-backed adapter contracts must stay blocked without exact model/checkpoint approval.',
)
assert.ok(
  missingModelWeightReadiness.blockers.some((blocker) => /model\/checkpoint owner approval/i.test(blocker)),
  'Model-backed adapter contracts must report exact model/checkpoint blockers.',
)
assert.equal(
  evaluateProfessionalToolAdapterProductReadiness(modelContract, completeProductReadinessEvidence).productReady,
  true,
  'Model-backed adapter contracts can become product-ready only after exact model/checkpoint approval is supplied.',
)

for (const foundationName of boundedModelFoundationAdapterToolNames) {
  const contract = resolveProfessionalToolAdapterContract(foundationName)
  assert.equal(contract?.capabilityFamily, 'model_runtime_foundation', `${foundationName} must be a runtime foundation, not a user edit tool.`)
  assert.deepEqual(contract?.modes, ['readiness_check'], `${foundationName} must be readiness-only.`)
  assert.equal(contract?.requiresPrivateArtifacts, false, `${foundationName} should not require source media artifacts by itself.`)
}

for (const visualName of boundedDataVisualAdapterToolNames) {
  const contract = resolveProfessionalToolAdapterContract(visualName)
  assert.ok(
    contract?.capabilityFamily === 'data_visual_layer' || contract?.capabilityFamily === 'vector_motion_layer',
    `${visualName} must resolve to a data/vector visual layer.`,
  )
}

for (const audioName of boundedAudioMusicAdapterToolNames) {
  const contract = resolveProfessionalToolAdapterContract(audioName)
  assert.ok(
    contract?.capabilityFamily === 'audio_analysis_layer' ||
      contract?.capabilityFamily === 'audio_processing_layer' ||
      contract?.capabilityFamily === 'music_timing_layer' ||
      contract?.capabilityFamily === 'loudness_qa_layer',
    `${audioName} must resolve to a music/audio adapter layer.`,
  )
  assert.equal(contract?.requiresPrivateArtifacts, true, `${audioName} must require private audio/source artifacts before execution.`)
}

for (const speechName of boundedSpeechModelAdapterToolNames) {
  const contract = resolveProfessionalToolAdapterContract(speechName)
  assert.equal(contract?.capabilityFamily, 'speech_transcript_layer', `${speechName} must resolve to the speech transcript adapter layer.`)
  assert.equal(contract?.requiresPrivateArtifacts, true, `${speechName} must require private audio/source artifacts before execution.`)
  assert.equal(contract?.requiresModelWeightApproval, true, `${speechName} must require owner manifest evidence before execution.`)
}

for (const modelAudioName of boundedAudioCleanupModelAdapterToolNames) {
  const contract = resolveProfessionalToolAdapterContract(modelAudioName)
  assert.equal(contract?.capabilityFamily, 'audio_processing_layer', `${modelAudioName} must resolve to the audio processing adapter layer.`)
  assert.equal(contract?.requiresPrivateArtifacts, true, `${modelAudioName} must require private audio/source artifacts before execution.`)
  assert.equal(contract?.requiresModelWeightApproval, true, `${modelAudioName} must require owner manifest evidence before execution.`)
}

for (const mapBrowserColorSceneName of boundedMapBrowserColorSceneAdapterToolNames) {
  const contract = resolveProfessionalToolAdapterContract(mapBrowserColorSceneName)
  assert.ok(
    contract?.capabilityFamily === 'map_geospatial_layer' ||
      contract?.capabilityFamily === 'browser_capture_layer' ||
      contract?.capabilityFamily === 'color_image_layer' ||
      contract?.capabilityFamily === 'scene_detection_layer',
    `${mapBrowserColorSceneName} must resolve to the promoted map/browser/color/scene adapter pack.`,
  )
  assert.equal(contract?.frontendExecutionAllowed, false, `${mapBrowserColorSceneName} must stay backend/planning gated.`)
}

for (const renderPackagingName of boundedRenderPackagingAdapterToolNames) {
  const contract = resolveProfessionalToolAdapterContract(renderPackagingName)
  assert.ok(
    contract?.capabilityFamily === 'render_pipeline_validation_layer' ||
      contract?.capabilityFamily === 'container_packaging_layer',
    `${renderPackagingName} must resolve to a backend render/packaging validation layer.`,
  )
  assert.equal(contract?.frontendExecutionAllowed, false, `${renderPackagingName} must stay backend-only.`)
  assert.equal(contract?.productReady, false, `${renderPackagingName} must not claim product readiness from adapter wiring.`)
  assert.ok(!contract?.userFacingActivity.toLowerCase().includes('gpac'), `${renderPackagingName} user copy should not expose package names.`)
  assert.ok(!contract?.userFacingActivity.toLowerCase().includes('mkvtoolnix'), `${renderPackagingName} user copy should not expose package names.`)
}

const missingApprovalPlan = createProfessionalToolAdapterPlan({
  workspaceId: 'workspace-adapter-smoke',
  projectId: 'project-adapter-smoke',
  requestedToolNames: [...requestedToolNames],
})
assert.equal(missingApprovalPlan.status, 'blocked', 'Adapter plan must block without an approved snapshot.')
assert.equal(missingApprovalPlan.approvedSnapshotReady, false, 'Approved snapshot gate must be visible.')
assert.equal(missingApprovalPlan.frontendExecutionAllowed, false, 'Adapter plans must never enable frontend execution.')
assert.equal(missingApprovalPlan.productReady, false, 'Adapter plans must not mark tools product-ready.')
assert.ok(missingApprovalPlan.blockers.length >= requestedToolNames.length, 'Every requested adapter should report missing approval evidence.')

const dryRunPlan = createProfessionalToolAdapterPlan({
  workspaceId: 'workspace-adapter-smoke',
  projectId: 'project-adapter-smoke',
  requestedToolNames: [...requestedToolNames],
  evidence: {
    approvedPlanSnapshotId: 'approved-snapshot-adapter-smoke',
    privateArtifactRefs: [{ artifactId: 'private-frame-ref', storageObjectPath: 'private/artifact/ref.json' }],
  },
})
assert.equal(dryRunPlan.status, 'blocked', 'Foundation-only tools should block dry-run edit execution.')
assert.equal(dryRunPlan.resolvedToolCount, requestedToolNames.length, 'Dry-run plan must resolve every requested tool.')
assert.equal(
  dryRunPlan.tools.filter((tool) => tool.status === 'blocked').map((tool) => tool.canonicalToolId).sort().join(','),
  [...boundedModelFoundationAdapterToolNames].sort().join(','),
  'Only foundation runtime packages should block dry-run edit execution.',
)
assert.ok(dryRunPlan.qaGateTypes.includes('render_asset_integrity'), 'Adapter plan must aggregate QA gates.')
assert.equal(dryRunPlan.userFacingSummary.toLowerCase().includes('d3'), false, 'User-facing plan summary must not expose package names.')

const readinessPlan = createProfessionalToolAdapterPlan({
  workspaceId: 'workspace-adapter-smoke',
  projectId: 'project-adapter-smoke',
  requestedToolNames: [...boundedModelFoundationAdapterToolNames],
  mode: 'readiness_check',
  evidence: {
    approvedPlanSnapshotId: 'approved-snapshot-adapter-smoke',
  },
})
assert.equal(readinessPlan.status, 'ready_for_readiness_check', 'Foundation runtime packages should route to readiness checks.')
assert.equal(readinessPlan.tools.every((tool) => tool.status === 'ready'), true, 'Readiness-only tools should pass readiness_check mode.')

const packageReadyToolIds = requestedToolNames
  .map((name) => resolveProfessionalToolAdapterContract(name)?.canonicalToolId)
  .filter((toolId): toolId is ProductionToolId => Boolean(toolId))
const boundedPlan = createProfessionalToolAdapterPlan({
  workspaceId: 'workspace-adapter-smoke',
  projectId: 'project-adapter-smoke',
  requestedToolNames: [...requestedToolNames],
  mode: 'bounded_execution',
  evidence: {
    approvedPlanSnapshotId: 'approved-snapshot-adapter-smoke',
    creditEstimateId: 'credit-estimate-adapter-smoke',
    creditReservationId: 'credit-reservation-adapter-smoke',
    packageReadyToolIds,
    privateArtifactRefs: [{ artifactId: 'private-frame-ref', storageObjectPath: 'private/artifact/ref.json' }],
  },
})
assert.equal(boundedPlan.status, 'blocked', 'Bounded execution must still block model-backed tools without weight approval.')
assert.ok(
  boundedPlan.blockers.some((blocker) => /model\/checkpoint approval/i.test(blocker)),
  'Bounded plan must preserve model/checkpoint blockers.',
)
assert.equal(
  boundedPlan.blockers.some((blocker) => /planning-only/i.test(blocker)),
  true,
  'Dry-run-only map/geospatial adapters must still block bounded execution until promoted to a render/worker recipe.',
)
for (const renderAdapterName of boundedVisualMotionAdapterToolNames) {
  const canonicalToolId = resolveProfessionalToolAdapterContract(renderAdapterName)?.canonicalToolId
  const tool = boundedPlan.tools.find((item) => item.canonicalToolId === canonicalToolId)
  assert.equal(tool?.status, 'ready', `${renderAdapterName} must be eligible for backend bounded render-adapter handoff when evidence is present.`)
}
for (const renderPackagingName of boundedRenderPackagingAdapterToolNames) {
  const canonicalToolId = resolveProfessionalToolAdapterContract(renderPackagingName)?.canonicalToolId
  const tool = boundedPlan.tools.find((item) => item.canonicalToolId === canonicalToolId)
  assert.equal(tool?.status, 'ready', `${renderPackagingName} must be eligible for backend bounded validation handoff when evidence is present.`)
}
assert.ok(
  boundedPlan.blockers.some((blocker) => /torch_torchvision does not support bounded execution/i.test(blocker)),
  'Foundation packages must remain readiness-only and block bounded edit execution.',
)
assert.ok(
  boundedPlan.blockers.some((blocker) => /whisper_cpp does not support bounded execution/i.test(blocker)),
  'Evaluation-only fallback speech adapters must not become bounded execution by default.',
)
assert.ok(
  boundedPlan.blockers.some((blocker) => /maplibre is planning-only/i.test(blocker)),
  'Planning-only map adapters must preserve a render/worker promotion gate.',
)
assert.equal(boundedPlan.creditGateRequired, true, 'Bounded render/GPU adapters must require credit gates.')
assert.equal(boundedPlan.creditGateReady, true, 'Credit gates should be ready when estimate and reservation evidence exist.')

const orchestrationPlan = createProfessionalToolAdapterOrchestrationPlan({
  workspaceId: 'workspace-adapter-smoke',
  projectId: 'project-adapter-smoke',
  requestedToolNames: [...requestedToolNames],
  evidence: {
    approvedPlanSnapshotId: 'approved-snapshot-adapter-smoke',
    privateArtifactRefs: [{ artifactId: 'private-frame-ref', storageObjectPath: 'private/artifact/ref.json' }],
  },
})
assert.equal(
  orchestrationPlan.status,
  'ready_for_adapter_dry_run_and_readiness',
  'Orchestration should auto-route edit adapters and foundation readiness checks.',
)
assert.equal(orchestrationPlan.resolvedToolCount, requestedToolNames.length, 'Orchestration must resolve every requested tool.')
assert.equal(orchestrationPlan.editAdapterPlan?.resolvedToolCount, requestedToolNames.length - 2, 'Two foundation tools should be excluded from dry-run edit adapters.')
assert.equal(orchestrationPlan.readinessPlan?.resolvedToolCount, 2, 'Foundation tools should route to readiness checks.')
assert.equal(orchestrationPlan.userFacingSummary.toLowerCase().includes('torch'), false, 'Orchestration summary must not expose package names.')

const unresolvedRegistryOnlyPlan = createProfessionalToolAdapterPlan({
  workspaceId: 'workspace-adapter-smoke',
  projectId: 'project-adapter-smoke',
  requestedToolNames: ['paddleocr', 'pyav', 'revideo', 'ffmpeg'],
  mode: 'bounded_execution',
  evidence: {
    approvedPlanSnapshotId: 'approved-snapshot-adapter-smoke',
  },
})
assert.equal(unresolvedRegistryOnlyPlan.status, 'blocked', 'Registry-only and owner-lane tools must not enter bounded adapter execution.')
assert.deepEqual(
  unresolvedRegistryOnlyPlan.unresolvedToolNames,
  ['paddleocr', 'pyav', 'revideo', 'ffmpeg'],
  'Unresolved registry/owner-lane tools must remain unresolved in the adapter plan.',
)
assert.equal(
  unresolvedRegistryOnlyPlan.sourceTruthIssues.length,
  4,
  'Unresolved registry/owner-lane tools must carry structured source-truth issue records.',
)
assert.deepEqual(
  unresolvedRegistryOnlyPlan.sourceTruthIssues.map((issue) => issue.category),
  ['model_manifest_required', 'accepted_owner_lane_runtime_gate', 'evaluation_hold', 'accepted_owner_lane_runtime_gate'],
  'Unresolved source-truth issues must preserve their exact categories.',
)
assert.deepEqual(
  unresolvedRegistryOnlyPlan.sourceTruthIssues.map((issue) => issue.nextGate),
  [
    'exact_model_weight_owner_manifest_review',
    'owner_lane_runtime_gate',
    'owner_scope_decision_keep_or_remove',
    'owner_lane_runtime_gate',
  ],
  'Unresolved source-truth issues must expose their exact next gates.',
)
for (const issue of unresolvedRegistryOnlyPlan.sourceTruthIssues) {
  assert.equal(
    ['paddleocr', 'pyav', 'revideo', 'ffmpeg'].some((toolName) =>
      issue.userFacingSummary.toLowerCase().includes(toolName)
    ),
    false,
    'User-facing source-truth issue summaries must not expose package names.',
  )
}
assert.equal(
  ['paddleocr', 'pyav', 'revideo', 'ffmpeg'].some((toolName) =>
    unresolvedRegistryOnlyPlan.userFacingReadinessSummary.toLowerCase().includes(toolName)
  ),
  false,
  'User-facing readiness summary must not expose unresolved package names.',
)
assert.ok(
  unresolvedRegistryOnlyPlan.blockers.some((blocker) => /paddleocr.*model\/checkpoint manifest approval/i.test(blocker)),
  'Model-backed registry-only tools must point to the exact model/checkpoint manifest lane.',
)
assert.ok(
  unresolvedRegistryOnlyPlan.blockers.every((blocker) => !/pyav/i.test(blocker)),
  'Accepted owner-lane support tools must not create a hard adapter blocker.',
)
assert.ok(
  unresolvedRegistryOnlyPlan.blockers.some((blocker) => /revideo.*not selected\/evaluation-only/i.test(blocker)),
  'Evaluation-hold registry-only tools must stay out of execution planning.',
)
assert.ok(
  unresolvedRegistryOnlyPlan.blockers.every((blocker) => !/ffmpeg/i.test(blocker)),
  'Accepted owner-lane tools must not become hard blockers in this bounded adapter lane.',
)

const ownerLaneOnlyPlan = createProfessionalToolAdapterPlan({
  workspaceId: 'workspace-adapter-smoke',
  projectId: 'project-adapter-smoke',
  requestedToolNames: ['ffmpeg'],
  mode: 'bounded_execution',
  evidence: {
    approvedPlanSnapshotId: 'approved-snapshot-adapter-smoke',
  },
})
assert.equal(ownerLaneOnlyPlan.status, 'ready_for_bounded_execution', 'Accepted owner-lane support tools should route onward without this lane re-proving source truth.')
assert.equal(ownerLaneOnlyPlan.sourceTruthIssues.length, 1, 'Accepted owner-lane routing should remain auditable.')
assert.equal(ownerLaneOnlyPlan.sourceTruthIssues[0]?.category, 'accepted_owner_lane_runtime_gate')
assert.equal(ownerLaneOnlyPlan.blockers.length, 0, 'Accepted owner-lane routing should not create a hard adapter blocker.')
assert.equal(ownerLaneOnlyPlan.userFacingReadinessSummary.toLowerCase().includes('ffmpeg'), false, 'Owner-lane handoff copy must not expose package names.')
assert.ok(
  /accepted by the owning lane/i.test(ownerLaneOnlyPlan.userFacingReadinessSummary),
  'Owner-lane handoff copy should explain the accepted owner-lane gate.',
)

console.log(JSON.stringify({
  ok: true,
  totalContracts: summary.totalContracts,
  canonicalToolCount: summary.canonicalToolCount,
  dataVisualContracts: summary.dataVisualContracts,
  motionContracts: summary.motionContracts,
  aiVisionContracts: summary.aiVisionContracts,
  speechTranscriptContracts: summary.speechTranscriptContracts,
  musicAudioContracts: summary.musicAudioContracts,
  mapBrowserColorSceneContracts: summary.mapBrowserColorSceneContracts,
  renderPackagingContracts: summary.renderPackagingContracts,
  productReadyContracts: summary.productReadyContracts,
  dryRunPlanStatus: dryRunPlan.status,
  readinessPlanStatus: readinessPlan.status,
  orchestrationPlanStatus: orchestrationPlan.status,
  boundedPlanStatus: boundedPlan.status,
  boundedBlockerCount: boundedPlan.blockers.length,
  unresolvedRegistryOnlyBlockerCount: unresolvedRegistryOnlyPlan.blockers.length,
  unresolvedRegistryOnlySourceTruthIssueCount: unresolvedRegistryOnlyPlan.sourceTruthIssues.length,
  ownerLaneOnlyPlanStatus: ownerLaneOnlyPlan.status,
}, null, 2))
