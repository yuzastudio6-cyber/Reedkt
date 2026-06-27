# RP-EXTERNAL-BETA-CONTROLLED-TESTER-UI-FLOW-SMOKE-1

## Summary

Use the owner-approved tester account `aiediting@reeditpro.com` to validate the controlled external beta browser/UI lane after `RP-EXTERNAL-BETA-CONTROLLED-TESTER-PRODUCT-FLOW-SMOKE-1`.

## Required Boundaries

- Keep Cloud Run access scoped to `group:external-beta-testers@reeditpro.com`.
- Do not grant `allUsers`, `allAuthenticatedUsers`, domain-wide access, or production access.
- Do not run Supabase mutations, SQL, providers, workers, media processing, Remotion, FFmpeg/FFprobe, Docker, signed URLs, public artifacts, paid billing, or production unlocks.
- Use only owner-approved controlled staging surfaces and record sanitized evidence.

## Required Source Inputs

- `docs/external-beta/controlled-tester-product-flow-smoke-1/controlled-tester-product-flow-smoke-record.json`
- `docs/external-beta/current-readiness-rollup-1/rollup-record.json`
- `docs/external-beta/tester-account-membership-smoke-1/tester-account-membership-smoke-record.json`

## Expected Outcome

The next packet should prove whether `aiediting@reeditpro.com` can perform a browser-visible controlled walkthrough without broadening access or starting backend-required work. If a deployed browser UI is not present, record the exact blocker and keep product API readiness as the current source-of-truth.
