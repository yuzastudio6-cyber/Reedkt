# Web Compute Route Visibility Policy

The Phase 44C compute routes page is informational only. It displays planned
route categories without executing local or cloud work.

Route categories include:

- `browser_preview`
- `desktop_local_worker_future`
- `cloud_cpu`
- `cloud_gpu_l4`
- `cloud_render`
- `blocked_by_policy`
- `needs_approval`

Examples include browser/local preview for timeline and captions, cloud CPU for
media analysis and speech transcription, cloud GPU L4 for BiRefNet/SAM2/Real-
ESRGAN policy visibility, cloud render for final export, and Revideo as
blocked/evaluation-only.

The page must not execute routes, run local workers, call cloud APIs, download
models, process media, or imply that desktop compute exists in Phase 44C.
