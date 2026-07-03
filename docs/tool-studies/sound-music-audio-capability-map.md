# TOOL-STUDY-0 SOUND_MUSIC_AUDIO Capability Map

Decision: `sound_music_audio_tool_study_passed_docs_only`

This map routes future audio planning requests to the right Sound/Music/Audio capability while preserving docs-only boundaries.

| Capability | Capable Tools / Lanes | Best Fit | Fallback / Complement | Blocked Scopes | Required Gates Before Execution | Handoff Owners |
| --- | --- | --- | --- | --- | --- | --- |
| Speech denoise / noise suppression | `deepfilternet`, `ffmpeg_ffprobe_audio` metadata, historical RNNoise scaffold | DeepFilterNet for controlled speech cleanup after approved worker/model gates | FFmpeg loudness-only normalization when DeepFilterNet is blocked; RNNoise not active | audioProcessingAllowed: false, workerExecutionAllowed: false | approved plan snapshot, private audio refs, model artifact approval, worker runtime approval, QA | `WORKER_RUNTIME_JOBS`, `SUPABASE_RLS_STORAGE_DATABASE` |
| Loudness analysis and normalization planning | `ffmpeg_ffprobe_audio` | FFmpeg/FFprobe allowlisted command metadata for loudness and normalization plans | QA-only metadata when FFmpeg unavailable | toolExecutionAllowed: false, mediaProcessingAllowed: false | server-built command plan, safe output root, local/worker execution approval | `TRACK_A_RENDER_EXPORT` for final mux/export |
| Music/speech overlap and ducking | `music_ducking_mix_qa`, `soundsync_cue_planning` | Voice-first ducking and music-over-voice QA metadata | Ask for user review if overlap is unclear | runtimeExecutionAllowed: false | approved timing plan, audio QA, worker/tool approval | `MODEL_ORCHESTRATION`, `WORKER_RUNTIME_JOBS` |
| SoundSync cue planning | `soundsync_cue_planning`, future `audioflux` | Speech-first cue reasons for cuts, captions, transitions, SFX hits, music ducking, emotional pauses | Manual metadata cue when real analysis is absent | routeExecutionAllowed: false | approved plan snapshot, timing refs, AudioFlux benchmark before real analysis | `MODEL_ORCHESTRATION`, `TRACK_A_RENDER_EXPORT` |
| Beat/rhythm/onset analysis planning | `audioflux` | Future launch audio analysis candidate for onset/rhythm/beat/drop/energy maps | Metadata-only SoundSync cues until benchmark passes | audioProcessingAllowed: false | accuracy benchmark, worker runtime approval, private artifact policy | `OBSERVABILITY_AUDIT_COST`, `WORKER_RUNTIME_JOBS` |
| Time stretch / tempo / pitch fitting | `signalsmith_stretch` | Moderate music bed fitting to scene length and pitch adjustment planning | Regenerate/reselect music when stretch ratio is extreme | toolExecutionAllowed: false | audio quality benchmark, QA listen policy, worker approval | `TRACK_A_RENDER_EXPORT` |
| Source separation / stem extraction | `demucs` | Future justified vocal/music/stem separation only | Avoid separation; use ducking, music edit, or user review | Demucs blocked pending provenance/legal/human approval | exact model source, checksum, license/provenance, human/legal approval, private storage, QA, worker deployment | `SUPABASE_RLS_STORAGE_DATABASE`, legal/human owner |
| Generated music planning | `lyria_music_planning` | Mock cue/prompt/QA/mix planning for future Lyria music generation | Internal library or no music | providerExecutionAllowed: false | credit approval/reservation, provider approval, Secret Manager refs, storage, QA | `PROVIDER_GATEWAY`, `OBSERVABILITY_AUDIT_COST` |
| SFX provider planning | `mirelo_sfx_v1_5`, `mmaudio_v2`, `internal_sfx_library` | Mirelo for final polish, MMAudio for draft/helper, internal library first when approved | No SFX when sound would distract | providerExecutionAllowed: false, publicArtifactsAllowed: false | approved cue, prompt plan, credit gate, provider docs, QA, provenance | `PROVIDER_GATEWAY`, `PUBLIC_ARTIFACT_DELIVERY` |
| Audio fixture/report validation | audio readiness docs, phase 36 reports, QA policies | Metadata/readiness review and blocker preservation | Record missing remote reports as audit facts if PR #350 verifies them | runtimeExecutionAllowed: false | committed report evidence and no secret/private payloads | `PRODUCT_INTERNAL_BETA_AGGREGATION` |
| Audio cost/capacity planning | `audio_cost_capacity_metadata` | Bound future processing/generation cost and capacity assumptions | Manual owner review when unknown | dependencyMutationAllowed: false | cost guardrails, observability/cost approval, no billing mutation | `OBSERVABILITY_AUDIT_COST` |

## Required False Flags

Every routed Sound/Music/Audio object from this study must preserve:

```json
{
  "routeExecutionAllowed": false,
  "runtimeExecutionAllowed": false,
  "workerExecutionAllowed": false,
  "providerExecutionAllowed": false,
  "toolExecutionAllowed": false,
  "audioProcessingAllowed": false,
  "mediaProcessingAllowed": false,
  "supabaseWritesAllowed": false,
  "publicArtifactsAllowed": false,
  "signedUrlsAsSourceOfTruthAllowed": false,
  "dependencyMutationAllowed": false,
  "rawPromptExecutionAllowed": false
}
```

## Launch Candidate Notes

- AudioFlux is the audio-analysis launch candidate, replacing Essentia for default launch planning.
- Signalsmith Stretch is the stretch/pitch launch candidate, replacing Rubber Band for default launch planning.
- Demucs is a product candidate for source separation only, not speech cleanup, and remains blocked.
- RNNoise not active; it must not be auto-selected for internal beta jobs.

## Supabase Classification

- Supabase update required: `no write`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
