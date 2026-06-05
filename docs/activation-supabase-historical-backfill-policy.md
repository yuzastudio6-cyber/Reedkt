# Phase 51C Supabase Historical Backfill Policy

Supabase is the structured activation/readiness ledger. GCS remains the private artifact store and source for full private JSON/media artifacts.

Allowed in Phase 51C:

- read canonical committed docs/constants and private `gs://` artifact references
- resolve backend-only Supabase credentials only during confirmed execution
- write only to `activation_runs`, `activation_artifacts`, `activation_qa_gates`, `readiness_snapshots`, `tool_capabilities`, and `feature_gates`
- idempotently upsert historical milestone bundles
- upload private Phase 51C JSON artifacts to staging GCS

Blocked in Phase 51C:

- migrations, schema mutation, RLS mutation, SQL outside the milestone registry writer, and Supabase lifecycle commands
- public artifact URLs or signed URLs as source of truth
- raw Brave responses, Brave snippets, provider headers, API keys, database URLs, service-role values, and large blobs in Supabase
- media processing, web search, browser capture, map rendering, AI/model/runtime jobs, providers, Docker, deployment, production, external beta, paid production, and broad media

P0 backfill phases are `45F`, `49P`, `49N`, `50F`, `50G`, `51A`, and `51B`. Optional P1 fixture/readiness phases may be skipped with a recorded reason.
