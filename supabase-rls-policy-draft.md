# Supabase RLS Policy Draft

## General Rule

Users should access only projects inside workspaces where they are members. Workspace and project membership is the foundation for future row-level security.

These policies are draft guidance only. They must be tested in Supabase before production use.

## Owner And Member Rule

- Workspace owners can manage workspace and project data.
- Workspace members can access project data according to role.
- Viewer, editor, and admin roles should be planned, but this draft does not claim complete production enforcement.
- Project-level access should derive from workspace membership and project ownership.

## Service-Role Worker Rule

Future workers should use service role writes for:

- generated assets
- job steps
- worker events
- QA reports
- final exports
- future credit reservations and ledger entries

Users should not directly write worker-only tables. User-visible actions should go through backend validation and approved snapshot contracts.

## Approved Snapshot Immutability

Approved snapshots should be:

- inserted only by backend/service role after user approval
- readable by authorized project members
- not user-updatable
- not user-deletable
- protected by trigger or policy in a future real migration

Workers execute `approved_plan_snapshots.snapshot_json`, not raw chat and not mutable current plan state.

## Credit Records

Credit estimates can be user-visible because they explain what the user is approving. Future credit reservations and ledger records should be:

- append-only
- service-role written
- not directly user-mutated
- linked to exact plan, estimate, and approved snapshot versions

## Media Privacy

Source media and generated assets should be private by default. Access should use signed URLs or backend-mediated delivery in a future implementation.

Browser capture artifacts may contain sensitive account, app, or website data. They should remain project-scoped and private.

## Audit Events

Audit events should be append-only. Users may read project audit events if policy allows; backend and worker systems write system events.

Audit events should record approval, snapshot, job, export, and security-relevant events without storing provider secrets.

## Draft Limitations

These RLS policies are drafts. Actual policies must be implemented, tested, and reviewed in Supabase before production.

