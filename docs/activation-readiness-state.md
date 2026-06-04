# Activation Readiness State

Phase 36M adds the Track B audio/timing internal beta-readiness gate after Phase 36K. It is metadata-only: it reads committed safe Phase 36H DeepFilterNet, Phase 36I Signalsmith generated, Phase 36J Signalsmith controlled, and Phase 36K Demucs provenance evidence, optionally verifies exact private JSON metadata only, evaluates criteria/caveats/rollback/support scope, and uploads Phase 36M metadata-only artifacts when confirmed. Audio/timing tool-family beta status may become `internally beta-ready candidate` only for restricted internal QA/planning scope covering bounded DeepFilterNet speech cleanup and Signalsmith timing/stretch evidence. Demucs remains excluded and blocked pending training-data provenance and human/legal review. Product-wide beta, external beta, paid production, production, broad media, arbitrary media, public output, provider calls, VLM runtime retries, OCR runtime outside approved phases, Docker/Cloud Run/Cloud Build/GPU jobs, IAM mutation, and Track A remain blocked.

Phase 36K adds the Track B Demucs provenance approval retry after Phase 36J. It is report-only: it records official Demucs source/license/package evidence, pretrained model candidate inventory, MUSDB/MUSDB-HQ and extra-song training-data risk, weight-artifact policy, runtime risk, Phase 36L handoff blockers, and audio/timing beta-scope recommendation. It does not install Demucs, download weights, stage artifacts, run source separation, process media, run DeepFilterNet or Signalsmith, call providers, mutate cloud/IAM, unlock beta/production, or touch Track A. Demucs remains `blocked_pending_training_data_provenance`; audio/timing tool-family beta status remains `phase-complete but tool-family incomplete`.

Phase 36I adds the Track B Signalsmith Stretch approval/runtime generated-fixture gate after Phase 36H-LINUX. It pins the Signalsmith Stretch GitHub mirror to tag `1.1.0` at commit `44c8f865af9da8c29cc4a70a2d5a3ec83639c711`, records official source/license/runtime evidence, fetches source into temp storage only, builds a local generated-fixture C++ runner, and runs deterministic 48 kHz mono generated stretch fixtures at `1.25x`, `0.75x`, and `1.5x`. It does not process controlled real media, real media, arbitrary media, broad media, OCR, VLM, DeepFilterNet runtime, Demucs, providers, Docker, Cloud Build, Cloud Run, IAM mutation, public output, beta, production, or Track A. If generated fixture QA, private artifact upload, and validation pass, audio/timing tool-family beta status becomes `phase-complete but tool-family incomplete`; Phase 36J controlled real-media timing/stretch is next.

Phase 36H-LINUX adds the guarded linux/amd64 CPU Cloud Build and Cloud Run Job completion path for DeepFilterNet runtime hardening after PR #140 preserved the macOS/ffmpeg blockers. It uses only the approved Phase 36B/36C `deep-filter-0.5.6-x86_64-unknown-linux-musl` binary and `DeepFilterNet3_onnx.tar.gz` private artifacts, verifies SHA-256 and the model manifest aggregate before execution, runs generated 48 kHz audio before the single approved bounded controlled sample, and uploads private Phase 36H QA artifacts only when confirmed. If the Linux runtime, generated fixture, controlled cleanup, private upload, and validation pass, audio/timing tool-family beta status becomes `phase-complete but tool-family incomplete`; Signalsmith Stretch Phase 36I is next. Demucs, VLM, OCR runtime outside approved phases, providers, production, internal/external beta unlock, public output, broad media, arbitrary media, and Track A remain blocked.

Phase 46E completed the Track B media/data internal beta-readiness gate after Phase 46D-AUTH-RERUN. It is metadata-only: it read committed Phase 46A/46B/46C/46D safe evidence, verified exact Phase 46B/46C/46D private JSON metadata only, evaluated criteria/caveats/rollback/support scope, and uploaded Phase 46E metadata-only private artifacts. Media/data tool-family beta status is now `internally beta-ready candidate` for restricted internal QA/planning scope only. Product-wide beta, external beta, paid production, production, broad media, arbitrary media, public output, provider calls, VLM runtime retries, OCR runtime outside approved phases, Docker/Cloud Run/Cloud Build/GPU jobs, IAM mutation, and Track A remain blocked.

Phase 46D-AUTH-RERUN completed the guarded noninteractive GCP auth/access rerun for the Track B DuckDB/Polars reporting and QA integration. It used the active noninteractive account `aiediting@reeditpro.com`, printed no token output, created no service-account keys, verified exact Phase 46B/46C private JSON metadata access, uploaded a Phase 46D metadata-only probe and report artifacts, and reran the existing Phase 46D metadata-only reporting path. DuckDB reporting passed, Polars reporting passed, DuckDB/Polars consistency passed, readiness scorecard passed, and private artifact upload passed. Media/data tool-family beta status is now `phase-complete but tool-family incomplete`. Phase 46E media/data internal beta-readiness gate is the next media/data phase, while production, internal/external beta unlock, paid production, broad media, arbitrary media, public output, provider calls, OCR runtime, VLM runtime retries, Docker/Cloud Run/Cloud Build, GPU jobs, broad IAM, and Track A remain blocked.

Phase 46D adds Track B DuckDB/Polars reporting and QA integration after the Phase 46C controlled real-video media/data suite. The auth-rerun completed exact Phase 46B/46C private JSON metadata read and Phase 46D metadata-only private artifact upload. It does not process media, sample frames, create thumbnails, run OCR/VLM, call providers, run Docker/Cloud Run/Cloud Build, mutate IAM, unlock beta/production, or touch Track A.

