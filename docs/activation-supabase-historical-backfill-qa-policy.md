# Phase 51C Supabase Historical Backfill QA Policy

Mandatory QA gates:

- `phase51b_evidence`: Phase 51B completed and Phase51C readiness is recorded.
- `registry_schema_available`: the six registry tables are visible through zero-row probes.
- `backfill_plan_defined`: P0 and optional P1 phase lists are explicit.
- `evidence_resolution`: all P0 phases resolve canonical evidence or block with exact reason.
- `bundle_validation`: every writable bundle passes Phase 51B bundle validation.
- `idempotent_upsert`: written bundles use idempotent upsert behavior.
- `readback_verification`: every P0 bundle is read back by phase/run.
- `artifact_policy`: Supabase stores private `gs://` references only.
- `feature_gate_policy`: production, beta, broad media, public artifact, signed URL, and raw prompt gates remain disabled.
- `secret_safety`: secret values are never printed, committed, uploaded, or stored.
- `skipped_phase_policy`: optional skipped phases include a reason.
- `blocked_features`: migrations, schema/RLS changes, providers, production, beta, broad media, public artifacts, and signed URL source-of-truth remain blocked.

Phase51D is ready only when all P0 bundles write/read back and QA passes.
