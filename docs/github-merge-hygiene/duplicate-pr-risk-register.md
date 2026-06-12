# Duplicate PR Risk Register

This register highlights parallel or duplicate lanes that require owner review before merge. It does not close, merge, rebase, or supersede any PR.

## Model provider dry-runs and Qwen/DeepSeek repairs

- Risk status: `parallel_or_duplicate_review_required`
- Canonical PRs: #314, #318, #320, #322
- Observed PRs: #62, #64, #307, #314, #318, #320, #322, #323, #324, #325, #326, #328, #329, #330, #331, #332, #333, #336
- Recommended action: review canonical lane first; hold duplicate or parallel candidates until owners confirm supersession
- Reason: Multiple provider dry-run, Qwen repair, and token-fix branches can supersede each other unless PR #314 -> #318 -> #320 -> #322 is reviewed as the canonical lane.

## Plan snapshot contracts and dry-run validation

- Risk status: `parallel_or_duplicate_review_required`
- Canonical PRs: #327, #337
- Observed PRs: #84, #211, #327, #332, #334, #335, #337, #339, #343
- Recommended action: review canonical lane first; hold duplicate or parallel candidates until owners confirm supersession
- Reason: Plan-snapshot contract and validation PRs depend on committed provider evidence; parallel contract-fix PRs should not merge ahead of the canonical evidence chain.

## Worker runtime audits and no-op dry-runs

- Risk status: `parallel_or_duplicate_review_required`
- Canonical PRs: #341, #342, #346
- Observed PRs: #11, #15, #24, #29, #39, #46, #51, #56, #58, #65, #66, #81, #85, #87, #88, #92, #99, #100, #103, #104, #110, #140, #181, #189, #228, #253, #255, #258, #300, #338, #340, #343, #344, #345, #351
- Recommended action: review canonical lane first; hold duplicate or parallel candidates until owners confirm supersession
- Reason: Worker runtime repo audit, approval, and no-op dry-run form a parent stack; draft worker alternatives need review before any worker lane is merged.

## Track A creative graphics and visual runtime unlocks

- Risk status: `parallel_or_duplicate_review_required`
- Canonical PRs: owner review required
- Observed PRs: #2, #16, #17, #18, #19, #20, #21, #22, #23, #24, #25, #30, #35, #36, #39, #41, #43, #47, #57, #59, #60, #61, #62, #64, #66, #67, #75, #80, #82, #83, #87, #89, #90, #94, #95, #97, #100, #120, #128, #157, #221, #231, #233, #235, #237, #240, #243, #245, #250, #253, #255, #260, #263, #264, #267, #270, #272, #277, #281, #285, #288, #291, #294, #305, #310, #312, #317, #321
- Recommended action: review canonical lane first; hold duplicate or parallel candidates until owners confirm supersession
- Reason: Track A contains many visual/runtime readiness branches. Merge order must preserve milestone ancestry and keep runtime execution separately approved.

## SUPABASE_SOUND harness and audio/SoundSync lanes

- Risk status: `parallel_or_duplicate_review_required`
- Canonical PRs: owner review required
- Observed PRs: #20, #44, #45, #46, #47, #48, #49, #50, #52, #140, #159, #215, #218, #221, #224, #229, #232, #234, #236, #239, #242, #244, #246, #249, #251, #254, #256, #257, #258, #261, #266, #268, #270, #273, #275, #278, #279, #282, #284, #286, #287, #289, #290, #293, #295, #301, #303, #308, #313, #316, #319
- Recommended action: review canonical lane first; hold duplicate or parallel candidates until owners confirm supersession
- Reason: Sound, music, and Supabase harness PRs cross database and runtime boundaries. Parallel harness branches need owner review before merge.
