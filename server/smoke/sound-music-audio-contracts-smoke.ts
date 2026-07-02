import {
  SOUND_EXPLICIT_NON_OWNERSHIP,
  SOUND_MUSIC_WORKSTREAM_ID,
  SOUND_PROVIDER_POLICIES,
  SOUND_RELATED_WORKSTREAM_IDS,
  SOUND_TOOL_REGISTRY_METADATA,
  evaluateSoundExecutionGate,
  getSoundProviderPolicy,
  getSoundRuntimePolicy,
  getSoundToolMetadata,
  resolveSoundRuntimeTarget,
} from '../../src/backend/contracts/sound-music-audio-contracts'
import type {
  PrivateAudioArtifactManifest,
  SoundArtifactKind,
  SoundBlockedUseReason,
  SoundCuePlan,
  SoundExecutionGateInput,
  SoundProviderId,
  SoundToolId,
  TimingAwareSoundCueManifest,
} from '../../src/types/audio-music'
import { PRODUCTION_TOOL_IDS } from '../tool-registry'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function checkIncludes<T extends string>(values: readonly T[], value: T, message: string): void {
  check(values.includes(value), message)
}

function checkReason(result: { blockedReasons: SoundBlockedUseReason[] }, reason: SoundBlockedUseReason): void {
  check(result.blockedReasons.includes(reason), `Expected blocked reason ${reason}.`)
}

const requiredSoundToolIds: SoundToolId[] = [
  'action_foley_sfx_tool',
  'ambient_everyday_soundscape_tool',
  'sfx_director_tool',
  'music_cue_planner',
  'ambient_sound_planner',
  'soundsync_planner',
  'audio_qa_tool',
  'private_audio_artifact_manifest_builder',
  'timing_aware_cue_manifest_builder',
]

for (const toolId of requiredSoundToolIds) {
  const metadata = getSoundToolMetadata(toolId)
  check(metadata.toolId === toolId, `${toolId} metadata must exist.`)
  check(metadata.ownerWorkstream === 'SOUND_MUSIC_AUDIO', `${toolId} must be owned by SOUND_MUSIC_AUDIO.`)
  check(metadata.allowedRole === 'sound_agent', `${toolId} must be limited to sound_agent.`)
  check(metadata.failClosed, `${toolId} must be fail-closed.`)
  check(!metadata.productionEnabled, `${toolId} must not enable production.`)
  check(!metadata.betaEnabled, `${toolId} must not enable beta.`)
  check(!metadata.externalBetaEnabled, `${toolId} must not enable external beta.`)
  check(!metadata.paidProductionEnabled, `${toolId} must not enable paid production.`)
  check(!(PRODUCTION_TOOL_IDS as readonly string[]).includes(toolId), `${toolId} must not be added to ProductionToolId.`)
}

check(SOUND_MUSIC_WORKSTREAM_ID === 'SOUND_MUSIC_AUDIO', 'SOUND ownership constant must exist.')
checkIncludes(SOUND_RELATED_WORKSTREAM_IDS, 'TRACK_A_RENDER_EXPORT', 'Track A must remain a related handoff.')
checkIncludes(SOUND_RELATED_WORKSTREAM_IDS, 'PROVIDER_GATEWAY_MODELS', 'Provider Gateway must remain a related handoff.')
checkIncludes(SOUND_RELATED_WORKSTREAM_IDS, 'SUPABASE_RLS_STORAGE_DATABASE', 'Supabase workstream must remain a related handoff.')
check(SOUND_EXPLICIT_NON_OWNERSHIP.some((item) => /render\/export/i.test(item)), 'SOUND must not claim render/export.')
check(SOUND_EXPLICIT_NON_OWNERSHIP.some((item) => /provider gateway/i.test(item)), 'SOUND must not claim provider gateway transport.')
check(SOUND_EXPLICIT_NON_OWNERSHIP.some((item) => /Supabase/i.test(item)), 'SOUND must not claim Supabase mutation.')

