# Activation Mask Model Checksum Policy

Phase 33B model evidence must include per-file SHA-256 checksums and an aggregate
SHA-256 built from the sorted relative-path checksum manifest.

Required files uploaded with the model snapshot:

- `file_checksums_sha256.txt`
- `model_tree_manifest.json`

The tree manifest records:

- resolved revision
- file count
- total bytes
- README/license files
- config files
- Python/custom-code files
- safetensors/bin model files
- tokenizer-like files, if present

Local absolute paths are not committed to docs. Reports use sanitized temp paths.
