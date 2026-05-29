# Web App Structure Migration

Phase 44B establishes `apps/web` as the canonical web app boundary while
preserving the current root Vite app behavior.

## Structure Mode

`transitional`

The active Vite entry remains `index.html`, the active React source remains
`src`, and active public assets remain `public`. The physical source move is
deferred because root `src` currently contains both browser UI and `src/backend`
contracts, mock services, and worker entrypoints used by server builds.

## How To Run

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`
- `npm run web:dev`
- `npm run web:build`
- `npm run web:lint`

`npm run build:server` remains the server/runtime build validation path.

## apps/web Ownership

`apps/web` owns React UI, routing, editor shell UI, project dashboard UI, upload
UI, timeline UI, transcript/caption display UI, artifact review UI, QA report
UI, private export review UI, and later browser capability profile UI.

It must not own server workers, `gcloud` logic, service-role secrets, provider
calls, model weights, Docker build logic, Cloud Run job execution, heavy AI
execution, direct private GCS mutation logic, or raw tool execution.

## Next Phase

Phase 44C builds the production web shell. Phase 44D connects browser-safe UI
flows to approved backend APIs while preserving server ownership of workers,
secrets, private artifacts, model policy, and heavy execution.
