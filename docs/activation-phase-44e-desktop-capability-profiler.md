# Phase 44E Desktop Capability Profiler

Phase 44E adds a Track B desktop/local capability profiler for coarse route-planning metadata only. It does not execute routes, workers, media/audio/OCR/VLM/model runtimes, providers, Docker, Cloud Build, Cloud Run, GCP/IAM mutation, benchmarks, local sidecars, beta, production, or Track A.

## Status

- Phase: 44E
- Run id: `phase44e-desktop-capability-profiler-20260604`
- Branch: `codex/rp-activation-44e-desktop-capability-profiler`
- Base: `codex/rp-activation-44d-web-capability-profiler`
- Status target: `phase_complete_restricted_scope`

## Implementation

- Server activation/reporting module: `server/activation/desktop-capability-profiler/`
- Desktop-safe profile library: `src/lib/track-b/desktop-capability-profiler/`
- Reports: `docs/activation-phase-44e-desktop-capability-profiler-reports/`

The repository does not currently use Electron or Tauri as an app shell. Phase 44E therefore records future-safe Electron policy only and does not add Electron, Tauri, or a desktop shell.

## Safety

The profiler stores only coarse buckets and redacted metadata. It blocks persistent identifiers, hostnames, usernames, MAC addresses, exact CPU model strings, exact GPU adapter IDs, environment dumps, directory scans, path lists, installed app scans, process lists, network speed tests, benchmarks, profile upload, and local persistence by default.

Optional live local profile collection is skipped by policy unless a later run explicitly sets `REEDITPRO_CONFIRM_DESKTOP_CAPABILITY_LOCAL_PROFILE=true`. It remains session-only and upload-disabled.
