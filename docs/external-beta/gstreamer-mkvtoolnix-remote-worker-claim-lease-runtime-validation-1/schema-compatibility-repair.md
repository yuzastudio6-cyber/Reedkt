# Schema Compatibility Repair

DB job type: `quality_check`

Payload kind: `gstreamer_mkvtoolnix_generated_fixture_runtime`

Compatibility marker: `db_job_type_uses_public_job_type_enum_payload_kind_preserves_gstreamer_mkvtoolnix_runtime_identity`

The active `public.jobs.job_type` column uses the `public.job_type` enum. The custom string `gstreamer_mkvtoolnix_generated_fixture_runtime` is not a valid enum value, so persisted GStreamer/MKVToolNix generated-fixture jobs must use the valid non-expensive `quality_check` job type for DB compatibility.

The tool-specific runtime identity is preserved in `input_payload.persistedJobPayloadKind` and route payload schema as `gstreamer_mkvtoolnix_generated_fixture_runtime`.

This repair does not add migrations, enum values, package dependencies, Dockerfile changes, runtime execution, workers, media processing, or public artifact behavior.
