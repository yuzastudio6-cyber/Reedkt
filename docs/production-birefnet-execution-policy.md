# Production BiRefNet Execution Policy

BiRefNet is the preferred foreground extraction/background-removal candidate for still-image cutouts and the first video-mask stage.

Production execution requires an approved `birefnet_model` manifest. Code/package license approval does not approve checkpoint use. Unknown, non-commercial, missing, or `needs_review` weights block production.

Local-dev execution is skip-safe: it may run only when explicitly enabled, the tool is already installed, a local model path already exists, source paths are safe, and no download is attempted.
