# Depth Composition Credit Policy

## Purpose

Depth-aware layouts can require more planning, future worker processing, QA, and fallback work. Credit estimates should reflect that complexity without making Basic feel low quality. Basic remains professional with safer lower-compute layout choices.

## Complexity Levels

- `none`: no extra depth composition.
- `simple`: normal overlay, lower panel, side-by-side, or full visual takeover with no masking and low/no extra planning.
- `moderate`: subject mask, low-risk foreground preservation, or simple object-safe overlay with medium planning and QA.
- `advanced`: subject plus contact-object mask, hero-object mask, object-anchored callout, or medium/high planning and QA.
- `premium`: multi-object mask, subject plus contact object plus hero object, tracking required, full cutout composition, manual review recommended, and premium planning/fallback.

## Credit Behavior By Tier

Basic should usually stay at `none` or `simple`. If the user requests a complex effect, ReeditPro should show a safer lower-cost fallback instead of hiding premium mask complexity inside Basic.

Pro can include moderate and some advanced depth planning when useful. The credit estimate should include depth-aware layout planning and fallback layout should be required.

Premium can include advanced and premium depth planning with stronger QA, fallback, and manual review allowance.

## Lower-Cost Alternatives

- Use a lower visual panel instead of masked overlay.
- Use side-by-side instead of map/card behind subject.
- Use full visual takeover instead of foreground-aware overlay.
- Preserve only the person, not the contact object.
- Use a static card instead of animated map/card behind subject.
- Remove object tracking.
- Simplify label density.
- Use a Basic/Pro-safe layout.

## User-Facing Explanation

The credit card should explain:

- This effect costs more because it plans foreground/contact-object preservation and fallback QA.
- No real mask processing runs in this demo.
- Changing to a lower panel or side-by-side layout can reduce complexity.
- Basic remains professional with safer layout choices.

## Non-Goals

No real billing, credit deduction, mask processing, segmentation, tracking, worker execution, provider API call, or render job is implemented by this policy.
