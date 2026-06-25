# RP-BACKEND-01-INTERNAL-BETA-SERVICE-ROLE-API-CONTRACTS

Use this prompt only after `RP-DATA-04-GUARDED-LOCAL-SUPABASE-MIGRATION-VALIDATION` is merged.

Implement backend-only API route contracts for the narrow internal beta lane: project/session creation, approved-plan persistence, internal credit reservation/release/refund records, job enqueue/status, artifact manifest write/readback, and QA report readback.

Requirements:

- Frontend must not perform service-role mutations.
- Workers must execute approved snapshots only.
- Provider/model calls remain disabled by default.
- Signed/public artifact creation remains blocked unless a later guarded private-artifact-access milestone explicitly approves it.
- Stripe/payment processing remains disabled for internal beta unless a separate sandbox billing milestone is approved.
- No external beta, production, public artifact, final delivery, broad media, or paid production unlock may occur.
