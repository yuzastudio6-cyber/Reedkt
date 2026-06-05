# Phase 51D Supabase Milestone Sync Policy

Phase 51D makes automatic per-phase activation sync available after a phase report is complete. GCS remains the private artifact store. Supabase stores structured metadata and private `gs://` references only.

Allowed:

- One guarded Phase 51D self-sync write to `activation_runs`, `activation_artifacts`, `activation_qa_gates`, `readiness_snapshots`, `tool_capabilities`, and `feature_gates`.
- Readback of the written activation run by `(phase_id, run_id)`.
- Private GCS JSON uploads under `activation-supabase/phase51d/<runId>/`.
- Backend-only resolution of `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Blocked:

- Migrations, schema changes, RLS changes, and Supabase lifecycle commands.
- Historical backfill reruns.
- Product row writes outside the milestone registry.
- Secret values in logs, docs, artifacts, PR text, frontend code, or git.
- Public artifact URLs as source of truth and signed URLs as source of truth.
- Raw provider responses, Brave raw responses/snippets, media/blob payloads, and raw prompt execution.
- Production, external beta, paid production, broad media, and public artifact unlocks.

The sanitizer blocks secret-looking values, DB URLs, bearer tokens, API keys, signed URLs, raw-provider fields, and enabled production/beta feature gates before any Supabase write is attempted.
