# Track B Readiness Rollup

Run id: `phase44p-trackb-readiness-rollup-supabase-milestone-export-20260605`

Phase 44P creates committed safe metadata only. It does not write Supabase, run SQL, deploy migrations, execute routes/workers/tools, process media/audio/OCR/VLM/model payloads, call providers, unlock beta/production, or touch Track A.

| Tool | Current status | Internal ready | Supabase export eligible |
| --- | --- | --- | --- |
| `deepfilternet` | internally_beta_ready_candidate_restricted_scope | yes | yes |
| `signalsmith_stretch` | internally_beta_ready_candidate_restricted_scope | yes | yes |
| `demucs` | blocked_pending_training_data_provenance | no | yes |
| `paddleocr` | phase_complete_restricted_scope | yes | yes |
| `paddlepaddle` | phase_complete_restricted_scope | yes | yes |
| `qwen3_vl` | excluded_for_initial_internal_testing | no | yes |
| `vllm` | excluded_for_initial_internal_testing | no | yes |
| `opencv` | internally_beta_ready_candidate_restricted_scope | yes | yes |
| `pyav` | internally_beta_ready_candidate_restricted_scope | yes | yes |
| `pyscenedetect` | internally_beta_ready_candidate_restricted_scope | yes | yes |
| `sharp_libvips` | internally_beta_ready_candidate_restricted_scope | yes | yes |
| `duckdb` | internally_beta_ready_candidate_restricted_scope | yes | yes |
| `polars` | internally_beta_ready_candidate_restricted_scope | yes | yes |
| `web_capability_profiler` | phase_complete_restricted_scope | yes | yes |
| `desktop_capability_profiler` | phase_complete_restricted_scope | yes | yes |
| `local_worker_sidecar_planning` | phase_complete_restricted_scope | yes | yes |
| `cost_estimator` | phase_complete_restricted_scope | yes | yes |
| `tool_route_manifest_integration` | phase_complete_restricted_scope | yes | yes |
