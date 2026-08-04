# CAP-10 — Semantic and Style System Report

Status: `contract_complete_private_font_visual_render_gated`
Milestone: `CAP-10`
Media/runtime started: no
Calibration media rendered or inspected: no
Runtime, asset, QA, canvas, delivery, or production authority promoted: no

## Outcome

CAP-10 adds a strict private semantic-style plan that joins the exact CAP-04
phrase lineage, CAP-03 style profile, CAP-05 font resolution, CAP-08 visual
occupancy, and confirmed output frame. Caption owns the bounded semantic and
typographic decision. It does not own transcript timing, font intake, visual
inference, final composition, or independent QA approval.

Each phrase retains exact source-word IDs, displayed wording, semantic/clause
roles, protected token groups, emphasis lineage, typography/color roles, font
resolution, measured line candidates, optical size, and adaptive legibility.
The plan contains no raw chat, media bytes, arbitrary CSS/ASS, or model-authored
code.

## Language-aware line breaking

Candidate selection fails closed unless it preserves:

- exact ordered source-word coverage;
- complete displayed wording modulo layout whitespace;
- protected names, claims, numbers, negations, quotations, and grapheme/emoji
  groups on one line;
- Unicode grapheme counts;
- opening/closing punctuation rules;
- platform line count and measured shaped-width limits;
- non-orphan final lines for longer phrases.

The contract fixture deliberately supplies a tempting orphan layout and proves
that the balanced two-line alternative wins. It also proves an Arabic RTL
phrase with separate Arabic/common font runs.

## Typography and legibility

Optical size is derived from the confirmed frame, viewing profile, and semantic
role. Phrase character count cannot cause size oscillation. Phone portrait,
phone square, desktop widescreen, and television widescreen profiles freeze
safe width, minimum/maximum size, line height, and line-count policy.

Typography and color roles must exist in the approved style profile and be
allowed in the exact scene. Semantic color can never be the sole meaning
carrier; emphasized source words require an approved non-color counterpart.

Adaptive legibility walks the minimum-treatment ladder:

1. no treatment;
2. shadow;
3. stroke;
4. backplate;
5. local scrim.

Only profile-approved treatments with evidence meeting the minimum contrast
may be selected. If none passes, the phrase is explicitly blocked rather than
silently degraded.

## Calibration and compatibility

`caption-style-calibration-preview-v1` plans six required cases: light, dark,
busy, protected-region pressure, multilingual fallback, and reduced-motion
counterpart. It is a render request plan, not rendered evidence. CAP-10 records
`renderedMediaRef:null`, `actualRenderedPixelsInspected:false`, and requires
deterministic, direct-raster, and independent QA after a later authorized
render.

`caption-legacy-style-adapter-v1` keeps all ten historical named presets
readable through explicit semantic mappings. `custom` fails closed without an
exact approval reference. No mutable legacy preset becomes style authority.

## Verification

`smoke:captions-specialist-cap-10` passes 27 positive and adversarial checks.
Coverage includes balanced line selection, protected groups, RTL/multi-font
resolution, semantic emphasis, optical sizing, adaptive treatment choice, six
calibration scenarios, ten legacy adapters, custom-style approval, strict
digest reread, confirmed-ratio refusal, cross-canvas refusal, unapproved role,
color-only emphasis refusal, orphan-only failure, displayed-text mutation,
no-legibility blocking, stale font evidence, and all closed authorities.

The focused smoke, server typecheck, and focused ESLint pass. Actual qualified
FontTools/OTS/HarfBuzz/Fribidi/libass/Remotion shaping parity, authenticated
visual occupancy, calibration rendering, and direct raster inspection remain
honest private-runtime gates for CAP-14/CAP-16/CAP-18.

## Next milestone

CAP-11 assembles simultaneous Caption tracks, depth planes, masks/anchors,
environmental and hero typography, persistent lists, B-roll co-composition,
accessible counterparts, and deterministic mode switching.