Phase 46C adds the Track B controlled real-video media/data suite after Phase 46B generated fixtures. It uses exactly one approved private Phase 32/37D sample, verifies source SHA-256, and runs bounded PyAV, OpenCV, PySceneDetect, Sharp/libvips, DuckDB, and Polars checks with isolated temp runtime installs only. It does not accept arbitrary media paths, process broad media, run OCR/VLM, call providers, run Docker/Cloud Run/Cloud Build, mutate IAM, unlock beta/production, or touch Track A. If execution and private artifact upload pass, Phase 46D reporting/QA integration is the next media/data phase, while media/data tool-family beta status remains `phase-complete but tool-family incomplete`.

Phase 46B adds the Track B generated media/data analysis suite after Phase 46A. It runs deterministic synthetic fixtures through OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, and Polars using isolated temp runtime installs only. It does not process real media, accept arbitrary media paths, run OCR/VLM, call providers, run Docker/Cloud Run, mutate IAM, unlock beta/production, or touch Track A. Phase 46C controlled real-video media/data verification remains blocked until Phase 46B generated-suite evidence passes and private artifact handling is recorded. Media/data tool-family beta status is `phase-complete but tool-family incomplete` only when Phase 46B passes; otherwise it remains `blocked`.

Phase 46A adds the Track B media/data tool readiness audit after the Phase 39C VLM decision gate. It records source/license evidence, static runtime inventory, dependency risks, storage/privacy policy, generated-fixture handoff, controlled real-media handoff, reporting/QA handoff, blocker policy, and report/smoke CLIs for OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, and Polars. It does not install packages, process generated fixtures, process real media, run Docker, mutate GCP/IAM, call providers, retry VLM, unlock beta/production, or touch Track A. If validation passes, Phase 46B generated media/data analysis suite is the next implementation phase, while Phase 46C, Phase 46D, production, internal/external beta, broad media, public output, provider calls, VLM runtime retries, and Track A remain blocked. Media/data tool-family beta status is `phase-complete but tool-family incomplete`.

Phase 39C-DECISION records the VLM evidence audit, root-cause synthesis, recovery matrix, and product-forward decision after PR #115 fixed noninteractive auth but still failed fixed-kernel SGLang import smoke on Cloud Run L4. Phase 39C generated VLM runtime verification remains blocked. The Qwen/vLLM path is blocked by the original 8B BF16 L4 CUDA OOM and by semantic generated-image QA failures for official smaller/FP8 Qwen candidates. The Qwen/SGLang path is blocked before inference by SGLang kernel/CUDA import compatibility on Cloud Run L4. Phase 39D controlled real-frame VLM, Phase 39E planning integration, provider calls, production, internal beta, external beta, public output, broad media, arbitrary media, new model downloads, non-Qwen candidates, unapproved GPU/runtime classes, and Track A remain blocked. Recommended next implementation phase is Phase 46A media/data tool readiness audit unless a human explicitly approves a VLM recovery path.

Phase 39C-SG-AUTH-RERUN adds the noninteractive GCP auth preflight and fixed-kernel rerun wrapper after PR #110 was blocked by `gcloud` reauthentication in a noninteractive Codex execution. It supports existing active gcloud auth, service-account impersonation, access-token file/env, Workload Identity Federation, and attached service-account environments without printing tokens or credential file contents. If auth and permission preflight pass, the existing Phase 39C-SG-FIXED Cloud Build/import-smoke/generated-runtime runner may proceed; otherwise Cloud Build and Cloud Run are skipped and an operator action report is emitted. Service-account keys, browser login inside Codex, broad IAM, provider calls, real media, public output, beta, production, new Qwen downloads, non-Qwen candidates, unapproved GPU types, Phase 39D, Phase 39E, and Track A remain blocked. VLM tool-family beta status remains `blocked` unless a fixed SGLang profile imports successfully on Cloud Run L4 and one already staged PR #87 candidate passes generated synthetic fixture QA.

Phase 39C-SG-FIXED extends PR #107's SGLang kernel compatibility gate with an upstream-evidence-driven fixed-kernel profile matrix for the `cuGreenCtxDestroy` import failure. It records SGLang issue/PR evidence for #8432, #8566, #9021, and #9231, checks Cloud Run L4 CUDA driver/forward-compatibility constraints, adds fixed Cloud Build profiles, and runs an import-only L4 smoke job before any model-copy or inference. It does not download or stage Qwen models. Runtime auto-download, provider calls, raw prompts, real media, public output, beta, production, Phase 39D, Phase 39E, and Track A remain blocked. VLM tool-family beta status remains `blocked` unless a fixed profile imports successfully and one already staged PR #87 candidate later passes generated synthetic fixture QA.

Phase 39C-SG-KERNEL adds a targeted SGLang kernel compatibility matrix after PR #104 proved Cloud Build and Cloud Run L4 execution could start but all candidates failed during SGLang import with `sgl_kernel/common_ops.abi3.so: undefined symbol: cuGreenCtxDestroy`. This phase builds bounded SGLang package/profile images through Cloud Build, runs an import-only Cloud Run L4 smoke job before any model-copy or inference, and runs generated synthetic fixture QA only if a profile imports successfully. It uses only already staged PR #87 official Qwen candidates and local verified model paths. Runtime auto-download, provider calls, raw prompts, real media, public output, beta, production, Phase 39D, Phase 39E, and Track A remain blocked. VLM tool-family beta status remains `blocked` unless a later SG-KERNEL run records a passing generated-runtime candidate.

Phase 39C-SG-KERNEL run `phase39c-sg-kernel-20260602T0132` remains blocked. K0 and K2 import smoke failed before model copy/inference because `cuGreenCtxDestroy` is missing from the Cloud Run L4 driver/libcuda symbol set. K1 current-stable refresh was blocked by the same slow `sgl-kernel==0.2.8` wheel path already covered by K0. Scoped QA artifact upload for the new kernel prefix is also missing. Generated fixture runtime did not run.

