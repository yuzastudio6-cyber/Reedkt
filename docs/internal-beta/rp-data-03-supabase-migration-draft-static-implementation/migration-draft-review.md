# RP-DATA-03 Migration Draft Review

Decision: `completed_static_migration_draft_ready_for_guarded_local_validation`

Migration draft status: `created_not_applied`

Static migration file:

`supabase/migrations/20260625031135_rp_data_03_internal_beta_static_gap_contract.sql`

## Draft Adds

- `public.artifact_manifests`
- `public.artifact_manifest_items`
- RLS enablement for both new tables
- project-member select policies for both new tables
- explicit Data API grants for internal-beta table exposure
- service-role grants for backend/worker-created artifact manifests
- backend-only comments for jobs, worker events, credit reservations, final exports, and artifact manifests

## Draft Complements Existing Migrations

The existing migration chain already covers:

- identity/workspace/project/session/chat records;
- media/source-sequence records;
- intent/settings/plan versions/operations;
- credit estimates, reservations, ledger, approvals, and approved snapshots;
- generation/assets/jobs/workers;
- QA, revision, exports, audit records;
- RLS helper functions and policies;
- private storage bucket policy direction;
- upload intents, storage object records, signed URL audit events, worker job claims, tool runtime checks, and provider attempt summaries.

RP-DATA-03 does not duplicate these. It adds the missing artifact manifest table named by RP-DATA-01/RP-DATA-02 and explicit grants required by current Supabase Data API exposure behavior.

## Not Included

- No SQL was executed.
- No migration was applied.
- No storage bucket was created.
- No Supabase environment was touched.
- No backend route, worker, provider, model, render, upload, billing, or production interface was changed.
- No internal beta, external beta, paid production, public artifact, or final delivery/export gate was unlocked.
