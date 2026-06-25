# AI Video B-roll Generation Weight Source Eligibility Decision

Status: `ai_video_broll_gen_1_weight_source_eligibility_no_execution`

Decision: `ai_video_broll_gen_1_weight_source_planning_subset_selected`

Gate 1 selects which model families may be planned in the next weight source/checksum gate. It does not approve or perform a download.

## Eligible For Gate 2 Planning

| Priority | Candidate | Eligibility | Gate 2 constraint |
| --- | --- | --- | --- |
| 1 | Wan / Wan2.1 family | Eligible | Use official Wan-Video/Wan sources only; pin exact variant, source URL, license file, and checksum plan. |
| 2 | LTX / LTX-Video | Eligible with version split | Gate 2 must choose and separately document original LTX-Video, LTXV 0.x/2B, LTX-2, or LTX-2.3. Do not mix license findings across variants. |
| 3 | Mochi 1 | Eligible as fallback/research | Prefer official Hugging Face source; do not approve direct download, magnet, mirror, or repackaged weights without separate provenance approval. |

## Not Eligible For Gate 2 Planning

| Candidate | Status | Reason |
| --- | --- | --- |
| HunyuanVideo | Blocked | Custom license and territory restrictions require legal/commercial/territory review before weight source planning. |

## Ranking For Tool Calls After Future Runtime Approval

No tool calls are enabled by this decision. If later gates approve install, runtime, worker dispatch, storage, billing, and beta readiness, the intended ranking remains:

1. Wan / Wan2.1 family for realistic stock-style B-roll, environment shots, product cutaways, filler clips, and general generated B-roll.
2. LTX / LTX-Video for fast preview, image-to-video, keyframe animation, vertical/social preview experiments, and motion-graphics-adjacent clips.
3. Mochi 1 for permissive fallback, LoRA/research, and comparison cases where Wan/LTX are unsuitable.
4. HunyuanVideo only for premium-gated review after legal and territory acceptance.

## Runtime Boundary

Eligible for Gate 2 means eligible to plan weight source and checksum only. It does not mean model weights are downloaded, dependencies are installed, inference is run, generated video is created, Docker/GCP is touched, providers are called, workers are dispatched, Supabase is mutated, SQL is executed, storage objects are created, signed URLs are created, credits are used, beta is unlocked, production is unlocked, `dry_run_passed` is claimed, or `generated_local_fixture_passed` is claimed.

## Next Prompt

`AI-VIDEO-BROLL-GEN-2: weight source/checksum plan`
