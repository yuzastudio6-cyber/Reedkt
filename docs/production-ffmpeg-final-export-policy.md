# Production FFmpeg Final Export Policy

FFmpeg owns M16A preview/export muxing and transcode command plans.

Allowed export settings default to mp4, H.264/libx264, AAC, yuv420p, and faststart. Arbitrary FFmpeg args, source overwrite, signed URL sources, unsafe paths, and final delivery without QA are blocked.

Final export selects the immutable source master before the analysis proxy. Local final export fails closed when only a proxy is available. If the approved output dimensions exceed the source dimensions, the result carries a disclosure that a larger container does not restore source detail unless a separately approved enhancement lineage exists.

The allowed professional profiles are exact 1080p, 2K/1440p, and 4K dimensions for the confirmed 16:9, 9:16, 1:1, 4:5, or 4:3 frame. The selected profile must be covered by the 4K ceiling already included in the approved edit estimate and bound to the same reservation.

Local-dev FFmpeg execution is opt-in and skip-safe. Any fixture execution must use generated temp media or approved safe local-dev artifacts only.
