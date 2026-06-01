# VLM Checksum Verification Policy

Every selected Phase 39B file must have a local SHA256 computed from downloaded bytes. The checksum manifest must include relative path, role, required status, expected size, actual size, SHA256, source revision, and destination private GCS object path.

The aggregate SHA256 is computed from sorted `relativePath sha256 sizeBytes` entries. GCS object metadata does not provide SHA256, so Phase 39B records GCS generation, metageneration, CRC32C, MD5 when available, object size, and the local SHA256 from the checksum manifest.

Any missing file, empty file, size mismatch, checksum failure, partial download, upload failure, or object verification failure keeps Phase 39B incomplete and keeps Phase 39C blocked.
