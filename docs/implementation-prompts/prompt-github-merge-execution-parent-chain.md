# GitHub Merge Hygiene Parent-Chain Merge Execution

Do not use this prompt for merge execution yet. Current approval decision is `blocked_pending_human_merge_order_review`; resolve the blocker report first.

Candidate merge targets are exactly:

- #205
- #222
- #247
- #248
- #252
- #259
- #262
- #265
- #269
- #271
- #274
- #276
- #280
- #283
- #292
- #298
- #299
- #302
- #306
- #309
- #311
- #314
- #318
- #320
- #322
- #327
- #337
- #347

Rules:

- Merge parent PRs first.
- Do not merge draft PRs.
- Do not merge dirty or unstable PRs.
- Do not merge duplicate-risk PRs unless they are explicitly marked canonical in the approval packet.
- Verify the target branch contains each merged commit after every merge.
- Stop on any changed merge state, new conflict, missing parent, or unexpected CI/validation category.
- Do not execute runtime paths, mutate Supabase, call providers, run workers/tools/routes, process media, create public artifacts, issue signed URLs, deploy production, unlock external beta, unlock paid production, or execute raw prompts.
