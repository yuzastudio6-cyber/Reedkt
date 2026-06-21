# Controlled Low-Risk Tool Execution v1

## Purpose

Controlled low-risk tool execution is the first Reeditpro tool-calling milestone that actually executes tools. It is limited to allowlisted readiness/version probes for selected first-class `ProductionToolId` tools.

This layer does not execute safe command plans, process media, inspect fixtures, dispatch workers, call providers, mutate Supabase, run SQL, create migrations, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

## Allowed Probe Boundary

Allowed probes are:

- `ffmpeg_version_probe`: `ffmpeg` with exact args `["-version"]`
- `ffprobe_version_probe`: `ffprobe` with exact args `["-version"]`
- `mediainfo_version_probe`: `mediainfo` with exact args `["--Version"]`
- `exiftool_version_probe`: `exiftool` with exact args `["-ver"]`
- `tesseract_version_probe`: `tesseract` with exact args `["--version"]`
- `imagemagick_magick_version_probe`: `magick` with exact args `["-version"]`
- `imagemagick_convert_version_probe`: legacy ImageMagick `convert` with exact args `["-version"]`
- `remotion_package_resolution_probe`: Node package metadata resolution only
- `sharp_package_resolution_probe`: Node package metadata resolution only

Binary probes use `child_process.execFile` with `shell: false`, no stdin, exact hardcoded args, short timeouts, and small output buffers. Package probes use Node module resolution for package metadata only and do not import runtime code.

Missing tools are not uncontrolled failures. They return structured `unavailable` results. Nonzero exits, timeouts, unsafe output, or policy mismatch return `failed_closed`.

Track B external probes remain readiness-only. They do not inspect media files, transform images, run OCR, inspect metadata files, or use fixtures. ImageMagick prefers `magick`; legacy `convert` can satisfy ImageMagick readiness with warning `imagemagick_legacy_convert_binary_used` when `magick` is unavailable. Bare `graphicsmagick` remains pending and is not probed.

## Output Sanitization

Probe output is diagnostics-only and sanitized before returning. Summaries redact local paths, home-directory paths, URLs, env-like token values, and shell-looking fragments. Results must not expose command strings, argv fields, local paths, signed URLs, provider secrets, service-role context, or raw prompts.

## Existing Surface Boundary

Existing helpers under `server/workers`, `server/media`, `server/e2e`, worker routes, readiness validation, and production-readiness modules remain runtime, smoke, or worker surfaces. This milestone does not import them or duplicate worker execution behavior.

The tool-calling controlled execution layer reuses first-class production registry IDs and pending external reconciliation checks, but owns its stricter diagnostics-only policy and sanitized result shape.

## Next Milestone

Recommended next milestone:

`REEDITPRO-TOOL-CALLING-FIXTURE-BOUND-METADATA-PROBE-1`

That milestone may consider fixture-bound metadata probing only if this probe layer passes, outputs remain sanitized, and execution stays fail-closed.