Phase 39C-SG-BUILD adds the guarded Cloud Build image-build unblock path for the SGLang runtime after PR #100 recorded a local Docker buildx hang before image digest or Cloud Run execution. The full Cloud Build path also stalled during remote publish/finalization, so run `phase39c-sg-build-20260601T232400-overlay` used a guarded overlay Cloud Build from the prior private SGLang image and copied only patched worker code. Cloud Build `7d2bf5c2-491b-4a6f-bf75-6e59b3c94610` succeeded in 217 seconds and pushed image digest `sha256:39cdb9bf6123c4d9568a9bfd55041b138ed0c03adad9f02a9c51482fec5adfa9`. The staging Cloud Run L4 job then executed `Qwen/Qwen3-VL-2B-Instruct`, `Qwen/Qwen3-VL-4B-Instruct`, and `Qwen/Qwen3-VL-8B-Instruct-FP8` using verified PR #87 private assets and local model paths only. All three candidates uploaded private QA artifacts but remained blocked before generated fixture inference because SGLang failed during engine import with `sgl_kernel/common_ops.abi3.so: undefined symbol: cuGreenCtxDestroy`. This is a SGLang/CUDA driver-kernel compatibility blocker, not a model staging, checksum, IAM, local model path, or artifact upload blocker. VLM tool-family beta status remains `blocked`; Phase 39D controlled real-frame VLM and Phase 39E planning integration remain blocked.

Phase 39C-SG adds the SGLang alternate runtime evaluation path for already staged PR #87 official Qwen candidates only. It preserves PR #66, PR #87, PR #90, and PR #97 evidence, records SGLang source/license/runtime/structured-output evidence, adds a dedicated staging SGLang worker image/job path, and reuses the SO3 generated canary/decomposed QA gates. It does not download or stage models, process real media, call providers, create public output, touch Track A, or unlock beta/production. Until a guarded SGLang L4 run proves one candidate can pass generated fixture QA, VLM tool-family beta status remains `blocked`; Phase 39D controlled real-frame VLM and Phase 39E planning integration remain blocked.

Phase 39C-Q-SO3 adds and executes the VLM perception canary and decomposed QA path for already staged PR #87 official Qwen candidates only. It preserves PR #66 as the original BF16 8B L4 OOM evidence, PR #87 as official Qwen candidate staging/runtime evidence, and PR #90 as structured-output failure evidence. SO3 introduces five simple generated canaries, labels-only QA, coarse-region QA, safe-zone-only QA, alias matching, and a composed canonical report before the existing five generated fixtures can run. Guarded L4 run `phase39cq-so3-20260601T154510` copied and checksum-verified the PR #87 private model assets for `Qwen/Qwen3-VL-2B-Instruct`, `Qwen/Qwen3-VL-4B-Instruct`, and `Qwen/Qwen3-VL-8B-Instruct-FP8`, built/pushed image digest `sha256:52b2ea85777a0b300d434cc9756d984a1f743b4f7caadeb198d3542109dad59a`, and uploaded 16 private JSON artifacts per candidate under `activation/phase39c/generated-vlm-perception-canary/`. All candidates remain blocked: 2B reached canary label recall `0.00` and coarse-region accuracy `0.00`; 4B reached label recall `0.60` and coarse-region accuracy `0.00`; 8B FP8 reached label recall `0.60` and coarse-region accuracy `0.00`. Because no candidate passed canary thresholds, the original generated fixtures were intentionally not run. SO3 does not download or stage models, process real media, call providers, create public output, touch Track A, or unlock beta/production. VLM tool-family beta status remains `blocked`; Phase 39D controlled real-frame VLM and Phase 39E planning integration remain blocked.

Phase 39C-Q-SO adds and executes the guarded structured-output enforcement path for the already staged official Qwen candidates from PR #87. It introduces a compact JSON schema, strategy matrix S0-S6, safe trace policy, and staging-only Cloud Run L4 rerun path under `activation/phase39c/generated-vlm-structured-output/<run-id>/`. It does not download or stage new model files. Complete matrix run `phase39cq-so-20260601T035158` attempted all PR #87 candidates and uploaded 17 private JSON artifacts per candidate, but all remained blocked by direct JSON/schema QA failure. Follow-up run `phase39cq-so-20260601T041325` rebuilt image digest `sha256:5ced3307ff21106af7356e1ae2520283fede70e89fe1140e69522c6fb0c260b1`; the 2B candidate reached S1/S3/S4 generated-fixture execution but still failed compact schema, object-region, and safe-zone QA, while 4B and 8B FP8 direct-constructor retries were cancelled after no safe report artifacts were produced. Scoped QA prefix IAM was added only for `activation/phase39c/generated-vlm-structured-output/`; no broad/public IAM was granted. VLM tool-family beta status remains `blocked`; Phase 39D controlled real-frame VLM, Phase 39E planning integration, provider calls, production, beta, public output, broad media, arbitrary media, non-Qwen candidates, community quantizations, unapproved GPU types, and Track A remain blocked.

Phase 39B-Q/39C-Q ran the official Qwen L4-compatible VLM recovery path after the original BF16 8B Phase 39C L4 OOM blocker. It preserves PR #66 as the original `Qwen/Qwen3-VL-8B-Instruct` evidence and adds guarded CLIs for official candidate selection, exact revision/file manifests, private GCS staging, and generated-fixture vLLM runtime verification. Run `phase39cq-20260531T235421` attempted `Qwen/Qwen3-VL-8B-Instruct-FP8`, `Qwen/Qwen3-VL-4B-Instruct`, and `Qwen/Qwen3-VL-2B-Instruct` in the approved order. All attempted candidates used pinned official Qwen revisions, verified private staged assets, local model path runtime, private JSON artifacts, and L4 Cloud Run Job execution only. No candidate completed generated runtime verification: vLLM reached generated fixture execution, but every attempted profile failed the required structured JSON/schema QA gate with `output_json_parse_failed` and `output_schema_invalid`. Phase 39D controlled real-frame VLM, Phase 39E planning integration, provider calls, raw prompts, production, internal beta, external beta, public output, broad media, arbitrary media, non-Qwen candidates, community quantizations, unapproved GPU types, and Track A remain blocked. VLM tool-family beta status is `blocked`.

