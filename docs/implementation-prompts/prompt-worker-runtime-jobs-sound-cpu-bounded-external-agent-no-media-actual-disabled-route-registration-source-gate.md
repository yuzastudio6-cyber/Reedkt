# WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ACTUAL-DISABLED-ROUTE-REGISTRATION-SOURCE-GATE

Create the actual disabled route registration source gate for the SOUND CPU no-media external-agent route.

Required source evidence:
- PR #2360 merged at `4e78819d6635bac7a152f645fe48441be740c57d`.
- Decision `worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_registration_plan_completed_with_warnings_ready_for_actual_disabled_route_registration_source_gate`.
- Existing route source file `server/routes/sound-cpu-no-media-agent-call-routes.ts`.
- Existing route path `/api/internal/workers/sound-cpu/no-media-agent-call`.

Scope:
- Add only disabled registration source needed to wire the existing disabled handler into the server route table.
- Keep route execution disabled and fail-closed.
- Do not execute the route.
- Do not dispatch workers, execute tools, read media, mutate Supabase, run SQL, create artifacts, call providers/models, run Docker/Cloud Run, unlock beta, or claim runtime readiness.

Acceptance:
- Preserve all 15 accepted SOUND CPU no-media tool IDs, both accepted worker names, both accepted image names, and all four accepted no-media job types.
- Preserve explicit `toolId` targeting.
- Preserve fail-closed envelope validation and blocked `409` response semantics.
- Any source registration must remain internal-only and disabled-by-default.
- Add diagnostics proving the route is registered only as a disabled handler and remains non-executable.

Next prompt:
- `WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-DISABLED-ROUTE-REGISTRATION-SOURCE-OWNER-REVIEW`
