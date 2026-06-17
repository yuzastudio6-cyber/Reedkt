# AI Graphics Local Fixture Valid Case Validation Policy

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_validation`

Future valid case validation may inspect metadata-only fixture structure from PR #458. It must require:

- placeholder approved plan snapshot id;
- placeholder scoped tool-call manifest id;
- accepted AI graphics tool id and capability id;
- valid case id from `ai-graphics-local-fixture-case-inventory.md`;
- metadata or manifest-only allowed use;
- private artifact manifest placeholder;
- checksum placeholder;
- QA, observability, cleanup, and worker handoff placeholders;
- blocked-use list covering route execution, actual tool execution, worker execution, provider runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, GCS upload, signed URL creation, public artifact creation, raw prompt execution, beta, and production.

Valid case validation must not validate rendered media, browser output, canvas output, WebGL output, SVG output, public artifacts, signed URLs, provider output, user media, or raw prompts. A valid case proves only that the local fixture metadata contract is shaped correctly for later review.
