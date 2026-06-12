# MAP_GEOSPATIAL Handoff Contract

All handoffs are review/planning only in TOOL-STUDY-0.

| Workstream | Receives | Does Not Receive | Future Gate |
| --- | --- | --- | --- |
| `TRACK_A_RENDER_EXPORT` | approved GeoJSON/style/camera/timing/render manifests and private artifact policy | live tiles, raw prompts, signed URLs, public artifacts, final render approval | Track A intake and render worker approval |
| `TRACK_B_MEDIA_PROCESSING` | map timing/context notes if map interacts with media segments | media files, map render jobs, raw private coordinates | future media/map synchronization review |
| `AI_TOOLS_CREATIVE_GRAPHICS` | non-authoritative illustrative map styling request | factual map truth, exact coordinates, source-of-truth claims | owner review that graphic is illustrative |
| `WORKER_RUNTIME_JOBS` | future job shape and manifest requirements | runnable tool command, worker claim, route execution | transactional worker/runtime approval |
| `PROVIDER_GATEWAY_MODELS` | sanitized map summaries and manifest references | raw prompt execution, provider chaining, map tool execution | provider planning review only |
| `SUPABASE_RLS_STORAGE_DATABASE` | docs/status classification and future metadata requirements | schema/RLS/migration changes, private rows, service-role writes | separate Supabase milestone sync layer |
| `WEB_SEARCH_CAPTURE` | source evidence dependency notes for location claims | browser capture execution, web search execution, raw search payloads | WEB_SEARCH_CAPTURE owner contract |
| `OBSERVABILITY_AUDIT_COST` | future cost/latency risks, blocked service register, QA needs | telemetry writes, GCP calls, billing mutation | observability design review |
| `COMPLIANCE_SECURITY` | open map data policy, attribution, privacy and blocked-use list | legal approval claims, public delivery approval | terms/privacy/security review |
| `FRONTEND_PRODUCT_UX` | planning UI language for map choice, confidence, and blocked status | runtime controls or map execution UI | product UX review |

## Handoff Requirements

- Every map handoff must reference source-safe location confidence and safe wording.
- Every future render handoff must include GeoJSON/style/camera/timing/render manifest IDs.
- Screenshots and previews must be labeled review-only.
- Signed URLs and public artifacts must never become source-of-truth.
- Future route/tool execution must require a new approved phase and must not be inferred from this study.
