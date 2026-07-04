# Auth Profile Schema Compatibility

## Decision

`auth_profile_schema_compatibility_passed_ready_for_internal_tester_bootstrap_readback`

## Scope

The browser-safe auth bootstrap now supports both known profile identity shapes:

- `profiles.user_id = auth.users.id`
- `profiles.id = auth.users.id`

This is required because the internal-testing durable project/session SQL draft defines `profiles.id` as the auth user id, while older mock-safe runtime code queried `profiles.user_id`.

## Boundary

The compatibility path keeps the same safety model:

- Supabase anon browser client only.
- No service-role key in frontend code.
- No Supabase migration or schema mutation.
- No worker dispatch, tool execution, provider call, storage signing, media processing, credit mutation, external beta, or production activation.

If RLS blocks a lookup/write, the bootstrap still returns `backend_required`. It only falls back when Supabase/PostgREST reports a missing profile column or schema-cache mismatch.

## Next Gate

`INTERNAL_TESTER_BACKEND_PROFILE_WORKSPACE_PROVISIONING_READBACK`
