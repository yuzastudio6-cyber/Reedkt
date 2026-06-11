# Supabase Track B Clean Staging Backfill Rollback

Rollback is future-only and must be separately approved before any cleanup.

If cleanup is ever required, it must be limited to rows whose metadata identifies this run:

- run id: `supabase-trackb-clean-staging-backfill-20260611`
- export version: `track-b-supabase-milestone-export-v1`
- target project ref: `fnjiylwirntrqdcwpbho`

Rollback must not drop activation registry tables, mutate production, touch the broken original staging target, remove unrelated activation rows, or run Track B tools/workers/routes.

Any future cleanup must record redacted evidence before product-wide readiness aggregation or promotion review.
