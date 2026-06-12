# WEB_SEARCH_CAPTURE Handoff Contract

All handoffs are review/planning only until a future explicit execution phase approves otherwise.

| Workstream | Receives | Does Not Receive | Required Review |
| --- | --- | --- | --- |
| `PROVIDER_GATEWAY_MODELS` | sanitized manifests, source confidence, route intent | raw prompts, raw provider/search responses, provider keys | model prompt builders use sanitized evidence only |
| `WORKER_RUNTIME_JOBS` | future dry-run job shape, idempotency fields, manifest refs | executable browser/search commands | worker claim/lease and runtime approval before execution |
| `TRACK_A_RENDER_EXPORT` | private capture refs, crop/redaction metadata, visual-safe summary | public artifacts, signed URLs, final render approval | render intake after approved snapshot and artifact QA |
| `TRACK_B_MEDIA_PROCESSING` | none by default; may receive metadata-only handoff | media files, browser capture execution, screenshot processing jobs | separate Track B approval for any processing |
| `AI_TOOLS_CREATIVE_GRAPHICS` | source-safe text/visual constraints for cards | raw screenshots, provider payloads | exact labels/data must come from manifests |
| `MAP_GEOSPATIAL` | location source confidence if web evidence references geography | map rendering execution | geography/fact confidence review |
| `SUPABASE_RLS_STORAGE_DATABASE` | docs/status classification only in this phase | schema, RLS, migration, storage writes | future storage/retention policy before any DB/storage write |
| `OBSERVABILITY_AUDIT_COST` | route decision logs, fallback reasons, cost-risk notes | secret payloads, raw responses | cost cap, abuse controls, retention |
| `COMPLIANCE_SECURITY` | blocked-use register, source consent, redaction policy | bypass instructions, credentials, raw private data | source terms, privacy, quote/copyright, security review |
| `FRONTEND_PRODUCT_UX` | evidence card state, review labels, blocked reason copy | execution controls, public delivery controls | UI must show planning/review-only status |

## Required Manifest Fields For Future Phases

- owner workstream
- approved plan or candidate plan reference
- source/capture/extraction id
- input authorization status
- sanitized source title/summary
- confidence score
- redaction status
- private artifact ref, if any
- checksum, if any
- retention class
- blocked-use checks
- QA status

## Supabase

Supabase milestone sync is `blocked_current_branch_missing_sync_layer`. This branch does not add a writer, schema, RLS policy, migration, storage bucket, product row, or milestone row.
