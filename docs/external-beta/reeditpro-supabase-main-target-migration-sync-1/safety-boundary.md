# Safety Boundary

Packet: `RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1`

Allowed in this phase:

- Secret Manager payload access for `SUPABASE_ACCESS_TOKEN` and `REEDITPRO_STAGING_SUPABASE_DB_URL`, only as ephemeral process environment handoff.
- `supabase migration list --db-url [redacted]`.
- `supabase db push --dry-run --include-all --db-url [redacted]`.
- Guarded staging migration apply against `Reeditpro` / `wmyyttnynmteqgcdishd` only.
- `supabase db lint --db-url [redacted]`.
- Read-only catalog and row-count queries.

Explicitly not allowed and not performed:

- isolated target data copy;
- production Supabase mutation;
- SQL editor/manual table mutation;
- migration history deletion or repair-as-reverted;
- storage object creation/read;
- service-role route execution;
- worker dispatch or worker lease claim;
- provider/model calls;
- media processing;
- signed URL creation;
- public artifact creation;
- beta, production, or final delivery/export unlock.

No Supabase production mutation, service-role route execution, frontend service-role credential exposure, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled. Remote Supabase mutation was limited to guarded staging migration apply on the single main Reeditpro project `wmyyttnynmteqgcdishd`; no data was copied from the isolated project.
