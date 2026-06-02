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

## After Phase 35C

1. Review `activation:sam2-runtime:report` and `docs/activation-phase-35c-sam2-runtime-verification-results.md`.
2. Confirm the runtime copied only `sam2.1_hiera_tiny.pt` and `sam2.1_hiera_t.yaml` from private staging GCS and verified Phase 35B checksums.
3. Confirm the only input was a generated synthetic five-frame sequence.
4. Confirm the private frame, mask, overlay, metadata, QA, and report artifacts exist with no blocking failures.
5. Confirm no real video, real user media, full-video mask, full-video text-behind-subject, providers, public access, Revideo, FILM, slow motion, production, external beta, or broad real media occurred.
6. Proceed to Phase 35D only as controlled short real-video temporal mask tracking planning/execution with a very short approved segment.

## After Phase 35D

1. Review `activation:real-video:sam2-temporal-mask:report` and `docs/activation-phase-35d-real-video-sam2-temporal-mask-results.md`.
2. Confirm the only source video was the approved Phase 32 private export and the only anchor evidence came from Phase 33D.
3. Confirm the selected segment was 6.9s-8.9s, no longer than 2.0 seconds, with no more than 12 extracted frames.
4. Confirm the runtime copied only the Phase 35B private SAM2.1 tiny checkpoint/config and did not download model weights at runtime.
5. Confirm the prompt was derived from the Phase 33D mask/frame evidence, not raw chat or untracked coordinates.
6. Confirm private segment frames, masks, overlays, metadata, QA, and report artifacts exist with no blocking failures.
7. Confirm no arbitrary media, full-video masks, full-video text-behind-subject, providers, public access, Revideo, FILM, slow motion, production, external beta, or broad real media occurred.
8. Proceed to Phase 35E only as controlled segment text-behind-subject preview planning/execution if Phase 35D QA passes.

## After Phase 35E

1. Review `activation:segment-text-behind-subject-preview:report` and `docs/activation-phase-35e-segment-text-behind-subject-preview-results.md`.
2. Confirm the only source run was `phase35d-20260530T004442`.
3. Confirm the selected segment remained 6.9s-8.9s, 2.0 seconds, 10 frames, and 768x432.
4. Confirm the fixed text content was `REEDITPRO`.
5. Confirm private preview frames, composition metadata, QA, and report artifacts exist with no blocking failures.
6. Confirm preview clip generation, if absent, is documented as optional and no final export was created.
7. Confirm no arbitrary media, full-video masks, full-video text-behind-subject, providers, public access, Revideo, FILM, slow motion, Real-ESRGAN, production, external beta, or broad real media occurred.
8. Proceed to Phase 35F only as the private SAM2 feature E2E beta-readiness gate for the approved controlled video chain. Do not treat Phase 35E as full-video text-behind-subject, beta, or production approval.

## After Phase 35F

1. Review `activation:sam2-feature-e2e:report` and `docs/activation-phase-35f-sam2-feature-e2e-beta-readiness-results.md`.
2. Confirm the approved source was the Phase 32 private export, with local source used only as matching evidence if present.
3. Confirm the structured approved plan snapshot existed before worker execution and `rawPromptExecution=false`.
4. Confirm the preview scope was bounded to 768x432, <= 8 fps, and <= 125 frames.
5. Confirm private SAM2 masks, text-behind-subject preview frames, private review manifest, QA, and report artifacts exist with no blocking failures.
6. If fallback segment scope was used, mark readiness as segment-level internal testing only, not full SAM2 feature beta candidate.
7. Confirm no arbitrary media, public access, providers, Revideo, FILM, slow motion, Real-ESRGAN, final export, production, external beta, paid production, or broad real media occurred.
8. Proceed to Phase 36A only as a separate audio AI approval workflow after Phase 35F report is recorded. Do not treat Phase 35F as external beta or paid production approval.

## After Phase 38A

1. Review `activation:film-slowmotion-approval:plan`, `activation:film-slowmotion-approval:report`, and `activation:film-tool:summary`.
2. Confirm Phase 38A is Track A visual/video only and is based on the Phase 35F Track A branch, not Track B audio/OCR branches.
3. Confirm official FILM source, Apache-2.0 license, project page, and README checkpoint-source evidence are recorded.
4. Confirm the recommended Phase 38B candidate is `film_net/Style/saved_model` from the official README Google Drive TF2 Saved Models folder.
5. Confirm Phase 38B readiness is limited to exact artifact download/load planning with checksum and private GCS storage evidence.
6. Confirm FILM download, FILM runtime, slow-motion execution, real-video slow motion, full-video interpolation, providers, Revideo, public access, production, external beta, paid production, and broad real media remain blocked.
7. Proceed to Phase 38B only as FILM download/load to private staging GCS; do not run FILM or process media in Phase 38B.

