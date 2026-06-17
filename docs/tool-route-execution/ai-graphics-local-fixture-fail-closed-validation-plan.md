# AI Graphics Local Fixture Fail-Closed Validation Plan

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_plan`

Future local fixture validation must fail closed when any of the following are missing or unsafe:

- approved plan snapshot placeholder;
- scoped tool-call manifest placeholder;
- accepted tool id or owner/capability id;
- private artifact manifest placeholder;
- checksum placeholder;
- blocked-use list;
- worker handoff placeholder;
- QA, observability, or cleanup placeholder.

It must also fail closed for requests involving local fixture execution, route execution, actual tool execution, worker execution, provider/model calls, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL, GCS upload, signed URL creation, public artifact creation, raw prompt execution, beta, or production.
