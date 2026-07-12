# Canonical Private Job Execution Adapter

Status: private single-host internal-test evidence

The canonical private job execution adapter connects one immutable derived job to its exact backend runner without accepting caller-authored execution authority.

## Route

`POST /v1/edit-executions/jobs/:jobId/private-internal-execution`

The route requires authenticated workspace access, the internal-service boundary, and an `Idempotency-Key`. Its strict body contains only:

- `workspaceId`
- `projectId`
- `editSessionId`
- `purpose: execute_canonical_private_job`

The caller cannot provide an approved snapshot, reservation, tool, operation, output, lease, dispatch credential, artifact path, URL, command, environment, provider, cost, customer price, customer credit, or billing instruction.

## Server-owned execution chain

The service reloads canonical readiness and immutable approved authority, requires exactly one expected output, and then:

1. derives the approved work item and output from the canonical job;
2. claims an opaque lease under the active funded reservation;
3. derives the exact proven tool identity, operation, and runner class;
4. issues and consumes one short-lived, single-use dispatch grant;
5. executes the existing canonical coordinator;
6. requires a private create-only artifact, passed QA, reconciliation, and downstream dependency eligibility;
7. stores a credential-free, checksum-protected idempotent adapter response.

The tool-free `validate_approved_snapshot` job and dependency-bound `prepare_source_trim` plan-validation job use canonical internal runners. Source-trim validation requires exact approved source IDs, explicit cleanup decisions, meaning-preservation status, resolved user review, a passed upstream dependency, and a private JSON QA/reconciliation artifact. Tool jobs must name exactly one approved identity that is `canonical_e2e_verified` in the proven tool catalog. Multi-tool and multi-output jobs fail closed.

## Runner coverage

The adapter dispatch table covers all 15 proven runner classes used by the 50 canonical private E2E identities: Node, Sharp, Python, media binaries, Remotion, libass, browser graphics, bounded AI-capability fixtures, native image, native audio, container/package validation, VapourSynth, AudioFlux, rembg, and DeepFilterNet.

Executable adapter evidence currently proves:

- authenticated HTTP execution and HTTP idempotency replay for the tool-free canonical authority job;
- service execution of ECharts with server-derived tool/operation/output identity;
- single-use dispatch consumption, private SVG persistence, QA, reconciliation, durable adapter replay, idempotency conflict, and downstream dependency readback;
- the independent canonical coordinator lifecycle for all 50 tool identities through `npm run smoke:canonical-private-tool-dispatch`.

## Boundaries

This adapter is not a whole-work-graph scheduler. It does not select the next dependency-ready job, assemble terminal private review, recover a complete journey, execute providers, write Supabase, deploy workers, publish artifacts, settle customer credits, charge a wallet, bill a customer, or authorize production rendering.

All responses keep product, external-beta, and production readiness false. A canonical work-graph orchestrator now consumes this adapter; the next gate is completing every required job capability and terminal private-review handoff.

## Verification

- `npm run typecheck:server`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
