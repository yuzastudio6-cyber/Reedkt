# TOOL-STUDY-0 SOUND_MUSIC_AUDIO Study

Owner: `SOUND_MUSIC_AUDIO`

Decision: `sound_music_audio_tool_study_passed_docs_only`

Status after diagnostics: `complete_for_SOUND_MUSIC_AUDIO_owner_study`

Base evidence: PR #367 `TRACK_B_MEDIA_PROCESSING` study at `2f180e001bc13908b0f32d26555f1bdded14535d`, PR #350 post-merge source-of-truth verification, and existing audio/SFX planning docs.

This packet is a capability-routing study only. It does not execute tools, workers, routes, providers, audio processing, media processing, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, dependency installs, raw prompts, beta unlocks, or production unlocks.

## Source-Of-Truth Basis

| Source | Status | Study Fact |
| --- | --- | --- |
| `docs/tool-studies/track-b-media-processing-tool-study.md` | present | Track B owns general media/data tools and hands DeepFilterNet, Signalsmith Stretch, and Demucs to `SOUND_MUSIC_AUDIO`. |
| `docs/production-audio-sound-foundation.md` | present | Audio cleanup, loudness, music ducking, SFX density, and SoundSync cue planning are structured metadata foundations. |
| `docs/production-deepfilternet-rnnoise-policy.md` | present | DeepFilterNet is the active internal speech cleanup path; RNNoise is not active product fallback routing after Phase 36G. |
| `docs/production-demucs-policy.md` | present | Demucs is for justified music/speech separation or stems and remains blocked pending model-weight, artifact, QA, and deployment approval. |
| `docs/activation-audio-stack-demucs-policy.md` | present | Demucs htdemucs download/runtime is blocked by unresolved pretrained-model license/provenance evidence. |
| `docs/production-ffmpeg-audio-execution-policy.md` | present | FFmpeg audio commands must be server-built, allowlisted, and source-safe; this study does not run FFmpeg. |
| `docs/soundsync-audio-pipeline-planning.md` | present | AudioFlux and Signalsmith Stretch are launch candidates for future analysis/stretch planning, not executed here. |
| `docs/lyria-integration-adapter.md` | present | Lyria remains mock-first and does not call Google APIs or create real audio. |
| `sfx-provider-strategy.md` and `docs/edit-project-sfx-integration.md` | present | Mirelo/MMAudio/internal library routing is mock/planning only; real provider calls remain disabled. |

Missing local report directories are recorded in `sound-music-audio-source-of-truth-audit.json` as audit facts, not blockers, because PR #350 verifies the merged remote milestone evidence.

## Owned Tools And Lanes

