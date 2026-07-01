# Route Dispatch Contract

This readiness packet defines the contract for the next dry-run only. The current phase does not call routes or dispatch workers.

Required invariants for the next route/dispatch dry-run:

| Invariant | Required value |
| --- | --- |
| Confirmation gate | `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_DISPATCH_DRY_RUN=true` |
| Route execution mode | `metadata_only_route_dispatch_dry_run` |
| Worker dispatch mode | `metadata_only_no_worker_process_started` |
| Worker execution | `not_run_route_dispatch_dry_run_only` |
| Worker lease claim | `not_claimed_route_dispatch_dry_run_only` |
| Persistent job queue write | `not_written_route_dispatch_dry_run_only` |
| Runtime fixture scope | `generated_srt_and_generated_subtitle_only_mkv_fixture` |
| Private/user media | `forbidden` |
| Public artifact creation | `forbidden` |
| Signed URL source-of-truth | `forbidden` |
| Final render/export | `forbidden` |
| Supabase mutation / SQL | `forbidden` |

The next packet may validate route envelope construction, idempotency keys, approved snapshot references, job references, manifest schema references, QA schema references, cleanup policy references, retry policy references, and non-public artifact policy references.

It must not execute tools, process private or user media, call providers, mutate Supabase, run SQL, create public artifacts, or unlock external beta / paid production / production.
