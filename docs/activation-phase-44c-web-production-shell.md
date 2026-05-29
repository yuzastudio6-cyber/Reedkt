# Activation Phase 44C Web Production Shell

Phase 44C creates the web production shell for ReeditPro while keeping the
Phase 44B transitional source layout.

## Adds

- `src/web-shell` route, navigation, fixture, policy, and status modules.
- Production-style React shell pages for projects, intake, editor workspace,
  jobs, artifacts, readiness, compute routes, settings, and fallback handling.
- Static editor panels for preview, timeline, captions, tool planning,
  inspector, and export review.
- Disabled/mock-safe upload, run AI, render, export, public delivery, and local
  worker controls.
- `web:shell:summary` CLI and `smoke:web-production-shell` smoke coverage.
- Web shell docs for navigation, editor, intake, jobs/artifacts, and compute
  route visibility.

## Does Not Add

- No physical source move from root `src`.
- No desktop runtime, Tauri, Electron, local worker, or hardware scan.
- No Docker, `gcloud`, deployment, provider calls, model downloads, media
  processing, WebGPU/WebCodecs execution, or Revideo core.
- No production, external beta, or broad real media unlock.

## Next Phase

Phase 44D should connect browser-safe backend integration surfaces or add a web
capability profiler, depending on the next roadmap decision. Workers, secrets,
private artifacts, model policy, and heavy execution must remain server-owned.
