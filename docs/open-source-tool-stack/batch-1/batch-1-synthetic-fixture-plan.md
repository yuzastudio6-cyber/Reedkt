# Batch 1 Synthetic Fixture Plan

Decision: `blocked_pending_package_lock_sync_review`.

The fixtures below are future-only after dependency baseline repair and a separate approval. They use synthetic metadata or committed report docs only; no real media, private payload, provider response, or secret payload is an input.

| Fixture | Inputs | Expected output | Future only |
| --- | --- | --- | --- |
| synthetic_duckdb_empty_metadata_table | synthetic rows only | row count and schema metadata only | true |
| synthetic_polars_empty_metadata_frame | synthetic rows only | shape and schema metadata only | true |
| sharp_version_only_import_fixture | no image input | version metadata only | true |
| ffmpeg_version_only_fixture | no media input | version metadata only | true |
| ffprobe_version_only_fixture | no media input | version metadata only | true |
| route_capability_manifest_fixture | committed routing policy docs | metadata consistency only | true |
| fixture_report_validation_fixture | committed activation reports | schema consistency only | true |
| inventory_proof_matrix_fixture | committed open-source inventory docs | classification consistency only | true |
