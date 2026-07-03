# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Actual Disabled Route Registration Source Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-source-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-source-register",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_registration_source_gate_completed_with_warnings_ready_for_disabled_route_registration_source_owner_review",
  "registeredRoute": {
    "routePathConstant": "SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_PATH",
    "routePath": "/api/internal/workers/sound-cpu/no-media-agent-call",
    "routeFactory": "createSoundCpuNoMediaAgentCallRoutes",
    "routeFactoryFile": "server/routes/sound-cpu-no-media-agent-call-routes.ts",
    "appMountFile": "server/app.ts",
    "appMount": "app.use(createSoundCpuNoMediaAgentCallRoutes())",
    "httpMethod": "POST",
    "handler": "soundCpuNoMediaAgentCallDisabledRouteHandler",
    "internalOnlyPathPrefix": "/api/internal"
  },
  "registrationFlags": {
    "SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_REGISTERED_IN_APP": true,
    "SOUND_CPU_NO_MEDIA_AGENT_CALL_ROUTE_EXECUTION_ENABLED": false
  },
  "closedExecutionFlags": {
    "workerDispatchExecutionEnabled": false,
    "workerExecutionEnabled": false,
    "toolExecutionEnabled": false,
    "mediaProcessingEnabled": false,
    "supabaseMutationEnabled": false,
    "sqlExecutionEnabled": false,
    "storageObjectCreationEnabled": false,
    "providerModelCallEnabled": false,
    "dockerCloudRunExecutionEnabled": false
  }
}
```

The registered route is intentionally blocked and does not attach a worker dispatcher or media/runtime executor.
