# SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-ISOLATED-TARGET-READBACK-1

Status: `completed_worker_runtime_transactional_rpc_isolated_target_readback`

Patch type: guarded read-only worker runtime RPC catalog/grant readback against the isolated clean staging target.

Base source: integration head `6ad9c0cfe7790d372d2120c12f9771e3f295178a`, after merged PR #1092.

## Decision

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-ISOLATED-TARGET-READBACK-1 decision: `completed_worker_runtime_transactional_rpc_isolated_target_readback`

Execution: `completed_guarded_readonly_worker_rpc_catalog_readback_no_runtime_execution`

Blocker: `none`

Confirmation gate: `REEDITPRO_CONFIRM_SUPABASE_WORKER_RUNTIME_TRANSACTIONAL_RPC_ISOLATED_TARGET_READBACK=true`

Confirmation observed: `present_true`

Target project: `reeditpro-clean-staging-isolated-v1` / `fajinbvwhcjnutkaumkm`

Target DB URL secret: `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` / version `2` / `enabled`

Secret Manager payload access: `true_guarded_isolated_target_db_url_only`

Credential payload printed: `false`

Credential payload persisted in repo: `false`

Remote command class: `psql readonly worker_runtime catalog query [db-url redacted]`

SQL execution: `read_only_worker_runtime_catalog_sql`

SQL mutation: `none`

RPC execution: `false`

Service-role route execution: `false`

Worker execution: `false`

Worker dispatch: `false`

Worker lease claim: `false`

Storage object creation: `false`

Storage object read: `false`

Signed URL creation: `false`

Public artifact creation: `false`

Internal beta unlocked: `false`

External beta unlocked: `false`

Production unlocked: `false`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Readback Result

The guarded runner verified only catalog and grant metadata. It did not call any `worker_runtime` RPC function.

Schema:

- `worker_runtime` schema present: `true`
- `service_role` usage: `true`
- anon usage blocked: `true`
- authenticated usage blocked: `true`
- public usage blocked: `true`

Functions:

- expected function count: `7`
- missing functions: `none`
- non-security-definer functions: `none`
- functions missing service-role execute: `none`
- functions executable by anon: `none`
- functions executable by authenticated: `none`
- functions executable by public: `none`

Expected functions:

- `append_tracka_private_e2e_event`
- `claim_tracka_private_e2e_job`
- `heartbeat_tracka_private_e2e_job`
- `complete_tracka_private_e2e_job`
- `fail_tracka_private_e2e_job`
- `cancel_tracka_private_e2e_job`
- `release_expired_tracka_private_e2e_leases`

Tables:

- expected table count: `3`
- missing tables: `none`
- tables missing RLS: `none`
- tables missing service-role DML: `none`
- tables selectable by anon: `none`
- tables selectable by authenticated: `none`
- tables selectable by public: `none`

Expected tables:

- `worker_jobs`
- `worker_job_events`
- `worker_job_artifacts`

## Evidence

Run ID: `2026-06-26T20-27-24-319Z-d8696635`

Sanitized report: `docs/activation-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-reports/worker_runtime_transactional_rpc_isolated_target_readback_report.json`

Report checksum: `a6548f0ef96d84686c75d89b30586a04c2dc3125b5e85552cad65a2ddb07cad5`

Sanitized manifest: `docs/activation-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-reports/worker_runtime_transactional_rpc_isolated_target_readback_manifest.json`

Manifest checksum: `bb92f1f91c07599365e5519e223012d364e50209f0658bdb44458e429d930c21`

Credential payload values are not recorded, hashed, summarized, printed, or committed.

## Readiness

WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: `ready_for_service_role_runtime_boundary_validation`

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: `blocked_pending_service_role_runtime_validation_and_job_fixture_gate`

INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_service_role_runtime_private_storage_artifact_job_and_e2e_gates`

EXTERNAL-PRODUCT-BETA readiness: `blocked_pending_internal_beta_evidence_security_privacy_support_cost_and_deployment_gates`

## Next Milestone

`SUPABASE-SERVICE-ROLE-RUNTIME-BOUNDARY-VALIDATION-1`

The next packet may only validate the backend/service-role boundary and must remain explicitly gated. It must not dispatch workers, process media, create storage objects, create signed/public artifacts, or unlock beta unless a later runtime packet explicitly approves those operations.

## #577 Exclusion

PR #577 remains open/draft/blocked and excluded as source-of-truth for this Supabase internal-beta lane.

## No-Scope Statement

No Supabase mutation, SQL mutation, RPC execution, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, storage object creation, storage object read, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled. Secret Manager payload access was limited to guarded isolated target database URL retrieval for read-only worker runtime catalog/grant readback; the payload was not printed, persisted, hashed, summarized, or committed.
