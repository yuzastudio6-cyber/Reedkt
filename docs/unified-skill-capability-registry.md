# Unified Skill Capability Registry

## Purpose

`server/skill-capability-registry` is the first backend source of truth that maps ReEditPro skills to capability IDs, production tool IDs, and lane readiness states.

It answers planner questions such as:

- What can OCR use right now?
- What can audio/SoundSync use right now?
- What can color/image work use right now?
- What can render/composition use right now?
- Why is transcript generation still blocked?

This registry does not execute tools, call providers, write Supabase, run workers, mutate billing, or enable external beta/production. It is a routing/readiness map.

## Status Model

Lane status values are intentionally narrow:

| Status | Meaning |
| --- | --- |
| `ready_for_backend_execution` | The tool/capability is a backend-gated execution candidate after approved snapshot, credit estimate/reservation, idempotency, private artifact, and owner evidence gates. |
| `dry_run_only` | The lane can plan or validate metadata, but runtime execution is not accepted yet. |
| `blocked_by_provider_lane` | The lane depends on Qwen/provider private inference, transport, model routing, or provider approval. |
| `blocked_by_storage_billing` | The lane depends on deployed private storage, tool cost persistence, wallet settlement, billing QA, or production ledger evidence. |
| `blocked_by_owner_approval` | The lane depends on named owner approval such as model weights, license/source, privacy, URL/source, or quality acceptance. |

`ready_for_backend_execution` is not a product-ready claim. Product-ready local OSS remains `0` by default until the beta-readiness evidence gate accepts real evidence.

## Current Tool Answers

| Planner question | Current answer |
| --- | --- |
| OCR | OpenCV can be planned for conservative backend checks. PaddleOCR remains gated by model-weight/privacy/owner approval. Playwright-backed OCR inputs need browser source/privacy approval. |
| Audio/SoundSync | AudioFlux and Signalsmith Stretch are backend-gated candidates. SOUND semantic/runtime work remains dry-run gated, and cleanup/separation tools need owner/model/quality approval. |
| Color/image | OpenColorIO, OpenImageIO, OpenCV, Sharp, and FFmpeg are backend-gated candidates. Actual use still needs approved recipes, private artifacts, and color QA. |
| Render/composition | Remotion, libass, FFmpeg, Sharp, and OpenTimelineIO are backend-gated candidates. Final render/export remains blocked by deployed storage, billing, wallet, and artifact gates. |
| Transcript | faster-whisper and whisper.cpp are not product execution-ready. They need model-weight/privacy/owner approval, with whisper.cpp remaining evaluation-only. |

## Track B Handoff Set

The registry exposes the Track B media OSS handoff set as 16 tool IDs:

`ffmpeg`, `ffprobe`, `pyav`, `opentimelineio`, `remotion`, `libass`, `sharp`, `paddleocr`, `pyscenedetect`, `opencv`, `opencolorio`, `openimageio`, `audioflux`, `signalsmith_stretch`, `d3`, and `echarts`.

That set is a capability handoff and planning map, not a blanket external beta launch approval.

## Visible Gated Lanes

The registry keeps incomplete lanes visible:

- Qwen provider reasoning and Qwen visual understanding are `blocked_by_provider_lane`.
- SOUND CPU semantics are `dry_run_only` while consuming Track B audio tools where approved.
- Track A native container tools are visible but gated, preserving GStreamer/MKVToolNix/GPAC ownership and the Track B FFmpeg/ffprobe boundary.
- Storage and credit gates are `blocked_by_storage_billing` until deployed storage, tool cost persistence, wallet settlement, and billing QA evidence exists.

## Hard Guardrails

Every registry record carries the hard execution guardrails:

- approved plan snapshot required
- credit estimate required
- credit reservation required
- idempotent job/event required
- backend worker boundary required
- raw prompts and secrets rejected
- private artifact paths are canonical; signed URLs are not source truth

These are permanent safety invariants. The stale blanket blockers were replaced by conditional gates, but these guardrails remain hard.

## Validation

Run:

```bash
npm run smoke:unified-skill-capability-registry
```

The smoke checks:

- all registry records have unique skill IDs and tool mappings
- the 16-tool Track B handoff set is represented
- OCR/audio/color/render/transcript queries return expected tools and gates
- Qwen, SOUND, and Track A lanes remain visible but gated
- product-ready local OSS stays `0`
- external beta/production is not unlocked by the registry
