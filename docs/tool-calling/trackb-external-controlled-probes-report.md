# Track B External Controlled Probes Report

## Current Stack Context

- Base branch: `codex/reeditpro-tool-calling-trackb-external-registry-expansion-1`
- Current milestone branch: `codex/reeditpro-tool-calling-trackb-external-controlled-probes-1`
- Parent head observed before implementation: `14c24278`
- Promoted Track B first-class tools: `mediainfo`, `exiftool`, `tesseract`, `imagemagick`
- Deferred runtime identity: `graphicsmagick`

## Refresh Gate Result

The refresh gate was run before implementation in the isolated worktree. It reported `continueAllowed: true` with warning that fetch was skipped because `REEDITPRO_REFRESH_GATE_ALLOW_FETCH=1` was not set.

## Probes Added

- `mediainfo_version_probe`: allowlisted `execFile("mediainfo", ["--Version"])`.
- `exiftool_version_probe`: allowlisted `execFile("exiftool", ["-ver"])`.
- `tesseract_version_probe`: allowlisted `execFile("tesseract", ["--version"])`.
- `imagemagick_magick_version_probe`: allowlisted `execFile("magick", ["-version"])`.
- `imagemagick_convert_version_probe`: allowlisted legacy ImageMagick `execFile("convert", ["-version"])`.

All probes use no shell, no stdin, no arbitrary args, exact command arguments, timeout `3000`, max buffer `262144`, and sanitized result summaries. Missing tools are structured `unavailable`; unsafe or unexpected execution fails closed.

## ImageMagick Readiness Rule

- `magick -version` passed: ImageMagick readiness passes.
- `magick` unavailable and `convert -version` passed: readiness passes with warning `imagemagick_legacy_convert_binary_used`.
- Both unavailable: readiness is unavailable.
- Failed-closed ImageMagick output without a passing primary or fallback makes readiness failed closed.

`convert` is counted only as ImageMagick legacy fallback evidence. It does not promote or probe `graphicsmagick`.

## Safety Confirmation

This milestone executes readiness/version probes, so `executesTools: true`. It still does not process media, read fixtures, run OCR, transform images, inspect user files, execute safe command plans, dispatch workers, call providers, mutate Supabase, run SQL, create migrations, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

## Next Recommended Milestone

`REEDITPRO-TOOL-CALLING-TRACKB-EXTERNAL-FIXTURE-BOUND-PROBES-1`

Decision target:

`reeditpro_tool_calling_trackb_external_controlled_probes_1_ready_for_trackb_external_fixture_bound_probes`
