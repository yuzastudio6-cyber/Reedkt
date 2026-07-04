import assert from 'node:assert/strict'

import {
  AUDIO_LICENSE_REVIEW_TOOL_IDS,
  READY_AUDIO_ARCHITECTURE_TOOL_IDS,
  TRACK_B_MEDIA_OSS_TOOL_IDS,
  getUnifiedSkillToolAvailability,
} from '../skill-capability-registry'
import {
  READY_AUDIO_ADAPTER_TOOL_IDS,
  READY_AUDIO_EXECUTABLE_TOOL_IDS,
  getReadyAudioAdapterContract,
  listReadyAudioAdapterContracts,
  runReadyAudioAdapter,
  type ReadyAudioAdapterToolId,
} from '../ready-audio-adapters'
import { createToolExecutionGatewayService } from '../services/tool-execution-gateway-service'
import {
  getFallbackChainsForTool,
  getProductionToolProfile,
  getToolQAPolicy,
  type ProductionToolId,
} from '../tool-registry'
import { getToolCostOwnerCoverage } from '../tool-cost-metering/tool-cost-owner-coverage'
import type { ServiceContext } from '../types'
import type { ToolExecutionGatewayDispatchBody } from '../validation/tool-execution-gateway-schemas'
import { clearMockWorkerRuntimeArtifactPipelineState } from '../workers/production/production-worker-artifact-pipeline'
import { getProductionReadinessSpec } from '../workers/production-readiness'

const requestedAudioTools = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm',
] as const satisfies readonly ProductionToolId[]

const requestedAudioToolSet = new Set<ProductionToolId>(requestedAudioTools)
const requestedReadyAudioTools = requestedAudioTools.filter((toolId) => toolId !== 'pedalboard')
const gatewayRepresentativeTools = [
  'librosa',
  'pyloudnorm',
  'music21',
  'noisereduce',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm',
] as const satisfies readonly ReadyAudioAdapterToolId[]

const expectedImportByTool = new Map<ProductionToolId, string>([
  ['librosa', 'librosa'],
  ['audioread', 'audioread'],
  ['pydub', 'pydub'],
  ['scipy', 'scipy'],
  ['resampy', 'resampy'],
  ['pyloudnorm', 'pyloudnorm'],
  ['audioflux', 'audioflux'],
  ['music21', 'music21'],
  ['pretty_midi', 'pretty_midi'],
  ['mido', 'mido'],
  ['noisereduce', 'noisereduce'],
  ['pedalboard', 'pedalboard'],
  ['mir_eval', 'mir_eval'],
  ['pydub_effects', 'pydub.effects'],
  ['ebu_r128_pyloudnorm', 'pyloudnorm'],
])

const readySet = new Set<ProductionToolId>(READY_AUDIO_ARCHITECTURE_TOOL_IDS as readonly ProductionToolId[])

const mockContext: ServiceContext = {
  env: {
    mockOnly: true,
    allowMockWithoutSupabase: true,
  } as never,
  clients: {
    admin: null,
    public: null,
  },
  requestId: 'ready-audio-tools-architecture-smoke',
  auth: {
    userId: 'user-ready-audio-smoke',
    email: 'user-ready-audio-smoke@reeditpro.local',
    isMockUser: true,
  },
}

assert.deepEqual(
  [...TRACK_B_MEDIA_OSS_TOOL_IDS].length,
  16,
  'ready audio architecture must not rewrite the fixed 16-tool Track B handoff count',
)
assert.deepEqual(
  [...READY_AUDIO_ADAPTER_TOOL_IDS],
  [...requestedAudioTools],
  'ready audio adapter pack should cover exactly the requested audio/music tools',
)
assert.equal(
  listReadyAudioAdapterContracts().length,
  requestedAudioTools.length,
  'ready audio adapter contracts should cover every requested audio/music tool',
)

