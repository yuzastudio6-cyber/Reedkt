# System Font Package Alternative Decision

Selected next strategy: `TRACKB_MEDIA_OSS_MILESTONE_3_SYSTEM_FONT_PACKAGE_APPROVAL`

The exact PingFang asset remains blocked, so the next gate should approve a system-font substitute instead of private asset staging. `fonts-noto-cjk` is the primary future candidate, with `fonts-noto-cjk-extra` preserved as a secondary candidate if coverage or path review requires it.

Reference inputs record Debian package metadata for `fonts-noto-cjk`, Debian OFL license text for the package, and Noto font usage/license documentation. This phase does not install packages, patch Dockerfiles, build images, run PaddleOCR/PaddlePaddle, or prove runtime configuration.

The future approval must verify exact Debian/Ubuntu package metadata, the installed font file path, the PaddleX/PaddleOCR local-font configuration, and no-network behavior before any execution phase.
