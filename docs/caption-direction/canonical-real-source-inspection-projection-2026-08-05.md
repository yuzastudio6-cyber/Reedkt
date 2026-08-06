# Canonical real-source inspection projection — 2026-08-05

Milestone: Post-CAP-20 canonical evidence integration

Status: `source_complete_waiting_on_fresh_approved_run_receipts`

## Outcome

Caption's two persisted real-source inspection formats now have one explicit
projection into `canonical-caption-direct-visual-inspection-evidence-v1`:

- `caption-real-source-complete-time-direct-inspection-v1` for the 9:16
  full/reduced pair; and
- `caption-real-source-multi-output-direct-inspection-v1` for the 16:9 and 1:1
  full/reduced set.

The projection covers all six output variants separately. It does not treat the
synthetic color-bar engineering render as professional-appearance evidence and
does not cast a historical inspection receipt into terminal qualification.

Before creating evidence, the service rereads the Caption-owned inspection
bundle twice and independently rereads the canonical approved-run authority
twice. That authority binds the immutable approved snapshot, execution package,
output, confirmed frame, rendered artifact, deterministic QA, exact original
source, approved source-manifest authority, and every source binding. Changed,
crossed, missing, unsorted, duplicate, caller-shaped, or forged authority fails
closed.

The existing canonical qualification reader remains the final defense-in-depth
consumer and rereads the same approved execution and source authority before an
approved-run evidence record can exist.

## Files changed

- `src/types/canonical-caption-real-source-inspection-projection.ts`
- `server/services/canonical-caption-real-source-inspection-projection-service.ts`
- `server/smoke/canonical-caption-real-source-inspection-projection-service-smoke.ts`
- `server/smoke/captions-specialist-source-integration-aggregate-smoke.ts`
- `package.json`
- Caption integration documentation

## Contracts added

- `canonical-caption-real-source-inspection-projection-request-v1`
- `canonical-caption-real-source-inspection-bundle-read-port-v1`
- `canonical-caption-real-source-inspection-authority-v1`
- `canonical-caption-real-source-inspection-authority-read-port-v1`
- `canonical-caption-real-source-inspection-projection-service-v1`

## Existing owners reused

- Caption-owned closed real-source inspection receipts and review specs;
- canonical approved snapshot and execution-package authority;
- canonical approved source-manifest and source-binding authority;
- canonical Caption direct visual-inspection evidence repository; and
- canonical approved-run qualification reader.

## Duplicate owners avoided

No renderer, source reader, approval owner, work scheduler, final-QA owner,
provider dispatcher, asset writer, billing path, delivery path, or central
Orchestra was added. The authority read port is an adapter over the existing
canonical backend owner, not a competing source or approval authority.

## Tests run

- focused six-variant projection smoke;
- server typecheck;
- targeted ESLint;
- full Caption source integration aggregate;
- full repository lint, build, frontend boundary, and current/history secret
  checks before publication.

## Focused evidence

The source-contract smoke projects:

- 9:16 full motion;
- 9:16 reduced motion;
- 16:9 full motion;
- 16:9 reduced motion;
- 1:1 full motion; and
- 1:1 reduced motion.

It checks exact per-variant contact-sheet and original-resolution coverage,
create-only persistence and replay, exact receipt/source authority lineage,
stale digest, crossed kind/source/output, changed rereads, unadmitted ports,
unsafe fields, and unsorted source bindings. The fixture is explicitly a source
contract fixture; it is not inserted into the actual qualification catalog.

## Media inspected

None in this source-only slice. It consumes the shape of previously inspected
real-source receipts but does not replay or relabel their historical pixels.
A fresh canonical approved run must produce the exact persisted receipt and
approved authority before this projection can create real catalog evidence.

## Visible defects

Not applicable. No new image or video was generated.

## Repairs made

The first draft accepted source-authority references in the projection request
and deferred their verification to the later qualification reader. That was
repaired before publication. The final service derives canonical source and
execution lineage only from an admitted, twice-reread approved-run authority
port and retains the downstream reader revalidation as defense in depth.

## Known limitations and scoped blockers

- No fresh canonical approved Caption run has persisted one of these projected
  records yet.
- No actual multi-run 41-job qualification catalog is persisted.
- Qualified shared postrender review and independent final QA remain separate
  evidence requirements.
- Current truthful status remains 0/41 terminally qualified jobs and 0/9
  terminal gates satisfied by one exact canonical catalog.

## Safe work completed

The previously disconnected Caption inspection receipts can now enter the
canonical one-writer evidence lane without accepting caller-shaped approval or
source authority and without promoting synthetic engineering media.

## Next milestone

Mount the bundle reader and approved-run authority adapter in the canonical
private Caption composition, then run representative approved edits that
persist their exact real-source inspection evidence and the remaining owner/QA
evidence into the multi-run catalog.
