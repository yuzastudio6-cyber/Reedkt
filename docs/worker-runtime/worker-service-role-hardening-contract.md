# Worker Service-Role Hardening Contract

Status: `ready_for_worker_2_dry_run_fixture_plan`.

WORKER-1 records a server-only service-role boundary. It does not access Supabase, run SQL, call Supabase CLI, or mutate data.

## Boundary Requirements

- Service-role use is allowed only inside future approved scoped operations.
- Service-role material must never be browser-visible or logged.
- Workspace, project, user, plan snapshot, and artifact scope must be validated before any future service-role operation.
- No broad service-role endpoint is allowed.
- No route may accept arbitrary raw prompt, signed URL, private URL, or public artifact delivery request as source of truth.
- Logs must redact provider keys, service-role markers, database URLs, signed URL fragments, raw provider responses, and Secret Manager payloads.

## Supabase/RLS Assumptions

- Supabase remains `docs/status only` and `docs_only` in WORKER-1.
- Supabase environment touched: `none`.
- SQL executed: `none`.
- Migration deployed: `no`.
- Future exposed-schema tables must preserve explicit RLS and role-scoped thinking for `anon`, `authenticated`, and `service_role`.
- Future service-role operations must remain backend-only and narrow to approved snapshot/job/artifact scope.

## Required Defaults

```json
{
  "supabaseMutationApprovedNow": false,
  "workerExecutionApprovedNow": false,
  "routeExecutionApprovedNow": false,
  "publicArtifactsApproved": false,
  "signedUrlsApproved": false,
  "productionApproved": false
}
```
