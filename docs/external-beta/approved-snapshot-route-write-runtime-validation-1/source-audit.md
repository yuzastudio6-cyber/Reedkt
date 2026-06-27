# RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1 Source Audit

Decision: `completed_approved_snapshot_route_write_runtime_validation`

Execution: `completed_guarded_in_process_approved_snapshot_route_write_readback_and_cleanup`

Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Source Chain

- #1107: main Reeditpro Supabase migration sync source.
- #1113: service-role/public grant boundary source.
- #1116: approved snapshot persistence guarded remote write/readback source.
- #1118: credit reservation ledger guarded remote write/readback source.
- #1123: job queue lease/event guarded remote write/readback source.
- #1128: private artifact storage/access guarded remote write/readback source.
- #1132: service-role storage object metadata read route runtime validation source.
- PR #577 remains open/draft/blocked and excluded.

The historical isolated Supabase project `fajinbvwhcjnutkaumkm` remains historical/context-only and is not used as the ReeditPro target.

## Route Contract Closure

This packet validates the approved snapshot create route through the in-process backend app:

- Route: `POST /v1/edit-plans/:editPlanId/approved-snapshots`
- App factory: `createReeditProApiApp`
- Middleware: `requestIdMiddleware`, `requireAuth`, `requireIdempotency`, `errorHandlerMiddleware`
- Service: `createApprovedSnapshotService`
- Admin client: `supabase_service_role_client_from_ephemeral_process_env`

The repair also records two route-contract fixes discovered during validation:

- `editPlanVersionId` is now accepted by the approved snapshot create route and written to `approved_plan_snapshots.edit_plan_version_id`.
- `editSessionId` is now accepted separately from `chatSessionId` and written to `approved_plan_snapshots.edit_session_id`.

The validation auth override is restricted to `API_ALLOW_MOCK_WITHOUT_SUPABASE=true` and a UUID supplied through `REEDITPRO_ROUTE_VALIDATION_AUTH_USER_ID`. It is only used by guarded in-process validation harnesses and does not expose service-role credentials to frontend code.

The validation-only ephemeral cleanup path is restricted to `NODE_ENV=test`, `REEDITPRO_ROUTE_VALIDATION_EPHEMERAL_APPROVED_SNAPSHOT=true`, and `snapshotJson.validationEphemeralApprovedSnapshotRouteWrite === true`. Immutable approved snapshot behavior remains source-of-truth from `RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1`.
