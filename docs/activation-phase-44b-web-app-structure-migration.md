# Activation Phase 44B Web App Structure Migration

Phase 44B makes `apps/web` the canonical web app boundary while preserving the
existing root Vite app behavior.

## Adds

- `apps/web` build, boundary, source migration, and scaffold docs.
- `server/platform` web app structure policy and report.
- `web:structure:summary` CLI.
- `smoke:web-app-structure` smoke coverage.
- Web app structure, build policy, and source boundary docs.
- Web-named aliases for current dev, build, and lint behavior.

## Does Not Do

- no physical full source move;
- no desktop app;
- no Tauri, Electron, or Electron Forge;
- no local worker;
- no Docker or `gcloud` execution;
- no deploy;
- no provider calls;
- no model downloads;
- no media processing;
- no secrets;
- no Revideo core dependency;
- no production, external beta, or broad real media unblock.

## Next Phase

Phase 44C is the web production shell. It should build the professional web UI
surface under the approved web boundary before Phase 44D backend integration.