## After Phase 38B

1. Review `activation:film-model-download:report` and `docs/activation-phase-38b-download-approved-film-artifacts-results.md`.
2. Confirm the only downloaded model tree was `film_net/Style/saved_model` from the official README Google Drive TF2 Saved Models folder.
3. Confirm the aggregate checksum is `6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b`.
4. Confirm all FILM artifacts and evidence manifests are under the private generated-assets model-weight prefix.
5. Confirm no FILM runtime, slow motion, generated-frame interpolation, real-video slow motion, full-video interpolation, Docker, Cloud Run, providers, Revideo, public access, production, external beta, paid production, or broad real media occurred.
6. Proceed to Phase 38C only as generated-frame FILM runtime verification using the private Phase 38B artifact tree and checksum evidence.

## After Phase 38C

1. Review `activation:film-runtime:report` and `docs/activation-phase-38c-film-runtime-verification-results.md`.
2. Confirm the runtime used only the private Phase 38B `film_net/Style/saved_model` tree and checksum `6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b`.
3. Confirm the input frames were generated synthetic frames only and one private midpoint interpolation artifact was produced.
4. Confirm the Cloud Run job was CPU-only with 4 CPU, 8Gi memory, parallelism 1, max retries 0, and the staging CPU worker service account.
5. Confirm no real video, full-video interpolation, real-video slow motion, providers, Revideo, public output, production, external beta, paid production, or broad real media occurred.
6. Proceed to Phase 38D only for one controlled selected real-video slow-motion sample if Phase 38C QA passed.

## After Phase 38D

1. Review `activation:real-video:film-slowmotion:report` and `docs/activation-phase-38d-real-video-film-slowmotion-results.md`.
2. Confirm the run used only the approved Phase 32 private export and private Phase 38B FILM model tree.
3. Confirm the segment was bounded to `6.9835s-8.4835s`, 9 source frames at 512x288, and 17 preview frames.
4. Confirm source frames, interpolated frames, optional preview MP4, metadata, and QA artifacts exist only under private Phase 38D GCS prefixes.
5. Confirm no full-video interpolation, audio stretch, final delivery export, providers, Revideo, Track B tools, public output, production, external beta, paid production, broad real media, or arbitrary media occurred.
6. Proceed to Phase 38E only as a private FILM feature E2E readiness gate if Phase 38D QA passed.

## After Phase 40A

1. Review `activation:pro-color-image-approval:plan`, `activation:pro-color-image-approval:report`, and `activation:pro-color-tool:summary`.
2. Confirm the preferred Phase 38E base was unavailable and Phase 40A was based on completed Phase 38D as the documented Track A fallback.
3. Confirm official source/license evidence is recorded for OpenColorIO, OpenImageIO, and Kornia.
4. Confirm tool ownership is explicit: OpenColorIO owns color management and LUT/look transforms, OpenImageIO owns image/frame I/O and metadata validation, Kornia owns local helper metrics and generated-fixture visual QA, and FFmpeg/FFprobe keeps existing video probe/decode/extraction/export integrity scope.
5. Confirm all future command plans are text-only and blocked in Phase 40A.
6. Confirm runtime install, generated-fixture execution, real-video pro color/image execution, final delivery, providers, Revideo, public output, production, external beta, paid production, and broad real media remain blocked.
7. Proceed to Phase 40B only as generated-fixture pro color/image runtime verification; do not process real video or install runtime dependencies from Phase 40A.

## After Phase 40B

1. Review `activation:pro-color-image-runtime:report` and `docs/activation-phase-40b-pro-color-image-runtime-results.md`.
2. Confirm the runtime used only generated `256x256` color bars, gradient, and alpha checker fixtures.
3. Confirm OpenColorIO, OpenImageIO, and Kornia each have explicit pass/block evidence; do not treat a missing runtime import as a pass.
4. Confirm artifacts exist only under private Phase 40B generated-assets and QA prefixes.
5. Confirm no real video, user media, final delivery, public output, providers, Revideo, Track B tools, production, external beta, paid production, or broad real media were enabled.
6. Proceed to Phase 40C only as one controlled real-video pro color/image sample if Phase 40B mandatory QA gates pass.

