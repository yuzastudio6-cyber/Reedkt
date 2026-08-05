# Current Caption Integration Readiness

Milestone: `POST-CAP-20-CURRENT-INTEGRATION-READINESS`

Status:
`source_integration_complete_waiting_on_private_runtime_evidence`

Target: `caption_specialist_private_internal_qualified`

## Outcome

The additive `caption-current-integration-readiness-v2` record provides the
current Caption truth without rewriting the frozen CAP-20 audit or the earlier
V1 pre-mount checkpoint.

All five shared-owner Caption boundaries are now source-mounted:

1. canonical transcript authenticated-read admission;
2. Visual Intelligence authenticated evidence admission;
3. Track All/SAM 3.1 authenticated evidence admission;
4. SoundSync typed request/result admission and silent fallback;
5. B-roll owner request/result admission.

The canonical transcript is mounted in the private Caption runner. Visual
Intelligence, Track All/SAM 3.1, SoundSync, and B-roll now persist their exact
owner evidence, project it through the one-writer resume ledger, reread it, and
resume the same Caption job. The focused Visual Intelligence and Track All
positive paths now complete their exact Caption runtime calls. Placeholder
references remain rejected.

Postrender visual-QA persistence/authenticated read, independent private-review
projection, and the terminal per-job qualification contract are also mounted.
This is still not the same as an actual private qualification run: the count
remains zero for actual authenticated private shared-owner records consumed by
one canonical end-to-end edit.

## Exact remaining internal work

The source implementation gaps are closed. Nine corresponding private evidence
gates remain:

1. consume the actual canonical transcript persistence reread in the terminal
   qualification run;
2. consume an actual canonical Visual Intelligence owner record;
3. consume an actual canonical Track All owner record;
4. consume an actual canonical SoundSync result;
5. consume an authenticated B-roll owner result;
6. complete the mounted Caption work through the canonical backend work graph
   and persist/reread every result;
7. run qualified complete-time visual-AI review for every rendered output;
8. reread independent final-QA/private-review evidence against the exact repaired
   output; and
9. create the already-defined final per-job terminal qualification projection
   only after the first eight pass.

These are internal end-to-end qualification gates. Public SaaS production,
customer rollout, billing activation, and the central Orchestra are not needed
for the target terminal status.

## Files changed

- `src/types/caption-current-integration-readiness.ts`
- `server/captions-specialist/caption-current-integration-readiness.ts`
- `server/smoke/captions-specialist-current-integration-readiness-smoke.ts`
- `package.json`
- this report

## Contracts

V1 remains a closed historical record. V2 is a separate closed, digest-bound
record that binds V1, the frozen audit, current integration manifest and
qualification, exact Caption consumer receipts, and every source mount. It
explicitly sets `supersedesFrozenAudit=false`.

## Existing owners reused

Canonical transcript, Visual Intelligence, Track All/SAM 3.1, SoundSync,
B-roll, backend work execution, postrender visual QA, independent private
review, StoryTiming/MasterTiming, Remotion, approval, asset, estimate, and cost
owners remain unchanged.

## Duplicate owners avoided

No persistence reader, provider dispatcher, GPU runner, sound engine, B-roll
selector, work scheduler, final-QA approver, billing path, public-delivery path,
or production path was added.

## Tests

The focused smoke passes 23 assertions across both versions, including exact
mount counts, ordered evidence gates, frozen-record coexistence, closed
authorities, digest refusal, semantic-overclaim refusal, unknown-field refusal,
inherited-property refusal, and cyclic-input refusal. The terminal projection
smoke passes 33 assertions against the new V2 source readiness reference.

## Media inspected

No media was generated. Existing inspected Caption media was not relabeled as
new evidence or as complete-time visual-AI review.

## Next milestone

Run one authorized canonical private end-to-end qualification that supplies the
nine exact terminal evidence groups, including qualified complete-time visual
review and direct visual inspection, without changing Caption ownership or
inventing a second scheduler.
