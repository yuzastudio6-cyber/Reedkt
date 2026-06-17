# AI Graphics Local Fixture Blocked Case Validation Evidence

Decision: `tool_route_ai_graphics_metadata_local_fixture_validation_passed_with_warnings`

Blocked-case validation passed for all 13 accepted tools. The blocked template covers unsafe requests for route execution, actual tool execution, worker execution, provider/model runtime, browser runtime, WebGL runtime, canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS upload, signed URL creation, public artifact creation, raw prompt execution, beta unlock, and production unlock.

The expected blocked result is `blocked_unsafe_runtime_or_artifact_request`.
