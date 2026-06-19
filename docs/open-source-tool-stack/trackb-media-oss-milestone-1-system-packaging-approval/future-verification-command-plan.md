# Future Verification Command Plan

Decision: `trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution`

Approved future verification commands only:

- `exiftool -ver`
- `mediainfo --Version`
- `tesseract --version`
- `magick -version or convert -version, depending installed ImageMagick binary availability`

Optional fallback: `gm version` only if ImageMagick is unsuitable or later policy selects GraphicsMagick. No verification commands ran in this phase.
