# Open PR Stack Map

Generated: `2026-06-12T20:45:16.207Z`

Repository: `yuzastudio6-cyber/Reedkt`

Selected audit base: `codex/rp-activation-52h-cross-workstream-handoff-tracking`

Default branch observed: `codex/reeditpro-web-ui-shell`

Base-selection evidence:

- PR #205: [foundation] XCHAT-0 cross-chat ownership registry; head `codex/rp-foundation-xchat-0-cross-chat-ownership-registry`; base `codex/rp-foundation-26c-supabase-advisor-draft-remediation-packet`; state `OPEN`; merge state `CLEAN`.
- PR #222: [activation] Phase 52H cross workstream handoff tracking; head `codex/rp-activation-52h-cross-workstream-handoff-tracking`; base `codex/rp-activation-52g-controlled-internal-test-go-no-go-handoff-dispatch`; state `OPEN`; merge state `CLEAN`.

Open PR metadata:

- Initial open PR command returned 200 PRs.
- `openPrListLimitHit`: `true`
- Higher limit used: `1000`
- Audited open PR count: 347
- Draft PR count: 21
- Non-clean merge-state PR count: 2
- Closed sample count: 4
- Closed sample currently only PR #31: `false`

## Workstreams

| Workstream | Open PRs |
| --- | --- |
| ACTIVATION | 99 |
| SUPABASE_RLS_STORAGE_DATABASE | 60 |
| SUPABASE_SOUND_AUDIO | 48 |
| MODEL_ORCHESTRATION_PROVIDER_GATEWAY | 34 |
| FOUNDATION_COORDINATION | 33 |
| TRACK_A_CREATIVE_GRAPHICS | 28 |
| PRODUCT_INTERNAL_TESTING | 14 |
| TRACK_B_MEDIA_PROCESSING | 11 |
| WORKER_RUNTIME_JOBS | 10 |
| MODEL_ORCHESTRATION_PLAN_SNAPSHOT | 3 |
| AI_TOOLS | 2 |
| CROSS_CHAT_COORDINATION | 2 |
| CODEX | 1 |
| TOOL_ROUTE_DRY_RUN | 1 |
| RELEASE | 1 |


## Classifications

| Classification | Open PRs |
| --- | --- |
| parallel_candidate | 158 |
| duplicate_risk | 137 |
| canonical | 28 |
| draft_hold | 21 |
| unknown | 2 |
| blocked_hold | 1 |


## Parent/Child Edges

