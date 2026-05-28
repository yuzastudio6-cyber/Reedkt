# Activation Model Checksum Policy

Phase 26B requires checksum evidence before model availability can count toward
Phase 28 planning.

Required evidence:

- resolved model revision
- sanitized file list
- per-file SHA-256 checksums
- total file count
- total size in bytes
- aggregate SHA-256 over sorted file checksum lines
- GCS paths for `file_checksums_sha256.txt` and `model_tree_manifest.json`

Local absolute temp paths must not be committed. Model files must not be
committed. Checksums do not approve production or external beta.
