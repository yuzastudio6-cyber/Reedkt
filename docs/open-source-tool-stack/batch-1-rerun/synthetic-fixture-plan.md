# Synthetic Fixture Plan

Decision: `approved_for_future_open_source_tool_stack_batch_1_install_proof_execution`.

The future fixtures are synthetic metadata or committed-report checks only. This approval packet does not run them.

| Fixture | Candidate | Input class | Expected output |
| --- | --- | --- | --- |
| `synthetic_duckdb_empty_metadata_table` | `duckdb_metadata_query_proof` | synthetic metadata rows | version and row count metadata |
| `synthetic_polars_metadata_frame` | `polars_metadata_dataframe_proof` | synthetic metadata rows | version and shape metadata |
| `sharp_version_only_import_fixture` | `sharp_libvips_import_version_probe` | no image input | Sharp/libvips version metadata |
| `ffmpeg_version_only_fixture` | `ffmpeg_version_probe` | no media input | binary version metadata |
| `ffprobe_version_only_fixture` | `ffprobe_version_probe` | no media input | binary version metadata |
| `route_capability_manifest_fixture` | `route_capability_manifest_validation` | committed docs only | route owner consistency metadata |
| `fixture_report_validation_fixture` | `fixture_report_validation_harness` | committed reports only | schema consistency metadata |
| `inventory_proof_matrix_fixture` | `open_source_tool_inventory_validator` | committed inventory docs | inventory status consistency metadata |
