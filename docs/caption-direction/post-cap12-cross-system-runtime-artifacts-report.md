# Post-CAP-12 Cross-System Runtime Artifacts Report

Milestone: `POST-CAP-12-CROSS-SYSTEM-RUNTIME-ARTIFACTS`

Status: `full_regression_passed_ready_for_checkpoint`

## Outcome

The Caption specialist now has production source constructors for its own
cross-system outbound payloads and handoff receipts. The constructors derive
receiver identity, exact source words, accessible counterpart nodes,
StoryTiming handoff/hold/restore events, confirmed-frame and MasterTiming
lineage, fallback behavior, and closed authority fields from canonical Caption
context. Callers no longer author those invariant fields by hand.

The V3 Caption runtime now admits those contracts as actual private,
byte-free Caption outputs. The aggregate `plan_caption_to_visual_handoff` job
emits exactly:

- one `caption_cross_system_coordination_plan` reference;
- eight `caption_cross_system_outbound_payload` references;
- eight `caption_cross_system_handoff` references.

The per-owner handoff jobs emit one exact outbound payload and one exact
handoff. Every emitted type must be declared by that job's manifest entry, and
duplicate output identities fail closed.

## Ownership and authority

Caption constructs only Caption-owned planning and coordination artifacts. It
does not execute Living Frame, Transition, Graphic, Map, Chart, Diagram,
B-roll, or Stroke Motion work. It does not dispatch a peer, mutate the
timeline, create a media asset, approve QA, spend credits, deliver publicly, or
claim production readiness.

Incoming Living Frame and Transition typography requests remain owned by the
requesting skill. Caption exposes a closed parser and produces the requested
Caption result through the HQ-mediated support lane; it deliberately does not
provide a Caption-side production constructor that could impersonate the
external requester.

## Fail-closed runtime checks

The runtime now rejects:

- a V3 cross-system job without the exact plan/context or handoff/context;
- an aggregate plan crossed from another Caption call;
- canonical transcript, confirmed-frame, or MasterTiming substitutions;
- a receiver not admitted for the assigned job;
- aggregate and single-handoff shapes mixed together;
- cross-system evidence attached to an unrelated Caption job;
- any produced artifact not declared by the exact capability entry;
- a boundary-only handoff job submitted with scene scope.

Resumed jobs bind outbound lineage to the exact original call that created the
support request. All older V1/V2 runtime profiles remain readable and reject
the additive V3 evidence instead of silently accepting it.

## Compatibility

The frozen Caption-to-Living-Frame V1 and additive V2 wire contracts are
unchanged. The V3 manifest and qualification hashes also remain unchanged:

- manifest: `670160edb63d4abebe8b33096a5ea70089000e6f46f8b079f5c3a046940ae0a9`;
- qualification: `927769c6ee37009e5538752a23715be8e0f33f0c70b52e8c52b59ec5a33b3b81`.

## Focused evidence

- CAP-12: 82 assertions;
- integration routing: 41 checks;
- CAP-01 through CAP-20 source aggregate: 20/20;
- source-integration aggregate: 47 suites and 41/41 current jobs;
- canonical transcript support: 34 checks;
- canonical Caption execution: 49 checks;
- targeted and full ESLint: passed;
- server typecheck with an 8 GiB Node heap: passed.
- production build: passed, 2,969 modules;
- frontend/server boundary: passed, 1,146 files;
- current secret scan: passed, 6,852 files;
- reachable-history secret scan: passed, 15,665 blobs;
- Git diff whitespace validation: passed.

No media, model, provider, GPU, Docker, billing, public-delivery, or production
runtime was started for this source milestone.

## Remaining gates

Receiver execution and authenticated receiver-result persistence remain with
their canonical owners. Five future generic target registrations remain
explicitly pending for Graphic, Map, Chart, Diagram, and Stroke Motion. The
nine terminal private-evidence categories remain unchanged; this source
milestone does not relabel contract evidence as private execution or visual QA.
