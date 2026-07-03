# Future Install Command Plan

Decision: `trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution`

Approved future command sequence for a separate execution PR:

```bash
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends libimage-exiftool-perl mediainfo tesseract-ocr tesseract-ocr-eng imagemagick
rm -rf /var/lib/apt/lists/*
```

This phase does not run those commands, patch Dockerfiles, or build images.
