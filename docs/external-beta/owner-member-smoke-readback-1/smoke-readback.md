# Owner-Member Smoke Readback

Command class: read-only Cloud Run service URL readback and safe HTTP `GET` smoke.

Active account: `aiediting@reeditpro.com`.

Group membership status: `owner_member_present`.

## HTTP Results

- Unauthenticated `/health`: `403`
- Authenticated owner-member `/health`: `200`
- Authenticated owner-member `/ready`: `200`
- Authenticated owner-member `/api/runtime/status`: `200`

The authenticated smoke used a local identity token from the active owner-member account. The token was not recorded, printed, persisted, or committed.

## Boundary

This proves the current owner-member authenticated path through the owner-managed group grant. It does not add a separate external tester, does not create app users, and does not prove a non-owner external tester account.
