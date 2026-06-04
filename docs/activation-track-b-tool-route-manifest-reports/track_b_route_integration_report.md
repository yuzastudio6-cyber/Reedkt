# Track B Tool Route Manifest Integration

Status: passed

Phase 44I creates route metadata and fail-closed gating policy only. It does not execute tools, workers, media, audio, OCR, VLM, Docker, Cloud Build, Cloud Run, providers, GCP/IAM mutation, beta, production, or Track A work.

| Tool | Route status | Routeable metadata | Cost class |
| --- | --- | --- | --- |
| `deepfilternet` | route_enabled_restricted_internal | yes | cpu_medium |
| `signalsmith_stretch` | route_enabled_restricted_internal | yes | cpu_medium |
| `demucs` | route_disabled_blocked | no | blocked_unknown |
| `paddleocr` | route_enabled_restricted_internal | yes | cpu_medium |
| `paddlepaddle` | route_handoff_only | no | cpu_medium |
| `qwen3_vl` | route_disabled_excluded | no | gpu_required |
| `vllm` | route_disabled_excluded | no | gpu_required |
| `opencv` | route_enabled_restricted_internal | yes | cpu_medium |
| `pyav` | route_enabled_restricted_internal | yes | cpu_medium |
| `pyscenedetect` | route_enabled_restricted_internal | yes | cpu_medium |
| `sharp_libvips` | route_enabled_restricted_internal | yes | cpu_medium |
| `duckdb` | route_enabled_restricted_internal | yes | cpu_low |
| `polars` | route_enabled_restricted_internal | yes | cpu_low |
| `web_capability_profiler` | route_disabled_not_started | no | pending_estimator |
| `desktop_capability_profiler` | route_disabled_not_started | no | pending_estimator |
| `local_worker_sidecar_planning` | route_disabled_not_started | no | pending_estimator |
| `cost_estimator` | route_disabled_not_started | no | pending_estimator |
| `tool_route_manifest_integration` | route_handoff_only | no | pending_estimator |

Workers still require approved plan snapshots, approved artifact scopes, tool-specific future confirmation phases, and private artifacts only.
