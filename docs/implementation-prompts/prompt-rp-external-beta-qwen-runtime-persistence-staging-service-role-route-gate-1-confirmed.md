# RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1-CONFIRMED

Run only after `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1` is merged.

Target:

- Project name: `Reeditpro`
- Project ref: `wmyyttnynmteqgcdishd`
- Environment: `staging`

Required confirmation:

`REEDITPRO_CONFIRM_EXTERNAL_BETA_QWEN_RUNTIME_PERSISTENCE_STAGING_SERVICE_ROLE_ROUTE_GATE=true`

Required route:

- Route id: `providers.qwen25Vl.structuredVisualMetadataPlan`
- Method/path: `POST /api/providers/qwen2-5-vl/structured-visual-metadata`

Allowed future scope:

- generated bounded fixture only;
- authenticated workspace-editor route context only;
- route idempotency key required;
- service-role secret source named by Secret Manager secret name only;
- approved snapshot, credit reservation, queue lease, private artifact manifest, checksum, source sequence map, compiled intent, edit plan version, model routing policy, and QA policy references required;
- cleanup and residue readback required;
- sanitized report only.

Forbidden:

- arbitrary user/private media;
- raw prompt execution;
- QWEN runtime execution unless separately approved by an explicit provider/runtime packet;
- provider/model calls;
- worker dispatch;
- signed URL creation;
- public artifact creation;
- broad external beta;
- paid production;
- production;
- final render/export;
- service-role secret payload logging;
- frontend service-role exposure.