const dasheng = getSoundProviderPolicy('dasheng_audiogen_candidate')
check(dasheng.allowedForPlanning, 'Dasheng candidate must be planning-allowed.')
check(!dasheng.generationEnabled, 'Dasheng candidate generation must be disabled.')
check(dasheng.commercialExportAllowed === 'pending_review', 'Dasheng candidate must require commercial review.')

const stable = getSoundProviderPolicy('stable_audio_open_license_gated')
check(stable.allowedForPlanning, 'Stable Audio Open must be planning-allowed.')
check(!stable.generationEnabled, 'Stable Audio Open generation must be disabled.')
check(stable.commercialExportAllowed === 'conditional_pending_license_review', 'Stable Audio Open must remain license-gated.')

for (const providerId of [
  'openmoss_moss_soundeffect_v2_pending_verification',
  'meta_audiogen_disabled',
  'woosh_disabled',
  'tangoflux_disabled',
  'mmaudio_disabled',
] satisfies SoundProviderId[]) {
  const policy = getSoundProviderPolicy(providerId)
  check(!policy.allowedForPlanning, `${providerId} must not be planning-allowed.`)
  check(!policy.generationEnabled, `${providerId} generation must be disabled.`)
  check(policy.runtimeDefault === 'blocked', `${providerId} must route to blocked.`)
}

for (const providerId of ['lyria_mock', 'mirelo_sfx_mock', 'mmaudio_mock'] satisfies SoundProviderId[]) {
  const policy = getSoundProviderPolicy(providerId)
  check(policy.status === 'mock_only_real_client_placeholder_fail_closed', `${providerId} must remain a fail-closed mock placeholder.`)
  check(!policy.generationEnabled, `${providerId} generation must be disabled.`)
  check(policy.runtimeDefault === 'external_provider_gateway', `${providerId} real transport must stay at Provider Gateway boundary.`)
}

check(getSoundProviderPolicy('audioflux_analysis_only').status === 'analysis_processing_only_not_generation_provider', 'AudioFlux must not be treated as a generation provider.')
check(getSoundProviderPolicy('signalsmith_stretch_processing_only').status === 'stretch_pitch_processing_only_not_generation_provider', 'Signalsmith must not be treated as a generation provider.')
check(!getSoundProviderPolicy('deepfilternet_review_required').generationEnabled, 'DeepFilterNet must not generate.')
check(!getSoundProviderPolicy('rnnoise_review_required').generationEnabled, 'RNNoise must not generate.')
check(!getSoundProviderPolicy('demucs_review_required').generationEnabled, 'Demucs must not generate.')

check(resolveSoundRuntimeTarget({ taskKind: 'sound_agent_planner' }) === 'cpu_service', 'Planner metadata must route to cpu_service.')
check(resolveSoundRuntimeTarget({ toolId: 'private_audio_artifact_manifest_builder' }) === 'cpu_service', 'Private manifest builder must route to cpu_service.')
check(resolveSoundRuntimeTarget({ toolId: 'timing_aware_cue_manifest_builder' }) === 'cpu_service', 'Timing-aware manifest builder must route to cpu_service.')
check(resolveSoundRuntimeTarget({ taskKind: 'audio_qa_metadata' }) === 'cpu_cloud_run_job', 'Audio QA metadata must route to cpu_cloud_run_job.')
check(resolveSoundRuntimeTarget({ taskKind: 'ffmpeg_loudness_resampling_mixing' }) === 'cpu_cloud_run_job', 'FFmpeg audio metadata must route to cpu_cloud_run_job.')
check(resolveSoundRuntimeTarget({ taskKind: 'audioflux_analysis' }) === 'cpu_cloud_run_job', 'AudioFlux analysis must route to cpu_cloud_run_job.')
check(resolveSoundRuntimeTarget({ taskKind: 'signalsmith_stretch_pitch' }) === 'cpu_cloud_run_job', 'Signalsmith stretch/pitch must route to cpu_cloud_run_job.')
check(resolveSoundRuntimeTarget({ providerId: 'dasheng_audiogen_candidate' }) === 'gpu_cloud_run_job_l4', 'Dasheng metadata must route to L4 GPU metadata.')
check(resolveSoundRuntimeTarget({ providerId: 'stable_audio_open_license_gated' }) === 'gpu_cloud_run_job_l4', 'Stable Audio metadata must route to L4 GPU metadata.')
check(resolveSoundRuntimeTarget({ taskKind: 'heavy_long_generation_metadata' }) === 'gpu_cloud_run_job_blackwell', 'Heavy/long generation metadata must route to Blackwell metadata.')
check(resolveSoundRuntimeTarget({ executionMode: 'mock_preview_only' }) === 'mock_only', 'Mock preview must route to mock_only.')
check(resolveSoundRuntimeTarget({ providerId: 'meta_audiogen_disabled' }) === 'blocked', 'Disabled providers must route to blocked.')

