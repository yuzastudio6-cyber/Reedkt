# MAP_GEOSPATIAL Blocked-Use Register

| Blocked Use | Status | Reason |
| --- | --- | --- |
| live tiles | blocked | no tile source, terms, privacy, cache, or cost approval |
| public OSM tile hotlinking | blocked | violates launch policy until attribution/rate/usage review approves an alternative |
| live geocoding | blocked | privacy, consent, ambiguity, terms, and retention are not approved |
| live routing | blocked | route service, privacy, cost, and source confidence are not approved |
| paid map providers | blocked | no provider contract, cost cap, key handling, or backend boundary approval |
| Cesium ion | blocked | service/token, terrain/imagery, and terms approval absent |
| live terrain/imagery | blocked | source/licensing/privacy/cost review absent |
| 3D Tiles | blocked | future approval required for asset source, performance, and licensing |
| map rendering | blocked | no worker/runtime/Track A approval in TOOL-STUDY-0 |
| tool execution | blocked | this phase is docs/diagnostics only |
| worker execution | blocked | WORKER-1 was dry-run only and did not approve runtime |
| route execution | blocked | TOOL-ROUTE-0 allowed only future route dry-run planning |
| provider/model calls | blocked | map study does not call providers or models |
| browser capture | blocked | WEB_SEARCH_CAPTURE owns browser capture study separately |
| web search execution | blocked | WEB_SEARCH_CAPTURE owns search study separately |
| Supabase mutation | blocked | docs/status only, no writer on this branch |
| SQL/migrations/schema/RLS changes | blocked | out of scope |
| GCS upload/storage transfer | blocked | no artifact upload path in this phase |
| public artifacts | blocked | map artifacts remain private/review-only in future phases |
| signed URLs as source-of-truth | blocked | manifests and checksums are source-of-truth, not temporary delivery URLs |
| raw prompt execution | blocked | workers and tools must consume approved manifests, not raw prompts |
| internal beta unlock | blocked | capability study only |
| external beta unlock | blocked | runtime, privacy, service, artifact, and QA gates absent |
| production unlock | blocked | production readiness gates absent |

Diagnostics must fail when changed docs claim that any blocked use is enabled, executed, production-ready, beta-ready, public, source-of-truth through signed URLs/raw payloads, or approved for runtime.
