# QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R

Use this prompt after `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_1`.

## Goal

Run the guarded product-route provider runtime fixture through the backend-only handoff source contract, using generated or explicitly approved bounded input only.

## Required Gates

- `REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF=true`
- a separate explicit provider runtime fixture confirmation gate;
- existing QWEN runtime/readback gate values;
- approved snapshot, credit reservation, queue lease, private input manifest, private artifact manifest, checksum, source sequence map, compiled intent, edit plan version, model routing policy, QA policy, and idempotency references;
- no frontend provider/model call;
- no arbitrary private/user media;
- no signed/public artifact;
- no final render/export;
- no external beta, paid production, or production unlock.

## Required Evidence

- sanitized route request envelope;
- backend handoff envelope;
- bounded runtime result or exact blocker;
- fail-closed restore evidence if any runtime path updates Cloud Run or caller job configuration;
- `/tmp` report/manifest/checksum artifacts only;
- package-lock unchanged.
