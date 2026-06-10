# Supabase Reset Failure Recovery Next Step

Use this prompt only after reviewing PR #269 and the diagnostics reports in `docs/activation-supabase-reset-retry-failure-diagnostics-reports`.

Current decision: `recovery_path_supabase_support_packet`.

The next phase must stay separate from this diagnostics packet. It may choose one of these paths after human review:

- Supabase support/escalation using the safe support packet.
- New staging branch/project approval if the existing staging target remains unrecoverable.
- Ordered apply approval only after a complete dry-run and schema/RLS review.
- Restore/manual-risk review if partial mutation is proven.

Forbidden in this packet: reset retry, `db push`, migration repair, schema deploy, direct DDL/DML, Track B writes, production, providers, workers, routes, tools, media processing, Track A, beta, and production unlock.
