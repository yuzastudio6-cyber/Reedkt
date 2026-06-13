# TOOL-ROUTE-5 Warning And Blocker Register

QA result: `tool_route_offline_dry_run_qa_passed_with_warnings`

Worker readiness state: `ready_with_warnings_for_worker_route_fixture_integration_plan`

## Warnings

| Warning | Status | Worker-gate effect |
| --- | --- | --- |
| PR #366 remains open/draft/conflicting | `carried_forward` | Requires merge-hygiene or owner action before branch-stack consolidation. |
| PR #386 remains open/draft evidence | `carried_forward` | TOOL-ROUTE-5 PR should remain draft while the base PR is draft. |
| TOOL-ROUTE-4 evidence is offline/local only | `accepted_for_qa_review` | Sufficient for worker fixture integration planning, not live execution. |
| Ignored `.local-artifacts/` may be absent in clean worktrees | `accepted_for_committed_evidence_review` | Do not rerun TOOL-ROUTE-4; use committed summaries and diagnostics. |
| Live runtime remains blocked | `required` | Future route/tool/worker/provider unlocks require separate approval packets. |

## Blockers Not Removed

- Live route execution remains blocked.
- Tool execution remains blocked.
- Worker execution remains blocked.
- Provider/model runtime remains blocked.
- Supabase mutation and SQL remain blocked.
- GCS upload/storage transfer remains blocked.
- Signed URLs and public artifacts remain blocked.
- Browser capture, map rendering, and media/audio processing remain blocked.
- Audio generation, SFX/music generation, FFmpeg/FFprobe, DeepFilterNet, and Demucs remain blocked.
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
