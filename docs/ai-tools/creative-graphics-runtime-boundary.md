# Creative Graphics Runtime Boundary

Status: `blocked at repo_audit stage`

## Allowed In GD-0

- Read repo documents and source files.
- Search for owned tool names and aliases.
- Create audit docs, static diagnostics, trackers, and future prompt sequencing.
- Run local static validation commands such as lint, typecheck, and diagnostics.

## Not Allowed In GD-0

- Tool execution.
- Worker execution.
- Provider/model calls.
- Render/export execution.
- Media processing.
- Browser capture.
- Docker or Cloud Run execution.
- Google Cloud or Secret Manager access.
- Supabase lifecycle commands, mutation, or SQL.
- Signed URL source-of-truth creation.
- Public artifact creation.
- Dependency mutation.
- Human approval grant or staging execution approval.
- Production or beta unlock.

## Cross-Track Runtime Ownership

Track A owns final render/export validation and production rendering. Track B owns media processing. Maps/geospatial owns map rendering. Sound/music/audio owns audio runtime. Provider gateway owns model/provider calls. Worker runtime owns jobs and service-role execution. Supabase/storage/database owns persistence, RLS, storage, signed URLs, and SQL.

GD owns creative graphics planning and future manifest contracts for the 12 tool families, but this branch creates no executable runtime path.

Production capability enabled: `none; AI Tools creative graphics repo audit only`
