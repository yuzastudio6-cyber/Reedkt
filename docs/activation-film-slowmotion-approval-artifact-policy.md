# Phase 38A FILM Artifact Policy

Phase 38A creates only code, docs, and static report metadata.

It must not create or commit:

- FILM weights or SavedModel directories
- generated frames, interpolated frames, videos, previews, or QA artifacts
- private GCS reports
- Docker outputs
- GCP logs
- credentials, secrets, signed URLs, or public URLs as source of truth

Future Phase 38B may download only the approved official FILM artifact tree into temporary storage outside the repository, compute checksums, and upload the artifacts plus manifests to private staging GCS under:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/<model-or-version>/`

No model files may be committed to git.
