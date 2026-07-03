# Worker Lease Dry-Run Contract

Lease ID: `tracka-three-tool-external-agent-lease-dry-run-1`

Queue name: `tracka-three-tool-external-agent-persistent-jobs`

Lease mode: `metadata_only_dry_run_no_lease_claim`

Lease TTL seconds: `900`

Retry policy: `dry_run_exponential_backoff_metadata_only`

Cleanup policy: `dry_run_private_artifact_cleanup_metadata_only`

Failure categories:
- `tool_unavailable`
- `fixture_validation_failed`
- `artifact_manifest_mismatch`
- `safety_boundary_violation`

Accepted response status: `accepted_three_tool_worker_lease_dry_run_contract`

Lease envelope validation: `passed`

Retry policy validation: `passed`

Cleanup policy validation: `passed`

Worker lease claim: `false`

Worker process start: `false`

Worker execution: `false`

Persistent job queue write: `false`

Raw command strings allowed: `false`