const privatePolicy = getSoundRuntimePolicy({ toolId: 'private_audio_artifact_manifest_builder' })
check(privatePolicy.runtimeTarget === 'cpu_service', 'Private artifact runtime policy must be cpu_service.')
check(!privatePolicy.mayCallProvider, 'Runtime policy must never call providers.')
check(!privatePolicy.mayDispatchWorker, 'Runtime policy must not dispatch workers in SOUND-1B.')

function gate(input: Partial<SoundExecutionGateInput> & Pick<SoundExecutionGateInput, 'executionMode' | 'providerPolicy' | 'runtimeTarget'>) {
  return evaluateSoundExecutionGate(input)
}

const planningGate = gate({
  executionMode: 'planning_only',
  providerPolicy: dasheng,
  runtimeTarget: 'cpu_service',
})
check(planningGate.allowed && planningGate.allowedMode === 'planning', 'Planning-only mode must allow planning metadata.')
check(!planningGate.mayCallProvider, 'Planning-only mode must not call providers.')
check(!planningGate.mayCreateGeneratedAsset, 'Planning-only mode must not create generated assets.')

const mockGate = gate({
  executionMode: 'mock_preview_only',
  providerPolicy: getSoundProviderPolicy('mock_sfx_provider'),
  runtimeTarget: 'mock_only',
})
check(mockGate.allowed && mockGate.allowedMode === 'mock', 'Mock preview mode must allow mock metadata.')
check(!mockGate.mayCreateGeneratedAsset, 'Mock preview must not create generated assets.')
checkReason(mockGate, 'storage_object_not_allowed')

const approvedNoSnapshot = gate({
  executionMode: 'approved_generation',
  providerPolicy: dasheng,
  runtimeTarget: 'gpu_cloud_run_job_l4',
})
check(!approvedNoSnapshot.allowed, 'Approved generation without required gates must be blocked.')
checkReason(approvedNoSnapshot, 'approved_snapshot_required')
checkReason(approvedNoSnapshot, 'credit_reservation_required')
checkReason(approvedNoSnapshot, 'provider_generation_disabled')
checkReason(approvedNoSnapshot, 'commercial_export_not_allowed')
checkReason(approvedNoSnapshot, 'tool_readiness_not_enabled')
checkReason(approvedNoSnapshot, 'worker_execution_not_allowed')
check(!approvedNoSnapshot.mayCallProvider, 'Approved generation must still not call providers in SOUND-1B.')

const approvedDisabled = gate({
  executionMode: 'approved_generation',
  providerPolicy: getSoundProviderPolicy('meta_audiogen_disabled'),
  runtimeTarget: 'blocked',
  approvedPlanSnapshotId: 'approved-snapshot-sound-smoke',
  creditEstimateId: 'credit-estimate-sound-smoke',
  creditApprovalId: 'credit-approval-sound-smoke',
  creditReservationId: 'credit-reservation-sound-smoke',
  toolReadinessEnabled: true,
  workerExecutionAllowed: true,
})
check(!approvedDisabled.allowed, 'Approved generation with disabled provider must be blocked.')
checkReason(approvedDisabled, 'runtime_target_blocked')
checkReason(approvedDisabled, 'provider_generation_disabled')
checkReason(approvedDisabled, 'provider_license_blocked')

