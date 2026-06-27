# WORKER_RUNTIME_JOBS SOUND CPU Controlled Image Runtime Import Proof Probe Blocker Register

```json worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-probe-blocker-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_blocked_probe_invocation_no_output_ready_for_fix",
  "blockingFailure": {
    "id": "probe_invocation_no_output_due_missing_stdin_attachment",
    "status": "blocked_for_fix",
    "dockerRunInvoked": true,
    "dockerRunExitCode": 0,
    "probeJsonProduced": false,
    "metadataImportsProven": false,
    "whyBlocking": "The command used python - with a shell heredoc but did not attach stdin to docker run. A zero exit code without JSON evidence is insufficient proof."
  },
  "fixRequirements": [
    "Use docker run -i or a python -c script so the metadata/import probe is actually executed inside the container.",
    "Do not open media, write artifacts, run worker/route/tool code, push images, call GCP, touch Supabase, or execute SQL.",
    "Record metadata and import pass/fail counts from JSON emitted by the container.",
    "Inspect and remove the temporary image/tag after the corrected proof attempt."
  ],
  "nonFixActions": [
    {
      "action": "claim_container_runtime_import_proof_passed",
      "allowed": false
    },
    {
      "action": "claim_product_tool_call_execution_ready",
      "allowed": false
    },
    {
      "action": "unlock_external_beta_or_production",
      "allowed": false
    }
  ]
}
```
