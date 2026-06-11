# Restricted Internal Testing Scope

Allowed:
- `metadata_readiness_dashboards`
- `track_b_readiness_review`
- `clean_staging_milestone_registry_review`
- `approved_noop_metadata_route_simulation_review`
- `duckdb_polars_metadata_reporting_evidence_review`
- `completed_phase_evidence_review`

Blocked:
- `production`
- `external_beta`
- `paid_production`
- `provider_calls`
- `live_tool_execution`
- `worker_execution`
- `route_execution`
- `public_artifacts`
- `signed_urls_as_source_of_truth`
- `broad_media_processing`
- `vlm_qwen_runtime`
- `demucs_runtime`
- `raw_prompt_execution`
- `supabase_production_promotion`
- `track_a_runtime`

External beta, paid production, production, public artifacts, signed URL source-of-truth, providers, workers, live tool routes, raw prompt execution, and broad media remain blocked.
