# Phase 36B DeepFilterNet Artifact Policy

Artifacts are never committed to git. The only persisted source of truth after
Phase 36B is the private staging GCS prefix and committed sanitized checksum
metadata.

## Approved Artifacts

| Artifact | Source | Reason |
| --- | --- | --- |
| `deep-filter-0.5.6-x86_64-unknown-linux-musl` | Official DeepFilterNet GitHub release asset | Linux x86_64 CLI binary for future linux/amd64 generated-audio runtime verification. |
| `DeepFilterNet3_onnx.tar.gz` | Official v0.5.6 repo model tree | DeepFilterNet3 ONNX model archive for future generated-audio runtime verification. |

## Manifest Objects

The private GCS prefix must also contain:

- `file_checksums_sha256.txt`
- `model_tree_manifest.json`
- `source_evidence.json`
- `license_evidence.json`
- `download_report.json`

## Not Approved

macOS, Windows, aarch64, armv7, LADSPA, DeepFilterNet2, datasets, demos,
RNNoise, Demucs, Hugging Face snapshots, provider assets, and any unpinned
source artifact are outside Phase 36B.
