# Production Beta Readiness Scorecard

M17 scorecards classify readiness, worker security, tool security, model-weight policy, cost controls, concurrency limits, observability, logging, privacy/retention, artifact storage, export delivery, audit logs, incident response, and beta readiness.

The default scorecard is blocked. Internal dry-run testing can be allowed only when E2E dry-run passed and security/cost docs exist. External beta, real user media beta, and paid production remain blocked.

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

Phase 39C-SG-AUTH-RERUN evidence, when present, counts only toward unblocking the Track B VLM SGLang fixed-kernel generated-fixture rerun. Auth success, Cloud Build success, or import-smoke success alone is not VLM beta readiness. Internal/external beta, paid production, broad media, provider calls, public output, Phase 39D controlled real-frame VLM, Phase 39E planning integration, non-Qwen candidates, new Qwen model downloads, service-account keys, and Track A remain blocked unless the full VLM beta-readiness chain passes later.
