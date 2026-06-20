# Fixture-Bound Export Validation v1

## Purpose

Fixture-bound export validation is a pure TypeScript layer that consumes the sanitized synthetic WAV `ffprobe` metadata probe result and emits export-validation plus QA-gate summaries.

The source fixture-bound metadata probe may execute `ffprobe` against the generated synthetic WAV fixture. This export-validation layer does not execute tools, run shell commands, process media, inspect real media, transcode, mux, filter, render, dispatch workers, call providers, mutate Supabase, run SQL, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

## Source Input

The layer accepts only `FixtureBoundMetadataProbeResult.sanitizedMetadataSummary` from the single source probe:

- source probe tool: `ffprobe`
- fixture kind: `synthetic_audio`
- accepted content type: `audio/wav`
- policy ID: `fixture_bound_synthetic_audio_export_validation`

Raw ffprobe JSON, filename fields, temp paths, local paths, signed URLs, raw stdout/stderr, command strings, arbitrary args, service-role context, provider secrets, and real user media references are not accepted or returned.

## Required Gates

The export-validation policy emits three required gate summaries:

- `export_codec_format` passes when content type is `audio/wav`, format name is WAV-compatible, codec types include only audio, and video stream count is `0`.
- `export_duration_sync` passes when duration is greater than `0` seconds and less than or equal to `3.1` seconds.
- `render_asset_integrity` passes when metadata shape is valid, stream count is at least `1`, audio stream count is at least `1`, and video stream count is `0`.

## Optional Gate

The policy also emits `final_delivery` as an optional skipped gate:

- required: `false`
- status: `skipped`
- blocks final export: `true`
- reason: `final_delivery_requires_real_export_validation_future_milestone`

`final_delivery` is never passed in this milestone. It requires a future real export validation milestone with broader fixture and export evidence.

## Status Mapping

- Source probe `unavailable` maps to export validation `unavailable`.
- Source probe `failed_closed` maps to export validation `failed_closed`.
- Source probe `passed` plus all required gates passing maps to export validation `passed`.
- Source probe `passed` plus any required gate failing maps to export validation `blocked`.

## Existing Helper Boundary

Existing export, QA, ffprobe, final-render, CLI, and production-readiness helpers under `server/workers`, `server/media`, CLI paths, production-readiness paths, and final-render paths are scan evidence only. This milestone does not import them because they are real-media, worker, render, smoke, readiness, or execution surfaces.

## Next Milestone

If this validation passes, the recommended next milestone is:

`REEDITPRO-TOOL-CALLING-WORKER-ROUTE-DRY-RUN-1`

If this validation is blocked by metadata coverage, the fallback next milestone is:

`REEDITPRO-TOOL-CALLING-FIXTURE-BOUND-IMAGE-METADATA-PROBE-1`
