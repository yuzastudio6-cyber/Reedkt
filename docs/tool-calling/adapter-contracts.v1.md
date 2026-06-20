# Reeditpro Tool-Calling Adapter Contracts v1

## Purpose

Adapter contracts are planning-only metadata that describe how a selected `ProductionToolId` can be handed to a future worker route. They do not execute tools, run shell commands, process media, call providers, create signed URLs, mutate Supabase, run SQL, or unlock beta/production behavior.

The adapter layer sits after tool selection. The tool-calling brain selects first-class runtime tools from `server/tool-registry` and capability cards; adapter contracts turn those selected tools into predictable input/output, validation, and future worker handoff shapes.

## Boundary

- Adapter contracts do not replace `server/tool-registry`.
- Adapter contracts do not replace `server/workers/production/production-worker-router.ts`.
- Adapter contracts do not duplicate QA or fallback policy.
- Adapter plans must use structured artifact references, not direct local output paths.
- Adapter plans must not include raw shell command strings or arbitrary runtime arguments.
- Future execution must route through approved snapshots, private artifact references, and the existing production worker router.

## Initial Contract Set

Milestone `REEDITPRO-TOOL-CALLING-ADAPTER-CONTRACTS-1` adds contracts for the first first-class runtime group:

`ffmpeg`, `ffprobe`, `pyav`, `opencv`, `pyscenedetect`, `sharp`, `opentimelineio`, `remotion`, `libass`, `faster_whisper`, `paddleocr`, `deepfilternet`, `birefnet`, `sam2`, `real_esrgan`, `film`, `opencolorio`, and `openimageio`.

These contracts are generated from existing `ProductionToolProfile` records and capability cards. The contract catalog is not a second runtime registry.

## Pending External Tools

`mediainfo`, `exiftool`, `tesseract`, and `imagemagick` remain pending until they are expanded into first-class `ProductionToolId` entries. They must not receive adapter contracts or adapter plans on this base.

Diagnostics report those tools as `pending_adapter_contract_until_production_tool_registry_expansion`.

## Worker Route Bridge

The worker route bridge emits metadata only. It maps a selected pipeline step to the future worker category that should eventually handle the step, such as `cpu_analysis_worker`, `gpu_ai_worker`, `render_worker`, or `qa_worker`.

Bridge plans must require approved snapshots and must disallow raw prompt text, signed URLs, service-role context, and execution.
