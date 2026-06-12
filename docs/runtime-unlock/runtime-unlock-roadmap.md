# Runtime Unlock Roadmap

Phase 53A defines how blocked execution scopes become owner-owned unlock tracks.

Official ladder:

1. `blocked`
2. `owner_accepted`
3. `repo_audit_passed`
4. `dry_run_passed`
5. `generated_local_fixture_passed`
6. `staging_fixture_passed`
7. `controlled_private_sample_passed`
8. `internal_beta_candidate`
9. `external_beta_candidate`
10. `production_candidate`

No scope may skip stages without an explicit later policy and QA gate.

Phase 53A does not execute tools, workers, models, providers, media processing,
web search, browser capture, map rendering, Docker, Cloud Run, SQL migrations,
schema/RLS changes, production, external beta, paid production, or broad media.

GCS remains the private artifact store. Supabase stores only milestone metadata
and private `gs://` references through the Phase 51D milestone sync path.

## Provider Gateway Models

PROVIDER-0 reaches `repo_audit_passed` for DeepSeek/Qwen Provider Gateway model
planning. PROVIDER-1 is still policy-only: it approves model/API, secret, data,
cost, routing, storage, and next-phase fixture policy but does not advance
DeepSeek or Qwen to live runtime. PROVIDER-2 may add fixture adapters and
normalizers only. Live validation requires a later explicit phase with budget,
secret-reference, data, QA, and owner gates.
