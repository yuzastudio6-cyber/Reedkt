# ReeditPro Web App

`apps/web` is the canonical web app boundary for ReeditPro. Phase 44B uses a
transitional structure: the active Vite entry, React source, and public assets
still live at the repo root while this directory defines the web ownership,
build, and migration policy.

## Owns

- web UI
- routing
- editor shell
- project dashboard
- upload UI
- upload flow
- timeline UI
- transcript/caption display UI
- artifact review UI
- QA report UI
- private export review UI
- browser capability profile later

## Must Not Own

- server workers
- gcloud logic
- service role secrets
- model weights
- Docker build logic
- Cloud Run job execution logic
- heavy AI tools
- heavy AI execution
- provider calls
- direct private GCS mutation logic
- raw tool execution

## Phase 44C Status

Phase 44B made `apps/web` the canonical boundary without moving the current
root app source yet. Phase 44C keeps that transitional layout and adds the
visible production web shell under root `src/web-shell`.

Root scripts still build and lint the active web app. Use:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`
- `npm run web:dev`
- `npm run web:build`
- `npm run web:lint`
- `npm run web:shell:summary`
- `npm run smoke:web-production-shell`

See `source-migration-status.md` for why the physical source move is deferred
and what Phase 44D should do next.

Phase 44C is a browser-safe shell only. Upload, run AI, render, export, public
delivery, desktop/local worker, provider calls, Docker, `gcloud`, model
downloads, media processing, production readiness, external beta, and broad real
media testing remain blocked.
