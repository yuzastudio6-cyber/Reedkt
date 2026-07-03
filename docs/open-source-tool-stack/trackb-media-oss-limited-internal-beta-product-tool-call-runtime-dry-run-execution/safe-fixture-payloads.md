# Safe Fixture Payloads

This dry-run records 16 safe fixture payload shapes, one for each Track B owned tool. Every payload carries an approved snapshot ID, edit plan ID, idempotency key, credit reservation ID, private source-of-truth artifact reference, result schema version, QA gate linkage, and fallback policy ID.

All payloads are `dryRunOnly: true` and `executionEnabled: false`. The storage object paths are private metadata paths, not public URLs or signed URLs. No user media is selected by default, and no real tools are invoked.

The payload set preserves the deterministic routing classes from the callable worker contract: source introspection, structured metadata analysis, image/color analysis, image-processing fallback, video-frame analysis, OCR text analysis, and media-transform high risk.