for (const toolId of requestedAudioTools) {
  const profile = getProductionToolProfile(toolId)
  assert.ok(profile, `production registry should include ${toolId}`)
  assert.equal(profile?.modelWeightsRequired, false, `${toolId} should not require model weights`)
  assert.notEqual(profile?.workerType, 'frontend_preview_only', `${toolId} should not be browser/front-end executable`)
  assert.ok(
    profile?.category === 'audio_analysis' || profile?.category === 'audio_cleanup' || profile?.category === 'qa',
    `${toolId} should be classified into an audio/QA category`,
  )

  const qa = getToolQAPolicy(toolId)
  assert.ok(qa.gateTypes.length > 0, `${toolId} should have QA gate mapping`)
  assert.ok(
    qa.gateTypes.some((gate) => gate.startsWith('audio_') || gate === 'music_over_voice' || gate === 'render_asset_integrity'),
    `${toolId} should map to audio-relevant QA gates`,
  )

  const readinessSpec = getProductionReadinessSpec(toolId)
  assert.ok(readinessSpec, `${toolId} should have a readiness spec`)
  assert.ok(readinessSpec?.imageRoles.includes('tool_readiness_worker'), `${toolId} should be visible to tool-readiness workers`)
  assert.ok(
    readinessSpec?.pythonImportChecks.some((check) => check.importName === expectedImportByTool.get(toolId)),
    `${toolId} should declare the expected Python import readiness check`,
  )

  const coverage = getToolCostOwnerCoverage(toolId)
  assert.equal(coverage.serviceFeeIncluded, false, `${toolId} tool-cost owner coverage must exclude ReEditPro service fees`)
  assert.equal(coverage.productReadyLocalOss, false, `${toolId} must not claim product-ready local OSS`)
  assert.equal(coverage.requiresApprovedPlanSnapshot, true, `${toolId} must require approved snapshots`)
  assert.equal(coverage.requiresCreditReservation, true, `${toolId} must require credit reservations`)
  assert.equal(coverage.requiresIdempotentEvent, true, `${toolId} must require idempotent cost events`)

  const contract = getReadyAudioAdapterContract(toolId)
  assert.equal(contract.toolId, toolId, `${toolId} should have a ready-audio adapter contract`)
  assert.ok(contract.inputManifest.some((item) => item.required), `${toolId} should require a private input manifest`)
  assert.ok(contract.outputManifest.some((item) => item.required), `${toolId} should declare private output manifest requirements`)
  assert.ok(contract.qaChecks.length >= 4, `${toolId} should declare adapter QA checks`)
  assert.ok(contract.userFacingActivity.length > 0, `${toolId} should have a user-facing activity summary`)
  assert.equal(
    contract.userFacingActivity.toLowerCase().includes(toolId.toLowerCase()),
    false,
    `${toolId} user-facing activity should summarize the edit work instead of exposing the raw tool identifier`,
  )
}

for (const toolId of READY_AUDIO_ARCHITECTURE_TOOL_IDS as readonly ProductionToolId[]) {
  const profile = getProductionToolProfile(toolId)
  assert.notEqual(profile?.productionStatus, 'needs_license_review', `${toolId} should not be license-review blocked in the ready set`)
  assert.notEqual(profile?.productionStatus, 'evaluation_only', `${toolId} should not be evaluation-only in the ready set`)
}

for (const toolId of requestedReadyAudioTools) {
  assert.ok(readySet.has(toolId), `requested ready audio tool should be exposed in the ready architecture set: ${toolId}`)
}

