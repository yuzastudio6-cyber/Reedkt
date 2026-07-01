# Negative Cases

Negative validation status: `passed`

The dry run rejected these unsafe input classes:

| Case | Result |
| --- | --- |
| `reject_raw_command` | `rejected` |
| `reject_arbitrary_private_media` | `rejected` |
| `reject_route_execution` | `rejected` |
| `reject_worker_dispatch` | `rejected` |
| `reject_persistent_queue_write` | `rejected` |
| `reject_supabase_sql` | `rejected` |
| `reject_signed_public_artifact` | `rejected` |
| `reject_final_export_production` | `rejected` |

Rejected inputs remain blocked until a later source-controlled packet explicitly authorizes the exact path and adds matching diagnostics, safety scans, and rollback boundaries.
