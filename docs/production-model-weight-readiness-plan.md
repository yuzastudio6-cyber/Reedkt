# Production Model Weight Readiness Plan

Milestone 5 does not download, bundle, cache, or execute model weights. Model-weight readiness is represented as metadata and dry-run checks only.

## Separate Review Required

A repository or package license is not enough for paid ReeditPro production. Each model, checkpoint, weight file, or model card must be tracked separately for:

- source and version
- license and commercial-use permission
- redistribution permission
- attribution requirements
- network/service-use risk
- provenance and update process
- reviewer approval status

Unknown, non-commercial, or unreviewed weights block production readiness.

## Tools With Model Weight Checks

The readiness layer requires model-weight checks for model/checkpoint-based tools such as faster-whisper, whisper.cpp, PaddleOCR models, MediaPipe models, BiRefNet, SAM2, transparent-background, rembg, DeepFilterNet, Demucs, Real-ESRGAN, and FILM.

BiRefNet must not assume every related checkpoint is commercial-safe. SAM2 requires checkpoint license review even when the code license appears acceptable. OCR, speech, enhancement, segmentation, and audio AI models all remain blocked until their model weights are explicitly reviewed.

## Placeholder Paths

GPU Dockerfile templates create placeholder model-weight directories only. No model files are committed, downloaded, mounted, or referenced as available in Milestone 5.

Milestone 11 adds explicit manifest templates for faster-whisper, BiRefNet, SAM2, DeepFilterNet, Demucs, Real-ESRGAN, FILM, and PaddleOCR. These templates default to `needs_review` or blocked production behavior until a later review records source, version, license, commercial-use permission, redistribution permission, attribution requirements, provenance, and checksum.

## Production Rule

Any non-commercial model weight is blocked for paid ReeditPro production. Any unknown model-weight license is blocked until reviewed.

## Phase 46A Media/Data Tool Readiness Note

Phase 46A is not a model-weight phase. It does not download, stage, approve, or execute model weights. It records source/license and dependency evidence for deterministic media/data tools only: OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, and Polars. VLM runtime retries, new model downloads, production, beta, broad media, public output, provider calls, Docker/GCP mutation, and Track A remain blocked.

## Phase 39C-DECISION VLM Note

Phase 39C-DECISION does not download, stage, approve, or execute any model weights. It preserves the PR #87 official Qwen candidate evidence and records that the current Qwen/vLLM/SGLang/Cloud Run L4 path remains blocked: vLLM is blocked by OOM and semantic generated-image QA failures, while SGLang is blocked before inference by kernel/CUDA import compatibility. No non-Qwen candidate, new Qwen download, community quantization, provider path, different GPU/runtime class, production, internal beta, external beta, broad media, public output, or Track A scope is approved. The recommended next implementation path is Phase 46A media/data tool readiness audit unless a human explicitly approves a VLM recovery path.

## Phase 39C-SG-KERNEL VLM Note

Phase 39C-SG-KERNEL does not download, stage, or approve any new VLM model weights. It reuses the already staged PR #87 official Qwen candidate objects and tests only SGLang/CUDA kernel compatibility on Cloud Run L4 before generated synthetic fixture runtime. Production, paid production, internal beta, external beta, broad media, real media, provider calls, public output, non-Qwen candidates, and new model downloads remain blocked.

Run `phase39c-sg-kernel-20260602T0132` did not reach model copy/checksum because import smoke failed for the tested SGLang kernel profiles. PR #87 model-weight readiness is unchanged, and generated-runtime VLM remains blocked.

## Activation Phase 26 First Speech Model Approval

Activation Phase 26 records evidence for `Systran/faster-whisper-tiny` and
approves it only for staging speech/caption planning. This does not approve
production, paid production, external beta, larger Whisper models, non-speech
models, or real user media execution.

Activation Phase 26B downloads only the approved tiny model into private staging
generated-assets storage and records revision/checksum evidence. This still does
not approve production, external beta, larger models, provider models, GPU
deployment, or real user media execution.