| Tool / Lane | Purpose | Strengths | Weaknesses / Bad Fits | Inputs | Outputs | Evidence-Backed Readiness | Blocked Runtime Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `deepfilternet` | Speech cleanup and voice denoise planning. | Active internal speech cleanup path with controlled Phase 36 evidence. | Not source separation, not music stem extraction, not automatic for every clip, not clipping repair. | Approved audio refs, noise/speech metadata, cleanup strength policy, QA refs. | Cleanup plan, skip reason, private artifact plan, audio QA metadata. | Metadata/readiness review only; prior controlled evidence exists. | `blocked_real_audio_processing_false` |
| `ffmpeg_ffprobe_audio` | Loudness, normalization, stream metadata, and source-safe command planning. | Deterministic loudness/normalization command plans; source overwrite blocked. | Not semantic audio understanding, not arbitrary args, not final mux/export here. | Approved private audio refs, allowlisted operation, safe output root, platform target. | Loudness plan, normalization plan, FFmpeg command metadata, skip reason. | Command-plan evidence exists; no command runs here. | `blocked_no_audio_tool_execution` |
| `audioflux` | Future SoundSync analysis candidate for onset, rhythm, beat/drop, and energy curves. | Launch analysis candidate replacing Essentia. | Needs accuracy benchmark before production; not a runtime default in this phase. | Approved audio refs, bounded timing windows, benchmark policy. | Timing map plan, onset/beat metadata plan, confidence policy. | Planning candidate only. | `blocked_pending_accuracy_benchmark` |
| `signalsmith_stretch` | Future moderate music time-stretch and pitch adjustment planning. | Launch stretch/pitch candidate replacing Rubber Band. | Bad for extreme stretch ratios without QA; not voice cleanup or stem separation. | Music bed refs, target scene duration, stretch ratio, pitch settings, QA policy. | Stretch plan, pitch plan, quality benchmark requirement. | Planning candidate only. | `blocked_pending_audio_quality_benchmark` |
| `demucs` | Future vocal/music/stem separation candidate. | Useful for justified music/speech separation and stems when approved. | Not denoise, not default cleanup, not allowed without exact model provenance. | Approved private audio refs, separation reason, model provenance, legal approval, QA refs. | Separation plan, blocked provenance report, future stem artifact plan. | Demucs blocked pending provenance/legal/human approval. | `blocked_pending_provenance_legal_human_approval` |
| `soundsync_cue_planning` | Speech-first cue planning for music ducking, SFX hits, emotional pauses, and visual reveals. | Preserves cue reasons and avoids random SFX. | Mock cues are not real beat detection and cannot drive workers by themselves. | Master timing refs, caption refs, smart cut refs, visual cue refs. | SoundSync cue plan, cue reasons, timing metadata. | Metadata planning exists. | `blocked_no_route_or_worker_execution` |
| `music_ducking_mix_qa` | Voice-first music ducking, mix, and audio QA planning. | Protects speech clarity and flags music-over-voice risk. | Not real mix processing; cannot approve preview/export alone. | Audio analysis metadata, music/speech overlap, platform target. | Ducking plan, mix plan, QA gates. | Mock/planning evidence exists. | `blocked_no_audio_processing` |
| `lyria_music_planning` | Future generated music planning and mock worker contracts. | Credit-gated mock flow, prompt/cue policy, Music QA, mix planning. | No Google/Lyria API call, no real audio, no real credits. | Music cue, Lyria prompt plan, credit reservation ref, generation request ref. | Mock generated-track metadata, QA/mix metadata. | Mock-only docs and adapter evidence. | `blocked_provider_execution_false` |
| `mirelo_sfx_v1_5` | Future production SFX provider route. | Good fit for important transition, Stroke Motion, Graphic Design, Real Motion, title, and premium polish cues. | Exact API behavior unconfirmed; not active transport. | SFX event plan, prompt plan, credit refs, provider route. | Provider prompt plan, future SFX metadata, QA plan. | Mock/provider strategy evidence only. | `blocked_provider_execution_false` |
| `mmaudio_v2` | Future draft/basic/pro fallback and video-conditioned SFX helper. | Good for cheap draft timing ideas and video-synced movement concepts. | Not default final production provider for key signature polish. | SFX event plan, short prompt plan, video context refs. | Mock prompt/route metadata. | Mock/project-flow evidence only. | `blocked_provider_execution_false` |
| `internal_sfx_library` | Future first-choice approved reusable sound source. | Can avoid generation when approved reusable sounds exist. | Empty library at launch is acceptable; reuse needs QA/provenance/privacy review. | Approved library refs, tags, provenance, reuse policy. | Library match metadata, project-only/candidate status. | Mock-only growth evidence. | `blocked_no_public_artifact_or_reuse_unlock` |
| `audio_cost_capacity_metadata` | Cost, capacity, and owner-routing metadata. | Keeps audio generation/processing decisions bounded before any future approval. | Not billing, not credit mutation, not runtime capacity probe. | Cost class, capacity class, duration class, owner scope. | Cost/capacity route metadata. | Metadata only. | `blocked_no_billing_or_runtime` |

## Related But Not Owned Here

| Related Lane | Owner | Sound/Music/Audio Relationship | Status |
| --- | --- | --- | --- |
| OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, Polars, PaddleOCR, PaddlePaddle | `TRACK_B_MEDIA_PROCESSING` | Sound consumes safe media/data metadata only. | `complete_elsewhere` |
| Creative/image generation tools | `AI_TOOLS_CREATIVE_GRAPHICS` | Sound may provide target-layer SFX needs for graphics, but image generation is not owned here. | `pending_owner_study` |
| Final render/export pipeline | `TRACK_A_RENDER_EXPORT` | Sound may hand approved audio artifact/mix metadata to render/export later. | `pending_owner_study` |
| Worker execution | `WORKER_RUNTIME_JOBS` | Sound supplies future approved-plan snapshot fields only. | `blocked_separate_owner_gate` |
| Provider/model calls | `PROVIDER_GATEWAY` | Sound names future provider lanes but does not execute them. | `blocked_separate_provider_gate` |
| Supabase/source-of-truth writes | `SUPABASE_RLS_STORAGE_DATABASE` | Sound may reference future row refs only after separate Supabase approval. | `blocked_no_write` |

## Study Rules

- `routeExecutionAllowed: false`
- `runtimeExecutionAllowed: false`
- `workerExecutionAllowed: false`
- `providerExecutionAllowed: false`
- `toolExecutionAllowed: false`
- `audioProcessingAllowed: false`
- `mediaProcessingAllowed: false`
- `Demucs blocked pending provenance/legal/human approval`
- `RNNoise not active`
- Signed URLs are never source of truth.
- Audio metadata readiness is not audio runtime execution readiness.

## Supabase Classification

- Supabase update required: `no write`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, audio processing, media processing, browser capture, map rendering, Docker or Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
