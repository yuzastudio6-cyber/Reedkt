# Canonical Edit Reference Mounted Long-Form Runtime Port Verification

Date: 2026-07-21

## Outcome

The existing Edit Reference long-form runtime port now survives the real API
construction path:

```text
ReeditProApiAppOptions
→ RuntimeState
→ ServiceContext
→ createEditReferenceService
→ long-form start/status/control/review routes
→ createEditReferenceTargetVideoUnderstandingService
→ exact-target study start/read routes
```

Before this change, the port could be supplied only through the service's
test-oriented runtime-options argument. The mounted HTTP routes silently built
their own local runtime in protected local mode and always received the blocked
runtime in hosted mode, even when the server bootstrap held an explicit port.
The exact-target understanding service also constructed a separate local
long-form repository and scheduler instead of selecting this authority.

## Authority rules

- The port is injected only by server bootstrap; no request body, query,
  browser header, or frontend contract can select it.
- Runtime options and `ServiceContext` cannot name two different long-form
  authorities in either service. A conflicting pair fails closed.
- Exact-target understanding now performs its create/read/output/schedule work
  through the same selected runtime. It cannot silently create a second
  repository or scheduler.
- Protected local/mock rules remain unchanged.
- Hosted absence remains blocked by `durable_long_form_study`.
- Caller-shaped production booleans still cannot qualify a runtime.
- No adapter, database, worker, provider, private-object reader, billing path,
  or production factory is promoted by this mount.

## Mounted proof

`server/smoke/edit-reference-mounted-long-form-runtime-port-smoke.ts` injects
an intentionally invalid local authority through `createReeditProApiApp`. It
then calls the mounted status, review, start, and control routes. Every route
observes that exact injected authority and fails with
`local_runtime_port_authority_invalid` before repository access or any runtime
method can execute.

The same proof calls the mounted exact-target study read route. That route
selects the identical server-owned authority and fails at the same boundary,
before target-package, Edit Reference, source-inspection, or scheduler work can
begin. Five mounted route classes are covered in total.

This proves that the real route construction consumes the server-owned port;
it does not claim that a production-qualified port exists.

## Remaining closed gates

Production readiness remains false. A future release still needs one reviewed
live factory that composes the canonical V6 domain repository, distributed
pre-plan transaction/lease state, authenticated workers, private-object reads,
attempt cost evidence, multi-replica recovery, and same-release qualification.

No SQL or migration ran. No Supabase, provider, worker, cloud, billing,
deployment, render, export, or public-delivery action occurred.
