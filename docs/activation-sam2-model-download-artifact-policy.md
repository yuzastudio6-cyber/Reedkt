# Phase 35B SAM2 Model Artifact Policy

Phase 35B creates private staging GCS model artifacts and commits only small
metadata/report files.

## Committed Artifacts

- TypeScript approval/download evidence
- policy/report modules
- smoke tests
- markdown documentation
- checksum values and GCS object references

## Private GCS Artifacts

- `sam2.1_hiera_tiny.pt`
- `sam2.1_hiera_t.yaml`
- `file_checksums_sha256.txt`
- `model_tree_manifest.json`
- `source_evidence.json`

## Blocked Artifacts

- model files in git
- generated masks/cutouts
- generated media
- cloud credentials
- signed URLs as source of truth
- public bucket/object permissions

Temporary local model files must be stored outside the git worktree and deleted
after upload/verification unless retained for debugging a failed run.