for (const toolId of READY_AUDIO_EXECUTABLE_TOOL_IDS) {
  const directResult = runReadyAudioAdapter({
    workspaceId: 'workspace-audio-smoke',
    projectId: 'project-audio-smoke',
    jobId: `job-direct-${toolId}`,
    toolExecutionPlanId: `plan-direct-${toolId}`,
    approvedPlanSnapshotId: 'approved-snapshot-audio-smoke',
    creditEstimateId: 'credit-estimate-audio-smoke',
    creditReservationId: 'credit-reservation-audio-smoke',
    toolId,
    workerType: getReadyAudioAdapterContract(toolId).workerType,
    executionMode: 'bounded_execution',
    inputArtifacts: [privateSourceAudioArtifact(`artifact-direct-${toolId}`)],
    metadata: {
      smoke: 'ready-audio-direct-adapter',
      noRawPrompt: true,
    },
  })
  assert.equal(directResult.status, 'bounded_execution_ready', `${toolId} direct adapter should validate bounded execution contract`)
  assert.equal(directResult.mockSafe, true, `${toolId} direct adapter should remain mock-safe`)
  assert.equal(directResult.realToolExecution, false, `${toolId} direct adapter must not run the real library`)
  assert.ok(directResult.outputManifest.length > 0, `${toolId} direct adapter should plan private outputs`)
  assert.ok(
    directResult.outputManifest.every((artifact) => (
      artifact.isPrivate === true &&
      artifact.sourceOfTruth === true &&
      artifact.storageObjectPath.startsWith('workspaces/workspace-audio-smoke/projects/project-audio-smoke/') &&
      !artifact.storageObjectPath.includes('signed')
    )),
    `${toolId} output manifest should stay private, source-of-truth, project-scoped, and unsigned`,
  )
  assert.ok(
    directResult.qaChecks.every((check) => check.status === 'passed'),
    `${toolId} direct adapter QA checks should pass`,
  )
}

for (const toolId of AUDIO_LICENSE_REVIEW_TOOL_IDS as readonly ProductionToolId[]) {
  const profile = getProductionToolProfile(toolId)
  assert.ok(requestedAudioToolSet.has(toolId), `${toolId} should still be part of the requested architecture list`)
  assert.equal(profile?.productionStatus, 'needs_license_review', `${toolId} should stay license-review gated`)
  assert.equal(profile?.executionMode, 'evaluation_only', `${toolId} should remain evaluation-only until owner approval`)

  const blockedResult = runReadyAudioAdapter({
    workspaceId: 'workspace-audio-smoke',
    projectId: 'project-audio-smoke',
    jobId: `job-direct-${toolId}`,
    toolExecutionPlanId: `plan-direct-${toolId}`,
    approvedPlanSnapshotId: 'approved-snapshot-audio-smoke',
    creditEstimateId: 'credit-estimate-audio-smoke',
    creditReservationId: 'credit-reservation-audio-smoke',
    toolId: toolId as ReadyAudioAdapterToolId,
    workerType: getReadyAudioAdapterContract(toolId as ReadyAudioAdapterToolId).workerType,
    executionMode: 'bounded_execution',
    inputArtifacts: [privateSourceAudioArtifact(`artifact-direct-${toolId}`)],
    metadata: { smoke: 'ready-audio-license-block' },
  })
  assert.equal(blockedResult.status, 'blocked', `${toolId} adapter should block before execution`)
  assert.ok(
    blockedResult.blockers.some((blocker) => blocker.code === 'READY_AUDIO_ADAPTER_LICENSE_REVIEW_REQUIRED'),
    `${toolId} adapter should identify the license-review blocker`,
  )
}

const forbiddenMetadata = runReadyAudioAdapter({
  workspaceId: 'workspace-audio-smoke',
  projectId: 'project-audio-smoke',
  jobId: 'job-direct-secret-metadata',
  toolExecutionPlanId: 'plan-direct-secret-metadata',
  approvedPlanSnapshotId: 'approved-snapshot-audio-smoke',
  creditEstimateId: 'credit-estimate-audio-smoke',
  creditReservationId: 'credit-reservation-audio-smoke',
  toolId: 'librosa',
  workerType: 'cpu_analysis_worker',
  executionMode: 'dry_run',
  inputArtifacts: [privateSourceAudioArtifact('artifact-secret-metadata')],
  metadata: { rawPrompt: 'do not allow raw prompts into backend tool payloads' },
})
assert.equal(forbiddenMetadata.status, 'blocked', 'ready audio adapter should block forbidden metadata')
assert.ok(
  forbiddenMetadata.blockers.some((blocker) => blocker.code === 'READY_AUDIO_ADAPTER_FORBIDDEN_METADATA'),
  'forbidden metadata blocker should be explicit',
)

