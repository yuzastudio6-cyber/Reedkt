# Current Caption Integration Readiness

Milestone: `POST-CAP-20-CURRENT-INTEGRATION-READINESS`

Status:
`caption_source_complete_with_two_owner_mount_gaps`

Target: `caption_specialist_private_internal_qualified`

Current per-job truth:

- Caption-owned implementation: **41/41 supported jobs**
- Source paths ready for a private evidence run: **37/41 jobs**
- Waiting on a canonical owner composition mount: **4/41 jobs**
  (three SoundSync-dependent jobs and one B-roll-dependent job)
- Terminally qualified from current canonical private evidence: **0/41 jobs**

The 0/41 terminal count is intentional until one fresh canonical private run
rereads real results, rendered outputs, qualified complete-time visual review,
and independent private review. It is not a regression of the Caption source
implementation.

## Outcome

The additive `caption-current-integration-readiness-v3` record provides the
current Caption truth without rewriting the frozen CAP-20 audit or the earlier
V1/V2 checkpoints. V3 explicitly corrects V2's use of "mounted" for two
services that are complete Caption bridges but are not instantiated by a
canonical backend owner composition in this branch.

All five shared-owner Caption boundaries and bridge implementations are
source-complete:

1. canonical transcript authenticated-read admission;
2. Visual Intelligence authenticated evidence admission;
3. Track All/SAM 3.1 authenticated evidence admission;
4. SoundSync typed request/result admission and silent fallback;
5. B-roll owner request/result admission.

Three are mounted in canonical compositions: the transcript in the private
Caption runner, Visual Intelligence in its production composition, and Track
All/SAM 3.1 in its production composition. Their focused positive paths
complete exact Caption calls through the one-writer resume ledger.

SoundSync and B-roll each have a strict Caption bridge, create-only evidence
repository, exact owner reread, one-writer resume behavior, and adversarial
tests. They are not yet mounted because this branch does not contain a
canonical SoundSync result repository/context composition or a canonical
B-roll owner result/snapshot composition. Those owners must supply the ports;
Caption must not invent parallel selectors, mixers, clocks, or dispatchers.

Postrender visual-QA persistence/authenticated read, independent private-review
projection, and the terminal per-job qualification contracts are also mounted.
The historical V1 terminal lane remains bound to readiness V2; the additive V2
terminal lane binds readiness V3 and is the only current terminal lane.
This is still not the same as an actual private qualification run: the count
remains zero for actual authenticated private shared-owner records consumed by
one canonical end-to-end edit.

## Exact remaining internal work

Two backend owner-mount gaps and nine corresponding private evidence gates
remain:

1. consume the actual canonical transcript persistence reread in the terminal
   qualification run;
2. consume an actual canonical Visual Intelligence owner record;
3. consume an actual canonical Track All owner record;
4. mount the canonical SoundSync owner/context readers and consume an actual
   SoundSync result;
5. mount the canonical B-roll owner/snapshot readers and consume an
   authenticated B-roll owner result;
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
- `src/types/caption-current-job-readiness.ts`
- `src/types/caption-terminal-qualification.ts`
- `server/captions-specialist/caption-current-integration-readiness.ts`
- `server/captions-specialist/caption-current-job-readiness.ts`
- `server/captions-specialist/caption-terminal-qualification-v2.ts`
- `server/smoke/captions-specialist-current-integration-readiness-smoke.ts`
- `server/smoke/captions-specialist-current-job-readiness-smoke.ts`
- `server/smoke/captions-specialist-terminal-qualification-smoke.ts`
- this report

## Contracts

V1 and V2 remain closed historical records. V3 is a separate closed,
digest-bound correction that binds V2, the frozen audit, current integration
manifest and qualification, exact Caption consumer receipts, the three real
composition mounts, and the two unmounted bridge implementations. It explicitly
sets `supersedesFrozenAudit=false` and
`correctsSupersededReadinessOverclaim=true`.

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

The focused smoke covers all three versions, including exact bridge and mount
counts, ordered evidence gates, frozen-record coexistence, closed authorities,
digest refusal, mount-overclaim refusal, unknown-field refusal,
inherited-property refusal, and cyclic-input refusal. Both terminal versions
remain contract-shape proofs and cannot substitute for the two missing owner
mounts or any actual private evidence. The current V2 lane rejects the
superseded readiness V2 reference.

## Media inspected

No media was generated. Existing inspected Caption media was not relabeled as
new evidence or as complete-time visual-AI review.

## Next milestone

First mount the existing Caption SoundSync and B-roll bridges against their
canonical owner repositories. Then run one authorized canonical private
end-to-end qualification that supplies the nine exact terminal evidence groups,
including qualified complete-time visual review and direct visual inspection,
without changing Caption ownership or inventing a second scheduler.
