# TOOL-STUDY-0 SOUND_MUSIC_AUDIO Internal Beta Gap Map

Decision: `sound_music_audio_tool_study_passed_docs_only`

This gap map separates metadata/readiness review from any live internal testing or runtime path.

## Ready For Metadata/Readiness Review

| Area | Review Status | Evidence Basis |
| --- | --- | --- |
| Sound/Music/Audio owner routing | ready for metadata review | This study and Track B handoff. |
| DeepFilterNet speech cleanup planning | ready for metadata review | Phase 36 policy/result docs and audio foundation runner skip/plan shape. |
| FFmpeg/FFprobe loudness planning | ready for metadata review | Production FFmpeg audio execution policy and command-plan helpers. |
| AudioFlux SoundSync candidate | ready for metadata review | Launch tool stack and SoundSync audio planning docs. |
| Signalsmith Stretch candidate | ready for metadata review | Launch tool stack and audio settings docs. |
| Music ducking/mix/QA planning | ready for metadata review | Production loudness/ducking and music QA docs. |
| SFX route/prompt/trim/mix/QA planning | ready for metadata review | SFX Director, provider strategy, timing/trim/mix, library-growth, and project-flow docs. |
| Lyria music planning | ready for metadata review | Lyria worker and adapter docs; mock-only. |
| Mirelo/MMAudio/internal library planning | ready for metadata review | SFX provider strategy and mock project-flow docs. |

## Gaps Before Live Internal Testing

| Gap | Status | Required Before Unlock |
| --- | --- | --- |
| Tool-route execution approval | blocked | All owner studies plus separate route dry-run approval and execution packet. |
| Worker runtime execution | blocked | Approved plan snapshot worker intake, real worker approval, job gates, idempotency, and private artifact policy. |
| Real audio processing | blocked | Tool-specific runtime approval, private inputs, output policy, QA, and rollback. |
| DeepFilterNet broad runtime | blocked | Controlled scope approval beyond prior evidence. |
| FFmpeg audio execution | blocked | Allowlisted command builder, safe output root, explicit execution gate. |
| AudioFlux runtime | blocked | Accuracy benchmark for BPM, beat/drop, onset, rhythm, and SoundSync timing. |
| Signalsmith Stretch runtime | blocked | Audio quality benchmark and listen-QA for stretch ratios. |
| Demucs runtime | blocked | Demucs blocked pending provenance/legal/human approval. |
| Lyria real provider call | blocked | Provider Gateway, Secret Manager, storage, credit, QA, and worker approval. |
| Mirelo/MMAudio real provider call | blocked | Provider docs, Secret Manager refs, transport, storage, cost, QA, and provenance review. |
| Public artifacts or signed URL delivery | blocked | Separate public artifact delivery policy; Signed URLs are never source of truth. |
| Supabase writes/source-of-truth rows | blocked | Supabase owner approval and no public secret leakage. |

## Owner Dependencies

- `TRACK_B_MEDIA_PROCESSING`: complete for general media/data metadata; Sound consumes its private refs and manifests.
- `AI_TOOLS_CREATIVE_GRAPHICS`: pending for creative/image-generation tool study.
- `TRACK_A_RENDER_EXPORT`: pending for final render/export and mux handoff.
- `WORKER_RUNTIME_JOBS`: owns worker execution and job lifecycle gates.
- `PROVIDER_GATEWAY`: owns provider/model execution.
- `SUPABASE_RLS_STORAGE_DATABASE`: owns source-of-truth rows, storage, RLS, and SQL.
- `OBSERVABILITY_AUDIT_COST`: owns cost/abuse/audit guardrails.

## Internal Beta Statement

Completing this owner study does not unlock internal beta. It only completes `SOUND_MUSIC_AUDIO` metadata/readiness coverage for future route planning.

`routeExecutionAllowed: false`, `runtimeExecutionAllowed: false`, `workerExecutionAllowed: false`, `providerExecutionAllowed: false`, `toolExecutionAllowed: false`, `audioProcessingAllowed: false`, and `mediaProcessingAllowed: false`.

Supabase update required: `no write`; SQL executed: `none`; Migration deployed: `no`.
