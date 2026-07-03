# TOOL-STUDY-0 TRACK_B_MEDIA_PROCESSING Blocked-Use Register

Every blocked use remains blocked after this study.

| Blocked Use | Status | Reason | Required Future Approval |
| --- | --- | --- | --- |
| Real media processing | blocked | This packet is docs/diagnostics only. | Track B controlled runtime approval. |
| OpenCV execution | blocked | Computer vision runtime is not approved here. | OpenCV runtime and native dependency review. |
| PyAV execution | blocked | Media decode/access runtime is not approved here. | PyAV and FFmpeg-linked runtime review. |
| PySceneDetect execution | blocked | Scene detection runtime is not approved here. | Scene fixture/runtime approval. |
| Sharp/libvips execution | blocked | Derivative generation is not approved here. | Dependency/security/LGPL and runtime approval. |
| PaddleOCR/PaddlePaddle execution | blocked | OCR model/runtime/privacy path is not approved here. | OCR runtime, model, privacy, and QA approval. |
| DuckDB/Polars runtime | blocked | This phase only plans safe metadata summaries. | Metadata analysis dry-run approval. |
| Track B route execution | blocked | Capability manifests are not route execution permission. | TOOL-ROUTE approval after all owner studies. |
| Worker Runtime execution | blocked | Worker no-op evidence does not approve real jobs. | Worker runtime execution approval. |
| Sidecar launch or host probing | blocked | Benchmark/sidecar metadata is planning-only. | Sidecar/profiler privacy and runtime approval. |
| DeepFilterNet runtime | blocked | Owned by SOUND_MUSIC_AUDIO follow-up, not this Track B study. | SOUND_MUSIC_AUDIO owner approval. |
| Signalsmith Stretch runtime | blocked | Owned by SOUND_MUSIC_AUDIO and Track A timing handoff. | SOUND_MUSIC_AUDIO / Track A approval. |
| Demucs runtime | blocked | Owned by SOUND_MUSIC_AUDIO; provenance/legal review remains required. | Human/legal/provenance approval. |
| Creative image generation tools | blocked | Owned by AI_TOOLS_CREATIVE_GRAPHICS. | AI Tools owner approval. |
| Final render/export pipeline | blocked | Owned by TRACK_A_RENDER_EXPORT. | Track A owner approval. |
| Provider/model calls | blocked | Provider Gateway owns provider execution. | Explicit provider/model execution phase. |
| Supabase mutation | blocked | This study writes no rows and runs no SQL. | Supabase owner approval. |
| GCS upload or storage transfer | blocked | No artifact upload or storage mutation occurs. | Storage/artifact approval. |
| Public artifacts | blocked | Private metadata only. | Public delivery/access-control policy. |
| Signed URLs as source of truth | blocked | Signed URLs are not truth records. | Separate delivery-only policy if ever approved. |
| Raw prompt execution | blocked | Workers/tools must use approved snapshots and manifests only. | None; raw prompt execution remains disallowed. |
| Dependency mutation | blocked | No package install or package-lock change occurs. | Dependency/security/license approval. |
| Internal beta unlock | blocked | Owner study completion is not a beta launch gate. | Product start-gate approval. |
| External beta unlock | blocked | This is not an external beta packet. | External beta gate. |
| Paid production unlock | blocked | Billing/production is outside scope. | Billing/production approval. |
| Production unlock | blocked | This is not a production readiness gate. | Production readiness gate. |

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, media processing, browser capture, Docker or Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
