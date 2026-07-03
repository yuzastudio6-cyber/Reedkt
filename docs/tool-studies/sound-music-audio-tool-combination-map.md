# TOOL-STUDY-0 SOUND_MUSIC_AUDIO Tool Combination Map

Decision: `sound_music_audio_tool_study_passed_docs_only`

This map describes safe metadata-only combinations and blocked future runtime combinations. It does not approve execution.

## Safe Metadata-Only Combinations

| Combination | Planning Use | Required Inputs | Outputs | Safety Boundary |
| --- | --- | --- | --- | --- |
| DeepFilterNet + audio QA metadata | Plan speech cleanup strength and naturalness QA. | approved audio refs, noise/speech metadata, QA policy refs | cleanup plan, QA gates, skip reasons | DeepFilterNet execution remains blocked here. |
| FFmpeg/FFprobe + loudness policy | Plan loudness target and normalization command metadata. | private audio refs, platform target, source immutability policy | loudness plan, normalization plan | No FFmpeg command runs. |
| AudioFlux + SoundSync cue metadata | Plan future beat/onset/energy-map needs. | timing refs, caption refs, visual cue refs | SoundSync cue plan, benchmark requirement | No real beat detection is claimed. |
| Signalsmith Stretch + timing metadata | Plan moderate music-bed fit to scene duration. | music cue, target duration, stretch ratio, QA policy | stretch/pitch plan, listen-QA requirement | No time-stretch or pitch processing runs. |
| Demucs + provenance review | Plan future source-separation review only. | separation reason, provenance/legal checklist, private model policy | blocked stem-separation plan | Demucs blocked pending provenance/legal/human approval. |
| Music QA + mix planning | Plan voice-first ducking, fade, volume, and QA. | music cue, speech ranges, overlap metadata | mix plan, ducking plan, QA report metadata | No audio mix is rendered. |
| Lyria + Music QA + mix planning | Plan future generated music after credit/provider gates. | cue sheet, prompt plan, credit refs | mock music plan, QA/mix metadata | No Lyria, Google, provider, storage, or Supabase calls. |
| Mirelo/MMAudio/internal library + SFX timing | Plan SFX route, prompt style, duration, trim, hit, mix, and QA. | SFX event plan, target layer, timing anchor | SFX prompt/route/timing/mix metadata | Provider calls and audio bytes remain blocked. |
| Audio readiness reports + cost metadata | Bound future route/capacity decisions. | committed safe reports, cost class, duration class | cost/capacity notes | No billing mutation or worker capacity probe. |

## Blocked Runtime Combinations

| Combination | Status | Reason | Required Future Approval |
| --- | --- | --- | --- |
| DeepFilterNet on broad/arbitrary media | blocked | Prior controlled evidence does not approve broad runtime. | Controlled worker/runtime approval and source scope review. |
| FFmpeg arbitrary audio args | blocked | Server-built allowlisted command plans only. | FFmpeg runtime approval with strict command builder. |
| AudioFlux real analysis | blocked | Accuracy benchmark and worker approval are missing. | AudioFlux benchmark and worker execution gate. |
| Signalsmith Stretch real processing | blocked | Audio quality benchmark and listen-QA are missing. | Stretch/pitch worker approval and QA review. |
| Demucs runtime | blocked | Demucs blocked pending provenance/legal/human approval. | Exact model provenance, legal approval, checksum, storage, QA, worker deployment. |
| Mirelo/MMAudio real provider call | blocked | Provider transport, docs, Secret Manager, cost, storage, and QA paths are not approved. | Provider Gateway and worker runtime approval. |
| Lyria real music generation | blocked | Lyria adapter is mock-first and real transport is absent. | Provider, credit, storage, QA, and worker approval. |
| Public audio artifact delivery | blocked | Public artifacts are outside owner-study scope. | Public artifact delivery approval. |
| Signed URL source-of-truth use | blocked | Signed URLs are never source of truth. | None for source-of-truth use; delivery requires separate policy. |
| Supabase milestone/source write | blocked | This study is docs/diagnostics only. | Supabase owner approval. |
| Raw prompt to audio worker/tool | blocked | Workers/tools must consume approved snapshots and structured refs. | None; raw prompt execution remains disallowed. |

## Owner Handoffs

- Route Track B media/data preprocessing to `TRACK_B_MEDIA_PROCESSING`.
- Route creative/image-generation visuals to `AI_TOOLS_CREATIVE_GRAPHICS`.
- Route final render/export and mux decisions to `TRACK_A_RENDER_EXPORT`.
- Route worker/job execution to `WORKER_RUNTIME_JOBS`.
- Route provider/model calls to `PROVIDER_GATEWAY`.
- Route source-of-truth rows and storage policy to `SUPABASE_RLS_STORAGE_DATABASE`.

## Required False Flags

`routeExecutionAllowed: false`, `runtimeExecutionAllowed: false`, `workerExecutionAllowed: false`, `providerExecutionAllowed: false`, `toolExecutionAllowed: false`, `audioProcessingAllowed: false`, and `mediaProcessingAllowed: false`.
