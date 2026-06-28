# Imported QWEN Draft Source

The split import adds the previously absent QWEN persistence draft source:

- Draft SQL: `database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql`
- Local SQL tests: `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`

The draft SQL is explicitly marked:

- `DO NOT RUN`
- `DO NOT APPLY TO SUPABASE`
- planning-only QWEN backend runtime persistence constraints

The local SQL test file is explicitly marked:

- manual SQL smoke tests
- do not run in production
- use only in approved local/staging Supabase testing after review and application of the draft SQL

This import makes the source available for the next guarded local-only validation packet. It does not convert the draft into an active migration and does not approve remote execution.
