# Synthetic Proof Plan

Proof execution allowed in this review: `false`

- `duckdb_metadata_query_proof`: Node import/version plus in-memory SELECT 1 metadata query
- `polars_metadata_dataframe_proof`: Node import/version plus in-memory dataframe construction and row-count metadata
- `ffmpeg_version_probe`: ffmpeg -version only in an approved runtime
- `ffprobe_version_probe`: ffprobe -version only in an approved runtime

All proofs remain future and separately approved.
