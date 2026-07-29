# Canonical V3 Local Private Project Authority Verification

Date: 2026-07-29
Scope: isolated `database/canonical-v3-local` and loopback-only private API
Production authority: false

## Outcome

The signed-in upload journey can now create a durable canonical project before
issuing a pre-media upload intent. Browser principals still have no direct
`INSERT`, `UPDATE`, or `DELETE` grant on `public.projects`.

Creation flows through
`reeditpro_create_private_project_v1(text,jsonb)`. The RPC requires:

- an authenticated user JWT;
- current write membership in the exact workspace;
- an exact server-owned loopback HMAC;
- a bounded request schema;
- a tenant-scoped idempotency key and request digest.

The project row and immutable idempotency receipt commit in one database
transaction. Repeating the same request after restarting the API returns the
same project result; reusing the key for a changed request fails closed.

Project reads and lists use the authenticated user JWT against the existing RLS
`SELECT` policy. They are owner- and workspace-filtered by the private API.
Service-role table writes are neither restored nor accepted by the authority.

## Evidence

- `canonical-private-project-authority-local-postgres-smoke.ts` proves exact
  restart replay, authenticated RLS read/list, cross-tenant denial, process
  branding, changed-request conflict, and rejection of an invalid server
  signature.
- `017_canonical_private_project_authority_rpc_postconditions.sql` proves forced
  RLS, no direct table grants, exact RPC role grants, immutable receipt lineage,
  direct browser-write denial, and unsigned-RPC denial.
- The signed-in private API restart verifier creates a new project, creates an
  upload intent and encrypted temporary target, restarts the API, and recovers
  the exact prior target without a second issuance.
- Canonical V3 backup/restore includes the project idempotency receipt table and
  compares the complete restored state digest.

## Closed boundaries

This is local-only proof. It does not authorize hosted Supabase writes, remote
database mutation, public signup, GCS, Cloud KMS, multi-replica recovery,
provider calls, tools, workers, rendering, credit mutation, public delivery,
external beta, or production.
