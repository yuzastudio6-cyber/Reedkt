# Validation Results

Validation status: `passed`

## Commands

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run --silent rp-external-beta-tester-account-membership-smoke-1:diagnostics`
- `npm run --silent rp-external-beta-tester-account-membership-gate-readback-1:diagnostics`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`
- non-executing changed-file safety scan
- non-executing staged safety scan

## Result

Current decision: `completed_external_beta_tester_account_membership_and_authenticated_smoke`

Current execution: `completed_guarded_external_beta_tester_account_membership_and_authenticated_smoke`

Confirmed smoke execution in this packet: `completed`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Host-resource blocker: `none`

Confirmed tester smoke result: `completed_external_beta_tester_account_membership_and_authenticated_smoke`

Run ID: `2026-06-27T15-05-37-588Z-5b451f5c`

Generated fixture: `/tmp/reeditpro-rp-external-beta-tester-account-membership-smoke-1/2026-06-27T15-05-37-588Z-5b451f5c`

Artifacts/checksums:

- `tester-account-membership-smoke-report.json`: `2398` bytes, SHA-256 `f6611d7c0ed9fb4693e44fa3ebade02d107ed539319cc7aebf63555bd12446ca`
- `artifact-manifest.json`: `438` bytes, SHA-256 `35cb90ef7935109a9b1d90d9bd7bf2308e8f87a8b314e7ac21cdcfbe21dd2b40`
