# Activation Next Phase Runbook

This runbook starts after Phase 18 is reviewed and Phase 19 local baseline is available. It does not build images, deploy services, run `gcloud`, call providers, download models, add secrets, or process real media.

## After Phase 18

1. Review the Phase 18 audit, readiness state, and activation roadmap.
2. Confirm production-ready, external beta, paid production, and real user media remain blocked.
3. Merge the Phase 18 branch only after the activation smoke and existing production baseline checks pass.
4. Run Phase 19 local full smoke/static readiness baseline.
5. Review every failure, warning, and existing large-bundle build warning before moving on.
6. Proceed to container build only after Phase 19 passes and a human approves image names/tags.

## After Phase 19

1. Review `activation:local-baseline` static output and `--command-plan` output.
2. Confirm the report says Phase 20 is preparation-only and `dockerBuildAllowed=false`.
3. Resolve or document local baseline blockers and warnings.
4. Prepare Phase 20 image names/tags for human review.
5. Do not run Docker automatically from the local baseline command.

## After Phase 20

1. Review `activation:container-build:plan -- --image-tag <tag>` output.
2. Confirm image order is API, tool-readiness, CPU, QA, render, then GPU.
3. Humans may run the printed Docker build commands manually after approving image tags.
4. Capture human build logs and parse them with `activation:container-build:report`.
5. Proceed to Phase 21 only after required non-GPU image build evidence passes; GPU may remain deferred until GPU activation.

## After Phase 21

1. Review `activation:container-readiness:plan -- --image-tag <tag>` output before any human readiness run.
2. Humans may run container readiness manually only with explicit image variables and `REEDITPRO_CONFIRM_CONTAINER_READINESS=true`.
3. Parse local readiness logs with `activation:container-readiness:report -- --image-tag <tag> --log <path>`.
4. Proceed to Phase 22 only after the readiness report is reviewed and forbidden findings are resolved.
5. Do not deploy, push images, run `gcloud`, call providers, download models, add secrets, or process real media from Phase 21.

## After Phase 22

1. Review `activation:gcp-staging:plan -- --project <id> --image-tag <tag>` output.
2. Confirm staging resource names include `staging`, buckets are private, IAM is least-privilege, and secret plans contain names only.
3. Humans may copy `.env.gcp.staging.example` to an ignored local env file and set `REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true` only when ready to run setup manually.
4. Proceed to Phase 23 image push only after staging resources exist and the Phase 22 report has no blockers.
5. Do not automatically deploy services/jobs; runtime rollout is Phase 24/27.

## Before Container Build

- Confirm Docker scripts remain examples/human-run only.
- Confirm no npm script auto-builds or pushes production images.
- Confirm no GCP script is invoked by package scripts.
- Confirm Revideo remains evaluation-only and production-blocked.
- Confirm model/license blockers remain active until the Phase 26 approval workflow.

Phase 22 staging foundation setup preparation feeds Phase 23 image push. Phase 22 is still static/report-only for Codex; it is not deployment or launch approval.

## After Phase 25

1. Review the generated-fixture E2E results and confirm private artifact/QA evidence passed.
2. Confirm production, external beta, and real user media testing remain blocked.
3. Proceed to Phase 26 model-weight/license approval for the first speech/caption model only.

## After Phase 26

1. Review `activation:model-weight:summary`, `activation:model-approval:plan`, and `activation:model-approval:report`.
2. Confirm only `Systran/faster-whisper-tiny` is staging-approved for speech/caption planning.
3. Confirm the download command plan is text-only and no model files were downloaded or committed.
4. Proceed to Phase 26B to download only the approved tiny model into private staging storage.
5. Keep Phase 27 GPU deployment optional/deferred unless a later runtime decision requires it for the tiny speech/caption test.

## After Phase 26B

1. Review `activation:model-download:report` and confirm checksum/revision evidence exists.
2. Confirm model files were not committed and model storage is private.
3. Confirm only `Systran/faster-whisper-tiny` was downloaded and all larger/non-speech models remain blocked.
4. Run Phase 27A before any real media execution if no speech runtime image/job has loaded the approved model yet.
5. Keep Phase 28 blocked until a controlled speech/caption runtime path is explicitly approved.

## After Phase 27A

1. Review `activation:staging:speech-runtime:report` and the private Cloud Run job report.
2. Confirm the runtime copied only `Systran/faster-whisper-tiny` from private staging GCS and did not download from Hugging Face at runtime.
3. Confirm generated audio was the only media input and the transcript result completed cleanly.
4. Confirm GPU, providers, public access, secret values, production, external beta, and broad real user media testing remain blocked.
5. Proceed to Phase 28 only as an explicit controlled speech/caption-only real-video test.

## After Phase 28

