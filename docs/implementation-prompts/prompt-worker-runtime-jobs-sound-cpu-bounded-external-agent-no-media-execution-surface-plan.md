# WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-EXECUTION-SURFACE-PLAN

Use `worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_owner_review_passed_with_warnings_ready_for_bounded_execution_surface_plan` as source evidence.

Goal: plan a bounded external-agent no-media execution surface for SOUND CPU tool calls, based on the reviewed local harness proof.

Allowed scope:
- Define a local bounded execution surface contract for external-agent-origin no-media calls.
- Preserve the accepted workers, images, job types, and 15 SOUND CPU tools.
- Keep the surface credentialless, stdout JSON only, no file writes, and no product route wiring.
- Add docs/diagnostics/package scripts only.

Forbidden scope:
- No real external-agent credential provisioning, real user media, media open, media processing, worker dispatch, route execution, Supabase mutation, SQL execution, storage transfer, signed/public artifact creation, provider/model call, Docker/GCP action, beta unlock, production unlock, or readiness claim.

Expected pass decision:
`worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_plan_completed_with_warnings_ready_for_surface_proof`

Expected blocker decision:
`worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_plan_blocked`