## After Phase 40C

1. Review `activation:real-video:pro-color-image:report` and `docs/activation-phase-40c-real-video-pro-color-image-results.md`.
2. Confirm the run used only the approved Phase 32 private export and Phase 40B QA evidence.
3. Confirm the sample was bounded to timestamps `0.5`, `7.7335`, and `14.5`, three frames total, and 768x432 output frames.
4. Confirm OpenImageIO, OpenColorIO, and Kornia each have explicit real-frame pass/block evidence.
5. Confirm sample frames, transformed frames, contact sheet, metadata, QA, and report artifacts exist only under private Phase 40C GCS prefixes.
6. Confirm no arbitrary media, full-video pro color/image, full 4K frames, final delivery export, providers, Revideo, Track B tools, public output, production, external beta, paid production, or broad real media occurred.
7. Proceed to Phase 40D only as a private pro color/image feature E2E readiness gate if Phase 40C mandatory QA gates passed.

## After Phase 40D

1. Review `activation:pro-color-image-feature-e2e:report` and `docs/activation-phase-40d-pro-color-image-feature-e2e-results.md`.
2. Confirm run `phase40d-20260531T12493` used only the approved Phase 32 private export and Phase 40C QA report.
3. Confirm the approved Phase 40D plan snapshot, source validation, sample manifest, contact sheet, private review manifest, QA JSON, and report artifacts exist only under private Phase 40D GCS prefixes.
4. Confirm OpenImageIO, OpenColorIO, and Kornia feature gates passed on the bounded three-frame 768x432 sample.
5. Confirm no arbitrary media, full-video pro color/image, full 4K frames, final delivery export, providers, Revideo, Track B tools, public output, production, external beta, paid production, or broad real media occurred.
6. Phase 45A is complete only for libass caption burn-in validation. Phase 40D does not approve product beta, production, public delivery, or full-video pro color/image.

## After Phase 45A

1. Review `activation:libass-burnin-validation:report` and `docs/activation-phase-45a-libass-burnin-validation-results.md`.
2. Confirm run `phase45a-20260531T19033` used only the approved Phase 32 private export and Phase 28 ASS caption sidecar.
3. Confirm the approved plan snapshot, source validation, caption validation, private burn-in preview MP4, FFprobe preview validation, QA JSON, and Phase 45A report artifacts exist only under private Phase 45A GCS prefixes.
4. Confirm FFmpeg/libass burn-in and FFprobe preview decode gates passed on the bounded 5-second private preview.
5. Confirm no arbitrary media, newly generated captions, final delivery export, providers, Revideo, Track B tools, public output, production, external beta, paid production, or broad real media occurred.
6. Proceed to Phase 45B only as Remotion render validation. Phase 45A does not approve final delivery, product beta, production, public delivery, or broad real media.

## After Phase 45B

1. Review `activation:remotion-render-validation:report` and `docs/activation-phase-45b-remotion-render-validation-results.md`.
2. Confirm run `phase45b-20260531T19552` used only the approved Phase 32 private export and Phase 45A private preview/report evidence.
3. Confirm the approved plan snapshot, source validation, Remotion render metadata, private Remotion preview MP4, FFprobe preview validation, QA JSON, and Phase 45B report artifacts exist only under private Phase 45B GCS prefixes.
4. Confirm Remotion render invocation and FFprobe preview decode gates passed on the bounded 5-second private preview.
5. Confirm no arbitrary media, final delivery export, providers, Revideo, Track B tools, public output, production, external beta, paid production, or broad real media occurred.
6. Proceed to Phase 45C only as OpenTimelineIO timeline validation. Phase 45B does not approve final delivery, product beta, production, public delivery, or broad real media.

## After Phase 45C

