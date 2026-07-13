# Internal Testing Durable Auth Project Session Backend Persistence Plan

## Decision

`internal_testing_durable_auth_project_session_backend_persistence_plan_passed_ready_for_mock_safe_backend_skeleton`

## Summary

This milestone defines the next server-side persistence gate for Project Home, Edit Chat, and Edit Brief. It keeps the current UI mock/internal route access usable for repeated local testing, but it names the exact backend contract required before ReEditPro can claim durable authenticated project/session access.

The next implementation should be a mock-safe backend skeleton, not a live Supabase migration. It should prove request shape, access decisions, idempotency, audit metadata, and fail-closed behavior before any table-backed reads/writes are enabled.

## Source Audit

- Base branch: `codex/reeditpro-web-ui-shell`.
- Source SHA at branch creation: `024aef4f184afbfa7fe6e6715d27ac506ea37c1c`.
- Predecessor evidence: PR #2434 added route-visible project/session access policy and kept durable access blocked by default.
- Repo evidence read: `edit-planning-database-architecture.md`, `approved-plan-snapshot-policy.md`, `supabase-schema-planning-bridge.md`, `database-migration-readiness-checklist.md`, `supabase-table-specification.md`, `supabase-rls-policy-draft.md`, `migration-review-and-rls-hardening.md`, `rls-hardening-matrix.md`, and `data-privacy-retention-plan.md`.
- Supabase evidence read: changelog entry for tables not being automatically exposed to the Data API and the current “Securing your API” guide.

## Durable Access Contract

Durable route access requires all of the following before it can pass:

- `signed_in_auth_user_verified_server_side`
- `workspace_membership_verified_by_workspace_members`
- `project_membership_verified_by_projects_workspace_id`
- `edit_session_access_verified_by_project_id`
- `rls_policies_verified_for_authenticated_role`
- `explicit_data_api_grants_verified_for_authenticated_role`
- `service_role_confined_to_trusted_backend_worker_context`
- `audit_idempotency_and_rate_limit_envelope_defined`

The access chain is:

1. Server verifies the signed-in Supabase Auth user.
2. Server checks `workspace_members.user_id`.
3. Server checks `projects.workspace_id`.
4. Server checks `edit_sessions.project_id`.
5. RLS policies and explicit Data API grants are verified together.
6. Backend returns a durable access decision with audit and idempotency metadata.

## Planned Tables

The backend skeleton should model access around these existing planned tables:

- `profiles`
- `workspaces`
- `workspace_members`
- `projects`
- `edit_sessions`
- `audit_events`

The first skeleton may remain mock-only, but the contract must match these table names and relationships so the later migration has fewer seams to repair.

## Route Contract

| Surface | Route | Future access check |
| --- | --- | --- |
| Project Home | `/projects/:projectId` | `projectId -> projects.workspace_id -> workspace_members.user_id` |
| Edit Chat | `/projects/:projectId/edits/:editSessionId/chat` | `editSessionId -> edit_sessions.project_id -> projects.workspace_id -> workspace_members.user_id` |
| Edit Brief | `/projects/:projectId/edits/:editSessionId/brief` | `editSessionId -> edit_sessions.project_id -> projects.workspace_id -> workspace_members.user_id` |

## Supabase Boundary

The Supabase API has two required layers for table-backed route access:

- explicit grants decide whether a role can reach a table, view, or function through the Data API;
- RLS decides which rows are visible or mutable after that role has object access.

This milestone does not grant anything, enable RLS, run SQL, add migrations, create Storage buckets, or read/write Supabase tables. It records the gate so the later backend skeleton and migration work cannot claim durable access from Auth session presence alone.

## Hard Security Rules

- Authorize from server-verified Supabase Auth user id, never raw `user_metadata`.
- Scope every project and edit session through `workspace_members`.
- Require explicit Data API grants and RLS together before table-backed access is considered ready.
- Keep service-role credentials out of browser bundles and frontend-safe helpers.
- Record backend access decisions with idempotency, audit, and rate-limit metadata before durable writes.
- Preserve approved snapshot and credit reservation gates before any expensive work can start.

## Boundaries

- No Supabase migration, SQL, table read/write, Storage, signed URL, or policy mutation.
- No service-role/admin client in browser or frontend helpers.
- No profile/workspace bootstrap writes.
- No provider/model calls, worker dispatch, media processing, render/export, credit spend, ledger writes, Stripe, external beta, paid production, or product-ready claim.

## Validation

- `npm run smoke:internal-testing-durable-auth-project-session-backend-persistence-plan`
- `npm run smoke:internal-testing-auth-project-session-membership-policy`
- `npm run smoke:internal-testing-auth-project-access-readiness`
- `npm run smoke:internal-testing-qa-wrapper`
- `npm run qa:internal-testing`
- `npm run smoke:worker`
- `npm run smoke:prod-cost-controls`
- `npm run smoke:prod-runtime-contracts`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Current Local/Private Follow-up

The mock-safe backend skeleton described by this historical plan now has a
production-shaped single-host persistence implementation for the explicit
local/internal runtime. `project-service.ts` and
`internal-edit-state-service.ts` authorize workspace/project scope before
loading their existing user/workspace-hashed V2 records. Both stores preserve
their checksummed JSON envelopes while using the shared private persistence
boundary for atomic writes, no-follow reads, restrictive modes, and safe
registry listing. Direct target and parent symlink attacks are covered by
`npm run smoke:project-state-tenancy`.

This does not satisfy the plan's Supabase, RLS, explicit grant, distributed
transaction, audit-retention, backup, or deployed revocation gates.

## Next

The next safe milestone is a mock-safe durable project/session backend skeleton. It should add server route/repository boundaries that can evaluate mock access decisions, fail closed when live Supabase persistence is requested without migration/RLS/grant evidence, and preserve the browser/service-role boundary.
