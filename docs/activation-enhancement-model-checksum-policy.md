# Activation Enhancement Model Checksum Policy

Phase 34B records checksum evidence for the approved `RealESRGAN_x4plus.pth` file.

Required artifacts:

- `file_checksums_sha256.txt`
- `model_tree_manifest.json`
- committed metadata in the Phase 34B evidence record

The primary model checksum is the SHA-256 of `RealESRGAN_x4plus.pth`. The aggregate checksum is the SHA-256 of the sorted checksum manifest content using sanitized relative paths.

Checksums must not include sensitive local absolute paths. The `.pth` file must not be imported, loaded, or executed in Phase 34B.

If the downloaded file is missing, empty, has the wrong extension, has the wrong name, or is not the only model weight file, Phase 34B must stop blocked.
