# AI Graphics Local Fixture Invalid Case Plan

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_plan`

Invalid local fixture cases are planned to prove missing-contract rejection in a later validation lane. Planned invalid causes include missing approved plan snapshot placeholder, missing scoped tool-call manifest placeholder, missing private artifact scope, missing checksum placeholder, missing owner/capability id, or capability mismatch.

The invalid template `docs/tool-route-execution/fixtures/ai-graphics-metadata-local-fixture-invalid-template.json` is docs-only and not executed. Invalid cases must fail closed and must not fallback to raw prompt text, route execution, tool execution, worker execution, provider/model calls, browser/WebGL/canvas runtime, public artifacts, signed URLs, Supabase mutation, GCS upload, beta, or production.
