# Phase 36I Private Artifact Policy

Allowed private prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36i/signalsmith-stretch-generated-audio/<run-id>/`

Allowed private artifacts:
- JSON reports
- generated fixture manifests
- generated audio metric reports
- safe build logs
- optional generated input/output WAVs

Not allowed:
- real media
- controlled media
- provider logs
- secrets
- signed URLs
- public artifacts
- model files
- source archives
- build binaries

Committed reports must contain only safe metadata, hashes, object counts, and redacted summaries.
