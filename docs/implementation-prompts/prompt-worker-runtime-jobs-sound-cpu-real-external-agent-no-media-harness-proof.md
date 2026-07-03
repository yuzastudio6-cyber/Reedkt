# WORKER_RUNTIME_JOBS-SOUND-CPU-REAL-EXTERNAL-AGENT-NO-MEDIA-HARNESS-PROOF

Use `worker_runtime_jobs_sound_cpu_real_external_agent_no_media_integration_plan_completed_with_warnings_ready_for_agent_harness_proof` as source evidence.

Goal: add and run a local credentialless external-agent no-media harness proof around the reviewed SOUND CPU adapter.

Allowed scope:
- Add a local validation harness that accepts `agentOrigin`, `agentSessionId`, and `agentRequestId` plus the reviewed adapter envelope.
- Forward only allowlisted no-media fields into the existing adapter.
- Run positive and fail-closed proof cases: valid external-agent no-media envelope, invalid origin, agent secret, media path, and true runtime flag.
- Produce stdout JSON and diagnostics docs only.

Forbidden scope:
- No real external-agent credential provisioning, real user media, media open, media processing, worker dispatch, route execution, Supabase mutation, SQL execution, storage transfer, signed/public artifact creation, provider/model call, Docker/GCP action, beta unlock, production unlock, or readiness claim.

Expected pass decision:
`worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_proof_passed_with_warnings_ready_for_harness_owner_review`

Expected blocker decision:
`worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_proof_blocked`
