# Internal Tester Google Auth Readback

## Decision

`google_first_same_sha_auth_profile_workspace_readback_source_ready_remote_read_not_run`

## Purpose

After the guarded profile/workspace provisioning step, this backend-only readback verifies the exact protected staging tester without signing in as that user. A pass requires:

- an existing Supabase Auth user for the protected email;
- Google provider identity, confirmed email, and a valid prior Auth `last_sign_in_at` timestamp;
- one profile row matching the deployed workspace ownership contract;
- one tester-owned workspace and an `owner` membership linking that same tester and workspace.

The workflow is read-only. It performs no insert, upsert, update, delete, RPC, Auth invitation, or Auth-user creation.

Supabase's Admin user record does not attribute `last_sign_in_at` to a specific provider. This readback therefore reports Google identity and prior Auth sign-in as separate facts; the owner-interactive browser verifier is what must prove the live session itself used Google.

## Operator Flow

1. Run **Internal Tester Google Profile Workspace Provisioning** for the exact reviewed SHA and the hash emitted by the owner-interactive verifier.
2. Run **Internal Tester Google Auth Readback** from that same branch and SHA with the same hash.
3. Require decision `internal_tester_sign_in_auth_readback_passed_ready_for_browser_sign_in_test`.
4. Rerun the owner-local `npm run internal-testing:verify-interactive-google-session` command.
5. Require a 2xx `GET /v1/projects` response from the exact activation-evidence gateway, followed by successful sign-out and protected-route denial.

## Confidentiality

The raw tester email and service-role key remain protected `staging` environment secrets. Workflow inputs contain only the 16-character email hash. The CLI first detects whether deployed workspaces own direct Auth users or legacy profile users, then requires the matching profile shape. The legacy `owner_user_id` contract takes precedence when present because that table may also carry a later backfilled `owner_id`; direct Auth ownership is selected only when the legacy column is absent. Workspace membership readback accepts either a legacy surrogate `workspace_members.id` or the canonical `(workspace_id, user_id)` composite identity, but always revalidates the exact owner role and tenant scope. It emits hashed user/profile/workspace/membership identities, the membership identity-contract label, identity booleans, that bounded schema shape, and membership role. It does not print the raw email, raw IDs, last-sign-in timestamp, password, token, invite link, signed URL, or service-role value.

## Evidence Boundary

This readback is a controlled staging prerequisite, not a canonical schema or RLS certification. The raw migration chain remains blocked, no two-user isolation test has passed, and no live signed-in gateway journey is complete until the owner-interactive verifier succeeds afterward.

## Current State

The source workflow is prepared on `codex/backend-workflow-pipeline-continuation`. It has not been pushed or dispatched, and no remote Supabase read occurred in this slice.

## Blocked Scope

No Supabase write/migration, Auth mutation, Storage action, upload, provider call, tool/worker execution, render/export, credit/wallet mutation, Stripe/customer billing, public delivery, external beta, or production action is authorized.

## Next Gate

`OWNER_INTERACTIVE_GOOGLE_SESSION_WITH_PRIVATE_GATEWAY_PROJECTS_READBACK`
