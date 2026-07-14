# Canonical Revision Plan Browser Continuation

Status: `implemented_local_private_exact_bounded_only`

## Purpose

This slice connects one persisted canonical private-review revision decision to
the next immutable canonical plan version in the signed-in named-edit browser.
It keeps the prior approved snapshot, private review, and locked Edit
Preferences as immutable history while requiring a fresh estimate and a fresh
approval for the replacement plan.

It does not make rich-plan compilation, public delivery, provider execution,
customer billing, distributed workers, external beta, or production ready.

## Exact flow

1. The user records a structured revision against the exact private review.
2. Journey recovery returns `revision_requested` with a bounded, hash-bound
   private-history descriptor.
3. Chat retains the revision direction as the next planning instruction and
   removes stale Plan Review and Private Review surfaces.
4. The browser rebuilds an exactly representable plan candidate using the
   unchanged locked source, output-frame, Edit Brief, and Edit Preference
   evidence.
5. The browser submits that candidate to:

   `POST /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-revision-plan-presentations`

6. The backend reloads the exact completed revision decision and injects its
   revision authority server-side.
7. The backend creates or reuses a content-addressed planning handoff and
   presents only the next immutable plan version with a fresh estimate.
8. Journey recovery advances to `plan_approval_required`.
9. The user must approve the exact replacement plan version, plan hash,
   estimate identity, estimate hash, and visible maximum credits through the
   separate canonical approval coordinator.
10. Approval creates the local/private immutable snapshot and synthetic test
    reservation but starts no package, work graph, tool, provider, render,
    billing, or delivery action.

## Browser boundary

The browser may send only:

- workspace, project, and edit-session scope;
- expected execution-package and review-assembly identities;
- expected decision-manifest and final-artifact hashes;
- ordered source identities and checksums;
- the newly compiled canonical plan candidate; and
- an idempotency key.

The browser cannot supply the revision request identity, review decision
identity, prior approved snapshot identity, prior approved plan identity,
revision-intent hash, jobs, tools, commands, filesystem paths, storage paths,
credentials, provider inputs, prices, wallet actions, or delivery authority.
The request schema explicitly rejects caller-injected `revisionIntentHash`,
`priorApprovedSnapshotId`, and `reviewDecisionId` fields.

The browser strictly parses the bounded response. It requires plan version
`prior + 1`, the exact review assembly, fresh-estimate and fresh-approval flags,
immutable prior-authority evidence, unchanged locked preference evidence, and
false execution/billing/delivery boundaries. Unknown fields, private material,
foreign identity, stale version lineage, or elevated authority fail closed.

## Backend authority

The coordinator serializes presentation per workspace/project/edit/review
scope and revalidates:

- the exact completed `request_revision` decision;
- execution package, review assembly, decision manifest, and final artifact;
- prior approved plan and immutable snapshot lineage;
- the required next plan version;
- unchanged locked Exact Edit Preference authority before and after
  presentation; and
- unchanged private-review decision authority before returning.

Exact replay returns the already presented plan rather than creating another
version. A competing, stale, foreign, or structurally changed request fails
closed.

## Product and UX behavior

The revision direction returns to Chat as the active planning instruction. The
previous review is labeled as context only. Stale approval and review surfaces
are removed, Current Edit Preferences remain read-only, and the replacement
plan shows a separate loading state before a new Plan Review becomes
actionable. The approval control remains disabled until recovered backend
journey authority exactly matches the newly presented plan and visible credit
maximum.

Changing locked Edit Preferences is intentionally outside this bounded path.
That requires a separately authorized structural replan rather than silently
rewriting evidence frozen by the prior approval.

## Readiness boundary

This is local/private, single-host evidence for an exactly representable
source-and-caption revision. It proves neither arbitrary rich-plan revisions
nor deployed real-user behavior. Supabase, Google Cloud workers, providers,
customer wallet mutation, Stripe, public export, production rendering,
deployment, Motion Studio, and MS-001 remain unchanged and gated.

## Verification

- `npm run smoke:canonical-planning-publication-client`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npx playwright test --config=playwright.canonical-journey.config.ts -g "presents revision plan v2"`
- `npx playwright test --config=playwright.canonical-journey.config.ts -g "plays the exact private review"`
- `npx tsc --noEmit`
- `npm run typecheck:server`
- `npm run lint`
- `npm run check:frontend-boundary`
