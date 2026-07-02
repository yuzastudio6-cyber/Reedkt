# Track B External Controlled Probes v1

## Purpose

Track B external controlled probes add readiness-only execution checks for the newly first-class planning tools `mediainfo`, `exiftool`, `tesseract`, and `imagemagick`.

This layer extends the existing controlled low-risk execution surface. It does not add a second probe runner, worker router, registry, QA policy, fallback policy, adapter execution layer, safe-command execution layer, fixture probe layer, Supabase table, SQL file, migration, provider call, signed URL flow, package-lock mutation, or beta/production unlock.

## Allowed Probe Boundary

Allowed Track B probes are exactly:

- `mediainfo_version_probe`: `execFile("mediainfo", ["--Version"])`
- `exiftool_version_probe`: `execFile("exiftool", ["-ver"])`
- `tesseract_version_probe`: `execFile("tesseract", ["--version"])`
- `imagemagick_magick_version_probe`: `execFile("magick", ["-version"])`
- `imagemagick_convert_version_probe`: `execFile("convert", ["-version"])`

Every binary probe uses `child_process.execFile` with `shell: false`, no stdin, exact hardcoded args, timeout `3000`, max buffer `262144`, and sanitized diagnostics-only output. Missing executables return structured `unavailable`. Nonzero exit, timeout, unsafe output, or policy mismatch returns `failed_closed`.

## ImageMagick And GraphicsMagick Boundary

ImageMagick readiness prefers the `magick` binary. If `magick` is unavailable but legacy `convert` passes, readiness may pass with warning `imagemagick_legacy_convert_binary_used`.

Bare `graphicsmagick` is not probed in this milestone. It remains pending and non-selectable until separate evidence promotes it as its own first-class runtime identity.

## Safety Exclusions

These probes do not read media, inspect files, run OCR, transform images, inspect metadata files, use fixtures, execute safe command plans, dispatch workers, call providers, mutate Supabase, run SQL, create migrations, create signed URLs, expose local paths, unlock beta or production, or mutate `package-lock.json`.

Existing helpers under `server/media`, `server/workers`, `server/e2e`, CLI surfaces, production-readiness modules, and worker routes remain scan evidence only and are not imported by this layer.

## Next Milestone

Recommended next milestone:

`REEDITPRO-TOOL-CALLING-TRACKB-EXTERNAL-FIXTURE-BOUND-PROBES-1`

That milestone should only proceed after these readiness probes remain fail-closed, output stays sanitized, fixture policy is explicit, and the refresh gate allows continuation.
