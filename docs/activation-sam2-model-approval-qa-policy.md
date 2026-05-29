# Phase 35A SAM2 QA Policy

Phase 35A defines QA requirements for future SAM2 phases. It does not run SAM2
or process media.

## Future Runtime QA

Phase 35C must prove:

- approved checkpoint loads from private storage
- checksum verification passes
- no runtime model download occurs
- generated/synthetic fixture tracking completes
- private QA artifacts are emitted

## Future Temporal Mask QA

Phase 35D must check:

- temporal mask drift
- identity/object tracking drift
- occlusion failures
- edge flicker
- hair/fine-detail instability
- fast motion instability
- masks bleeding across objects
- privacy and subject-extraction handling

## Future Text-Behind-Subject QA

Phase 35E may proceed only after temporal mask QA passes. Preview QA must check
for shimmer, clipping, subject overlap, text readability, frame safety, and
private artifact handling.
