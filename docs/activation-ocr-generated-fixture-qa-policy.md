# OCR Generated Fixture QA Policy

Phase 37C fixtures are deterministic generated images, not user media or real videos. They exist only to verify safe loading and basic OCR behavior for future caption safe-zone planning.

Required fixtures:

- `basic-ui-text` checks straightforward high-contrast UI text.
- `caption-safe-zone-conflict` checks detection of text inside a lower caption conflict zone.
- `multi-region-ui` checks detection across multiple broad frame regions.

Warning fixtures:

- `low-contrast-warning` records low-contrast recall and confidence.
- `small-text-warning` records small-text recall and confidence.
- `rotated-text-blocked-or-warning` remains skipped/warning while `PP-LCNet_x1_0_textline_ori` is deferred.

QA is broad-region based by design. Phase 37C is not a pixel-perfect layout engine, caption renderer, or real-video OCR approval. It feeds Phase 37D planning only after required generated fixtures pass.
