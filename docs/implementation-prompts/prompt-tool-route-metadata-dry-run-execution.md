# TOOL_ROUTE_EXECUTION - Tool-Route Metadata Dry-Run Execution

Run a separate metadata/no-op route dry-run using only the approved synthetic fixtures from `docs/activation-tool-route-dry-run-approval-reports/tool_route_synthetic_approved_plan_snapshot_fixtures.json`.

Do not execute real tools, workers, routes, providers/models, media/audio/render/export/image generation/image editing, browser capture, map rendering, Supabase writes, SQL, GCS upload, public artifacts, signed URLs, beta, production, dependency mutation, or raw prompts.

Use approved plan snapshot fixtures only, keep all execution flags false, and fail closed on any unsafe request.
