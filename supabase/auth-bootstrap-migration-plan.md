# Auth Bootstrap Migration Plan

## Status

RP-FIX-06 does not add or deploy a migration. This document records a future migration option because no auth bootstrap trigger/function was found in the active migrations.

## Possible Future Function

A later reviewed migration could add:

```text
handle_new_auth_user()
trigger on auth.users
create profile row
optionally create default workspace
optionally create owner membership
```

## Recommendation

Profile creation can be trigger-based because it is a direct mirror of Supabase Auth identity.

Workspace creation may be better as app-service logic after first login because workspace naming, plan type, business/team setup, invites, and onboarding can become product-specific.

## Guardrails

- Do not create workspaces in a trigger unless product rules are settled.
- Do not put service-role credentials in frontend code.
- Test any trigger locally and in staging before production.
- Keep owner membership and workspace policy behavior covered by RLS smoke tests.
