# CAP-07 — Picture Lock and Finish Readiness Report

Status: `complete`
Milestone: `CAP-07`
Media/provider runtime started: no
Canonical approval, render, or production authority promoted: no

## Outcome

CAP-07 adds the neutral shared `canonical-picture-lock-manifest-v1` and makes
Caption consume that authority through `caption-dependency-manifest-v2`,
`caption-finish-readiness-v2`, `caption-invalidation-result-v1`, and
`caption-lifecycle-record-v2`.

Caption does not create, revise, or approve picture lock. The canonical edit
owner freezes the approved snapshot, exact confirmed frame, MasterTiming,
source ranges, shot order and duration, speed, transitions, crop/reframe,
B-roll, Living Frame, graphics, masks/tracks/anchors, occupancy, color/look,
renderer plan, source asset manifest, locked scenes, and any explicit approved
exceptions. The manifest is immutable, private, byte-free, and digest-bound.

## Finish-readiness behavior

The dependency manifest covers 32 typed finish dependencies. Each observation
binds the exact picture-lock identity, affected scenes, current canonical
reference, staleness basis, and—when applicable—one approved fallback or exact
picture-lock exception. The readiness projection computes each scene as:

- `ready` when all required dependencies are current;
- `ready_with_fallback` when a missing dependency has an exact approved safe
  fallback or canonical picture-lock exception;
- `blocked` when required current evidence is absent or stale.

A fallback never claims the original treatment is ready. An exception is valid
only when its dependency code, affected-scene scope, and approval reference
match the exact canonical PictureLockManifest exception. Invented Caption-local
exceptions fail closed. Finish readiness never grants final-render authority.

## Staleness and lifecycle

The invalidation adapter compares exact dependency refs and picture-lock
lineage. Local changes invalidate only affected scenes and allow unrelated
scenes to continue. Global changes such as confirmed frame or picture-lock
lineage invalidate the complete declared scene universe and require canonical
reapproval when applicable. The result carries a complete, exact partition of
all, invalidated, and unchanged scene IDs; duplicates, omissions, overclaims,
and inconsistent affected-scene scopes are rejected.

The append-only lifecycle supports the documented strategy, reservation,
picture-lock, finish-ready, choreography, render, QA, repair, qualified, stale,
and blocked states. Illegal transitions and stale-state reversals fail closed.

## Verification

`smoke:captions-specialist-cap-07` passes 31 positive and adversarial checks,
including exact picture-lock identity, all 32 dependency kinds, scene-local
fallback, exact canonical exceptions, blocked dependency isolation, local and
global invalidation, lifecycle progression, confirmed-frame refusal, stale
core lineage, unknown nested data, missing dependency classes, incomplete
fallbacks, changed fallback authorization, unmapped/invented exceptions,
invalid non-applicability, incomplete invalidation partitions, scope
mismatches, and readiness or authority overclaims.

The complete server typecheck and focused ESLint checks pass. No provider,
worker, media, render, billing, public, or production action occurred.

## Next milestone

CAP-08 implements bounded Visual Intelligence support requests and consumes
structured final-frame occupancy, hierarchy, protected-region, and rendered
inspection evidence without creating a direct Qwen or provider owner.
