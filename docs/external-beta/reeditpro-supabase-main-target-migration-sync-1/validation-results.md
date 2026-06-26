# Validation Results

Packet: `RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1`

Run date: `2026-06-26`

## Remote Execution Evidence

Main migration apply output directory:

- `/tmp/reeditpro-main-target-sync-apply-20260626T224345Z`

Main migration apply report checksum:

- `db-push-include-all.txt`: `3263b0fcec5c0888638485a5db6c1f0f6efc4ade29b2f37fb6dfbb2500bd6ca9`

Post-apply migration history checksum:

- `post-migration-history.tsv`: `520d56d913cf0cfd49e57f96b079e37c3b6508645eb3988ffbf12c9567a52ab8`

Lint-fix migration output directory:

- `/tmp/reeditpro-main-target-sync-rpc-lint-fix-20260626T224604Z`

Lint-fix push checksum:

- `db-push.txt`: `c1b90a7e7520c6b45fecdf196f19104f39425025e26c8961985b60f1ee761fad`

Lint clean checksum:

- `db-lint.txt`: `35fc0c4ffae84f0b060df61dc45d1a28dd3d1ddbde24acbd176bb7531704bf34`

Final remote check output directory:

- `/tmp/reeditpro-main-target-sync-final-remote-check-20260626T224705Z`

Final dry-run checksum:

- `db-push-dry-run-final.txt`: `e22312b80cf2231555612f3f31b288bda5f8bc6b23f521d7b4525e3b93ccbd87`

Final row-count checksum:

- `final-row-counts.tsv`: `d057d6f5c29fd52d429c7d7a81d26a9b33526642f6746c78e4e163bb6970a2c9`

Confirmed RLS/storage validation run:

- Run ID: `2026-06-26T22-47-09-777Z-898c9851`
- Report: `/tmp/reeditpro-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/2026-06-26T22-47-09-777Z-898c9851/validation-report.json`
- Report SHA-256: `11cd2f5bdfd9e5ee22af01d38738903b855e7a8a5a51610880c45bf68fbaef35`
- Manifest SHA-256: `370939f4662f708a4b02d29b7775b194891f46c8cb0f7f17c181b21bfffa0d23`

## Final Readback

Final row counts:

- `api_idempotency_keys`: `11`
- `approval_records`: `0`
- `approved_plan_snapshots`: `0`
- `artifact_manifests`: `0`
- `audit_events`: `0`
- `edit_briefs`: `11`
- `edit_cues`: `11`
- `edit_sessions`: `11`
- `media_assets`: `0`
- `projects`: `11`
- `worker_jobs`: `0`
- `workspaces`: `11`

Final target/advisor validation:

- `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED result: completed_guarded_supabase_target_rls_storage_readonly_validation`

## Local Repository Validation

Required repository validation for this packet:

- `git diff --check`
- `npm run --silent rp-external-beta-reeditpro-supabase-main-target-migration-sync-1:diagnostics`
- `npm run --silent rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed:diagnostics`
- `git diff --cached --check`

Full repo validation should run before merge if this packet is promoted to a ready PR.
