# Canonical Tool Execution Authority

Status: authenticated local/private backend authority and complete 50-tool
fixture evidence

ReEditPro keeps tool planning, proof-catalog readiness, plan approval, and job
execution as separate authority layers. A tool name in the registry or planner
does not by itself authorize a call. Canonical plan publication now creates a
server-authored tool execution authority manifest after grouped work-item
compilation and before plan hashing.

## Authority source

The manifest is derived only from:

- the canonical plan's tool-strategy declaration;
- the compiled canonical work graph;
- exact `approvedToolOperationIds` on those work items; and
- `server/tool-execution/proven-tool-identity-catalog.ts`.

It does not trust caller-supplied readiness flags, runner names, proof hashes,
package versions, or product-readiness claims.

For every work-graph tool, the manifest freezes:

- stable identity such as `reeditpro.tool.ffmpeg.v1`;
- canonical tool and exact operation ID;
- operation-spec, identity, and proof hashes;
- evidence revision and verification state;
- pinned runtime/package identity;
- canonical lifecycle and job-adapter evidence keys;
- linked canonical work items and expected outputs; and
- separate private-internal, product, beta, and production readiness flags.

## Publication and approval gates

Publication fails unless every work-graph tool is declared by
`toolStrategyPlan.toolIds` or the richer `toolStrategyPlan.toolIdsUsed` field.
When `exactOperationIds` is present, it must include every work-graph operation,
and every declared operation must belong to a declared canonical tool.

A required tool-backed work item fails closed unless its proof-catalog record
has both:

- `privateInternalEndToEndReady`; and
- `privateInternalJobAdapterReady`.

Optional future work may remain visible without being promoted, but it does not
count as proven required work and cannot be dispatched as if it had completed
evidence. Unknown tools, mismatched operations, policy-blocked tools, and
required tools without complete evidence cannot enter approvable authority.

The manifest is content-addressed and included in the plan's component
references, so its blob reference becomes part of the plan hash. Approval
reloads and revalidates it before synthetic reservation or snapshot creation.
The approved snapshot carries the exact same reference. Execution packaging
reloads it again, verifies its own hash, reconstructs the work-graph mapping,
checks current stable identities, and confirms required private readiness has
not regressed.

The sibling `canonical-tool-payload-authority-v1` closes the next authority
boundary. It runs every exact runner protocol against the compiled structured
payload, source/cleanup/dependency binding, and proven output content type before
approval. It is independently content-addressed, revalidated from approved work
items during packaging, and reused by dispatch so plan-time and dispatch-time
payload rules cannot drift. See `docs/canonical-tool-payload-authority.md`.

Evidence/proof revisions may improve without silently changing an approved
snapshot. Stable tool identity, operation specification, runtime, work-item,
and output lineage must still agree.

## Complete fixture evidence

The canonical private lifecycle fixture declares all 50 exact E2E-verified
tool identities. Before approval it proves all 50 are represented by
server-authored stable identities, operation IDs, identity hashes, proof hashes,
private lifecycle/job-adapter readiness, and runner-valid payload authority
across all 19 validator families. The fixture then executes its
existing confined tool cases through snapshot, reservation, lease, one-use
dispatch, private persistence, QA, reconciliation, replay, and downstream
verification.

The focused authority smoke also proves:

- reconciliation never mutates a hash-bound publication request;
- undeclared work-item tools are rejected;
- missing exact-operation declarations are rejected;
- a required `sam2` work item is rejected because its exact private lifecycle
  and job-adapter evidence are not complete; and
- manifest tampering is rejected before execution packaging.

## Boundaries

This authority makes the 50 catalog identities honest and machine-readable for
authenticated local/private canonical execution. It does not make any tool
product-, external-beta-, staging-, or production-ready. It does not activate
providers, distributed workers, Supabase, customer billing, wallet settlement,
public rendering, export delivery, frontend execution, or deployment.

The older approved tool-work manifest and the canonical package authorization
manifest serve different stages. This plan-time authority proves which exact
catalog identities may enter an approvable canonical graph. Downstream package,
lease, dispatch, artifact, QA, reconciliation, and replay authorities still
remain mandatory.

## Verification

- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
- `npm run typecheck:server`
- `npm run lint`
- `npm run check:frontend-boundary`
- `npm run qa:internal-pipeline`
