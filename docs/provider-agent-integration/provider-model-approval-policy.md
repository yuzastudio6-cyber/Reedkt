# PROVIDER-1 Provider Model Approval Policy

PROVIDER-1 approves the policy and integration contract for adding DeepSeek
V4-Pro/V4-Flash and Qwen3.7-Max through Provider Gateway only.

This phase is policy-only. It does not call DeepSeek, Qwen, or any provider. It
does not create or read provider secrets, execute models, execute tools or
workers, process media, run web search/browser capture/map rendering, deploy
Docker or Cloud Run, run SQL, change Supabase schema/RLS, create public
artifacts, unlock production/external beta/broad media, execute raw prompts, or
treat signed URLs as source of truth.

Approved records:

- `deepseek-v4-pro`: coding/spec/tool-implementation proposal specialist.
- `deepseek-v4-flash`: cheaper/simple coding fallback candidate for a later
  phase.
- `qwen3.7-max`: head editing/planning/decision agent candidate.
- `qwen3.7-max-2026-06-08` and `qwen3.7-max-2026-05-20`: Qwen snapshot
  candidates.

All future runtime work must remain behind Provider Gateway, credit/approval
gates, approved plan snapshots, cost controls, QA, and owner workstream
validation.
