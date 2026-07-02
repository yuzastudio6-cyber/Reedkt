# Production Caption QA Policy

Caption QA prepares blocking gate records that later preview/render/export workers must respect.

## Gate Types

- `caption_readability`: line length, words per second, duration, max lines, contrast placeholder, safe margin, and rapid caption changes.
- `caption_timing`: negative timestamps, end-before-start, overlaps, gaps, mid-word split risk, and duration.
- `caption_safe_zone`: caption placement against safe-zone, face, OCR, and no-cover metadata when available.
- `transcript_alignment`: caption segments must retain word timestamp references and preserve speech timing.

## Blocking Behavior

Milestone 7 can mark QA gates as blocking and can set `blocksPreview` or `blocksFinalExport`. Later preview/export workers must not bypass these gates.

When face/OCR/safe-zone analysis has not run yet, the safe-zone policy returns warnings instead of pretending real analysis exists.
