# Production FFmpeg Final Export Policy

FFmpeg owns M16A preview/export muxing and transcode command plans.

Allowed export settings default to mp4, H.264/libx264, AAC, yuv420p, and faststart. Arbitrary FFmpeg args, source overwrite, signed URL sources, unsafe paths, and final delivery without QA are blocked.

Local-dev FFmpeg execution is opt-in and skip-safe. Any fixture execution must use generated temp media or approved safe local-dev artifacts only.
