# TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION

Implement the future packaging execution approved by `trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution`.

Allowed future target: `docker/prod/cpu-worker/Dockerfile`.

Approved future package commands:

```bash
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends libimage-exiftool-perl mediainfo tesseract-ocr tesseract-ocr-eng imagemagick
rm -rf /var/lib/apt/lists/*
```

After packaging, run only bounded version checks and tiny synthetic fixture proofs for ExifTool, MediaInfo, Tesseract, and ImageMagick. GraphicsMagick remains optional fallback only. Do not use real user media, public artifacts, signed URLs, Supabase/GCS, beta, production, or broad media/render execution.
