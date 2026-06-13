# TOOL-STUDY-0 TRACK_B_MEDIA_PROCESSING Tool Combination Map

This map is not an execution graph. It defines metadata-only combinations that future approved worker phases may consider.

| Combination | Track B Use | Inputs | Planned Output | Consumer | Blocked In This Phase |
| --- | --- | --- | --- | --- | --- |
| `pyav` + `pyscenedetect` | Plan scene and shot-boundary candidate manifests. | Approved clip refs, bounded timecode refs, scene threshold policy. | Scene/shot candidate manifest. | `TRACK_A_RENDER_EXPORT`, future Worker Runtime. | PyAV execution, PySceneDetect execution, media decode. |
| `opencv` + `sharp_libvips` | Plan frame QA, safe-zone, crop, review-still, and derivative policy. | Frame refs, checksum refs, safe-zone policy. | Frame analysis and derivative policy manifest. | Track A, AI Tools, Compliance. | OpenCV execution, Sharp/libvips execution, derivative creation. |
| `paddleocr` + `paddlepaddle` + `opencv` metadata | Plan text-region/OCR collision metadata. | Approved frame refs, OCR model evidence refs. | OCR/text-region manifest. | Track A, AI Tools, Compliance. | OCR runtime, model download, raw media OCR. |
| `duckdb` + `polars` | Plan route/cost/readiness rollups over safe metadata. | Sanitized tables, fixture JSON/CSV, route manifest refs. | Query and DataFrame summary manifest. | Observability, Billing planning, Supabase future metadata. | DuckDB/Polars runtime, Supabase write, private row dump. |
| Route/capability manifest + cost/capacity metadata | Plan tool-route dry-run prerequisites and blocked flags. | PR #298 reports, capability registry refs, approved snapshot refs. | Route/capability/cost handoff. | TOOL-ROUTE future approval. | Route execution, worker execution, provider calls. |
| Benchmark/sidecar metadata + no-op worker evidence | Plan future local sidecar/profiler policies without launching anything. | Sanitized benchmark records, no-op lifecycle evidence, sidecar policy refs. | Benchmark/sidecar planning manifest. | Worker Runtime future. | Sidecar launch, host probing, Docker/Cloud Run. |
| Track B media-analysis manifests -> `AI_TOOLS_CREATIVE_GRAPHICS` | Provide OCR/safe-zone/collision constraints. | OCR refs, frame QA refs, derivative policy refs. | Graphics constraint handoff. | AI Tools owner study. | Creative graphics generation, rasterization, public artifacts. |
| Track B media-analysis manifests -> `TRACK_A_RENDER_EXPORT` | Provide media-analysis intake for render/export planning. | Scene/shot refs, metadata refs, derivative policy refs. | `track_b_media_analysis_intake`. | Track A owner study. | Render, export, Track A runtime. |
| Track B technical audio notes -> `SOUND_MUSIC_AUDIO` | Provide noise/stretch observations without owning audio runtime. | Audio segment refs, timing refs, prior evidence refs. | Sound/Music/Audio handoff. | Sound owner study. | DeepFilterNet, Signalsmith Stretch, Demucs execution. |

## Combination Rules

- Combine sanitized manifests, private refs, checksums, approved snapshot refs, owner ids, and QA status only.
- Do not combine raw media, raw prompts, raw provider outputs, signed URLs, public URLs, private rows, or secret payloads.
- Do not treat a capability manifest as execution approval.
- Do not route to final render/export, creative graphics, or Sound/Music/Audio runtime until those owners complete their own studies and later execution approvals.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, media processing, browser capture, Docker or Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
