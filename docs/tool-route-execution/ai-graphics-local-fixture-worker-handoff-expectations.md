# AI Graphics Local Fixture Worker Handoff Expectations

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_plan`

Worker handoff remains future-only. A future worker-facing handoff may consume only metadata refs from an approved plan snapshot and scoped tool-call manifest after a separate Worker Runtime approval lane.

Expected worker handoff placeholders:

- `<WORKER_HANDOFF_REF>`
- `<WORKER_JOB_PAYLOAD_FIXTURE>`
- `<APPROVED_PLAN_SNAPSHOT_FIXTURE>`
- `<SCOPED_TOOL_CALL_MANIFEST_REF>`
- `<PRIVATE_ARTIFACT_MANIFEST_REF>`
- `<CHECKSUM_PLACEHOLDER>`

Worker execution, job claims, queue execution, lease mutation, tool execution, route execution, provider/model runtime, Supabase mutation, GCS upload, signed URLs, public artifacts, beta, and production remain blocked.
