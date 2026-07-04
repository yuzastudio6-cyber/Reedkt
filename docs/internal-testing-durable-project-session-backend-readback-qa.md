# Internal Testing Durable Project Session Backend Readback QA

## Decision

`internal_testing_durable_project_session_backend_readback_qa_passed_ready_for_durable_supabase_route_contract_plan`

## Prior Decision

`internal_testing_durable_project_session_backend_route_integration_passed_ready_for_readback_qa`

## Summary

This milestone accepts the route integration only after readback QA proves `projectSessionAccess` is visible and stable on Project Edit Session and Project Edit Brief mock route responses.

The QA covers success and failure envelopes. It verifies that successful route `data` and failed route `error.details` both carry the same mock-safe access metadata: skeleton decision, `mock_internal_access_allowed` status, route access, false durable Supabase access, false service-role browser access, warning copy, and an idempotent request envelope.

## Accepted Route Families

- Project Edit Session mock routes
- Project Edit Brief mock routes

## Accepted Envelope Kinds

- `success_data`
- `failure_error`

## Boundaries

- No durable Supabase migration, SQL, Data API read/write, Storage, signed URL, or service-role browser path.
- No profile/workspace bootstrap write.
- No provider/model call, worker dispatch, media processing, render/export, credit spend, wallet mutation, Stripe, external beta, paid production, or product-ready claim.
- Durable table-backed access still requires a separate Supabase route contract plan, RLS/grants evidence, server-side Auth verification, and backend-only service-role handling.

## Validation

- `npm run smoke:internal-testing-durable-project-session-backend-readback-qa`
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

`INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN`
