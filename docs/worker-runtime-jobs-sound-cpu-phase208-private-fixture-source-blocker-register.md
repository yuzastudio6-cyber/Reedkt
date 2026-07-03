# WORKER_RUNTIME_JOBS SOUND CPU Phase208 Private Fixture Source Blocker Register

```json worker-runtime-jobs-sound-cpu-phase208-private-fixture-source-blocker-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase208-private-fixture-source-blocker-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase208_blocked_private_fixture_source_missing",
  "selectedBlocker": {
    "blockerId": "explicit_approved_local_private_fixture_source_missing",
    "severity": "hard_stop",
    "whyBlocks": "The controlled real-user-media proof requires one explicit local private fixture path plus privacy, retention, cleanup, and sanitized-evidence boundaries before any media open.",
    "mustNotWorkAround": true,
    "notAllowedWorkarounds": [
      "choose random media from disk",
      "crawl broad private folders",
      "use signed URLs as source of truth",
      "use provider output blobs",
      "use raw prompts or secrets as fixture input",
      "read media before approval"
    ],
    "fixPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE209-PRIVATE-FIXTURE-PATH-APPROVAL-HANDOFF",
    "fixPromptFile": "docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase209-private-fixture-path-approval-handoff.md"
  },
  "notBlockersToday": [
    {
      "blockerId": "tool_install_or_import",
      "reason": "The 15 SOUND CPU tools already have prior install/import proof."
    },
    {
      "blockerId": "bounded_synthetic_no_media_tool_call",
      "reason": "Prior gates already recorded bounded synthetic no-media proof."
    },
    {
      "blockerId": "owner_paste_wait",
      "reason": "This lane can inspect repo evidence directly; the blocker is concrete missing local private fixture source metadata."
    }
  ]
}
```

No later proof may open media until the hard-stop blocker is resolved.