1. Review `activation:opentimelineio-validation:report` and `docs/activation-phase-45c-opentimelineio-validation-results.md`.
2. Confirm run `phase45c-20260531T20404` referenced only the approved Phase 32 private export, Phase 45A private preview/report, and Phase 45B private preview/report.
3. Confirm the approved plan snapshot, source validation, OTIO-compatible timeline JSON, timeline validation JSON, QA JSON, and Phase 45C report artifacts exist only under private Phase 45C GCS prefixes.
4. Confirm source integrity, Phase 45A/45B evidence, OTIO schema, timeline duration bounds, clip references, caption/render references, privacy, no-final-delivery, and blocked-feature gates passed.
5. Confirm no media processing, arbitrary media, final delivery export, providers, Revideo, Track B tools, public output, production, external beta, paid production, or broad real media occurred.
6. Proceed to Phase 45D only as FFmpeg/FFprobe final render/export hardening. Phase 45C does not approve final delivery, product beta, production, public delivery, or broad real media.

## After Phase 45D

1. Review `activation:final-render-hardening:report` and `docs/activation-phase-45d-ffmpeg-ffprobe-final-render-hardening-results.md`.
2. Confirm run `phase45d-20260531T22235` used only the approved Phase 32 private source plus Phase 45A, Phase 45B, and Phase 45C private evidence.
3. Confirm the approved plan snapshot, source validation, evidence validation, private hardened review export MP4, FFprobe export validation, QA JSON, and Phase 45D report artifacts exist only under private Phase 45D GCS prefixes.
4. Confirm FFmpeg export, FFprobe validation, codec/container integrity, duration bounds, audio/video integrity, private artifacts, no-public-access, no-final-delivery, and blocked-feature gates passed.
5. Confirm no arbitrary media, user final delivery, public delivery, providers, Revideo, Track B tools, production, external beta, paid production, or broad real media occurred.
6. Proceed to Phase 45E only as full visual-video private E2E validation. Phase 45D does not approve product beta, production, public delivery, or user final delivery.

## After Phase 45E

1. Review `activation:full-visual-video-private-e2e:report` and `docs/activation-phase-45e-full-visual-video-private-e2e-results.md`.
2. Confirm run `phase45e-20260531T23580` used only the approved Phase 32 source and the approved Phase 45A, Phase 45B, Phase 45C, and Phase 45D private evidence chain.
3. Confirm the approved plan snapshot, source validation, evidence validation, private E2E review manifest, FFprobe review export validation, QA JSON, and Phase 45E report artifacts exist only under private Phase 45E GCS prefixes.
4. Confirm source integrity, Phase 45A/45B/45C/45D evidence, private review export integrity, FFprobe review validation, manifest creation, artifact privacy, no-public-access, no-final-delivery, and blocked-feature gates passed.
6. Proceed to Phase 45F only as Track A visual-video readiness closure. Phase 45E does not approve product beta, production, public delivery, or user final delivery.

## After Phase 45F

1. Review `activation:track-a-visual-readiness-closure:report` and `docs/activation-phase-45f-track-a-visual-video-readiness-closure-results.md`.
2. Confirm the Phase 45F readiness manifest, evidence chain, private E2E artifact validation, QA JSON, and Phase 45F report exist only under private Phase 45F GCS prefixes.
3. Confirm SAM2, Real-ESRGAN bounded/policy evidence, FILM, pro color/image, libass, Remotion, OTIO, FFmpeg/FFprobe, and full visual-video private E2E reports remain internally ready with no internal Track A blockers.
4. Confirm expected broader-scope blockers remain blocked and were not converted into production, external beta, final delivery, public delivery, provider, Revideo, Track B, or broad-media approval.
5. Treat Track A visual-video as ready only for internal private visual-video testing if Phase 45F passed.

## After Phase 47A

1. Review `activation:track-integration-audit:report` and `docs/activation-phase-47a-track-integration-audit-results.md`.
2. Confirm Phase 47A uploaded only private JSON audit artifacts under `activation-track-integration/phase47a/<runId>/`.
3. Confirm Track A remains ready from Phase 45F evidence only.
4. Confirm Track B is recorded as partial, with audio/OCR internal evidence, Demucs blocked pending pretrained-model license/provenance, and VLM Phase 39C blocked on L4/vLLM CUDA OOM.
5. Confirm integration readiness remains blocked for full system-level internal testing until Track B VLM is resolved or explicitly excluded by a later phase.
6. Confirm no media processing, Docker build/push, Cloud Run deploy/execute, provider call, public output, final delivery, production, external beta, paid production, broad media, or Revideo execution occurred.

## After Phase 47B

