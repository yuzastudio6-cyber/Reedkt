# Runtime QA Rollup Evidence Matrix

| Evidence | Source | QA result |
| --- | --- | --- |
| Queue integration source | #2028 / `c40b7f9165230bc575bd53823398941d44d48b97` | `passed` |
| Dispatch dry-run source | #2036 / `aa2627a18540828d7a391e569d8f21b70eb2d58f` | `passed` |
| Runtime execution packet source | #2044 / `470eedc8975dc3879d66909c5d63c6d362ece512` | `passed` |
| Runtime packet decision | `completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_execution_packet_generated_fixture_only` | `passed` |
| Runtime packet execution | `completed_confirmation_gated_narrow_controlled_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch` | `passed` |
| GStreamer command scope | controlled generated fixture only | `passed` |
| MKVToolNix command scope | generated SRT and generated subtitle-only MKV fixture only | `passed` |
| Docker scope | local image only; network disabled; no push/deploy | `passed` |
| Route/worker boundary | route execution, dispatch, process start, lease claim, and persistent queue write disabled | `passed` |
| Artifact boundary | local `/tmp` reports only; no committed generated artifacts | `passed` |
| Product-ready end-to-end local OSS tools | `0` | `passed` |

## Checksums Reviewed

- `narrow-controlled-worker-runtime-packet-envelope.json`: `0efe96d011b860a9477157883363814b4e417cddd6894110af3b7b091a2bc97a`
- `narrow-controlled-worker-runtime-output-manifest.json`: `238a8b9ff5a04d4e3735114917876963697a8818798f58081f03949c83f5300a`
- `narrow-controlled-worker-runtime-qa-report.json`: `f46b27090bd493bd450cdae8312a7f9a03536efa38d1567b757bba2aa6ba939d`
- `narrow-controlled-worker-runtime-execution-packet-report.json`: `4a79c11f3f391753c72941a672dcda9e8a0e72e32020a52f03c661d0e1f1567d`
- `narrow-controlled-worker-runtime-execution-packet-manifest.json`: `452986a7673704bf3af3adfdb97fe6978b3a999ab9f94aad958c9c8b05f7ae07`
