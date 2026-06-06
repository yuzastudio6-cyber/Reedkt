import {
  getSoundProviderPolicy,
  resolveSoundRuntimeTarget,
} from '../../src/backend/contracts/sound-music-audio-contracts'
import { mockSoundMusicAudioScenarios } from '../../src/backend/mock/mock-sound-music-audio-scenarios'
import { planSoundMusicAudio } from '../../src/backend/services/sound-agent-planner-service'
import type {
  SoundAgentPlannerInput,
  SoundAgentPlannerResult,
  SoundBlockedUseReason,
  SoundProviderId,
  SoundToolId,
} from '../../src/types/audio-music'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function scenario(id: string): SoundAgentPlannerInput {
  const match = mockSoundMusicAudioScenarios.find((candidate) => candidate.id === id)
  check(Boolean(match), `Missing mock SOUND scenario ${id}.`)
  return match.input
}

function checkReason(result: { blockedReasons: SoundBlockedUseReason[] }, reason: SoundBlockedUseReason): void {
  check(result.blockedReasons.includes(reason), `Expected blocked reason ${reason}.`)
}

function assertNoForbiddenOutputKeys(value: unknown, path = 'result'): void {
  if (!value || typeof value !== 'object') return

  for (const [key, nested] of Object.entries(value)) {
    const normalized = key.toLowerCase()
    check(!normalized.includes('url'), `${path}.${key} must not be a URL field.`)
    check(!normalized.includes('signed'), `${path}.${key} must not be a signed URL field.`)
    check(!normalized.includes('apikey'), `${path}.${key} must not be an API key field.`)
    check(!normalized.includes('api_key'), `${path}.${key} must not be an API key field.`)
    check(!normalized.includes('servicerole'), `${path}.${key} must not be a service-role field.`)
    check(!normalized.includes('service_role'), `${path}.${key} must not be a service-role field.`)

    if (typeof nested === 'string') {
      const normalizedValue = nested.toLowerCase()
      check(!/^https?:\/\//i.test(nested), `${path}.${key} must not contain a public URL.`)
      check(!normalizedValue.includes('api_key'), `${path}.${key} must not contain an API key.`)
      check(!normalizedValue.includes('service_role'), `${path}.${key} must not contain a service-role value.`)
    }

    assertNoForbiddenOutputKeys(nested, `${path}.${key}`)
  }
}

function checkNoProviderCalls(result: SoundAgentPlannerResult): void {
  for (const gate of result.executionGateResults) {
    check(!gate.mayCallProvider, 'Execution gates must never call providers.')
    check(!gate.mayDispatchWorker, 'Execution gates must never dispatch workers.')
    check(!gate.mayCreateGeneratedAsset, 'Execution gates must never create generated assets.')
  }
  check(result.draftCreditEstimate.noSpendOccurred, 'Draft estimate must record no spend.')
  check(!result.draftCreditEstimate.creditRowsCreated, 'Draft estimate must not create credit rows.')
  check(!result.draftCreditEstimate.approvalRowsCreated, 'Draft estimate must not create approval rows.')
  check(!result.draftCreditEstimate.reservationRowsCreated, 'Draft estimate must not create reservation rows.')
}

const transition = planSoundMusicAudio(scenario('short-transition-whoosh'))
check(transition.plan.workstreamId === 'SOUND_MUSIC_AUDIO', 'Planner must report SOUND_MUSIC_AUDIO ownership.')
check(transition.plan.cuePlans.some((cue) => cue.toolId === 'action_foley_sfx_tool'), 'Transition cue must route to action foley SFX tool.')
check(transition.plan.cuePlans.some((cue) => cue.family === 'transition_sound' || cue.family === 'whoosh_hit_riser'), 'Transition cue must use event cue family.')
check(transition.toolRequests.some((request) => request.toolId === 'soundsync_planner'), 'Beat/cut coordination must include SoundSync metadata.')
checkNoProviderCalls(transition)

const title = planSoundMusicAudio(scenario('title-card-hit'))
check(title.plan.cuePlans.some((cue) => cue.role === 'title_card_accent'), 'Title-card scenario must create a title accent cue.')
check(title.plan.cuePlans.some((cue) => cue.toolId === 'action_foley_sfx_tool'), 'Title-card accent must use action foley SFX metadata.')

const ambience = planSoundMusicAudio(scenario('ambient-city-cafe-bed'))
check(ambience.plan.cuePlans.some((cue) => cue.toolId === 'ambient_everyday_soundscape_tool'), 'Ambience scenario must route to ambient everyday soundscape tool.')
check(ambience.plan.cuePlans.some((cue) => cue.role === 'background_bed' || cue.role === 'room_tone'), 'Ambience scenario must create a background/room-tone cue.')
check(ambience.plan.providerPolicies.some((policy) => policy.providerId === 'stable_audio_open_license_gated'), 'Stable Audio must appear only as optional ambient license-gated metadata.')
check(!ambience.plan.cuePlans.some((cue) => cue.providerCandidate === 'stable_audio_open_license_gated'), 'Stable Audio must not be selected as the cue execution provider.')

const music = planSoundMusicAudio(scenario('music-mood-layer'))
check(music.plan.cuePlans.some((cue) => cue.toolId === 'music_cue_planner'), 'Music mood scenario must route to music cue planner.')
check(music.plan.cuePlans.some((cue) => cue.providerCandidate === 'lyria_mock'), 'Planning-only music cue should use Lyria mock placeholder metadata.')
check(music.plan.cuePlans.some((cue) => cue.providerPolicyStatus === 'mock_only_real_client_placeholder_fail_closed'), 'Lyria mock must remain fail-closed.')

const dialogue = planSoundMusicAudio(scenario('dialogue-heavy-ducking'))
check(dialogue.plan.cuePlans.some((cue) => cue.duckingRequired), 'Dialogue-heavy scenario must require ducking.')
check(dialogue.qaWarnings.some((warning) => /ducking|cleanup|speech/i.test(warning)), 'Dialogue-heavy scenario must emit QA warnings.')
const audioQaRequest = dialogue.toolRequests.find((request) => request.toolId === 'audio_qa_tool')
check(Boolean(audioQaRequest), 'Dialogue-heavy scenario must request audio QA metadata.')
check(audioQaRequest?.runtimeTarget === 'cpu_cloud_run_job', 'Audio QA metadata must route to cpu_cloud_run_job.')

const noReasonInput: SoundAgentPlannerInput = {
  ...scenario('ambient-city-cafe-bed'),
  deterministicIdSeed: 'mock-sound-seed-no-reason',
  userSoundPreferences: {
    ...scenario('ambient-city-cafe-bed').userSoundPreferences,
    enableSfx: false,
    enableAmbience: false,
    enableMusic: false,
    moodKeywords: [],
  },
  existingAudioContext: {
    ...scenario('ambient-city-cafe-bed').existingAudioContext,
    ambienceDescription: '',
    musicMood: undefined,
  },
}
const noReason = planSoundMusicAudio(noReasonInput)
check(noReason.plan.cuePlans.some((cue) => cue.role === 'silence_or_no_cue'), 'No clear reason must resolve to silence_or_no_cue.')

const rawRejected = planSoundMusicAudio(scenario('raw-chat-rejected'))
checkReason(rawRejected, 'raw_chat_execution_blocked')
check(rawRejected.handoffReadiness.audioReadinessStatus === 'blocked', 'Raw chat prompt input must block readiness.')

const approvedBlocked = planSoundMusicAudio(scenario('approved-generation-blocked'))
checkReason(approvedBlocked, 'credit_reservation_required')
checkReason(approvedBlocked, 'provider_generation_disabled')
checkReason(approvedBlocked, 'worker_execution_not_allowed')
check(approvedBlocked.executionGateResults.every((gate) => !gate.allowed), 'Approved generation must remain blocked in SOUND-1C.')

const internalBetaBlocked = planSoundMusicAudio({
  ...scenario('approved-generation-blocked'),
  deterministicIdSeed: 'mock-sound-seed-internal-beta-blocked',
  executionMode: 'internal_beta_generation',
  requestedOutputMode: 'handoff_manifest_only',
})
checkReason(internalBetaBlocked, 'internal_test_scope_required')
checkReason(internalBetaBlocked, 'worker_execution_not_allowed')

const mockPreview = planSoundMusicAudio({
  ...scenario('short-transition-whoosh'),
  deterministicIdSeed: 'mock-sound-seed-mock-preview',
  executionMode: 'mock_preview_only',
  requestedOutputMode: 'mock_preview_only',
})
check(mockPreview.executionGateResults.some((gate) => gate.allowed), 'Mock preview must allow metadata-only mock planning.')
check(mockPreview.plan.cuePlans.every((cue) => cue.runtimeTarget === 'mock_only'), 'Mock preview cues must route to mock_only.')
check(mockPreview.plan.cuePlans.every((cue) => cue.providerCandidate === 'mock_sfx_provider' || cue.providerCandidate === 'mock_music_provider'), 'Mock preview must use mock providers.')

const disabledProviders: SoundProviderId[] = [
  'openmoss_moss_soundeffect_v2_pending_verification',
  'meta_audiogen_disabled',
  'woosh_disabled',
  'tangoflux_disabled',
  'mmaudio_disabled',
]
for (const providerId of disabledProviders) {
  check(!transition.plan.providerPolicies.some((policy) => policy.providerId === providerId), `${providerId} must not be selected by the planner.`)
  check(!transition.plan.cuePlans.some((cue) => cue.providerCandidate === providerId), `${providerId} must not be a cue provider.`)
}

for (const providerId of ['audioflux_analysis_only', 'signalsmith_stretch_processing_only'] satisfies SoundProviderId[]) {
  const policy = getSoundProviderPolicy(providerId)
  check(!policy.generationEnabled, `${providerId} generation must be disabled.`)
  check(!transition.plan.cuePlans.some((cue) => cue.providerCandidate === providerId), `${providerId} must not be a generation cue provider.`)
}

check(resolveSoundRuntimeTarget({ toolId: 'private_audio_artifact_manifest_builder' }) === 'cpu_service', 'Private manifest builder must route to cpu_service.')
check(resolveSoundRuntimeTarget({ toolId: 'timing_aware_cue_manifest_builder' }) === 'cpu_service', 'Timing manifest builder must route to cpu_service.')
check(resolveSoundRuntimeTarget({ providerId: 'dasheng_audiogen_candidate' }) === 'gpu_cloud_run_job_l4', 'Dasheng future metadata must route to gpu_cloud_run_job_l4.')
check(resolveSoundRuntimeTarget({ providerId: 'stable_audio_open_license_gated' }) === 'gpu_cloud_run_job_l4', 'Stable future metadata must route to gpu_cloud_run_job_l4.')
check(resolveSoundRuntimeTarget({ providerId: 'meta_audiogen_disabled' }) === 'blocked', 'Disabled providers must route to blocked.')

for (const result of [transition, title, ambience, music, dialogue, noReason, rawRejected, approvedBlocked, internalBetaBlocked, mockPreview]) {
  checkNoProviderCalls(result)
  assertNoForbiddenOutputKeys(result)
  check(result.timingAwareCueManifest.metadataOnly, 'Cue manifest must be metadata only.')
  check(!result.timingAwareCueManifest.trackAFinalRenderReady, 'Cue manifest must not claim Track A final render readiness.')
  check(!result.timingAwareCueManifest.providerExecutionReady, 'Cue manifest must not claim provider execution readiness.')
  check(!result.timingAwareCueManifest.workerExecutionReady, 'Cue manifest must not claim worker execution readiness.')
  check(result.privateAudioArtifactManifest.storageScope === 'private', 'Private audio manifest must be private scoped.')
  check(result.privateAudioArtifactManifest.publicArtifactAllowed === false, 'Private audio manifest must disallow public artifacts.')
  check(result.privateAudioArtifactManifest.generatedAssetIds?.length === 0, 'Private manifest must be valid without generated assets.')
  check(result.handoffReadiness.trackAStatus === 'handoff_required', 'Track A must remain a handoff.')
  check(result.handoffReadiness.workerRuntimeStatus === 'blocked', 'Worker runtime dispatch must remain blocked.')
  check(result.handoffReadiness.supabaseStatus === 'blocked', 'Supabase mutation must remain blocked.')
  check(result.handoffReadiness.productionReadinessStatus === 'blocked', 'Production/beta readiness must remain blocked.')
  check(result.handoffMetadata.TRACK_A_RENDER_EXPORT.finalRenderReady === false, 'Track A handoff metadata must not claim final render readiness.')
  check(result.handoffMetadata.PROVIDER_GATEWAY_MODELS.mayCallProvider === false, 'Provider Gateway handoff must not allow provider calls.')
  check(result.handoffMetadata.WORKER_RUNTIME_JOBS.mayDispatchWorker === false, 'Worker Runtime handoff must not dispatch workers.')
  check(result.handoffMetadata.SUPABASE_RLS_STORAGE_DATABASE.mutationAllowed === false, 'Supabase handoff must not allow mutation.')
}

const soundToolIds = new Set<SoundToolId>()
for (const result of [transition, title, ambience, music, dialogue]) {
  for (const request of result.toolRequests) soundToolIds.add(request.toolId)
}
check(soundToolIds.has('private_audio_artifact_manifest_builder'), 'Private manifest builder metadata must be requested.')
check(soundToolIds.has('timing_aware_cue_manifest_builder'), 'Timing-aware cue manifest builder metadata must be requested.')
check(soundToolIds.has('soundsync_planner'), 'SoundSync metadata must be requested for coordinated cues.')
check(soundToolIds.has('audio_qa_tool'), 'Audio QA metadata must be requested when speech/cleanup requires it.')

console.log(JSON.stringify({
  ok: true,
  scenariosChecked: mockSoundMusicAudioScenarios.length,
  planner: 'SOUND-1C',
  workstream: transition.plan.workstreamId,
  mayCallProvider: false,
  mayDispatchWorker: false,
  mayCreateGeneratedAsset: false,
  storageScope: transition.privateAudioArtifactManifest.storageScope,
  publicArtifactAllowed: transition.privateAudioArtifactManifest.publicArtifactAllowed,
}, null, 2))
