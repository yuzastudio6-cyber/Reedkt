# Validation Results

Validation status: `passed_after_sequential_build_rerun`.

Required validation:

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `git diff --check`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `npm run smoke:tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1`: `passed`
- `npm run --silent tracka:gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1:diagnostics`: `passed`
- `npm run --silent tracka:gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1:diagnostics`: `passed`
- `git diff --cached --check`: `passed`
- non-executing changed-file and staged safety scans: `passed_by_route_enablement_diagnostics`

The route-source smoke invokes the TypeScript service function with an explicit test env override and creates only a local mock queue item. It does not start an HTTP server, dispatch a worker, execute GPAC/MP4Box, process media, mutate Supabase, run SQL, or create artifacts.

Note: an initial `npm run build` and `npm run build:server` attempt was started in parallel with `npm ci`, so TypeScript observed an in-progress `node_modules` replacement. After `npm ci` completed, both builds were rerun sequentially and passed.
