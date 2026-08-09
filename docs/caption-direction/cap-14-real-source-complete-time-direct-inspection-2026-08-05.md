# CAP-14 Real-Source Complete-Time Direct Inspection — 2026-08-05

Status: `accepted_for_caption_owned_professional_appearance`

This evidence corrects the role of the earlier bright color-bar render. The
color bars are an engineering fixture only. They demonstrate renderer timing,
layer placement, safe-area behavior, font encoding, and export mechanics. They
are not representative footage and do not qualify Caption visual appearance.

The appearance decision instead uses the real talking-head private review
proxy from the exact source artifact with SHA-256
`a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0`.
The reviewed range is 8.080–12.300 seconds. Caption wording is the existing
fixture-specific, human-reviewed phrase-level wording with
`synthetic_estimate` timing. It is not canonical transcript qualification and
does not enable word-locked motion.

## Exact reviewed outputs

| Variant | MP4 SHA-256 | Frames | Review frame |
| --- | --- | ---: | --- |
| Full motion | `200abd32615cbed07739243880ed7993998609451ad911a1bddac9e686fa939f` | 127 | 360×640 at 30 fps |
| Reduced motion | `b8b87995c9031a0221a304bd1c06bfe6beeb1c186b5818d28758fd511f606e74` | 127 | 360×640 at 30 fps |

Both outputs preserve the exact confirmed 9:16 ratio. They are one-third-scale
private review proxies for the confirmed 1080×1920 output, not a final customer
canvas claim.

## Inspection method

Every rendered frame was extracted into six ordered 5×5 contact sheets per
variant. The sheets cover frames 0–24, 25–49, 50–74, 75–99, 100–124, and
125–126, so all 127 frames in each output are represented exactly once.

Frames 0, 5, 8, 12, 21, 37, 38, 45, 80, 118, 122, and 126 were also opened at
the original 360×640 review resolution for both variants. These spot checks
cover blank lead-in, entry animation, stable holds, the cue boundary, the long
second cue, and the final exit.

The exact contact sheets and original-resolution rasters are SHA-bound and
persisted create-only beside a closed
`caption-real-source-complete-time-direct-inspection-v1` receipt. The receipt
contains no media bytes, paths, URLs, raw chat, or credentials.

## Direct visual findings

- Caption text is readable against the real footage.
- The subject's face and raised/gesturing hand remain unobstructed.
- No caption clipping, phrase overflow, or frame-edge escape was observed.
- Hero words remain visually separated from the stable accessible caption
  plate.
- Placement stays consistent through both cues.
- Entry, cue transition, and exit frames are usable; no tail truncation was
  observed.
- Reduced motion removes the scale/travel emphasis at the transition while
  retaining the same settled reading state and safe placement.

This is direct Caption-owned inspection of every rendered frame through
contact sheets plus original-resolution transition spot checks. It does not
claim uninterrupted motion playback, shared Qwen/Visual Intelligence
postrender review, independent final QA, final QA approval, public delivery,
or production readiness. Those remain separate gates.
