# RP-ARTIFACTS-01-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-SCAFFOLD

Use this prompt only after `RP-JOBS-01-INTERNAL-BETA-JOB-QUEUE-RUNTIME-SCAFFOLD` is merged and validated.

Implement the next narrow internal beta milestone for a fail-closed private artifact manifest scaffold.

Requirements:

- Do not create signed URLs, public artifacts, storage objects, previews, exports, or private artifact access tokens.
- Do not run workers, providers, tools, rendering, media processing, route execution, Supabase remote mutations, or beta/production unlocks.
- Require approved snapshot, job, manifest, checksum, QA, cleanup, and membership boundaries before any future private artifact access runtime can leave disabled mode.
- Keep frontend code from writing artifact manifest, storage, QA, or service-role state directly.

Expected conservative result if no explicit runtime approval is supplied:

- Decision: `completed_disabled_internal_beta_private_artifact_manifest_scaffold_no_artifact_access`
- Execution: `completed_fail_closed_artifact_manifest_scaffold_no_storage_or_signed_url`
- Private artifact access: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Internal beta end-to-end status: `not_ready`