1. Review `activation:first-video:speech-caption:report` and the private Phase 28 artifacts.
2. Confirm exactly one approved source video was processed and all artifacts are private.
3. Confirm transcript/caption generation passed and caption QA has no blocking findings.
4. Confirm production, external beta, broad real user media, providers, GPU, and final export remain blocked.
5. Proceed to Phase 29 only as an explicit controlled smart-cut + captions test.

## After Phase 29

1. Review `activation:real-video:smart-cut:report` and the private Phase 29 artifacts.
2. Confirm the run used only Phase 28 run `phase28-20260528T01552`.
3. Confirm SmartCutPlan, TimelineManifest, caption refs, and QA exist privately.
4. Confirm preview was skipped or private only, and final export remains blocked.
5. Proceed to Phase 30 only as an explicit controlled private final export test.

## After Phase 32

1. Review the private Phase 32 color-correction report and confirm final delivery passed only for the controlled private export.
2. Confirm production, external beta, broad real media, GPU, providers, model downloads, OpenColorIO/OpenImageIO, masks, enhancement, and Revideo remain blocked.
3. Proceed to Phase 33A only as a static mask model-weight/license approval workflow.

## After Phase 33A

1. Review `activation:mask-model-approval:plan`, `activation:mask-model-approval:report`, and `activation:mask-model-weight:summary`.
2. Confirm only `ZhengPeng7/BiRefNet` is staging-approved for representative-frame/single-frame background-removal planning.
3. Confirm SAM2 is evaluated-only and execution-blocked.
4. Confirm the BiRefNet download command plan is text-only and no model files were downloaded or committed.
5. Proceed to Phase 33B only to download/load approved BiRefNet weights into private staging storage.
6. Keep Phase 33C and Phase 33D blocked until checksum/runtime/mask QA evidence exists.

## After Phase 33B

1. Review `activation:mask-model-download:report` and confirm BiRefNet revision/checksum evidence exists in private staging storage.
2. Confirm only `ZhengPeng7/BiRefNet` was downloaded and SAM2 remains evaluated-only and execution-blocked.
3. Confirm custom code files are recorded but were not executed.
4. Confirm production, external beta, broad real media, GPU, providers, mask execution, and text-behind-subject remain blocked.
5. Proceed to Phase 33C only as explicit BiRefNet runtime verification using private GCS model storage.
6. Keep Phase 33D blocked until Phase 33C runtime loading and mask QA pass.

## After Phase 33C

1. Review `activation:birefnet-runtime:report` and the private Phase 33C Cloud Run report.
2. Confirm the runtime copied only `ZhengPeng7/BiRefNet` from private staging GCS and did not download from Hugging Face at runtime.
3. Confirm the only input was a generated synthetic image.
4. Confirm SAM2, providers, public access, secret values, production, external beta, broad real media, and text-behind-subject remain blocked.
5. Proceed to Phase 33D only if the private mask artifact exists and mask QA has no blocking failures.

## After Phase 33D

1. Review `activation:real-video:birefnet-frame-mask:report` and the private Phase 33D frame/mask artifacts.
2. Confirm exactly one representative frame was extracted from `phase32-20260528T13330`.
3. Confirm BiRefNet used only the private approved model snapshot and did not download from Hugging Face at runtime.
4. Confirm the mask, RGBA cutout, metadata, and QA artifacts exist privately with no blocking failures.
5. Confirm no full-video mask sequence, SAM2, providers, public access, secret values, Revideo, production, external beta, broad real media, or text-behind-subject execution occurred.
6. Proceed to Phase 33E only as controlled text-behind-subject planning for the approved Phase 33D representative-frame mask artifact set.

## After Phase 33E

1. Review `activation:text-behind-subject:frame-preview:report` and the private Phase 33E preview artifacts.
2. Confirm exactly one approved Phase 33D frame/mask/cutout set was used.
3. Confirm the fixed text content was `REEDITPRO`.
4. Confirm the private preview PNG, text layer plan, depth composition manifest, and QA report exist with no blocking failures.
5. Confirm no video processing, BiRefNet rerun, SAM2, GPU, providers, model downloads, public access, secret values, Revideo, production, external beta, broad real media, or full-video text-behind-subject occurred.
6. Proceed to Phase 34A only as a static enhancement/slow-motion model-weight/license approval workflow.

## After Phase 34A

1. Review `activation:enhancement-model-approval:plan`, `activation:enhancement-model-approval:report`, and `activation:enhancement-model-weight:summary`.
2. Confirm only `RealESRGAN_x4plus` is staging-approved for sample-first enhancement planning.
3. Confirm FILM is evaluated-only and download/execution-blocked.
4. Confirm the Real-ESRGAN download command plan is text-only and no model files were downloaded or committed.
5. Confirm production, external beta, broad real media, GPU, providers, enhancement execution, full-video enhancement, slow motion, public delivery, and Revideo remain blocked.
6. Proceed to Phase 34B only to download/load approved `RealESRGAN_x4plus` weights into private staging storage.
7. Keep Phase 34C and Phase 34D blocked until checksum/runtime/enhancement QA evidence exists.

