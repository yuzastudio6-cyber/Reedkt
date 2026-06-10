# PROVIDER-0 Provider Gateway Models Repo Audit Results

Status: planned / static report ready

Branch: `codex/rp-provider-0-provider-gateway-models-repo-audit`

Base: `codex/rp-activation-53a-runtime-unlock-roadmap-owner-acceptance-audit`

Run ID: static report uses deterministic `provider0-20260610T000000`

## Summary

PROVIDER-0 adds a repository-audit/report-only activation phase for future
DeepSeek V4-Pro/V4-Flash and Qwen3.7-Max Provider Gateway planning. It encodes
official evidence, model-name decisions, data policy, cost policy, secret
policy, execution policy, a phase roadmap, blocker status, and Supabase
milestone-sync status without making provider calls.

## Decisions

- Qwen target: internal `qwen_3_7_max`, provider model ID `qwen3.7-max`.
- Qwen snapshots: `qwen3.7-max-2026-06-08` and `qwen3.7-max-2026-05-20`.
- DeepSeek coding target: internal `deepseek_v4_pro`, provider model ID
  `deepseek-v4-pro`.
- DeepSeek cheaper fallback: internal `deepseek_v4_flash`, provider model ID
  `deepseek-v4-flash`.
- DeepSeek cannot directly execute code.
- Qwen cannot directly execute workers or tools.
- Provider tool calls are model output only and must be converted into
  validated candidate approved-plan snapshots before any future runtime can act.

## Supabase Update Classification

- Supabase update required: milestone sync only if guarded execution is
  explicitly confirmed.
- Supabase update status: static report planned; not attempted.
- Supabase milestone sync status: not attempted in PROVIDER-0 static validation.
- SQL executed: false.
- Migration deployed: false.
- Schema/RLS/Data API changes: false.

## Validation

Passed:

- `npm run smoke:activation-provider-gateway-models-audit`
- `npm run activation:provider-gateway-models-audit:report`
- `npm run activation:provider-gateway-models-audit:iam-plan`
- `npm run activation:provider-gateway-models:summary`
- `npm run activation:runtime-unlock-roadmap:report`
- `npm run activation:supabase-milestone-sync:report`
- `npm run prod:readiness:summary`
- `npm run prod:beta:summary`
- `npm run lint`
- `npm run build`
- `git diff --check`

Blocked by inherited local environment/base dependency state:

- `npm ci` failed before validation because the base lockfile expects
  `@emnapi/wasi-threads@1.2.1` while the available package resolution requires
  `1.2.2` and related `@emnapi` packages are missing from the lockfile.
- `npm run build:server` failed in existing Phase 49/50 modules because the
  available local `node_modules` lacks `sharp`, `jsdom`,
  `@mozilla/readability`, and `@turf/turf`, and those existing modules still
  surface strict server typecheck sanitizer errors. PROVIDER-0 did not modify
  those modules.

## Blocked Scope

No DeepSeek calls, Qwen calls, API keys, provider secret values, model
inference, tool execution, worker execution, media processing, web search,
browser capture, map rendering, Docker, Cloud Run, Supabase schema/RLS changes,
production, external beta, paid production, broad media, public artifacts, raw
prompt execution, or signed URLs as source of truth are enabled.

## Next Phase

PROVIDER-1 is ready only for provider registry and secret metadata fixtures:
disabled provider records, metadata-only Secret Manager checks, and no provider
calls or secret values.
