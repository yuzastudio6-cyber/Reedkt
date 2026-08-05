# CAP-15 — Accessibility, Localization, and Export Report

Milestone: `CAP-15`

Status: `private_ascii_libass_overlay_and_direct_raster_qualified_external_export_gates_closed`

## Outcome

CAP-15 adds a Caption-owned stable accessibility and localization projection
without creating another libass runtime, FFmpeg packager, renderer, asset store,
or delivery owner. It reuses:

- `tool.libass.render_approved_caption_track.v1` for the existing bounded
  private ASS overlay fixture; and
- `tool.ffmpeg.execute_approved_media_recipe.v1` as the future packaging owner.

The new source contract produces frame-derived SRT, WebVTT, and canvas-aware
ASS text plus a byte-free private artifact set and packaging handoff. StoryTiming
remains the sole clock. The approved snapshot, confirmed output, transcript,
font, scene-group, and MasterTiming references remain explicit and fail closed.

## Output-specific composition

The source suite covers exact `1920x1080@30` and `1080x1920@30` confirmed
outputs. SRT and WebVTT timestamps are derived from integer frames, not floating
display seconds. The canvas-aware ASS v2 profile emits the exact confirmed
`PlayResX` and `PlayResY`; the older fixed `1080x1920` ASS builder is deliberately
unchanged for compatibility.

The opening phrase stays on one line for the 16:9 profile and recomposes to two
lines for 9:16. English geometry is never reused as localized geometry.
Reduced-motion presentation preserves stable wording exactly.

## Accessibility and localization evidence

The stable track retains:

- complete wording and exact source-word IDs;
- StoryTiming cue and stable-read ranges;
- evidence-bound speaker labels;
- one source-event-bound meaningful-sound description; and
- output-language, text direction, font-resolution, and translation lineage.

Contract fixtures preserve Japanese/CJK, Arabic/RTL, Hindi/Indic, combining
marks, and emoji as UTF-8 in SRT, WebVTT, and ASS source text. Those fixtures do
not promote multilingual libass execution. Until approved fonts and shaping are
qualified, their ASS disposition is
`blocked_missing_qualified_font_or_shaping` and their packaging request is
`private_sidecars_only`.

## Private libass raster evidence

The bounded clean-window proof used the existing source-bound libass 0.17.5
image with identity hash
`591f3933e79f2c3609cf32b4bea6ee4851c37dc97b0ada3475406be207a42db2`.
The confined runtime retained network-none, read-only-root, dropped-capability,
non-root execution.

| Profile | Caption | PNG SHA-256 | Alpha bounding box | Direct inspection |
| --- | --- | --- | --- | --- |
| 16:9 private proxy `640x360` | `Ideas move through the frame` | `2efdd52e81e5256ef9f187c48f032f99866fc3df1b70cd2c608843e6495b24f1` | left 148, top 307, width 345, height 29 | pass — complete, centered, unclipped, bottom-safe |
| 9:16 private proxy `360x640` | `MOVE` | `7f26148639140abf82555b262e24a3e3aa7ee72dc8bf55d159eb42f04185cd45` | left 122, top 546, width 118, height 38 | pass after repair — centered, fully legible, unclipped, bottom-safe |

Both accepted PNGs were opened and inspected directly after all libass/Docker
children exited. The first vertical attempt used the longer opening phrase. Its
technically valid output, SHA-256
`048ab957cc73ea6c64d400343abf8ebd6cf52acb76ee615210ad5ddcda083368`,
was visually rejected because its 355-pixel text box began at the left edge and
clipped on both sides. It is retained only as failed visual evidence.

The repair adds a conservative grapheme-count × font-size one-line safe-width
gate before the existing private runtime request. The clipped request now fails
before dispatch. The replacement proof explicitly selects the short stable cue
`MOVE`; it does not pretend the single-caption runtime has proven a complete
vertical track.

## Closed boundaries

- the private libass proof renders one transparent ASCII overlay frame only;
- complete caption-track execution and video burn-in remain false;
- approved multilingual fonts, real shaping, and multilingual raster parity
  remain blocked;
- FFmpeg packaging, stream metadata, technical probe, audio-sync preservation,
  final artifact persistence, and final export remain unexecuted owner gates;
- source artifact receipts contain no text bytes, local paths, signed URLs, raw
  chat, media bytes, or credentials;
- operation registration, dispatch, asset creation, final QA approval, public
  delivery, billing, and production authority remain false.

## Verification

`smoke:captions-specialist-cap-15` passes 47 source and adversarial checks. It
covers frame-time rollover, exact source lineage, target-language recomposition,
Unicode preservation, non-circular artifact-set identity, operation ownership,
closed authority, stale digests, wrong frames, counterfeit word lineage,
missing/pending translations, unsafe ASS syntax, cross-canvas artifact reuse,
unknown/inherited/cyclic input, and the visual-fit predispatch refusal.

The private runtime and one-operation repair smokes prove actual
`ass_read_memory` / `ass_render_frame` execution and transparent RGBA outputs
through the existing runtime. Server typecheck, focused lint, and diff checks
are green after the visual repair.

## Next

CAP-16 adds complete semantic-through-export deterministic QA, explicit direct
visual evidence admission, repair/fallback decisions, and independent QA
handoff. CAP-15 evidence cannot substitute for complete-time visual review or
final QA approval.
