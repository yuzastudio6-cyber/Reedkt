# Transcript and Alignment

## One canonical transcript

All creative, accessible, translated, ASS, WebVTT, SRT, and Remotion outputs are projections of one immutable source transcript. A projection may change without deleting or rewriting source wording.

Every displayed phrase references:

- transcript segment IDs;
- source word IDs in order;
- source start/end evidence;
- per-word confidence where available;
- timestamp provenance;
- speaker/overlap evidence where applicable;
- every text transformation.

Allowed transformation kinds:

- `exact`
- `punctuation_cleanup`
- `filler_omission`
- `condensed_without_meaning_change`
- `translated`
- `paraphrase_requires_approval`

## Review-sensitive text

Names, organizations, numbers, prices, dates, metrics, quotations, allegations, claim-sensitive wording, and low-confidence words require explicit review behavior. Uncertain speakers use neutral labels; Caption Direction must not infer an identity and present it as fact.

## Timing provenance

Suggested levels:

- `source_model_word_timestamp`
- `qualified_forced_alignment`
- `manual_verified`
- `segment_interpolated`
- `synthetic_preview_only`
- `unknown`

Only the first three may satisfy final word-locked motion, subject to confidence and QA. Segment interpolation and even distribution may drive blocking previews or phrase-level fallback but never be relabeled as measured word timing.

## Alignment and diarization

The current faster-whisper worker foundation is reused. WhisperX and pyannote remain candidates requiring tool, model-weight, license, privacy, performance, and deployment qualification. Their outputs are evidence artifacts, not transcript authorities by themselves.

Forced alignment failure routes:

1. phrase-level stable captions if segment timing is trustworthy;
2. manual review for required word choreography;
3. removal of word-locked motion;
4. never silent synthesis of final timestamps.

Overlapping dialogue routes:

- distinct speaker tracks only when diarization confidence supports them;
- neutral `Speaker 1`/`Speaker 2` labels where identity is unknown;
- single stable accessible projection when overlap cannot be resolved safely;
- review for meaning-sensitive overlap.

## Artifact integrity

Transcript and alignment artifacts require immutable hashes, model/tool manifest references, language, media-generation identity, job/idempotency lineage, and private storage references. No runtime model download is permitted; approved images contain pinned, verified weights.
