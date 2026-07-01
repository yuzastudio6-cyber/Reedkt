# Evidence Matrix

| Evidence | Status | Source |
| --- | --- | --- |
| Boundary source contract | `passed` | PR `#1967`, merge `64ac4a5f8bd02b28533d3e8c1d6e2e65aca430c7` |
| Confirmation-gated no-op dry run | `passed` | PR `#1970`, run ID `2026-07-01T09-10-00-006Z-4412669b` |
| Fail-closed no-gate behavior | `passed` | `blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_boundary_dry_run_confirmation` |
| Positive boundary validation | `passed` | `noop_boundary_validation_only` |
| Negative boundary validation | `passed` | 12 fail-closed cases rejected |
| Route registered/enabled/executed | `false` | Dry-run report |
| Worker dispatch/execution/process start/lease claim/queue write | `false` | Dry-run report |
| Tool/media/Supabase/SQL/public artifact/final export/unlock execution | `false` | Dry-run report |
| Package-lock | `unchanged` | QA rollup diagnostics |
| Generated artifacts committed | `none` | QA rollup diagnostics |
| Product-ready end-to-end local OSS tools | `0` | QA rollup record |

Accepted local evidence checksums:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `narrow-route-worker-boundary-dry-run-envelope.json` | 5512 | `f138b22df48c4fcdb78451d853ae66dcd9f5404e17ea5fa67bdb3bb93ac436c5` |
| `narrow-route-worker-boundary-dry-run-report.json` | 4299 | `ab82196f389830d58f5e2a8bbb69d44009cb6cb0010947414643c2dfb77881ba` |
| `narrow-route-worker-boundary-dry-run-manifest.json` | 1020 | `2713f64fa1c0f7fc5a3e1674c5c8f203b8d98a7cf497aae3349e1bd85484fe91` |
