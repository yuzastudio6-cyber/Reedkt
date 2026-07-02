# Production Transcript Artifact Policy

Transcript artifacts are private production records created from approved worker plans. They are structured data, not execution prompts.

## Artifact Types

- `transcript_json`: language, optional language confidence, normalized transcript segments, full text, source audio artifact, model info, confidence, and issues.
- `word_timestamps_json`: word-level timing records with start/end seconds, optional confidence, and segment IDs.
- `caption_segments_json`: derived caption segmentation metadata for render/QA handoff.
- `qa_report`: transcript/caption quality gate summaries when needed.

## Rules

- artifacts use `storageBucketPurpose` and `storageObjectPath`
- artifacts are private by default
- signed URLs are delivery-only and never persistent source of truth
- transcript confidence and issues travel with the artifact
- filler and repeated-take detection produce candidates only; they do not cut source content
