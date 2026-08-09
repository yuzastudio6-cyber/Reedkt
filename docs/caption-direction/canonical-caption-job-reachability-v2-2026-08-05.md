# Canonical Caption job reachability V2 — 2026-08-05

Status: source-complete; private evidence runs still required

## Outcome

The Caption runtime already declared and handled 41 planning job types, but the
canonical approved-work planner could emit only 12 of them. That meant handler
coverage was being reported more broadly than actual approved-work
reachability.

The additive V2 lane closes that source gap without changing the published V1
wires:

- `canonical-caption-specialist-planning-binding-v2`;
- `canonical-caption-specialist-job-assignment-v1`;
- `canonical-caption-specialist-planning-projection-v2`; and
- `canonical-caption-specialist-work-item-input-v2`.

Every V2 assignment binds an exact output, scope, scene/boundary identity,
authorized frame range, canonical selection-evidence ref, typed trigger, and—
for incoming support work—the exact HQ-mediated support-request ref. Caption
still cannot create work, expand scope, dispatch a peer, mark browser-local
completion, mutate assets, approve QA, settle cost, deliver publicly, or claim
production authority.

The incoming-support occurrence is now executable rather than an opaque
planning reference. `skill-support-request-v1` remains byte-for-byte frozen and
continues to describe Caption's outgoing dependency requests. The additive
`skill-support-request-v2` lives in separate public type and parser files and
may target `captions` with one exact `requestedJobType`. The canonical executor
accepts it only through a branded persisted-request reread port, rereads it
twice together with its exact originating specialist call, and binds the
returned Caption support artifact to that exact request. The source call must
match the request's requester and full canonical scope.
No V1 type, parser, call/result digest, or sequential-resume dependency hash is
changed.

## Reachability model

Normal plans contain only applicable work. The regression proves the complete
declared surface through several representative plan classes:

1. spatial typography and multi-track scene work;
2. boundary and transition coordination;
3. incoming support assignments; and
4. repair, output recomposition, and result inspection.

Every class also carries the eight video-level planning jobs and the required
scene lifecycle. Their union is exactly the 41 declared Caption jobs. No plan
claims to be one artificial all-feature edit.

Trigger rules fail closed:

- early-plan jobs require `approved_early_plan`;
- late scene resolution requires `approved_picture_lock`;
- boundary work requires `approved_boundary_requirement`;
- incoming support requires `hq_mediated_support_request` and a non-null source
  request ref;
- repair, recomposition, scene inspection, and boundary inspection each require
  their dedicated canonical trigger.

The planner also refuses missing baseline scene lifecycle, crossed output or
scene ranges, duplicate assignment occurrences, duplicate IDs, malformed
scope identifiers, missing support lineage, and recomputed-digest semantic
tampering.

The incoming-support execution regression additionally refuses a V1 request
that tries to target Caption, unsafe or unknown V2 fields, a missing canonical
reader, changed data between rereads, crossed request identity, and a request
whose scope, job, requested artifact, owner, or source-call relationship does
not match the immutable Caption assignment.

## Evidence and limitations

`npm run smoke:canonical-caption-specialist-planning` now exercises the frozen
V1 route plus the V2 multi-plan reachability surface and adversarial trigger and
lifecycle omissions. This is source evidence only. It does not claim that 41
actual approved runs have completed, that shared-owner evidence exists for a
terminal run, or that any synthetic fixture proves professional appearance.

`npm run smoke:canonical-caption-specialist-execution` proves the incoming
support occurrence reaches Caption through the approved package and returns the
requested byte-free artifact. It also pins the existing V1 pair and receipt
digests. `npm run smoke:canonical-specialist-support-resume` separately proves
the four previously frozen generic V1 public/parser dependency hashes remain
exact.

The terminal truth therefore remains 0/41 qualified jobs and 0/9 terminal
evidence gates until representative real-source approved runs are persisted,
reread, visually inspected, independently reviewed, and assembled into the
existing multi-run catalog.

## Milestone evidence

Milestone: post-CAP-20 incoming specialist-support execution

Status: source-complete; terminal qualification unchanged

Outcome: the required incoming support request can now reach one exact Caption
support job through the canonical approved-work executor and produce the exact
requested semantic artifact.

Files changed: additive V2 public type/parser, Caption integration manifest and
qualification V2, runtime admission, canonical executor/read port, smoke, and
this documentation. Frozen V1 source files were not changed.

Contracts added/changed: `skill-support-request-v2`,
`canonical-caption-incoming-support-request-read-port-v1`, and the additive
Caption integration manifest/qualification V2.

Existing owners reused: approved snapshot, approved work package, canonical
specialist call/result persistence, execution receipt, and HQ-mediated support
lineage.

Duplicate owners avoided: no scheduler, peer dispatcher, result repository,
timeline owner, provider owner, renderer, asset owner, QA approver, or billing
owner was added.

Tests run: focused V2 parser/runtime/executor regression, frozen generic V1
sequential-resume regression, canonical planning, integration routing, source
aggregate, targeted lint, and server typecheck.

Tests passed: all listed checks; V1 pair/receipt and four generic dependency
hashes remained exact.

Tests failed: the first aggregate correctly detected mutation of a hash-frozen
V1 file. V2 was moved into separate additive files, after which the aggregate
passed.

Media inspected: none; this is a byte-free coordination-contract milestone.

Visible defects: not applicable. Synthetic media was not produced or used as
appearance evidence.

Repairs made: removed all V2 additions from the frozen V1 public type/parser,
created separate V2 files, and added stale/crossed/unsafe request refusals.

Known limitations: this proves source reachability, not actual representative
approved-run completion or professional visual qualification.

Scoped blockers: the nine existing actual-evidence gates remain unchanged.

Safe work completed: all implementation and verification that requires no
provider, model, media runtime, public delivery, billing, or production action.

Next milestone: persist and reread representative real-source approved runs,
then perform direct professional visual inspection and assemble terminal
per-job evidence.
