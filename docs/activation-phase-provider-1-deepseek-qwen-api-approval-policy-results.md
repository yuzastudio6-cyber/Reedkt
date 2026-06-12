# PROVIDER-1 DeepSeek/Qwen API Approval Policy Results

Status: planned / static report ready

Branch: `codex/rp-provider-1-deepseek-qwen-api-approval-policy`

Base: `codex/rp-provider-0-provider-gateway-models-repo-audit`

Run ID: static report uses deterministic `provider1-20260612T000000`

## Summary

PROVIDER-1 adds a policy-only Provider Gateway approval phase for DeepSeek
V4-Pro/V4-Flash and Qwen3.7-Max. It records official model facts, role
approvals, secret reference policy, data policy, cost policy, routing policy,
storage policy, risk register, cross-chat ownership, and the PROVIDER-2 through
PROVIDER-6 roadmap without making provider calls.

## Decisions

- DeepSeek V4-Pro is approved only as a coding/spec/tool-implementation
  proposal specialist.
- DeepSeek V4-Flash is recorded as a future cheaper/simple coding fallback
  candidate.
- Qwen3.7-Max is approved only as a head editing/planning/decision agent
  candidate.
- Provider key payloads stay in Google Secret Manager only; PROVIDER-1 records
  reference names only.
- PROVIDER-1 budget is zero and provider calls remain blocked.
- Workers continue to execute approved plan snapshots only.

## Supabase Update Classification

- Supabase update required: staging update candidate.
- Supabase update status: ready_for_staging_review until guarded milestone sync
  execution and readback complete.
- Supabase environment touched: staging only if guarded execution runs.
- SQL executed: false.
- Migration deployed: false.
- Schema/RLS/Data API changes: false.
- Next Supabase action: milestone sync only through Phase 51D contract; no
  schema/RLS changes.

## Blocked Scope

No DeepSeek calls, Qwen calls, API keys, provider secret values, model
inference, tool execution, worker execution, media processing, web search,
browser capture, map rendering, Docker, Cloud Run, Supabase schema/RLS changes,
production, external beta, paid production, broad media, public artifacts, raw
prompt execution, or signed URLs as source of truth are enabled.

## Next Phase

PROVIDER-2 is ready only for provider fixture adapters and normalizers if
PROVIDER-1 QA passes. Real provider calls remain blocked until later controlled
live validation phases.
