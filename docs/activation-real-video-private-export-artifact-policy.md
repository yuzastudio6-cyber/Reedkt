# Phase 30 Private Export Artifact Policy

Phase 30 writes private artifacts only:

- final MP4 export
- copied caption sidecars
- render manifest
- export QA report
- Phase 30 report

Final exports are stored under:

`gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase30/<runId>/`

QA and reports are stored under:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase30/<runId>/`

Generated media, captions, transcripts, and reports must not be committed to git. Signed URLs are not a source of truth.
