# Lifecycle Script Safety Policy

Lifecycle script execution approved now: false

Future DuckDB-only command:

```bash
npm rebuild duckdb --ignore-scripts=false --no-audit --no-fund
```

The future command must stop on any unexpected tracked diff and must not commit `node_modules`, native binaries, caches, secrets, private data, media, public artifacts, or signed URLs.