Phase 39C now adds the Track B generated Qwen3-VL/vLLM runtime verification gate on top of Phase 39B private assets. The L4 tuning follow-up added the bounded `l4-oom-remediation-v1` profile matrix and reran only deterministic generated-fixture paths. The earlier full-profile run `phase39c-20260531T212558` tried `conservative-eager-short-context` and `conservative-cuda-graph-lower-reservation`, both of which failed with CUDA OOM during vLLM engine initialization before generated fixture inference; `auto-fit-context` was skipped because vLLM `0.11.0` does not expose a safe auto-fit context option for this worker path. CPU-offload Profile D could not be executed because Cloud Run rejected `48Gi` and `64Gi` for the approved `8` CPU L4 job shape, reporting an allowed memory range of `4Gi` to `32Gi`. Diagnostic run `phase39c-20260531T214216` then tried `minimal-smoke-one-fixture` on the same approved L4 shape; it copied the exact Phase 39B private model files, verified every per-file SHA-256, recomputed aggregate SHA-256 `3574ebc03f40a6891db0bdb99e7f1802cd58aa7d15055c260eba196b167a7908`, prepared the local model directory, uploaded 13 private JSON QA artifacts to `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/phase39c-20260531T214216/`, and still failed with CUDA OOM during vLLM `LLM(...)` / `EngineCoreClient.make_client` / `wait_for_engine_startup`. Runtime auto-download remained blocked and no broad/public IAM was added. Structured output validation, object-region QA, safe-zone QA, hallucination/safety QA, Phase 39D controlled real-frame VLM, and Phase 39E planning integration remain blocked. VLM tool-family beta status is `blocked`.

Phase 39B completed the Track B Qwen3-VL exact asset private staging workflow for `phase39b-20260531T025648`. It pinned `Qwen/Qwen3-VL-8B-Instruct` to Hugging Face revision `0c351dd01ed87e9c1b53cbc748cba10e6187ff3b`, selected 15 required model/tokenizer/processor/config/source-evidence files totaling `17,545,914,364` bytes, computed aggregate SHA-256 `3574ebc03f40a6891db0bdb99e7f1802cd58aa7d15055c260eba196b167a7908`, uploaded the selected files plus 14 safe JSON/text reports to `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/`, and verified 29 private GCS objects by size/generation/CRC metadata where available. It did not run vLLM, Transformers inference, SGLang, GPU jobs, media processing, provider calls, Docker, Cloud Run, IAM changes, beta, production, public output, broad media, arbitrary media, or Track A.

Phase 39A completed the Track B Qwen3-VL/vLLM approval workflow as metadata-only planning evidence. It selected `Qwen/Qwen3-VL-8B-Instruct` as the default VLM candidate, recorded Qwen3-VL, Hugging Face model-card, vLLM, Transformers, and qwen-vl-utils source/license/runtime evidence, defined the future private model storage prefix, and emitted Phase 39B-39E handoff plans. Phase 39B has now consumed that evidence for private staging only. VLM runtime, generated VLM inference before Phase 39C, controlled real-frame VLM before Phase 39D, VLM planning integration before Phase 39E, providers, public output, beta, production, and broad media remain blocked.

Phase 37E completed OCR safe-zone caption/render QA metadata integration for `phase37e-20260531T011259` after Phase 37D. It used committed Phase 37C/37D safe evidence plus approved private JSON QA artifacts, checked 3 generated metadata fixtures, 1 controlled Phase 37D metadata fixture, and 6 blocked guard fixtures, uploaded 10 private JSON QA artifacts, and emitted caption overlap QA plus a future render QA handoff contract. It did not run OCR, extract frames, read media bytes, render video, burn captions, mutate IAM, touch Track A, unlock beta, or unlock production. Phase 37F is ready only to plan Track B caption/render runtime hook contracts. Track A execution code, production, external beta, broad media, arbitrary media, providers, public output, Revideo, FILM, slow motion, final delivery, raw frame upload, overlay upload, Cloud Run, Docker push, GPU jobs, render execution, and broad real-video OCR remain blocked.

Phase 37D completed the controlled real-video OCR/caption safe-zone metadata planning gate and controlled execution run `phase37d-20260531T002046` after Phase 37C. It used exactly one approved private Phase 32 source sample, extracted six local temp frames for offsets `6.9, 7.3, 7.7, 8.1, 8.5, 8.9`, ran CPU-only PaddleOCR with verified private PP-OCRv5 assets, uploaded 10 private JSON QA artifacts, and found 11 OCR text regions with zero lower-third collision frames. Phase 37E has now consumed redacted/private JSON metadata for controlled caption/render QA integration only. Track A execution code, production, external beta, broad media, arbitrary media, providers, public output, Revideo, FILM, slow motion, final delivery, raw frame upload, overlay upload, Cloud Run, Docker push, GPU jobs, and broad real-video OCR remain blocked.

Phase 37C completed generated OCR runtime verification after Phase 37B for `phase37c-20260530T230413`. It copied only the verified private Phase 37B PP-OCRv5 det/rec/dictionary assets, verified SHA-256, safely extracted the model archives, ran PaddleOCR/PaddlePaddle `3.0.0` on generated UI/text fixtures under a CPU-only local network/download guard, and uploaded private QA artifacts to the Phase 37C QA prefix. Phase 37D consumed those assets only for one controlled private sample/window, and Phase 37E consumed the resulting safe metadata only for caption/render QA planning contracts.

Phase 36G closes the RNNoise/Demucs audio stack correction. DeepFilterNet remains the internal speech-cleanup path, RNNoise is removed from active product routing, and Demucs is documented only as the future vocal/music/stem separation candidate. Demucs htdemucs download and runtime are blocked because the official pretrained-model license/provenance remains ambiguous in the archived facebookresearch/demucs repository. Production, external beta, broad media, arbitrary media, providers, Revideo, FILM, slow motion, and final delivery remain blocked.

