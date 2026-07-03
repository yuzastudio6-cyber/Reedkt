# Batch 1 E2E Proof Plan

Decision: `blocked_pending_package_lock_sync_review`.

No E2E proof is active in this packet. Each step is future-only and must wait for `DEPENDENCY_BASELINE_REPAIR_BEFORE_TOOL_BATCH_1` plus a separate install/proof approval. The planned proof surface is limited to version/import probes and metadata validation; real media and product runtime paths remain blocked.

| Candidate | Future proof type | Expected future report | Package-lock mutation | Real runtime |
| --- | --- | --- | --- | --- |
| duckdb_metadata_query_proof | version_or_import_probe | docs/open-source-tool-stack/batch-1/future-proof/duckdb_metadata_query_proof.json | false | false |
| polars_metadata_dataframe_proof | version_or_import_probe | docs/open-source-tool-stack/batch-1/future-proof/polars_metadata_dataframe_proof.json | false | false |
| sharp_libvips_import_version_probe | version_or_import_probe | docs/open-source-tool-stack/batch-1/future-proof/sharp_libvips_import_version_probe.json | false | false |
| ffmpeg_version_probe | version_or_import_probe | docs/open-source-tool-stack/batch-1/future-proof/ffmpeg_version_probe.json | false | false |
| ffprobe_version_probe | version_or_import_probe | docs/open-source-tool-stack/batch-1/future-proof/ffprobe_version_probe.json | false | false |
| route_capability_manifest_validation | metadata_validation | docs/open-source-tool-stack/batch-1/future-proof/route_capability_manifest_validation.json | false | false |
| fixture_report_validation_harness | metadata_validation | docs/open-source-tool-stack/batch-1/future-proof/fixture_report_validation_harness.json | false | false |
| open_source_tool_inventory_validator | metadata_validation | docs/open-source-tool-stack/batch-1/future-proof/open_source_tool_inventory_validator.json | false | false |
