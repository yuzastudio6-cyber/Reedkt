# WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-DISABLED-ROUTE-REGISTRATION-PLAN

Create a docs/diagnostics-only route registration plan for the disabled SOUND CPU no-media external-agent route.

Required source evidence:
- PR #2359 merged at `77975ab8514c51c091e1669fd37271511b4e4bdd`.
- Decision `worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_source_owner_review_passed_with_warnings_ready_for_disabled_route_registration_plan`.
- Source file `server/routes/sound-cpu-no-media-agent-call-routes.ts`.
- Route path `/api/internal/workers/sound-cpu/no-media-agent-call`.

Scope:
- Plan only how the disabled source should be registered in server routing later.
- Do not register the route in this prompt.
- Do not execute the route.
- Do not dispatch workers, execute tools, read media, mutate Supabase, run SQL, create artifacts, call providers/models, run Docker/Cloud Run, unlock beta, or claim runtime readiness.

Acceptance:
- Preserve all 15 accepted SOUND CPU no-media tool ids.
- Preserve the two accepted workers, two accepted images, and four no-media job types.
- Preserve explicit `toolId` targeting.
- Preserve fail-closed envelope validation and blocked `409` response semantics.
- The next prompt after this plan should be the actual disabled route registration source gate, still with execution disabled.
