import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/tool-studies/sound-music-audio-tool-study.md',
  'docs/tool-studies/sound-music-audio-capability-map.md',
  'docs/tool-studies/sound-music-audio-tool-combination-map.md',
  'docs/tool-studies/sound-music-audio-routing-policy.md',
  'docs/tool-studies/sound-music-audio-handoff-contract.md',
  'docs/tool-studies/sound-music-audio-internal-beta-gap-map.md',
  'docs/tool-studies/sound-music-audio-blocked-use-register.md',
  'docs/prompt-tool-study-0-sound-music-audio-validation-results.md',
  'docs/implementation-prompts/prompt-tool-study-0-sound-music-audio.md',
]

const capabilityIds = [
  'sound_effects_planning',
  'ambient_audio_planning',
  'ambience_matching_planning',
  'music_cue_planning',
  'soundtrack_layer_planning',
  'audio_bed_planning',
  'transition_sound_planning',
  'whoosh_hit_riser_planning',
  'emotional_tone_audio_planning',
  'timing_aware_sound_cue_manifest',
  'sound_cue_placement_planning',
  'beat_emphasis_cue_planning',
  'platform_safe_audio_style_planning',
  'private_audio_artifact_manifest_policy',
  'open_source_audio_music_sfx_tool_research',
  'track_b_audio_processing_handoff',
  'track_a_final_composition_handoff',
  'provider_gateway_future_audio_generation_handoff',
  'billing_future_audio_credit_handoff',
]

const routeIds = [
  'audioflux_planning',
  'signalsmith_stretch_handoff',
  'mirelo_sfx_v1_5_future_provider_blocked',
  'mmaudio_v2_future_provider_blocked',
  'lyria_pro_future_music_generation_blocked',
  'internal_sound_library_future_planning',
  'timing_aware_sound_cue_manifest',
  'track_b_audio_processing_handoff',
  'track_a_final_composition_handoff',
  'provider_gateway_future_audio_generation_handoff',
  'billing_future_audio_credit_handoff',
]

const exactNoScope =
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.'

const requiredPhrases = [
  'SOUND_MUSIC_AUDIO',
  'ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review',
  'blocked_current_branch_missing_sync_layer',
  exactNoScope,
]

const failures = []

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

for (const capabilityId of capabilityIds) {
  if (!docsText.includes(capabilityId)) failures.push(`missing_capability:${capabilityId}`)
}

for (const routeId of routeIds) {
  if (!docsText.includes(routeId)) failures.push(`missing_route_id:${routeId}`)
}

for (const phrase of requiredPhrases) {
  if (!docsText.includes(phrase)) failures.push(`missing_required_phrase:${phrase.slice(0, 90)}`)
}

const forbiddenPatterns = [
  ['public_artifact_positive', /\bpublic artifacts?\s*(?::|=)\s*`?(enabled|created|allowed|ready|true)\b/i],
  ['signed_url_source_truth_positive', /\bsigned URLs?\s*(?::|=)\s*`?(source-of-truth|source of truth|enabled|created|allowed|true)\b/i],
  ['raw_prompt_execution_positive', /\braw prompt execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['worker_execution_positive', /\bworker execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['provider_call_positive', /\b(provider|model) calls?\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['tool_execution_positive', /\btool execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['route_execution_positive', /\broute execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['supabase_mutation_positive', /\bSupabase mutation\s*(?::|=)\s*`?(enabled|allowed|executed|applied|true)\b/i],
  ['sql_execution_positive', /\bSQL executed:\s*`?(true|yes|applied)\b/i],
  ['production_unlock_positive', /\bproduction unlock\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['external_beta_unlock_positive', /\bexternal beta unlock\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['internal_beta_unlock_positive', /\binternal beta unlock\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['audio_generation_positive', /\b(audio|SFX|music) generation\s*(?::|=)\s*`?(enabled|allowed|ready|executed|generated|true)\b/i],
  ['media_processing_positive', /\b(media|audio) processing\s*(?::|=)\s*`?(enabled|allowed|ready|executed|processed|true)\b/i],
  ['ffmpeg_positive', /\b(FFmpeg|FFprobe)\s*(execution|runtime)\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['deepfilternet_positive', /\bDeepFilterNet runtime\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['demucs_positive', /\b(Demucs|stem separation)\s*(runtime|execution)?\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['provider_audio_generation_positive', /\bprovider audio generation\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['credit_mutation_positive', /\b(credit mutation|billing mutation|Stripe checkout|Stripe webhook|payment processing)\s*(?::|=)\s*`?(enabled|allowed|executed|true)\b/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const expectedScript = 'node scripts/validation/tool-study-sound-music-audio-diagnostics.mjs'
if (packageJson.scripts?.['tool-study:sound-music-audio:diagnostics'] !== expectedScript) {
  failures.push('missing_package_script:tool-study:sound-music-audio:diagnostics')
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  owner: 'SOUND_MUSIC_AUDIO',
  checkedDocs: requiredDocs.length,
  capabilityIds: capabilityIds.length,
  routeIds: routeIds.length,
  readiness: 'ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review',
  supabaseMilestoneSync: 'blocked_current_branch_missing_sync_layer',
  noAudioGeneration: true,
  noMediaProcessing: true,
  noFfmpegOrFfprobeExecution: true,
  noDeepFilterNetRuntime: true,
  noDemucsRuntime: true,
  noProviderCalls: true,
  noToolExecution: true,
  noWorkerExecution: true,
  noRouteExecution: true,
  noSupabaseMutation: true,
  noGcsUpload: true,
  noPublicArtifacts: true,
  noSignedUrls: true,
  noBetaProductionUnlock: true,
  noDependencyMutation: true,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
