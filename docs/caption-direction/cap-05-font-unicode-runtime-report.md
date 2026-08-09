# CAP-05 — Font and Unicode Runtime Report

Status: `contract_complete_internal_runtime_gated`
Milestone: `CAP-05`
Media/font container runtime started: no
Production qualification claimed: no

## Outcome

CAP-05 adds strict, versioned contracts for:

- font-runtime qualification;
- immutable font-asset intake and license lineage;
- the approved private font registry and language/script fallback chains;
- private Caption font resolution;
- multilingual shaping fixture evidence.

The resolver performs real Unicode grapheme segmentation through the current
Node `Intl.Segmenter` surface, classifies Latin, Cyrillic, Greek, Arabic,
Hebrew, Indic, Southeast Asian, CJK, Korean, emoji, and common-script
graphemes, preserves RTL/mixed direction, and resolves ordered font fallbacks
without persisting raw text or including font bytes.

Seven source fixtures cover Latin combining marks and ligature requirements,
Arabic, Hebrew, Devanagari, Japanese, Korean, and an emoji ZWJ sequence. Their
segmentation and fallback-contract coverage passes. Missing Tamil coverage
fails closed rather than silently substituting an unrelated font.

## Canonical readiness disposition

The canonical approved registry remains intentionally empty. The committed
foundation contains useful ingredients, but they do not yet form an admitted
multilingual font runtime:

- FontTools 4.63.0 is locked inside an existing private image, but no released
  canonical font-inspection/subsetting operation exists;
- no released OpenType Sanitizer runtime exists;
- the current private libass protocol accepts ASCII only;
- actual HarfBuzz/Fribidi multilingual fixture shaping has not run through a
  Caption-qualified authority;
- exact Remotion-preview to libass-final font and metric parity is not proven.

The registry therefore exposes zero approved font assets and every canonical
route remains blocked. Eight synthetic contract-only font records are used
only to test registry/fallback semantics; they cannot open execution and are
not exported as approved font assets.

## Security and ownership

Font records require immutable byte digests, private object references,
license/source/review lineage, FontTools and OTS intake results, glyph coverage,
renderer evidence, and preview/final parity before private admission. Unknown
or nested extra fields, paths/URLs, stale digests, duplicate fallback entries,
unqualified approval, bidi override controls, runtime downloads, browser font
intake, and production claims fail closed.

CAP-05 does not modify the canonical libass, Remotion, Docker, provider,
dispatch, storage, cost, billing, public, or production owners.

## Verification

`smoke:captions-specialist-cap-05` passes 20 positive and adversarial checks.
The server typecheck and focused ESLint checks pass. No font, package, browser,
model, media, or container runtime was downloaded or started.

The FontTools, OTS, actual multilingual shaping, and preview/final parity items
remain explicit internal qualification gates. They must close before CAP-18/19
can qualify multilingual Caption rendering end to end.

## Next milestone

CAP-06 implements early strategy, opportunities, integration classification,
space reservation, blocking metadata, approval envelope, estimate factors, and
reasoned non-use/restraint.
