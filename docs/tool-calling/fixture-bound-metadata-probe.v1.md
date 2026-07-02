# Fixture-Bound Metadata Probe v1

## Purpose

The fixture-bound metadata probe is the first Reeditpro tool-calling layer that binds controlled tool execution to a generated synthetic fixture artifact.

This milestone runs only a read-only `ffprobe` metadata probe against a generated synthetic WAV fixture. It does not use real user media, probe video fixtures, transcode, mux, filter, dispatch workers, call providers, mutate Supabase, run SQL, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

## Execution Boundary

Allowed execution is limited to:

- `ffprobe_fixture_bound_synthetic_audio_metadata_probe`
- `ffprobe` with exact args prefix `["-v", "error", "-show_format", "-show_streams", "-of", "json"]`
- One internally generated synthetic `audio/wav` fixture path appended as the final argument
- `child_process.execFile` with `shell: false`, no stdin, short timeout, and small max buffer

The temporary fixture path is internal-only. It must not appear in returned results, diagnostics, docs output, or validation summaries.

## Fixture Source

The probe uses the existing binary fixture generation layer as provenance. It selects an `audio/wav` synthetic fixture summary, finds the matching source dry-run artifact, regenerates the deterministic WAV buffer with the existing Node-only generator, writes it into a temporary workspace, verifies checksum and size, runs `ffprobe`, and removes the workspace before returning.

Existing helpers under `server/media`, `server/workers`, CLI probes, production-readiness checks, and worker routes are scan evidence only. This layer does not import those runtime or worker execution surfaces.

## Sanitized Output

The result exposes only a sanitized metadata summary:

- format name
- duration seconds
- stream counts
- audio/video stream counts
- codec types
- sample rate
- channels
- bit rate
- probe output byte count
- metadata shape validity

The result does not expose raw ffprobe JSON, filename fields, local paths, tags with environment details, raw stdout/stderr, signed URLs, secrets, arbitrary args, or command strings.

## Failure Behavior

Missing `ffprobe` returns structured `unavailable`. Nonzero exit, timeout, unsafe output, parse failure, missing synthetic audio fixture, checksum mismatch, or any video stream detection returns `failed_closed`.

## Next Milestone

Default next recommendation after this passes:

`REEDITPRO-TOOL-CALLING-FIXTURE-BOUND-IMAGE-METADATA-PROBE-1`

Fixture-bound export validation remains deferred until fixture-bound metadata coverage expands beyond the synthetic WAV probe.
