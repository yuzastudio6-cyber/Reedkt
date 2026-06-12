# Worker Tool Route Dispatch Boundary

Status: `ready_with_warnings_for_worker_1`.

WORKER-0 inventories route and tool dispatch surfaces without invoking them.

## Route Surfaces

- `server/routes/worker-routes.ts`
- `server/validation/worker-schemas.ts`
- `server/workers/worker-claim-runner.ts`
- `server/workers/worker-runtime.ts`
- `server/workers/production/production-worker-router.ts`

## Tool Readiness Surfaces

- `server/workers/tool-readiness-runner.ts`
- `server/workers/tool-readiness-types.ts`
- `server/workers/tools/ffmpeg-check.ts`
- `server/workers/tools/ffprobe-check.ts`
- `server/workers/tools/remotion-check.ts`
- `server/workers/tools/sharp-libvips-check.ts`
- `server/workers/tools/playwright-check.ts`
- `server/workers/tools/audioflux-check.ts`
- `server/workers/tools/signalsmith-stretch-check.ts`
- `server/workers/tools/opencv-check.ts`
- `server/workers/tools/vapoursynth-check.ts`

## Dispatch Boundary

The current gate code maps selected job types to required tools:

- `media_analysis` and `frame_extraction`: `ffprobe`
- `basic_render_smoke`: `ffmpeg`, `ffprobe`
- `render_preview` and `export`: `remotion`

WORKER-0 does not run these checks or dispatch paths. WORKER-1 must define which dry-run route, if any, is permitted and must keep tool execution approval false until a later prompt.

```json
{
  "toolExecutionApproved": false,
  "routeExecutionApproved": false,
  "workerExecutionApproved": false,
  "providerRuntimeApproved": false
}
```