Phase 36F completed the audio system internal beta readiness gate for
`phase36f-20260530T161352`. It verified Phase 31 and Phase 36A-36E evidence,
validated the private Phase 36E artifact set in GCS, uploaded a private audio
beta-scope manifest, and marked the audio system ready for internal audio
feature testing only. Phase 37A OCR approval planning may begin. Production,
external beta, broad media, arbitrary media, RNNoise, Demucs, providers,
Revideo, FILM, slow motion, and final delivery remain blocked.

Phase 36E completed the private DeepFilterNet audio feature E2E gate for
`phase36e-20260530T152327`. It used only the approved Phase 32 private export
and Phase 36D evidence; local `/Users/macuser/Downloads/IMG_6024.MOV` was
intentionally not processed.

Phase 36D completed the controlled real-video DeepFilterNet audio cleanup
sample for `phase36d-20260530T141724`. It used only the approved Phase 32
private export, copied approved private DeepFilterNet v0.5.6 artifacts, verified
checksums, created a private cleaned WAV and private review MP4, and emitted
private metrics/QA. It does not unlock production, external beta, broad media,
RNNoise, Demucs, providers, Revideo, FILM, slow motion, or final delivery.

Phase 36C verified the dedicated CPU-only DeepFilterNet generated-audio runtime
after Phase 36B. The runtime copied the approved private DeepFilterNet v0.5.6
artifacts from staging GCS, verified checksums, generated a synthetic 48 kHz mono
fixture, ran the approved `deep-filter` CLI, wrote a private enhanced WAV and
metrics, and kept real-media audio AI cleanup blocked until Phase 36D. RNNoise, Demucs,
providers, Revideo, production, external beta, paid production, and broad real
media remain blocked.

Phase 36B completed the DeepFilterNet-only artifact download/load gate after
Phase 36A. It stored only the selected DeepFilterNet `v0.5.6` linux x86_64 CLI
and DeepFilterNet3 ONNX archive in private staging GCS with checksum, source,
license, and download evidence.

Phase 36A records the non-mutating audio AI approval workflow after Phase 35F.
It recommends DeepFilterNet first for future staging planning, keeps RNNoise as
a lightweight fallback candidate, and keeps Demucs restricted/deferred for
source-separation workflows only.

Phase 35F completed the private SAM2 feature E2E beta-readiness gate after
Phase 35E for `phase35f-20260530T02293`. It was limited to the approved Phase
32 controlled video chain, a structured approved plan snapshot, private SAM2
masks, private text-behind-subject preview frames, and QA. It marks SAM2 as
ready for internal SAM2 feature testing only. External beta, paid production,
broad real media, providers, Revideo, FILM, slow motion, Real-ESRGAN, final
export, arbitrary media, public delivery, and production remain blocked.

Phase 35E completed the controlled segment text-behind-subject preview gate for
`phase35e-20260530T01355`. It was locked to Phase 35D run
`phase35d-20260530T004442`, the 6.9s-8.9s segment, 10 bounded 768x432 frames,
Phase 35D SAM2 masks, and fixed text `REEDITPRO`. It created private preview
frames and metadata only. Full-video masks, full-video text-behind-subject,
final export, production launch, external beta, broad real user media, provider
execution, arbitrary media execution, FILM, slow motion, Real-ESRGAN, and
Revideo remain blocked.
FILM/slow-motion is deferred to future Phase 38A approval if still needed.

Phase 35D completed the controlled SAM2 gate after Phase 35C for exactly one
approved Phase 32 private-export segment from 6.9s to 8.9s, 10 bounded frames
at 768x432, and a prompt derived from the Phase 33D mask. It produced private
mask/overlay/QA artifacts for `phase35d-20260530T004442` with no blocking QA
failures and warning-only temporal/human-review limitations.

Phase 35C completed SAM2 generated/synthetic runtime verification after Phase
35B. The dedicated staging SAM2 runtime loaded the private SAM2.1 tiny
checkpoint/config, verified checksums, and produced generated-fixture masks for
`phase35c-20260529T16082`.

Phase 34E completed the Real-ESRGAN broader-scope policy decision after the
Phase 34D bounded sample. It keeps full-frame enhancement, full-video
enhancement, blind full-video enhancement, production launch, external beta,
broad real user media testing, provider execution, arbitrary media execution,
FILM, slow motion, and Revideo blocked.

Phase 34D completed one bounded Real-ESRGAN enhancement sample from the approved
Phase 33D representative frame.

Phase 33E composed a private text-behind-subject PNG preview from the approved
Phase 33D frame, mask, and RGBA cutout. It emitted a text layer plan, depth
composition manifest, and QA with no blocking failures.

Phase 34A adds a static/report-only enhancement/slow-motion model approval
workflow. `RealESRGAN_x4plus` is staging-approved only for sample-first
enhancement planning. FILM is evaluated-only and execution/download-blocked.

Phase 34B added private GCS checksum evidence for the single approved
`RealESRGAN_x4plus.pth` file. Phase 34C verified the dedicated Real-ESRGAN L4
runtime on generated media only.

