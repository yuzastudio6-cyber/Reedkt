# Canonical mixed Caption inspection qualification path — 2026-08-06

Milestone: Post-CAP-20 real B-roll approved-run and multi-run integration

Status: `source_complete_waiting_on_fresh_canonical_private_runs`

## Outcome

The accepted real-footage B-roll Caption inspection can now enter the same
canonical approved-run evidence and multi-run qualification path as the
existing uploaded-source inspection lane. The integration is additive:

- the frozen uploaded-source run controller and campaign remain V1;
- `canonical-caption-private-qualification-run-controller-v2` explicitly
  discriminates `uploaded_source` and `broll_owner` inspection lanes;
- `canonical-caption-private-qualification-campaign-controller-v2` admits
  either lane while preserving exact run-request, inspection-request,
  approved-snapshot, output, and catalog lineage; and
- `canonical-caption-private-qualification-composition-v7` mounts both lanes
  against the existing direct-inspection repository, approved-run reader,
  multi-run catalog, and final private qualification service.

The bright color-bar engineering fixture remains structurally ineligible for
professional-appearance evidence. Only the real B-roll owner inspection bundle
can enter the new B-roll lane.

## Files changed

- `src/types/canonical-caption-private-qualification-run-controller-v2.ts`
- `src/types/canonical-caption-private-qualification-campaign-v2.ts`
- `server/services/canonical-caption-broll-owner-inspection-projection-service.ts`
- `server/services/canonical-caption-private-qualification-run-controller-v2.ts`
- `server/services/canonical-caption-private-qualification-campaign-v2-service.ts`
- `server/services/canonical-caption-private-qualification-composition.ts`
- focused and aggregate source smokes
- Caption qualification documentation

## Contracts added or changed

Added:

- `canonical-caption-private-qualification-run-controller-v2`;
- `canonical-caption-private-qualification-run-outcome-v2`;
- `canonical-caption-private-qualification-campaign-controller-v2`;
- `canonical-caption-private-qualification-campaign-outcome-v2`;
- `canonical-caption-private-qualification-composition-v6`; and
- `canonical-caption-private-qualification-composition-v7`.

The B-roll projection service now exposes a closed outcome parser and nominal
service admission. Its existing V1 wire shape is unchanged. Existing V1
uploaded-source controller, campaign, and composition identities are not cast,
relabeled, or silently widened.

## Existing owners reused

- B-roll remains the owner of selected media, crop, timing, occupancy, and
  visible-text evidence.
- The canonical backend remains the approved-snapshot, execution-package,
  work-graph, asset-manifest, estimate, cost, and source-manifest owner.
- Caption's existing direct visual-inspection repository remains the sole
  Caption professional-appearance evidence store.
- The existing approved-run evidence reader remains responsible for rereading
  deterministic QA, qualified shared postrender review, independent final QA,
  private review, work, artifact, and owner evidence.
- The existing multi-run catalog and private qualification service remain the
  only terminal Caption qualification owners.

## Duplicate owners avoided

No B-roll selector, media locator, renderer, timeline, source reader, work
graph, asset store, QA approval service, scheduler, Orchestra, provider
dispatcher, billing path, or delivery owner was added. The V2 controller
delegates uploaded-source work to the frozen V1 controller and invokes the
existing B-roll projection adapter only for its explicit lane.

## Tests run

- focused B-roll projection and V2 approved-run controller smoke;
- V2 multi-run campaign smoke;
- V7 qualification composition smoke;
- server TypeScript check;
- focused ESLint and Git diff validation;
- complete Caption source-integration aggregate;
- repository-wide lint, production build, frontend/server boundary, and
  current/history secret scans.

## Tests passed

The focused B-roll proof covers create-only replay, twice-reread owner and
approved-run authority, canonical direct-inspection projection, V2 approved-run
waiting behavior, output-crossing refusal, false-persistence refusal, and
counterfeit service refusal. The campaign proof covers deterministic replay,
multiple-snapshot enforcement, inspection-lane/request-version binding,
counterfeit controller refusal, and no incomplete catalog promotion.

## Tests failed

None after source repair.

## Media inspected

No new media was produced by this source-only milestone. It consumes the
previously accepted real B-roll inspection receipt covering all 72 frames in
both full and reduced motion, 14 original-resolution spot checks, and retained
rejected face-obstruction evidence. It does not consume the synthetic
color-bar fixture as appearance evidence.

## Visible defects

No new visual claim was made. The previously rejected B-roll attempt placed
hero typography over the speaker's face; that rejected evidence remains
version-separated from the repaired accepted render.

## Repairs made

- made B-roll projection outcomes closed and independently parseable;
- added explicit inspection-lane discrimination instead of overloading V1;
- bound campaign lane identity to the exact versioned inspection request;
- required exact qualification-request, approved-snapshot, package, and output
  identity before controller or campaign admission; and
- mounted B-roll evidence into the existing run/catalog pipeline instead of
  leaving it as a standalone progress receipt.

## Known limitations

This milestone provides the source-level canonical path. No fresh canonical
approved run currently contains every required work, owner, render, direct
inspection, qualified shared visual-review, independent final-QA, and private
review artifact. Therefore no job or terminal qualification status changes.

## Scoped blockers

Terminal private qualification still requires several genuine approved Caption
runs whose combined catalog covers all 41 supported job types and all nine
terminal evidence groups. External provider and production deployment are not
required for the private-internal target, but qualified owner results and
independent QA evidence must be real rather than synthesized.

## Safe work completed

The real B-roll professional-appearance evidence now has a versioned,
create-only, replay-safe route through approved-run reconciliation and the
mixed-lane multi-run campaign, with every external authority remaining false.

## Next milestone

Produce or reread the next real canonical approved Caption run, resolve its
remaining owner and QA evidence, persist the run record, and continue building
the exact multi-run 41-job catalog. Do not promote technical fixture images or
planning-only receipts into professional or terminal evidence.
