# Canonical Storytelling Style Authority Integration — 2026-07-20

## Outcome

Motion Studio Storytelling style planning now has one optional, strict component
inside ReEditPro's existing canonical edit-plan authority:

`motionStudioStorytellingStyleAuthority`

The component does not create another plan, estimate, approval, snapshot,
queue, registry, persistence system, or customer-commercial authority. It is
carried by the existing flow:

1. canonical planning draft;
2. private planning handoff;
3. canonical publication and the one presented estimate;
4. the one canonical approval;
5. the immutable approved-snapshot manifest; and
6. the approved execution-authority read.

Ordinary edits omit the component. Required component names remain unchanged,
so existing and historical snapshots without Motion Studio style authority
remain readable.

## Exact authority carried

Schema version `canonical-storytelling-style-authority-v1` binds:

- exact workspace, project, named edit, and Storytelling production identity;
- selected style ID, version, profile digest, and selection digest;
- exact Motion Language reference;
- exact Motion DNA artifact/version/content digest;
- exact Reference Contract artifact versions;
- source-audit digests;
- exact five-scenario calibration plan ID and digest;
- route-policy identity;
- planning-only internal production-cost estimate ID, digest, and range in
  explicit `usd_micros`; and
- the existing Plan Review as the sole approval authority.

The schema requires `runtimeExecutionAuthorized=false`,
`providerExecutionAuthorized=false`, and `productionReady=false`. Internal
production cost explicitly excludes customer price, customer credits, and
ReEditPro service fee.

## Canonical lifecycle behavior

The private handoff and publication hash the entire component. Publication
persists it as a content-addressed private blob. The exact blob reference is
copied into the canonical plan and immutable approved-snapshot manifest, then
reloaded and validated before execution packaging.

A style change changes the component hash and therefore the handoff and plan
identity. Before approval, the ordinary canonical publication transaction
supersedes the prior presented plan and estimate. After approval, publication
without the existing explicit revision authority fails closed; the historical
snapshot remains immutable and readable. A replacement style therefore uses
the same review/revision/new-estimate/new-snapshot cycle as every other
approved-plan change.

Workspace, project, and edit-session scope are checked at handoff,
publication, approval, and approved execution-authority read. Cross-scope
substitution fails before persistence or dispatch authority.

## Motion Studio consumer seam

The browser-safe canonical publication input now accepts the existing
planning-only `StorytellingMotionStylePlanReviewInput` structurally as:

`motionStudioStorytellingStylePlan`

`projectCanonicalStorytellingStyleAuthority(...)` creates the bounded
canonical projection. The canonical planning publication hook preserves that
input across preference-authority revalidation and retry. Motion Studio's
mounted editor should pass its already prepared `planReviewInput` in the
existing `canonicalPlanningPublication.submit(...)` call; it must not construct
another snapshot or approval path.

The current evidence class is
`controlled_local_browser_relayed_server_prepared_content_addressed`, with
`sourceRepositoryReverified=false`. This is sufficient for protected internal
same-source testing, not a production claim. A live release still needs a
same-release server-side Motion authority repository/readback,
deployed tenant isolation, durable database/storage evidence, and release
qualification.

## Verification

- `npm run smoke:canonical-storytelling-style-authority`
- `npm run smoke:edit-planning-authority`
- `npm run typecheck:server`
- `npx tsc -b --pretty false`
- `npm run lint`
- `npm run build`
- `npm run check:frontend-boundary`

The focused smoke covers deterministic projection, exact identity and lineage,
the five-scenario calibration set, internal-cost separation, style-change hash
invalidation, cross-scope rejection, and adversarial field tampering. The full
authority smoke covers handoff, content-addressed persistence, plan/estimate
supersession, approval, snapshot preservation, execution-authority reload, and
the explicit post-approval revision requirement.

No provider call, Secret Manager read, media execution, customer credit
mutation, billing action, Supabase/GCS mutation, render/export, deployment, or
public delivery is performed by this slice.