Activation Phase 27A verifies the approved tiny model can be copied from private
staging GCS into a dedicated CPU speech runtime and executed on generated audio
only. This is not production approval, external beta approval, broad real user
media approval, or approval for any larger/non-speech model.

## Activation Phase 33A First Mask Model Approval

Activation Phase 33A records evidence for `ZhengPeng7/BiRefNet` and approves it
only for staging representative-frame/single-frame background-removal planning.
The approved BiRefNet manifest checksum remains `missing_until_download` until
an explicit Phase 33B download/load phase records revision and checksum
evidence.

Activation Phase 33B downloads only `ZhengPeng7/BiRefNet` into private staging
generated-assets storage and records revision/checksum evidence. The snapshot
contains custom code files, which are recorded but not executed. Runtime
inference, GPU deployment, mask execution, text-behind-subject, production,
external beta, paid production, and broad real media remain blocked.

Activation Phase 33C verified BiRefNet runtime loading only for the approved
snapshot and one generated synthetic image. The generated-image mask QA had no
blocking failures. This is not production approval, external beta approval,
broad real media approval, SAM2 approval, arbitrary real-video mask approval, or
text-behind-subject approval.

Activation Phase 33D used the verified BiRefNet runtime on exactly one
representative frame from the approved Phase 32 private export. It created a
private mask, RGBA cutout, metadata, and QA report with no blocking failures.
This remains controlled staging evidence only; full-video masks, SAM2,
production, external beta, broad real media, and text-behind-subject execution
remain blocked.

SAM2 evidence is recorded for future video tracking review only.
`facebook/sam2-hiera-tiny`, official SAM2 checkpoints/code, DeepFilterNet,
Demucs, Real-ESRGAN, FILM, PaddleOCR GPU, provider models, Revideo, and
text-behind-subject execution remain blocked.
## Milestone 12 Report Integration

Model-weight manifests now appear in the unified production readiness report. Unknown, non-commercial, missing, `needs_review`, and blocked model weights remain production blockers while dry-run/static readiness may surface them as warnings and next actions.

## Milestone 15C Mask Model Blockers

M15C requires approved model-weight manifests for production BiRefNet and SAM2 execution. Current `birefnet_model` and `sam2_checkpoint` templates remain `needs_review`, so production-ready mask/background/text-behind-subject execution is blocked until a later review approves source, version, checksum, license, commercial use, redistribution, attribution, and runtime mount policy.

## Milestone 15D Enhancement Model Blockers

M15D requires approved model-weight manifests for production Real-ESRGAN and FILM execution. Current `real_esrgan_model` and `film_model` templates remain `needs_review`, so production-ready enhancement and slow-motion execution is blocked until a later review approves source, version, checksum, license, commercial use, redistribution, attribution, and runtime mount policy.

## Activation Phase 34A

Phase 34A creates a staging-only approval record for `RealESRGAN_x4plus` under
`xinntao/Real-ESRGAN` for sample-first enhancement planning. It does not
download weights, deploy GPU, run enhancement, process frames/video, or approve
full-video enhancement.

FILM (`google-research/frame-interpolation`) is evaluated-only and remains
download/execution-blocked until a separate slow-motion approval/download/runtime
phase. Production, external beta, paid production, and broad real media remain
blocked.

## Activation Phase 34B

Phase 34B may download only `RealESRGAN_x4plus.pth` from the official
Real-ESRGAN GitHub release asset into private staging generated-assets storage.
It records file and aggregate SHA-256 evidence, but it does not run
Real-ESRGAN, deploy GPU, process media, or approve production use.

FILM, alternate Real-ESRGAN weights, GFPGAN/facexlib weights, enhancement
execution, slow motion, production, external beta, paid production, and broad
real media remain blocked.

## Phase 37A OCR Approval Update

Phase 37A OCR approval update: PaddleOCR/PaddlePaddle are approved only for staging generated OCR safe-zone planning. Exact PP-OCRv5 assets are deferred to Phase 37B, OCR runtime is deferred to Phase 37C, controlled real-video OCR is deferred to Phase 37D, and production, external beta, broad media, providers, public output, Revideo, FILM, and slow motion remain blocked.