| Area | State | Notes |
| --- | --- | --- |
| Repo baseline | Ready | M0-M17 dry-run/static runtime foundation is present. |
| Smoke suite | Ready | Existing production smoke and summary scripts are available and cataloged by Phase 19. |
| Local baseline command/report | Ready | `activation:local-baseline` defaults to static-only reporting and requires confirmation before execution. |
| Container build reporting | Ready | Phase 20 can print build plans and parse human build logs without running Docker. |
| Staging container images | Built and pushed for completed activation phases | Non-GPU staging images and dedicated speech, BiRefNet, and Real-ESRGAN runtime images were built/pushed only for the approved activation scopes. Production images remain blocked. |
| Container readiness validation reporting | Ready | Phase 21 can print readiness command plans and parse human-run readiness logs without running Docker. |
| Container readiness run | Verified for completed activation paths | Completed activation phases include recorded staging readiness/runtime evidence. This does not approve arbitrary containers or production execution. |
| GCP staging setup planning | Ready | Phase 22 validates staging config, resource map, IAM, buckets, secrets, and command plans. |
| GCP staging resources | Created/verified for activation staging | Staging resources for `reeditpro` / `us-central1` exist for the completed controlled activation path. Production resources remain blocked. |
| Non-GPU image push/deploy | Completed where applicable | API/non-GPU jobs were built, pushed, and deployed for the completed staging activation phases. This is not production readiness. |
| Dedicated runtime jobs | Verified only for approved scopes | CPU speech runtime, BiRefNet L4 runtime, and Real-ESRGAN L4 runtime were verified in their controlled phases. General/broad GPU AI worker execution remains blocked unless a dedicated approved phase enables it. |
| Model approval workflow | Ready | Phase 26 can report evidence, storage policy, manifests, and text-only future download commands. |
| faster-whisper tiny model approval | Staging-approved for planning | `Systran/faster-whisper-tiny` is approved only for Phase 28 speech/caption planning. |
| Mask model approval workflow | Ready | Phase 33A can report BiRefNet/SAM2 evidence, storage policy, manifests, and text-only future download commands. |
| BiRefNet model approval | Staging-approved for planning | `ZhengPeng7/BiRefNet` is approved only for representative-frame/single-frame background-removal planning. |
| SAM2 model approval | Phase 35A review complete | Official SAM2.1 tiny source/license evidence is clear for staging download. Phase 35B is the approved download/load step for the tiny checkpoint/config only. |
| SAM2 model weights availability | Private staging storage verified | `sam2.1_hiera_tiny.pt` and `sam2.1_hiera_t.yaml` are stored under private generated-assets model storage with checksum/source evidence. Phase 35C may use them only for generated/synthetic runtime verification. |
| SAM2 runtime | Phase 35C generated-fixture verification complete | The dedicated SAM2 runtime ran on generated/synthetic frames only for `phase35c-20260529T16082`. |
| SAM2 real-video temporal mask | Phase 35D complete for one controlled short segment | `phase35d-20260530T004442` used the approved Phase 32 export, Phase 33D anchor evidence, and a 6.9s-8.9s bounded segment. Full-video masks remain blocked. |
| Segment text-behind-subject preview | Phase 35E complete for one controlled short segment | `phase35e-20260530T01355` used the Phase 35D short segment and private masks. It created private preview frames only; full-video text-behind-subject and final export remain blocked. |
| SAM2 feature E2E beta-readiness | Phase 35F complete for internal testing only | `phase35f-20260530T02293` used the approved controlled video chain, structured plan snapshot, 77-frame 768x432 private preview scope, private SAM2 masks, private preview frames, and QA. External beta and paid production remain blocked regardless of outcome. |
| Audio AI approval workflow | Phase 36A review complete | DeepFilterNet is recommended first for future staging planning; RNNoise is fallback planning only; Demucs is restricted/deferred. |
| DeepFilterNet artifacts | Private staging storage verified | Phase 36B stored only the selected DeepFilterNet v0.5.6 CLI and DeepFilterNet3 ONNX archive under private generated-assets model storage with checksum/source/license evidence. |
| DeepFilterNet runtime | Generated-audio verification complete | Phase 36C ran DeepFilterNet v0.5.6 on generated synthetic audio only for `phase36c-20260530T133009`, verified private artifact checksums, produced private enhanced WAV/metrics, and leaves real-media cleanup blocked until Phase 36D. |
| Real-video DeepFilterNet audio cleanup | Phase 36D complete for one controlled sample | `phase36d-20260530T141724` used the approved Phase 32 private export and Phase 31 reference audio, produced private cleaned WAV, private review MP4, metrics, and QA with no blocking findings. Production, beta, arbitrary media, RNNoise, Demucs, providers, Revideo, FILM, slow motion, and final delivery remain blocked. |
| DeepFilterNet feature E2E | Phase 36E complete for internal testing only | `phase36e-20260530T152327` used the approved Phase 32 private export and Phase 36D evidence, created a private cleaned WAV, private review MP4, metrics, QA, and a local backup review copy. External beta, paid production, broad media, arbitrary media, and final delivery remain blocked. |
| Audio system internal readiness | Phase 36F complete for internal audio feature testing only | `phase36f-20260530T161352` verified Phase 31 and Phase 36A-36E evidence, private Phase 36E artifacts, beta-scope manifest, rollback/fallback policy, and blocked external beta/production scopes. |
| RNNoise/Demucs status | Phase 36G closed with Demucs blocked | RNNoise is removed from active product flow. Demucs is the vocal/music/stem separation candidate, but htdemucs download/runtime is blocked pending pretrained-model license/provenance clarity. No RNNoise or Demucs artifacts are approved or downloaded. |
| DeepFilterNet runtime hardening | Phase 36H-LINUX complete for bounded internal evidence | Phase 36H-LINUX completed the approved Linux x86_64 DeepFilterNet path with generated audio, one bounded controlled sample, metrics, private artifacts, and no broad media unlock. |
| Signalsmith Stretch runtime | Phase 36I generated-fixture gate | Phase 36I pins Signalsmith Stretch tag `1.1.0`, records source/license/runtime evidence, builds a temp-only generated fixture binary, and runs generated synthetic stretch fixtures only. Phase 36J controlled real-media timing/stretch remains blocked until Phase 36I passes. |
| OCR approval workflow | Phase 37A planning approved | PaddleOCR/PaddlePaddle evidence is recorded for generated OCR safe-zone planning only. Phase 37B now selects exact PP-OCRv5 assets through a guarded workflow; OCR runtime, real-video OCR, production, beta, and broad media remain blocked. |
| OCR exact assets | Phase 37B private staging evidence passed | `PP-OCRv5_mobile_det_infer.tar`, `PP-OCRv5_mobile_rec_infer.tar`, and `ppocrv5_dict.txt` are selected and verified under the private `paddle3.0.0-mobile-safe-zone-v1` prefix with aggregate SHA-256 `6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b`. Phase 37C consumed these assets for generated-fixture runtime verification only; real-video OCR, production, beta, and broad media remain blocked. |
| OCR generated runtime | Phase 37C generated-fixture verification complete | `phase37c-20260530T230413` verified PaddleOCR/PaddlePaddle `3.0.0` on generated UI/text fixtures only using the private Phase 37B PP-OCRv5 assets. Required token recall/confidence/region gates passed, the lower caption conflict zone was detected, and runtime model auto-download remained blocked. Phase 37D is ready only for one controlled real-video OCR/caption safe-zone planning gate. |
| Controlled real-video OCR safe-zone | Phase 37D controlled execution passed for one sample | `phase37d-20260531T002046` used the approved private Phase 32 source sample only, extracted 6 local temp frames for `6.9s`-`8.9s`, verified Phase 37B OCR model checksums, ran CPU-only PaddleOCR, uploaded 10 private JSON QA artifacts, found 11 OCR text regions, and found zero lower-third collision frames. Phase 37E is ready for controlled caption/render QA integration planning only. |
| OCR caption/render QA metadata integration | Phase 37E complete for metadata contracts | `phase37e-20260531T011259` checked generated metadata fixtures, redacted Phase 37D safe-zone metadata, and blocked guard fixtures, uploaded 10 private JSON QA artifacts, and emitted caption overlap QA plus future render QA handoff reports. Phase 37F is ready only for Track B hook planning; render execution, OCR runtime, Track A, beta, production, broad media, and arbitrary media remain blocked. |
| Qwen3-VL/vLLM approval workflow | Phase 39A planning approved | `Qwen/Qwen3-VL-8B-Instruct` is selected for Track B VLM planning only with vLLM as the runtime candidate and local Transformers as fallback planning. Phase 39B consumed the approval evidence for private staging only. Runtime inference, real media, GPU jobs, GCP/IAM mutation, Track A, beta, production, public output, and broad media remain blocked. |
| Qwen3-VL exact asset private staging | Phase 39B private staging passed | `phase39b-20260531T025648` pinned revision `0c351dd01ed87e9c1b53cbc748cba10e6187ff3b`, staged 15 selected files totaling `17,545,914,364` bytes under the approved private generated-assets prefix, recorded aggregate SHA-256 `3574ebc03f40a6891db0bdb99e7f1802cd58aa7d15055c260eba196b167a7908`, and verified 29 private GCS objects. Phase 39C is ready only for generated VLM runtime verification. |
| Qwen3-VL generated runtime verification | Phase 39C/39C-Q/39C-Q-SO blocked after L4 recovery attempts | `phase39c-20260531T212558` and `phase39c-20260531T214216` blocked the original BF16 8B candidate on L4 CUDA OOM before inference. Recovery run `phase39cq-20260531T235421` privately staged and runtime-tested official Qwen FP8 8B, BF16 4B, and BF16 2B candidates; all reached generated fixture execution but failed structured JSON/schema QA. Structured-output enforcement run `phase39cq-so-20260601T041325` confirmed no pass-counting S1-S5 strategy currently passes the compact schema/QA gate. Phase 39D remains blocked. |
| Mask model weights availability | Private staging storage verified | `ZhengPeng7/BiRefNet` is stored under private generated-assets model storage with revision/checksum evidence. |
| Mask runtime | Verified for generated image and one controlled real-video frame | Phase 33C ran the generated-image L4 BiRefNet runtime job; Phase 33D ran BiRefNet on exactly one representative frame from `phase32-20260528T13330`. |
| Real-video representative-frame mask | Complete for one controlled test | Phase 33D produced a private frame, mask, RGBA cutout, metadata, and QA for `phase33d-20260528T161056` with no blocking failures. |
| Text-behind-subject frame preview | Complete for one controlled test | Phase 33E produced a private preview PNG, text layer plan, depth composition manifest, and QA for `phase33e-20260528T165755` with no blocking failures. |
| Enhancement model approval workflow | Ready | Phase 34A can report Real-ESRGAN/FILM evidence, storage policy, manifests, and text-only future download commands. |
| Real-ESRGAN model approval | Staging-approved for planning | `RealESRGAN_x4plus` is approved only for sample-first representative-frame or short-sample enhancement planning. |
| Real-ESRGAN weights availability | Private staging storage verified | Phase 34B downloaded only approved `RealESRGAN_x4plus.pth` into private staging storage and recorded checksum evidence. |
| FILM model approval | Evaluated-only | `google-research/frame-interpolation` evidence is recorded, but FILM download, execution, and slow motion remain blocked. |
| Enhancement runtime | Verified for generated image | Phase 34C ran a dedicated L4 Real-ESRGAN runtime job on one generated synthetic image and emitted private enhancement QA with no blocking failures. |
| Real-video enhancement sample | Complete for one bounded controlled test | Phase 34D produced one private 512x512 sample crop and one 2048x2048 enhanced sample from `phase33d-20260528T161056`; full-frame and full-video enhancement remain blocked. |
| Real-ESRGAN broader-scope policy | Policy complete; broader execution blocked | Phase 34E records that human visual review is required and no full-frame/full-video/blind enhancement scope is allowed yet. Additional bounded sample planning may be considered only in a later approved phase. |
| Model weights availability | Private staging storage verified for approved activation models | `Systran/faster-whisper-tiny`, `ZhengPeng7/BiRefNet`, and `RealESRGAN_x4plus` have private staging storage and checksum/revision evidence for their approved controlled scopes. |
| CPU speech runtime | Verified for generated audio | Dedicated staging CPU speech runtime image loaded the approved tiny model from private GCS and ran faster-whisper on generated audio only. |
| First real video speech/caption | Complete for one controlled test | Phase 28 processed `/Users/macuser/Downloads/IMG_6005.MOV` for speech/caption only with private artifacts and no blocking caption QA findings. |
| Smart cut + captions | Complete for one controlled test | Phase 29 produced private SmartCutPlan, TimelineManifest, caption refs, and QA for `phase29-20260528T02254`; final export and broad real media testing remain blocked. |
| Final private export | Complete for one controlled private export | Phase 30 produced a private final export for the approved activation path. Public delivery remains blocked. |
| Internal beta | Blocked | Requires full private E2E evidence, operations, support, privacy, cost, and rollback readiness. |
| External beta | Blocked | Requires strict Phase 37 go/no-go approval. |
| Paid production | Blocked | Not approved by Phase 18 or the activation roadmap. |

