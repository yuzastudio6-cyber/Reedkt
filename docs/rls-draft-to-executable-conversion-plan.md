# RLS Draft To Executable Conversion Plan

Prompt 19 keeps all draft SQL draft-only. This plan defines how a future prompt may convert a draft into an executable local/staging test.

## Conversion Principles

- Convert one domain at a time, starting with auth/workspace/project.
- Use only canonical tables from the latest schema contract and manifest.
- Use no production data and no remote Supabase.
- Use a synthetic fixture for every user, workspace, project, storage object, job, provider, tool, render, QA, compliance, and observability record.
- Keep destructive checks separate from read-only checks.
- Record every blocker rather than editing policies during the validation run.

## Required Header

Every executable candidate must start with comments stating:

- Local/staging validation only.
- `production_never`.
- No production data.
- No remote Supabase.
- No credentials, secrets, provider keys, service-role keys, signed URLs, Stripe keys, or private media.
- The branch and prompt that authorized conversion.
- Required cleanup and evidence.

## Transaction And Cleanup Rules

- Prefer a `transaction` wrapper for tests that can safely roll back.
- If the test depends on append-only or immutable behavior, document why rollback is not enough.
- Include explicit `cleanup` instructions for synthetic fixtures.
- Use disposable local database reset for destructive tests when policy intentionally blocks deletion.
- Never depend on existing user/customer/project data.

## Role Simulation And `auth.uid()`

Future executable tests must define how the Supabase local harness simulates:

- Anonymous role.
- Authenticated member role.
- Authenticated non-member role.
- Backend/service-role-only paths.
- `auth.uid()` values for each synthetic auth user.

If role simulation is unclear, the file remains draft-only.

## Safe Fixture Seeding

Seed users, profiles, workspaces, workspace_members, and projects first. Domain tests may add storage records, approved snapshots, credit reservations, job records, media records, render/QA rows, tool/provider records, compliance records, or observability records only when the canonical schema target is confirmed.

## Allow/Deny Assertions

Each executable test must assert:

- Member read access succeeds only for scoped rows.
- Non-member access returns no rows or policy denial.
- Normal users cannot write backend-owned tables.
- Service-role/backend-only mutation paths are not exposed to normal users.
- Rows cannot cross workspace/project scope.
- JSON fields do not accept signed URLs, provider keys, service-role data, or raw credentials as source-of-truth values.

## Forbidden Commands And Actions

Executable SQL conversion must not include:

- Production SQL.
- Remote Supabase commands.
- Schema-changing migration statements.
- Provider calls.
- Tool execution.
- Worker execution.
- Render/export execution.
- Media processing.
- Storage transfer.
- Credit mutation outside the explicit local fixture case.
- Stripe/payment behavior.

## File Naming

- Keep `.draft.sql` for planning-only tests.
- Use `.sql` only after the review checklist passes.
- Keep destructive variants clearly named with `_destructive_local_only` if they require a disposable local reset.

## Review Checklist

- Canonical table targets verified.
- Fixture IDs are synthetic and resettable.
- No production data rule is explicit.
- No remote Supabase rule is explicit.
- Transaction or cleanup plan is explicit.
- Role simulation and `auth.uid()` are explicit.
- Expected allow/deny assertions are clear.
- Evidence capture is defined.
- Reviewer confirms the file can be run locally.

## When A Test Remains Draft-Only

A test remains draft-only if canonical schema is unresolved, fixtures are not designed, role simulation is unclear, cleanup is unsafe, local Supabase is unavailable, staging approval is missing, or the test would imply production/beta readiness.
