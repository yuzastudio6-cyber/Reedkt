# TOOL-ROUTE-1 QA Gate Map

- `owner_study_exists`: status `passed`; required `true`.
- `capability_map_exists`: status `passed`; required `true`.
- `routing_policy_exists`: status `passed`; required `true`.
- `handoff_contract_exists`: status `passed`; required `true`.
- `blocked_use_register_exists`: status `passed`; required `true`.
- `worker_dry_run_evidence_exists`: status `passed`; required `true`.
- `plan_snapshot_evidence_exists`: status `passed`; required `true`.
- `route_family_plan_complete`: status `passed`; required `true`.
- `owner_route_plan_complete`: status `passed`; required `true`.
- `artifact_contract_map_complete`: status `passed`; required `true`.
- `no_runtime_execution`: status `passed`; required `true`.
- `no_public_artifacts`: status `passed`; required `true`.
- `no_signed_urls`: status `passed`; required `true`.
- `no_raw_prompts`: status `passed`; required `true`.
- `no_supabase_mutation`: status `passed`; required `true`.
- `no_production_external_beta_unlock`: status `passed`; required `true`.

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
