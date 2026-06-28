# RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-QWEN-PRODUCT-FLOW-RUNTIME-1

Implement the next guarded runtime validation packet after `RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-PRODUCT-FLOW-AFTER-QWEN-ORCHESTRATION-1`.

The runtime packet may proceed only if it names the target staging API, uses the single tester `aiediting@reeditpro.com`, and requires:

- `REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_QWEN_PRODUCT_FLOW_RUNTIME=true`;
- approved snapshot reference;
- credit reservation reference;
- job or queue lease reference;
- route idempotency key;
- private input manifest reference;
- private artifact manifest and checksum references;
- model routing policy and QA policy references;
- no-public-artifact policy;
- cleanup and rollback policy;
- negative checks for raw prompt execution, arbitrary user/private media, public artifacts, signed URLs, broad tester expansion, paid production, final delivery/export, and production unlock.

Do not run broad provider/model calls, workers, media processing, Supabase mutation, SQL, public artifact creation, paid billing, production, or final delivery/export. Any runtime must remain bounded to the approved single-tester Qwen product-flow validation and must record sanitized evidence only.
