# Prompt 26D - RLS No-Policy Table Classification and Policy Contract

## Summary

Implement Prompt 26D from a clean sibling worktree based on `origin/codex/rp-foundation-26c-supabase-advisor-draft-remediation-packet`.

- Branch: `codex/rp-foundation-26d-rls-no-policy-table-classification-contract`
- PR: [#207](https://github.com/yuzastudio6-cyber/Reedkt/pull/207)
- PR title: `[foundation] Prompt 26D RLS no-policy table classification contract`
- Capability enabled: none; RLS no-policy classification contract only.
- Supabase update required: docs/status only.
- Supabase update status: docs_only.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.

## Purpose

Prompt 26D classifies the six connected Supabase advisor RLS-enabled/no-policy tables and defines future access models, policy intent, test requirements, migration-readiness gates, and workstream handoff notes.

## Tables

- `activation_artifacts`: `backend_service_role_only`
- `activation_qa_gates`: `backend_service_role_only`
- `activation_runs`: `backend_service_role_only`
- `feature_gates`: `no_client_access`
- `readiness_snapshots`: `backend_service_role_only`
- `tool_capabilities`: `no_client_access`

## Deliverables

- `docs/supabase-rls-no-policy-table-classification.md`
- `docs/supabase-rls-no-policy-access-model-contract.md`
- `docs/supabase-rls-no-policy-table-policy-contract.md`
- `docs/supabase-rls-no-policy-test-contract.md`
- `docs/supabase-rls-no-policy-handoff-notes.md`
- `docs/supabase-rls-no-policy-migration-readiness-checklist.md`
- `docs/prompt-26d-validation-results.md`
- `scripts/validation/supabase-rls-no-policy-classification-diagnostics.mjs`

## Boundaries

Prompt 26D must not create active RLS policies, active SQL migrations, executable SQL files, grants, function changes, indexes, Supabase lifecycle commands, Supabase API calls, Google Cloud calls, Secret Manager calls, provider/tool/worker/render/media/storage/credit/Stripe execution, human approval grants, staging execution approval, production readiness, or beta unlock.

## Validation

Required local validation includes diff checks, `npm ci`, lint, server typecheck, foundation validation, the new no-policy classification diagnostic, existing Prompt 21-26C diagnostics, local Supabase toolchain probe/preflight, and RLS list/dry-run only.

## Next Prompt

Prompt 26E - RLS No-Policy Draft Migration Plan.
