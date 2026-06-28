# Milestone Merge Order

Snapshot time: `2026-06-12T20:27:09Z`

This plan is a source-of-truth merge order, not an execution log. MERGE-HYGIENE-0 does not merge PRs.

## Critical Merge Order

| Order | PR | Merge Gate | Downstream Action |
| --- | --- | --- | --- |
| 1 | #331 `[model] Qwen DeepSeek full synthetic provider dry run` | open, non-draft, mergeable, validation evidence still acceptable, no unresolved blockers | After merge, update #334 base if GitHub does not retarget automatically |
| 2 | #334 `[plan] Provider output approved-plan snapshot contract` | #331 merged, #334 still mergeable, candidate-only plan-snapshot contract remains non-runtime | After merge, update #340 base if needed |
| 3 | #340 `[worker] Worker Runtime Jobs repo audit` | #334 merged, #340 still mergeable, audit-only worker scope remains true | After merge, update #343 base if needed |
| 4 | #343 `[worker] Approved plan snapshot dry run` | #340 merged, #343 still mergeable, dry-run-only worker contract remains true | After merge, update #347 base if needed |

## Downstream After Critical Chain

| PR | Recommended Timing | Reason |
| --- | --- | --- |
| #347 `[tool-route] Execution unlock audit` | Review after #343 lands | It is stacked on #343 and should be retargeted/rechecked against the landed worker dry-run branch before merge |

## Upstream Model/Provider Context

| PR | Position | Recommendation |
| --- | --- | --- |
| #296 | Provider Gateway baseline | Merge in the provider chain before #307, outside the critical model-worker merge execution |
| #307 | Provider-1 policy | Merge after #296 once Provider Gateway policy stack is reviewed |
| #315 | Supabase registry restore | Treat as prerequisite evidence for Provider-1; not part of the #331 -> #343 merge order |
| #318 | Dry-run approval | Review as upstream approval source before merging #322/#330/#331 if the model stack has not already absorbed it |
| #322 | Qwen auth repair | Merge before #330 when executing the upstream model chain |
| #330 | Qwen timeout calibration | Merge before #331 when executing the upstream model chain |

## Stop Conditions

Stop before any merge when a PR is draft, not mergeable, has failing checks, has unresolved requested changes, has stale evidence, claims runtime execution outside its approved scope, changes `package-lock.json` unexpectedly, or requires Supabase/runtime/provider/tool execution to validate.
