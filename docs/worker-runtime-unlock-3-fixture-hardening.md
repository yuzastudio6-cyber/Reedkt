# Worker Runtime Fixture Hardening

Decision: `worker_runtime_fixture_hardening_passed_ready_for_local_fixture_plan`.

This metadata-only packet hardens the merged PR #351 dry-run contract review into docs-only worker runtime fixtures for a later local fixture plan. The packet derives four valid fixtures from the PR #342 approved `approved_plan_snapshot_v1` fixtures and adds eight fail-closed invalid fixtures covering raw prompt input, public artifact output, broad media processing, production write requests, signed URL source-of-truth metadata, unapproved artifact prefixes, service-role-key-like field names, and direct tool/route execution fields.

Each valid hardened fixture now has explicit `approvedPlanSnapshotRef`, `approvedPlanSnapshotHash`, `planSnapshotSchemaVersion`, `approvedPlanSnapshotSchema`, private placeholder source refs, payload contract metadata, result contract metadata, manifest/checksum/provenance placeholders, and all runtime execution flags set to false. Deterministic SHA-256 values are computed over canonical fixture JSON content only.

Real worker execution, queue enqueue, job dispatch, job claim, job lease, sidecar spawn, subprocess spawn, tool execution, route execution, provider call, media processing, Supabase write, SQL, migration, storage object, signed URL, public artifact, generated asset, credit mutation, beta unlock, paid production unlock, production unlock, and `generated_local_fixture_passed` remain blocked.

Next prompt: `WORKER-RUNTIME-UNLOCK-4: worker runtime local fixture plan, no real execution`.

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, real worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
