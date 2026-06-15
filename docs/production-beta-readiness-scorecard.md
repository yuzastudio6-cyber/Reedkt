# Production Beta Readiness Scorecard

M17 scorecards classify readiness, worker security, tool security, model-weight policy, cost controls, concurrency limits, observability, logging, privacy/retention, artifact storage, export delivery, audit logs, incident response, and beta readiness.

The default scorecard is blocked. Internal dry-run testing can be allowed only when E2E dry-run passed and security/cost docs exist. External beta, real user media beta, and paid production remain blocked.

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

Phase 52A shared agent/tool ownership architecture counts only as coordination
readiness with private architecture artifacts and one Supabase milestone sync
record. It is not tool runtime execution, model inference, media processing,
web search, map rendering, browser capture, provider execution, public
artifact, external beta, paid production, broad real media, or production
approval.

AI_TOOLS_CREATIVE_GRAPHICS Batch 1 install/import/synthetic proof counts only
as owner-lane package proof for `d3`, `echarts`, `vega-lite`, and `vega`.
Decision `ai_graphics_batch_1_install_import_synthetic_proof_passed_with_warnings`
does not approve browser/WebGL runtime, tool-route execution, worker execution,
provider runtime, render/export, Supabase mutation, storage transfer, signed
URLs, public artifacts, internal beta, external beta, paid production, or
production readiness.
