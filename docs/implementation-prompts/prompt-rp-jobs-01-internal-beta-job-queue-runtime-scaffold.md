# RP-JOBS-01-INTERNAL-BETA-JOB-QUEUE-RUNTIME-SCAFFOLD

Use this prompt only after `RP-CREDITS-01-INTERNAL-BETA-CREDIT-LEDGER-RUNTIME-SCAFFOLD` is merged and validated.

Implement the next narrow internal beta milestone for a fail-closed job queue runtime scaffold.

Requirements:

- Do not dispatch workers, providers, tools, rendering, media processing, signed/public artifact creation, or beta/production unlocks.
- Require approved snapshot and credit reservation metadata before any future enqueue path can leave disabled mode.
- Keep worker leases, heartbeat, retry, cleanup, and event persistence disabled until a future explicit runtime milestone.
- Keep frontend code from writing job, worker, artifact, QA, or service-role state directly.

Expected conservative result if no explicit runtime approval is supplied:

- Decision: `completed_disabled_internal_beta_job_queue_runtime_scaffold_no_worker_execution`
- Execution: `completed_fail_closed_job_queue_scaffold_no_route_or_worker_execution`
- Worker execution: `false`
- Route execution: `false`
- Internal beta end-to-end status: `not_ready`
