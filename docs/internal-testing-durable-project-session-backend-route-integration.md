# Internal Testing Durable Project Session Backend Route Integration

## Decision

`internal_testing_durable_project_session_backend_route_integration_passed_ready_for_readback_qa`

## Summary

This milestone wires the mock-safe project/session access evaluator into the internal mock API route families for Project Edit Session and Project Edit Brief. Successful mock route responses now include `projectSessionAccess` metadata beside existing safety flags.

The mock-safe durable backend route integration proves the request envelope can carry project/session access decisions through the backend route seam, but it does not enable durable Supabase reads or writes.

## Route Families

- Project Edit Session mock routes
- Project Edit Brief mock routes

Each response records:

- skeleton decision
- access status
- mock internal access state
- durable Supabase access state
- service-role browser boundary
- request/idempotency audit envelope

## Boundaries

- No Supabase migration, SQL, Data API read/write, Storage, signed URL, or service-role browser path.
- No profile/workspace bootstrap write.
- No provider/model call, worker dispatch, media processing, render/export, credit spend, wallet mutation, Stripe, external beta, paid production, or product-ready claim.
- Durable table-backed access still requires RLS, explicit Data API grants, server-side Auth verification, membership rows, and backend-only service-role handling.

## Validation

- `npm run smoke:internal-testing-durable-project-session-backend-route-integration`
- `npm run smoke:internal-testing-mock-safe-durable-project-session-backend-skeleton`
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

## Next Gate

`INTERNAL_TESTING_DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA`
