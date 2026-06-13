# WORKER-2 Warning And Blocker Register

Decision state: `worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings`

## Warnings

| Warning | Status | Follow-up |
| --- | --- | --- |
| TOOL-ROUTE-5 base PR remains draft/open | `carried_forward` | Keep WORKER-2 PR draft while the base stack is draft. |
| PR #366 remains `CONFLICTING / DIRTY` | `carried_forward` | Merge-hygiene or owner action before branch-stack consolidation. |
| Worker fixture contracts are placeholders only | `accepted_for_worker_2` | WORKER-3 may prepare an approval packet for a future offline worker dry-run. |
| No worker job was claimed or leased | `required` | Worker execution remains blocked until a later owner-approved execution prompt. |

## Blockers Not Removed

- Worker execution remains blocked.
- Worker job claiming and worker lease mutation remain blocked.
- Live route execution remains blocked.
- Tool execution remains blocked.
- Provider/model runtime remains blocked.
- Supabase mutation and SQL remain blocked.
- GCS upload/storage transfer remains blocked.
- Signed URLs and public artifacts remain blocked.
- Media/audio runtime remains blocked.
- Browser capture and map rendering remain blocked.
- Final render/export remains blocked.
- Internal beta, external beta, paid production, and production remain blocked.

workerExecutionApprovedNow: `false`
workerJobClaimApprovedNow: `false`
workerLeaseMutationApprovedNow: `false`
routeExecutionApprovedNow: `false`
toolExecutionApprovedNow: `false`
providerRuntimeApprovedNow: `false`
mediaRuntimeApprovedNow: `false`
audioRuntimeApprovedNow: `false`
supabaseMutationApprovedNow: `false`
gcsUploadApprovedNow: `false`
publicArtifactsApproved: `false`
signedUrlsApproved: `false`
rawPromptExecutionApproved: `false`
internalBetaApproved: `false`
externalBetaApproved: `false`
productionApproved: `false`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
