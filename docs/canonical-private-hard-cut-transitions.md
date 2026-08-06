# Canonical Private Hard-Cut Transitions

Status: `implemented_local_private_bounded_slice`

Status date: 2026-07-14

## Contract

A multi-source canonical private composition requires one approved hard-cut
record for every adjacent source boundary. Each record freezes:

- the master and refined transition timing IDs;
- the adjacent segment IDs;
- the adjacent source-sequence item IDs;
- the exact boundary frame.

The master and refined timing records must both describe a zero-duration,
speech-safe `hard_cut` at that boundary. IDs must be unique, source ranges must
remain contiguous and duration preserving, and no SFX may be attached. A
changed frame, source order, ID, extra field, missing record, or non-hard-cut
effect fails validation before dispatch.

## Planner Rule

When a source boundary has neither visual nor audio motivation, transition
refinement selects a hard cut regardless of product category. It does not
invent a browser zoom, graphic wipe, or SFX merely because the edit is Pro or
Premium. Visually or musically motivated transition effects remain planning
intent only until a separate exact execution slice supports them.

## Execution Evidence

The approved transition array is hash-bound inside the immutable final-export
work item. The confined Remotion runner independently revalidates it, schedules
the two source `Sequence` components on the exact boundary, and emits semantic
evidence that the transition authority was read and applied. Final H.264/AAC
output still passes independent FFprobe QA, private artifact persistence,
reconciliation, idempotent replay, downstream QA, and authenticated private
download.

Focused evidence:

- `npm run smoke:canonical-planning-publication-client`
- `npm run smoke:offline-remotion-render-execution`
- `npm run smoke:canonical-multi-source-final-composition`
- `npm run qa:canonical-private-pipeline`

## Boundary

This slice supports only deterministic zero-duration hard cuts at ordered
source boundaries. It does not enable crossfades, wipes, pushes, zooms, match
cuts, visual effects, transition SFX, provider calls, live billing, remote
Supabase, deployment, public delivery, external beta, production rendering,
Motion Studio, or MS-001.
