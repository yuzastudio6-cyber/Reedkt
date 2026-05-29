# Source Migration Status

## Structure Mode

`transitional`

## Current Source Location

- Active web source: `src`
- Active Vite entry: `index.html`
- Active public assets: `public`
- Canonical web boundary: `apps/web`

## Why Full Move Is Deferred

The root `src` tree currently mixes React UI with `src/backend` contracts,
mock services, and staging worker entrypoints. Existing server and worker build
configs still reference `src/server` and `src/backend`, and server modules
import shared contracts from `src/backend/contracts`.

Moving the full tree under `apps/web` in Phase 44B would risk breaking current
web behavior, server typechecking, worker build entries, and activation smoke
coverage. Phase 44B therefore establishes the canonical web boundary while root
scripts keep building the current app.

## How Root Scripts Still Build The Web App

The root commands remain unchanged:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`
- `npm run build:server`

The added `web:*` scripts mirror the current web behavior and do not introduce
a workspace, desktop runtime, or new dependency.

## Next Steps

Phase 44C should build the production web shell inside the approved web
boundary. Phase 44D should connect browser-safe UI flows to approved backend
APIs while keeping server workers, secrets, private artifacts, and heavy tool
execution server-owned.
