# RP-EXTERNAL-BETA-QWEN-STAGING-API-ROUTE-DEPLOYMENT-ALIGNMENT-1

Use after `RP-EXTERNAL-BETA-QWEN-CONFIRMED-TRANSPORT-RUNTIME-PREFLIGHT-CURRENT-1` records `blocked_route_response_classification_failed` because the deployed staging API revision returned `404` for `/api/providers/qwen2-5-vl/structured-visual-metadata`.

Goal: align the non-production `reeditpro-staging-api` deployment with the current integration source route before retrying the QWEN transport preflight.

Required constraints:

- Target project: `reeditpro`.
- Target region: `us-central1`.
- Target service: `reeditpro-staging-api`.
- Target Supabase ref: `wmyyttnynmteqgcdishd`.
- Do not call QWEN, providers, models, workers, Supabase, SQL, signed/public artifacts, media processing, credits, render/export, or production.
- Do not unlock broad external beta or production.
- Any deployment or service update requires its own explicit confirmation gate and must record source SHA, image/tag or build source, service revision, traffic, rollback plan, route map readback, and safety evidence.

After staging API route alignment is proven, rerun `RP-EXTERNAL-BETA-QWEN-CONFIRMED-TRANSPORT-RUNTIME-PREFLIGHT-CURRENT-1R` with the same structured metadata fixture and the exact confirmed gates from the readiness plan.
