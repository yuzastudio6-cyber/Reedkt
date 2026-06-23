# SOUND CPU Static Contract Plan

## Purpose

This document records the static Worker Runtime Jobs contract plan for the SOUND CPU handoff. It consumes merged PR #670 / `WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW` as owner source evidence using merge commit `f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc`.

The static contract plan is planning metadata only. It defines accepted worker names, planned image labels, accepted planning-only job types, and placeholder input/output and runtime policy surfaces for future owner review.

## Accepted Static Planning Terms

- Workers: `sound-cpu-analysis-worker`, `sound-audio-metadata-worker`.
- Images: `reeditpro/sound-cpu-analysis-worker`, `reeditpro/sound-audio-metadata-worker`.
- Job types: `sound.package_import_smoke`, `sound.numeric_array_analysis`, `sound.symbolic_midi_analysis`, `sound.loudness_synthetic_analysis`.

These terms do not authorize worker dispatch, worker claim, worker lease, worker heartbeat, worker execution, route execution, job creation, package imports, tool execution, or media/audio processing.

## Placeholder Contracts

The matrix defines placeholders for input contracts, output contracts, idempotency, retry, artifact, and observability policy. These placeholders are not runtime code paths and do not create schemas, jobs, artifacts, events, retries, claims, leases, storage writes, or Supabase records.

Worker readiness, runtime readiness, generated local fixture pass, dry-run pass, beta, and production remain unclaimed.

## Preserved Blockers

The plan keeps blocked: worker dispatch, worker claim, worker lease, route execution, worker execution, tool execution, media open/process/write, pydub operations, FFmpeg, artifact writes, generated local fixture pass, dry-run pass, worker readiness, runtime readiness, Supabase/SQL, public artifacts, signed URL creation, provider/model calls, model weights/GPU, billing, beta, and production.

## Next Owner Review

The next recommended milestone is `WORKER_RUNTIME_JOBS-SOUND-CPU-STATIC-CONTRACT-OWNER-REVIEW`. Tool-calling worker-route dry-run must wait for this static contract plan and later owner gates before any route metadata can be considered.
