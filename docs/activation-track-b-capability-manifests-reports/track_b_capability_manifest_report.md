# Track B Capability Manifest Baseline

Status: passed

This report is manifest-only. It does not execute runtimes, process media/audio/OCR/VLM, mutate GCP/IAM, call providers, or unlock beta/production.

| Tool | Family | Status | Initial testing group |
| --- | --- | --- | --- |
| `deepfilternet` | audio_timing | internally_beta_ready_candidate_restricted_scope | included |
| `signalsmith_stretch` | audio_timing | internally_beta_ready_candidate_restricted_scope | included |
| `demucs` | audio_timing | blocked_pending_training_data_provenance | excluded |
| `paddleocr` | ocr | phase_complete_restricted_scope | included |
| `paddlepaddle` | ocr | phase_complete_restricted_scope | included |
| `qwen3_vl` | vlm | excluded_for_initial_internal_testing | excluded |
| `vllm` | vlm | excluded_for_initial_internal_testing | excluded |
| `opencv` | media_data | internally_beta_ready_candidate_restricted_scope | included |
| `pyav` | media_data | internally_beta_ready_candidate_restricted_scope | included |
| `pyscenedetect` | media_data | internally_beta_ready_candidate_restricted_scope | included |
| `sharp_libvips` | media_data | internally_beta_ready_candidate_restricted_scope | included |
| `duckdb` | media_data | internally_beta_ready_candidate_restricted_scope | included |
| `polars` | media_data | internally_beta_ready_candidate_restricted_scope | included |
| `web_capability_profiler` | hybrid_compute_cost_routing | not_started | not_started |
| `desktop_capability_profiler` | hybrid_compute_cost_routing | not_started | not_started |
| `local_worker_sidecar_planning` | hybrid_compute_cost_routing | not_started | not_started |
| `cost_estimator` | hybrid_compute_cost_routing | not_started | not_started |
| `tool_route_manifest_integration` | hybrid_compute_cost_routing | not_started | not_started |

Route handoff: Phase 44I remains required for actual tool route manifest integration. Workers must execute approved plan snapshots within approved artifact scopes only. Raw chat execution remains blocked.
