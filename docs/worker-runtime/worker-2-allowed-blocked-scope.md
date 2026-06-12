# WORKER-2 Allowed And Blocked Scope

Status: `ready_for_worker_2_dry_run_fixture_plan`.

## Likely WORKER-2 Purpose

`WORKER-2 - Worker Runtime Dry-Run Fixture Plan / Contract Tests` should implement static or dry-run contract tests around the WORKER-1 schema and mappings. It should not perform live worker execution unless a later prompt explicitly changes scope.

## Allowed For WORKER-2

- Create synthetic approved plan snapshot fixture.
- Create scoped tool-call manifest fixture.
- Add contract tests or diagnostics for payload validation.
- Verify blocked-use handling.
- Verify no raw prompt execution path.
- Verify service-role, artifact write, and tool-route gates stay blocked.
- Produce committed sanitized evidence summaries.

## Blocked For WORKER-2 Unless Separately Approved

- worker execution;
- job claims;
- queue execution;
- tool execution;
- route execution;
- provider/model calls;
- media processing;
- browser capture;
- Docker/Cloud Run;
- Supabase mutation;
- SQL;
- GCS upload or storage transfer;
- signed URL creation;
- public artifact creation;
- dependency mutation;
- internal beta approval;
- external beta unlock;
- production unlock.

## Required Source Evidence

- WORKER-1 status: `ready_for_worker_2_dry_run_fixture_plan`.
- PLAN-SNAPSHOT-0 status: `ready_for_owner_review`.
- WORKER-0 status: `ready_with_warnings_for_worker_1`.
- MODEL-DRYRUN-2A status: `provider_dry_run_passed`.
- Artifact source of truth: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`.
