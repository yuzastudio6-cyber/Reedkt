# AI Graphics Job Payload Dry-Run Fixture Case Plan

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

The future dry-run execution lane should use three docs-only case families: valid, blocked, and invalid. Each case must use placeholder refs only and must remain metadata/static. The future lane may read the committed schema/example fixture family already present under `docs/worker-runtime/fixtures/`, plus this approval packet and prior Worker source evidence.

Case requirements:

- Valid cases: prove accepted metadata payload shape using placeholder `planSnapshotId`, placeholder `scopedToolCallManifestId`, placeholder private artifact refs, checksum refs, claim/lease placeholders, queue placeholders, no-execution assertions, observability/audit refs, fail-closed assertions, and worker intake coverage.
- Blocked cases: prove unsafe or runtime-seeking payloads fail closed without job claim, lease mutation, queue execution, route execution, actual tool execution, provider calls, browser/WebGL/canvas runtime, public artifacts, signed URLs, or Supabase/GCS access.
- Invalid cases: prove malformed placeholder refs, missing owner/capability/tool ids, missing private artifact/checksum refs, or missing no-execution assertions fail closed.

Future fixture outputs must remain ignored local evidence only; this approval packet commits no dry-run output.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
