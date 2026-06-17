# AI Graphics Local Fixture Blocked Use Cases

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_plan`

Blocked case fixtures are planned for static validation only. They must reject:

- missing approved plan snapshot;
- missing scoped tool-call manifest;
- raw prompt text;
- real URLs, signed URLs, or public artifact refs;
- provider raw output;
- real user media or private user data;
- route execution requests;
- actual tool execution requests;
- worker execution requests;
- browser/WebGL/canvas runtime requests;
- resvg rasterization requests;
- Remotion render/export requests;
- Supabase mutation, SQL, GCS upload, beta, and production requests.

The blocked template `docs/tool-route-execution/fixtures/ai-graphics-metadata-local-fixture-blocked-template.json` is docs-only and not executed.