Current classification:

- dry-run/static runtime foundation: ready
- local generated fixture testing: ready where supported
- local baseline command/report: ready
- container build reporting: ready
- staging container images: built and pushed for completed activation phases only; production images remain blocked
- container readiness validation reporting: ready
- container readiness/runtime evidence: recorded for completed activation paths only
- GCP staging setup planning: ready
- GCP staging resources: created/verified for `reeditpro` / `us-central1`
- staging deployment: complete where applicable for the controlled activation path
- dedicated runtime jobs: CPU speech runtime verified, BiRefNet L4 runtime verified, Real-ESRGAN L4 runtime verified, SAM2 L4 runtime verified on generated synthetic frames only
- model weights/licenses: staging approval remains scope-limited per model/tool
- model files/checksums: private staging storage verified for faster-whisper tiny, BiRefNet, RealESRGAN_x4plus, SAM2.1 tiny, selected DeepFilterNet v0.5.6 artifacts, and selected PP-OCRv5 det/rec/dictionary assets
- CPU speech runtime: verified on generated audio with local private-GCS model copy
- general/broad GPU AI worker execution: blocked unless a dedicated approved phase explicitly enables it
- controlled real-video chain: complete only for the explicit approved Phase 28-34D path
- broad real user media testing: blocked
- mask execution: complete only for the explicit Phase 33D representative-frame test; full-video masks remain blocked
- text-behind-subject execution: complete only for the explicit Phase 33E single-frame preview and Phase 35E controlled segment preview; full-video text-behind-subject remains blocked
- enhancement execution: blocked except the explicit Phase 34D bounded real-video-derived sample; full-frame and full-video enhancement remain blocked
- Real-ESRGAN broader-scope policy: Phase 34E complete; human visual review required before broader scope
- SAM2 model approval: Phase 35A review complete; official SAM2.1 tiny staging download approved for Phase 35B
- SAM2 model download/load: Phase 35B private storage evidence verified for `sam2.1_hiera_tiny`
- SAM2 execution: Phase 35C generated/synthetic runtime verification complete; Phase 35D controlled short real-video temporal mask test complete for one approved segment; Phase 35F private feature E2E gate complete for internal SAM2 feature testing only
- next activation work: Phase 39C remains blocked after vLLM, structured-output, perception-canary, and SGLang runtime attempts. The active VLM follow-up is Phase 39C-SG-FIXED, which must first prove an upstream-fixed SGLang kernel profile can import on Cloud Run L4 before any generated fixture runtime can run. If all fixed profiles fail import smoke, the next path should be a different approved GPU/runtime CUDA environment, human-approved source-build/runtime investigation, return to vLLM with human-approved fixture/QA redesign, non-Qwen VLM approval, or pausing VLM for Phase 46A media/data hardening. Phase 39D controlled real-frame VLM cannot start. Arbitrary media, broad OCR/VLM, production, beta, RNNoise active routing, Demucs download/runtime, providers, public output, Revideo, FILM, slow motion, raw frame upload, overlay upload, Cloud Run, Docker push, GPU jobs outside an approved runtime phase, render execution, broad OCR/VLM runtime execution, and Track A remain blocked
- slow-motion execution: blocked; FILM is evaluated-only and deferred to future Phase 38A
- provider execution: blocked
- production: blocked
- external beta: blocked
- paid production: blocked

