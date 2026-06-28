# RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE_1

Run a future confirmation-gated runtime fixture only after `RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_1` is merged and validation remains clean.

The future packet must name:

- the single approved snapshot reference;
- approval record reference;
- credit estimate and reserved credit reservation references;
- job batch, job, worker lease, and idempotency references;
- private input manifest, private artifact manifest, and checksum references;
- model-routing and QA policy references;
- Qwen product-route runtime lane and accepted source evidence;
- cleanup and rollback policy;
- exact target and confirmation gate.

It must not use raw chat prompts, arbitrary media, frontend provider calls, public artifacts, signed URLs, paid billing, production unlock, or final render/export. Any provider/model call must remain backend-only, bounded to the named Qwen route, and separately confirmed.
