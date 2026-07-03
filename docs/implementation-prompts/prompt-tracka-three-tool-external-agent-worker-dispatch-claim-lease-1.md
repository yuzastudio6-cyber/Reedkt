# TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-DISPATCH-CLAIM-LEASE-1

Use this only after `TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTED-JOB-ROUTE-INVOCATION-1` is merged with validation passed.

Goal: advance the three active Track A tools from guarded persisted route invocation to a bounded worker dispatch/claim/lease proof.

Active tools:

- `gstreamer_render_pipeline_support`
- `mkvtoolnix_container_validation`
- `gpac_mp4box_packaging_validation`

Required boundaries:

- Workers may claim only an approved generated-fixture job snapshot.
- No private/user media, public URLs, signed URLs, public artifacts, Supabase mutation, SQL execution, production unlock, final render/export, or broad media is allowed.
- Worker lease/dispatch must be idempotent, auditable, and tied to the approved snapshot job payload.
- Any generated proof output remains under `/tmp` and is not committed.

If a safe worker claim/lease cannot be proven locally without remote mutation, record the exact blocker and keep the PR draft.
