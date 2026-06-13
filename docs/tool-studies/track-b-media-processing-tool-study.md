# TOOL-STUDY-0 TRACK_B_MEDIA_PROCESSING Study

Owner: `TRACK_B_MEDIA_PROCESSING`

Decision: `track_b_media_processing_tool_study_passed_docs_only`

Status after diagnostics: `complete_for_TRACK_B_MEDIA_PROCESSING_owner_study`

Base evidence: PR #350 post-merge source-of-truth verification at `aefb487af3cf9d8d6b07b34c03aa28b1ea9dd5d7`.

This packet is a capability-routing study only. It does not execute tools, workers, routes, providers, media processing, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, dependency installs, raw prompts, beta unlocks, or production unlocks.

## Source-Of-Truth Basis

| Source | Status | Study Fact |
| --- | --- | --- |
| `docs/github-merge-hygiene/reports/post_merge_source_of_truth_verification_report.json` | present locally | PR #350 verifies the merged frozen batch, source branches, blocked scopes, and TOOL-STUDY-0 as the next phase. |
| PR #298 remote merged evidence | verified by PR #350 | Track B clean-staging sync completed with safe metadata and no runtime execution. |
| `open-source-tool-registry.md` | present locally | Controlled tools are preferred for exact processing and QA, but no package is installed or executed by the milestone. |
| `tool-strategy-planner.md` | present locally | Tool strategy is planning-only and does not install packages, execute tools, call providers, process media, or render. |
| `docs/production-cpu-worker-tool-install-policy.md` | present locally | Future CPU worker candidates include PyAV, PySceneDetect, OpenCV headless, DuckDB, Polars, and Sharp/libvips support. |
| `docs/production-container-image-plan.md` | present locally | Container and worker image plans are templates/readiness targets, not builds, pushes, deployments, or media execution. |
| `docs/agents/tool-ownership-map.md` | present locally | Track B owns OCR/data/CV/media-routing metadata; AI Tools owns creative graphics; Track A owns render/export. |
| `docs/agents/tool-capability-registry.md` | present locally | Registry records are metadata only and leave runtime/beta/production paths blocked. |

Missing local source docs are recorded in `track-b-media-processing-source-of-truth-audit.json` as audit facts, not blockers, because PR #350 verifies the remote merged branch evidence.

## Owned Tools