## Phase 39A/39B/39C VLM Model Weight Update

Phase 39A approves `Qwen/Qwen3-VL-8B-Instruct` only as Track B VLM planning evidence with vLLM as the future runtime candidate. Phase 39B pins revision `0c351dd01ed87e9c1b53cbc748cba10e6187ff3b`, records SHA-256 checksums, and privately stages the 15 selected model/tokenizer/processor/config/source-evidence files under the approved generated-assets model-weight prefix. Phase 39C adds the guarded generated-fixture runtime verification workflow and records scoped conditional IAM evidence for the staging GPU worker. L4 tuning runs `phase39c-20260531T212558` and `phase39c-20260531T214216` copied the exact Phase 39B private model objects, verified every per-file SHA-256, recomputed aggregate SHA-256 `3574ebc03f40a6891db0bdb99e7f1802cd58aa7d15055c260eba196b167a7908`, prepared the local model path, and uploaded private JSON QA artifacts, but all executed L4-safe vLLM profiles failed during engine initialization with CUDA OOM before generated fixture inference. The generated VLM runtime remains blocked until a later approved path changes the blocker, such as official quantized Qwen3-VL private staging, a smaller VLM candidate, a different GPU class, or a deeper vLLM configuration follow-up with a concrete new fix. This is not production, beta, broad media, provider, general GPU, controlled real-frame, planning-integration, quantized-variant, or smaller-model approval.

## Phase 39B-Q/39C-Q VLM L4-Compatible Candidate Recovery

Phase 39B-Q/39C-Q may approve and stage only official Qwen L4-compatible recovery candidates after the original BF16 8B L4 OOM evidence: `Qwen/Qwen3-VL-8B-Instruct-FP8`, `Qwen/Qwen3-VL-4B-Instruct`, and `Qwen/Qwen3-VL-2B-Instruct`. Each attempted candidate must be pinned to an exact revision, downloaded only from the official Hugging Face repository, checksummed per file, uploaded to private generated-assets storage, verified by private GCS metadata, and handed to vLLM as a local verified model directory. Runtime auto-download, provider calls, real media, public artifacts, beta, production, non-Qwen candidates, community quantizations, and unapproved GPU types remain blocked.

Passing generated runtime verification for one candidate is not production model-weight approval. It only makes the VLM tool family `phase-complete but tool-family incomplete` until Phase 39D controlled real-frame verification, Phase 39E planning integration, private artifact policy, rollback policy, and a later beta-readiness decision pass.

Run `phase39cq-20260531T235421` attempted the approved official Qwen recovery order. The FP8 8B, BF16 4B, and BF16 2B candidates were pinned, downloaded, checksummed, uploaded to private generated-assets storage, and verified from private GCS before runtime. The runtime worker used only local verified model paths and blocked runtime auto-download/provider/public/real-media paths. All three candidates remain blocked because generated vLLM outputs failed the required structured JSON/schema QA gate with `output_json_parse_failed` and `output_schema_invalid`. No candidate is selected for Phase 39D, and VLM tool-family beta status remains `blocked`.

Phase 39C-Q-SO is the narrow structured-output recovery path for those already staged PR #87 candidates. It adds a compact schema, S0-S6 strategy matrix, safe trace policy, and guarded L4 rerun path. It does not approve new model downloads or new model staging. Execution run `phase39cq-so-20260601T035158` completed C/B/A private generated-fixture matrix evidence but all candidates remained blocked by direct JSON/schema QA. Follow-up run `phase39cq-so-20260601T041325` reached 2B S1/S3/S4 generated-fixture execution with image digest `sha256:5ced3307ff21106af7356e1ae2520283fede70e89fe1140e69522c6fb0c260b1`, and no pass-counting strategy passed compact schema, object-region, safe-zone, and hallucination/safety QA. 4B and 8B FP8 direct-constructor retries were cancelled after no safe report artifacts were produced. VLM remains `blocked`, and Phase 39D/39E remain blocked.

