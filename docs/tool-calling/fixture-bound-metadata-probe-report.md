# Fixture-Bound Metadata Probe Report

## Current Stack Context

- Base branch: `codex/reeditpro-tool-calling-controlled-low-risk-execution-1`
- Current milestone branch: `codex/reeditpro-tool-calling-fixture-bound-metadata-probe-1`
- Parent milestone: controlled low-risk readiness/version probes

## Refresh Gate Result

The refresh gate was run before implementation. It reported `continueAllowed: true` with warnings:

- `package-lock.json` has an unstaged change and must stay out of this milestone commit.
- Fetch was skipped because `REEDITPRO_REFRESH_GATE_ALLOW_FETCH=1` was not set.

## Probe Policy

- Probe ID: `ffprobe_fixture_bound_synthetic_audio_metadata_probe`
- Tool: `ffprobe`
- Fixture: generated `synthetic_audio` WAV only
- Execution method: `execFile` with no shell, no stdin, exact hardcoded args, short timeout, and small max buffer

## Fixture Selection

The runner uses existing binary fixture generation output as provenance, selects an `audio/wav` synthetic fixture summary, regenerates the matching deterministic WAV buffer from the source dry-run artifact, writes it to a temporary workspace, validates checksum and size, probes it, and deletes the workspace before returning.

## Sanitized Output Policy

Results expose only sanitized metadata summary fields. Raw ffprobe JSON, filename/path fields, tags, full stdout/stderr, signed URLs, local paths, secrets, command strings, arbitrary args, and service-role context are not returned.

## Unavailable Behavior

Missing `ffprobe` is non-blocking and returns structured `unavailable`. Nonzero exit, timeout, invalid metadata shape, parse failure, video stream detection, or fixture checksum mismatch returns `failed_closed`.

## No-Duplicate Scan Summary

The repo already includes ffprobe and metadata helpers under `server/media`, `server/workers`, CLI probes, and production-readiness checks. This milestone treats them as scan evidence only and does not import them because they are real-media, worker, smoke, or readiness execution surfaces.

## Safety Exclusions

This milestone does not use real media, probe video fixtures, transcode, mux, filter, execute safe command plans generally, dispatch workers, call providers, mutate Supabase, run SQL, create migrations, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

## Next Recommended Milestone

`REEDITPRO-TOOL-CALLING-FIXTURE-BOUND-IMAGE-METADATA-PROBE-1`

Decision target:

`reeditpro_tool_calling_fixture_bound_metadata_probe_1_ready_for_next_fixture_bound_probe_expansion`