1. Review `activation:vlm-blocker-resolution:report` and `docs/activation-phase-47b-vlm-blocker-resolution-results.md`.
2. Confirm Phase 47B uploaded only private JSON blocker/exclusion/readiness/QA artifacts under `activation-track-integration/phase47b/<runId>/`.
3. Confirm the decision is exactly `vlm_excluded_from_initial_internal_testing`.
4. Confirm no VLM runtime retry, model download, Docker build/push, Cloud Run deploy/execute, provider call, media processing, public output, final delivery, production, external beta, paid production, broad media, or Revideo execution occurred.
5. Treat Phase 47C as ready only for system-level internal testing gate preparation without VLM.
6. Keep VLM future-scoped until a later explicit phase approves and verifies a smaller/quantized model, different GPU class, or deeper vLLM runtime redesign.

## After Phase 49A

1. Review `activation:web-search-capture-approval:report`, `activation:web-search-capture-approval:plan`, `activation:web-search-tool:summary`, and `docs/activation-phase-49a-web-search-capture-approval-results.md`.
2. Confirm SearXNG, Playwright, Sharp, and Mozilla Readability are approved only for future private/generated fixture planning.
3. Confirm Brave Search API, Tavily, Exa, Firecrawl, and Browserless/Browserbase remain optional, paid, disabled-by-default, and future-approval-required.
4. Confirm command plans are text-only and no live search, public crawling/scraping, browser capture, screenshot capture, Readability extraction runtime, SearXNG runtime, provider call, API key, Docker/GCP mutation, public artifact, signed URL source-of-truth, production, external beta, paid production, broad media, or Revideo action occurred.
5. Proceed to Phase 49B only as private SearXNG endpoint planning plus generated/static search fixtures. Public web search/capture remains blocked until later controlled phases.

## After Phase 49B

1. Review `activation:searxng-search-fixture:report`, `activation:searxng-search-fixture:iam-plan`, and `docs/activation-phase-49b-searxng-search-fixture-results.md`.
2. Confirm the fixture used only generated SearXNG-style data and fixture-safe example domains.
3. Confirm normalized sources include source IDs, provider, title, URL, domain, snippet, rank, attribution policy, generated flags, and `captureAllowed=false` / `extractionAllowed=false`.
4. Confirm private artifacts exist only under the Phase 49B generated-assets and QA prefixes.
5. Proceed to Phase 49C only as a Playwright + Sharp generated/local capture fixture. Live search, public web requests, public capture, Readability runtime, paid providers, public artifacts, production, external beta, paid production, broad media, and Revideo remain blocked.

## After Phase 49C

1. Review `activation:playwright-sharp-capture-fixture:report`, `activation:playwright-sharp-capture-fixture:iam-plan`, and `docs/activation-phase-49c-playwright-sharp-capture-fixture-results.md`.
2. Confirm Playwright opened only the generated local fixture and recorded `publicWebCaptureUsed=false`.
3. Confirm Sharp processed only the local Playwright screenshot into preview and thumbnail PNGs.
4. Confirm private artifacts exist only under the Phase 49C generated-assets and QA prefixes.
5. Proceed to Phase 49D only as a generated/local Readability extraction fixture. Live search, public web capture, paid providers, public artifacts, production, external beta, paid production, broad media, and Revideo remain blocked.
## After Phase 36A

1. Review `activation:audio-ai-approval:plan`, `activation:audio-ai-approval:report`, and `activation:audio-ai-tool:summary`.
2. Confirm the planning recommendation is `deepfilternet_first`.
3. Confirm this historical Phase 36A recommendation has been superseded by Phase 36G: RNNoise is removed from active product routing, and Demucs remains restricted/deferred for source-separation workflows only.
4. Confirm Phase 36B selects only the exact DeepFilterNet v0.5.6 linux x86_64 CLI and DeepFilterNet3 ONNX archive, with official source/license evidence.
5. Confirm command plans are text-only and no model download, audio AI runtime, audio/media processing, Docker/GCP mutation, provider call, public access, Revideo path, production unlock, external beta unlock, or broad real media unlock occurred.
6. Proceed to Phase 36B only as an explicit DeepFilterNet artifact download/load phase with confirmation and private staging GCS upload verification.

## After Phase 36B

