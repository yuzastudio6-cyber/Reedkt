# RP-EXTERNAL-BETA-QWEN-TRANSPORT-READINESS-PLAN-CURRENT-1

Use only after `RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-ATTEMPT-RESULT-REVIEW-CURRENT-1` is merged and records `completed_current_base_qwen_transport_dependency_attempt_result_review_fail_closed_transport_readiness_planning_required`.

The next packet must plan the first current-base QWEN transport readiness gate. It must name:

- exact staging service and QWEN worker service;
- exact product route or worker route;
- allowed HTTP method and request body shape;
- approved snapshot fixture;
- credit reservation no-spend policy;
- idempotency key;
- private input manifest;
- artifact manifest and checksum policy;
- timeout and cost guard;
- cleanup and rollback policy;
- failure classifications;
- broad external beta and production locks.

It must require an explicit confirmation gate before any Cloud Run request, identity-token fetch, worker dispatch, provider/model runtime call, generated asset creation, Supabase mutation, SQL execution, signed/public artifact creation, credit mutation, broad beta expansion, final render/export, or production path.

Do not import or merge the open stacked draft QWEN PR chain wholesale. Use current integration source only, with draft branches as evidence when relevant.
