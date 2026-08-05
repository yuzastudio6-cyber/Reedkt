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

## Evidence and limitations

`npm run smoke:canonical-caption-specialist-planning` now exercises the frozen
V1 route plus the V2 multi-plan reachability surface and adversarial trigger and
lifecycle omissions. This is source evidence only. It does not claim that 41
actual approved runs have completed, that shared-owner evidence exists for a
terminal run, or that any synthetic fixture proves professional appearance.

The terminal truth therefore remains 0/41 qualified jobs and 0/9 terminal
evidence gates until representative real-source approved runs are persisted,
reread, visually inspected, independently reviewed, and assembled into the
existing multi-run catalog.