1. Review `activation:deepfilternet-download:report`, `activation:audio-ai-tool:summary`, and `docs/activation-phase-36b-download-approved-deepfilternet-artifacts-results.md`.
2. Confirm only `deep-filter-0.5.6-x86_64-unknown-linux-musl` and `DeepFilterNet3_onnx.tar.gz` were downloaded.
3. Confirm `file_checksums_sha256.txt`, `model_tree_manifest.json`, `source_evidence.json`, `license_evidence.json`, and `download_report.json` exist in the private DeepFilterNet v0.5.6 staging prefix.
4. Confirm no DeepFilterNet runtime, RNNoise, Demucs, audio/media processing, Docker, Cloud Run, provider, Revideo, FILM, slow motion, production, external beta, paid production, or broad real media action occurred.
5. Proceed to Phase 36C only as generated-audio DeepFilterNet runtime verification using private approved artifacts; do not use real video/audio or arbitrary user media.

## After Phase 36C

1. Review `activation:deepfilternet-runtime:report` and `docs/activation-phase-36c-deepfilternet-runtime-verification-results.md`.
2. Confirm the successful run is `phase36c-20260530T133009` with private generated-audio fixture, enhanced WAV, metrics, QA, and report artifacts only.
3. Confirm DeepFilterNet ran only after private model artifact copy and checksum verification passed.
4. Confirm no real video/audio input, RNNoise, Demucs, providers, Revideo, FILM, slow motion, production, external beta, paid production, or broad real media occurred.
5. Proceed to Phase 36D only as one controlled real-video audio AI cleanup sample on the approved controlled chain; do not process arbitrary media or unlock broader beta/production.

## After Phase 36D

1. Review `activation:real-video:deepfilternet-audio-cleanup:report` and `docs/activation-phase-36d-real-video-deepfilternet-audio-cleanup-results.md`.
2. Confirm the completed run is `phase36d-20260530T141724`, the source was exactly the approved Phase 32 private export, and the reference was exactly the approved Phase 31 normalized-audio export.
3. Confirm the approved plan snapshot exists, DeepFilterNet artifacts were copied from private GCS, checksums matched, and no external model/tool download occurred.
4. Confirm the cleaned WAV, metrics, QA, and optional private review MP4 are private only and no final delivery export was created.
5. Proceed to Phase 36E only as a private DeepFilterNet audio feature E2E/readiness gate; arbitrary media, production, external beta, RNNoise, Demucs, providers, Revideo, FILM, and slow motion remain blocked.

## After Phase 36E

1. Review `activation:deepfilternet-feature-e2e:report` and `docs/activation-phase-36e-deepfilternet-feature-e2e-results.md`.
2. Confirm the source was exactly the approved Phase 32 private export; `/Users/macuser/Downloads/IMG_6024.MOV` must remain unprocessed in Phase 36E.
3. Confirm the approved plan snapshot, Phase 36D evidence link, cleaned WAV, private review MP4, private review manifest, metrics, and QA report exist under private Phase 36E prefixes.
4. Use the local backup review copy only for Finder viewing; private GCS artifacts remain the source of truth.
5. Proceed to Phase 36F only as the audio system internal beta readiness gate. Production, external beta, paid production, broad real media, arbitrary media, RNNoise, Demucs, providers, Revideo, FILM, slow motion, and final delivery remain blocked.

## After Phase 36F

1. Review `activation:audio-system-readiness:report` and `docs/activation-phase-36f-audio-system-internal-beta-readiness-results.md`.
2. Confirm the evidence chain includes Phase 31 and Phase 36A-36E.
3. Confirm the Phase 36E private cleaned WAV, review MP4, metrics, QA, model checksum metadata, and private review manifest were verified in private GCS.
4. Confirm the audio beta-scope manifest includes FFmpeg loudness and DeepFilterNet only, and excludes RNNoise, Demucs, providers, Revideo, FILM, slow motion, arbitrary media, and production delivery.
5. Proceed to Phase 37A only as an OCR approval workflow if Phase 36F passes. Production, external beta, paid production, broad real media, arbitrary media, RNNoise, Demucs, providers, Revideo, FILM, slow motion, and final delivery remain blocked.

## After Phase 36G

1. Review `activation:audio-stack-demucs:report` and confirm DeepFilterNet owns speech cleanup, RNNoise is removed from active product routing, and Demucs is only a blocked separation candidate.
2. Confirm no Demucs model artifacts were downloaded, no Demucs runtime ran, and no media was processed.
3. Confirm the Demucs blocker cites official pretrained-model license/provenance ambiguity and does not treat MIT code licensing as model approval.
4. Proceed to Phase 37A OCR approval workflow only; do not approve Demucs, RNNoise, external beta, paid production, broad media, providers, Revideo, FILM, or slow motion.


