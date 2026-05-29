# Web App Build Policy

Phase 44B preserves the root build surface and adds web-named aliases for the
same behavior.

## Root Scripts

- `dev`: current Vite dev server.
- `build`: current TypeScript and Vite web build.
- `lint`: current repo lint.
- `preview`: current Vite preview.
- `build:server`: server/runtime build validation.

## Web Scripts

- `web:dev`: same behavior as `dev`.
- `web:build`: same behavior as `build`.
- `web:lint`: same behavior as `lint`.
- `web:structure:summary`: static Phase 44B structure report.
- `smoke:web-app-structure`: static Phase 44B structure smoke.

## Boundaries

No desktop build target is added. Web builds must not run Docker, `gcloud`,
Cloud Run jobs, providers, model downloads, media processing, local hardware
scans, local workers, or secret reads.

`build:server` remains server/runtime validation and should not be folded into
the browser app boundary.
