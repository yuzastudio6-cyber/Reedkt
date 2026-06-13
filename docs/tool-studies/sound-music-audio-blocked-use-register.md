# TOOL-STUDY-0 SOUND_MUSIC_AUDIO Blocked-Use Register

Every blocked use remains blocked after this study.

| Blocked Use | Status | Reason | Required Future Approval |
| --- | --- | --- | --- |
| Real audio processing | blocked | This packet is docs/diagnostics only. | Sound/Music/Audio controlled runtime approval. |
| Real media processing | blocked | General media execution belongs to Track B/worker gates. | Track B or Track A runtime approval as applicable. |
| DeepFilterNet runtime on broad media | blocked | Prior evidence is controlled and does not approve broad runtime. | Controlled worker/model approval and scope review. |
| FFmpeg/FFprobe execution | blocked | This study records command policy only. | Allowlisted runtime execution approval. |
| AudioFlux runtime | blocked | Accuracy benchmark is required first. | AudioFlux benchmark and worker approval. |
| Signalsmith Stretch runtime | blocked | Audio quality benchmark is required first. | Stretch/pitch approval and QA review. |
| Demucs runtime | blocked | Demucs blocked pending provenance/legal/human approval. | Exact model provenance, legal/human approval, checksum, private storage, QA, worker deployment. |
| RNNoise routing | blocked | RNNoise not active after Phase 36G. | New explicit approval if ever reconsidered. |
| Lyria real generation | blocked | Adapter and worker are mock-first. | Provider, storage, credit, QA, worker, and Secret Manager approval. |
| Mirelo/MMAudio real provider calls | blocked | Provider transport and secret resolution are not approved. | Provider Gateway and worker runtime approval. |
| Internal SFX library cross-user reuse | blocked | Reuse needs QA, provenance, privacy, and terms review. | Library provenance/reuse approval. |
| Worker execution | blocked | Worker no-op evidence does not approve real jobs. | `WORKER_RUNTIME_JOBS` execution approval. |
| Route execution | blocked | Owner study completion is not route execution. | TOOL-ROUTE approval after required owner studies. |
| Tool execution | blocked | No audio tool runs in this phase. | Tool-specific execution approval. |
| Provider/model calls | blocked | Provider Gateway owns provider execution. | Explicit provider/model execution phase. |
| Broad/arbitrary media | blocked | Owner studies require bounded private refs. | Human/source-scope review. |
| Public artifacts | blocked | Private metadata only. | Public artifact delivery approval. |
| Signed URLs as source of truth | blocked | Signed URLs are never source of truth. | None for source-of-truth use. |
| Raw prompt execution | blocked | Workers/tools must use approved snapshots and manifests only. | None; raw prompt execution remains disallowed. |
| Supabase mutation | blocked | This study writes no rows and runs no SQL. | Supabase owner approval. |
| SQL execution | blocked | No database operation is authorized. | Supabase/database approval. |
| GCS upload or storage transfer | blocked | No artifact upload or storage mutation occurs. | Storage/artifact approval. |
| Dependency mutation | blocked | No package install or package-lock change occurs. | Dependency/security/license approval. |
| Browser capture | blocked | Not a Sound/Music/Audio capability. | Web Search/Capture owner approval. |
| Map rendering | blocked | Not a Sound/Music/Audio capability. | Map/Geospatial owner approval. |
| Internal beta unlock | blocked | Owner study completion is not a beta launch gate. | Product start-gate approval. |
| External beta unlock | blocked | This is not an external beta packet. | External beta gate. |
| Paid production unlock | blocked | Billing/production is outside scope. | Billing/production approval. |
| Production unlock | blocked | This is not a production readiness gate. | Production readiness gate. |

## Required False Flags

`routeExecutionAllowed: false`, `runtimeExecutionAllowed: false`, `workerExecutionAllowed: false`, `providerExecutionAllowed: false`, `toolExecutionAllowed: false`, `audioProcessingAllowed: false`, and `mediaProcessingAllowed: false`.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, audio processing, media processing, browser capture, map rendering, Docker or Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
