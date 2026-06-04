# Track B Initial Internal Testing Manifest

Included for restricted internal testing:

- `deepfilternet`
- `signalsmith_stretch`
- `paddleocr`
- `paddlepaddle`
- `opencv`
- `pyav`
- `pyscenedetect`
- `sharp_libvips`
- `duckdb`
- `polars`

Excluded/blocked:

- `demucs`
- `qwen3_vl`
- `vllm`

Not started:

- `web_capability_profiler`
- `desktop_capability_profiler`
- `local_worker_sidecar_planning`
- `cost_estimator`
- `tool_route_manifest_integration`

The VLM exclusion is also recorded as the composite `qwen_vlm_vllm` entry in `track_b_initial_internal_testing_manifest.json`.

This manifest does not allow production routing, broad media, arbitrary media, provider calls, public artifacts, or Track A runtime work.
