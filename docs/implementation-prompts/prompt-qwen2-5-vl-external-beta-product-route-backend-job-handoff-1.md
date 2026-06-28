# QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_1

Use this prompt after `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1`.

## Goal

Add the backend-only job handoff needed for the QWEN product route to safely reach the accepted private adapter runtime lane under an explicit confirmation gate.

## Required Scope

- Preserve default product route fail-closed behavior.
- Add or validate a backend-only handoff abstraction for approved snapshot, credit reservation, queue lease, private input manifest, private artifact manifest, checksum, source sequence map, compiled intent, model routing policy, and QA policy references.
- Do not expose provider/model execution to frontend code.
- Do not place `gcloud` shellouts inside the route handler.
- Do not run arbitrary private/user media.
- Do not create signed/public artifacts.
- Do not unlock external beta, paid production, production, or final delivery/export.

## Required Evidence

- source contract for route-to-runtime handoff;
- local fail-closed tests for missing gate, unsafe request flags, and missing required refs;
- explicit confirmation gate for any future bounded runtime fixture;
- sanitized `/tmp` evidence only if the packet runs a bounded fixture;
- package-lock unchanged.
