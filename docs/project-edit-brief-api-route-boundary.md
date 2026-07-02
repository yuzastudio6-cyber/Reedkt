# Project Edit Brief API Route Boundary

The Project Edit Brief route layer is a mock/local boundary over the RP-EDITBRIEF-03 repository seam.

Allowed now:

- Route metadata in the shared registry.
- Mock handlers that call `MockProjectEditBriefRepository`.
- Safe request/response contracts.
- Browser-safe client helpers and compact UI summaries.
- Smoke coverage for route and client behavior.

Blocked now:

- Production HTTP routes.
- Supabase reads/writes, migrations, direct CLI commands, or remote inspection.
- Storage writes, signed URLs, file-byte reads, external URL fetches, and media processing.
- Provider/model calls, worker jobs, render/progress/preview execution, generation, and credits.
- Edit Brief UI route wiring or `ChatNativeEditor` behavior changes.

Normal mock failures return safe envelopes rather than throwing through the route boundary.

## RP-EDITBRIEF-04A QA Closure

The route boundary was reverified by `smoke:project-edit-brief-route-client-qa-closure` plus the existing route/client smokes. The closure confirms 35 route IDs, 35 client route IDs, repository-backed mock route behavior, safe docs, no `/brief` App route, no ProjectEditBrief page, migration count 26, and no Supabase command.

No production HTTP endpoint, runtime UI behavior, storage, file-byte read, external URL fetch, media processing, provider/model call, worker job, render job, generation request, credit reservation, staging, commit, or cleanup was added.
