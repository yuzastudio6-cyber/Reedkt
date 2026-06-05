# Supabase Activation Milestone Registry RLS Policy

Every activation milestone registry table has RLS enabled.

Access policy:

- `public`, `anon`, and `authenticated` have all table privileges revoked.
- `service_role` has table `select`, `insert`, `update`, and `delete` privileges for guarded server-side staging writes only.
- No public read view is created in this phase.
- No browser/frontend code may use service-role credentials.

Hard safety defaults:

- `production_allowed = false`
- `external_beta_allowed = false`
- `paid_production_allowed = false`
- `broad_media_allowed = false`
- `public_output_allowed = false`
- `provider_calls_allowed = false`

The schema is a staging/Foundation metadata registry. It is not a product route executor, production registry, public status API, or beta unlock.
