# Caption/B-roll technical fixture layer-order correction — 2026-08-06

Status: `accepted_as_technical_integration_evidence_only`

## Outcome

The synthetic color-bar render is an engineering fixture, not a proposed
Caption style. It proves the bounded B-roll owner read, exact geometry/timing
handoff, libass overlay, Remotion composition, Caption-above-B-roll ordering,
clipping safety, and deterministic export path.

Direct inspection exposed two execution defects:

1. the Remotion worker validated `sourceMediaPolicy` and `brollPreviewLayer`
   but omitted both from the final composition payload;
2. once the B-roll layer reached Remotion, it could cover the Caption overlay
   because the Caption layer had no explicit stacking order.

The correction forwards both fields, fixes Caption above the B-roll proxy, and
adds a persistent `Technical QA preview · not final Caption design` label to
this fixture class. The label is not rendered for normal customer compositions.

## Direct raster evidence

The corrected 72-frame 640×360 sequence and its complete-time contact sheet
were inspected after all render children exited. Frames 0, 35, and 71 were also
inspected at original size.

- inspection package SHA-256:
  `88f40c4cd9fe212ba4bff7f987206085ada38fd079812a925ef75cd8952bc26a`
- preview SHA-256:
  `221cabb47d8f443bc3c74f50afa9aecf97a2ee6df57742616b7ba4c44b882b7a`
- Caption overlay SHA-256:
  `1b95b31a63bd245731ebd0c0b56bfc1a7d2a6efd15c24fee26f0f669c293396d`
- contact-sheet SHA-256:
  `476870e518d720a143e3403e0249df8aa20a84429b615051302a035ad185a28d`
- direct-inspection receipt SHA-256:
  `c156c2ea73439886ed363271ce5b4607c90bcfe46e4fb6b271b8d48da7ec6c46`
- canonical owner runtime receipt SHA-256:
  `79a1589877bd6c02d3c3e0658ba05d9b504013cb339d197fc651d021759121b6`

The inspection accepted Caption visibility, complete-time label visibility,
Caption-above-B-roll ordering, and no clipping/collision. It explicitly sets
`professionalCaptionAppearanceQualified: false`.

## Boundary

This evidence cannot satisfy Caption professional appearance, shared qualified
postrender visual AI, independent final QA, public delivery, or production
readiness. Professional appearance continues to use the separate real
talking-head full/reduced renders and their direct-inspection receipts.
