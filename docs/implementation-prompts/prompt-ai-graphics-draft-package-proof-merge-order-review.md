# Prompt: AI Graphics Draft Package Proof Merge-Order Review

Decision: `ai_graphics_draft_package_proof_merge_order_review_passed_with_warnings`

Implement a docs/diagnostics-only merge-order review from `origin/codex/rp-ai-graphics-draft-package-proof-promotion-qa-review`.

Use branch `codex/rp-ai-graphics-draft-package-proof-merge-order-review` and keep the PR draft while PR #552 remains draft.

Source state recorded:

- PR #552 open/draft/MERGEABLE at `f1db3b4c1c7e422ece6a163aed87906012da726b`
- PR #550/#548/#543/#536/#425/#433/#441 open/draft/MERGEABLE
- PR #416/#542/#544 merged context

Review only source PRs PR #425, PR #433, and PR #441. Recommend later stack order PR #425 -> PR #433 -> PR #441. Do not mark drafts ready, merge PRs, promote canonical proof, install dependencies, mutate package-lock, rerun imports or fixtures, execute tools/workers/routes/providers, run browser/WebGL/canvas/GPU/model/media/Remotion/resvg runtime, mutate Supabase/SQL/GCS, create signed URLs/public artifacts, or unlock beta/production.

Next prompt: `AI_GRAPHICS_DRAFT_PACKAGE_PROOF_MERGE_ORDER_QA_REVIEW`.
