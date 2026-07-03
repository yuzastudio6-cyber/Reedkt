# WORKER_RUNTIME_JOBS SOUND CPU Phase207 Private Fixture Blocker Register

```json worker-runtime-jobs-sound-cpu-phase207-private-fixture-blocker-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase207-private-fixture-blocker-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase207_blocked_private_fixture_missing",
  "selectedBlocker": {
    "blockerId": "approved_private_fixture_missing",
    "status": "blocks_controlled_real_user_media_runtime_execution_proof",
    "severity": "hard_stop",
    "whyBlocks": "The prompt forbids arbitrary media selection and requires an explicit local private fixture path with privacy, retention, cleanup, and sanitized-evidence boundaries before any real-user-media read.",
    "fixPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE208-PRIVATE-FIXTURE-SOURCE-SELECTION-PREFLIGHT",
    "mustNotWorkAround": true
  },
  "notBlockersToday": [
    {
      "blockerId": "package_import_proof",
      "status": "already_passed_for_planning"
    },
    {
      "blockerId": "synthetic_no_media_tool_call_proof",
      "status": "already_passed"
    },
    {
      "blockerId": "owner_paste_wait",
      "status": "not_required"
    },
    {
      "blockerId": "duplicate_same_purpose_pr",
      "status": "not_found"
    }
  ]
}
```

Phase208 must either identify an approved private fixture path or keep the real-media proof blocked.
