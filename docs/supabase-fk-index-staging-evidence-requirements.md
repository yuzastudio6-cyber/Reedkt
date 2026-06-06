# Supabase FK Index Staging Evidence Requirements

Staging evidence status: `evidence_required`.
Prompt 23 state on this base: `pending_human_approval`.
Production readiness approved: no.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.

## Required Before Any Staging FK Index Work

Future staging FK index validation requires:

- human approval decision completed for the exact PR and commit;
- accepted redacted Supabase project evidence;
- accepted Secret Manager reference metadata evidence, never values;
- approved target table and column evidence;
- duplicate and overlap review;
- rollback owner and cleanup plan;
- selected test set and expected advisor outcome;
- sanitized evidence collection path;
- no service-role, JWT, provider, Stripe, database password, signed URL, or raw connection string in docs or logs.

## Evidence To Capture Later

Future evidence should include:

- sanitized advisor finding before state;
- sanitized advisor finding after state, if a future staging candidate runs;
- sanitized index catalog evidence limited to table, index name, column names, and local/staging yes/no;
- duplicate review notes for each of the fifteen candidates;
- write-amplification notes for chat and credit ledger paths;
- rollback rehearsal status.

Prompt 26H does not collect staging evidence.

