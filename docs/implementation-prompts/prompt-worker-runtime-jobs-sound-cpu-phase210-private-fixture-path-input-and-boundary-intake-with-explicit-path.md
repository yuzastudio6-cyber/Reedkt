# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE210-PRIVATE-FIXTURE-PATH-INPUT-AND-BOUNDARY-INTAKE-WITH-EXPLICIT-PATH

Use `worker_runtime_jobs_sound_cpu_phase210_blocked_private_fixture_path_input_missing_or_incomplete` as source evidence.

Goal: accept exactly one explicit local private fixture path plus all required proof-boundary declarations for the next controlled SOUND CPU real-user-media proof, without opening or processing the media in this intake prompt.

Required input:
- One exact local filesystem path to a private audio/media fixture.
- Confirmation the fixture is private, non-public, user-owned or owner-approved for this bounded proof.
- Confirmation the input is not a signed URL, provider output, raw prompt, secret/service-role payload, model-weight location, public artifact, or random media selection.
- Retention boundary, cleanup boundary, no-public-artifact boundary, no-persistent-output boundary, sanitized-evidence boundary, and no-Supabase-write boundary.

Allowed scope:
- Check only the provided path string and boundary declarations.
- Confirm the path is local and explicit.
- Record accepted path metadata only if every required boundary is complete.
- Keep the proof runner stopped until the follow-up controlled proof prompt.

Forbidden scope:
- No media read, media processing, waveform/probe, tool execution, worker execution, route execution, Supabase mutation, SQL execution, storage transfer, signed/public artifact creation, provider/model call, Docker/GCP action, billing, beta unlock, production unlock, or readiness claim.
- Do not search broad private folders, do not use random media, and do not open the fixture in this prompt.

Expected pass decision:
`worker_runtime_jobs_sound_cpu_phase210_private_fixture_path_input_passed_with_warnings_ready_for_controlled_private_fixture_real_user_media_runtime_execution_proof`

Expected blocker decision:
`worker_runtime_jobs_sound_cpu_phase210_blocked_private_fixture_path_input_missing_or_incomplete`