## After Phase 37A

1. Review `activation:ocr-model-approval:plan`, `activation:ocr-model-approval:report`, and `activation:ocr-model-weight:summary`.
2. Confirm PaddleOCR is approved only for generated UI/text OCR safe-zone planning.
3. Confirm PaddlePaddle is runtime planning only and PP-OCRv5 exact assets must be selected by Phase 37B before any runtime work.
4. Confirm the download command plan is text-only and no model files were downloaded or committed.
5. Confirm no OCR inference, real media OCR, Docker/GCP mutation, GPU job, provider call, public output, Revideo, production, external beta, or broad real media occurred.
6. Proceed to Phase 37B only as exact official OCR asset selection/download planning into private staging storage.

## After Phase 37B

1. Review `activation:ocr-model-download:plan`, `activation:ocr-model-download:report`, and `docs/activation-phase-37b-paddleocr-exact-assets-download.md`.
2. Confirm the selected assets are exactly `PP-OCRv5_mobile_det_infer.tar`, `PP-OCRv5_mobile_rec_infer.tar`, and `ppocrv5_dict.txt` under the `paddle3.0.0-mobile-safe-zone-v1` private prefix.
3. Confirm `PP-LCNet_x1_0_textline_ori` is optional/deferred and the safe-zone profile disables document orientation, document unwarping, and textline orientation.
4. Confirm default plan/report/smoke modes did not download model files, mutate GCS, run OCR, process media, or create public artifacts.
5. Confirm the approved Phase 37B evidence records 12 verified private GCS objects, aggregate SHA-256 `6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b`, and no downloaded textline-orientation classifier.
6. Proceed to Phase 37C only as generated UI/text-frame OCR runtime verification planning against the verified private PP-OCRv5 assets. OCR runtime execution, real-media OCR, real-video OCR, caption/render integration, production, external beta, broad media, providers, public output, Revideo, FILM, and slow motion remain blocked.

## After Phase 37C

1. Review `activation:ocr-runtime:report` and `docs/activation-phase-37c-generated-ocr-runtime-verification.md`.
2. Confirm the verified run is `phase37c-20260530T230413` and artifacts are private under `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37c/generated-ocr-runtime/phase37c-20260530T230413/`.
3. Confirm Phase 37C copied only the three verified Phase 37B PP-OCRv5 assets, matched SHA-256, safely extracted tar archives, and used local detection/recognition model paths.
4. Confirm generated fixtures only were processed and required OCR recall, confidence, broad-region, and lower caption conflict-zone checks passed.
5. Confirm runtime model auto-download, textline orientation auto-download, real media OCR, providers, Cloud Run deploy, Docker push, GPU jobs, public output, Track A, beta, production, and broad media remained blocked.
6. Proceed to Phase 37D only as one controlled real-video OCR/caption safe-zone planning and execution gate. Do not integrate caption/render QA until Phase 37E.

## After Phase 37D

1. Review `activation:controlled-real-video-ocr-safe-zone:report`, `activation:controlled-real-video-ocr-safe-zone:execution-report`, `docs/activation-phase-37d-controlled-real-video-ocr-safe-zone.md`, and `docs/activation-phase-37d-controlled-real-video-ocr-safe-zone-execution.md`.
2. Confirm the selected source is only the private Phase 32 export `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`.
3. Confirm the only executed sample is `phase37d-phase32-color-export-safe-zone-window-v1`, window `6.9s`-`8.9s`, with offsets `6.9, 7.3, 7.7, 8.1, 8.5, 8.9`.
4. Confirm run `phase37d-20260531T002046` extracted exactly 6 local temp frames, ran OCR only on those frames, uploaded 10 private JSON QA artifacts, found 11 OCR text regions, and found zero lower-third collision frames.
5. Confirm raw frames, overlays, model files, source video, venvs, credentials, signed URLs, and temp folders were not committed or uploaded.
6. Proceed to Phase 37E only as controlled OCR safe-zone caption/render QA integration planning. Broad OCR, arbitrary media, Track A, beta, production, providers, public output, Cloud Run, Docker push, and GPU jobs remain blocked.