const signedUrlArtifact = runReadyAudioAdapter({
  workspaceId: 'workspace-audio-smoke',
  projectId: 'project-audio-smoke',
  jobId: 'job-direct-signed-url',
  toolExecutionPlanId: 'plan-direct-signed-url',
  approvedPlanSnapshotId: 'approved-snapshot-audio-smoke',
  creditEstimateId: 'credit-estimate-audio-smoke',
  creditReservationId: 'credit-reservation-audio-smoke',
  toolId: 'librosa',
  workerType: 'cpu_analysis_worker',
  executionMode: 'dry_run',
  inputArtifacts: [{
    ...privateSourceAudioArtifact('artifact-signed-url'),
    storageObjectPath: 'https://storage.example.com/source.wav?X-Goog-Signature=secret',
  }],
})
assert.equal(signedUrlArtifact.status, 'blocked', 'ready audio adapter should block signed/raw URL artifact references')
assert.ok(
  signedUrlArtifact.blockers.some((blocker) => blocker.code === 'READY_AUDIO_ADAPTER_PRIVATE_ARTIFACT_REQUIRED'),
  'signed URL blocker should be explicit',
)

clearMockWorkerRuntimeArtifactPipelineState()
const gatewayService = createToolExecutionGatewayService(mockContext)
for (const toolId of gatewayRepresentativeTools) {
  const contract = getReadyAudioAdapterContract(toolId)
  const gatewayResult = await gatewayService.dispatchApprovedToolCall({
    ...gatewayInputForTool(toolId),
    workerType: contract.workerType,
    adapterId: contract.workerType === 'cpu_analysis_worker' ? 'cpu_analysis_worker_audio_metadata' : undefined,
  })
  assert.equal(gatewayResult.gateway.status, 'dispatched', `${toolId} should dispatch through the backend gateway: ${JSON.stringify(gatewayResult.gateway.blockers)}`)
  assert.equal(gatewayResult.readyAudioAdapterResult?.status, 'dry_run_ready', `${toolId} should include a ready-audio adapter result`)
  assert.equal(gatewayResult.readyAudioAdapterResult?.realToolExecution, false, `${toolId} gateway adapter must not execute the real library`)
  assert.ok(
    gatewayResult.workerRuntimeArtifactPipeline?.outputManifest.some((artifact) => artifact.metadata?.adapterPackVersion === 'ready-audio-adapter-pack-v1'),
    `${toolId} gateway dispatch should record ready-audio private output manifests`,
  )
}

const pedalboardGateway = await gatewayService.dispatchApprovedToolCall({
  ...gatewayInputForTool('pedalboard'),
  adapterId: 'cpu_analysis_worker_audio_metadata',
})
assert.equal(pedalboardGateway.gateway.status, 'blocked', 'Pedalboard should remain blocked through the gateway')
assert.ok(
  pedalboardGateway.gateway.blockers.some((blocker) => blocker.code === 'READY_AUDIO_ADAPTER_LICENSE_REVIEW_REQUIRED'),
  'Pedalboard gateway blocker should preserve license review',
)

assert.ok(getFallbackChainsForTool('pydub').some((chain) => chain.chainId === 'audio_cleanup_fallback'), 'pydub should participate in audio cleanup fallback policy')
assert.ok(getFallbackChainsForTool('noisereduce').some((chain) => chain.chainId === 'audio_cleanup_fallback'), 'noisereduce should participate in audio cleanup fallback policy')
assert.ok(getFallbackChainsForTool('pyloudnorm').some((chain) => chain.chainId === 'audio_cleanup_fallback'), 'pyloudnorm should support loudness fallback policy')

const audioAvailability = getUnifiedSkillToolAvailability('audio')
for (const toolId of READY_AUDIO_ARCHITECTURE_TOOL_IDS) {
  assert.ok(audioAvailability.readyToolIds.includes(toolId), `audio availability should expose ready backend candidate ${toolId}`)
}
for (const toolId of AUDIO_LICENSE_REVIEW_TOOL_IDS) {
  assert.ok(audioAvailability.blockedToolIds.includes(toolId), `audio availability should keep license-gated tool blocked: ${toolId}`)
}
assert.equal(audioAvailability.externalBetaOrProductionAllowed, false, 'audio architecture must not unlock external beta or production')

