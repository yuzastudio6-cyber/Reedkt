# SOUND_MUSIC_AUDIO Tool Combination Map

This map defines planning-only combinations. It does not install, call, execute, process, render, generate, or upload anything.

| Combination ID | Tools / Lanes | When To Use | Output | Blocked Boundary |
| --- | --- | --- | --- | --- |
| `silence_as_sound_design` | Silence, pause, restraint | Speech, authenticity, documentary facts, or product clarity matters more than polish. | Silence recommendation. | No audio generation. |
| `ambience_context_planning` | `ambient_audio_planning`, `ambience_matching_planning` | Light ambience supports setting/mood without implying unverifiable facts. | Ambience cue manifest. | No generated ambience. |
| `music_cue_layer_planning` | `music_cue_planning`, `soundtrack_layer_planning`, `audio_bed_planning` | Music supports pacing and speech remains protected. | Music/audio bed plan. | No Lyria/provider call. |
| `transition_sfx_planning` | `transition_sound_planning`, `whoosh_hit_riser_planning`, `timing_aware_sound_cue_manifest` | A transition, reveal, title, map move, graphic motion, or edit beat needs a cue. | Transition sound cue manifest. | No SFX provider call. |
| `beat_safe_cue_planning` | `beat_emphasis_cue_planning`, `audioflux_planning`, `sound_cue_placement_planning` | Beat emphasis helps while preserving speech clarity. | Beat emphasis cue plan. | No AudioFlux execution. |
| `voice_first_mix_planning` | Ducking metadata, loudness metadata, SFX level policy | Music/SFX sits under voice or voice clarity is at risk. | Ducking and level QA plan. | No FFmpeg/FFprobe or mixing. |
| `track_b_cleanup_handoff` | `track_b_audio_processing_handoff`, DeepFilterNet planning, FFmpeg/FFprobe planning | Cleanup, environment analysis, metadata extraction, or loudness analysis is needed before composition. | Track B handoff record. | No Track B media processing. |
| `signalsmith_stretch_handoff` | `signalsmith_stretch_handoff`, Track A timing | A future music bed may need bounded stretch or pitch adjustment. | Stretch recommendation metadata. | No Signalsmith runtime. |
| `demucs_stem_separation_blocked_path` | Demucs blocked, Track B audio, Compliance | Stem separation is requested or considered. | Blocked-path record. | Demucs/stem separation remains blocked. |
| `provider_audio_generation_review` | `mirelo_sfx_v1_5_future_provider_blocked`, `mmaudio_v2_future_provider_blocked`, `lyria_pro_future_music_generation_blocked` | Future provider generation is needed for music or SFX. | Provider Gateway handoff record. | No provider/model call. |
| `internal_sound_library_future_planning` | Internal sound library planning, provenance/QA | Reusable approved library sounds could reduce cost and risk. | Library-route plan. | No asset fetch or public artifact. |
| `billing_future_audio_credit_handoff` | Audio cost estimate, provider/worker class | Future audio work could affect credits. | Billing handoff record. | No credit mutation or Stripe action. |

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
