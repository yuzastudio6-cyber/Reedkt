# TOOL-ROUTE-4 Warning And Blocker Register

Decision state: `tool_route_offline_dry_run_passed_with_warnings`

## Warnings

| Warning | Status | Follow-up |
| --- | --- | --- |
| PR #366 remains open/draft/conflicting | `carried_forward` | Merge-hygiene or owner action before route stack consolidation. |
| PR #368, PR #372, PR #370, PR #378, and PR #384 remain stacked/draft evidence | `carried_forward` | Preserve parent-first stack review before merge. |
| Offline evidence only | `accepted_for_tool_route_4` | TOOL-ROUTE-5 should review offline evidence before any worker gate movement. |
| Live runtime remains blocked | `required` | Future route/tool/worker/provider unlocks require separate approval packets. |

## Blockers Not Removed

- Live route execution remains blocked.
- Tool execution remains blocked.
- Worker execution remains blocked.
- Provider/model runtime remains blocked.
- Supabase mutation and SQL remain blocked.
- GCS upload/storage transfer remains blocked.
- Signed URLs and public artifacts remain blocked.
- Media/audio processing remains blocked.
- Internal beta, external beta, paid production, and production remain blocked.

futureOfflineDryRunExecutionApproved: `true`
liveRouteExecutionApprovedNow: `false`
liveToolExecutionApprovedNow: `false`
workerExecutionApprovedNow: `false`
providerRuntimeApprovedNow: `false`
mediaRuntimeApprovedNow: `false`
audioRuntimeApprovedNow: `false`
supabaseMutationApprovedNow: `false`
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
