# Synthetic Fixture Proof Policy

Decision: `trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution`

Future proofs must use tiny synthetic fixtures only and commit only safe metadata, counts, hashes, or summaries. Real user media, public artifacts, signed URLs, render/export, decode/encode, and broad media processing remain blocked.

- ExifTool: tiny synthetic metadata-safe fixture read/write/read proof, or read-only metadata proof if write is unnecessary.
- MediaInfo: tiny synthetic safe media/container header fixture only.
- Tesseract: tiny synthetic image containing REEDITPRO text.
- ImageMagick: tiny synthetic identify/convert transform proof.
