# Worker Runtime Dry-Run Envelope

Dry-run mode: `confirmed_guarded_worker_runtime_envelope_validation_only`

Required refs:

- approved snapshot: `approved-snapshot-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`
- approval record: `approval-record-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`
- credit/no-spend policy: `no-spend-fixture-policy-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`
- job: `job-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`
- worker lease: `worker-lease-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`
- route idempotency key: `route-idempotency-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`
- private input manifest: `private-input-manifest-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`
- output manifest schema: `output-manifest-schema-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`
- QA report schema: `qa-report-schema-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`
- cleanup policy: `cleanup-policy-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`
- retention policy: `retention-policy-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`
- failure policy: `failure-policy-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`
- audit parent: `audit-event-parent-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1`

Allowed command-template ids:

| Template | Dry-run result | Exit status | Stdout/stderr |
| --- | --- | --- | --- |
| `gst_fakesrc_fakesink_no_media_healthcheck_v1` | `validated_allowed_template_no_runtime_execution` | `not_applicable_dry_run_envelope_validation_only` | `not_collected_no_tool_execution` |
| `gst_controlled_generated_fixture_pipeline_v1` | `validated_allowed_template_no_runtime_execution` | `not_applicable_dry_run_envelope_validation_only` | `not_collected_no_tool_execution` |
| `mkvmerge_generated_subtitle_only_package_v1` | `validated_allowed_template_no_runtime_execution` | `not_applicable_dry_run_envelope_validation_only` | `not_collected_no_tool_execution` |
| `mkvmerge_identify_generated_subtitle_only_v1` | `validated_allowed_template_no_runtime_execution` | `not_applicable_dry_run_envelope_validation_only` | `not_collected_no_tool_execution` |

Rejected inputs remain blocked: raw chat, raw command strings, frontend file paths, public URL source-of-truth, signed URL source-of-truth, arbitrary private media, unmanifested files, provider/model prompt payloads, and service-role secret payloads.
