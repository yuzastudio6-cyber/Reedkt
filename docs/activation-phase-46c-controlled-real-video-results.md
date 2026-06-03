# Phase 46C Controlled Real-Video Results

Results are stored under:

`docs/activation-phase-46c-controlled-real-video-media-data-suite-reports/`

The execution report records the approved sample, source checksum result,
bounded frame offsets, tool statuses, storage/privacy gates, private artifact
status, and media/data beta status.

Run `phase46c-controlled-real-video-media-data-suite-20260603` passed:

- PyAV, OpenCV, PySceneDetect, Sharp/libvips, DuckDB, and Polars passed.
- The approved source SHA-256 matched the Phase 32/37D evidence.
- Six bounded frame offsets were sampled from the `6.9s` to `8.9s` window.
- Private artifact upload passed with 51 objects under the Phase 46C QA prefix.
- The local `gcloud storage cp` helper had a CPU-architecture issue for the
  source copy, so the runner used an existing-auth `gsutil cp` private-copy
  fallback for the same approved GCS object. No signed URLs or IAM changes were
  used.

Phase 46C passing does not unlock beta or production. It only moves media/data
from generated fixture evidence to one controlled private real-video evidence
step. Phase 46D reporting/QA integration remains a separate phase.