| Parent PR | Child PR | Child base |
| --- | --- | --- |
| #2 | #3 | `codex/rp-activation-18-merge-baseline-audit` |
| #3 | #4 | `codex/rp-activation-19-local-readiness-baseline` |
| #4 | #5 | `codex/rp-activation-20-container-build-reporting` |
| #5 | #6 | `codex/rp-activation-20b-direct-docker-install-build-non-gpu` |
| #6 | #7 | `codex/rp-activation-21-container-readiness-validation` |
| #7 | #8 | `codex/rp-activation-21b-run-non-gpu-container-readiness` |
| #8 | #9 | `codex/rp-activation-22-gcp-staging-foundation` |
| #9 | #10 | `codex/rp-activation-22b-complete-staging-foundation-after-quota` |
| #10 | #11 | `codex/rp-activation-23b-push-non-gpu-images` |
| #11 | #12 | `codex/rp-activation-24b-retry-deploy-staging-non-gpu-amd64` |
| #12 | #13 | `codex/rp-activation-25-staging-generated-fixture-e2e` |
| #13 | #14 | `codex/rp-activation-26-model-license-approval-workflow` |
| #14 | #15 | `codex/rp-activation-26b-download-approved-speech-model` |
| #15 | #16 | `codex/rp-activation-27a-staging-cpu-speech-runtime` |
| #16 | #17 | `codex/rp-activation-28-first-real-video-speech-caption-test` |
| #17 | #18 | `codex/rp-activation-29-real-video-smart-cut-caption-test` |
| #18 | #19 | `codex/rp-activation-30-real-video-private-export-test` |
| #19 | #20 | `codex/rp-activation-30b-render-iam-retry-private-export` |
| #20 | #21 | `codex/rp-activation-31-real-video-audio-cleanup-test` |
| #21 | #22 | `codex/rp-activation-32-real-video-color-correction-test` |
| #22 | #23 | `codex/rp-activation-33a-mask-model-approval-workflow` |
| #23 | #24 | `codex/rp-activation-33b-download-approved-birefnet-model` |
| #24 | #25 | `codex/rp-activation-33c-birefnet-runtime-verification` |
| #25 | #26 | `codex/rp-activation-33d-real-video-birefnet-frame-mask-test` |
| #26 | #27 | `codex/rp-activation-33e-text-behind-subject-frame-preview` |
| #27 | #28 | `codex/rp-activation-34a-enhancement-slowmotion-model-approval` |
| #28 | #29 | `codex/rp-activation-34b-download-approved-real-esrgan-model` |
| #29 | #30 | `codex/rp-activation-34c-real-esrgan-runtime-verification` |
| #32 | #33 | `codex/reeditpro-production-readiness-audit-and-foundation` |
| #30 | #34 | `codex/rp-activation-34d-real-video-enhancement-sample` |
| #34 | #35 | `codex/rp-activation-34e-real-esrgan-policy-decision` |
| #35 | #36 | `codex/rp-activation-35a-sam2-model-approval-workflow` |
| #36 | #37 | `codex/rp-activation-35b-download-approved-sam2-model` |
| #37 | #38 | `codex/rp-activation-44a-web-first-platform-boundaries` |
| #36 | #39 | `codex/rp-activation-35b-download-approved-sam2-model` |
| #38 | #40 | `codex/rp-activation-44b-web-app-structure-migration` |
| #39 | #41 | `codex/rp-activation-35c-sam2-runtime-verification` |
| #41 | #42 | `codex/rp-activation-35d-real-video-sam2-temporal-mask-test` |
| #42 | #43 | `codex/rp-activation-35e-segment-text-behind-subject-preview` |
| #43 | #44 | `codex/rp-activation-35f-sam2-private-feature-e2e-beta-readiness` |
| #44 | #45 | `codex/rp-activation-36a-audio-ai-approval-workflow` |
| #45 | #46 | `codex/rp-activation-36b-download-approved-deepfilternet-artifacts` |
| #46 | #47 | `codex/rp-activation-36c-deepfilternet-runtime-verification` |
| #47 | #48 | `codex/rp-activation-36d-real-video-deepfilternet-audio-cleanup-sample` |
| #48 | #49 | `codex/rp-activation-36e-deepfilternet-private-audio-feature-e2e` |
| #49 | #50 | `codex/rp-activation-36f-audio-system-internal-beta-readiness` |
| #50 | #51 | `codex/rp-activation-36g-audio-stack-demucs-separation-e2e` |
| #51 | #52 | `codex/rp-activation-37a-paddleocr-model-runtime-approval` |
| #51 | #53 | `codex/rp-activation-37a-paddleocr-model-runtime-approval` |
| #43 | #54 | `codex/rp-activation-35f-sam2-private-feature-e2e-beta-readiness` |
| #54 | #55 | `codex/rp-activation-38a-film-slowmotion-approval-workflow` |
| #53 | #56 | `codex/rp-activation-37b-paddleocr-exact-assets-download` |
| #56 | #57 | `codex/rp-activation-37c-generated-ocr-runtime-verification` |
| #55 | #58 | `codex/rp-activation-38b-download-approved-film-artifacts` |
| #57 | #59 | `codex/rp-activation-37d-controlled-real-video-ocr-safe-zone-gate` |
| #58 | #60 | `codex/rp-activation-38c-film-runtime-verification` |
| #59 | #61 | `codex/rp-activation-37d-controlled-real-video-ocr-safe-zone-execution` |
| #61 | #62 | `codex/rp-activation-37e-ocr-safe-zone-caption-render-qa` |
| #60 | #63 | `codex/rp-activation-38d-real-video-film-slowmotion-sample` |
| #62 | #64 | `codex/rp-activation-39a-qwen3-vl-vllm-approval-workflow` |
| #63 | #65 | `codex/rp-activation-40a-pro-color-image-approval-workflow` |
| #64 | #66 | `codex/rp-activation-39b-qwen3-vl-exact-assets-private-staging` |
| #65 | #67 | `codex/rp-activation-40b-pro-color-image-generated-fixture-runtime` |
| #67 | #68 | `codex/rp-activation-40c-real-video-pro-color-image-sample` |
| #1 | #69 | `codex/reeditpro-planning-stack` |
| #69 | #70 | `codex/rp-foundation-00-source-of-truth` |
| #70 | #71 | `codex/rp-foundation-01-production-architecture-freeze` |
| #71 | #72 | `codex/rp-foundation-02-supabase-schema-review-validation` |
| #68 | #73 | `codex/rp-activation-40d-pro-color-image-private-feature-e2e` |
| #72 | #74 | `codex/rp-foundation-02a-schema-gap-fix-plan` |
| #73 | #75 | `codex/rp-activation-45a-libass-caption-burnin-validation` |
| #74 | #76 | `codex/rp-foundation-03-auth-profile-workspace-rls-production-path` |
| #75 | #77 | `codex/rp-activation-45b-remotion-render-validation` |
| #76 | #78 | `codex/rp-foundation-03a-auth-rls-fix-validation` |
| #78 | #79 | `codex/rp-foundation-03b-auth-rls-validation-environment-fix` |
| #77 | #80 | `codex/rp-activation-45c-opentimelineio-validation` |
| #79 | #81 | `codex/rp-foundation-03c-validation-toolchain-repair` |
| #80 | #82 | `codex/rp-activation-45d-ffmpeg-ffprobe-final-render-hardening` |
| #82 | #83 | `codex/rp-activation-45e-full-visual-video-private-e2e` |
| #81 | #84 | `codex/rp-foundation-04-storage-upload-production-runtime` |


