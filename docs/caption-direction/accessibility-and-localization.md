# Accessibility and Localization

## Required projections

Depending on the approved output, Caption Direction can produce:

- creative open-caption projection;
- stable accessible open-caption projection;
- SRT;
- WebVTT;
- controlled ASS;
- translated accessible sidecars;
- reduced-motion creative projection.

Every projection derives from the canonical transcript and preserves lineage. Creative condensation or occlusion never removes the complete accessible wording from required deliverables.

## Accessibility contract

- stable reading duration uses actually readable frames;
- contrast is tested against rendered frames, not color tokens alone;
- color is not the only semantic indicator;
- speakers are identified neutrally when required and supported by evidence;
- meaningful non-speech audio may be represented according to delivery policy;
- safe-zone/crop/platform UI conflicts are validated per output;
- reduced-motion output preserves meaning and hierarchy;
- accessibility tracks do not depend on intentional occlusion or kinetic word timing.

## Localization

Translation records reference source phrases/words, language, locale, translator/model/tool provenance, confidence, glossary version, and review status. Recomposition is output- and language-specific; text is never forced into source-language geometry.

Required layout support includes:

- RTL direction and bidi behavior;
- CJK breaking;
- Indic shaping;
- combining marks;
- grapheme clusters and emoji sequences;
- locale-aware numbers, dates, currency, punctuation, and speaker labels;
- font fallback with verified glyph coverage.

Translated claim-sensitive text requires review. Accessible sidecars and open captions must not silently diverge in meaning.

## Delivery validation

Validate text coverage, timing monotonicity, cue overlap, encoding, language tags, speaker labels, Unicode integrity, glyph availability, mux/package presence, and parity with the approved projection. A Remotion failure may fall back to stable libass only if the approval envelope allows the creative downgrade and accessible completeness is preserved.
