# Web App Implementation Plan

The web app should expose the launch workflow as one professional cloud-backed editing path.

## Phase 44B Structure

`apps/web` is the canonical boundary, but the active Vite app remains rooted at
`index.html`, `src`, and `public` in transitional mode. Phase 44C adds the
production web shell under `src/web-shell` before Phase 44D backend integration.

## Product Surfaces

- Dashboard: project list, status, recent work, readiness warnings, and next actions.
- Upload: browser-safe upload flow with server-owned storage intent/finalization.
- Project state: approved snapshots, source media, job state, artifact state, and review state.
- Editor shell: persistent project context, preview area, timeline area, and review panels.
- Timeline: clips, cuts, captions, audio, color, masks, enhancement artifacts, and export readiness.
- Transcript/captions: transcript review, caption segments, timing warnings, and safe-zone feedback.
- Jobs/progress: worker status, retry/failure state, blockers, and readiness explanations.
- Artifact browser: private transcripts, captions, masks, previews, QA reports, and export artifacts.
- QA panel: blocking findings, warnings, manual review items, and passed gates.
- Private export review: private final export metadata, QA state, and delivery blockers.

## Phase 44C Shell Status

The shell now exposes these surfaces with mock-safe fixtures and disabled
execution controls. Upload, run AI, render, export, public delivery, desktop
local worker, and broad real media testing remain blocked until later phases.

## Runtime Boundary

The web app may display and approve work. It must not own workers, service-role secrets, model weights, Cloud Run job execution, heavy AI tools, provider calls, Docker, `gcloud`, local hardware scans, or desktop runtime behavior.
