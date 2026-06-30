# Runtime Boundary

This phase converts the #1810 approval into a current-base confirmed runtime preflight and blocker closure. It does not use the older direct adapter job runner as a substitute for a persisted worker dispatch path.

The accepted current blocker is `blocked_missing_persisted_job_or_queue_lease_reference`.

Required next source work:

- A current-base persisted worker dispatch source bridge.
- A real queue/job lease reference for the approved fixture.
- A single-attempt idempotency key.
- Private input manifest reference only.
- Private output manifest and SHA-256 checksum policy.
- Timeout and cost ceiling.
- Fail-closed restore verification.
- No broad provider/model calls, arbitrary user media, public artifacts, signed URLs as source-of-truth, credit spend, or external production unlock.

The current staging route handoff remains useful evidence. It is not itself a persisted worker dispatch runtime execution.
