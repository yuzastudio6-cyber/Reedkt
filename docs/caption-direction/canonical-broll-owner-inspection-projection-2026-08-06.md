# Canonical B-roll owner inspection projection — 2026-08-06

Status: `source_ready_waiting_for_exact_approved_run_authority`

## Outcome

Caption now has a fail-closed adapter from its accepted, owner-bound B-roll
professional inspection into the existing canonical direct-visual-inspection
evidence repository. The adapter does not relabel the B-roll owner result,
invent a dispatcher, or create a parallel QA owner.

Public identities:

- `canonical-caption-broll-owner-inspection-projection-request-v1`;
- `canonical-caption-broll-owner-inspection-bundle-repository-v1`;
- `canonical-caption-broll-owner-inspection-evidence-read-port-v1`;
- `canonical-caption-broll-owner-inspection-approved-run-authority-v1`; and
- `canonical-caption-broll-owner-inspection-projection-service-v1`.

## Exact lineage

One projection request binds the owner user, workspace, project, edit session,
plan version, immutable approved snapshot, execution package, output, scene,
authorized frame range/FPS, MasterTiming, confirmed output frame, deterministic
QA, B-roll support request, authenticated B-roll evidence record, owner result,
selected normalized artifact, accepted review spec, accepted render, and direct
inspection receipt.

The service rereads the following independently and twice:

1. the create-only Caption inspection bundle;
2. the canonical B-roll owner result/evidence pair; and
3. the canonical approved B-roll run authority.

Only after all three agree does it persist and reread the existing
`canonical-caption-direct-visual-inspection-evidence-v1`. The terminal
qualification reader must still revalidate the immutable package, snapshot,
render, QA, confirmed frame, and approved source-manifest authority.

## Fail-closed evidence

The focused source smoke passes 16 checks covering:

- exact create-only persistence and identical replay;
- all 72 frames represented for the selected variant plus seven
  original-resolution spot checks;
- exact render, receipt, source-manifest, owner-result, and selected-artifact
  lineage;
- crossed selected source and accepted-spec refusal;
- caller-supplied receipt refusal;
- changing/missing owner-evidence reread refusal;
- changing approved-run authority refusal;
- unsorted source-binding refusal; and
- create-only collision refusal.

The Caption source integration aggregate now contains 46 source suites and
still reports all 41 Caption-owned job implementations source-ready.

## Honest remaining boundary

This source adapter does not claim that the real private B-roll receipt has
already entered a terminal canonical run. The current evidence remains accepted
outside terminal scope until a real approved execution package supplies the
exact authority, persists the exact bundle, projects it, and lets the existing
qualification reader reread all owner and final-QA evidence under the same
scope.

No provider/model call, media runtime, repair execution, asset mutation,
final-QA approval, billing, public delivery, or production authority is granted.
