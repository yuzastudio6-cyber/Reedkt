# WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ROUTE-TO-TOOL-SOURCE-GATE

Create the smallest source gate that connects the existing no-media internal route to the controlled no-media SOUND CPU tool runner.

Required source evidence:
- PR #2383 merged with decision `worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_proof_owner_review_passed_with_warnings_ready_for_route_to_tool_execution_unlock_plan`.
- Route-to-tool unlock plan decision `worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_execution_unlock_plan_completed_with_warnings_ready_for_route_to_tool_source_gate`.
- PR #2381 proved all 15 accepted tools with synthetic in-memory operations.

Allowed source scope:
- `server/routes/sound-cpu-no-media-agent-call-routes.ts`
- a local controlled route-to-tool proof runner under `scripts/validation/`
- diagnostics, docs, prompts, and `package.json`

Do not enable worker dispatch, real user media, media file open, provider/model calls, Supabase/SQL, artifact writes, Docker/Cloud Run, beta, production, or broad service-role handlers. Stop if the route cannot remain bounded, no-media, allowlisted, and fail-closed.

Next prompt on source gate pass:
- `WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ROUTE-TO-TOOL-CONTROLLED-PROOF`
