# Restricted Internal Testing Stop Conditions

- `any_secret_exposure`
- `any_production_write`
- `any_external_beta_exposure`
- `any_public_artifact`
- `any_signed_url_source_of_truth_use`
- `any_raw_prompt_execution_as_worker_input`
- `any_provider_call`
- `any_worker_tool_runtime_execution_outside_scope`
- `any_supabase_production_mutation`
- `any_broad_media_processing`

Stop rehearsal, mark start gate blocked, route issue to owner, and do not attempt runtime or Supabase mutation repair in this phase.