const internalMissingScope = gate({
  executionMode: 'internal_beta_generation',
  providerPolicy: stable,
  runtimeTarget: 'gpu_cloud_run_job_l4',
  approvedPlanSnapshotId: 'approved-snapshot-sound-smoke',
  workerExecutionAllowed: true,
})
check(!internalMissingScope.allowed, 'Internal beta generation without internal scope must be blocked.')
checkReason(internalMissingScope, 'internal_test_scope_required')
checkReason(internalMissingScope, 'provider_generation_disabled')

const benchmarkMissingScope = gate({
  executionMode: 'benchmark_only',
  providerPolicy: getSoundProviderPolicy('audioflux_analysis_only'),
  runtimeTarget: 'cpu_cloud_run_job',
})
check(!benchmarkMissingScope.allowed, 'Benchmark mode without benchmark scope must be blocked.')
checkReason(benchmarkMissingScope, 'benchmark_scope_required')

const benchmarkAllowed = gate({
  executionMode: 'benchmark_only',
  providerPolicy: getSoundProviderPolicy('audioflux_analysis_only'),
  runtimeTarget: 'cpu_cloud_run_job',
  benchmarkScopeApproved: true,
  benchmarkProviderAllowed: true,
})
check(benchmarkAllowed.allowed && benchmarkAllowed.allowedMode === 'benchmark', 'Benchmark mode with scope must allow metadata benchmark.')
check(!benchmarkAllowed.mayCallProvider, 'Benchmark mode must not call providers in SOUND-1B.')

const sampleCue: SoundCuePlan = {
  cueId: 'cue-sound-smoke',
  family: 'action_foley_sfx',
  role: 'foreground_accent',
  toolId: 'action_foley_sfx_tool',
  startTimeSeconds: 1,
  endTimeSeconds: 1.5,
  durationSeconds: 0.5,
  anchorType: 'object_motion',
  anchorId: 'visual-cue-smoke',
  visualOrStoryReason: 'Object motion needs a subtle accent.',
  promptIntent: 'subtle cloth movement accent',
  speechOverlap: 'none',
  duckingRequired: false,
  intensity: 'subtle',
  providerCandidate: 'dasheng_audiogen_candidate',
  providerPolicyStatus: dasheng.status,
  providerBlockedReasons: ['provider_generation_disabled'],
  licenseEvidenceRequired: dasheng.licensePolicy.notes,
  runtimeTarget: 'gpu_cloud_run_job_l4',
  runtimePolicyKey: 'gpu_cloud_run_job_l4_planning_only',
  approvalState: 'requires_approval',
  creditGateState: 'estimate_required',
  qaStatus: 'not_checked',
  blockedReasons: ['real_provider_call_blocked'],
}

const manifestLicense = getSoundProviderPolicy('mock_sfx_provider').licensePolicy
const privateManifest: PrivateAudioArtifactManifest = {
  manifestId: 'private-audio-manifest-smoke',
  workspaceId: 'workspace-sound-smoke',
  projectId: 'project-sound-smoke',
  approvedPlanSnapshotId: 'approved-snapshot-sound-smoke',
  artifactKind: 'private_audio_artifact_manifest',
  metadataOnly: true,
  sourceCueIds: [sampleCue.cueId],
  generationRequestIds: ['generation-request-smoke'],
  generatedAssetIds: ['generated-asset-smoke'],
  mediaAssetIds: ['media-asset-smoke'],
  timingMapIds: ['timing-map-smoke'],
  storageScope: 'private',
  publicArtifactAllowed: false,
  licensePolicy: manifestLicense,
  provenanceSummary: 'Smoke fixture metadata only.',
  qaEvidenceIds: ['qa-evidence-smoke'],
  blockedUses: ['real_provider_call_blocked', 'public_artifact_blocked'],
  handoffTargets: ['TRACK_A_RENDER_EXPORT', 'TRACK_B_MEDIA_PROCESSING', 'WORKER_RUNTIME_JOBS'],
  trackAHandoffStatus: 'handoff_required',
  providerGatewayHandoffStatus: 'handoff_required',
  workerRuntimeHandoffStatus: 'handoff_required',
}

