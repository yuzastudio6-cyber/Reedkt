# Phase 36K Demucs Decision Record

Decision: `blocked_pending_training_data_provenance`.

Code/package evidence:
- MIT source and package evidence exists.
- PyPI package metadata exists for Demucs 4.0.1.

Blocking evidence:
- pretrained weights are not approved by MIT code license alone
- MUSDB-HQ terms require human/legal review
- extra 800-song and internal Meta-song training sets are unresolved
- exact model artifact source and checksum policy are not approved

Phase 36L is not eligible. A future audio/timing beta gate may consider Demucs deferred only if a human/product decision explicitly excludes source separation from the current restricted internal scope.
