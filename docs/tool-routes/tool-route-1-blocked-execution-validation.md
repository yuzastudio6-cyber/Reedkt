# TOOL-ROUTE-1 Blocked Execution Validation

All execution blocked: `true`

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.

Blocked categories:

- tool_execution
- worker_execution
- route_execution
- provider_or_model_calls
- media_processing
- browser_capture
- map_rendering
- web_search_execution
- Supabase_mutation
- SQL_migrations_schema_RLS
- Google_Cloud_API_call
- Secret_Manager_API_call
- GCS_storage_transfer
- public_artifact_creation
- signed_URL_creation_or_source_of_truth
- raw_prompt_execution
- raw_provider_or_search_response_storage
- credit_or_Stripe_mutation
- production_unlock
- internal_beta_unlock
- external_beta_unlock
- dependency_mutation
- final_render_or_export
- audio_SFX_music_generation
- FFmpeg_FFprobe_execution
- DeepFilterNet_execution
- Demucs_runtime
- Qwen_VLM_vLLM_runtime
