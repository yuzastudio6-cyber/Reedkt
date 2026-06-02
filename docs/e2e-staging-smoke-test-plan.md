# E2E Staging Smoke Test Plan

Prompt 18 defines the first end-to-end staging smoke-test plan after the Prompt 0-17 foundations. It is a planning, fixture, diagnostics, and readiness-gate milestone only. It does not run staging, local Supabase, remote Supabase, SQL, storage transfer, media processing, workers, providers, tools, render/export, Stripe, external telemetry, or beta/production unlocks.

## Purpose

The smoke plan connects the foundation stack into one controlled validation path. It proves whether the current route contracts, fail-closed services, static diagnostics, source-of-truth docs, and draft RLS plans are coherent enough to prepare a future staging validation milestone.

The plan must prove:

- The Prompt 3-17 route groups still expose only limited foundations, readiness summaries, or backend-required blockers.
- Blocked execution domains remain blocked.
- Synthetic fixtures can model a full project lifecycle without private media, secrets, signed URLs, real money, provider payloads, or user PII.
- CI and diagnostics provide repeatable local/static evidence before any staging resources are touched.
- Production beta remains blocked until local/staging RLS, storage, persistence, execution, compliance, observability, rate-limit, cost-control, billing, deployment, and human approval gates pass.

## Environments

| Environment | Current Prompt 18 status | Allowed now | Blocked now |
| --- | --- | --- | --- |
| Local static | Active validation path | File inspection, route metadata review, diagnostics, docs, draft SQL review, CI evidence | Supabase SQL, storage transfer, media processing, workers, providers, tools, render/export |
| Local Supabase | Future path | Disposable local-only validation after CLI/toolchain repair and schema target review | Remote links, production data, unreviewed migration execution |
| Staging Supabase | Future path | Human-approved staging-only RLS/storage validation with synthetic data | Production data, production credentials, remote execution in Prompt 18 |
| Staging backend | Future path | Human-approved staging smoke with backend-only credentials and strict flags | Providers, real workers, Stripe live mode, production/beta unlock |
| Production beta | Future go/no-go path | Only after every gate in `docs/beta-readiness-gate-contract.md` passes | Any execution or customer data processing before approval |

## Safe Static Path

1. Confirm the branch and PR target are Prompt 18 against Prompt 17.
2. Run foundation validation and every scope diagnostic.
3. Inspect route registry metadata for implemented, backend-required, blocked, mock-only, and future route states.
4. Confirm Prompt 3-17 validation results and draft SQL status are honest.
5. Confirm source-of-truth docs and implementation prompt tracker include Prompt 18.
6. Confirm blocked route groups remain blocked and no production/beta unlock wording exists.
7. Record results in `docs/e2e-staging-smoke-validation-results.md`.

## Future Local E2E Path

Future local validation may proceed only after local Supabase CLI compatibility is repaired and schema target review confirms the fixture plan. The local path should use disposable synthetic fixtures, local-only credentials, local-only storage, and draft SQL promoted only by an explicit validation prompt. It must not link to remote Supabase or use private user media.

## Future Staging E2E Path

Future staging validation requires human approval, staging Supabase only, staging backend only, staging storage only, synthetic fixtures, no production data, no provider execution unless a later reviewed flag exists, no Stripe live mode, rollback notes, and evidence collection. Staging smoke should verify access, RLS, storage policy, route readiness, blocked execution, audit preview, rate-limit/cost blockers, and cleanup.

## Production Beta Go/No-Go Path

Production beta requires all gates in `docs/beta-readiness-gate-contract.md`, a completed blocker inventory, human review, compliance/security signoff, durable audit/observability, persistent rate limits and cost controls, billing readiness, deployment/rollback plans, support readiness, incident response, and successful staging E2E evidence. Prompt 18 does not grant any of those approvals.

## Route Groups

| Route group | Expected Prompt 18 state | Smoke expectation |
| --- | --- | --- |
| Auth/workspace/project | Limited foundation | User/profile/workspace/project access paths are checked by contract and non-member cases are blocked. |
| Storage/upload | Limited foundation/backend-required | Path planning and upload intent boundaries exist; signed URL and finalization execution remain backend-required. |
| Approved snapshots | Limited foundation/backend-required | Readiness and integrity boundaries exist; creation remains blocked without backend runtime and dependencies. |
| Credits | Limited foundation/backend-required | Gate/readiness summaries exist; spend, release, refund, and mutation stay backend-required. |
| Jobs/workers | Limited foundation/backend-required | Readiness and execution envelope previews exist; real claims and execution stay blocked. |
| Media readiness | Limited foundation/backend-required | Metadata/probe/transcript/timing readiness exists; analysis execution stays blocked. |
| Render/export | Limited foundation/backend-required | Readiness/status boundaries exist; manifest build, preview, render, and export execution stay blocked. |
| QA/revision/fallback | Limited foundation/backend-required | QA/revision/fallback blockers exist; execution stays blocked. |
| Tool call/readiness | Static/readiness only | Catalog/readiness can be inspected; tool runtime remains disabled. |
| Provider gateway | Static/readiness/backend-required | Catalog and envelope checks exist; provider calls and webhooks stay blocked. |
| Compliance | Static/readiness/backend-required | Compliance summaries exist; no legal, runtime, dependency, or production approval is granted. |
| Observability | Static/readiness/backend-required | Runtime/route-risk/audit previews exist; telemetry and persistence stay blocked. |

## Fixtures

Fixtures must be synthetic and resettable. Required fixture classes are fake user, workspace, project, source media metadata, storage object record, approved snapshot, credit estimate, credit reservation, job, worker claim, render, QA, tool-call, provider gateway, compliance, observability, and audit preview. No fixture may contain private media, signed URLs, provider secrets, service-role keys, real credit/money, raw PII, raw transcript excerpts, or raw provider payloads.

## Expected Outputs

- Static diagnostics JSON for every foundation diagnostic.
- Route capability evidence showing readiness, backend-required, blocked, mock-only, or future route states.
- Synthetic fixture contract and scenario matrix.
- Beta readiness scorecard with separate foundation readiness, executable beta readiness, and production beta readiness.
- Blocker inventory that keeps production beta blocked until explicit follow-up milestones.

## Rollback And Escalation

Prompt 18 has no runtime rollback because it does not deploy or execute anything. If diagnostics fail, use Prompt 18A to harden the plan. If staging resources are accidentally touched, stop immediately, record the command, environment, credentials scope, affected project, and mitigation, and require human review before continuing.

## Remaining Blockers

- E2E staging smoke is not run.
- Local/staging/remote Supabase SQL is not run.
- Local/staging RLS and storage policy validation remain unexecuted.
- Production deployment is not configured.
- Real upload/download, approved snapshot persistence, credit mutation, job/worker execution, media analysis, render/export, QA execution, tool execution, provider execution, external telemetry, persistent rate limits/cost controls, Stripe, and beta unlock all remain blocked.
