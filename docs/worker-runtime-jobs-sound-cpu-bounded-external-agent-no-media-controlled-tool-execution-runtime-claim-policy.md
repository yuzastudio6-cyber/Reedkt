# WORKER_RUNTIME_JOBS SOUND CPU Controlled Tool Execution Runtime Claim Policy

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runtime-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runtime-claim-policy",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_source_gate_completed_with_warnings_ready_for_controlled_tool_execution_proof",
  "claimsAllowedNow": {
    "sourceGateAdded": true,
    "proofRunnerSourcePresent": true,
    "controlledProofMayProceedNext": true
  },
  "claimsNotAllowedNow": {
    "generated_local_fixture_passed": false,
    "dry_run_passed": false,
    "toolExecutionReady": false,
    "externalAgentExecutionReady": false,
    "workerExecutionReady": false,
    "routeExecutionReady": false,
    "mediaProcessingReady": false,
    "externalBetaReady": false,
    "paidProductionReady": false
  },
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
