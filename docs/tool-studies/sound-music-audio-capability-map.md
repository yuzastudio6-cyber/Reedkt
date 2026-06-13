# SOUND_MUSIC_AUDIO Capability Map

This map records planning-only Sound/Music/Audio capabilities for future route dry-run planning. No capability below is executable in TOOL-STUDY-0.

| Capability ID | Owner | Use | Safe Output | Blocked Runtime Boundary | Handoffs |
| --- | --- | --- | --- | --- | --- |
| `sound_effects_planning` | SOUND_MUSIC_AUDIO | Cue-linked SFX planning for story, reveal, transition, or emphasis. | Sound cue manifest and QA checklist. | No SFX generation or provider call. | Track A, Provider Gateway, Billing. |
| `ambient_audio_planning` | SOUND_MUSIC_AUDIO | Restrained ambience that supports mood/context. | Ambience plan metadata. | No ambience generation or media processing. | Track A, Compliance. |
| `ambience_matching_planning` | SOUND_MUSIC_AUDIO | Match ambience to setting without factual overclaim. | Ambience matching notes. | No exact acoustic simulation. | Map, Web, Compliance. |
| `music_cue_planning` | SOUND_MUSIC_AUDIO | Music cue intent, duration class, and emotional pacing. | Music cue manifest. | No Lyria/music provider call. | Provider Gateway, Billing, Track A. |
| `soundtrack_layer_planning` | SOUND_MUSIC_AUDIO | Plan bed, accents, silence, and cue density. | Soundtrack layer plan. | No audio rendering or mux. | Track A, Worker Runtime. |
| `audio_bed_planning` | SOUND_MUSIC_AUDIO | Low-energy beds under voice with ducking requirements. | Audio bed manifest. | No mix/export execution. | Track A, Track B. |
| `transition_sound_planning` | SOUND_MUSIC_AUDIO | Transition accents tied to edit cuts and visual transitions. | Transition sound cue manifest. | No transition SFX provider call. | Track A, Provider Gateway. |
| `whoosh_hit_riser_planning` | SOUND_MUSIC_AUDIO | Specific whoosh, hit, or riser families when visual meaning justifies them. | Cue family manifest. | No generated audio bytes. | AI Tools, Track A, Provider Gateway. |
| `emotional_tone_audio_planning` | SOUND_MUSIC_AUDIO | Map emotional intent to restraint, silence, music, ambience, or SFX. | Tone plan metadata. | No manipulative scoring or fact distortion. | Compliance, Frontend. |
| `timing_aware_sound_cue_manifest` | SOUND_MUSIC_AUDIO | Frame-aware cue fields for future execution paths. | Timing-aware cue manifest. | No beat analysis or timeline mutation. | Worker Runtime, Track A. |
| `sound_cue_placement_planning` | SOUND_MUSIC_AUDIO | Place cue intent against scene, beat, speech gap, or visual reveal. | Cue placement plan. | No worker placement execution. | Track A, Worker Runtime. |
| `beat_emphasis_cue_planning` | SOUND_MUSIC_AUDIO | Beat emphasis only when speech clarity is protected. | Beat emphasis plan. | No AudioFlux execution. | Timing QA, Track A. |
| `platform_safe_audio_style_planning` | SOUND_MUSIC_AUDIO | Tune density and intensity for platform/workflow context. | Platform-safe style record. | No upload or platform policy mutation. | Frontend, Compliance. |
| `private_audio_artifact_manifest_policy` | SOUND_MUSIC_AUDIO | Define future private refs, checksums, provenance, QA, and retention fields. | Artifact manifest policy. | No public artifact or signed URL truth. | Supabase, Compliance, Observability. |
| `open_source_audio_music_sfx_tool_research` | SOUND_MUSIC_AUDIO | Track AudioFlux, Signalsmith, DeepFilterNet, internal library, and related candidates. | Tool research record. | No package install, download, or execution. | Compliance, Worker Runtime. |
| `track_b_audio_processing_handoff` | SOUND_MUSIC_AUDIO | Route cleanup, metadata extraction, and audio issue classification to Track B. | Handoff record. | No Track B media processing. | TRACK_B_MEDIA_PROCESSING. |
| `track_a_final_composition_handoff` | SOUND_MUSIC_AUDIO | Send cue, bed, loudness, and ducking requirements to Track A. | Composition handoff record. | No final render/export. | TRACK_A_RENDER_EXPORT. |
| `provider_gateway_future_audio_generation_handoff` | SOUND_MUSIC_AUDIO | Route future Mirelo, MMAudio, and Lyria questions to Provider Gateway. | Provider handoff record. | No provider/model call or raw prompt. | Provider Gateway, Billing, Compliance. |
| `billing_future_audio_credit_handoff` | SOUND_MUSIC_AUDIO | Flag future audio generation/processing for estimate and approval gates. | Billing handoff record. | No credit mutation or Stripe action. | Billing, Frontend. |

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
