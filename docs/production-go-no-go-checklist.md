# Production Go No-Go Checklist

Before external beta, ReeditPro must have:

- passing production readiness without hard blockers;
- approved deployment and rollback plan;
- model-weight and license approvals;
- security review approval;
- cost budgets, concurrency limits, and kill switches;
- private storage and deletion workflows;
- observability and alert routing;
- incident response ownership;
- full E2E dry-run and local-dev fixture validation;
- final delivery/share policy approval.

No milestone label grants go approval by itself. External beta, real-user-media beta, and paid production graduate only when the corresponding evidence-driven readiness gate has every required approval, blocker readback, rollback/monitoring path, and billing/privacy control recorded.

For paid-production owner signoff, use `npm run prod:readiness:final-owner-signoff-evidence-collector` before final all-up recording. It checks owner approval provenance for deployment, security, storage/privacy, legal, support, billing, operations, real-user-media beta, private media, artifact privacy, paid production, and final delivery/share. It cannot grant approval by itself and cannot bypass the Supabase, billing, wallet, Stripe, observability, operations, tool, hard-safety, or final evidence gates.
