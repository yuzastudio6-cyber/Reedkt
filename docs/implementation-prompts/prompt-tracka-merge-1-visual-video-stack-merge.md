# TRACKA-MERGE-1 Visual/Video Stack Merge Review Prompt

## Summary

Run a human-approved Track A merge/close/retarget review for historical visual/video readiness PRs after TRACKA-RECON-0. This prompt is for a later phase and must not be executed by TRACKA-RECON-0.

## Repository

Repository: `yuzastudio6-cyber/Reedkt`

Target base: `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration`

Required current-source evidence: PR #380 merged at or after `809c4ec3d3c54c7629d90a35fcc89eeff527cf2b`, and Track A TOOL-STUDY-0 PR #364 merged.

## Candidate PRs

Inspect #18, #19, #21, #22, #23, #24, #25, #26, #27, #28, #29, #30, #31, #34, #35, #42, #43, #54, #55, #58, #60, #63, #65, #67, #68, #73, #75, #77, #80, #82, #83, #99, and #364.

## Required Gates Before Any PR Mutation

- Confirm the PR is open unless the intended action is to record already-closed/superseded status.
- Confirm non-draft for merge candidates.
- Confirm mergeable after any owner-approved retarget.
- Confirm validation evidence exists.
- Confirm package-lock status.
- Confirm no unresolved blocker in PR body.
- Confirm no runtime/tool/worker/provider/Supabase execution claim outside historical evidence.
- Confirm no public artifact, signed URL, internal beta, external beta, production, or final delivery unlock.
- Confirm visual/artifact review for real-sample and private-E2E PRs.
- Confirm user explicitly approved the merge, close, or retarget action.

## Preferred Review Order

1. Reconfirm #31 remains superseded by #34.
2. Reconcile Real-ESRGAN policy and sample chain.
3. Reconcile SAM2 private E2E chain.
4. Reconcile FILM chain.
5. Reconcile pro color/Kornia/OpenColorIO/OpenImageIO chain.
6. Reconcile libass, Remotion, OpenTimelineIO, FFmpeg, and FFprobe render/export validation chain.
7. Reconcile full visual-video private E2E #82.
8. Reconcile Track A readiness closure #83.
9. Produce final merge/closure report.

## Explicitly Blocked In TRACKA-MERGE-1

- Runtime execution.
- Tool execution.
- Worker execution.
- Provider/model calls.
- Media processing.
- Browser capture.
- Map rendering.
- FFmpeg, FFprobe, Remotion, libass, OpenTimelineIO, OpenColorIO, OpenImageIO, Kornia, BiRefNet, SAM2, Real-ESRGAN, or FILM execution.
- Supabase mutation, SQL, migrations, schema/RLS changes.
- GCS upload or storage transfer.
- Signed URL creation.
- Public artifact creation.
- Credit, Stripe, or payment mutation.
- Internal beta, external beta, production, paid production, or final delivery unlock.

## Final Report Requirements

Report branch/base, PRs merged, PRs closed as superseded, PRs retargeted, PRs left open, visual review status, package-lock status, validation evidence, Supabase classification, runtime blocked scope, human actions, and next phase.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
