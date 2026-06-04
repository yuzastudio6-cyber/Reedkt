# Production Beta Readiness Scorecard

M17 scorecards classify readiness, worker security, tool security, model-weight policy, cost controls, concurrency limits, observability, logging, privacy/retention, artifact storage, export delivery, audit logs, incident response, and beta readiness.

The default scorecard is blocked. Internal dry-run testing can be allowed only when E2E dry-run passed and security/cost docs exist. External beta, real user media beta, and paid production remain blocked.

Phase 36J Signalsmith controlled real-media timing/stretch evidence, when present, counts only as one bounded approved private controlled sample using the Phase 36I Signalsmith runtime path. It may use a private CPU-only linux/amd64 Cloud Run Job with `ffmpeg`/`ffprobe` solely to complete the bounded sample when local runtime lacks those tools. The 2026-06-03 FFmpeg runtime rerun built and executed the CPU worker, but Phase 36J remains blocked because private artifact upload failed: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com` lacks `storage.objects.get` on the Phase 36J QA prefix. It does not approve broad media, arbitrary media, full-video processing, DeepFilterNet runtime, Demucs, OCR, VLM, provider calls, production, external beta, paid production, public output, broad Cloud Run use, broad IAM mutation, or Track A. Audio/timing tool-family beta status remains `blocked` until the narrow QA-prefix access blocker is resolved and the controlled rerun uploads private artifacts successfully.

Phase 36I Signalsmith Stretch generated-fixture evidence, when present, counts only as Track B generated synthetic audio timing/stretch evidence. It pins exact source, records MIT/source/runtime evidence, builds a temp-only local C++ runner, and runs deterministic generated stretch fixtures. It is not controlled real-media timing/stretch, DeepFilterNet runtime, Demucs, OCR, VLM, provider, production, external beta, paid production, broad media, arbitrary media, public output, Docker/Cloud Run/Cloud Build, IAM mutation, or Track A approval. Audio/timing tool-family beta status remains `phase-complete but tool-family incomplete` after a pass until Phase 36J, later Demucs provenance decision, rollback/support policy, and final beta-readiness gate pass.

Phase 46E media/data internal beta-readiness gate passed and marks the media/data tool family as an `internally beta-ready candidate`, only for restricted internal QA/planning scope. It used committed Phase 46A-46D evidence, exact private JSON metadata verification, privacy/storage gates, rollback/support policy, and Phase 46E metadata-only private upload. It does not unlock product-wide beta, external beta, paid production, production, broad media, arbitrary media, public output, provider calls, VLM runtime retries, OCR runtime outside approved phases, Docker/Cloud Run/Cloud Build/GPU jobs, IAM mutation, or Track A.

Phase 46D-AUTH-RERUN completed a guarded noninteractive GCP auth/access rerun before the existing DuckDB/Polars reporting QA path. It used active-account auth, printed no tokens, created no service-account keys, read exact Phase 46B/46C private JSON metadata, uploaded Phase 46D metadata-only private artifacts, and reran DuckDB/Polars consistency reporting. Media/data tool-family beta status is `phase-complete but tool-family incomplete`; this is not internal beta readiness until the Phase 46E media/data internal beta-readiness gate passes.

Phase 46D DuckDB/Polars reporting QA integration has passed for metadata-only internal QA reporting. DuckDB and Polars metadata reporting passed and agreed on committed safe reports plus exact private metadata evidence, but this is not internal beta, external beta, paid production, broad media, arbitrary media, media processing, public output, provider, VLM runtime, OCR runtime, Docker/Cloud Run/Cloud Build, IAM mutation, or Track A approval.

Phase 46C controlled real-video media/data suite, when present, counts only as bounded private controlled-media evidence for OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, and Polars. It is not internal beta, external beta, paid production, broad media, arbitrary media, public output, provider, VLM runtime, OCR runtime, Docker/Cloud Run/Cloud Build, IAM mutation, or Track A approval. Media/data tool-family beta status remains `phase-complete but tool-family incomplete` after a passing Phase 46C until Phase 46D reporting/QA integration, rollback policy, and final beta decision pass.

Phase 46B generated media/data analysis suite, when present, counts only as deterministic generated-fixture evidence for OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, and Polars. It is not internal beta, external beta, paid production, broad media, real-media processing, public output, provider, VLM runtime, OCR runtime, Docker/Cloud Run, IAM mutation, or Track A approval. Media/data tool-family beta status remains `phase-complete but tool-family incomplete` after a passing Phase 46B until Phase 46C controlled real-media verification, Phase 46D reporting/QA integration, rollback policy, and final beta decision pass.

Phase 46A media/data readiness evidence, when present, counts only as a Track B source/license/runtime-readiness audit for OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, and Polars. It is not internal beta, external beta, paid production, broad media, real-media processing, public output, provider, VLM runtime, Docker/GCP mutation, or Track A approval. Media/data tool-family beta status is `phase-complete but tool-family incomplete` until Phase 46B generated fixtures, Phase 46C controlled real-media verification, Phase 46D reporting/QA integration, private artifacts, rollback policy, and final beta decision pass.

Phase 39C-DECISION evidence confirms VLM is not a beta-ready tool family. Phase 39C generated runtime verification remains blocked after Qwen/vLLM OOM and semantic generated-image QA failures, and after Qwen/SGLang Cloud Run L4 kernel import-smoke failures. Phase 39D controlled real-frame VLM, Phase 39E planning integration, runtime retries without new approval, provider calls, production, internal beta, external beta, public output, broad media, arbitrary media, non-Qwen candidates, new model downloads, unapproved GPU/runtime classes, and Track A remain blocked. The recommended next implementation path is Phase 46A media/data tool readiness audit, not beta unlock.

Phase 35F SAM2 feature E2E evidence, when present, counts only toward internal
SAM2 feature testing. It is not external beta, paid production, broad real
media, provider, Revideo, FILM, slow-motion, Real-ESRGAN, public delivery, or
final export approval.

Phase 36E DeepFilterNet feature E2E evidence counts only toward internal audio
feature testing. It is not external beta, paid production, broad real media,
arbitrary media, RNNoise, Demucs, provider, Revideo, FILM, slow-motion, public
delivery, or final export approval.

Phase 36F audio system readiness evidence counts only toward controlled
internal audio feature testing. It is not external beta, paid production, broad
real media, arbitrary media, RNNoise, Demucs, provider, Revideo, FILM,
slow-motion, public delivery, or final export approval.

Phase 18 does not change this status. The activation roadmap may prepare human-run staging and controlled private video tests, but external beta and paid production stay blocked until the Phase 37 go/no-go checklist receives all required approvals.

Phase 36G audio stack correction evidence counts only as an internal scope clarification. RNNoise is not active, and Demucs remains blocked pending pretrained-model license/provenance clarity. It is not external beta, paid production, broad real media, arbitrary media, provider, Revideo, FILM, slow-motion, public delivery, or final export approval.

Phase 36H DeepFilterNet runtime hardening evidence is currently blocked. Source/license evidence, Phase 36G/36C/36D/46C evidence loading, approved private artifact metadata, controlled-sample metadata, and private metadata upload passed, but generated fixture and controlled real-audio execution did not run because the approved DeepFilterNet v0.5.6 CLI is Linux x86_64 musl while the local host is darwin arm64, and ffmpeg was unavailable for bounded extraction. Audio/timing tool-family beta status remains `blocked`; Phase 36I Signalsmith Stretch should not proceed as a completion path unless a human explicitly accepts this blocker or reruns Phase 36H on an approved Linux x86_64 runtime.

Phase 39C-SG-AUTH-RERUN evidence, when present, counts only toward unblocking the Track B VLM SGLang fixed-kernel generated-fixture rerun. Auth success, Cloud Build success, or import-smoke success alone is not VLM beta readiness. Internal/external beta, paid production, broad media, provider calls, public output, Phase 39D controlled real-frame VLM, Phase 39E planning integration, non-Qwen candidates, new Qwen model downloads, service-account keys, and Track A remain blocked unless the full VLM beta-readiness chain passes later.
