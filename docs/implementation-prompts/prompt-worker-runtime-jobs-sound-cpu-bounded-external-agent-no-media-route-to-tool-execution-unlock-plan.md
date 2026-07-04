# WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ROUTE-TO-TOOL-EXECUTION-UNLOCK-PLAN

Plan the smallest safe route-to-tool execution unlock for the existing disabled no-media route.

Required source evidence:
- PR #2381 merged with controlled no-media package proof for all 15 accepted SOUND CPU tools.
- Decision `worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_proof_owner_review_passed_with_warnings_ready_for_route_to_tool_execution_unlock_plan`.
- External-agent route execution is still not ready today.

Boundaries:
- Do not enable broad worker dispatch, real user media, media file open, provider/model calls, Supabase/SQL, artifacts, Docker/Cloud Run, beta, or production.
- Plan only a bounded no-media route-to-controlled-runner path with allowlisted tool ids, fail-closed request validation, and explicit side-effect false assertions.
- Stop rather than force readiness if the existing route, adapter, or runner cannot be connected without widening scope.

Next prompt on completed unlock plan:
- `WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ROUTE-TO-TOOL-SOURCE-GATE`
