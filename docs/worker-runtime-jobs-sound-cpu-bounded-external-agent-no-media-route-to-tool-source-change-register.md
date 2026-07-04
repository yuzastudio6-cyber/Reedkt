# WORKER_RUNTIME_JOBS SOUND CPU Bounded No-Media Route-To-Tool Source Change Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-change-register
{
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_execution_unlock_plan_completed_with_warnings_ready_for_route_to_tool_source_gate",
  "futureSourceChangesAllowed": [
    {
      "path": "server/routes/sound-cpu-no-media-agent-call-routes.ts",
      "change": "add_bounded_no_media_route_to_controlled_runner_handler",
      "constraints": [
        "preserve existing envelope validation",
        "preserve 15-tool allowlist",
        "require disabled static runtime flags",
        "reject forbidden payload fields recursively",
        "return side effects false",
        "do not dispatch workers or persist manifests"
      ]
    },
    {
      "path": "scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-proof-runner.ts",
      "change": "add_controlled_route_to_tool_call_proof_or_create_new_runner",
      "constraints": [
        "localhost only",
        "synthetic no-media envelope only",
        "single allowlisted tool proof is acceptable for source gate",
        "no user media",
        "no Supabase",
        "no artifacts"
      ]
    }
  ],
  "sourceChangesMadeInThisPlan": [],
  "routeExecutionReadyToday": false
}
```
