# Track All assignment and target contract

## Current authority

`track_all_assignment_v1` is the immutable skill-specific authority nested
behind the generic `edit-skill-assignment-v1` public boundary. Both bind the
same manifest reference, tenant, project, edit session, assignment identity,
and authorized write range. The Track All assignment separately records an
analysis context range; that context may be larger, but it is read-only and
cannot expand mutation authority.

The write-authority hash covers the assignment and tenant identities, edit
session, coordinate space, and exact authorized range. A changed range with an
old hash is rejected. The outer assignment is content-addressed independently,
so a changed artifact list or stale manifest also creates different authority.

Required single-role inputs are:

- Track All assignment and target specification;
- checksum-bound source inventory and source-frame authority;
- exact Master Timing assignment range and FPS;
- exact visual-ownership range;
- read-only scene context with increasing in-range shot boundaries.

Missing, duplicate, ambiguous, cross-tenant, stale, or wrong-role inputs fail
before planning. The selected source ID and checksum must both resolve in the
inventory. Whole-video context never grants whole-video output.

## Target authority

`track_all_target_specification_v1` binds tenant, project, edit session, and
assignment identity. It supports selected instances, concept and selected
groups, planar/freeform/camera-relative/world-relative regions, existing
tracks, and parent/child regions.

Grounding is a strict union of compiled text concepts, positive or negative
points, boxes, approved brush masks, approved reference images, model-neutral
Visual Intelligence grounding, and existing Track Graph references. Unknown
fields such as raw chat, paths, commands, model IDs, GPU IDs, or URLs are
rejected. Raw user chat is never part of the GPU contract.

Point, box, brush, and reference-image evidence remains checksum-bound.
Privacy-critical targets require conservative lost-track coverage. A grounding
frame outside the write range cannot dispatch tracking: when it is inside
read-only analysis context, the public plan returns `needs_range_expansion`;
otherwise it blocks.

## Qualification truth

These contracts and their adversarial smoke establish authority behavior only.
They do not qualify SAM inference, deterministic geometry, privacy output,
production execution, or the future head orchestra.
