# Canonical Caption Cross-System Execution Input

Milestone: `POST-CAP-12-CANONICAL-CROSS-SYSTEM-EXECUTION-INPUT`

Status: `source_regression_passed_ready_for_private_internal_evidence`

## Outcome

Caption V3 cross-system jobs now consume their Caption-owned coordination
artifacts through one immutable canonical backend package instead of relying on
an in-memory caller to resupply them. The package identity is
`canonical-caption-cross-system-execution-input-v1`.

The initial approved-work executor binds the package to the exact:

- execution package;
- immutable approved snapshot;
- approved work item and canonical job;
- planned asset-manifest entry;
- estimate and credit reservation;
- originating Caption call, job type, scope, confirmed frame, canonical
  transcript, and MasterTiming lineage.

The source adapter is reread twice, the package is persisted create-only, and
the persisted record is reread before Caption execution. Replays and
HQ-mediated owner resumes may only reread that same call-bound record; they
cannot construct a replacement package or cross it between output, scene,
handoff, frame, timing, snapshot, work, manifest, estimate, or reservation
lineage.

## Owner-resume continuity

The immutable incoming V2 support assignment is now resolved by the shared
`canonical-caption-incoming-support-request-service` for both initial and
resumed calls. It rereads the assignment and its originating owner call twice,
requires exact scope/job/artifact lineage, and refuses caller-injected or
self-referential assignments.

The existing Visual Intelligence, Track All, SoundSync, and B-roll Caption
support services now reread both the original cross-system execution input and
the original incoming support assignment before they resume Caption. This
preserves the same approved Caption context across the full
`needs_followup -> authenticated owner evidence -> resumed completion` chain.

The focused B-roll regression exercises that full path. It first stops at the
canonical B-roll owner boundary, then admits the existing B-roll owner result,
resumes the exact Caption call, and emits the expected Caption-owned outbound
payload and handoff without selecting media, cropping, retiming, dispatching,
or claiming receiver execution.

## Corrections found during verification

Two integration defects were found and fixed by the end-to-end regression:

1. persisted frame-range objects could be rejected only because canonical
   object-key ordering differed from runtime insertion order; scope comparison
   now compares numeric frame values rather than serialized key order;
2. owner-resumed support jobs did not reread the original incoming V2
   assignment, so a valid job could stall after owner evidence arrived; all
   four owner-resume services now use the shared admitted resolver.

## Focused evidence

- canonical cross-system persistence and transcript execution: 44 checks;
- canonical B-roll full support/resume path: 17 checks;
- canonical Caption execution: 49 checks;
- canonical SoundSync support: 16 checks;
- canonical Visual Intelligence support: 17 checks;
- canonical Track All support: 28 Caption checks, plus its 37- and 68-check
  canonical owner proofs;
- CAP-12: 82 assertions;
- integration routing: 41 checks;
- Caption source-integration aggregate: 47 suites, 20/20 historical
  milestones, and 41/41 current jobs;
- server typecheck with an 8 GiB Node heap: passed;
- targeted and full ESLint: passed;
- production build: passed, 2,969 modules;
- frontend/server boundary: passed, 1,147 files;
- current secret scan: passed, 6,857 files;
- reachable-history secret scan: passed, 15,665 blobs;
- Git diff whitespace validation: passed.

## Authority boundary

This milestone persists byte-free Caption coordination data only. It starts no
receiver, provider, GPU, model, media, Docker, Remotion, FFmpeg, or browser
runtime and grants no peer dispatch, timeline mutation, asset mutation, cost or
billing mutation, final-QA approval, public delivery, or production authority.
The frozen Caption-to-Living-Frame V1/V2 contracts are unchanged, Caption stays
above Living Frame by default, and every receiver continues to own its own
execution and evidence.

The 41 Caption source paths remain ready. Terminal private-internal
qualification remains pending the same nine actual-evidence groups listed in
`current-integration-readiness.md`; this source milestone does not relabel
contract or fixture evidence as terminal qualification.
