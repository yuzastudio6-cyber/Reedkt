import { readFileSync } from 'node:fs'
import { createMockSoundMusicAudioChatCardProps, SoundMusicAudioPlanCard } from '../../src/components/editor/sound'
import type { SoundMusicAudioPlanCardProps } from '../../src/components/editor/sound'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
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
  check(props.summary?.realGenerationBlocked === true, 'Chat card summary must mark real generation blocked.')
  check(props.summary?.mayCallProvider === false, 'Chat card summary must keep mayCallProvider=false.')
  check(props.summary?.mayDispatchWorker === false, 'Chat card summary must keep mayDispatchWorker=false.')
  check(props.summary?.mayCreateGeneratedAsset === false, 'Chat card summary must keep mayCreateGeneratedAsset=false.')
  check(props.summary?.publicArtifactAllowed === false, 'Chat card summary must keep publicArtifactAllowed=false.')
  check(props.draftCreditEstimate === undefined, 'Chat renderer fixture must not create a credit estimate.')
  check(props.privateArtifactManifest?.metadataOnly === true, 'Private artifact manifest must stay metadata-only.')
  check(props.privateArtifactManifest?.storageScope === 'private', 'Private artifact manifest must stay private scoped.')
  check(props.privateArtifactManifest?.publicArtifactAllowed === false, 'Private artifact manifest must disallow public artifacts.')
  check((props.privateArtifactManifest?.generatedAssetIds?.length ?? 0) === 0, 'Private artifact manifest must not reference generated assets.')
  check(props.timingManifest?.metadataOnly === true, 'Timing manifest must stay metadata-only.')
  check(props.timingManifest?.trackAFinalRenderReady === false, 'Timing manifest must not claim Track A final export readiness.')
  check(props.timingManifest?.providerExecutionReady === false, 'Timing manifest must not claim provider execution readiness.')
  check(props.timingManifest?.workerExecutionReady === false, 'Timing manifest must not claim worker execution readiness.')
  check((props.timingManifest?.generatedAssetIds?.length ?? 0) === 0, 'Timing manifest must not reference generated assets.')
  check(props.accessSafety?.signedUrlExposure === false, 'Chat card props must not expose signed URLs.')
  check(props.accessSafety?.providerSecretExposure === false, 'Chat card props must not expose provider secrets.')
  check(props.accessSafety?.serviceRoleKeyExposure === false, 'Chat card props must not expose service-role keys.')
  check(props.handoffReadiness?.trackAStatus === 'handoff_required', 'Track A final composition handoff must remain required.')
  check(props.handoffReadiness?.trackBStatus === 'handoff_required', 'Track B processing handoff must remain required.')
  check(props.handoffReadiness?.providerGatewayStatus === 'handoff_required', 'Provider Gateway handoff must remain required.')
  check(props.handoffReadiness?.workerRuntimeStatus === 'blocked', 'Worker Runtime dispatch must remain blocked.')
  check(props.handoffReadiness?.supabaseStatus === 'blocked', 'Supabase mutation/storage handoff must remain blocked.')
  check(props.handoffReadiness?.observabilityStatus === 'handoff_required', 'Observability handoff must remain required.')
  check(props.handoffMetadata?.TRACK_A_RENDER_EXPORT.finalRenderReady === false, 'Track A metadata must keep finalRenderReady=false.')
  check(props.handoffMetadata?.PROVIDER_GATEWAY_MODELS.mayCallProvider === false, 'Provider Gateway metadata must keep mayCallProvider=false.')
  check(props.handoffMetadata?.WORKER_RUNTIME_JOBS.mayDispatchWorker === false, 'Worker Runtime metadata must keep mayDispatchWorker=false.')
  check(props.handoffMetadata?.SUPABASE_RLS_STORAGE_DATABASE.mutationAllowed === false, 'Supabase metadata must keep mutationAllowed=false.')
  check(props.handoffMetadata?.SUPABASE_RLS_STORAGE_DATABASE.storageWriteAllowed === false, 'Supabase metadata must keep storageWriteAllowed=false.')
  check(props.handoffMetadata?.BILLING_STRIPE_CREDITS.creditRowsCreated === false, 'Billing metadata must not create credit rows.')
  check(props.handoffMetadata?.BILLING_STRIPE_CREDITS.approvalRowsCreated === false, 'Billing metadata must not create approval rows.')
  check(props.handoffMetadata?.BILLING_STRIPE_CREDITS.reservationRowsCreated === false, 'Billing metadata must not create reservation rows.')
  check(props.executionGateResults?.every((gate) => !gate.mayCallProvider && !gate.mayDispatchWorker && !gate.mayCreateGeneratedAsset) === true, 'Execution gates must remain fail-closed.')
}

