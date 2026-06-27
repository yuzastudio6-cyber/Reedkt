# Validation Results

Packet: `RP-EXTERNAL-BETA-CREDIT-RESERVATION-LEDGER-GUARDED-REMOTE-WRITE-1`

Decision: `completed_credit_reservation_ledger_guarded_remote_write_readback`

Execution: `completed_guarded_transaction_rolled_back_credit_reservation_ledger_write_readback`

Run ID: `2026-06-27T00-12-50-200Z-34a19fc2`

Output directory: `/tmp/reeditpro-rp-external-beta-credit-reservation-ledger-guarded-remote-write-1/2026-06-27T00-12-50-200Z-34a19fc2`

## Remote Write/Readback

- Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`
- Confirmation: `REEDITPRO_CONFIRM_EXTERNAL_BETA_CREDIT_LEDGER_REMOTE_WRITE=true`
- Role boundary: `set local role service_role`
- Fixture persistence: `transaction_rolled_back`
- Persistent rows created: `false`
- Credit wallet inserted/read back in transaction: `1`
- Credit grant inserted/read back in transaction: `1`
- Credit approval inserted/read back in transaction: `1`
- Approved snapshot inserted/read back in transaction: `1`
- Credit reservation inserted/read back in transaction: `1`
- Credit reservation status read back: `reserved`
- Credit ledger entry inserted/read back in transaction: `1`
- Credit ledger entry type read back: `reservation`
- Credit ledger amount read back: `-10`
- Credit ledger balance after read back: `90`
- Audit event inserted/read back in transaction: `1`
- Credit ledger append-only update rejection: `passed`

## Rollback Residue Readback

Residue counts after rollback:

- credit wallets: `0`
- credit grants: `0`
- credit approvals: `0`
- credit reservations: `0`
- credit ledger entries: `0`
- approved plan snapshots: `0`
- audit events: `0`

## Artifact Checksums

- `credit-ledger-write-readback.json`
  - bytes: `340`
  - sha256: `fe0dd616ae610e0887593990ea7c53f4d964e51892007022a5fa594fb468043c`
- `rollback-residue-readback.json`
  - bytes: `174`
  - sha256: `e71d2daca8d91043f311840ab431b11a0b0469741ad12d2b3db20f7352b64308`
- `validation-report.json`
  - bytes: `2996`
  - sha256: `ccbcd02a4264d0ecb1cba7394d7c9344e8c24ab3b3fe7f7ff5f21f385536044c`
- `artifact-manifest.json`
  - bytes: `1269`
  - sha256: `a2f6f7cb204903bb3bcca354fc9d5a649353330a8ef93a152bab560c331d7782`

Package-lock: `unchanged`

Generated artifacts committed: `none`
