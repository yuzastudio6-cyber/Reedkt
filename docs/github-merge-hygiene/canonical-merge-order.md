# Canonical Merge Order

This is a recommended human review order, not an automatic merge plan. Parent PRs must be reviewed before children. Draft PRs are never merge-now.

| Order | PR | Title | Draft | Merge state | Recommendation |
| --- | --- | --- | --- | --- | --- |
| 1 | #205 | [foundation] XCHAT-0 cross-chat ownership registry | false | CLEAN | review_parent_chain_before_merge |
| 2 | #222 | [activation] Phase 52H cross workstream handoff tracking | false | CLEAN | review_parent_chain_before_merge |
| 3 | #247 | [foundation] Supabase staging schema parity remediation strategy | false | CLEAN | review_parent_chain_before_merge |
| 4 | #248 | [foundation] Supabase staging reset approval packet | false | CLEAN | review_parent_chain_before_merge |
| 5 | #252 | [foundation] Supabase staging data impact backup approval | false | CLEAN | review_parent_chain_before_merge |
| 6 | #259 | [foundation] Supabase staging reset reapply execution | false | CLEAN | review_parent_chain_before_merge |
| 7 | #262 | [foundation] Supabase staging reset failure triage | false | CLEAN | review_parent_chain_before_merge |
| 8 | #265 | [foundation] Supabase staging reset retry approval | false | CLEAN | review_parent_chain_before_merge |
| 9 | #269 | [foundation] Supabase staging reset retry execution | false | CLEAN | review_parent_chain_before_merge |
| 10 | #271 | [foundation] Supabase reset retry failure diagnostics | false | CLEAN | review_parent_chain_before_merge |
| 11 | #274 | [foundation] Supabase support escalation approval | false | CLEAN | review_parent_chain_before_merge |
| 12 | #276 | [foundation] Supabase support ticket submission | false | CLEAN | review_parent_chain_before_merge |
| 13 | #280 | [foundation] Supabase clean staging target approval | false | CLEAN | review_parent_chain_before_merge |
| 14 | #283 | [foundation] Supabase clean staging branch execution | false | CLEAN | review_parent_chain_before_merge |
| 15 | #292 | [foundation] Supabase branching plan billing review | false | CLEAN | review_parent_chain_before_merge |
| 16 | #298 | [foundation] Supabase Track B clean staging backfill | false | CLEAN | review_parent_chain_before_merge |
| 17 | #299 | [product] Internal beta readiness aggregation after Track B backfill | false | CLEAN | review_parent_chain_before_merge |
| 18 | #302 | [product] Internal testing scope freeze and signoff | false | CLEAN | review_parent_chain_before_merge |
| 19 | #306 | [product] Restricted internal testing launch rehearsal | false | CLEAN | review_parent_chain_before_merge |
| 20 | #309 | [product] Restricted internal testing start gate | false | CLEAN | review_parent_chain_before_merge |
| 21 | #311 | [product] Restricted internal testing session 0 | false | CLEAN | review_parent_chain_before_merge |
| 22 | #314 | [model] Qwen DeepSeek orchestration repo audit | false | CLEAN | review_parent_chain_before_merge |
| 23 | #318 | [model] Qwen DeepSeek dry-run approval packet | false | CLEAN | review_parent_chain_before_merge |
| 24 | #320 | [model] Qwen DeepSeek provider dry-run | false | CLEAN | review_parent_chain_before_merge |
| 25 | #322 | [model] Qwen DashScope auth repair | false | CLEAN | review_parent_chain_before_merge |
| 26 | #327 | [model] Plan snapshot contract | false | CLEAN | review_parent_chain_before_merge |
| 27 | #337 | [model] Plan snapshot dry-run validation | false | CLEAN | review_parent_chain_before_merge |
| 28 | #341 | not present in current open set | null | n/a | verify_if_already_merged_or_superseded |
| 29 | #342 | not present in current open set | null | n/a | verify_if_already_merged_or_superseded |
| 30 | #346 | not present in current open set | null | n/a | verify_if_already_merged_or_superseded |
| 31 | #347 | [tool-route] Execution unlock audit | false | CLEAN | review_parent_chain_before_merge |


## Merge Hygiene Rules

- Merge parent PRs before child PRs.
- Treat clean merge state as necessary metadata, not permission to merge.
- Hold draft PRs until they are ready and parent chain review is complete.
- Resolve duplicate or parallel lanes before merging either lane.
- If PR #346 is already merged, rerun stack review before merging any child or follow-up lane that assumed it was still draft.
- Keep production, external beta, paid production, runtime execution, provider calls, Supabase writes, public artifacts, signed URLs, and raw prompt execution blocked unless a later specific PR authorizes them.
