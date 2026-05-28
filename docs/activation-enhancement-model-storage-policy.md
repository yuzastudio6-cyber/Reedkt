# Activation Enhancement Model Storage Policy

Approved staging enhancement model weights must be stored only in private staging model-weight storage:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/`

Model files must not be committed to git, baked into frontend code, stored in the source-media bucket, made public, or treated as available through signed URLs as the source of truth.

Phase 34A does not create or upload model files. The Real-ESRGAN checksum remains `missing_until_download` until Phase 34B records the downloaded file inventory, checksum, size, source, and private GCS verification.

FILM's future evaluated-only storage path is:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/style/`

That path is documentation only in Phase 34A. FILM download and execution remain blocked.
