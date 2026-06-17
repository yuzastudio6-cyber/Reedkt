# AI Graphics Local Fixture Scoped Manifest Validation Policy

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_validation`

Future validation may approve only metadata-only scoped tool-call manifest checks. Each fixture must include a placeholder scoped tool-call manifest reference and must bind the requested tool to an accepted AI graphics capability from the PR #458 inventory.

The scoped manifest validation must verify:

- source owner: `AI_TOOLS_CREATIVE_GRAPHICS`;
- workstream owner: `TOOL_ROUTE_EXECUTION`;
- accepted tool id and capability id;
- placeholder approved plan snapshot id;
- placeholder route ref;
- metadata/manifest-only allowed use;
- blocked-use list for all runtime paths;
- no raw prompt text and no executable instructions.

The scoped manifest must not authorize route execution, actual tool execution, worker execution, provider/model calls, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, GCS upload, signed URL creation, public artifact creation, beta, or production.
