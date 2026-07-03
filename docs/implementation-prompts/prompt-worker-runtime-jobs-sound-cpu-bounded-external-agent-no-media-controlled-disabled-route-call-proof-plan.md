# WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-CONTROLLED-DISABLED-ROUTE-CALL-PROOF-PLAN

Plan and run a controlled proof that the registered SOUND CPU no-media external-agent route can be called and remains fail-closed.

Required source evidence:
- Decision `worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_registration_source_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_call_proof_plan`.
- Route source file `server/routes/sound-cpu-no-media-agent-call-routes.ts`.
- App mount file `server/app.ts`.
- Route path `/api/internal/workers/sound-cpu/no-media-agent-call`.
- `SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP` must be true.
- `SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED` must be false.

Scope:
- The proof may call only the disabled route and must expect the fail-closed response.
- The proof must verify status `409`, `acceptedForExecution: false`, `routeRegisteredInApp: true`, `routeExecutionEnabled: false`, and all side-effect flags false.
- The proof must use a safe static envelope with one explicit `toolId` from the accepted 15-tool set.
- Do not dispatch workers, execute tools, process media, touch Supabase, run SQL, create artifacts, call providers/models, run Docker/Cloud Run, or unlock beta/production.
- Do not claim external-agent execution readiness or tool execution readiness from this proof.

Next prompt on pass:
- `WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-DISABLED-ROUTE-CALL-PROOF-OWNER-REVIEW`