## Phase 44I-A Track B Capability Manifest Baseline

Phase 44I-A adds a reporting-only Track B capability manifest baseline under `docs/activation-track-b-capability-manifests-reports/`. It includes exactly 18 canonical Track B tool ids and classifies restricted internal testing eligibility without changing production routing.

Restricted internal testing manifests include DeepFilterNet, Signalsmith Stretch, PaddleOCR, PaddlePaddle, OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, and Polars. Demucs remains blocked pending training-data provenance and human/legal review. Qwen3-VL and vLLM remain excluded while Phase 39C generated runtime verification is blocked. Web capability profiler, desktop capability profiler, local worker sidecar planning, cost estimator, and tool route manifest integration remain `not_started`.

Phase 44I-A does not run Docker, Cloud Build, Cloud Run, GPU jobs, model downloads, media/audio/OCR/VLM runtimes, provider calls, IAM/GCP mutation, or beta/production unlocks. Phase 44I remains required for actual tool route manifest integration, and workers must execute approved plan snapshots within approved artifact scopes only.

## Phase 44I Track B Tool Route Manifest Integration

Phase 44I adds a metadata-only route manifest layer under `docs/activation-track-b-tool-route-manifest-reports/`. It consumes the PR #161 capability manifests as source of truth and adds route eligibility, plan snapshot, artifact scope, consumer, failure, and cost/capacity metadata only.

Route-enabled restricted-internal metadata entries are DeepFilterNet, Signalsmith Stretch, PaddleOCR, OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, and Polars. PaddlePaddle and tool route manifest integration are handoff-only. Demucs remains `route_disabled_blocked`; Qwen3-VL and vLLM remain `route_disabled_excluded`; web capability profiler, desktop capability profiler, local worker sidecar planning, and cost estimator remain `route_disabled_not_started`.

Every route keeps `runtimeExecutionAllowed` and `routeExecutionAllowed` false. Phase 44I does not run tools, workers, media/audio/OCR/VLM runtimes, Docker, Cloud Build, Cloud Run, GPU jobs, providers, model downloads, IAM/GCP mutation, beta, production, broad media, public output, arbitrary media, raw chat execution, or Track A.
