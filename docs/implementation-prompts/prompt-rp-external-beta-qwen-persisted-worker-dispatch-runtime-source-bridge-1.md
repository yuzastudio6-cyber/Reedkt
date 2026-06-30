# RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-RUNTIME-SOURCE-BRIDGE-1

Implement only after `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-CONFIRMED-RUNTIME-1` records `blocked_missing_persisted_job_or_queue_lease_reference`.

Goal: add the missing current-base source bridge for a persisted worker dispatch approved-fixture runtime path.

Required boundaries:

- Preserve approved-snapshot execution only.
- Bind a real queue/job lease reference, idempotency key, approved snapshot reference, credit no-spend policy, private input manifest reference, private output manifest/checksum policy, timeout/cost ceiling, and fail-closed restore.
- Do not use raw chat as worker input.
- Do not broaden to arbitrary user media, public artifacts, signed URL source-of-truth, credit spend, paid production, final delivery/export, broad external beta, or production unlock.
- Do not use the older direct adapter job runner as a substitute for persisted worker dispatch unless the bridge explicitly records why that path satisfies the persisted job/lease/idempotency/manifest contract.

Future confirmed execution gate remains:

`REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true`

Expected next success decision:

`completed_qwen_persisted_worker_dispatch_approved_fixture_inference_runtime`
