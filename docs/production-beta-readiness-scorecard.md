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

AI_TOOLS_CREATIVE_GRAPHICS Batch 1 QA decision
`ai_graphics_batch_1_qa_passed_with_warnings` accepts the Batch 1 proof with
warnings for owner-lane planning only. Batch 2 approval may be prepared, but
runtime execution, browser/WebGL behavior, route/tool/worker/provider runtime,
Supabase mutation, GCS/storage transfer, signed URLs, public artifacts,
internal beta, external beta, paid production, and production remain blocked.

AI_TOOLS_CREATIVE_GRAPHICS Batch 2 approval decision
`approved_with_warnings_for_ai_graphics_batch_2` is future-only for a later
install/import/synthetic proof of `satori`, `@svgdotjs/svg.js`, `@viz-js/viz`,
and `lottie-web`. It does not install dependencies now, mutate package-lock now,
run Batch 2 imports or fixtures now, or approve route/tool/worker/provider
runtime, browser/WebGL runtime, render/export, Supabase mutation, GCS/storage
transfer, signed URLs, public artifacts, internal beta, external beta, paid
production, or production readiness.

AI_TOOLS_CREATIVE_GRAPHICS Batch 2 install/import/synthetic proof decision
`ai_graphics_batch_2_install_import_synthetic_proof_passed_with_warnings`
accepts owner-lane proof for `satori`, `@svgdotjs/svg.js`, `@viz-js/viz`, and
`lottie-web` with warnings. It is not E2E production proof and does not approve
route/tool/worker/provider runtime, browser/WebGL runtime, Lottie player
behavior, Remotion render/export, resvg rasterization, Supabase mutation,
GCS/storage transfer, signed URLs, public artifacts, internal beta, external
beta, paid production, or production readiness.

AI_TOOLS_CREATIVE_GRAPHICS Batch 2 QA decision
`ai_graphics_batch_2_qa_passed_with_warnings` accepts the Batch 2
install/import/synthetic proof for owner-lane planning only. Batch 3 approval
may be prepared, but runtime route/tool/worker/provider execution,
browser/WebGL behavior, Lottie player behavior, Remotion render/export, resvg
rasterization, Supabase mutation, GCS/storage transfer, signed URLs, public
artifacts, internal beta, external beta, paid production, and production remain
blocked.

AI_TOOLS_CREATIVE_GRAPHICS Batch 3 approval decision
`approved_with_warnings_for_ai_graphics_batch_3` is future-only for later
install/import/manifest proof of `animejs`, `three`, `pixi.js`, `konva`, and
`babylonjs`. It does not install dependencies now, mutate package-lock now, run
Batch 3 imports or fixtures now, or approve route/tool/worker/provider runtime,
browser/WebGL/canvas runtime, Remotion render/export, resvg rasterization,
Supabase mutation, GCS/storage transfer, signed URLs, public artifacts,
internal beta, external beta, paid production, or production readiness.

AI_TOOLS_CREATIVE_GRAPHICS Batch 3 install/import/manifest proof decision
`ai_graphics_batch_3_install_import_manifest_proof_passed_with_warnings`
accepts owner-lane package proof for `animejs`, `three`, `pixi.js`, `konva`,
and `babylonjs` with warnings. It is not E2E production proof and does not
approve browser/WebGL/canvas runtime, route/tool/worker/provider runtime,
Remotion render/export, resvg rasterization, Supabase mutation, GCS/storage
transfer, signed URLs, public artifacts, internal beta, external beta, paid
production, or production readiness.

AI_TOOLS_CREATIVE_GRAPHICS Batch 3 QA decision
`ai_graphics_batch_3_qa_passed_with_warnings` accepts the Batch 3
install/import/manifest proof for owner-lane planning only. Batch 4 approval
may be prepared, but browser/WebGL/canvas runtime, route/tool/worker/provider
runtime, Remotion render/export, resvg rasterization, Supabase mutation,
GCS/storage transfer, signed URLs, public artifacts, internal beta, external
beta, paid production, and production remain blocked.

AI_TOOLS_CREATIVE_GRAPHICS Batch 4 approval decision
`approved_with_warnings_for_ai_graphics_batch_4_policy_and_handoff_review`
approves policy and handoff planning only for `@resvg/resvg-js`, SVG raster
fallbacks, Remotion / Track A handoff requirements, and Batch 1-3
route-manifest readiness. It does not install dependencies, mutate
package-lock, run Batch 4 imports or fixtures, approve resvg rasterization,
approve Remotion render/export, or unlock browser/WebGL/canvas runtime,
route/tool/worker/provider runtime, Supabase mutation, GCS/storage transfer,
signed URLs, public artifacts, internal beta, external beta, paid production,
or production readiness.

AI_TOOLS_CREATIVE_GRAPHICS Batch 4 policy QA decision
`ai_graphics_batch_4_policy_qa_passed_with_warnings` accepts the Batch 4
policy and handoff packet with warnings. The next recommended approval packet
is `AI_TOOLS_CREATIVE_GRAPHICS_ROUTE_MANIFEST_INTEGRATION_APPROVAL_PACKET`;
resvg rasterization, Remotion render/export, route/tool/worker/provider
execution, Supabase mutation, GCS/storage transfer, signed URLs, public
artifacts, internal beta, external beta, paid production, and production
remain blocked.
