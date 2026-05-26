# Production Worker Architecture

## Purpose

This document defines the production worker groups for ReeditPro's future backend AI editing runtime. It is an architecture lock only. It does not implement workers, install tools, run media processing, deploy infrastructure, call providers, or create secrets.

## Core Execution Rule

Workers execute approved plan snapshots, not raw chat. A worker job must reference the approved snapshot, job ID, workspace/project IDs, dependency graph, idempotency key, storage references, recipe plan, and credit reservation when expensive generation/render/export is required.

If the approved snapshot, dependencies, credit gate, tier policy, model policy, frame policy, timing plan, or QA policy does not allow an action, the worker must stop and request a revised approval path instead of improvising.

## Worker Groups

| Worker group | Role | Runs heavy tools | Writes production state | Notes |
| --- | --- | --- | --- | --- |
| `api_service` | Authenticated backend API, approval/credit gates, service-role reads/writes, job dispatch, signed access, provider gateway coordination, status APIs. | No media tools by default. | Yes, through audited backend/service-role paths. | Cloud Run Service. Frontend calls this service, not workers directly. |
| `cpu_analysis_worker` | Source media probe, proxy prep, scene/shot analysis, CPU OCR where practical, image transforms, structured timeline interchange, analysis artifacts. | Yes, CPU-safe tools only. | Yes, scoped job/events/assets/analysis updates. | Cloud Run Job with private GCS access and no provider secrets by default. |
| `gpu_ai_worker` | Transcription acceleration, segmentation/masking, background removal, denoise/source separation, enhancement, interpolation, heavy CV. | Yes, GPU AI tools. | Yes, scoped job/events/assets/QA updates. | Starts on `nvidia-l4` Cloud Run Jobs where available. Premium GPU may be added later. |
| `render_worker` | Hyperframe integration boundary, Remotion render templates, subtitle burn-in, final composition/export handoff, FFmpeg mux/transcode, OTIO timeline input. | Yes, render/media tools. | Yes, scoped render/export/assets/QA updates. | Final render waits for required assets and QA. Revideo is evaluation-only. |
| `qa_worker` | Visual, audio, caption, color, mask, render, export, policy, and readiness QA. | Yes, QA tools. | Yes, scoped QA/events/status updates. | Failed required QA blocks final export. |
| `tool_readiness_worker` | Safe version/import/capability checks for worker containers and regions. | Only safe readiness checks. | Yes, readiness reports. | Does not process customer media or prove legal approval. |

## Tool Assignments

### CPU Analysis Worker

The `cpu_analysis_worker` owns CPU-first deterministic analysis and preprocessing:

- `ffmpeg`
- `ffprobe`
- `pyav`
- `pyscenedetect`
- `opencv` CPU
- `paddleocr` CPU where practical
- `sharp` / `libvips`
- `duckdb`
- `polars`
- `opentimelineio`
- `openimageio` CPU where approved
- `opencolorio` CPU transforms where approved

Expected outputs include media metadata, technical analysis, source/proxy references, scene boundaries, OCR candidates, thumbnails/stills, structured analysis artifacts, and OTIO-compatible timeline data.

### GPU AI Worker

The `gpu_ai_worker` owns AI/CV/audio workloads that are too heavy or model-dependent for the frontend or CPU analysis worker:

- `faster_whisper`
- `birefnet`
- `sam2`
- `kornia`
- `deepfilternet`
- `demucs`
- `real_esrgan`
- `film`
- heavy `opencv` / `kornia`
- `paddleocr` GPU only if approved

Expected outputs include transcript/alignment artifacts, masks, segmentation outputs, denoised/separated audio assets, enhancement outputs, interpolation outputs, model confidence scores, and QA-ready manifest entries.

### Render Worker

The `render_worker` owns the locked production render stack:

- Hyperframe integration boundary for editor/timeline/interactive preview coordination.
- Remotion for programmatic composition and render templates.
- FFmpeg for final media export, mux, transcode, and delivery variants.
- libass for subtitle burn-in where needed.
- Sharp for render asset preparation.
- OpenTimelineIO as structured timeline input/interchange.
- Revideo evaluation only, not core.

The render worker must not render from raw chat. It consumes approved timeline/render plans, manifest assets, frame/timing contracts, subtitle/caption tracks, and QA gates.

### QA Worker

The `qa_worker` owns independent checks that can block final export:

- `opencv`
- `ffprobe`
- audio QA tools
- color QA tools
- caption QA
- mask QA
- render/export QA

QA must verify output against approved intent, source truth, tier/model policy, frame rules, timing, captions, audio, color, masks, render integrity, artifact completeness, and final export requirements.

### Tool Readiness Worker

The `tool_readiness_worker` runs safe checks only:

- binary availability and version checks;
- import checks;
- capability summaries;
- region/container readiness reporting.

It must not process user media, run providers, render media, read secrets, or mark a tool legally approved. Legal, license, model-weight, codec, security, and privacy review remain separate gates.

## Backend And Storage Boundaries

- `SUPABASE_SERVICE_ROLE_KEY`, provider keys, Stripe keys, and privileged storage operations stay server/worker-side only.
- Workers use canonical private GCS object references, not persistent signed URLs.
- Signed URLs are temporary access artifacts created by backend services.
- Worker payloads must include IDs and references, not raw secrets or raw prompt-only instructions.
- Workers write append-style events and scoped result records so retries and QA are auditable.

## Failure And QA Rules

- Local failures block only affected downstream work when dependencies allow parallel progress.
- Global failures block final render/export.
- Required QA failures block final export until approved fallback, refinement, user review, or revised approval resolves the issue.
- Basic and Pro cannot fallback to Veo. Premium may use Veo only as final fallback/rescue for approved AI video assets.
- Maps, charts, browser captures, captions, timing, masks, exact labels, and final export QA do not fallback to AI video.
