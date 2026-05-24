# Open-Source Editing Tool Runtime Registry

Status: RP-TOOLS-01 code-enforced runtime contract registry.

The canonical registry now lives in `server/tools/editing-tool-registry.ts` with shared types in `server/tools/editing-tool-contracts.ts`, safe readiness adapters in `server/tools/editing-tool-readiness.ts`, and worker mappings in `server/tools/editing-worker-tool-map.ts`.

This registry does not install tools, process media, call providers, call Stripe, deploy production, drain queues, or authorize customer media. It records worker/runtime contracts and runs safe version, import, or package-resolution checks only.

## Runtime Scripts

| Script | Purpose | Safety behavior |
| --- | --- | --- |
| `npm.cmd run tools:registry` | Prints the typed registry, current readiness statuses, worker mappings, and safety flags. | Metadata/readiness only; no media processing or secrets. |
| `npm.cmd run tools:readiness` | Runs safe readiness checks for all registered tools. | Non-strict; optional/planned missing tools are reported but do not fail. |
| `npm.cmd run tools:readiness:strict` | Runs strict readiness for tools required by the current milestone. | Fails only if current required tools are missing. |
| `npm.cmd run smoke:tools:registry` | Validates every registry entry and status field. | Contract test only. |
| `npm.cmd run smoke:tools:readiness` | Validates safe readiness output and strict future failure behavior. | Uses a simulated missing future tool; no media work. |
| `npm.cmd run smoke:tools:worker-map` | Validates every worker maps only to known tools. | Static mapping test only. |

Current-milestone strict required tools are `ffmpeg`, `ffprobe`, and `remotion` because they back the already-passed staging render infrastructure, real-video upload-to-preview, and media-analysis gates plus the implemented RP-EDIT-01 timeline composition canary. RP-MEDIA-01 passed with only `ffmpeg` and `ffprobe` required; Remotion was not required for that gate. RP-EDIT-01 requires `ffmpeg`, `ffprobe`, and `remotion`. Future tools remain optional/planned until a specific worker canary makes them required.

## Runtime Tool Table

