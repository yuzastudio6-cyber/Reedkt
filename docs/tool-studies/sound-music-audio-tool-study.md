# SOUND_MUSIC_AUDIO Tool Study

Owner: `SOUND_MUSIC_AUDIO`

Decision: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

Mode: docs and diagnostics only.

## Source Reads

| Source | Status | Fact |
| --- | --- | --- |
| `docs/tool-studies/web-search-capture-tool-study.md` | present | WEB_SEARCH_CAPTURE contract is merged and preserved. |
| `docs/tool-studies/map-geospatial-tool-study.md` | present | MAP_GEOSPATIAL contract is merged and preserved. |
| `docs/tool-studies/ai-tools-creative-graphics-tool-study.md` | present | AI_TOOLS_CREATIVE_GRAPHICS contract is merged and preserved. |
| `docs/tool-studies/track-a-render-export-tool-study.md` | present | TRACK_A_RENDER_EXPORT contract is merged and preserved. |
| `docs/tool-studies/track-b-media-processing-tool-study.md` | present | TRACK_B_MEDIA_PROCESSING contract is merged and hands audio cleanup/stretch/stem-separation review to this owner. |
| `docs/activation-phase-tool-route-0-execution-unlock-audit-results.md` | present | Tool-route execution remains audit-only. |
| `docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md` | present | Worker dry-run remains non-executing. |
| `docs/activation-phase-provider-output-plan-snapshot-contract-results.md` | present | Plan snapshot evidence remains candidate-only. |
| `docs/activation-phase-model-provider-dry-run-results.md` | present | Provider dry-run evidence is source context only. |
| `soundsync-audio-pipeline-planning.md` | present | SoundSync audio planning is voice-first and planning-only here. |
| `audio-settings-catalog.md` | present | Audio settings are metadata, not runtime execution. |
| `soundsync-sfx-director.md` | present | SFX must be cue-linked and speech-safe. |
| `sfx-provider-strategy.md` | present | Mirelo and MMAudio remain future provider routes. |
| `docs/lyria-worker-plan.md` | present | Lyria remains mock/disabled planning. |
| `docs/lyria-integration-adapter.md` | present | Lyria real mode remains blocked. |
| `docs/google-cloud-audio-worker-plan.md` | present | Google Cloud audio workers are future planning only. |
| `server/activation/supabase-milestone-sync` | missing_on_base | Milestone sync is `blocked_current_branch_missing_sync_layer`; no writer is added. |

## Owner Contract

SOUND_MUSIC_AUDIO owns planning and route classification for sound cues, ambience, music cues, soundtrack layers, transition sounds, whooshes/hits/risers, emotional tone audio, timing-aware cue manifests, private audio artifact manifest policy, open-source audio/music/SFX tool research, Track B audio processing handoffs, Track A final composition handoffs, Provider Gateway future audio generation handoffs, and Billing future audio credit handoffs.

SOUND_MUSIC_AUDIO does not own real audio/SFX/music generation, real media processing, FFmpeg/FFprobe execution, DeepFilterNet runtime, Demucs/stem separation, provider/model calls, worker execution, route execution, Supabase mutation, public artifact creation, signed URL delivery, credit mutation, beta unlock, production unlock, dependency mutation, raw prompt execution, or final render/export.

## Required Capability IDs

- `sound_effects_planning`
- `ambient_audio_planning`
- `ambience_matching_planning`
- `music_cue_planning`
- `soundtrack_layer_planning`
- `audio_bed_planning`
- `transition_sound_planning`
- `whoosh_hit_riser_planning`
- `emotional_tone_audio_planning`
- `timing_aware_sound_cue_manifest`
- `sound_cue_placement_planning`
- `beat_emphasis_cue_planning`
- `platform_safe_audio_style_planning`
- `private_audio_artifact_manifest_policy`
- `open_source_audio_music_sfx_tool_research`
- `track_b_audio_processing_handoff`
- `track_a_final_composition_handoff`
- `provider_gateway_future_audio_generation_handoff`
- `billing_future_audio_credit_handoff`

## Planning-Only Route IDs

- `audioflux_planning`
- `signalsmith_stretch_handoff`
- `mirelo_sfx_v1_5_future_provider_blocked`
- `mmaudio_v2_future_provider_blocked`
- `lyria_pro_future_music_generation_blocked`
- `internal_sound_library_future_planning`
- `timing_aware_sound_cue_manifest`
- `track_b_audio_processing_handoff`
- `track_a_final_composition_handoff`
- `provider_gateway_future_audio_generation_handoff`
- `billing_future_audio_credit_handoff`

## Source-Of-Truth Policy

Source-of-truth records are private structured manifests, source refs, checksum refs, cue spec records, timing refs, scene refs, mood/category/intensity/platform fields, QA reports, provenance records, cost assumptions, and owner handoff records.

Not source-of-truth: raw media, generated audio bytes, temporary render outputs, screenshots/previews, signed URLs, raw prompts, raw provider outputs, public artifacts, Stripe events, provider payloads, worker logs without approved manifests, and broad service-role side effects.

## Supabase Classification

- Update required: docs/status only
- Status: `docs_only`
- Environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Milestone sync: `blocked_current_branch_missing_sync_layer`
- Next Supabase action: `none`

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
