# MERGE-0 Milestone PR Cleanup Risk Register

Status: `merge_readiness_packet_created`.

## Risk Summary

- Open PRs inspected: `346`.
- Draft PRs: `21`.
- Missing checks: `257`.
- Body updates required: `210`.
- Parent dependency count: `342`.
- Duplicate or superseded review required: `7`.

## Risk Register

| Risk | Count / Scope | Next action |
| --- | --- | --- |
| Duplicate branches/PRs | `7` heuristic matches | Owner review before merge execution |
| Superseded PRs | model/provider and worker parallel chains | Decide canonical chain in MERGE-1 or MERGE-0A |
| Draft PR stacks | `21` drafts | Keep open; mark ready only after owner review |
| Old model-derived bases | model/plan/worker chains | Merge parent-first and retarget downstream branches |
| Missing workflow/checks | `257` PRs | Record base workflow gap or add CI in owner prompt |
| Local environment-blocked validations | varies by PR body | Require exact blocker evidence |
| Merge conflict risk | non-mergeable PRs and old stacks | Rebase/retarget only in later approved prompt |
| Source-of-truth drift risk | all stacked branches | Update downstream source-of-truth after each merge |

## Duplicate / Parallel Review Sample

- #341 [worker] Runtime repo audit after plan snapshot dry-run — Review parallel/superseding branch relationship before merging.
- #328 [model] MODEL-DRYRUN-1B Qwen DashScope owner secret rotation retry — Review parallel/superseding branch relationship before merging.
- #325 [model] MODEL-DRYRUN-1A Qwen DeepSeek dry-run gate fixes — Review parallel/superseding branch relationship before merging.
- #322 [model] Qwen DashScope auth repair — Review parallel/superseding branch relationship before merging.
- #266 OBSERVABILITY_SOUND fixture evidence audit — Review parallel/superseding branch relationship before merging.
- #261 PROVIDER_GATEWAY_SOUND fixture boundary audit — Review parallel/superseding branch relationship before merging.
- #258 WORKER_RUNTIME_SOUND audio fixture payload acceptance audit — Review parallel/superseding branch relationship before merging.
