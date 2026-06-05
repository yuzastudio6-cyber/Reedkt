# Prompt 26E - RLS No-Policy Draft Migration Plan

## Summary

Implement Prompt 26E from a clean sibling worktree based on `origin/codex/rp-foundation-26d-rls-no-policy-table-classification-contract`.

- Branch: `codex/rp-foundation-26e-rls-no-policy-draft-migration-plan`.
- PR title: `[foundation] Prompt 26E RLS no-policy draft migration plan`.
- PR: pending.
- Exact capability enabled: none; RLS no-policy draft migration plan only.

## Scope

Prompt 26E creates a draft RLS migration plan for the six Prompt 26D RLS-enabled/no-policy tables:

- `activation_artifacts`
- `activation_qa_gates`
- `activation_runs`
- `feature_gates`
- `readiness_snapshots`
- `tool_capabilities`

This is documentation, draft-only SQL Markdown, diagnostics, and tracking only.

## Boundaries

No Supabase mutation, SQL execution, active migration, policy creation, grant/revoke execution, function alteration, index creation, Supabase lifecycle command, Supabase API call, Google Cloud API call, Secret Manager API call, deployment, provider call, render/export, tool execution, worker execution, media processing, storage transfer, signed URL creation, credit mutation, Stripe action, telemetry, human approval grant, staging execution approval, production approval, or beta unlock is enabled.

## Validation

Required validation:

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-26d-rls-no-policy-table-classification-contract...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:rls-no-policy:draft-migration:diagnostics`
- Existing Prompt 21-26D diagnostics
- Local Supabase probe/preflight only
- RLS list-tests and dry-run only

## Next Prompt

Prompt 26E-1 - RLS No-Policy Local Draft Migration Implementation, or Prompt 26F - Function Search Path Hardening Migration Plan.
