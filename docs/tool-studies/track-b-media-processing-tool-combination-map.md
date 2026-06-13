# TRACK_B_MEDIA_PROCESSING Tool Combination Map

This map defines how Track B planning combines tool evidence and hands off safe manifests. It is not an execution graph.

| Combination | Track B Use | Required Inputs | Planned Output | Consumers | Blocked In TOOL-STUDY-0 |
| --- | --- | --- | --- | --- | --- |
| PyAV + PySceneDetect for scene/shot planning | Container/timecode and scene-boundary policy. | approved clip refs, timecode refs, scene threshold policy | scene/shot manifest | Track A, Worker Runtime future, Frontend review | PyAV execution, PySceneDetect execution, media processing |
| OpenCV + Sharp/libvips for frame/image derivative planning | Frame QA, region/crop hints, thumbnails, review still policy. | frame refs, image refs, checksum refs, safe-zone policy | frame/image derivative manifest | Track A, AI Tools, Compliance | OpenCV execution, Sharp/libvips execution, derivative creation |
| PaddleOCR + OpenCV for text-in-frame analysis planning | Text region planning and caption/label collision risk. | frame refs, OCR model evidence refs, pre-processing policy | OCR/text-region manifest | Track A, AI Tools, Compliance, Frontend | OCR execution, raw media OCR |
| DuckDB + Polars for media metadata/table analysis planning | Route, cost, QA, and media metadata summaries. | sanitized metadata tables, route manifest refs | media query summary manifest | Observability, Billing, Supabase metadata handoff | DuckDB/Polars runtime, Supabase writes |
| DeepFilterNet + Sound/Music/Audio handoff for noise cleanup planning | Technical noise/voice clarity planning. | audio segment refs, prior bounded evidence refs, cleanup policy | audio cleanup planning manifest | SOUND_MUSIC_AUDIO, Track A, Worker future | DeepFilterNet runtime, audio cleanup execution |
| Signalsmith Stretch + Track A handoff for speed/time-stretch planning | Timing/stretch policy for future visual/audio alignment. | timing refs, ratio policy, audio segment refs | stretch/speed-change manifest | Track A, SOUND_MUSIC_AUDIO | Signalsmith runtime, FFmpeg execution |
| Track B media analysis -> Track A preview/render planning | Provide safe shot, OCR, metadata, and media readiness summaries. | media analysis manifest, checksums, QA | `track_b_media_analysis_intake` | TRACK_A_RENDER_EXPORT | Track A render/export execution |
| Track B media analysis -> AI Tools creative overlay planning | Help avoid text/face/object collisions and choose asset placement. | frame/image/OCR/safe-zone manifests | AI Tools constraint handoff | AI_TOOLS_CREATIVE_GRAPHICS | graphics generation, rasterization |
| Track B media analysis -> Worker Runtime future execution | Define future approved-snapshot and artifact-scope requirements. | approved snapshot refs, route manifest, artifact scope | worker handoff policy | WORKER_RUNTIME_JOBS | worker execution, sidecar launch |
| Track B manifest -> Supabase metadata handoff | Define future metadata row shape without writing. | safe metadata export, private refs, checksums | Supabase-ready metadata handoff | SUPABASE_RLS_STORAGE_DATABASE | Supabase mutation, SQL, migrations |
| Demucs future path -> blocked provenance/runtime unlock | Record legal/provenance/runtime blockers. | provenance evidence refs only | Demucs blocker manifest | SOUND_MUSIC_AUDIO, Compliance | Demucs runtime, model download, stem separation |
| Qwen3-VL/vLLM future path -> blocked VLM/runtime unlock | Record VLM/model-serving blockers and review gates. | model evidence summaries, runtime blocker refs | VLM/vLLM blocker manifest | PROVIDER_GATEWAY_MODELS, WORKER_RUNTIME_JOBS | Qwen/VLM runtime, vLLM serving, model calls |

## Combination Rules

- Track B can combine only sanitized manifests, summaries, private refs, checksums, source provenance, and QA records.
- Track B must not process raw media, broad media, raw prompts, raw provider outputs, signed URLs, public URLs, private rows, or secrets in TOOL-STUDY-0.
- Track B handoffs are review/planning-only until a later approved worker/runtime phase authorizes execution.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
