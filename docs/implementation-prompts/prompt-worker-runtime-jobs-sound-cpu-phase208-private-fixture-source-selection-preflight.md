# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE208-PRIVATE-FIXTURE-SOURCE-SELECTION-PREFLIGHT

Use `worker_runtime_jobs_sound_cpu_phase207_blocked_private_fixture_missing` as source evidence.

Goal: provide or select an explicit local private fixture path for the SOUND CPU controlled real-user-media proof, or keep the proof blocked with the exact fixture blocker.

Allowed scope:
- Inspect repo-owned fixture policy docs and local metadata only.
- Accept a fixture path only if it is explicit, local, private, non-public, not a signed URL, not a provider output, not a raw prompt, not a secret/service-role payload, and not a model-weight location.
- Record privacy, retention, cleanup, sanitized evidence, no-public-artifact, and no-persistent-output boundaries.
- Produce the next prompt for the controlled proof only if the fixture path and all boundaries are explicit.

Forbidden scope:
- No media read, media processing, tool execution, worker execution, route execution, Supabase mutation, SQL execution, storage transfer, signed/public artifact creation, provider/model call, Docker/GCP action, billing, beta unlock, production unlock, or readiness claim.
- Do not choose random media from disk and do not crawl broad private folders looking for usable content.

Expected pass decision:
`worker_runtime_jobs_sound_cpu_phase208_private_fixture_source_selection_preflight_passed_with_warnings_ready_for_controlled_private_fixture_real_user_media_runtime_execution_proof`

Expected blocker decision if no explicit approved fixture exists:
`worker_runtime_jobs_sound_cpu_phase208_blocked_private_fixture_source_missing`
