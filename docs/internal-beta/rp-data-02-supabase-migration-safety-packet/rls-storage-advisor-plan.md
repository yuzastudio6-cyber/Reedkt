# RP-DATA-02 RLS Storage Advisor Plan

Decision: `completed_migration_safety_packet_ready_for_static_migration_draft`

RLS advisor plan status: `planned_not_run`

Storage advisor plan status: `planned_not_run`

## RLS Review Requirements

- Every table in an exposed schema must have RLS enabled before broad role grants.
- Policies must combine `TO authenticated` with workspace/project membership predicates.
- Policies must not rely on user-editable metadata.
- UPDATE policies must include both `USING` and `WITH CHECK` predicates.
- Direct user writes are not allowed for approved snapshots, credit reservations, ledger rows, worker events, artifact manifests, QA reports, or final export state.
- Backend/service-role writes must map to named operations and audit events.
- Any view that is exposed must be reviewed for RLS behavior and security invoker posture.
- Any function must be reviewed for `SECURITY DEFINER`, search path, and public execute exposure.

## Storage Review Requirements

Private buckets remain the default:

| Bucket | Access model | Safety status |
| --- | --- | --- |
| `source-media` | private upload/read through approved app paths | `planned_not_created` |
| `generated-assets` | private worker-write and scoped readback | `planned_not_created` |
| `processed-media` | private worker-write and scoped readback | `planned_not_created` |
| `previews` | private preview artifact access only | `planned_not_created` |
| `exports` | private export artifact access only | `planned_not_created` |
| `thumbnails` | private generated thumbnail access only | `planned_not_created` |
| `qa-artifacts` | private QA artifact access only | `planned_not_created` |
| `worker-temp` | private short-retention worker scratch space | `planned_not_created` |

Storage policies in a future migration must distinguish user uploads, worker writes, project-member reads, cleanup, and retention. Signed URLs may be transient access mechanisms only after approval; they must not become durable source-of-truth records.

## Advisor Gate

After a future static migration draft exists, and before any guarded environment execution, the migration must have an advisor plan that records:

- Supabase advisor command or MCP advisor path to use;
- expected advisory categories;
- how warnings are triaged;
- whether any warning blocks internal beta;
- evidence path for advisor output.

Advisors were not run in this phase because no migration was created and no Supabase environment was touched.