const props = createMockSoundMusicAudioChatCardProps()
check(typeof SoundMusicAudioPlanCard === 'function', 'SoundMusicAudioPlanCard must remain exported for chat rendering.')
check(props.plan.workstreamId === 'SOUND_MUSIC_AUDIO', 'Chat renderer props must report SOUND_MUSIC_AUDIO ownership.')
check((props.cueGroups?.actionFoley.length ?? 0) >= 2, 'Action/foley SFX cues must appear in grouped chat data.')
check((props.cueGroups?.ambience.length ?? 0) >= 1, 'Ambience/everyday cues must appear in grouped chat data.')
check((props.cueGroups?.music.length ?? 0) >= 1, 'Music/Lyria planning cues must appear in grouped chat data.')
check(props.cueGroups?.actionFoley.some((cue) => cue.family === 'transition_sound' || cue.family === 'whoosh_hit_riser') === true, 'Transition/whoosh/hit/riser cues must group as action/foley SFX.')
check(props.cueGroups?.ambience.some((cue) => cue.family === 'ambient_everyday_soundscape') === true, 'Everyday soundscape cues must group as ambience.')
check(props.cueGroups?.music.some((cue) => cue.providerCandidate === 'lyria_mock') === true, 'Lyria planning cue must appear in the music group.')
check(![...(props.cueGroups?.actionFoley ?? []), ...(props.cueGroups?.ambience ?? [])].some((cue) => cue.providerCandidate === 'lyria_mock'), 'Lyria must not be used as an SFX/foley/ambience provider.')
check(props.lyriaPlanning?.present === true, 'Lyria planning metadata must be present for music planning.')
check(props.lyriaPlanning?.usedForSfxFoleyAmbience === false, 'Lyria metadata must explicitly reject SFX/foley/ambience use.')
check(props.lyriaPlanning?.generationEnabled === false, 'Lyria generation must remain disabled.')
check(props.lyriaPlanning?.providerGatewayRequired === true, 'Lyria must require Provider Gateway handoff.')
check(props.providerSummaries?.some((provider) => provider.providerId === 'dasheng_audiogen_candidate' && provider.generationEnabled === false) === true, 'Dasheng candidate status must remain metadata-only.')
check(props.providerSummaries?.some((provider) => provider.providerId === 'stable_audio_open_license_gated' && provider.generationEnabled === false) === true, 'Stable Audio license-gated status must remain metadata-only.')
check(props.runtimeSummaries?.every((runtime) => runtime.mayCallProvider === false && runtime.generationAllowed === false) === true, 'Runtime summaries must keep provider calls and generation disabled.')
check(props.runtimeSummaries?.some((runtime) => runtime.runtimeTarget === 'gpu_cloud_run_job_l4' && runtime.mayDispatchWorker === false) === true, 'GPU runtime metadata must not dispatch workers.')
check(props.qaNotes?.some((note) => /speech|ducking|voice/i.test(note)) === true, 'QA notes must include speech/ducking guidance.')
check(props.soundSyncNotes?.some((note) => /cut|transition|soundsync|ducking/i.test(note)) === true, 'SoundSync notes must include timing/ducking coordination.')
check(props.toolRequests?.every((request) => request.executionMode === 'planning_only') === true, 'Tool requests must remain planning-only metadata.')
check(props.toolRequests?.some((request) => request.metadata?.rawChatAsWorkerPlan === false) === true, 'Raw chat must not become a worker execution plan.')
check(props.handoffItems?.some((item) => item.workstream === 'TRACK_A_RENDER_EXPORT' && item.finalExportReady === false) === true, 'Track A final export readiness must be false/not-ready.')
check(props.handoffItems?.some((item) => item.workstream === 'PROVIDER_GATEWAY_MODELS' && item.status === 'handoff_required') === true, 'Provider Gateway handoff must be required for real transport.')
check(props.handoffItems?.some((item) => item.workstream === 'WORKER_RUNTIME_JOBS' && item.status === 'blocked') === true, 'Worker Runtime handoff must be required/blocked for execution.')
check(props.handoffItems?.some((item) => item.workstream === 'SUPABASE_RLS_STORAGE_DATABASE' && item.status === 'blocked') === true, 'Supabase handoff must be required/blocked for mutation/storage.')
assertFailClosed(props)
assertNoNetworkOrCredentialValues(props)

const removedCueId = props.plan.cuePlans[0]?.cueId
check(Boolean(removedCueId), 'Mock chat fixture must include at least one removable cue.')
const removedProps = createMockSoundMusicAudioChatCardProps({ removedCueIds: [removedCueId] })
check(!removedProps.plan.cuePlans.some((cue) => cue.cueId === removedCueId), 'Removed cue must be filtered from local mock props.')
check((removedProps.summary?.cueCount ?? 0) === (props.summary?.cueCount ?? 0) - 1, 'Removed cue must update local summary counts only.')
assertFailClosed(removedProps)

const approvedProps = createMockSoundMusicAudioChatCardProps({ approvedPreview: true })
check(approvedProps.plan.warnings.some((warning) => /local chat UI state only/i.test(warning)), 'Mock approval must remain local UI state only.')
assertFailClosed(approvedProps)

const chatNativeEditorSource = readFileSync('src/components/editor/ChatNativeEditor.tsx', 'utf8')
check(chatNativeEditorSource.includes('SoundMusicAudioPlanCard'), 'ChatNativeEditor must render the SOUND card.')
check(chatNativeEditorSource.includes('showSoundMusicAudioPlan'), 'ChatNativeEditor must gate the SOUND card behind local mock state.')
check(chatNativeEditorSource.includes('Open mock sound plan'), 'ChatNativeEditor must expose a safe mock entry label.')
check(!chatNativeEditorSource.includes('Start worker'), 'Chat renderer must not expose a Start worker label.')
check(!chatNativeEditorSource.includes('Spend credits'), 'Chat renderer must not expose a Spend credits label.')

console.log(JSON.stringify({
  ok: true,
  card: 'SOUND-1F',
  workstream: props.plan.workstreamId,
  actionFoleyCueCount: props.cueGroups?.actionFoley.length ?? 0,
  ambienceCueCount: props.cueGroups?.ambience.length ?? 0,
  musicCueCount: props.cueGroups?.music.length ?? 0,
  lyriaMusicOnly: props.lyriaPlanning?.usedForSfxFoleyAmbience === false,
  mayCallProvider: false,
  mayDispatchWorker: false,
  mayCreateGeneratedAsset: false,
  publicArtifactAllowed: false,
  trackAFinalExportReady: false,
  providerGatewayRequired: true,
  workerRuntimeBlocked: true,
  supabaseMutationBlocked: true,
}, null, 2))
