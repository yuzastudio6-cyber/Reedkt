# SOUND CPU Static Contract Plan Report

## Evidence

- Source PR: `#670`.
- Source milestone: `WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW`.
- Merge commit: `f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc`.
- Source decision: `worker_runtime_jobs_sound_cpu_handoff_review_passed_with_warnings_ready_for_static_contract_plan`.
- Current decision target: `worker_runtime_jobs_sound_cpu_static_contract_plan_ready_for_owner_review`.

## Static Contract Rows

The matrix records 47 rows: 2 static worker contracts, 2 planned images, 4 accepted job types, 4 input placeholders, 4 output placeholders, idempotency/retry/artifact/observability placeholders, 22 blocked gates, 4 owner handoff surfaces, and 1 next prompt.

Accepted worker names:

- `sound-cpu-analysis-worker`
- `sound-audio-metadata-worker`

Accepted image labels:

- `reeditpro/sound-cpu-analysis-worker`
- `reeditpro/sound-audio-metadata-worker`

Accepted planning-only job types:

- `sound.package_import_smoke`
- `sound.numeric_array_analysis`
- `sound.symbolic_midi_analysis`
- `sound.loudness_synthetic_analysis`

## Safety Exclusions

This milestone does not dispatch workers, claim leases, create jobs, call the worker router, execute tools, run package imports, process media/audio, create artifacts, mutate Supabase, run SQL, create migrations, build Docker images, call GCP or Cloud Run, create signed URLs, expose public artifacts, mutate `package-lock.json`, or unlock beta/production.

## Next Recommendation

Proceed to `WORKER_RUNTIME_JOBS-SOUND-CPU-STATIC-CONTRACT-OWNER-REVIEW` for owner review of the static worker contracts. Worker-route dry-run, runtime readiness, and production readiness remain blocked.
