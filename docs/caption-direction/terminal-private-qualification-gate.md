# Caption terminal private-qualification gate

Milestone: Post-CAP-20 terminal qualification projection contract

Status: Caption-owned source implementation complete; current terminal status
remains blocked

Outcome: The backend workflow has one closed, digest-bound input and projection
surface for proving the final
`caption_specialist_private_internal_qualified` status after real canonical
private evidence exists.

## What this closes

The additive contracts are:

- `caption-terminal-qualification-evidence-input-v1`
- `caption-terminal-qualification-preflight-v1`
- `caption-terminal-per-job-qualification-projection-v1`

The terminal builder accepts only an exact private qualification record that
contains:

- immutable approved-snapshot and plan scope;
- canonical execution package, work graph, asset manifest, MasterTiming,
  StoryTiming, estimate approval, credit reservation, and cost binding refs;
- actual reread refs for canonical transcript, Visual Intelligence, Track All,
  SoundSync, and B-roll;
- all 41 Caption jobs in the declared capability order, with exact work,
  result, artifact, estimate/cost, deterministic-QA, rendered visual-review,
  and independent final-QA lineage;
- every confirmed output exactly once, each with its own frame authority,
  rendered artifact, deterministic QA, qualified complete-time visual review,
  independent final QA, accepted private-review decision, and repair generation;
- no fixture-as-runtime, reference-only evidence, browser-local completion,
  direct peer dispatch, or Caption-owned runtime/asset/QA/billing/delivery
  authority.

Projection creation also requires one
`canonical-caption-private-review-evidence-projection-v1` for every confirmed
output, in exact output order. Each projection must bind the same authenticated
owner, immutable snapshot, confirmed frame, rendered artifact, deterministic
QA, complete-time AI visual evidence, and canonical persisted private-review
decision. Only `private_review_accepted_visual_pass` is terminal-admissible.
Repair, missing assembly, missing decision, crossed output, and accepted human
review with unresolved AI uncertainty all fail closed.

Conditional jobs must use exactly the shared owners declared by the frozen
CAP-20 handoff. A Visual Intelligence ref cannot replace Track All evidence,
and a source fixture cannot satisfy a canonical persisted owner result.

## Current truthful status

`CAPTION_CURRENT_TERMINAL_QUALIFICATION_PREFLIGHT` is deliberately:

- `blocked_missing_canonical_evidence`;
- bound to the current Caption integration-readiness record;
- blocked by the same nine canonical integration/evidence gaps;
- `terminalProjectionCreated: false`;
- `terminalStatusClaimed: false`.

The focused smoke constructs valid in-memory contract-shape candidates only to
exercise the parser and projection builder. A terminal input without the exact
per-output private-review projections remains blocked. The smoke does not
persist those candidates, does not consume a provider/GPU/model result, and
does not change the current preflight. The smoke output names this distinction
explicitly.

## Fail-closed coverage

The focused regression rejects stale digests, missing or reordered jobs,
duplicate outputs, missing visual or final QA, fixture/reference-only evidence,
authority escalation, crossed shared-owner evidence, duplicate job results,
unknown fields, inherited data, cycles, stale projections, mismatched source
inputs, missing/crossed private-review projections, and inconsistent preflights.

## Milestone receipt

Files changed:

- `src/types/caption-terminal-qualification.ts`
- `server/captions-specialist/caption-terminal-qualification.ts`
- `server/smoke/captions-specialist-terminal-qualification-smoke.ts`
- `src/types/canonical-caption-private-review-evidence-projection.ts`
- `server/services/canonical-caption-private-review-evidence-service.ts`
- `server/services/canonical-private-edit-preparation-coordinator-service.ts`
- `package.json`
- this report and the Caption documentation index

Contracts added/changed: Three additive Caption-owned terminal qualification
contracts; no existing shared-owner or Caption-to-Living-Frame wire changed.

Existing owners reused: approved snapshot, MasterTiming, StoryTiming, canonical
work graph, asset manifest, estimate/credit/cost, five shared evidence owners,
postrender visual QA, independent final QA/private review, and Remotion output
lineage remain external canonical owners.

Duplicate owners avoided: No dispatcher, provider adapter, worker, renderer,
credit owner, visual-QA owner, or private-review owner was added.

Tests run: Focused terminal qualification smoke, server typecheck, Caption
aggregate/regressions, lint, build, boundary, and repository checks.

Media inspected: None; this milestone generated no image, audio, or video.

Visible defects: Not applicable.

Repairs made: Not applicable.

Known limitations: Actual canonical owner records and a backend-mounted private
Caption execution have not yet been supplied to this checkout.

Scoped blockers: The nine canonical gaps in the current readiness record.

Safe work completed: The existing canonical private-review owner is now
admission-guarded by exact persisted Caption visual evidence, and the terminal
projection cannot be created from truth-shaped references alone.

Next milestone: Populate the contract from the backend one-writer pipeline with
real private records, then run the complete internal edit and qualified visual
review before publishing a terminal projection.

This milestone does not require public deployment or production SaaS readiness.
