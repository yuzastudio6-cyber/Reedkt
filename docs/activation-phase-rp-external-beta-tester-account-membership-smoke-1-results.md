# RP External Beta Tester Account Membership Smoke 1 Results

Current decision: `completed_external_beta_tester_account_membership_and_authenticated_smoke`

Execution: `completed_guarded_external_beta_tester_account_membership_and_authenticated_smoke`

Integration base: `27308ae7d628028f3ce743c81e1e26d7450fb748`

Runner: `scripts/validation/rp-external-beta-tester-account-membership-smoke-1.mjs`

Package script: `rp-external-beta-tester-account-membership-smoke-1`

Confirmation gate: `REEDITPRO_CONFIRM_EXTERNAL_BETA_TESTER_ACCOUNT_SMOKE`

Tester email gate: `REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL`

Confirmed smoke execution in this packet: `completed`

Run ID: `2026-06-27T15-05-37-588Z-5b451f5c`

Generated fixture: `/tmp/reeditpro-rp-external-beta-tester-account-membership-smoke-1/2026-06-27T15-05-37-588Z-5b451f5c`

Artifacts/checksums:

- `tester-account-membership-smoke-report.json`: `2398` bytes, SHA-256 `f6611d7c0ed9fb4693e44fa3ebade02d107ed539319cc7aebf63555bd12446ca`
- `artifact-manifest.json`: `438` bytes, SHA-256 `35cb90ef7935109a9b1d90d9bd7bf2308e8f87a8b314e7ac21cdcfbe21dd2b40`

Smoke result:

- unauthenticated `/health`: `blocked_403`
- authenticated tester `/health`: `passed_200`
- authenticated tester `/ready`: `passed_200`
- authenticated tester `/api/runtime/status`: `passed_200`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Result

The guarded tester-account smoke runner completed successfully with `aiediting@reeditpro.com` as the owner-approved real tester account. The Cloud Run invoker binding remained scoped to `group:external-beta-testers@reeditpro.com`, and unauthenticated `/health` remained blocked.

The next operational step is an external product beta readiness rollup that carries forward this completed tester-account smoke.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, service-role route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, internal beta broad unlock, external beta broad audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, FFmpeg/FFprobe execution, Docker execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, group membership mutation, Cloud Run IAM mutation, Cloud Run service update, deployment, or broad service-role handler was enabled.
