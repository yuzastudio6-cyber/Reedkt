# Web Build Notes

Phase 44B preserves the root Vite build while establishing `apps/web` as the
canonical web app boundary.

## Current Commands

- `npm run dev`: starts the current root Vite dev server.
- `npm run build`: typechecks and builds the current root Vite app.
- `npm run lint`: lints the repo with the current root ESLint config.
- `npm run preview`: previews the current root Vite build.
- `npm run web:dev`: same behavior as `npm run dev`.
- `npm run web:build`: same behavior as `npm run build`.
- `npm run web:lint`: same behavior as `npm run lint`.

## Server Build

`npm run build:server` remains server/runtime validation. It is not a web app
build target and it must not be replaced by the web structure migration.

## Exclusions

No desktop build target is added in Phase 44B. Web builds must not run Docker,
`gcloud`, Cloud Run jobs, model downloads, provider calls, media processing, or
secret reads.
