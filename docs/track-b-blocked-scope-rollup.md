# Track B Blocked Scope Rollup

Phase 44P preserves all Track B blocked scopes.

Blocked globally:

- Supabase remote SQL, staging SQL, production SQL, migration deployment, and Supabase backfill writes in Phase 44P.
- Live route execution, worker execution, sidecar execution, tool execution, and raw chat execution.
- Media, audio, OCR, VLM, model, provider, Docker, Cloud, GCP, IAM, and GPU runtime work.
- Public artifacts, public output, signed URLs as source of truth, broad media, arbitrary media, committed private payloads, and secrets.
- Product-wide internal beta, external beta, paid production, production, and Track A.

Tool-family blockers:

- Demucs remains blocked pending training-data/model-artifact provenance and human/legal review.
- Qwen3-VL and vLLM remain excluded while Phase 39C keeps generated VLM runtime blocked.
- DuckDB/Polars metadata route dry-runs remain dry-runs only; DuckDB/Polars runtime execution is not approved by Phase 44P.
- Future Supabase milestone backfill must be approved separately by the Foundation/Supabase lane.
