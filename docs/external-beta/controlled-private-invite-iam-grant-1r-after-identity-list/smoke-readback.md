# Controlled Private Invite Smoke Readback

Decision: `completed_controlled_private_invite_iam_grant_for_owner_managed_group`

Smoke execution: `completed_authenticated_staging_api_smoke_after_group_invoker_grant`

## Results

| Check | Result |
| --- | --- |
| Unauthenticated `/health` | `403` |
| Authenticated `/health` | `200` |
| Authenticated `/ready` | `200` |
| Authenticated `/api/runtime/status` | `200` |
| Runtime mode | `mock` |
| Provider real calls | `false` |
| Public artifact creation | `false` |
| Signed URL source-of-truth | `false` |

The authenticated smoke used the active Google account token path without printing or persisting token payloads. The audience-bound identity-token path was not used because the active user account does not support `gcloud auth print-identity-token --audiences`; the standard user identity-token path returned `200` after the group invoker grant.

## Safety

The smoke was limited to safe `GET` calls on staging health/readiness/status endpoints. It did not run provider/model calls, worker dispatch, media processing, Supabase mutation, SQL, Secret Manager payload access, signed URL creation, public artifact creation, billing, or production unlocks.
