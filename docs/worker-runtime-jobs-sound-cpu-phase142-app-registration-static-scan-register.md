# WORKER_RUNTIME_JOBS SOUND CPU Phase 142 App Registration Static Scan Register

```json worker-runtime-jobs-sound-cpu-phase142-app-registration-static-scan-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase142-app-registration-static-scan-register",
  "appSource": "server/app.ts",
  "expectedImport": "import { createSoundCpuWorkerRoutes } from './routes/sound-cpu-worker-routes'",
  "expectedMount": "app.use(createSoundCpuWorkerRoutes())",
  "expectedMountOrder": [
    "app.use(createWorkerRoutes())",
    "app.use(createSoundCpuWorkerRoutes())",
    "app.use(createRenderRoutes())"
  ],
  "validatedCounts": {
    "routeFactoryReferences": 2,
    "routeFactoryMounts": 1
  },
  "requestExecutionDuringValidation": false
}
```

The static scan validates source text only and does not instantiate or call the route.
