# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE210-PRIVATE-FIXTURE-PATH-INPUT-AND-BOUNDARY-INTAKE

Use `worker_runtime_jobs_sound_cpu_phase209_blocked_private_fixture_path_or_boundary_missing` as source evidence.

Goal: accept exactly one explicit local private fixture path plus all required proof-boundary evidence, or keep the SOUND CPU real-user-media proof blocked.

Required input:
- One local filesystem path to a private audio/media fixture.
- Confirmation the fixture is private, non-public, user-owned or owner-approved for this bounded proof, not a signed URL, not provider output, not a raw prompt, not a secret/service-role payload, and not a model-weight location.
- Retention boundary, cleanup boundary, no-public-artifact boundary, no-persistent-output boundary, sanitized-evidence boundary, and no-Supabase-write boundary.

Allowed scope:
- Inspect repo-owned policy docs and metadata.
- Check only the provided path string and boundary declarations.
- Record the accepted path as metadata if all boundaries are complete.

Forbidden scope:
- No media read, media processing, waveform/probe, tool execution, worker execution, route execution, Supabase mutation, SQL execution, storage transfer, signed/public artifact creation, provider/model call, Docker/GCP action, billing, beta unlock, production unlock, or readiness claim.
- Do not search broad private folders, do not use random media, and do not open the fixture in this prompt.

Expected pass decision:
`worker_runtime_jobs_sound_cpu_phase210_private_fixture_path_input_passed_with_warnings_ready_for_controlled_private_fixture_real_user_media_runtime_execution_proof`

Expected blocker decision:
`worker_runtime_jobs_sound_cpu_phase210_blocked_private_fixture_path_input_missing_or_incomplete`