## Draft Holds

| PR | Title | Base | Head |
| --- | --- | --- | --- |
| #1 | [codex] Publish ReeditPro planning and backend readiness stack | `codex/reeditpro-web-ui-shell` | `codex/reeditpro-planning-stack` |
| #308 | test/supabase: validate sound draft with harness | `codex/supabase-sound-4-harness-config-create` | `codex/supabase-sound-4-retry-harness-2-local-validation` |
| #312 | [track-a] Group B private preview execution packet | `codex/rp-tracka-gd-groupb-handoff-1-private-preview-composition-plan` | `codex/rp-tracka-gd-groupb-handoff-2-private-preview-execution-packet` |
| #313 | SUPABASE_SOUND local harness validation 3 result | `codex/supabase-sound-4-retry-harness-2-local-validation` | `codex/supabase-sound-4-retry-harness-3-local-validation` |
| #316 | SUPABASE_SOUND local harness ports fix | `codex/supabase-sound-4-retry-harness-3-local-validation` | `codex/supabase-sound-4-harness-ports-fix` |
| #317 | [track-a] Group B private preview execution | `codex/rp-tracka-gd-groupb-handoff-2-private-preview-execution-packet` | `codex/rp-tracka-gd-groupb-handoff-3-private-preview-execution` |
| #319 | SUPABASE_SOUND local harness validation 4 result | `codex/supabase-sound-4-harness-ports-fix` | `codex/supabase-sound-4-retry-harness-4-local-validation` |
| #321 | [track-a] Group B private preview QA review | `codex/rp-tracka-gd-groupb-handoff-3-private-preview-execution` | `codex/rp-tracka-gd-groupb-handoff-4-private-preview-qa-review` |
| #323 | [model] Qwen DeepSeek provider dry-run fix | `codex/rp-model-orchestration-qwen-deepseek-provider-dry-run` | `codex/rp-model-orchestration-qwen-deepseek-provider-dry-run-fix` |
| #326 | [model] Qwen DeepSeek secret setup verification | `codex/rp-model-orchestration-qwen-deepseek-provider-dry-run-fix` | `codex/rp-model-orchestration-qwen-deepseek-secret-setup` |
| #329 | [model] Qwen DashScope synthetic dry-run rerun | `codex/rp-model-orchestration-qwen-deepseek-secret-setup` | `codex/rp-model-orchestration-qwen-deepseek-provider-dry-run-rerun` |
| #332 | [model] Plan snapshot contract source mismatch after provider dry-run | `codex/rp-model-orchestration-qwen-deepseek-provider-dry-run-rerun` | `codex/rp-model-orchestration-plan-snapshot-contract-ready` |
| #333 | [model] MODEL-DRYRUN-2 calibrated Qwen DeepSeek synthetic provider dry run | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | `codex/rp-model-dryrun-2-calibrated-qwen-deepseek-synthetic-provider-dry-run` |
| #335 | [model] Plan snapshot contract readiness fix | `codex/rp-model-orchestration-plan-snapshot-contract-ready` | `codex/rp-model-orchestration-plan-snapshot-contract-fix` |
| #336 | [model] MODEL-DRYRUN-2A provider token guardrail fixes | `codex/rp-model-dryrun-2-calibrated-qwen-deepseek-synthetic-provider-dry-run` | `codex/rp-model-dryrun-2a-provider-token-guardrail-fixes` |
| #338 | [worker] Runtime unlock repo audit | `codex/rp-model-orchestration-plan-snapshot-contract-fix` | `codex/rp-worker-runtime-unlock-0-repo-audit` |
| #339 | [plan] PLAN-SNAPSHOT-0 approved plan snapshot contract | `codex/rp-model-dryrun-2a-provider-token-guardrail-fixes` | `codex/rp-plan-snapshot-0-approved-plan-snapshot-contract` |
| #344 | [worker] WORKER-0 worker runtime unlock repo audit | `codex/rp-plan-snapshot-0-approved-plan-snapshot-contract` | `codex/rp-worker-0-worker-runtime-unlock-repo-audit` |
| #345 | [worker] WORKER-1 worker runtime contract hardening and dry-run plan | `codex/rp-worker-0-worker-runtime-unlock-repo-audit` | `codex/rp-worker-1-worker-runtime-contract-hardening-dry-run-plan` |
| #348 | [release] MERGE-0 milestone PR stack audit and merge readiness packet | `codex/rp-worker-1-worker-runtime-contract-hardening-dry-run-plan` | `codex/rp-merge-0-milestone-pr-stack-audit` |
| #351 | [worker] Runtime dry-run contract review | `codex/rp-model-orchestration-plan-snapshot-dry-run-validation` | `codex/rp-worker-runtime-unlock-2-dry-run-contract-review` |


## PR #346

PR #346 is no longer open in live GitHub metadata. Current state is `MERGED`; this audit records the prompt's open/draft expectation as stale and does not infer any follow-up merge readiness.

| PR | State | Draft | Merge state | Base | Head |
| --- | --- | --- | --- | --- | --- |
| #346 | MERGED | false | UNKNOWN | `codex/rp-worker-runtime-dry-run-approval-after-repo-audit` | `codex/rp-worker-runtime-noop-dry-run-execution` |


## Safety Classification

This audit is metadata-only. It did not merge, close, rebase, or retarget any PR. It did not execute runtime paths, mutate Supabase, call providers, create public artifacts, issue signed URLs, or unlock production, external beta, or paid production.