| Tool | Purpose in ReeditPro | Worker boundary | Required / optional status | Current readiness | Input / output contract | Timeout / resource needs | Failure behavior | License / security note | Production approval status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FFmpeg | Transcode, trim, mux, encode previews/exports, normalize audio, and generate tiny staging fixtures. | Staging canary or backend worker image; never browser-side. | Required for current staging render, media-analysis, and timeline gates and future render/media workers. | Code-enforced and proven in staging smoke gates, including RP-MEDIA-01 thumbnail extraction. | Input: local worker temp file or approved storage object copied to temp. Output: bounded media artifact with checksum/MIME/frame metadata. | Current canary profile uses tiny `3s`, `160x90`, `15fps` media; production workers need explicit caps. | Fail job, clean partial artifacts, record bounded error metadata. | LGPL-safe configuration must be preserved until production legal/build review. | Staging smoke only. |
| FFprobe | Validate duration, codec, frame rate, streams, and media container metadata. | Media-analysis and render preflight workers. | Required for current staging gates and future real media validation. | Code-enforced and proven in staging smoke gates, including RP-MEDIA-01 metadata extraction. | Input: local worker media file. Output: sanitized metadata summary. | Short bounded probe timeout; light CPU/I/O. | Block media analysis/render when metadata cannot be trusted. | Same FFmpeg distribution review; sanitize metadata logs. | Staging smoke only. |
| Remotion | Compose previews/final canvas layers, source video layers, captions, panels, and approved motion briefs. | Cloud Run render worker. | Required for current staging render gates, implemented RP-EDIT-01 timeline gate, and future render worker. | Code-enforced and proven in staging render smoke gates; required by RP-EDIT-01 before live dispatch. | Input: approved render props plus local/static asset references. Output: video artifact and render metadata. | Current canary profile: `2Gi`, `2 CPU`, `concurrency=1`, `timeout=300`, `NODE_OPTIONS=--max-old-space-size=1536`. | Fail closed with bounded error summaries and cleanup. | Review npm dependency surface; never pass secrets, raw media bytes, or signed URLs through props. | Staging smoke only. |
| Sharp/libvips | Resize/crop images, create thumbnails, prepare overlays, and generate simple image assets. | Image asset worker and render preprocessing worker. | Optional until image asset worker canary. | Safe package/import check available. | Input: approved local image or storage object staged into worker temp. Output: image artifact with dimensions/checksum. | Pixel/file-size caps required; memory-bound. | Fail the image work item and clean partial outputs. | libvips dependency/security/LGPL review required. | Planning only. |
| OpenCV | Visual QA, safe-zone checks, blur/quality checks, frame analysis, and future mask/tracking support. | Media-analysis and image asset workers. | Optional slot in RP-MEDIA-01; not blocking until explicitly enabled. | Safe import check available. | Input: sampled frames or approved local video/image files. Output: structured QA findings. | CPU-heavy; cap frame count, resolution, and duration. | Return QA warning/blocker; never silently alter approved plan. | Native dependency/CVE review required; avoid biometric claims without policy approval. | Planning only. |
| AudioFlux | Beat, onset, rhythm, and energy analysis for SoundSync timing maps. | Audio SoundSync worker. | Optional slot in RP-MEDIA-01 and SoundSync planning; not blocking until explicitly enabled. | Safe import check available when installed. | Input: approved local audio track. Output: timing feature map. | CPU-bound; cap duration, sample rate, and analysis windows. | Fall back to simpler timing or user review. | Package provenance/native dependency review required. | Planning only. |
| Signalsmith Stretch | Music time-stretching or pitch adjustment for approved voice-safe timing fits. | Audio SoundSync worker. | Optional future processing candidate. | Planned stub. | Input: approved audio stem and bounded stretch parameters. Output: processed stem plus QA metadata. | CPU-bound; cap duration and transform amount. | Fail audio work item and use approved fallback/review. | License/build review required. | Planning only. |
| Whisper / faster-whisper / whisper.cpp | Transcription and timestamping for source understanding and captions. | Media-analysis/transcription worker. | Optional slot in RP-MEDIA-01; planned until implementation is selected. | Planned stub. | Input: approved local audio/video media. Output: timestamped transcript segments. | Depends on selected runtime/model; cap model size and media duration. | Mark transcript unavailable and request review/fallback. | Model/license/security and PII retention review required. | Planning only. |
| PySceneDetect | Scene/shot boundary detection for source analysis, trim planning, and QA. | Media-analysis worker. | Optional slot in RP-MEDIA-01; not blocking until explicitly enabled. | Planned stub. | Input: approved local video or sampled frames. Output: scene boundary timecodes. | CPU-bound; cap duration/resolution/sampling. | Fall back to source order or manual review; do not invent cuts. | Python dependency review required. | Planning only. |
| Playwright | Browser/app capture and visual QA for approved targets. | Browser-capture worker. | Optional until browser capture worker canary. | Safe package/import check available. | Input: approved URL/local app target and capture policy. Output: screenshot/video artifact and QA report. | Isolated browser with viewport/network/time caps. | Fail capture step and use approved fallback card or review. | SSRF/privacy controls required; no unauthorized pages or secrets. | Planning only. |
| VapourSynth | Advanced frame filtering, denoise/deband/interpolation experiments, and high-end postprocessing. | Advanced frame worker. | Optional/future candidate. | Safe import check available when installed. | Input: approved local video plus reviewed filter graph. Output: processed clip plus QA metadata. | CPU/RAM-heavy; cap duration, resolution, and plugins. | Fail advanced processing and use simpler fallback if approved. | Plugin-by-plugin license/security review required. | Planning only. |

## Runtime Approval Rules

- Staging smoke approval is not production approval. FFmpeg, FFprobe, and Remotion are proven for narrow smoke gates only.
- Production/customer tool execution still requires worker images, license/security review, resource caps, approved snapshot and credit gates, storage provenance, observability, and separate production rollout approval.
- Canonical records must store bucket/object paths and metadata, not signed URLs, raw media bytes, secrets, or provider payloads.
- Future canaries must promote tools from optional/planned to strict required only when the relevant worker gate is ready.

## Recommended Next Gates

1. Redeploy Cloud Run and dispatch/record the RP-EDIT-01 real timeline composition canary after workflow visibility review.
2. SoundSync analysis canary.
3. Provider sandbox gate.
