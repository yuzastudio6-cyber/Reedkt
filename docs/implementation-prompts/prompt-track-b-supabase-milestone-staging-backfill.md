# Prompt: Track B Supabase Milestone Staging Backfill

Use this prompt only after Phase 44P is reviewed and a Foundation/Supabase owner approves a guarded staging metadata backfill.

Input:

- `docs/activation-track-b-readiness-rollup-reports/track_b_supabase_milestone_export.json`
- `docs/activation-track-b-readiness-rollup-reports/track_b_supabase_milestone_export.schema.json`

Allowed future scope:

- Validate the Phase 44P export against the committed schema.
- Backfill safe Track B milestone metadata into an approved staging Supabase target only.
- Record redacted evidence and rollback/cleanup status.

Required future gates:

- Explicit Foundation/Supabase approval.
- Redacted staging target confirmation.
- Current-shell confirmations for staging metadata write and cleanup.
- Evidence redaction before commit.
- Stop on target ambiguity, schema mismatch, secret exposure, production-risk signal, or cleanup failure.

Forbidden:

- Production Supabase.
- Remote SQL unless separately approved for the specific staging target.
- Migration deployment.
- Secrets, service-role keys, provider keys, signed URLs, raw media/audio/frame/transcript/model payloads, private artifact contents, raw prompts, and user PII.
- Route, worker, sidecar, tool, provider, media, OCR, VLM, model, Docker, Cloud, GCP/IAM, beta, production, public output, broad media, arbitrary media, or Track A execution.
