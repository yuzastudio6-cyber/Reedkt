# Depth-Aware Layout Validation

## Purpose

Depth-aware overlays can make ReeditPro edits feel premium, but they are risky when they cover faces, hide labels, create weak mask edges, or push captions into unsafe zones. This validation layer checks the structured plan before approval so the editor can decide whether the effect is worth the complexity.

The validator checks whether depth-aware composition is useful, whether foreground subject or contact-object preservation is needed, whether the mask strategy fits the tier, whether fallback layout exists, whether captions stay safe, whether graphics remain readable, whether extra credit impact is justified, and whether the plan should downgrade to a safer layout.

## What Gets Validated

- Speaker/visual layout mode.
- Depth compositing mode.
- Mask strategy and risk level.
- Foreground object and contact-object plan.
- Foreground depth group.
- Map, chart, browser, card, and graphic readability.
- Caption safe zone and top-layer rules.
- Layer order.
- Fallback layout.
- Tier compatibility.
- Credit impact.
- QA checks and future worker requirements.

## Common Risks

- Face covered by a graphic.
- Caption collision.
- Map, chart, card, or browser text hidden by the subject.
- Contact object not preserved.
- Mask edge jitter.
- Thin object masking difficulty.
- Foreground object too small or thin.
- Busy background.
- Camera movement.
- Subject motion.
- Too much visual clutter.
- Layout does not fit the aspect ratio.
- No fallback layout.
- Basic plan too complex.
- Pro plan missing fallback.
- Premium plan missing manual review notes for high risk.

## Validation Status

- `passed`: plan is safe enough for the tier and has QA/fallback coverage.
- `warning`: plan can proceed in mock, but should show caution.
- `failed`: plan is not good enough and should use fallback or require revision.
- `blocking`: plan violates a hard rule, such as Basic using premium mask strategy, missing fallback for high-risk mask, or captions not being protected.

## Tier Validation

Basic should use safe panels, side-by-side layouts, full visual takeovers, or simple overlays. Complex subject/contact masks should be blocked or downgraded. Low-risk subject masks may be warning-level only when static and simple. Premium mask credit must not be hidden inside Basic.

Pro can plan subject masks and subject plus contact-object masks when low or medium risk. High risk requires fallback and a warning. Pro must include fallback layout and must not use Veo.

Premium can plan multi-object masks and high-risk depth overlays. Premium must include stronger QA, manual review notes, and fallback. Depth composition still does not enable default Veo because this is compositing/masking planning, not AI-video fallback.

## Fallback Layout Policy

Every medium, high, or premium risk depth-aware overlay should have fallback.

Examples:

- Map behind subject -> `side_by_side_speaker_visual`.
- Map behind subject plus pole -> `lower_visual_panel` or `side_by_side_speaker_visual`.
- Object anchored callout -> `lower_visual_panel` or simple callout.
- Speaker cutout overlay -> `picture_in_picture_speaker`.
- Masked panel behind subject -> `lower_visual_panel`.
- Full cutout composition -> `full_speaker` or `side_by_side_speaker_visual`.

## Caption And Graphic Readability

Captions must remain the top layer and must not sit behind masks. Graphic text, map labels, route pins, chart labels, diagram labels, and browser capture text must not sit under the planned foreground subject or contact object. If readability is risky, ReeditPro should switch layout, reduce label density, or use a lower-cost panel.

## Contact Object Validation

When a plan uses `graphic_behind_subject_and_contact_objects`, at least one contact object should be planned. The contact object should have `preserveInFrontOfOverlay: true`, a relationship to the subject when possible, mask difficulty, tracking requirement, fallback-if-mask-fails text, and QA checks for contact-object preservation.

## No Real Execution

This validation is mock/planning only. It does not inspect pixels, generate masks, run object detection, run tracking, execute OpenCV, execute FFmpeg, run collision detection, or render Remotion. It checks structured plans only.
