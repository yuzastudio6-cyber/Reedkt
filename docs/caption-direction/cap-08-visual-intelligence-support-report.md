# CAP-08 — Visual Intelligence Support Report

Status: `contract_complete_private_visual_runtime_gated`
Milestone: `CAP-08`
Media/provider runtime started: no
Actual visual inference or rendered-pixel inspection claimed: no
Canonical QA, provider, billing, render, or production authority promoted: no

## Outcome

CAP-08 implements the Caption-owned public adapter around the existing Visual
Intelligence boundary. A versioned Caption payload is carried inside the
neutral `SkillSupportRequest`; the request is HQ-mediated, byte-free, scoped to
one approved snapshot/output/scene/range, and targets the existing
`inspect_edit` / `caption_layout_qa` public operation. Caption supplies no
provider prompt, model choice, media locator, credential, runtime admission, or
dispatch authority.

The inbound `caption-visual-intelligence-evidence-packet-v1` binds the exact
support request and payload, picture lock, finish readiness, confirmed frame,
near-final or rendered private artifact, canonical layout occupancy authority,
Visual Intelligence report, authenticated reread status, coverage, findings,
and structured region observations. It is a Caption consumer adapter, not a
second Visual Intelligence report or provider lifecycle.

## Occupancy and hierarchy

`caption-visual-occupancy-manifest-v1` projects structured observations for
safe candidates and protected face/eyes/mouth/hair/hands/gestures/speakers,
products, important objects, screen text, maps, charts, browser highlights,
lower thirds, fact notes, CTAs, B-roll, Living Frame, platform UI, and crop-risk
areas.

The parser independently recomputes rectangle overlap, candidate score,
minimum 4.5:1 measured contrast, temporal-stability eligibility, uncertainty,
protected-region status, and candidate ordering. Caller-supplied readiness
booleans cannot override those facts. The manifest remains a Caption-only
projection: Visual Intelligence retains evidence ownership and the canonical
layout owner retains occupancy/layout authority.

`caption-final-visual-hierarchy-v1` preserves the default order:

1. base video;
2. Living Frame;
3. B-roll or graphics;
4. foreground subject masks;
5. creative Caption;
6. accessible Caption.

Accessible Caption stays topmost and Caption remains above Living Frame by
default. CAP-08 does not admit a non-top creative plane; CAP-09 Track All
evidence is required first. StoryTiming still owns executable placement and
Remotion still owns the final canvas.

## Rendered inspection

The same typed support family covers actual rendered-caption inspection. Its
payload requires inspection of rendered pixels while explicitly retaining
deterministic Caption QA, direct raster inspection, and independent final QA.
Visual Intelligence can report findings and recommend Caption repair; it
cannot mutate the edit or grant final QA.

The CAP-08 smoke uses contract fixtures only. Those fixtures are structurally
useful but cannot open final hierarchy or satisfy rendered visual review.
Authenticated private runtime evidence and immutable report reread remain the
explicit gate for later real-media qualification.

## Verification

`smoke:captions-specialist-cap-08` passes 27 positive and adversarial checks.
Coverage includes exact support mediation, frame/scope binding, protected
face/text/B-roll/Living Frame regions, overlap disqualification, deterministic
candidate ordering, Caption-above-Living-Frame ordering, rendered-inspection
requirements, fixture/runtime separation, stale support refs, invalid aspect
ratio, incomplete coverage, missing roles, duplicate observations, unknown
nested fields, readiness overclaims, forged protected overlap, forged
hierarchy admission, and closed authorities.

The server typecheck and focused ESLint pass. No media, provider, model,
render, browser, billing, public, or production runtime was started.

## Next milestone

CAP-09 adds the Track All support compiler and consumes SAM 3.1-backed
mask/track/anchor evidence without importing or dispatching SAM directly.
