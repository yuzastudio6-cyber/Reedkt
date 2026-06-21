# Tool-Calling Repo Refresh Gate Policy v1

## Purpose

Every future Reeditpro tool-calling milestone must refresh repo context and check for duplicate implementation risk before changing code. The tool-calling brain is an overlay on the existing production registry, worker router, QA policy, fallback policy, runtime contracts, and Supabase/runtime table design.

## Required Preflight

Run before implementation:

- `git status --short`
- `git branch --show-current`
- `git log --oneline -5`
- `git diff --name-only`
- `git diff --cached --name-only`
- `npm run tool-calling:refresh-gate`

When network and permissions make it safe, also run:

- `REEDITPRO_REFRESH_GATE_ALLOW_FETCH=1 npm run tool-calling:refresh-gate`

The refresh gate may run `git fetch --all --prune` only when `REEDITPRO_REFRESH_GATE_ALLOW_FETCH=1` is set. Future tool-calling milestones must also run `npm run tool-calling:unmerged-owner-evidence` so open owner PRs are considered candidate evidence and duplicate-risk signals when GitHub access is available.

## Stack And Base Checks

The preflight must identify:

- current branch
- upstream branch, if configured
- PR base branch, if available
- whether the branch is stacked on another tool-calling PR
- whether the branch is stale against upstream when computable

## Paths To Scan

The gate must inspect changed or staged paths under:

- `server/tool-calling/**`
- `docs/tool-calling/**`
- `server/tool-registry/**`
- `server/workers/production/**`
- `src/backend/contracts/production-tool-runtime-contracts.ts`
- `database/migration-drafts/**`
- `database/test-sql/**`
- `docs/open-source-tool-stack/**`
- `docs/track-a/**`
- `docs/cross-chat/**`
- `package.json`
- `package-lock.json`

## Duplicate Risk Categories

- `duplicate_tool_study_card`
- `duplicate_runtime_tool_id`
- `duplicate_alias`
- `duplicate_adapter`
- `duplicate_worker_route`
- `duplicate_qa_policy`
- `duplicate_fallback_policy`
- `duplicate_supabase_table`
- `duplicate_migration`
- `duplicate_diagnostics_script`
- `stale_base_branch`
- `package_lock_mutation_risk`
- `pending_external_tool_now_first_class`
- `unmerged_owner_pr_duplicate_risk`
- `owner_work_wait_for_merge`

## Stop And Continue Rules

Continue only when no duplicated implementation is found, a duplicate is explicitly a safe alias or overlay, or the milestone reuses the existing implementation instead of duplicating it.

Stop and report when:

- another branch already added the same adapter, capability, registry entry, or study card
- a pending external tool has become a first-class `ProductionToolId` and the branch still treats it as pending
- another PR changed the worker router for the same operation
- another PR added a Supabase table or migration for the same runtime concept
- `package-lock.json` is staged or unintentionally changed
- the base branch changed in a way that invalidates capability-card or ranking assumptions
- an open owner PR is already implementing install proof, runtime proof, Docker requirements, worker routing, Supabase/runtime tables, or capability metadata for the same tool/capability

## Source Priority

Runtime selected tools:

1. `server/tool-registry` `ProductionToolId` and `ProductionToolProfile`
2. explicit `docs/tool-calling/studies` card overlay
3. runtime alias resolution
4. pending external report only, never pipeline `selectedToolId`

Execution:

1. existing worker router and adapters, if present
2. do not add a second router

QA:

1. `server/tool-registry/tool-qa-policy.ts`
2. study cards may add context but must not duplicate QA policy source

Fallback:

1. `server/tool-registry/tool-fallback-policy.ts`
2. study cards may reference fallback IDs but must not create a second fallback policy engine

Supabase:

1. existing runtime contract or migration draft tables
2. do not create overlapping tables without a reconciliation report