const cueManifest: TimingAwareSoundCueManifest = {
  cueManifestId: 'timing-aware-cue-manifest-smoke',
  workspaceId: 'workspace-sound-smoke',
  projectId: 'project-sound-smoke',
  editPlanId: 'edit-plan-sound-smoke',
  approvedPlanSnapshotId: 'approved-snapshot-sound-smoke',
  version: 'sound-1b-smoke',
  metadataOnly: true,
  cues: [sampleCue],
  timingAnchors: ['object_motion'],
  sourceReasoning: ['Cue is tied to visible object motion.'],
  speechDuckingNotes: ['No speech overlap in this fixture.'],
  moodNotes: ['Subtle polish only.'],
  providerPolicyIds: ['dasheng_audiogen_candidate'],
  runtimeTargets: ['gpu_cloud_run_job_l4'],
  blockedUses: ['real_provider_call_blocked'],
  qaReadiness: 'planning_ready',
  trackAHandoffStatus: 'handoff_required',
  trackBHandoffStatus: 'handoff_required',
  trackAFinalRenderReady: false,
  providerExecutionReady: false,
  workerExecutionReady: false,
  generatedAssetIds: ['generated-asset-smoke'],
}

function assertNoForbiddenManifestKeys(value: unknown, path = 'manifest'): void {
  if (!value || typeof value !== 'object') return

  for (const [key, nested] of Object.entries(value)) {
    const normalized = key.toLowerCase()
    check(!normalized.includes('url'), `${path}.${key} must not be a URL field.`)
    check(!normalized.includes('signed'), `${path}.${key} must not be a signed URL field.`)
    check(!normalized.includes('secret'), `${path}.${key} must not be a secret field.`)
    check(!normalized.includes('servicerole'), `${path}.${key} must not be a service-role field.`)
    assertNoForbiddenManifestKeys(nested, `${path}.${key}`)
  }
}

assertNoForbiddenManifestKeys(privateManifest)
assertNoForbiddenManifestKeys(cueManifest)
check(privateManifest.storageScope === 'private', 'Private audio manifest must be private scoped.')
check(privateManifest.publicArtifactAllowed === false, 'Private audio manifest must default publicArtifactAllowed=false.')
check(privateManifest.generatedAssetIds?.every((id) => !/^https?:/i.test(id)) ?? true, 'Generated asset refs must be IDs, not URLs.')
check(cueManifest.generatedAssetIds?.every((id) => !/^https?:/i.test(id)) ?? true, 'Cue manifest generated asset refs must be IDs, not URLs.')

const providerPolicyText = JSON.stringify(SOUND_PROVIDER_POLICIES).toLowerCase()
check(!providerPolicyText.includes('api_key'), 'Provider policies must not contain API keys.')
check(!providerPolicyText.includes('secret_value'), 'Provider policies must not contain secret values.')
check(!providerPolicyText.includes('service_role'), 'Provider policies must not contain service-role keys.')

const artifactKinds = new Set<SoundArtifactKind>()
for (const metadata of Object.values(SOUND_TOOL_REGISTRY_METADATA)) {
  for (const artifactKind of metadata.allowedArtifactKinds) artifactKinds.add(artifactKind)
}
check(artifactKinds.has('private_audio_artifact_manifest'), 'Private audio artifact manifest must be an allowed artifact kind.')
check(artifactKinds.has('timing_aware_cue_manifest'), 'Timing-aware cue manifest must be an allowed artifact kind.')
check(artifactKinds.has('sound_qa_report'), 'Sound QA report must be an allowed artifact kind.')

console.log(JSON.stringify({
  ok: true,
  workstream: SOUND_MUSIC_WORKSTREAM_ID,
  soundToolCount: Object.keys(SOUND_TOOL_REGISTRY_METADATA).length,
  providerPolicyCount: Object.keys(SOUND_PROVIDER_POLICIES).length,
  checkedRuntimeRoutes: [
    'cpu_service',
    'cpu_cloud_run_job',
    'gpu_cloud_run_job_l4',
    'gpu_cloud_run_job_blackwell',
    'mock_only',
    'blocked',
  ],
  realGenerationEnabled: false,
  mayCallProvider: false,
}, null, 2))
