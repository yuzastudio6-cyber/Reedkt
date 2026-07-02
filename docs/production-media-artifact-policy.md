# Production Media Artifact Policy

Milestone 6 media foundation artifacts are private, source-of-truth storage references. Signed URLs may be generated later as temporary access mechanisms, but they are never the persistent source of truth.

## Source Media

Source media is immutable. Workers must never overwrite source media. Any proxy, extracted audio, keyframe, representative frame, report, or temp artifact is written to a separate output path under an approved safe root or private bucket purpose.

## Bucket Purposes

- `source_media`: original uploaded media only.
- `proxy_media`: generated proxy video.
- `analysis_artifacts`: extracted audio, frames, probe summaries, and partial analysis reports.
- `worker_temp`: local/dev temporary files before promotion.
- `qa_artifacts`: later QA reports and checks.

Other Milestone 1 bucket purposes remain reserved for later transcript, mask, generated asset, preview, and final export milestones.

## Persistence Rules

Artifact records must include `storageBucketPurpose`, `storageObjectPath`, `isPrivate: true`, and `sourceOfTruth: true`. They must not include raw URLs, signed URLs, service-role keys, provider keys, raw prompt fields, or local absolute paths as durable storage truth.