## After Phase 34B

1. Review `activation:enhancement-model-download:report` and confirm Real-ESRGAN release/checksum evidence exists in private staging storage.
2. Confirm only `RealESRGAN_x4plus.pth` was downloaded and FILM remains evaluated-only and download/execution-blocked.
3. Confirm no alternate Real-ESRGAN, GFPGAN, facexlib, anime, x2plus, or realesr-general weights were downloaded.
4. Confirm production, external beta, broad real media, GPU, providers, enhancement execution, slow motion, and media processing remain blocked.
5. Proceed to Phase 34C only as explicit Real-ESRGAN runtime verification using private GCS model storage.
6. Keep Phase 34D blocked until Phase 34C runtime loading and enhancement QA pass.

## After Phase 34C

1. Review `activation:real-esrgan-runtime:report` and the private Phase 34C Cloud Run report.
2. Confirm the runtime copied only `RealESRGAN_x4plus.pth` from private staging GCS and did not download from GitHub or any model host at runtime.
3. Confirm the only input was a generated synthetic image and the enhanced output is private.
4. Confirm FILM, alternate Real-ESRGAN weights, GFPGAN/facexlib weights, full-video enhancement, slow motion, providers, public access, secret values, Revideo, production, external beta, and broad real media remain blocked.
5. Proceed to Phase 34D only if the private enhanced synthetic-image artifact exists and enhancement QA has no blocking failures.

## After Phase 34D

1. Review `activation:real-video:enhancement-sample:report` and the private Phase 34D sample artifacts.
2. Confirm exactly one bounded sample crop was created from `phase33d-20260528T161056`.
3. Confirm the runtime copied only `RealESRGAN_x4plus.pth` from private staging GCS and did not download from GitHub or any model host at runtime.
4. Confirm the input sample, enhanced sample, before/after metadata, and QA report exist privately with no blocking failures.
5. Confirm no full-frame enhancement, full-video enhancement, FILM, slow motion, providers, public access, secret values, Revideo, production, external beta, or broad real media occurred.
6. Proceed to Phase 34E only as a non-mutating Real-ESRGAN broader-scope policy decision after the bounded sample.

## After Phase 34E

1. Review `activation:real-esrgan-policy-decision:report` and `docs/activation-phase-34e-real-esrgan-policy-decision-results.md`.
2. Confirm Phase 34D evidence is linked and exactly one bounded sample is recorded.
3. Confirm human visual review is still required unless an explicit review artifact exists.
4. Confirm full-frame enhancement, full-video enhancement, blind full-video enhancement, production, external beta, broad real media, FILM, slow motion, providers, public access, and Revideo remain blocked.
5. Confirm any future Real-ESRGAN work is limited to human review or separately approved additional bounded-sample planning.
6. Proceed to Phase 35A only as the SAM2 model approval workflow.
7. Keep FILM/slow-motion outside Phase 34E; FILM is a future Phase 38A model approval workflow candidate only.

## After Phase 35A

1. Review `activation:sam2-model-approval:plan`, `activation:sam2-model-approval:report`, and `activation:sam2-model-weight:summary`.
2. Confirm Phase 35B is limited to official SAM2.1 tiny source/license verification plus private checkpoint/config download.
3. Confirm no SAM2 checkpoint checksum is recorded, no private SAM2 model artifact exists, and no runtime image/job is approved before Phase 35B runs.
4. Confirm SAM2 download, runtime, temporal tracking, full-video masks, full-video text-behind-subject, providers, public access, Revideo, production, external beta, and broad real media remain blocked.
5. Proceed to Phase 35B only if Codex verifies official SAM2 source/license evidence and the exact approved checkpoint/config URLs.
6. Keep Phase 35C, 35D, and 35E blocked until the preceding SAM2 download/runtime/temporal QA phases pass.
7. Keep FILM/slow-motion outside Phase 35; FILM remains a future Phase 38A model approval workflow candidate only.

## After Phase 35B

1. Review `activation:sam2-model-download:report` and `docs/activation-phase-35b-download-approved-sam2-model-results.md`.
2. Confirm only `sam2.1_hiera_tiny.pt`, `sam2.1_hiera_t.yaml`, checksum manifest, model tree manifest, and source evidence were uploaded.
3. Confirm the target path is private staging GCS: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/`.
4. Confirm no SAM2 runtime, GPU job, media processing, public access, provider call, Docker build/push, Cloud Run deploy, or Revideo path occurred.
5. Proceed to Phase 35C only as generated/synthetic SAM2 runtime verification using the private checkpoint/config.
6. Keep Phase 35D real-video temporal tracking and Phase 35E full-video text-behind-subject blocked until runtime and temporal QA pass.