const soundAvailability = getUnifiedSkillToolAvailability('sound lane')
for (const toolId of READY_AUDIO_ARCHITECTURE_TOOL_IDS) {
  assert.ok(soundAvailability.readyToolIds.includes(toolId), `SOUND handoff should see ready backend candidate ${toolId}`)
}
assert.ok(soundAvailability.dryRunOnlyToolIds.includes('sound_cpu_lane'), 'SOUND lane must remain dry-run gated')

console.log(JSON.stringify({
  ok: true,
  requestedAudioToolCount: requestedAudioTools.length,
  readyAudioArchitectureToolCount: READY_AUDIO_ARCHITECTURE_TOOL_IDS.length,
  readyAudioAdapterToolCount: READY_AUDIO_ADAPTER_TOOL_IDS.length,
  gatewayRepresentativeToolCount: gatewayRepresentativeTools.length,
  licenseReviewToolIds: [...AUDIO_LICENSE_REVIEW_TOOL_IDS],
  trackBMediaOssToolCount: TRACK_B_MEDIA_OSS_TOOL_IDS.length,
  productReadyLocalOssCount: 0,
  externalBetaOrProductionAllowed: false,
}, null, 2))

function privateSourceAudioArtifact(id: string) {
  return {
    id,
    artifactType: 'source_media' as const,
    storageBucketPurpose: 'source_media' as const,
    storageObjectPath: `workspaces/workspace-audio-smoke/projects/project-audio-smoke/source/${id}.wav`,
    contentType: 'audio/wav',
    isPrivate: true,
    sourceOfTruth: true,
    description: 'Private source audio fixture reference for ready-audio adapter smoke validation.',
  }
}

function gatewayInputForTool(toolId: ReadyAudioAdapterToolId): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  const contract = getReadyAudioAdapterContract(toolId)
  const metadata = contract.workerType === 'cpu_analysis_worker'
    ? {
      readyAudioSmoke: true,
      audioExecution: {
        mode: 'mock_safe',
        sourceAudioArtifactId: `artifact-gateway-${toolId}`,
        tasks: ['run_ready_audio_adapter', 'build_private_audio_manifest', 'build_audio_qa_report'],
        allowFinalMux: false,
        enableFfmpegAudioExecution: false,
        enableModelAudioExecution: false,
        allowModelDownload: false,
      },
    }
    : {
      readyAudioSmoke: true,
      qaOnlyReadyAudioAdapter: true,
    }

  return {
    workspaceId: 'workspace-audio-smoke',
    projectId: 'project-audio-smoke',
    jobId: `job-gateway-${toolId}`,
    toolExecutionPlanId: `plan-gateway-${toolId}`,
    editPlanId: 'edit-plan-ready-audio-smoke',
    mediaAssetId: 'media-ready-audio-smoke',
    approvedPlanSnapshotId: 'approved-snapshot-audio-smoke',
    creditEstimateId: 'credit-estimate-audio-smoke',
    creditReservationId: 'credit-reservation-audio-smoke',
    approvedReservationRemainingCredits: 30,
    estimatedHighCredits: 3,
    workerType: 'cpu_analysis_worker',
    executionMode: 'mock_safe',
    readyAudioAdapterToolId: toolId,
    readyAudioAdapterExecutionMode: 'dry_run',
    requestedToolIds: [toolId],
    requestedRecipeIds: [`ready-audio-${toolId}-recipe`],
    artifactReferences: [{
      id: `artifact-gateway-${toolId}`,
      storageBucketPurpose: 'source_media',
      storageObjectPath: `workspaces/workspace-audio-smoke/projects/project-audio-smoke/source/${toolId}.wav`,
      isPrivate: true,
      sourceOfTruth: true,
    }],
    attempt: 1,
    maxAttempts: 1,
    metadata,
    apiIdempotencyKey: `api-ready-audio-${toolId}`,
  }
}
