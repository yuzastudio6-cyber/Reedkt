# Canonical Edit Reference Long-Form Runtime Port Verification

Date: 2026-07-20

## Outcome

The Edit Reference service now resolves all long-form study persistence, control,
review-output reads, semantic-checkpoint reads, and scheduling through one
server-only runtime port.

This is a fail-closed integration boundary. It does not make the durable study
production-ready and it does not implement a second production repository,
queue, lease system, scheduler, or cost engine.

## Authority boundary

The port is fixed to:

- schema `edit-reference-production-long-form-runtime-port-v1`;
- persistence contract `edit-reference-production-persistence-contract-v5`;
- authority class `pre_plan_edit_reference_long_form_study`;
- no fabricated approved edit plan, snapshot, or credit reservation;
- no browser claim or browser-session completion dependency;
- no customer price, customer credit, or service-fee authority;
- a required future canonical worker spine rather than a feature-owned
  production queue.

Protected local/mock execution keeps the existing private segmented repository
and in-process scheduler behind this port. Its evidence class remains
`backend_local_private_only`; all production adapter, multi-replica lease,
authenticated worker dispatch, and live private-object flags remain false.

Any hosted runtime without a qualified canonical port receives
`JOB_DEPENDENCY_NOT_READY`, reason
`canonical_production_long_form_runtime_missing`, and the exact
`durable_long_form_study` readiness-v2 assertions. It cannot fall back to the
local repository or scheduler.

## Anti-promotion controls

- A runtime port cannot be combined with legacy local adapter injection.
- Hosted execution rejects legacy local repository or scheduler injection.
- A caller-created object cannot promote itself by setting production booleans.
- The source build exports no live production factory or qualification path.
- Protected local/mock adapters cannot claim live database, multi-replica,
  authenticated dispatch, or private-object verification.
- Every fixed safety field is checked as an exact boolean at runtime.

The future live factory must be added at this canonical module only after the
same-release repository transaction, worker lease/recovery, authenticated
dispatch, private-object read, cost, security, and release evidence exists.

## Service wiring

`server/services/edit-reference-service.ts` now uses the port for:

- create/read of a retained long-form plan and run;
- pause, resume, cancel, and recover control commands;
- scheduling or rescheduling work;
- private work-output reads used by review-package construction;
- semantic-window checkpoint reads used by complete-study review.

Source inspection remains a separate exact-media boundary. In hosted mode the
blocked port is reached before source inspection, long-form run creation, or
work scheduling can occur.

## Verification

The bounded verification set includes:

```text
npx tsx server/smoke/edit-reference-production-long-form-runtime-port-smoke.ts
npx tsx server/smoke/edit-reference-long-form-study-route-smoke.ts
npx tsx server/smoke/edit-reference-long-form-review-service-smoke.ts
npx tsx server/smoke/edit-reference-production-long-form-persistence-contract-smoke.ts
npx tsx server/smoke/edit-reference-production-readiness-smoke.ts
npm run typecheck:server
```

The dedicated port smoke proves local/mock compatibility, exact safety flags,
hosted failure without a canonical port, rejection of legacy hosted adapters,
rejection of mixed authorities, and rejection of forged production authority.

The existing route and review smokes prove that protected internal behavior
still retains exact private-source binding, durable controls and replay,
checkpoint recovery, complete review evidence, tenant isolation, and no silent
Preference DNA/application, plan, estimate, provider, or customer-credit
effects.

## Remaining closed gates

Production readiness remains false. Still required are:

- one live tenant-isolated repository/transaction adapter for all v5 record
  families;
- serializable one-active-lease claim and multi-replica recovery evidence;
- authenticated canonical worker dispatch and restart continuation;
- create-only private-object read/write and checksum readback;
- study-usage approval, maximum internal-cost authority, immutable rate cards,
  and attempt-level provider/infrastructure cost evidence;
- same-release multi-hour whole-source coverage and failure/recovery evidence;
- approved Supabase migration/RLS/storage reconciliation and deployed
  same-source acceptance.

No provider request, Secret Manager payload read, Supabase/cloud mutation,
billing, customer price/credit mutation, deployment, render, export, or public
delivery was authorized or performed by this slice.
