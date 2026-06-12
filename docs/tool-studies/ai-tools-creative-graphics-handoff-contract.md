# AI_TOOLS_CREATIVE_GRAPHICS Handoff Contract

All handoffs are review/planning only in TOOL-STUDY-0.

| Workstream | Receives | Does Not Receive | Future Gate |
| --- | --- | --- | --- |
| `TRACK_A_RENDER_EXPORT` | approved graphics manifests, timing specs, safe-zone notes, source refs, checksum policy, and QA requirements | runnable render job, final export approval, public artifacts, signed URLs | Track A intake, renderer worker, private artifact, and export approval |
| `TRACK_B_MEDIA_PROCESSING` | media-context notes when graphics depend on footage, screenshots, thumbnails, or processed assets | media processing commands, source media, render jobs | Track B media/tool owner approval |
| `WORKER_RUNTIME_JOBS` | future job shapes, manifest requirements, validation gates, and blocked route reasons | worker claim, lease mutation, executable command, route execution | transactional worker/runtime approval |
| `PROVIDER_GATEWAY_MODELS` | sanitized graphics summaries, schema requirements, coding/spec proposal requests | provider calls, raw prompts, generated code execution, secret handling | provider planning review only |
| `SUPABASE_RLS_STORAGE_DATABASE` | docs/status classification and future metadata requirements | schema/RLS/migration changes, private rows, service-role writes | separate Supabase milestone sync layer |
| `MAP_GEOSPATIAL` | illustrative/non-authoritative map graphic styling requests | factual map truth, exact coordinates, source-of-truth geography | MAP_GEOSPATIAL owner contract |
| `WEB_SEARCH_CAPTURE` | source/capture evidence dependencies for graphics and cards | web search execution, browser capture execution, raw web payloads | WEB_SEARCH_CAPTURE owner contract |
| `SOUND_MUSIC_AUDIO` | timing cue notes for reveal, emphasis, and motion restraint | audio processing, beat analysis, music/SFX generation | Sound owner approval |
| `OBSERVABILITY_AUDIT_COST` | future cost/latency risks, blocked-use register, QA and failure codes | telemetry writes, GCP calls, billing mutation | observability and cost review |
| `COMPLIANCE_SECURITY` | data/source truth policy, SVG/DOT/HTML sanitization needs, license/provenance gaps | legal approval claims, public delivery approval | terms, privacy, security, and license review |
| `FRONTEND_PRODUCT_UX` | planning UI language for graphics selection, blocked status, and review-only states | runtime controls or execute buttons | product UX review |

## Handoff Requirements

- Every graphics handoff must reference an approved plan snapshot or explicitly say it is candidate/review-only.
- Every future artifact handoff must include source refs, checksums, private artifact policy, and QA status.
- Every chart or diagram handoff must preserve source confidence, safe wording, mock-data status, and label readability requirements.
- Every transparent overlay handoff must include alpha policy and caption/safe-zone collision checks.
- Screenshots and previews must be labeled review-only.
- Signed URLs and public artifacts must never become source-of-truth.
- Future route/tool execution must require a new approved phase and must not be inferred from this study.
