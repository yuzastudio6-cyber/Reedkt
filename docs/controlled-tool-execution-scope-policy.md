# Controlled Tool Execution Scope Policy

Allowed future dry-run scope is limited to approved snapshot intake validation, committed fixture/report checks, route metadata compatibility checks, artifact source-of-truth validation, observability/cost/audit metadata shaping, and fail-closed simulation.

Blocked: real tool execution, real route execution, worker execution, provider/model calls, media/audio/render/export/image/browser/map execution, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, dependency mutation, raw prompt execution, external beta, paid production, and production.
