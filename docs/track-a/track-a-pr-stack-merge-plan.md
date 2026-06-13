# Track A PR Stack Merge Plan

Status: `planning_only_for_tracka_merge_1`

This plan records the later merge/closure order for human review. TRACKA-RECON-0 does not merge, close, retarget, or edit any PR.

## Current Integration Base

Target base for future review: `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration`

Confirmed merged base evidence: TOOL-ROUTE-2 PR #380 at `809c4ec3d3c54c7629d90a35fcc89eeff527cf2b`.

## PR Classification

| PR | Title | Current State | Current Base | Classification | TRACKA-MERGE-1 Action |
| --- | --- | --- | --- | --- | --- |
| #18 | Phase 30 real video private final export test | open, non-draft, mergeable | old phase stack | historical_not_required_for_current_merge | keep for historical reference unless owner requests legacy stack merge |
| #19 | Phase 30B render IAM retry and private export | open, non-draft, mergeable | old phase stack | historical_not_required_for_current_merge | keep for historical reference unless owner requests legacy stack merge |
| #21 | Phase 32 real video color correction test | open, non-draft, mergeable | old phase stack | historical_not_required_for_current_merge | keep for historical reference unless owner requests legacy stack merge |
| #22 | Phase 33A mask model approval workflow | open, non-draft, mergeable | old phase stack | needs_retarget | prerequisite review for BiRefNet stack |
| #23 | Phase 33B download approved BiRefNet weights | open, non-draft, mergeable | old phase stack | needs_retarget | prerequisite review for BiRefNet stack |
| #24 | Phase 33C BiRefNet runtime verification | open, non-draft, mergeable | old phase stack | needs_retarget | prerequisite review for BiRefNet runtime evidence |
| #25 | Phase 33D real video BiRefNet frame mask test | open, non-draft, mergeable | old phase stack | needs_visual_review | require visual/artifact review before merge |
| #26 | Phase 33E text-behind-subject frame preview | open, non-draft, mergeable | old phase stack | needs_visual_review | require visual/artifact review before merge |
| #27 | Phase 34A enhancement model approval workflow | open, non-draft, mergeable | old phase stack | needs_retarget | prerequisite review for Real-ESRGAN stack |
| #28 | Phase 34B download approved Real-ESRGAN weights | open, non-draft, mergeable | old phase stack | needs_retarget | prerequisite review for Real-ESRGAN stack |
| #29 | Phase 34C Real-ESRGAN runtime verification | open, non-draft, mergeable | old phase stack | needs_retarget | prerequisite review for Real-ESRGAN stack |
| #30 | Phase 34D real video enhancement sample | open, non-draft, mergeable | old phase stack | needs_visual_review | require visual/artifact review before merge |
| #31 | Phase 34E FILM slow-motion review gate | closed, not merged | old phase stack | superseded | no merge; superseded by #34 |
| #34 | Phase 34E Real-ESRGAN policy decision | open, non-draft, mergeable | old phase stack | open_ready_needs_retarget | first preferred Real-ESRGAN candidate after owner review |
| #35 | Phase 35A SAM2 model approval workflow | open, non-draft, mergeable | old phase stack | needs_retarget | prerequisite review for SAM2 stack |
| #42 | Phase 35E segment text-behind-subject preview | open, non-draft, mergeable | old phase stack | needs_visual_review | visual review before #43 |
| #43 | Phase 35F SAM2 private feature E2E beta-readiness | open, non-draft, mergeable | old phase stack | needs_visual_review | candidate only after SAM2 prerequisites and owner review |
| #54 | Phase 38A FILM slow-motion approval workflow | open, non-draft, mergeable | old phase stack | needs_retarget | prerequisite review for FILM stack |
| #55 | Phase 38B download approved FILM artifacts | open, non-draft, mergeable | old phase stack | needs_retarget | prerequisite review for FILM stack |
| #58 | Phase 38C FILM runtime verification | open, non-draft, mergeable | old phase stack | needs_retarget | prerequisite review for FILM runtime evidence |
| #60 | Phase 38D real video FILM slow-motion sample | open, non-draft, mergeable | old phase stack | needs_visual_review | require visual/artifact review before merge |
| #63 | Phase 40A pro color image approval workflow | open, non-draft, mergeable | old phase stack | needs_retarget | prerequisite review for pro color stack |
| #65 | Phase 40B pro color image generated fixture runtime | open, non-draft, mergeable | old phase stack | open_ready_needs_retarget | candidate after #63 review |
| #67 | Phase 40C real video pro color image sample | open, non-draft, mergeable | old phase stack | needs_visual_review | require visual/artifact review before merge |
| #68 | Phase 40D pro color image private feature E2E | open, non-draft, mergeable | old phase stack | needs_visual_review | require visual/artifact review before merge |
| #73 | Phase 45A libass caption burn-in validation | open, non-draft, mergeable | old phase stack | needs_retarget | candidate after pro color stack decision |
| #75 | Phase 45B Remotion render validation | open, non-draft, mergeable | old phase stack | needs_retarget | candidate after libass review |
| #77 | Phase 45C OpenTimelineIO validation | open, non-draft, mergeable | old phase stack | needs_retarget | candidate after Remotion validation review |
| #80 | Phase 45D FFmpeg FFprobe final render hardening | open, non-draft, mergeable | old phase stack | open_ready_needs_retarget | candidate after OTIO review |
| #82 | Phase 45E full visual video private E2E | open, non-draft, mergeable | old phase stack | needs_visual_review | candidate only after all prerequisite Track A stack decisions |
| #83 | Phase 45F Track A visual video readiness closure | open, non-draft, mergeable | old phase stack | needs_retarget | final closure candidate after #82 |
| #99 | Foundation Prompt 13 tool readiness worker runtime checks | open, non-draft, mergeable | old foundation stack | historical_parallel_review | do not merge as part of Track A stack unless owner expands scope |
| #364 | Track A render export capability routing contract | merged | current integration base | merged | current source-of-truth owner contract |

## Preferred TRACKA-MERGE-1 Review Order

1. Reconfirm #380 and #364 remain merged into the integration branch.
2. Reconfirm every old Track A PR state, base, mergeability, diff scope, validation evidence, package-lock status, and blocker language.
3. Treat #31 as superseded by #34; do not reopen or merge it.
4. Decide whether to retarget the minimal ready evidence chain or supersede old runtime branches with a fresh current-source packet.
5. If human approval chooses retarget/merge, review in dependency order: BiRefNet prerequisites, Real-ESRGAN policy/sample, SAM2 E2E, FILM, pro color/Kornia/OpenColorIO/OpenImageIO, libass, Remotion, OpenTimelineIO, FFmpeg/FFprobe, full visual-video E2E, readiness closure.
6. Require human visual/artifact review before any real-sample or private-E2E PR merge.
7. Produce a merge report. Do not claim internal beta, external beta, production, public delivery, signed URL, final export, or broad media readiness.

## Explicitly Not Performed In TRACKA-RECON-0

- No PR was merged.
- No PR was closed.
- No PR was retargeted.
- No branch was force-pushed.
- No historical visual/video runtime was replayed.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