Phase 39C-Q-SO3 is the perception canary recovery path for the same PR #87 staged candidates only. It adds simple generated canaries, labels-only QA, coarse-region QA, safe-zone-only QA, and alias matching before asking for the full generated fixture set. Guarded L4 run `phase39cq-so3-20260601T154510` verified the already staged 2B, 4B, and 8B FP8 private model assets and uploaded private QA artifacts, but all candidates failed the perception canary gate before the original generated fixtures were run. The best label recall was `0.60` for 4B and 8B FP8, and coarse-region accuracy stayed `0.00` for every candidate. It does not approve any new model weight download, new model staging, non-Qwen candidate, community quantization, provider path, real-media path, beta, or production use. VLM status remains `blocked`; Phase 39D controlled real-frame verification, Phase 39E planning integration, and beta-readiness gates remain separate.

Phase 39C-SG is the SGLang alternate runtime evaluation path for those already staged PR #87 candidates only. It records SGLang source/license/runtime/structured-output evidence, adds a dedicated SGLang staging image and Cloud Run Job path, and reuses the SO3 canary/decomposed QA thresholds before any original generated fixture pass can be claimed. It does not download or stage models. Runtime must copy exact PR #87 private GCS objects, verify SHA-256 and aggregate hashes, use a local model path only, block runtime auto-download, and upload private QA artifacts under `activation/phase39c/generated-vlm-sglang-runtime/<run-id>/`. Until one official Qwen candidate passes SGLang generated fixture QA, VLM status remains `blocked`; Phase 39D, Phase 39E, production, beta, broad media, provider calls, non-Qwen candidates, new model downloads, and Track A remain blocked.

Phase 39C-SG-BUILD is the Cloud Build unblock for the PR #100 local SGLang image-build blocker. It does not change the approved candidate set or model-weight state. Run `phase39c-sg-build-20260601T232400-overlay` built a guarded overlay image through Cloud Build, verified image digest `sha256:39cdb9bf6123c4d9568a9bfd55041b138ed0c03adad9f02a9c51482fec5adfa9`, and ran the staging Cloud Run L4 job against all three already staged PR #87 official Qwen candidates. Private model copy, checksum verification, local model path use, and private artifact upload were verified, but every candidate failed before generated fixture inference because SGLang imported `sgl_kernel/common_ops.abi3.so` and the Cloud Run L4 runtime reported unresolved CUDA driver symbol `cuGreenCtxDestroy`. VLM remains `blocked`; this does not approve production, beta, broad media, non-Qwen candidates, new model downloads, provider calls, Track A, Phase 39D controlled real-frame verification, or Phase 39E planning integration.

Phase 39C-SG-FIXED is the fixed-kernel follow-up for PR #107's SGLang import-smoke blocker. It does not download, stage, or approve new model weights. It records upstream SGLang `cuGreenCtxDestroy` issue evidence, tests only bounded fixed SGLang/kernel package profiles on Cloud Run L4 import smoke, and escalates to generated synthetic fixture runtime only after an import-smoke pass. Runtime must still use the already staged PR #87 private Qwen assets, exact checksum manifests, local model paths only, and offline/no-auto-download guards. Until a fixed profile imports and one candidate passes generated fixture QA, VLM remains `blocked`; Phase 39D, Phase 39E, production, beta, broad media, provider calls, non-Qwen candidates, new model downloads, and Track A remain blocked.

Phase 39C-SG-AUTH-RERUN is the noninteractive auth unblock for PR #110's fixed-kernel path. It does not download, stage, or approve new model weights. It adds a gcloud auth and permission preflight that supports existing active auth, service-account impersonation, access-token file/env, Workload Identity Federation, and attached service-account environments while blocking service-account keys and token disclosure. If auth passes, the existing fixed-kernel Cloud Build/import-smoke/generated-runtime runner may continue against the already staged PR #87 official Qwen candidates only. If auth fails, Cloud Build, import smoke, model copy, and generated runtime remain skipped. VLM remains `blocked` until a fixed SGLang profile imports on Cloud Run L4 and one candidate passes generated fixture QA; Phase 39D, Phase 39E, production, beta, broad media, provider calls, non-Qwen candidates, new Qwen downloads, service-account keys, and Track A remain blocked.
