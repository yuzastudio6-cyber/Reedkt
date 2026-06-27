# Validation Results

Packet: `RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1`

Decision: `completed_approved_snapshot_persistence_guarded_remote_write_readback`

Execution: `completed_guarded_transaction_rolled_back_approved_snapshot_persistence_write_readback`

Run ID: `2026-06-27T00-00-12-289Z-7f5e51bd`

Output directory: `/tmp/reeditpro-rp-external-beta-approved-snapshot-persistence-guarded-remote-write-1/2026-06-27T00-00-12-289Z-7f5e51bd`

## Remote Write/Readback

- Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`
- Confirmation: `REEDITPRO_CONFIRM_EXTERNAL_BETA_APPROVED_SNAPSHOT_REMOTE_WRITE=true`
- Role boundary: `set local role service_role`
- Fixture persistence: `transaction_rolled_back`
- Persistent rows created: `false`
- Immutable snapshot update rejection: `passed`
- Workspace inserted/read back in transaction: `1`
- Project inserted/read back in transaction: `1`
- Edit session inserted/read back in transaction: `1`
- Edit plan inserted/read back in transaction: `1`
- Edit plan version inserted/read back in transaction: `1`
- Credit estimate inserted/read back in transaction: `1`
- Approved snapshot inserted/read back in transaction: `1`
- Approval record inserted/read back in transaction: `1`
- API idempotency key inserted/read back in transaction: `1`
- Audit event inserted/read back in transaction: `1`

## Rollback Residue Readback

Residue counts after rollback:

- workspaces: `0`
- projects: `0`
- edit sessions: `0`
- edit plans: `0`
- edit plan versions: `0`
- credit estimates: `0`
- approved plan snapshots: `0`
- approval records: `0`
- API idempotency keys: `0`
- audit events: `0`

## Artifact Checksums

- `approved-snapshot-write-readback.json`
  - bytes: `441`
  - sha256: `2a5cdc3a3c9a7c3f9f16a28da05efd35084297a26304842f8a79d34c0656a339`
- `rollback-residue-readback.json`
  - bytes: `227`
  - sha256: `588ba11c60afcda8836a181ef392e45133067a987c13734298f18618a8b51d79`
- `validation-report.json`
  - bytes: `3240`
  - sha256: `aa4d16b57305072242427398a5f2c3fadf6637490d08f4a76466087b269cb865`
- `artifact-manifest.json`
  - bytes: `1297`
  - sha256: `36edc2f5c48567da9ccd5860ce6b634858465933e974c9bec64bc2d59bfd73ed`

Package-lock: `unchanged`

Generated artifacts committed: `none`
