import { mockSoundMusicAudioScenarios } from '../../src/backend/mock/mock-sound-music-audio-scenarios'
import { planSoundMusicAudio } from '../../src/backend/services/sound-agent-planner-service'
import {
  buildSoundMusicAudioPlanCardProps,
  type SoundMusicAudioPlanCardProps,
} from '../../src/components/editor/sound/buildSoundMusicAudioPlanCardProps'
import type {
  SoundAgentPlannerInput,
  SoundAgentPlannerResult,
  SoundProviderId,
} from '../../src/types/audio-music'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function scenario(id: string): SoundAgentPlannerInput {
  const match = mockSoundMusicAudioScenarios.find((candidate) => candidate.id === id)
  if (!match) throw new Error(`Missing mock SOUND scenario ${id}.`)
  return match.input
}

function plan(id: string): SoundAgentPlannerResult {
  return planSoundMusicAudio(scenario(id))
}

function assertNoNetworkOrCredentialValues(value: unknown, path = 'props'): void {
  if (!value || typeof value !== 'object') return

  for (const [key, nested] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase()
    check(!normalizedKey.includes('apikey'), `${path}.${key} must not expose an API key field.`)
    check(!normalizedKey.includes('api_key'), `${path}.${key} must not expose an API key field.`)

    if (typeof nested === 'string') {
      const normalizedValue = nested.toLowerCase()
      check(!/^https?:\/\//i.test(nested), `${path}.${key} must not contain a public URL.`)
      check(!normalizedValue.includes('api_key'), `${path}.${key} must not contain an API key value.`)
      check(!normalizedValue.includes('service_role'), `${path}.${key} must not contain a service-role value.`)
      check(!normalizedValue.includes('sk-'), `${path}.${key} must not contain a provider credential shape.`)
    }

    assertNoNetworkOrCredentialValues(nested, `${path}.${key}`)
  }
}

function assertFailClosed(props: SoundMusicAudioPlanCardProps): void {
  check(props.summary?.realGenerationBlocked === true, 'Card summary must mark real generation blocked.')
  check(props.summary?.mayCallProvider === false, 'Card summary must keep mayCallProvider=false.')
  check(props.summary?.mayDispatchWorker === false, 'Card summary must keep mayDispatchWorker=false.')
  check(props.summary?.mayCreateGeneratedAsset === false, 'Card summary must keep mayCreateGeneratedAsset=false.')
  check(props.summary?.publicArtifactAllowed === false, 'Card summary must keep publicArtifactAllowed=false.')
  check(props.draftCreditEstimate?.noSpendOccurred === true, 'Card props must preserve noSpendOccurred=true.')
  check(props.privateArtifactManifest?.storageScope === 'private', 'Private audio manifest must stay private scoped.')
  check(props.privateArtifactManifest?.publicArtifactAllowed === false, 'Private audio manifest must disallow public artifacts.')
  check(props.timingManifest?.trackAFinalRenderReady === false, 'Timing manifest must not claim Track A final export readiness.')
  check(props.timingManifest?.providerExecutionReady === false, 'Timing manifest must not claim provider execution readiness.')
  check(props.timingManifest?.workerExecutionReady === false, 'Timing manifest must not claim worker execution readiness.')
  check(props.accessSafety?.signedUrlExposure === false, 'Card props must not expose signed URLs.')
  check(props.accessSafety?.providerSecretExposure === false, 'Card props must not expose provider secrets.')
  check(props.accessSafety?.serviceRoleKeyExposure === false, 'Card props must not expose service-role keys.')
  check(props.handoffReadiness?.trackAStatus === 'handoff_required', 'Track A handoff must remain required.')
  check(props.handoffReadiness?.providerGatewayStatus === 'handoff_required', 'Provider Gateway handoff must remain required.')
  check(props.handoffReadiness?.workerRuntimeStatus === 'blocked', 'Worker Runtime dispatch must remain blocked.')
  check(props.handoffReadiness?.supabaseStatus === 'blocked', 'Supabase mutation/storage handoff must remain blocked.')
  check(props.handoffMetadata?.TRACK_A_RENDER_EXPORT.finalRenderReady === false, 'Track A handoff metadata must keep finalRenderReady=false.')
  check(props.handoffMetadata?.PROVIDER_GATEWAY_MODELS.mayCallProvider === false, 'Provider Gateway metadata must keep mayCallProvider=false.')
  check(props.handoffMetadata?.WORKER_RUNTIME_JOBS.mayDispatchWorker === false, 'Worker Runtime metadata must keep mayDispatchWorker=false.')
  check(props.handoffMetadata?.SUPABASE_RLS_STORAGE_DATABASE.mutationAllowed === false, 'Supabase metadata must keep mutationAllowed=false.')
}

const transition = buildSoundMusicAudioPlanCardProps(plan('short-transition-whoosh'))
check((transition.cueGroups?.actionFoley.length ?? 0) > 0, 'Action/foley cues must appear in grouped card data.')
check(transition.cueGroups?.actionFoley.some((cue) => cue.family === 'transition_sound' || cue.family === 'whoosh_hit_riser') === true, 'Transition sounds/whooshes/hits/risers must group as action/foley SFX.')

const ambience = buildSoundMusicAudioPlanCardProps(plan('ambient-city-cafe-bed'))
check((ambience.cueGroups?.ambience.length ?? 0) > 0, 'Ambience/everyday cues must appear in grouped card data.')
check(ambience.providerSummaries?.some((provider) => provider.providerId === 'stable_audio_open_license_gated') === true, 'Stable Audio license-gated ambient metadata must be visible when included.')

const music = buildSoundMusicAudioPlanCardProps(plan('music-mood-layer'))
check((music.cueGroups?.music.length ?? 0) > 0, 'Music/Lyria planning cues must appear in grouped card data.')
check(music.lyriaPlanning?.present === true, 'Lyria planning metadata must be present for music cue planning.')
check(music.lyriaPlanning?.providerGatewayRequired === true, 'Lyria planning must require Provider Gateway handoff.')
check(music.lyriaPlanning?.generationEnabled === false, 'Lyria generation must remain disabled.')
check(music.lyriaPlanning?.usedForSfxFoleyAmbience === false, 'Lyria must not be represented as SFX/foley/ambience.')

const forbiddenLyriaGroups = [
  ...(music.cueGroups?.actionFoley ?? []),
  ...(music.cueGroups?.ambience ?? []),
]
check(!forbiddenLyriaGroups.some((cue) => cue.providerCandidate === 'lyria_mock'), 'Lyria must not be used as an SFX/foley/ambience provider.')

const dialogue = buildSoundMusicAudioPlanCardProps(plan('dialogue-heavy-ducking'))
check((dialogue.summary?.duckingCueCount ?? 0) > 0, 'Speech/ducking warnings must be counted.')
check(dialogue.qaNotes?.some((note) => /ducking|speech|voice/i.test(note)) === true, 'QA notes must include speech/ducking guidance.')
check(dialogue.soundSyncNotes?.some((note) => /ducking|soundsync|beat|cut|transition/i.test(note)) === true, 'SoundSync/timing notes must be present.')

for (const props of [transition, ambience, music, dialogue]) {
  assertFailClosed(props)
  assertNoNetworkOrCredentialValues(props)
  check((props.handoffItems?.length ?? 0) >= 6, 'Card props must include cross-chat handoff statuses.')
  check(props.handoffItems?.some((item) => item.workstream === 'TRACK_A_RENDER_EXPORT' && item.finalExportReady === false) === true, 'Track A final export readiness must be false/not-ready.')
  check(props.handoffItems?.some((item) => item.workstream === 'PROVIDER_GATEWAY_MODELS' && item.status === 'handoff_required') === true, 'Provider Gateway must be required for real transport.')
  check(props.handoffItems?.some((item) => item.workstream === 'WORKER_RUNTIME_JOBS' && item.status === 'blocked') === true, 'Worker Runtime must be required/blocked for execution.')
  check(props.handoffItems?.some((item) => item.workstream === 'SUPABASE_RLS_STORAGE_DATABASE' && item.status === 'blocked') === true, 'Supabase handoff must be required/blocked for mutation/storage.')
}

const disabledProviders: SoundProviderId[] = [
  'openmoss_moss_soundeffect_v2_pending_verification',
  'meta_audiogen_disabled',
  'woosh_disabled',
  'tangoflux_disabled',
  'mmaudio_disabled',
]
for (const providerId of disabledProviders) {
  check(!transition.providerSummaries?.some((provider) => provider.providerId === providerId), `${providerId} must not be selected by card props.`)
}

console.log(JSON.stringify({
  ok: true,
  card: 'SOUND-1E',
  workstream: transition.plan.workstreamId,
  actionFoleyCueCount: transition.cueGroups?.actionFoley.length ?? 0,
  ambienceCueCount: ambience.cueGroups?.ambience.length ?? 0,
  musicCueCount: music.cueGroups?.music.length ?? 0,
  lyriaMusicOnly: music.lyriaPlanning?.usedForSfxFoleyAmbience === false,
  mayCallProvider: false,
  mayDispatchWorker: false,
  mayCreateGeneratedAsset: false,
  publicArtifactAllowed: false,
  trackAFinalExportReady: false,
  providerGatewayRequired: true,
  workerRuntimeBlocked: true,
  supabaseMutationBlocked: true,
}, null, 2))
