# RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-GATE-READBACK-1 Source Audit

Packet: `RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-GATE-READBACK-1`

Decision: `blocked_pending_actual_external_tester_account_membership_and_tester_auth_smoke`

Execution: `completed_readonly_tester_membership_gate_readback_no_access_mutation`

Integration base: `4c7ad626f5c9385d44e09dbdeaa45e111a72bad0`

## Source Chain

- `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST` created owner-managed group `external-beta-testers@reeditpro.com` and granted only that group `roles/run.invoker` on staging service `reeditpro-staging-api`.
- `RP-EXTERNAL-BETA-OWNER-MEMBER-SMOKE-READBACK-1` proved the owner-member group path with `aiediting@reeditpro.com`, and recorded external tester member count `0`.
- `RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1` remains the next gated milestone, but only after a real external tester account is present in the group and a tester-authenticated smoke can be run.
- PR #577 remains open/draft/blocked/excluded and is not source-of-truth for this external beta gate.

## Current Live Readback

The latest read-only Cloud Identity group readback still shows only owner-member `aiediting@reeditpro.com` with roles `OWNER` and `MEMBER`.

The latest read-only Cloud Run IAM readback still shows only service-level member `group:external-beta-testers@reeditpro.com` for `roles/run.invoker`.

The latest read-only Cloud Run service readback shows staging service `reeditpro-staging-api` in `us-central1` is ready on revision `reeditpro-staging-api-00005-7gs`, with `100` percent traffic to that latest revision.

## Non-Inference Rule

No external tester identity is inferred from owner smoke, local `gcloud auth` accounts, project owner accounts, GitHub history, or historical migration authors. A tester-account smoke requires an actual named tester member in `external-beta-testers@reeditpro.com` and an authentication context for that same tester.

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`
