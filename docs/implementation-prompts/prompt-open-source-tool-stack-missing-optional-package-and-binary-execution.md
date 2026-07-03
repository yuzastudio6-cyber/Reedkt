# OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_EXECUTION

Execute only the approved missing optional package/binary checks if the source-of-truth approval remains at decision `missing_optional_package_and_binary_approval_passed_ready_for_execution`.

Allowed future package command:

```bash
npm install duckdb nodejs-polars --save-exact --ignore-scripts --no-audit --no-fund
```

Allowed future binary checks:

```bash
command -v ffmpeg && ffmpeg -version
command -v ffprobe && ffprobe -version
```

Future proof limits:

- DuckDB: import/version plus one tiny in-memory synthetic metadata query.
- Polars: import/version plus one tiny in-memory dataframe metadata check.
- FFmpeg/FFprobe: command existence plus version text only, with absence fail-closed unless a separate worker/container owner approval supplies binaries.

Do not run media processing, route execution, worker execution, provider calls, Supabase/SQL/GCS mutation, public artifacts, signed URLs, raw prompts, GitHub merges, beta, or production.
