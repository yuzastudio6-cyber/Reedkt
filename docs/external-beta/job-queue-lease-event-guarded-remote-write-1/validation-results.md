# Validation Results

Packet: `RP-EXTERNAL-BETA-JOB-QUEUE-LEASE-EVENT-GUARDED-REMOTE-WRITE-1`

Decision: `completed_job_queue_lease_event_guarded_remote_write_readback`

Execution: `completed_guarded_transaction_rolled_back_job_queue_lease_event_write_readback`

Run ID: `2026-06-27T00-29-52-739Z-c91f8249`

Output directory: `/tmp/reeditpro-rp-external-beta-job-queue-lease-event-guarded-remote-write-1/2026-06-27T00-29-52-739Z-c91f8249`

## Remote Write/Readback

- Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`
- Confirmation: `REEDITPRO_CONFIRM_EXTERNAL_BETA_JOB_QUEUE_LEASE_EVENT_REMOTE_WRITE=true`
- Role boundary: `set local role service_role`
- Fixture persistence: `transaction_rolled_back`
- Persistent rows created: `false`
- Approved snapshot inserted/read back in transaction: `1`
- Credit reservation inserted/read back in transaction: `1`
- Credit ledger entry inserted/read back in transaction: `1`
- Job batch inserted/read back in transaction: `1`
- Job batch status read back: `queued`
- Job inserted/read back in transaction: `1`
- Job status read back: `queued`
- Job type read back: `render_preview`
- Worker target read back: `render_worker`
- Runtime type read back: `cloud_run_job`
- Job event inserted/read back in transaction: `1`
- Job event type read back: `queued`
- Worker lease inserted/read back in transaction: `1`
- Worker lease status read back: `claimed`
- Worker lease kind read back: `render_worker`
- Job claim attempt inserted/read back in transaction: `1`
- Job claim attempt result read back: `claimed`
- Audit event inserted/read back in transaction: `1`

## Rollback Residue Readback

Residue counts after rollback:

- job batches: `0`
- jobs: `0`
- job events: `0`
- worker leases: `0`
- job claim attempts: `0`
- credit reservations: `0`
- credit ledger entries: `0`
- approved plan snapshots: `0`
- audit events: `0`

## Artifact Checksums

- `job-queue-lease-event-write-readback.json`
  - bytes: `559`
  - sha256: `351db63b480fd32c8afa731df50f8b8332fdaa42b23ff32296d1b6bcf8a51d42`
- `rollback-residue-readback.json`
  - bytes: `203`
  - sha256: `b283940e84c41ca159bae48c4021d6d2b250cc72aacafeeadfa0cd58bea3507b`
- `validation-report.json`
  - bytes: `3691`
  - sha256: `462662a3a23f947d245a791671727b81f422197670e7980aa9d763b7de33f0a7`
- `artifact-manifest.json`
  - bytes: `1265`
  - sha256: `10cefbad91d0b5e80a05f77b3888e0865f45e171bde89c82a90daf9ab283d02c`

Package-lock: `unchanged`

Generated artifacts committed: `none`
