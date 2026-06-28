# GPAC/MP4Box Mock Worker Interface Plan

Future mock worker interface packet may define TypeScript-only contracts for the job envelope, command template ids, manifest references, QA report references, cleanup status, and structured blockers.

The mock interface must not execute GPAC/MP4Box, Docker, media processing, workers, routes, Supabase, SQL, storage, render/export, or providers. It must not add package dependencies or mutate `package-lock.json`.

Required future blocker categories:
- `blocked_missing_approved_snapshot`
- `blocked_missing_approval_record`
- `blocked_missing_private_input_manifest`
- `blocked_input_checksum_mismatch`
- `blocked_unapproved_command_template`
- `blocked_idempotency_conflict`
- `blocked_worker_lease_unavailable`
- `blocked_public_or_signed_artifact_attempt`
- `blocked_cleanup_policy_missing`