| Tool | Purpose | Strengths | Weaknesses / Bad Fits | Inputs | Outputs | Evidence-Backed Readiness | Blocked Runtime Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `opencv` | Frame/image analysis planning and visual QA metadata. | Safe-zone hints, crop/framing QA, blur/quality checks, simple region detection. | Not semantic understanding, not final composition, not proof of object identity. | Approved frame refs, derivative refs, safe-zone policy. | Frame analysis manifest, safe-zone QA metadata. | Future CPU/QA worker candidate in local worker docs. | `blocked_no_runtime_execution` |
| `pyav` | Container, stream, frame, and timecode access planning. | Precise frame/timecode access policy and FFmpeg handoff metadata. | Not scene meaning, not final encoding, not unbounded decode approval. | Approved clip refs, bounded time/frame ranges, checksum refs. | Frame access manifest, stream/timecode manifest. | Future CPU worker candidate. | `blocked_no_runtime_execution` |
| `pyscenedetect` | Scene/shot-boundary candidate planning. | Deterministic scene split candidates and pacing references. | Cannot decide final cuts, source cleanup, or meaning preservation alone. | Approved clip refs, timecode refs, threshold policy. | Scene detection manifest, shot-boundary candidate report. | Future CPU worker candidate. | `blocked_no_runtime_execution` |
| `sharp_libvips` | Image derivative, resize, thumbnail, crop, and still-review planning. | Fast image prep and derivative policy; useful for review stills and OCR prep. | Not final video compositing; not public artifact delivery; untrusted image handling needs review. | Approved image/frame refs, checksum refs, derivative policy. | Private derivative manifest, thumbnail/resize policy. | Future CPU/render/QA worker support. | `blocked_no_runtime_execution` |
| `duckdb` | Local analytical metadata and route/cost summary planning. | Embedded SQL over safe tables, row counts, joins, report shaping. | Not Supabase replacement, not private row dump, not persistent source of truth. | Sanitized metadata tables, committed fixture JSON/CSV, route refs. | Query summary manifest, metadata rollup. | Future local/server analysis candidate. | `blocked_no_runtime_execution` |
| `polars` | DataFrame-style QA and metadata transformation planning. | Fast columnar transforms, rollups, schema checks, route readiness summaries. | Not persistent DB, not media decoder, not private payload processor. | Sanitized metadata frames, fixture summaries. | DataFrame summary manifest, QA rollup. | Future local/server analysis candidate. | `blocked_no_runtime_execution` |
| `paddleocr` | OCR/text-in-frame planning. | Text boxes, confidence, language hints, caption/source-label collision risk. | Not fact validation, not final captions, not broad/private OCR execution here. | Approved frame refs, bounded fixture refs, OCR model evidence refs. | OCR manifest, text-region QA metadata. | OCR runtime remains separately gated. | `blocked_pending_ocr_runtime_approval` |
| `paddlepaddle` | Runtime substrate planning for PaddleOCR. | Supports future OCR model/runtime evaluation. | Not a standalone ReeditPro feature; not frontend/browser runtime. | OCR model policy refs, runtime dependency refs. | Runtime dependency manifest, model policy record. | Optional/future worker dependency. | `blocked_pending_dependency_review` |
| `track_b_route_capability_manifest_metadata` | Route/capability metadata contract. | Captures route eligibility, capability ids, owner boundaries, and fail-closed flags. | Does not enable route execution. | PR #298 reports, capability registry refs, approved snapshot refs. | Capability map, route handoff metadata, blocked-scope facts. | Safe metadata evidence verified by PR #350. | `blocked_route_execution_false` |
| `track_b_cost_capacity_metadata` | Cost/capacity planning metadata. | Cost class, duration/frame count assumptions, capacity risk, bounded estimates. | Not billing, not credit mutation, not provider spend authorization. | Sanitized route metadata, cost policy refs. | Cost/capacity manifest, estimate assumptions. | Safe metadata evidence only. | `blocked_no_billing_or_runtime` |
| `track_b_benchmark_sidecar_metadata` | Owned benchmark, profiler, and sidecar metadata. | Captures future host capability, sidecar policy, benchmark evidence, and no-op readiness. | Not sidecar launch, not host probing, not broad device fingerprinting. | Sanitized benchmark summaries, sidecar policy refs, fixture metadata. | Benchmark/sidecar manifest, profiler policy, audit refs. | Planning only; worker no-op evidence remains non-runtime. | `blocked_no_sidecar_or_worker_execution` |

## Related But Not Owned Here

| Related Tool / Lane | Owner | Track B Relationship | Status |
| --- | --- | --- | --- |
| `deepfilternet` | `SOUND_MUSIC_AUDIO` | Track B may hand off technical noise/voice evidence, but audio cleanup ownership and runtime approval are not in this study. | `blocked_related_owner_pending` |
| `signalsmith_stretch` | `SOUND_MUSIC_AUDIO` | Track B may hand off timing/stretch metadata; Sound and Track A decide creative/audio timing execution later. | `blocked_related_owner_pending` |
| `demucs` | `SOUND_MUSIC_AUDIO` | Track B records stem-separation blockers only. | `blocked_related_owner_pending` |
| Creative/image generation tools | `AI_TOOLS_CREATIVE_GRAPHICS` | Track B provides safe-zone/OCR/media metadata only. | `blocked_related_owner_pending` |
| Final render/export pipeline | `TRACK_A_RENDER_EXPORT` | Track B provides media-analysis intake only. | `blocked_related_owner_pending` |

## Study Rules

- Every Track B record is metadata/readiness-only.
- Signed URLs are never source of truth.
- Source of truth remains private refs, checksums, approved plan snapshot refs, manifest ids, and Supabase row refs once a future Supabase write phase is separately approved.
- Raw prompts cannot route to tools, workers, providers, or media processors.
- `routeExecutionAllowed`, `runtimeExecutionAllowed`, `workerExecutionAllowed`, `providerExecutionAllowed`, and `mediaProcessingAllowed` remain `false`.
- `SOUND_MUSIC_AUDIO`, `AI_TOOLS_CREATIVE_GRAPHICS`, and `TRACK_A_RENDER_EXPORT` owner studies remain pending before any tool-route execution unlock.

## Supabase Classification

- Supabase update required: `no write`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, media processing, browser capture, Docker or Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
