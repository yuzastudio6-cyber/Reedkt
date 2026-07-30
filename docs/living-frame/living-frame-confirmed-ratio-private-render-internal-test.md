# Living Frame Confirmed-Ratio Private Render Internal Test

Status: verified private/internal runtime evidence

Entrypoint:
`npm run smoke:living-frame-confirmed-ratio-private-render`

Implementation:
`server/smoke/living-frame-confirmed-ratio-private-render-smoke.ts`

## Purpose

This test closes the renderer-side gap between confirmed frame planning and
actual Living Frame composition. It proves that private Living Frame renders do
not silently substitute the existing 640×360 review canvas or a square canvas
when the approved output frame is portrait or custom.

The existing full-frame controlled-image ratio extension remains the planning
authority for generated source/background units. This test does not replace or
promote that extension. It verifies the downstream Remotion behavior using
server-derived, digest-bound frame inputs.

## Actual scenarios

The test executes two real private Remotion renders:

| Scenario | Confirmed class | Private review frame | Frames |
| --- | --- | --- | --- |
| Portrait | `portrait_9_16` | 360×640 | 30 |
| Custom | `custom_or_other_confirmed_ratio` | 480×600 | 30 |

The 16:9 path is already exercised by the five-mode 640×360 render and the
selected-scene particle path. Together, the private runtime evidence now covers
confirmed 16:9, 9:16, and custom non-square frames.

## Assertions

For each scenario the test:

- creates source, caption, and Living Frame RGBA inputs at the exact confirmed
  private-review dimensions;
- binds the confirmed-frame digest into the canonical motion source lineage;
- executes an in-frame panel → full expansion → return sequence;
- persists the result through canonical private Remotion artifact storage;
- reopens and re-hashes every persisted byte;
- decodes early, expanded, and restored frames;
- measures expanded and restored visual area;
- verifies caption priority throughout;
- runs FFprobe against the stored MP4; and
- requires exact width, height, 30/1 FPS, and 30-frame duration.

No square substitution is accepted. ComfyUI remains a source-asset candidate
and never becomes the final-canvas owner.

## Authority boundary

This evidence grants private internal testing only. It does not grant provider
dispatch, customer billing, public delivery, cloud deployment, registry
promotion, or production authority.
