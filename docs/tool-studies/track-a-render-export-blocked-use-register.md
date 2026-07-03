# TRACK_A_RENDER_EXPORT Blocked Use Register

Decision: `track_a_render_export_tool_study_passed_docs_only`

| Blocked Use | Reason | Future Owner / Gate |
| --- | --- | --- |
| Real render execution | This packet is docs/diagnostics only. | `WORKER_RUNTIME_JOBS`, `TRACK_A_RENDER_EXPORT` |
| Real export, mux, transcode, codec, or container execution | No worker/tool execution, no FFmpeg, no output file. | `TRACK_A_RENDER_EXPORT`, worker approval |
| Public artifact creation | Public delivery is not part of TOOL-STUDY-0. | `PUBLIC_ARTIFACT_DELIVERY` |
| Signed URL source-of-truth use | Signed URLs are never source of truth. | Source-of-truth and public delivery policies |
| GCS upload or object mutation | No storage API call or artifact materialization occurs. | Storage/worker approval |
| Supabase write, SQL, migration, reset, or production promotion | Supabase update required: `no write`; SQL executed: `none`; Migration deployed: `no`. | `SUPABASE_RLS_STORAGE_DATABASE` |
| Worker/job/route execution | No runtime starts and no queue is touched. | `WORKER_RUNTIME_JOBS` and route approval |
| Provider/model calls | Render/export planning consumes approved asset refs only. | `PROVIDER_GATEWAY` |
| Media processing | Track A does not process source media in this study. | `TRACK_B_MEDIA_PROCESSING` or later worker packet |
| Audio processing | Track A consumes audio metadata only. | `SOUND_MUSIC_AUDIO` |
| Image generation or image editing | Track A consumes creative graphics metadata only. | `AI_TOOLS_CREATIVE_GRAPHICS` |
| Raw prompt execution | Future workers must consume approved snapshots, not raw prompts. | Model orchestration and worker policy |
| Dependency mutation | No packages are installed or changed. | Separate dependency review |
| Internal beta, external beta, paid production, or production unlock | Owner studies do not unlock product/runtime scopes. | Separate product/runtime approval |

## Required False Flags

- routeExecutionAllowed: false
- runtimeExecutionAllowed: false
- workerExecutionAllowed: false
- providerExecutionAllowed: false
- modelExecutionAllowed: false
- toolExecutionAllowed: false
- renderExecutionAllowed: false
- exportExecutionAllowed: false
- mediaProcessingAllowed: false
- publicArtifactsAllowed: false
- signedUrlsAsSourceOfTruthAllowed: false
- dependencyMutationAllowed: false
- rawPromptExecutionAllowed: false
