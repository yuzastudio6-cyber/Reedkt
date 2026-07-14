# Canonical Private Review Decision

Status: private single-host review-decision, browser coordinator, and revision-handoff evidence

The canonical private-review decision service records one exact user decision against a completed canonical private-review assembly. It preserves the approved snapshot and review manifest and does not reinterpret raw chat, mutate the approved plan, or start a revision.

## Internal decision route

`POST /v1/edit-executions/private-review-assemblies/:reviewAssemblyId/decisions`

The route requires authenticated workspace access, the internal-service boundary, and an `Idempotency-Key`. The strict request binds:

- the workspace and canonical execution package;
- the expected private-review manifest SHA-256;
- the expected final MP4 SHA-256;
- one decision: private-internal acceptance or revision request;
- for a revision, bounded structured revision intent, change categories, preservation rules, and explicit fresh-planning/approval requirements.

The caller cannot provide an artifact ID, path, URL, snapshot, plan version, lease, job, tool, provider, price, credit, reservation action, render action, or delivery authority.

## Browser-safe local/private routes

The named-edit browser uses two narrower routes only when the explicit reviewed local/private runtime is enabled:

- `GET /v1/edit-executions/private-review-assemblies/:reviewAssemblyId/media`
- `POST /v1/edit-executions/private-review-assemblies/:reviewAssemblyId/canonical-decision`

Both require the normal authenticated workspace boundary and are unmounted in production and non-local cloud modes. They do not require or expose the internal-service credential.

The media request supplies only the workspace/project/edit/package identities and the exact review-manifest and final-artifact hashes recovered from the canonical journey. The backend re-derives the private artifact and final-QA lineage, returns a private no-store MP4 response, and binds response headers to the exact assembly and hashes. The browser rejects an unexpected content type, cache policy, assembly, manifest, byte length, or SHA-256 before creating an in-memory playback URL.

The decision coordinator accepts either exact acceptance or a bounded structured revision. It reuses the internal durable decision service after independently matching the exact workspace/project/edit/package/review and both hashes, then returns a strict receipt containing only the decision outcome and false authority boundaries. Artifact IDs, job/tool details, paths, credentials, providers, public delivery, production render, billing, wallet, reservation, settlement, and deployment authority are not returned.

## Server-owned decision chain

Before recording a decision, the service:

1. authorizes the actor for the workspace;
2. reopens the completed canonical assembly and verifies its create-only manifest checksum;
3. matches the route assembly identity, package identity, expected manifest hash, and exact final-artifact hash;
4. reloads the immutable approved snapshot and verifies workspace, project, edit-session, and snapshot lineage;
5. rejects secret-like revision intent;
6. persists one credential-free, create-only decision manifest per review assembly;
7. verifies that manifest again on every idempotent replay.

A different second decision for the same assembly fails closed. The current v1 contract intentionally does not implement cancellation or replacement of a recorded decision.

## Revision handoff

A revision request records:

- the prior approved plan and version;
- the minimum next plan version;
- a SHA-256 of the structured revision intent;
- required replanning;
- required fresh estimate and approval;
- `replacementPlanPublished: false`;
- `revisionExecutionStarted: false`.

The prior approved snapshot, plan components, estimate, reservation, jobs, artifacts, QA, and review manifest remain unchanged. This handoff is evidence that a revision was requested. The canonical planning authority can now consume it exactly once to publish plan v2 and a fresh estimate; the decision route itself still does not publish, approve, execute, or render the revision.

## Current executable evidence

The canonical dispatch smoke records a revision against the real bounded five-job private-review fixture and proves:

- caller artifact injection is rejected;
- stale/mismatched review-manifest authority is rejected;
- the decision is bound to the exact final artifact and approved snapshot;
- replay returns the same decision and manifest;
- a conflicting second decision is rejected;
- the canonical snapshot/plan/estimate/reservation/work-item/job/package slice remains hash-identical.

The snapshot-v2 lifecycle also records a successful private-internal acceptance against the second review, proves that it contains no revision handoff, and replays the same create-only decision while public delivery remains blocked.

The browser-focused smoke and Playwright journey additionally prove current-review byte integrity, bearer-only browser authentication, deterministic decision idempotency, structured revision preservation rules, a fresh-plan/estimate/approval requirement, and history reopening from the exact decision-manifest descriptor.

## Boundaries

Both decision outcomes keep public export, product, external-beta, production, provider, public artifact, delivery, further render, revision execution, replacement-plan publication, customer price/credit mutation, wallet, reservation, settlement, billing, and deployment authority false.

Replacement-plan compilation with a fresh estimate is now proven. The next revision gate is fresh approval with explicit synthetic reservation reconciliation. Private-internal acceptance still does not authorize public delivery.

## Verification

- `npm run typecheck:server`
- `npm run lint`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:canonical-private-review-client`
- `npm run smoke:edit-execution-security-boundary`
- `npm run qa:canonical-journey-ui`
- `npm run smoke:proven-tool-identities`
- `npm run qa:internal-pipeline`
- `npm run check:frontend-boundary`
