# Canonical post-render Visual Intelligence owner-to-Caption resume harness

Status: source-qualified internal ordering and durable-reread correction; live
Visual Intelligence evidence remains an external internal-test prerequisite

## Outcome

The bounded internal Caption qualification path now proves the intended owner
sequence without introducing a Caption provider dispatcher or a replacement
Orchestra:

1. an already admitted `visual-inspection-requirement-v1` is executed by the
   existing Visual Intelligence inspection coordinator;
2. the exact immutable report and spatial-evidence companion are reread;
3. the existing Visual Intelligence-owned finalizer seals
   `canonical-caption-postrender-visual-intelligence-result-v1`;
4. the existing Caption reconciliation worker rereads that owner result;
5. Caption persists its separate evidence record create-only; and
6. an exact replay returns `idempotent_replay` without another Caption-side
   dispatch, mutation, approval, charge, or delivery action.

The coordinator lives only under `server/internal-testing`. It is not imported
by an application route, does not schedule global work, and does not give
Caption provider, runtime, timeline, asset, QA-approval, repair, billing,
public-delivery, or production authority.

## Durable-store defect found and corrected

The source proof exposed a real one-writer persistence defect. Owner and Caption
evidence records were written under a six-field output identity:

- owner user;
- workspace;
- project;
- edit session;
- approved snapshot; and
- output.

The reread path accidentally hashed the complete richer locator, including
work-item and confirmed-frame fields. Therefore a correctly persisted result
could appear missing. The store now deliberately projects every read locator
back to the same six-field storage identity before computing the object name,
then performs the richer work-item/frame/coverage checks after parsing the
record. Focused regression covers owner reread, exact evidence reread,
output-level reread, create-only Caption persistence, and idempotent resume.

## Evidence boundary

The focused source smoke passes 34 assertions. Its Visual Intelligence lifecycle
is a controlled cache-replay fixture, so it proves contracts, ordering,
persistence, and refusal behavior only. It does not claim a new Gemini call,
model inference, private-media semantic decision, settled cost, or qualified
complete-time review.

Read-only environment inspection found usable Application Default Credentials,
but the canonical private control-plane bucket does not currently contain the
required immutable Visual Intelligence release and account-effective-rate
records. The implementation therefore remains fail-closed. No release/rate
record was invented, no provider call was made, and no cloud resource was
created or changed.

## Next internal step

Publish the existing shared Visual Intelligence release and account-effective
rate authorities through their canonical owner, then run the same owner-to-
Caption sequence against one exact approved private render. If that semantic
review passes, persist/reread independent final QA and the private-review
decision for the same package, snapshot, output, work item, and confirmed
frame. If it requests repair, retain the failed evidence and exercise the
bounded N+1 repair/reinspection path instead of promoting the run.
