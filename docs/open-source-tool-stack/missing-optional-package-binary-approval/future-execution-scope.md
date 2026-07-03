# Future Execution Scope

Current phase execution allowed: `false`

Package targets:

- `duckdb_metadata_query_proof`: package `duckdb`, future proof import/version and in-memory metadata query only
- `polars_metadata_dataframe_proof`: package `nodejs-polars`, future proof import/version and in-memory dataframe metadata check only

System binary targets:

- `ffmpeg_version_probe`: `command -v ffmpeg && ffmpeg -version`, absence outcome `blocked_missing_system_binary`
- `ffprobe_version_probe`: `command -v ffprobe && ffprobe -version`, absence outcome `blocked_missing_system_binary`

Every target remains future and separately approved.
