# OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_EXECUTION

Use this prompt only after PR review approves the DuckDB native binding repair execution.

Allowed future command:

```bash
npm rebuild duckdb --ignore-scripts=false --no-audit --no-fund
```

The future phase must verify a clean worktree, run only the DuckDB scoped rebuild, then run only DuckDB import/API-shape or version plus a tiny in-memory query. Stop on package-lock/package.json drift, unexpected native artifact scope, lifecycle script expansion, media/tool/worker/provider/Supabase/GCS/public/signed URL/raw prompt/beta/production unlocks, or secret exposure.
