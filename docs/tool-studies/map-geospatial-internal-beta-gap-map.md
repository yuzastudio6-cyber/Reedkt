# MAP_GEOSPATIAL Internal Beta Gap Map

Internal beta readiness: `blocked_pending_future_runtime_and_data_policy`

## Gaps

| Gap | Owner | Status | Required Before Internal Beta |
| --- | --- | --- | --- |
| Map rendering runtime | `WORKER_RUNTIME_JOBS` / `TRACK_A_RENDER_EXPORT` | blocked | approved worker, renderer boundary, deterministic private artifacts |
| Tile source policy | `MAP_GEOSPATIAL` / `COMPLIANCE_SECURITY` | blocked | no public OSM hotlinking, private/offline tile strategy, attribution review |
| Geocoding policy | `MAP_GEOSPATIAL` / `COMPLIANCE_SECURITY` | blocked | consent/source policy, ambiguity handling, retention rules |
| Routing policy | `MAP_GEOSPATIAL` / `COMPLIANCE_SECURITY` | blocked | route service review, privacy limits, source confidence |
| Manifest schemas | `MAP_GEOSPATIAL` | blocked | GeoJSON/style/camera/timing/render schema definitions and QA |
| Artifact policy | `TRACK_A_RENDER_EXPORT` / `COMPLIANCE_SECURITY` | blocked | private refs, checksum policy, no signed URL source-of-truth |
| Observability and cost | `OBSERVABILITY_AUDIT_COST` | blocked | latency/cost caps, failure codes, audit logs |
| Supabase milestone sync | `SUPABASE_RLS_STORAGE_DATABASE` | blocked_current_branch_missing_sync_layer | approved sync layer on branch if future status writes are required |
| Frontend status language | `FRONTEND_PRODUCT_UX` | blocked | UI states must say planning/review-only, not executed |

## External Beta Blockers

- live map service approvals;
- privacy/security/legal review;
- public artifact and delivery policy;
- source attribution and retention policy;
- runtime monitoring, incident response, and cost controls;
- worker/route execution approval;
- Supabase storage/database review if map metadata is persisted.

## Production Blockers

- production map provider or private tile source contract;
- deterministic worker/runtime implementation;
- scale, SLO, alerting, cache and cost controls;
- compliance and attribution review;
- approved artifact delivery and no signed URL source-of-truth;
- final Track A render/export pipeline approval.
