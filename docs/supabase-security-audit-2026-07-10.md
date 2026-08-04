# Supabase Static Security Audit — 2026-07-10

Status: `blocked_by_security_findings`

Scope: repository migration sources only

Remote Supabase state: **not verified**

## Executive Result

ReeditPro must not treat the raw `supabase/migrations/` directory or any unknown deployed database as production-secure.

The new audit is intentionally non-mutating:

```bash
npm run audit:supabase-security
npm run smoke:supabase-security
```

It does not run SQL, invoke the Supabase CLI, read environment secrets, connect to a database, or change remote state. The normal audit command prints a JSON report. A future guarded workflow may use `--require-secure`, which intentionally exits non-zero because a static source scan cannot certify a production database.

Current source result:

| Check | Result |
| --- | --- |
| Migration files scanned | 25 |
| Unique public tables found | 175 |
| Tables with explicit RLS enablement | 175 / 175 |
| Literal active policies parsed | 360 |
| Public views | 7 |
| Views with `security_invoker = true` | 7 / 7 |
| SECURITY DEFINER functions parsed | 10 |
| Definer functions with unsafe/implicit search path | 0 |
| Critical findings | 1 |
| High findings | 2 |

The policy count covers literal `CREATE POLICY` statements after ordered `DROP POLICY` resolution. StoryTiming creates its read policies in a reviewed dynamic block, so those policies are not included in the literal count; explicit RLS statements and the dedicated StoryTiming smoke cover that source separately.

## The Gmail Report

The email correctly pointed at a security-sensitive area, but its exact repository claim and suggested policy are incomplete.

- `public.master_timing_maps` is created in `202605190002_storytiming_master_tables.sql` with `workspace_id` and `project_id`; it does **not** have a `user_id` column.
- The original migration enabled RLS through dynamic SQL, which a simple line-oriented scanner could miss.
- The current source also contains explicit `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` statements for `master_timing_maps` and all ten related StoryTiming tables.
- StoryTiming access is workspace/project based, not `auth.uid() = user_id` based. Applying the sender’s SQL literally would fail or encode the wrong ownership model.
- None of this proves what is deployed remotely. A remote table could still differ from the working tree.

Therefore:

1. Do not paste the email’s SQL into Supabase.
2. Do not reply with repository or infrastructure details.
3. Treat the report as a useful prompt for a full review, not as proof of exploitation.
4. Verify the future canonical schema locally, then staging, then through live catalog inspection and Supabase Security Advisor before production.

## Ordered-State Analysis

The scanner processes migration files and statements in filename/source order. It resolves effective state for:

- literal `CREATE POLICY` and later `DROP POLICY`;
- table `GRANT` and later `REVOKE` operations;
- replacement views;
- replacement function definitions;
- the latest bucket configuration declaration.

This matters because PostgreSQL permissive policies combine with OR. Adding a stricter policy does not fix an older permissive policy unless the old policy is dropped. Likewise, a later `REVOKE` must be recognized so the audit does not keep reporting already-neutralized grants.

The smoke suite proves both sides:

- an intentionally insecure fixture detects credit mutation, worker/control-plane mutation, lease-token reads, raw runtime-payload reads, unsafe definer functions, public function execution, insecure views, overlapping storage policies, unbound storage paths, missing upload constraints, tenant-binding gaps, and identity drift;
- a later hardening fixture proves exact `DROP POLICY`, `REVOKE`, secure function replacement, and security-invoker view replacement remove those effective findings.

## Source Hardening Now Recognized

In the currently ordered working-tree sources, the audit no longer reports:

- missing explicit RLS on `master_timing_maps` or any other discovered public table;
- authenticated mutation of service-owned credit tables;
- authenticated mutation of service-owned worker/provider/render/SFX tables;
- member reads of `worker_leases.lease_token`;
- member reads of raw `backend_runtime_messages` payloads;
- legacy flat-path storage policies active beside workspace/project policies;
- a workspace storage segment that is not compared with the project workspace;
- null file-size/MIME limits in the latest bucket declarations;
- views missing `security_invoker`;
- unsafe or implicit `search_path` values on effective `SECURITY DEFINER` functions;
- missing explicit PUBLIC execution revocations for definer functions.

Pure append-only and snapshot-immutability trigger guards now run as
`SECURITY INVOKER` functions with an empty search path. The remaining definer
helpers use fully qualified objects and an empty search path. Their execution
grants are explicit. This removes avoidable function-privilege findings from
the static source report; it does not prove the functions installed in any
remote database match this working tree.

These are **source-level observations only**. They do not assert that a deployed database received those changes.

## Remaining Blocking Findings

### 1. Critical — parallel migration foundations

The `20260513` and `20260518` families define 15 overlapping tables with incompatible contracts, while later migrations depend on unique tables from both families. The effective schema and security policy set cannot be proven from this raw directory.

Required action: build an isolated canonical migration chain and preserve any applied history through explicit upgrade migrations. See `docs/supabase-migration-baseline-reconciliation.md`.

### 2. High — identity contract drift

The migration sources contain both `profiles` and legacy `user_profiles` ownership models. They also mix direct `auth.users` IDs with legacy ownership fields.

Required action: choose one profile/workspace/project identity contract in the canonical chain, then migrate any applied data deliberately.

### 3. High — workspace/project IDs are not structurally bound

Many source tables carry both `workspace_id` and `project_id` as independent foreign keys. Policies that check the two IDs independently can be vulnerable to a mismatched row: a caller-controlled workspace combined with a project from another workspace.

Required action: use a unique `(id, workspace_id)` project key plus composite foreign keys, derive workspace identity from the project, or enforce the relationship through a reviewed trusted trigger. Prove the denial with two users across two workspaces.

## What This Gate Does Not Prove

Even after all static findings are resolved, production remains blocked until ReeditPro has evidence for:

- one canonical chain completing a clean local reset;
- two-user/two-workspace RLS tests for read and write paths;
- service-only credit, worker, provider, render, export, QA, SFX, lease, and runtime-message writes;
- sanitized status views that exclude secrets and raw payloads;
- approved snapshot, audit, and credit-ledger immutability;
- storage path, MIME, size, signed URL, and private-bucket tests;
- live `pg_catalog` grants/policies/functions comparison in staging;
- Supabase Security Advisor and Performance Advisor review;
- backup/PITR, MFA, service-role secret handling, and operational access review.

## Safe Next Sequence

1. Keep the raw migration baseline blocked.
2. Finish the canonical identity/workspace/project contract.
3. Port current-product tables into an isolated canonical chain.
4. Encode service-only tables explicitly rather than relying on “no policy” as undocumented behavior.
5. Add composite tenant bindings.
6. Keep the definer-function and execution-grant checks green as tables are ported.
7. Run a disposable local reset only after the baseline audit reports reproducible.
8. Run two-user/two-workspace and storage security tests locally and in staging.
9. Inspect the live catalog and Supabase advisors.
10. Obtain explicit production migration approval.

## Evidence Boundary

This audit proves only that the repository can detect and report source-level security blockers and can recognize later literal hardening statements. It does not prove that an email sender is trustworthy, that a vulnerability was exploited, that a remote database is configured safely, or that ReeditPro is ready for external beta or production.
