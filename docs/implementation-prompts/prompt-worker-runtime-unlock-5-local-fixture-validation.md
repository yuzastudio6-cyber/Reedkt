# WORKER-RUNTIME-UNLOCK-5: Worker Runtime Local Fixture Validation

Proceed only after `worker_runtime_local_fixture_plan_ready`.

Scope: validate the committed docs-only hardened worker runtime fixtures locally as metadata. The validation may read the PR #353 hardened fixture JSON, manifest, checksums, schema-version index, and the UNLOCK-4 local fixture plan reports. It may recompute deterministic SHA-256 values over canonical fixture JSON content and verify valid/invalid fixture expectations.

Do not execute real workers, enqueue jobs, dispatch jobs, claim or lease jobs, mutate Supabase, execute SQL, deploy migrations, run providers, run tools/routes, process media, run Docker, run Cloud Run or Cloud Build, create signed URLs, create public artifacts, generate assets, mutate credits or billing, unlock beta, unlock paid production, unlock production, or claim `generated_local_fixture_passed` unless a later owner explicitly approves a different phase.
