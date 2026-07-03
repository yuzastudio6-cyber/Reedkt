# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE209-PRIVATE-FIXTURE-PATH-APPROVAL-HANDOFF

Use `worker_runtime_jobs_sound_cpu_phase208_blocked_private_fixture_source_missing` as source evidence.

Goal: provide or accept exactly one explicit local private fixture path for the next controlled SOUND CPU real-user-media proof, without opening or processing the media in this handoff.

Required input:
- A local filesystem path to one private audio/media fixture.
- Evidence that the fixture is private, non-public, user-owned or owner-approved for this bounded proof, not a signed URL, not provider output, not a raw prompt, not a secret/service-role payload, and not a model-weight location.
- Retention, cleanup, no-public-artifact, no-persistent-output, sanitized-evidence, and no-Supabase-write boundaries.

Allowed scope:
- Inspect repo-owned policy docs and metadata.
- Check that the provided path string is local and explicit.
- Confirm the proof runner must stop before media open unless all required boundaries are present.

Forbidden scope:
- No media read, media processing, waveform/probe, tool execution, worker execution, route execution, Supabase mutation, SQL execution, storage transfer, signed/public artifact creation, provider/model call, Docker/GCP action, billing, beta unlock, production unlock, or readiness claim.
- Do not search broad private folders and do not substitute random media.

Expected pass decision:
`worker_runtime_jobs_sound_cpu_phase209_private_fixture_path_approval_handoff_passed_with_warnings_ready_for_controlled_private_fixture_real_user_media_runtime_execution_proof`

Expected blocker decision if the path or boundaries are missing:
`worker_runtime_jobs_sound_cpu_phase209_blocked_private_fixture_path_or_boundary_missing`
