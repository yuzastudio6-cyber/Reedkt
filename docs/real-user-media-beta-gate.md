# Real-User-Media Beta Gate

Milestone 9 graduates from synthetic/private fixtures to real uploaded media only inside an approved bounded beta scope.

## Decision

Passing evidence uses:

`trackb_milestone9_real_user_media_beta_gate_passed_ready_for_approved_scope`

This means external beta with real user media is allowed only for the approved pilot scope represented by the evidence packet. It does not enable paid production, broad real-user-media processing, public sharing, final export delivery, provider calls, Supabase writes, Stripe, or product-ready local OSS claims.

## Required Evidence

The gate requires all of the following:

- storage/privacy owner approvals;
- workspace/project-scoped private storage references;
- no public bucket source of truth;
- no persistent signed URL source of truth;
- retention and deletion policy approval;
- deletion cascade for source and derived artifacts;
- private artifact manifest checks;
- abuse/security review;
- incident/runbook readiness;
- approved user consent and disclosure copy;
- a bounded real-media pilot with participant, project, asset, duration, tool, approval, credit, monitoring, and incident limits.

## Approved Scope

The default smoke fixture limits the pilot to:

- approved participants only;
- approved projects only;
- approved Track B tools only;
- private source-media storage references only;
- approved plan snapshot, credit estimate, and credit reservation IDs;
- no public sharing;
- no final export;
- no paid production.

## Validation

Run:

```bash
npm run smoke:real-user-media-beta-gate
npm run beta:readiness:real-user-media-beta-gate-report
npm run smoke:beta-readiness
npm run smoke:beta-readiness-scope-approval-sequence
npm run smoke:trackb-internal-beta-e2e
npm run typecheck:server
git diff --check
```

The smoke covers both the allowed approved-scope path and blocking cases for missing consent, public artifacts, signed URL artifacts, media-duration overage, missing external-beta prerequisite approval, and secret-like evidence.
