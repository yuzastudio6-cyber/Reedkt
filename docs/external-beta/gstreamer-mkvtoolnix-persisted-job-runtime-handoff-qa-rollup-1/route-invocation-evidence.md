# Persisted Job Runtime Handoff Route Invocation Evidence

Route: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-handoff`

Status: `HTTP 201`

Route result: `completed_persisted_job_runtime_handoff`

Run ID: `2026-07-02T12-58-02-530Z-persisted-route`

Output directory: `/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1/2026-07-02T12-58-02-530Z-persisted-route`

Confirmation gates used:

- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF=true`
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF=true`

Observed handoff:

- Local mock job service handoff: `completed`
- DB job type: `quality_check`
- Payload kind: `gstreamer_mkvtoolnix_generated_fixture_runtime`
- Runtime invocation body accepted into persisted job payload: `true`
- Runtime route invocation during this QA rollup: `false`
- GStreamer execution during this QA rollup: `false`
- MKVToolNix execution during this QA rollup: `false`

Harness note:

- An earlier local harness attempt set the confirmation gates only in the constructed runtime env object and failed closed with `blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_confirmation`.
- That blocked attempt produced no job-service handoff, no runtime invocation, no tool execution, no media processing, no Supabase mutation, no SQL, and no committed artifacts.
- The accepted evidence is the successful process-env-gated run above.

Artifacts/checksums:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `persisted-job-runtime-handoff-route-invocation-report.json` | 23894 | `3a12e54606c79f9723c5765db2059a43d80c4ac07306077a2e24e7bbfa6611a2` |
| `persisted-job-runtime-handoff-route-invocation-manifest.json` | 1146 | `8c6eb2369cb2aeea7bdcb16b66f7c1a0d9198316f8ccbcd3a9ef0dea760db417` |

Generated artifacts committed: `none`
