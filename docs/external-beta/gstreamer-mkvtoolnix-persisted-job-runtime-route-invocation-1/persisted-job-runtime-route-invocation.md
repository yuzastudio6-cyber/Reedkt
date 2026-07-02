# Persisted Job Runtime Route Invocation

Route: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-invoke`

Persisted handoff route: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-handoff`

Queued runtime invocation route: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/invoke`

Decision: `completed_gstreamer_mkvtoolnix_persisted_job_payload_to_runtime_route_invocation`

Execution: `completed_persisted_job_payload_to_existing_generated_fixture_runtime_route_delegate`

Confirmation gates:

- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION=true`
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION=true`
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF=true`
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true`

Invocation behavior:

- Accepts only `quality_check` persisted DB job payloads with payload kind `gstreamer_mkvtoolnix_generated_fixture_runtime`.
- Requires top-level workspace, project, and approved snapshot references for idempotency and verifies they match the stored runtime invocation body.
- Requires `persisted_job_payload_to_existing_runtime_route_delegate`.
- Requires route idempotency derived from workspace, project, approved snapshot, persisted job, persisted invocation, and stored runtime invocation idempotency.
- Delegates only `persistedJobPayloadJson.runtimeInvocationBody`.
- Does not accept raw worker dispatch, broad job execution, Supabase mutation, SQL, private/user media, signed/public artifact, final render/export, or production unlock controls.

Implementation validation:

- Uses a fake runtime runner in smoke validation to prove the delegate path without executing Docker or tools.
- Actual generated-fixture route execution remains the next post-merge QA step.

Readiness: `ready_for_persisted_job_runtime_route_invocation_qa_rollup`
