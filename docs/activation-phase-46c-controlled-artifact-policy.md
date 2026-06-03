# Phase 46C Controlled Artifact Policy

Phase 46C may create media-derived artifacts only inside the temporary runtime
directory and private QA artifact prefix.

Do not commit:

- controlled source video copies
- sampled frames
- private thumbnails
- bounded clip files
- temp Python virtualenvs
- temp Sharp installs
- package caches
- private logs
- secrets or credentials

Committed report manifests may include hashes, sizes, relative private artifact
paths, object counts, tool versions, and redacted summaries.
