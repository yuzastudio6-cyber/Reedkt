# Source Audit

Packet: `RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1`

Decision: `completed_external_beta_provider_model_call_policy_closure_no_runtime_calls`

Execution: `completed_docs_only_provider_model_policy_closure_no_provider_or_model_execution`

Base integration head: `acd4730c8216adb136c7b7d23de3004ac4335577`

Single active Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Product-ready end-to-end local OSS tools: `0`

## Source Chain

- `RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1`: completed main Reeditpro staging migration-history sync.
- `RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1`: completed service-role grant-boundary validation on the main target.
- `RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1`: completed transaction-rolled-back approved snapshot persistence readback.
- `RP-EXTERNAL-BETA-CREDIT-RESERVATION-LEDGER-GUARDED-REMOTE-WRITE-1`: completed transaction-rolled-back credit reservation ledger readback.
- `RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1`: completed transaction-rolled-back job queue, event, lease, and claim attempt readback.
- `RP-EXTERNAL-BETA-PRIVATE-ARTIFACT-STORAGE-ACCESS-GUARDED-REMOTE-WRITE-1`: completed generated private storage object write/read/delete and rolled-back artifact metadata readback.
- `RP-EXTERNAL-BETA-SERVICE-ROLE-ROUTE-RUNTIME-VALIDATION-1`: completed guarded in-process `GET /v1/storage-objects/:storageObjectRecordId` read route validation.
- `RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1`: completed guarded in-process `POST /v1/edit-plans/:editPlanId/approved-snapshots` write route validation.
- `RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1`: completed generated-local Remotion private preview/export runtime validation.
- `RP-PROVIDER-01-INTERNAL-BETA-DISABLED-PROVIDER-ADAPTER-SCAFFOLD`: source evidence that provider adapter operations are disabled and fail closed.
- `model-routing-policy.md`, `provider-prompt-architecture.md`, `pricing-and-credits.md`, `approved-plan-snapshot-policy.md`, and `intent-led-edit-planning.md`: product policy source for approved snapshot, credit, provider routing, prompt, and no-raw-chat execution gates.

## Current Code Evidence

- `server/services/provider-gateway-service.ts` exposes `assertRealProviderCallsDisabled()` and returns `REAL_PROVIDER_CALLS_DISABLED` before any real provider transport.
- `src/backend/providers/gateway/provider-gateway-service.ts` defaults to `mock_only` and blocks non-mock dispatch with `Real provider calls are blocked in RP-GCP-03`.
- `src/backend/services/generation-service.ts` creates mock generation requests only after plan and credit gates and records `Mock generation request. No provider call is made.`
- The existing provider scaffold records `Provider/model calls: false`, `Model call: false`, `Secret payload access: false`, and `Raw prompt execution: false`.

## Exclusions

PR #577 remains open/draft/blocked and excluded as source-of-truth.

The isolated Supabase project `fajinbvwhcjnutkaumkm` remains historical sandbox evidence only. The active target for future external beta readiness remains `wmyyttnynmteqgcdishd`; no data is copied from the isolated project in this packet.
