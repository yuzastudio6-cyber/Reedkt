# Supabase Migration Baseline Reconciliation

Status: `blocked_by_parallel_foundations`

Date: 2026-07-10

Repository: `/Volumes/backup/REeditpro`

## Outcome

The raw `supabase/migrations/` directory is not a reproducible reset or deployment source. No Supabase CLI command, SQL statement, database connection, or remote mutation was performed during this audit.

The executable directory currently contains 25 SQL files:

- eight `20260513` foundation migrations;
- eight `20260518` RP-DATA-04 foundation migrations;
- nine later migrations that depend on pieces of those foundations.

Four later files (`20260527` and the three `20260528` files) are currently untracked. Their presence still matters because the Supabase CLI reads files from the working directory, not only Git-tracked files.

## Proven Conflict

The two foundation families define 15 of the same tables with different column contracts:

- `chat_messages`
- `credit_estimates`
- `credit_ledger_entries`
- `credit_reservations`
- `edit_plan_segments`
- `generated_asset_versions`
- `generated_assets`
- `generation_events`
- `generation_requests`
- `media_assets`
- `projects`
- `qa_reports`
- `revision_requests`
- `workspace_members`
- `workspaces`

The `20260513` files create their tables first. The `20260518` files usually use `create table if not exists`, which skips—not reconciles—the later definition. Subsequent indexes, policies, foreign keys, functions, and application adapters can therefore expect columns that were never added.

Later migrations also prove that neither foundation can simply be deleted:

- later SQL references `20260513`-only tables such as `chat_sessions`, `edit_plans`, `credit_approvals`, `jobs`, `renders`, `story_beats`, and `user_profiles`;
- later SQL also references the `20260518`-only `approved_plan_snapshots` table.

This is a mixed dependency graph, not a clean additive history.

## Executable Audit

Run the non-mutating audit:

```bash
npm run audit:supabase-migration-baseline
```

Run its fixture and repository smoke coverage:

```bash
npm run smoke:supabase-migration-baseline
```

The audit supports `--require-reproducible` for a future guarded workflow. It intentionally returns a failure code in that mode while the baseline remains blocked.

## Current Safety Rule

Until this status becomes `reproducible`:

- do not run `supabase db reset` against the raw directory;
- do not run `supabase migration up`, `db push`, or a production apply from the raw directory;
- do not add a durable Edit Preferences table to this ambiguous chain;
- do not describe the eight `20260518` files as the entire active migration history;
- do not rewrite or delete possibly applied migration history to make the folder look clean.

## Canonical-Chain Strategy

The safe next migration milestone is an isolated canonical v2 chain, not an in-place history rewrite.

1. Choose one identity contract for `auth.users`, profiles, workspace membership, projects, and named edit sessions. The current backend adapters use the RP-DATA-04-style `profiles` and direct authenticated `workspace_members.user_id` contract, so that contract is the leading candidate.
2. Build a fresh canonical chain in an isolated review path.
3. Port only current-product tables first: profiles, workspaces, memberships, projects, edit sessions, upload/media records, preferences, plan versions, estimates, approvals, immutable snapshots, idempotency, and audit records.
4. Port execution/job/tool tables as an additive second layer.
5. Port legacy planning tables only after their consumers and ownership model are confirmed current.
6. Prove a clean local reset, RLS isolation, snapshot immutability, append-only audit/credit behavior, and private storage.
7. Add upgrade migrations for any already-applied environment; never edit applied history in place.

## Edit Preferences Gate

The current private/internal preference service remains honest single-host persistence. A Supabase-backed preference table and repository must wait until:

- the canonical chain is reproducible;
- the profile/workspace membership contract is fixed;
- preference RLS is reviewed;
- compare-and-swap semantics and audit fields are specified;
- a clean local reset and two-user isolation test pass.

## Evidence Boundary

This audit proves that the repository detects and reports the migration conflict. It does not prove a working Supabase schema, local reset, staging deployment, production RLS, remote persistence, or production readiness.
