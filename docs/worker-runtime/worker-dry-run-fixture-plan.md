# Worker Dry-Run Fixture Plan

Status: `ready_for_worker_2_dry_run_fixture_plan`.

WORKER-1 prepares the future dry-run fixture plan for WORKER-2. It does not implement or run the fixture.

## Future Fixture Inputs

- Synthetic approved plan snapshot fixture.
- Scoped tool-call manifest fixture.
- Synthetic workspace/project/user placeholders.
- Private artifact scope placeholders.
- Manifest/checksum placeholders.
- QA hook placeholders.
- Observability hook placeholders.
- Cleanup/rollback hook placeholders.
- Blocked-use list.

## Expected Future Outputs

- Contract validation summary.
- Plan-snapshot-to-worker mapping evidence.
- Claim/lease preflight evidence without job claim.
- Tool-route dispatch blocked evidence.
- Service-role blocked evidence.
- Artifact write blocked evidence.
- QA/observability placeholder evidence.
- Cleanup/rollback placeholder evidence.

## Explicit Non-Execution

WORKER-2 must still be dry-run fixture/contract-test scope unless a later owner prompt says otherwise:

- no actual tool execution;
- no route execution;
- no provider call;
- no Supabase mutation;
- no SQL;
- no GCS upload;
- no signed URL;
- no public artifact;
- no worker execution.

Next prompt: `WORKER-2 - Worker Runtime Dry-Run Fixture Plan / Contract Tests`.
