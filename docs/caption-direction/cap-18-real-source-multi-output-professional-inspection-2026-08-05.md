# CAP-18 real-source multi-output professional inspection — 2026-08-05

Milestone: `CAP-18` additive real-media evidence

Status: `caption_owned_professional_appearance_accepted_for_bounded_fixture`

Terminal specialist qualification: **not claimed**

## Outcome

The Caption renderer now has a real-footage, output-specific editorial
composition for 16:9 and 1:1 in both full- and reduced-motion variants. The
source speaker remains in a sharp protected panel while hero and stable speech
typography occupy a separate editorial sidecar. The layout is recomposed for
each output rather than stretching or reusing another canvas.

This evidence is deliberately separate from the colorful engineering fixtures.
Color bars, geometry blocks, counters, and synthetic plates remain useful for
timing, clipping, layer-order, and protocol tests, but they are structurally
ineligible to prove professional appearance.

## Actual private media

All four renders use the same real uploaded source lineage:

`a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0`

| Output | Motion | Review raster | MP4 SHA-256 |
| --- | --- | --- | --- |
| 16:9 | full | 640×360 | `660d705c970159ef99b2bb8707dc1b3a8a1a091fcab4de4fde88fd497872ae97` |
| 16:9 | reduced | 640×360 | `24ed3415b097dff779bbc7250d16aa205ec75d6ebb8b45c5649d612fa90d00f7` |
| 1:1 | full | 480×480 | `1ca4755f418b07b529c0e2425e901a4040c12a40b512426839458bee9e3d6497` |
| 1:1 | reduced | 480×480 | `5846f2055f568e9474117f602ceff99041c6a8cffa1b7dc4ed0545e915c0e5cb` |

Each render is 127 frames at 30 fps. The review canvases are exact one-third
proxies for confirmed 1920×1080 and 1440×1440 output frames. They do not claim
to be final customer canvases.

The source-bound private Remotion image identity is
`sha256:f517347a1e53667bb995279afb2d0ade1c3e9ba5d20f12fe57fe4848c80ffbbc`;
its source-tree SHA-256 is
`ed48d8687042aa9e92bdbc830135ed53e22016b53809a1f36acee1ca98213d95`.

## Direct visual inspection

Runtime children were stopped before direct inspection. Four contact sheets
represent every rendered frame exactly once, and 16 original-resolution spot
checks cover entry, stable phrase, second phrase, and tail states across all
four variants.

The contact-sheet SHA-256 values are:

- 16:9 full: `e634167d94677cfa4990f2180a858873978cf7539a0e421b7e6567cb79dc924e`
- 16:9 reduced: `7ab742a6788987e490e51b70b32f90c034e62fe80237863a1251024258f2c44e`
- 1:1 full: `7080c6aaeef545a54f0c381807f03006f9b87033c4f62d345cb69598077415ec`
- 1:1 reduced: `d15dacd2295d17fae0a712a855803e9f3e988d5e286362c1d41e07ff9e6da901`

Accepted findings:

- the white stable phrase remains readable on its dark plate;
- the cyan hero role remains visually distinct without replacing the complete
  accessible phrase;
- the speaker remains visually primary and unobstructed;
- face and active hand gestures remain outside Caption-owned typography;
- no caption clipping, phrase overflow, source distortion, cross-canvas reuse,
  stuck caption layer, or tail truncation is visible;
- full and reduced variants preserve the same words, hierarchy, placement, and
  source meaning;
- the 16:9 and 1:1 outputs are independently composed.

Closed inspection contract:

- schema: `caption-real-source-multi-output-direct-inspection-v1`
- inspection digest:
  `c4b686fdf2798eda32d1bb047b800b2269a90aed87fa513b0d4bcdbf9b91c34d`
- receipt byte SHA-256:
  `d8038cd91e18a9afa762e1aea11af0d0d26aed54b11c0d11417578d239a0afc7`

The receipt contains no media bytes or local paths. It explicitly records:

- `syntheticEngineeringFixtureUsed: false`;
- `syntheticEngineeringFixtureQualifiedProfessionalAppearance: false`;
- `acceptedForCaptionOwnedProfessionalAppearance: true`;
- `qualifiedSharedPostrenderAiReviewClaimed: false`;
- `independentFinalQaClaimed: false`.

## Repair history

The first runtime attempt failed closed because the server-side golden-frame
verifier did not yet recognize the additive multi-output profile. No output
from that attempt was accepted. The verifier was extended without changing the
older vertical profile, the exact source-bound image was rebuilt, and the four
renders passed on a clean rerun.

No visual defect required a second design render after the clean run. The
inspection does observe normal blank intervals between the bounded fixture's
phrase cues and after its last cue; no stuck or truncated layer is present.

## Honest limitations and remaining gates

The bounded wording evidence is human-reviewed at phrase level but uses
synthetic-estimate timing. It does not claim canonical transcript qualification
or word-locked final motion. The system font used by this private Remotion
fixture does not replace the still-required approved canonical font parity
gate.

This is Caption-owned direct appearance evidence. It does not replace:

- the shared qualified postrender visual-AI lifecycle for each output;
- independent final QA and private-review reread;
- authenticated Visual Intelligence or Track All evidence;
- one exact canonical multi-run qualification catalog covering all 41 jobs.

Provider/model calls, operation dispatch, asset mutation, credit/billing,
final-QA approval, public delivery, and production authority remain false.

## Verification

- `smoke:captions-specialist-cap-18-real-source-multi-output`: 15 source and
  adversarial assertions;
- `smoke:captions-specialist-cap-18-real-source-multi-output-runtime`: four
  actual private renders plus exact technical/golden evidence;
- `smoke:captions-specialist-cap-18-real-source-multi-output-inspection`: four
  complete-time sheets, 16 original-size checks, and six adversarial receipt
  refusals.
